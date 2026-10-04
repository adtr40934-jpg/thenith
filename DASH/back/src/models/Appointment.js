import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    visitorId: { type: String, index: true },
    // Visitor info (no auth required)
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, default: "", trim: true, maxlength: 2000 },

    // Timing
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "canceled"],
      default: "pending",
    },

    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound index to quickly check overlapping slots
appointmentSchema.index({ cardId: 1, startTime: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
