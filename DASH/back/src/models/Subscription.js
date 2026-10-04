import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "trialing", "pending", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    billingPeriod: {
      type: String,
      enum: ["monthly", "yearly", null],
      default: null,
    },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null, index: true },
    cancelledAt: { type: Date, default: null },
    provider: {
      type: String,
      enum: ["manual", "paymob", "stripe"],
      default: "manual",
    },
    providerSubscriptionId: { type: String, default: null },
  },
  { timestamps: true },
);

subscriptionSchema.index({ userId: 1, status: 1, expiresAt: 1 });
const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
