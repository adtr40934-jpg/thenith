/**
 * NXP NTAG 424 DNA Adapter
 *
 * Hardware specifications:
 * - ISO/IEC 14443-A and ISO/IEC 7816-4 compliant.
 * - AES-128 cryptographic hardware authentication.
 * - SUN (Secure Unique NFC) message generation: dynamic CMAC on every tap.
 * - Anti-cloning protection with mutual authentication.
 */

export class Ntag424Adapter {
  constructor() {
    this.chipType = "NTAG424_DNA";
  }

  getSpecs() {
    return {
      cryptographicEngine: "AES-128",
      features: ["SUN", "SDM", "MutualAuthentication", "AntiCloning"],
      requiresNativeNfcSdk: true,
    };
  }

  buildProvisioningPlan({ staticUrl, credentials }) {
    return {
      chipType: this.chipType,
      targetUrl: staticUrl,
      ndefPayload: {
        recordType: "url",
        data: staticUrl,
      },
      protectionConfiguration: {
        method: "AES128_MUTUAL_AUTH",
        requiresHardwareAuth: true,
        sdmEnabled: true,
      },
      verificationExpectation: {
        expectedUrl: staticUrl,
        expectedProtection: "locked",
      },
    };
  }

  verifyResult(verificationData, expectedUrl) {
    if (!verificationData) {
      return { valid: false, error: "Missing verification payload" };
    }

    const { readUrl, writeVerified, protectionVerified, hardwareUid, errorDetail } = verificationData;

    if (errorDetail) {
      return { valid: false, error: `NTAG 424 hardware error: ${errorDetail}` };
    }

    if (!writeVerified || !protectionVerified) {
      return { valid: false, error: "NTAG 424 mutual auth or protection could not be verified" };
    }

    if (!readUrl || !readUrl.startsWith(expectedUrl)) {
      return { valid: false, error: "Readback URL did not match expected base URL" };
    }

    return {
      valid: true,
      hardwareUid: hardwareUid || null,
      status: "locked",
      verifiedAt: new Date(),
    };
  }
}

export default Ntag424Adapter;
