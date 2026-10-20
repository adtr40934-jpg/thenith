import Ntag21xAdapter from "./ntag21xAdapter.js";
import Ntag424Adapter from "./ntag424Adapter.js";
import MockNfcAdapter from "./mockAdapter.js";

export function getNfcAdapter(chipType = "NTAG215", useMock = false) {
  if (useMock) {
    return new MockNfcAdapter(chipType);
  }

  switch (chipType) {
    case "NTAG213":
    case "NTAG215":
    case "NTAG216":
      return new Ntag21xAdapter(chipType);
    case "NTAG424_DNA":
      return new Ntag424Adapter();
    case "GENERIC_ISO14443A":
    default:
      return new Ntag21xAdapter("NTAG215");
  }
}

export default { getNfcAdapter };
