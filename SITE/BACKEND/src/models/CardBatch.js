import mongoose from "mongoose";

export function generateBatchId() {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BATCH-${year}-${randomPart}`;
}

const cardBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      default: generateBatchId,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    cardType: {
      type: String,
      enum: ["standard", "premium", "metal", "bamboo", "custom"],
      default: "standard",
    },
    color: {
      type: String,
      enum: ["black", "white", "blue", "purple", "silver", "gold", "custom"],
      default: "black",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 5000,
    },
    distributionType: {
      type: String,
      enum: ["sale", "gift", "sample", "corporate"],
      default: "sale",
    },
    manufacturedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "card_batches",
  }
);

const CardBatch = mongoose.models.CardBatch || mongoose.model("CardBatch", cardBatchSchema);

export default CardBatch;
