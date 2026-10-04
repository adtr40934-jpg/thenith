import mongoose from "mongoose";

const customerServiceSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    unreadAdmin: {
      type: Number,
      default: 0,
    },
    unreadUser: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const CustomerService = mongoose.model(
  "CustomerService",
  customerServiceSchema,
  "customerservice",
);

export default CustomerService;
