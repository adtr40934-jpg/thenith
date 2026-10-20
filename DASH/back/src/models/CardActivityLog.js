import mongoose from "mongoose";

const cardActivityLogSchema = new mongoose.Schema(
  {
    // Physical Card Reference
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalCard",
      required: true,
      index: true,
    },

    // Action Name
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        "CARD_CREATED",
        "CARD_UPDATED",
        "BATCH_CREATED",
        "NFC_PROVISION_INITIATED",
        "NFC_PROVISION_VERIFIED",
        "NFC_PROVISION_FAILED",
        "NFC_PROTECTION_LOCKED",
        "NFC_PROTECTION_UNLOCKED",
        "NFC_KEYS_ROTATED",
        "NFC_SIMULATED_TEST",
        "CARD_CLAIMED",
        "CARD_UNLINKED",
        "PROFILE_CHANGED",
        "STATUS_DISABLED",
        "STATUS_REENABLED",
        "METADATA_UPDATED",
        "SECURITY_ALERT",
      ],
    },

    // Actor performing the action
    actorType: {
      type: String,
      enum: ["admin", "user", "system"],
      default: "admin",
      index: true,
    },

    actorId: {
      type: String,
      default: null,
    },

    actorIp: {
      type: String,
      default: "",
    },

    // Status of the action
    status: {
      type: String,
      enum: ["success", "failure", "warning", "info"],
      default: "success",
      index: true,
    },

    // Description / message
    message: {
      type: String,
      default: "",
    },

    // SAFE metadata (STRICTLY NO PLAIN PASSWORDS OR KEYS)
    safeMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "card_activity_logs",
  }
);

// Fast compound query index for card audit histories
cardActivityLogSchema.index({ cardId: 1, timestamp: -1 });

const CardActivityLog = mongoose.models.CardActivityLog || mongoose.model("CardActivityLog", cardActivityLogSchema);

export default CardActivityLog;
