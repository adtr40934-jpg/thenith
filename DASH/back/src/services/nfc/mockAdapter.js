/**
 * NFC Mock Adapter for Testing and Software Simulation
 * 
 * Used for testing the entire card management lifecycle when a physical
 * NFC writer device is not attached. Explicitly marks all results as simulated.
 */

export class MockNfcAdapter {
  constructor(simulatedChipType = "NTAG215") {
    this.chipType = simulatedChipType;
    this.isMock = true;
  }

  buildProvisioningPlan({ staticUrl }) {
    return {
      chipType: this.chipType,
      isSimulated: true,
      targetUrl: staticUrl,
      ndefPayload: {
        recordType: "url",
        data: staticUrl,
      },
      warning: "THIS IS A SOFTWARE SIMULATION. NO PHYSICAL NFC TAG WAS CONTACTED.",
    };
  }

  simulateSuccessfulWriteAndLock({ expectedUrl }) {
    return {
      simulated: true,
      writeVerified: true,
      protectionVerified: true,
      readUrl: expectedUrl,
      hardwareUid: `04:SIM:${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      note: "Simulated software write & lock verification for non-hardware test environments.",
    };
  }

  verifyResult(verificationData, expectedUrl) {
    if (!verificationData) {
      return { valid: false, error: "Missing mock verification data" };
    }

    if (!verificationData.writeVerified || !verificationData.protectionVerified) {
      return { valid: false, error: "Mock verification indicated failure" };
    }

    return {
      valid: true,
      isSimulated: true,
      hardwareUid: verificationData.hardwareUid || "04:SIM:000000",
      status: "locked",
      verifiedAt: new Date(),
    };
  }
}

export default MockNfcAdapter;
