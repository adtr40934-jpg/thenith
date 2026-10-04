import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: String, required: true },
    businessRequests: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

usageSchema.index({ userId: 1, month: 1 }, { unique: true });
const Usage = mongoose.model("Usage", usageSchema);

export default Usage;
