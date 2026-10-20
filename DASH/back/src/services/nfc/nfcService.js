import crypto from "node:crypto";
import PhysicalCard from "../../models/PhysicalCard.js";
import NfcSecurity from "../../models/NfcSecurity.js";
import CardActivityLog from "../../models/CardActivityLog.js";
import { generateUniqueNfcCredentials, encryptCredentials, decryptCredentials } from "./nfcCrypto.js";
import { getNfcAdapter } from "./nfcAdapterFactory.js";
import _env from "../../config/env.js";

const { env } = _env;

// Ephemeral memory cache for active provisioning sessions (token -> session info, 10-minute expiry)
const activeSessions = new Map();

/**
 * Initializes and persists isolated NFC Security credentials for a PhysicalCard.
 */
export async function initializeNfcSecurityForCard(card, chipType = "NTAG215", actorId = "system") {
  // Generate credentials matching cardPassword
  const credentials = generateUniqueNfcCredentials(chipType, card.cardId, card.publicId, card.cardPassword);
  const encryptedPayload = encryptCredentials(credentials, 1);

  const nfcSec = await NfcSecurity.create({
    cardId: card._id,
    nfcChipType: chipType,
    nfcProtectionStatus: "pending_setup",
    nfcCredentialEncrypted: encryptedPayload.encrypted,
    nfcCredentialIv: encryptedPayload.iv,
    nfcCredentialTag: encryptedPayload.tag,
    nfcCredentialVersion: 1,
    keyDerivationMethod: "random-aes256",
  });

  // Link security ID to the physical card
  card.nfcSecurityId = nfcSec._id;
  await card.save();

  return nfcSec;
}

/**
 * Initiates an NFC provisioning session.
 * Generates an ephemeral session token and configuration instructions.
 */
export async function createProvisioningSession(cardId, actorId = "admin", clientIp = "") {
  const card = await PhysicalCard.findById(cardId);
  if (!card) throw new Error("Physical card not found");

  if (card.status === "disabled") {
    throw new Error("Cannot provision a disabled card");
  }

  let nfcSec = await NfcSecurity.findOne({ cardId: card._id });
  if (!nfcSec) {
    nfcSec = await initializeNfcSecurityForCard(card, "NTAG215", actorId);
  }

  const baseUrl = env?.APP_URL ? env.APP_URL.replace(/\/+$/, "") : "https://thenith.com";
  const staticUrl = `${baseUrl}/c/${card.publicId}`;

  const adapter = getNfcAdapter(nfcSec.nfcChipType, false);
  const plan = adapter.buildProvisioningPlan({ staticUrl, cardPassword: card.cardPassword });

  // Generate ephemeral 10-minute session token
  const sessionToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;

  activeSessions.set(sessionToken, {
    cardId: String(card._id),
    publicId: card.publicId,
    staticUrl,
    cardPassword: card.cardPassword,
    chipType: nfcSec.nfcChipType,
    expiresAt,
    actorId,
  });

  // Clean expired sessions
  for (const [token, data] of activeSessions.entries()) {
    if (data.expiresAt < Date.now()) activeSessions.delete(token);
  }

  // Update operation status
  nfcSec.nfcLastOperationStatus = "pending";
  nfcSec.nfcLastOperationAt = new Date();
  nfcSec.nfcLastOperationError = null;
  await nfcSec.save();

  await CardActivityLog.create({
    cardId: card._id,
    action: "NFC_PROVISION_INITIATED",
    actorType: "admin",
    actorId: String(actorId),
    actorIp: clientIp,
    status: "info",
    message: `NFC provisioning session started for chip type ${nfcSec.nfcChipType}`,
    safeMetadata: {
      chipType: nfcSec.nfcChipType,
      publicId: card.publicId,
      expiresAt: new Date(expiresAt).toISOString(),
    },
  });

  return {
    sessionToken,
    expiresAt: new Date(expiresAt).toISOString(),
    cardId: card.cardId,
    publicId: card.publicId,
    cardPassword: card.cardPassword,
    staticUrl,
    chipType: nfcSec.nfcChipType,
    provisioningPlan: plan,
  };
}

/**
 * Verifies hardware result and confirms write + protection status.
 */
export async function verifyProvisioningResult({ cardId, verificationData, actorId = "admin", clientIp = "" }) {
  const card = await PhysicalCard.findById(cardId);
  if (!card) throw new Error("Physical card not found");

  const nfcSec = await NfcSecurity.findOne({ cardId: card._id });
  if (!nfcSec) throw new Error("NFC Security record not found for this card");

  const baseUrl = env?.APP_URL ? env.APP_URL.replace(/\/+$/, "") : "https://thenith.com";
  const expectedUrl = `${baseUrl}/c/${card.publicId}`;

  const isMock = Boolean(verificationData?.simulated);
  const adapter = getNfcAdapter(nfcSec.nfcChipType, isMock);
  const result = adapter.verifyResult(verificationData, expectedUrl);

  if (!result.valid) {
    nfcSec.nfcProtectionStatus = "error";
    nfcSec.nfcLastOperationStatus = "failed";
    nfcSec.nfcLastOperationAt = new Date();
    nfcSec.nfcLastOperationError = result.error || "Verification failed";
    await nfcSec.save();

    await CardActivityLog.create({
      cardId: card._id,
      action: "NFC_PROVISION_FAILED",
      actorType: "admin",
      actorId: String(actorId),
      actorIp: clientIp,
      status: "failure",
      message: `NFC verification failed: ${result.error}`,
      safeMetadata: {
        chipType: nfcSec.nfcChipType,
        error: result.error,
      },
    });

    return {
      success: false,
      protectionStatus: nfcSec.nfcProtectionStatus,
      error: result.error,
    };
  }

  // Verification succeeded!
  nfcSec.nfcProtectionStatus = result.status || "locked";
  nfcSec.nfcLastOperationStatus = "success";
  nfcSec.nfcLastOperationAt = new Date();
  nfcSec.nfcLastOperationError = null;
  nfcSec.nfcProvisionedAt = nfcSec.nfcProvisionedAt || new Date();
  nfcSec.nfcLastVerifiedAt = new Date();
  if (result.hardwareUid) {
    nfcSec.hardwareUid = result.hardwareUid;
  }
  await nfcSec.save();

  await CardActivityLog.create({
    cardId: card._id,
    action: isMock ? "NFC_SIMULATED_TEST" : "NFC_PROVISION_VERIFIED",
    actorType: "admin",
    actorId: String(actorId),
    actorIp: clientIp,
    status: "success",
    message: isMock
      ? "NFC Simulated verification executed successfully (Software test only)"
      : "NFC hardware write and lock protection verified successfully",
    safeMetadata: {
      chipType: nfcSec.nfcChipType,
      protectionStatus: nfcSec.nfcProtectionStatus,
      hardwareUid: nfcSec.hardwareUid,
      simulated: isMock,
    },
  });

  return {
    success: true,
    protectionStatus: nfcSec.nfcProtectionStatus,
    nfcLastVerifiedAt: nfcSec.nfcLastVerifiedAt,
    hardwareUid: nfcSec.hardwareUid,
    isSimulated: isMock,
  };
}

/**
 * Performs a simulated NFC write & lock test for automated testing or when physical reader is not attached.
 */
export async function simulateTestProvisioning(cardId, actorId = "admin", clientIp = "") {
  const card = await PhysicalCard.findById(cardId);
  if (!card) throw new Error("Card not found");

  const baseUrl = env?.APP_URL ? env.APP_URL.replace(/\/+$/, "") : "https://thenith.com";
  const expectedUrl = `${baseUrl}/c/${card.publicId}`;

  const mockAdapter = getNfcAdapter("NTAG215", true);
  const simulatedData = mockAdapter.simulateSuccessfulWriteAndLock({ expectedUrl });

  return verifyProvisioningResult({
    cardId,
    verificationData: simulatedData,
    actorId,
    clientIp,
  });
}

export default {
  initializeNfcSecurityForCard,
  createProvisioningSession,
  verifyProvisioningResult,
  simulateTestProvisioning,
};
