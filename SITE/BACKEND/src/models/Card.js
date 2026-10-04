import mongoose from "mongoose";
import _env4886 from "../config/env.js";
const { env } = _env4886;
import _idGenerator7710 from "../util/idGenerator.js";
const { generatePublicId } = _idGenerator7710;

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["phone", "whatsapp", "email", "location", "website"],
      required: true,
    },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    primary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false, strict: true },
);

const personalSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "", maxlength: 120 },
    title: { type: String, default: "", maxlength: 120 },
    company: { type: String, default: "", maxlength: 120 },
    jobTitle: { type: String, default: "", maxlength: 120 },
    bio: { type: String, default: "", maxlength: 2000 },
    avatar: { type: String, default: "" },
    coverImage: { type: String, default: "" },
  },
  { _id: false, strict: true },
);

const calendarSettingsSchema = new mongoose.Schema(
  {
    availableDates: { type: [String], default: [] }, // Array of YYYY-MM-DD strings
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "17:00" },
    alwaysAvailable: { type: Boolean, default: false },
  },
  { _id: false, strict: true }
);

function ensurePrimaryContacts(contacts = []) {
  for (const type of ["phone", "whatsapp"]) {
    const typedContacts = contacts.filter((contact) => contact.type === type);
    if (!typedContacts.length) continue;
    const primary = typedContacts.find((contact) => contact.primary);
    for (const [index, contact] of typedContacts.entries()) {
      contact.primary = primary ? contact.id === primary.id : index === 0;
    }
  }
  return contacts;
}

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, maxlength: 80 },
    publicId: {
      type: String,
      required: true,
      unique: true,
      default: () => generatePublicId(),
      index: true,
    },
    link: { type: String, default: "" },
    personal: { type: personalSchema, default: () => ({}) },
    contacts: { type: [contactSchema], default: [] },
    links: { type: [mongoose.Schema.Types.Mixed], default: [] },
    actionType: { type: String, enum: ["form", "calendar"], default: "form" },
    calendarSettings: { type: calendarSettingsSchema, default: () => ({}) },
    requests: { type: [mongoose.Schema.Types.Mixed], default: [] },
    appointments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    analytics: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    nfcLinkedAt: { type: Date, default: null }, // Timestamp of last successful NFC write
  },
  { timestamps: true },
);

cardSchema.virtual("publicUrl").get(function () {
  const baseUrl = env.APP_URL
    ? env.APP_URL.replace(/\/+$/, "")
    : "http://localhost:3000";

  // If this card is active, prioritize user's username or user's publicId
  if (this.isActive && this.userId) {
    const userIdentifier = this.userId.username || this.userId.publicId;
    if (userIdentifier) {
      return `${baseUrl}/p/${userIdentifier}`;
    }
  }
  // Otherwise use the card's own publicId
  return `${baseUrl}/p/${this.publicId}`;
});

// Ensure virtuals are included when converting to JSON / Object
cardSchema.set("toJSON", { virtuals: true });
cardSchema.set("toObject", { virtuals: true });

cardSchema.pre("validate", function setDefaultPrimaryContacts(next) {
  ensurePrimaryContacts(this.contacts);
  next();
});

cardSchema.index({ userId: 1, createdAt: 1 });
const Card = mongoose.model("Card", cardSchema);

export { ensurePrimaryContacts };
export default Card;
