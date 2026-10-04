import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null,
      index: true,
    },
    visitorId: { type: String, index: true },
    type: {
      type: String,
      enum: ["platform_contact", "card_contact"],
      default: "platform_contact",
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    subject: { type: String, default: "بدون عنوان", maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

contactRequestSchema.index({ cardId: 1, createdAt: -1 });

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);

export default ContactRequest;
