/**
 * NXP NTAG213 / NTAG215 / NTAG216 Chip Adapter
 * 
 * Hardware specifications:
 * - NTAG 213: 144 bytes user memory (pages 04h..27h). AUTH0 default page 29h. PWD page 2Bh, PACK page 2Ch.
 * - NTAG 215: 504 bytes user memory (pages 04h..81h). AUTH0 default page E3h. PWD page E5h, PACK page E6h.
 * - NTAG 216: 888 bytes user memory (pages 04h..E1h). AUTH0 default page E5h. PWD page E7h, PACK page E8h.
 * 
 * Security mode:
 * - PROT=0: Write access is password protected; Read access is unrestricted so clients/visitors
 *   can tap the card with any NFC phone to read the URL without prompting for password.
 */

export class Ntag21xAdapter {
  constructor(chipType = "NTAG215") {
    this.chipType = chipType;
  }

  getSpecs() {
    switch (this.chipType) {
      case "NTAG213":
        return {
          userMemoryBytes: 144,
          maxNdefBytes: 137,
          auth0PageHex: "0x29",
          pwdPageHex: "0x2B",
          packPageHex: "0x2C",
        };
      case "NTAG216":
        return {
          userMemoryBytes: 888,
          maxNdefBytes: 872,
          auth0PageHex: "0xE5",
          pwdPageHex: "0xE7",
          packPageHex: "0xE8",
        };
      case "NTAG215":
      default:
        return {
          userMemoryBytes: 504,
          maxNdefBytes: 492,
          auth0PageHex: "0xE3",
          pwdPageHex: "0xE5",
          packPageHex: "0xE6",
        };
    }
  }

  /**
   * Generates provisioning configuration for the physical device / Web NFC writer.
   */
  buildProvisioningPlan({ staticUrl, cardPassword }) {
    const specs = this.getSpecs();

    return {
      chipType: this.chipType,
      targetUrl: staticUrl,
      cardPassword: cardPassword || null,
      ndefPayload: {
        recordType: "url",
        data: staticUrl,
      },
      protectionConfiguration: {
        method: "NTAG_PASSWORD_AUTH",
        password: cardPassword || null,
        // Instructions for NFC writer device
        auth0Page: specs.auth0PageHex,
        protMode: "WRITE_ONLY_PROTECTED", // Visitors can read freely
        // The hardware writer will use passwordHex and packHex via secure channel
        requiresHardwareAuth: true,
      },
      verificationExpectation: {
        expectedUrl: staticUrl,
        expectedProtection: "locked",
      },
    };
  }

  /**
   * Validates verification report received from the provisioner device.
   * Strictly enforces that readback matches and lock verification is confirmed.
   */
  verifyResult(verificationData, expectedUrl) {
    if (!verificationData) {
      return {
        valid: false,
        error: "Missing verification payload from NFC hardware device",
      };
    }

    const {
      readUrl,
      hardwareUid,
      writeVerified,
      protectionVerified,
      errorDetail,
    } = verificationData;

    if (errorDetail) {
      return {
        valid: false,
        error: `Hardware operation reported error: ${errorDetail}`,
      };
    }

    if (!writeVerified) {
      return {
        valid: false,
        error: "Hardware readback did not confirm write success",
      };
    }

    if (!readUrl || readUrl.trim().toLowerCase() !== expectedUrl.trim().toLowerCase()) {
      return {
        valid: false,
        error: `Readback URL mismatch. Expected: ${expectedUrl}, Got: ${readUrl}`,
      };
    }

    if (!protectionVerified) {
      return {
        valid: false,
        error: "Hardware write protection lock was not verified",
      };
    }

    return {
      valid: true,
      hardwareUid: hardwareUid || null,
      status: "locked",
      verifiedAt: new Date(),
    };
  }
}

export default Ntag21xAdapter;
