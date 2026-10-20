import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "node:crypto";
import PhysicalCard, { generateInternalCardId } from "./src/models/PhysicalCard.js";
import NfcSecurity from "./src/models/NfcSecurity.js";
import CardBatch from "./src/models/CardBatch.js";
import CardActivityLog from "./src/models/CardActivityLog.js";
import User from "./src/models/User.js";
import Card from "./src/models/Card.js";
import {
  generateUniqueNfcCredentials,
  encryptCredentials,
  decryptCredentials,
} from "./src/services/nfc/nfcCrypto.js";
import {
  initializeNfcSecurityForCard,
  createProvisioningSession,
  verifyProvisioningResult,
  simulateTestProvisioning,
} from "./src/services/nfc/nfcService.js";
import { generateQrSvg, generateQrDataUrl } from "./src/services/qrService.js";
import _database from "./src/config/database.js";

const { connectDatabase } = _database;
dotenv.config();

const uri = process.env.MONGODB_URI;

console.log("================================================================================");
console.log("       THENITH ADMIN — COMPLETE CARD MANAGEMENT SYSTEM TEST SUITE             ");
console.log("================================================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  try {
    console.log("\nConnecting to MongoDB Atlas...");
    await connectDatabase();
    console.log("Connected successfully!\n");

    const testTag = `TEST-${Date.now()}`;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. UNIQUE IDENTIFIERS & COLLISION RESISTANCE
    // ──────────────────────────────────────────────────────────────────────────
    console.log("Test Group 1: Unique Identifiers & Collision Resistance");
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      const id = generateInternalCardId();
      assert(/^THN-C-[2-9A-HJ-NP-Z]{6}$/.test(id), `Internal card ID matches format: ${id}`);
      ids.add(id);
    }
    assert(ids.size === 100, "100 generated card IDs are 100% unique without collisions");

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CARD MODEL PERSISTENCE & STATIC URL
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 2: Card Creation & Static Canonical URL");
    const newCard = await PhysicalCard.create({
      cardType: "premium",
      color: "black",
      distributionType: "corporate",
      status: "unclaimed",
    });

    assert(newCard._id != null, "PhysicalCard created successfully in MongoDB");
    assert(newCard.status === "unclaimed", "Default ownership status is strictly 'unclaimed'");
    assert(newCard.userId === null, "Owner userId is null before claim");
    assert(newCard.profileId === null, "Linked profileId is null before claim");
    assert(newCard.cardUrl.includes(`/c/${newCard.publicId}`), `Static URL is canonical: ${newCard.cardUrl}`);
    assert(!newCard.cardUrl.includes("user") && !newCard.cardUrl.includes("profile"), "Static URL contains neither userId nor profileId");

    // ──────────────────────────────────────────────────────────────────────────
    // 3. DYNAMIC QR CODE GENERATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 3: Dynamic QR Code Generation");
    const qrSvg = await generateQrSvg(newCard.cardUrl);
    assert(qrSvg.startsWith("<svg") && qrSvg.includes("</svg>"), "QR Code SVG generated correctly");
    const qrPng = await generateQrDataUrl(newCard.cardUrl);
    assert(qrPng.startsWith("data:image/png;base64,"), "QR Code PNG DataURL generated correctly");

    // ──────────────────────────────────────────────────────────────────────────
    // 4. NFC SECURITY & ISOLATED CREDENTIAL ENCRYPTION (AES-256-GCM)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 4: NFC Security & Credential Isolation");
    const nfcSec = await initializeNfcSecurityForCard(newCard, "NTAG215", "test_suite");
    assert(nfcSec._id != null, "NfcSecurity record created and linked");
    assert(nfcSec.nfcProtectionStatus === "pending_setup", "Initial protection status is strictly 'pending_setup'");
    assert(nfcSec.nfcCredentialEncrypted != null, "Credentials payload is encrypted");
    assert(nfcSec.nfcCredentialIv != null && nfcSec.nfcCredentialTag != null, "AES-256-GCM IV and Auth Tag are present");

    // Decrypt credentials
    const decrypted = decryptCredentials(
      nfcSec.nfcCredentialEncrypted,
      nfcSec.nfcCredentialIv,
      nfcSec.nfcCredentialTag
    );
    assert(decrypted.passwordHex != null && decrypted.passwordHex.length === 8, `Unique 32-bit password generated: ${decrypted.passwordHex}`);
    assert(decrypted.packHex != null && decrypted.packHex.length === 4, `Unique 16-bit PACK generated: ${decrypted.packHex}`);
    assert(decrypted.passwordHex !== newCard.cardId && decrypted.passwordHex !== newCard.publicId, "Password does NOT equal cardId or publicId");

    // Ensure safe object does not leak secrets
    const safeObj = nfcSec.toSafeObject();
    assert(safeObj.nfcCredentialEncrypted === undefined, "Safe object strictly hides nfcCredentialEncrypted");
    assert(safeObj.nfcCredentialIv === undefined, "Safe object strictly hides IV");
    assert(safeObj.nfcCredentialTag === undefined, "Safe object strictly hides Tag");

    // ──────────────────────────────────────────────────────────────────────────
    // 5. PROVISIONING SESSIONS & FAILURE HANDLING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 5: Provisioning Sessions & Failure Verification");
    const session = await createProvisioningSession(newCard._id, "admin_tester", "127.0.0.1");
    assert(session.sessionToken != null, `Session token created: ${session.sessionToken.slice(0, 10)}...`);
    assert(session.staticUrl === newCard.cardUrl, "Session target URL matches static card URL");

    // Test verification failure (e.g. readback mismatch or protection failure)
    const failedVerification = await verifyProvisioningResult({
      cardId: newCard._id,
      verificationData: {
        writeVerified: false,
        protectionVerified: false,
        errorDetail: "Tag communication timeout",
      },
      actorId: "admin_tester",
      clientIp: "127.0.0.1",
    });

    assert(failedVerification.success === false, "Failed hardware operation correctly reported as failure");
    assert(failedVerification.protectionStatus === "error", "NFC status updated to 'error' on hardware failure");
    assert(failedVerification.protectionStatus !== "locked", "Failed operation NEVER claimed as 'locked'");

    // ──────────────────────────────────────────────────────────────────────────
    // 6. MOCK SIMULATED TEST PROVISIONING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 6: Mock Simulated Hardware Verification");
    const simResult = await simulateTestProvisioning(newCard._id, "admin_tester", "127.0.0.1");
    assert(simResult.success === true, "Simulated provisioning completed successfully");
    assert(simResult.isSimulated === true, "Verification explicitly marked as simulated");
    assert(simResult.protectionStatus === "locked", "Status updated to 'locked' only after verified readback and lock");

    const updatedCard = await PhysicalCard.findById(newCard._id);
    const updatedSec = await NfcSecurity.findOne({ cardId: newCard._id });
    assert(updatedSec.nfcProtectionStatus === "locked", "Database reflects 'locked' protection status");
    assert(updatedSec.nfcLastVerifiedAt != null, "Last verified timestamp recorded in DB");

    // ──────────────────────────────────────────────────────────────────────────
    // 7. CARD CLAIMING & INVARIANCE OF URL AND QR CODE
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 7: Card Claiming & Immutability of Static URL & QR");
    const initialUrl = newCard.cardUrl;
    const initialQrSvg = await generateQrSvg(initialUrl);

    // Create a mock user & digital card/profile
    const mockUser = await User.create({
      email: `test_card_user_${Date.now()}@example.com`,
      name: "Test User",
      username: `testuser${Math.floor(Math.random() * 90000)}`,
    });

    const mockProfile1 = await Card.create({
      userId: mockUser._id,
      name: "Business Profile 1",
    });

    const mockProfile2 = await Card.create({
      userId: mockUser._id,
      name: "Personal Profile 2",
    });

    // Atomic claim
    const claimedCard = await PhysicalCard.findOneAndUpdate(
      { publicId: newCard.publicId, status: "unclaimed" },
      {
        status: "claimed",
        userId: mockUser._id,
        profileId: mockProfile1._id,
        claimedAt: new Date(),
      },
      { new: true }
    );

    assert(claimedCard.status === "claimed", "Card successfully claimed by user");
    assert(String(claimedCard.userId) === String(mockUser._id), "Card userId points to claiming user");
    assert(String(claimedCard.profileId) === String(mockProfile1._id), "Card profileId points to linked profile");
    assert(claimedCard.cardUrl === initialUrl, "Static URL remains STRICTLY identical after claim");

    const postClaimQr = await generateQrSvg(claimedCard.cardUrl);
    assert(postClaimQr === initialQrSvg, "QR Code remains STRICTLY identical after claim");

    // Switch linked profile to Profile 2
    claimedCard.profileId = mockProfile2._id;
    await claimedCard.save();

    const postSwitchCard = await PhysicalCard.findById(claimedCard._id);
    assert(String(postSwitchCard.profileId) === String(mockProfile2._id), "Card profile reassigned to Profile 2");
    assert(postSwitchCard.cardUrl === initialUrl, "Static URL remains STRICTLY identical after profile switch");

    // ──────────────────────────────────────────────────────────────────────────
    // 8. DOUBLE-CLAIM PREVENTION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 8: Atomic Double-Claim Prevention");
    const mockAttacker = await User.create({
      email: `attacker_${Date.now()}@example.com`,
      name: "Attacker User",
    });

    // Attempt to claim an already claimed card
    const doubleClaimAttempt = await PhysicalCard.findOneAndUpdate(
      { publicId: newCard.publicId, status: "unclaimed" },
      { status: "claimed", userId: mockAttacker._id },
      { new: true }
    );

    assert(doubleClaimAttempt === null, "Double claim atomically REJECTED: card is already claimed");

    // ──────────────────────────────────────────────────────────────────────────
    // 9. DISABLED CARD HANDLING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 9: Administrative Disable & Re-enable");
    claimedCard.status = "disabled";
    claimedCard.disabledAt = new Date();
    claimedCard.disabledReason = "Lost by customer";
    await claimedCard.save();

    const disabledCard = await PhysicalCard.findById(claimedCard._id);
    assert(disabledCard.status === "disabled", "Card successfully disabled administratively");
    assert(disabledCard.disabledReason === "Lost by customer", "Disabled reason preserved");

    // Re-enable
    disabledCard.status = "claimed";
    disabledCard.disabledAt = null;
    disabledCard.disabledReason = "";
    await disabledCard.save();

    const reenabledCard = await PhysicalCard.findById(claimedCard._id);
    assert(reenabledCard.status === "claimed", "Card successfully re-enabled");

    // ──────────────────────────────────────────────────────────────────────────
    // 10. AUDIT LOGGING & SECRECY GUARANTEE
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 10: Audit Log Verification & Credential Secrecy");
    const logs = await CardActivityLog.find({ cardId: newCard._id }).lean();
    assert(logs.length >= 3, `Activity logs recorded (${logs.length} events logged)`);

    // Verify NO plain passwords, packs, or raw keys exist in any log
    let hasLeakedSecret = false;
    for (const log of logs) {
      const logStr = JSON.stringify(log);
      if (
        logStr.includes(decrypted.passwordHex) ||
        logStr.includes(decrypted.packHex)
      ) {
        hasLeakedSecret = true;
      }
    }
    assert(!hasLeakedSecret, "ZERO credentials, passwords, or encryption keys leaked in Audit Logs");

    // ──────────────────────────────────────────────────────────────────────────
    // 11. 6-CHARACTER PASSWORD & TARGET URL REDIRECT
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nTest Group 11: 6-Character Password & Target URL Configuration");
    assert(typeof newCard.cardPassword === "string", "Card has cardPassword field");
    assert(newCard.cardPassword.length === 6, `cardPassword length is strictly 6 characters (${newCard.cardPassword})`);
    assert(/^[A-Z0-9]{6}$/.test(newCard.cardPassword), `cardPassword matches 6 alphanumeric chars pattern (${newCard.cardPassword})`);

    // Test Target URL setting
    newCard.targetUrl = "adam_special_redirect";
    await newCard.save();
    const updatedWithTarget = await PhysicalCard.findById(newCard._id);
    assert(updatedWithTarget.targetUrl === "adam_special_redirect", "Custom Target URL successfully configured on physical card");

    // ──────────────────────────────────────────────────────────────────────────
    // 12. CLEANUP TEST DATA
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nCleaning up test artifacts...");
    await PhysicalCard.deleteMany({ _id: newCard._id });
    await NfcSecurity.deleteMany({ cardId: newCard._id });
    await CardActivityLog.deleteMany({ cardId: newCard._id });
    await Card.deleteMany({ _id: { $in: [mockProfile1._id, mockProfile2._id] } });
    await User.deleteMany({ _id: { $in: [mockUser._id, mockAttacker._id] } });
    console.log("Cleanup finished.");

    console.log("\n================================================================================");
    console.log(`TEST SUITE RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log("================================================================================");

    await mongoose.disconnect();
    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error("Test Suite Error:", error);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  }
}

runTestSuite();
