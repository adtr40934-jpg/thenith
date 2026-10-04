import mongoose from "mongoose";

const shippingRateSchema = new mongoose.Schema(
  {
    governorate: {
      type: String,
      required: true,
      trim: true,
    },
    governorateAr: {
      type: String,
      required: true,
      trim: true,
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ShippingRate", shippingRateSchema);
