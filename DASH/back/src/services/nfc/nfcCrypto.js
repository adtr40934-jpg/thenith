import crypto from "node:crypto";
import _env from "../../config/env.js";

const { env } = _env;

// Master key derivation: derived from NFC_MASTER_KEY or fallback to ADMIN_JWT_SECRET
function getMasterKey() {
  const secretSource = process.env.NFC_MASTER_KEY || env?.ADMIN_JWT_SECRET || "thenith_default_secure_nfc_master_salt_2026";
  return crypto.createHash("sha256").update(secretSource).digest();
}

/**
 * Generates unique cryptographic credentials for an NFC card.
 * NEVER uses predictable values like cardId or publicId directly as password.
 */
export function generateUniqueNfcCredentials(chipType = "NTAG215", cardId = "", publicId = "", cardPassword = "") {
  let passwordHex, packHex;

  if (["NTAG213", "NTAG215", "NTAG216"].includes(chipType)) {
    if (cardPassword && cardPassword.length >= 6) {
      // Direct 1:1 mapping with the 6-character card password
      // 4 characters for 32-bit PWD, 2 characters for 16-bit PACK
      const pwdBuffer = Buffer.from(cardPassword.slice(0, 4), "ascii");
      const packBuffer = Buffer.from(cardPassword.slice(4, 6), "ascii");
      passwordHex = pwdBuffer.toString("hex").toUpperCase();
      packHex = packBuffer.toString("hex").toUpperCase();
    } else {
      const randomBytes = crypto.randomBytes(32);
      const hmac = crypto.createHmac("sha256", getMasterKey());
      hmac.update(`${cardId}:${publicId}:${randomBytes.toString("hex")}:${Date.now()}`);
      const seed = hmac.digest();
      passwordHex = seed.subarray(0, 4).toString("hex").toUpperCase();
      packHex = seed.subarray(4, 6).toString("hex").toUpperCase();
    }

    // Determine default AUTH0 page based on chip specs
    let auth0Page = 0xE3; // NTAG215 default
    if (chipType === "NTAG213") auth0Page = 0x29;
    if (chipType === "NTAG216") auth0Page = 0xE5;

    return {
      chipType,
      passwordHex,
      packHex,
      auth0Page,
      // Access bit: PROT=0 (Write protected, Read is public for card scanning)
      protBit: 0,
      cardPassword: cardPassword || null,
      createdAt: new Date().toISOString(),
    };
  }

  if (chipType === "NTAG424_DNA") {
    // 128-bit (16-byte) AES master application key
    const masterKeyHex = seed.subarray(0, 16).toString("hex").toUpperCase();
    return {
      chipType,
      masterKeyHex,
      appId: "THN424",
      sdmEnabled: true,
      createdAt: new Date().toISOString(),
    };
  }

  // Generic ISO14443-A default
  return {
    chipType: "GENERIC_ISO14443A",
    tokenHex: seed.subarray(0, 16).toString("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Encrypts credentials payload using AES-256-GCM.
 */
export function encryptCredentials(credentialsObj, version = 1) {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);

  const jsonString = JSON.stringify(credentialsObj);
  let encrypted = cipher.update(jsonString, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: authTag.toString("hex"),
    version,
  };
}

/**
 * Decrypts credentials payload using AES-256-GCM.
 */
export function decryptCredentials(encryptedHex, ivHex, tagHex) {
  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

export default {
  generateUniqueNfcCredentials,
  encryptCredentials,
  decryptCredentials,
};
