import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: mongoose.Schema.Types.Mixed, required: true },
    prices: {
      monthly: { type: Number, required: true, min: 0 },
      yearly: { type: Number, required: true, min: 0 },
    },
    limits: { type: Map, of: Number, default: {} },
    features: { type: Map, of: Boolean, default: {} },
    marketingFeatures: [
      {
        name: { type: mongoose.Schema.Types.Mixed, required: true },
        enabled: { type: Boolean, default: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
