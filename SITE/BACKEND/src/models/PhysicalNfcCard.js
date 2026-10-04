import mongoose from "mongoose";

const ndefRecordSchema = new mongoose.Schema(
  {
    recordType: { type: String },        // "url", "text", "mime", "absolute-url", "unknown", "empty"
    mediaType:  { type: String },        // for mime records
    id:         { type: String },        // record ID if present
    encoding:   { type: String },        // for text records (e.g. "utf-8")
    lang:       { type: String },        // for text records (e.g. "en", "ar")
    data:       { type: String },        // decoded string value (url / text)
  },
  { _id: false }
);

const physicalNfcCardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Primary URL (the canonical profile link written on the card) ──────────
    scannedUrl: { type: String, required: true },

    // ── NFC Tag Hardware Info ─────────────────────────────────────────────────
    serialNumber: { type: String, default: null }, // tag UID, e.g. "04:ab:cd:12:34:56:78"
    tagType:      { type: String, default: null }, // e.g. "NTAG215" — if detectable
    signature:    { type: String, default: null }, // ECC originality signature (requires native app)

    // ── Full NDEF Message ─────────────────────────────────────────────────────
    ndefRecords: { type: [ndefRecordSchema], default: [] },

    // ── Raw scan metadata ─────────────────────────────────────────────────────
    scanMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      // Stores anything extra the browser provides: message.records count, etc.
    },

    // ── Management ───────────────────────────────────────────────────────────
    label:         { type: String, default: "", maxlength: 80 },
    lastScannedAt: { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PhysicalNfcCard", physicalNfcCardSchema);
