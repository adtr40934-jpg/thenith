import mongoose from "mongoose";

const analyticEventSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ["visit", "click"],
    },
    country: {
      type: String,
      default: "Unknown",
    },
    linkUrl: {
      type: String,
      default: "",
    },
    visitorId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

analyticEventSchema.index({ cardId: 1, eventType: 1, createdAt: -1 });

const AnalyticEvent = mongoose.model(
  "AnalyticEvent",
  analyticEventSchema,
);

export default AnalyticEvent;
