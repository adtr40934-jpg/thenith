import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["request", "auth", "security", "payment", "system"],
      default: "request",
    },
    ip: { type: String, default: "Unknown" },
    networkIp: { type: String, default: "" },
    location: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "" },
    referrer: { type: String, default: "" },
    origin: { type: String, default: "" }, // Origin header
    fullUrl: { type: String, default: "" }, // Full request URL
    queryString: { type: String, default: "" }, // Raw query string
    isExternal: { type: Boolean, default: false }, // Not from allowed frontend
    method: { type: String },
    path: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    message: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    anomalyScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// TTL index — auto delete after 30 days
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
auditLogSchema.index({ level: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ ip: 1 });
auditLogSchema.index({ isExternal: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
