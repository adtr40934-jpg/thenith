import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import _cors from "./config/cors.js";
const { default: corsOptions } = _cors;
import _rateLimit8502 from "./middleware/rateLimit.js";
const { authRateLimit } = _rateLimit8502;
import authRoutes from "./routes/auth/authRoutes.js";
import planRoutes from "./routes/plans.js";
import subscriptionRoutes from "./routes/subscription.js";
import cardRoutes from "./routes/cards.js";
import dashboardRoutes from "./routes/dashboard/dashboardRoutes.js";
import publicRoutes from "./routes/publicProfile/publicProfileRoutes.js";
import appointmentRoutes from "./routes/appointments.js";
import hireRoutes from "./routes/hire.js";
import analyticsRoutes from "./routes/analytics.js";

import _errorHandler6588 from "./middleware/errorHandler.js";
const { errorHandler } = _errorHandler6588;
import _securityAudit2411 from "./middleware/securityAudit.js";
const { securityAudit } = _securityAudit2411;
import _apiRequest911 from "./middleware/apiRequest.js";
const { blockDocumentRequests } = _apiRequest911;
import _notFound6324 from "./middleware/notFound.js";
const { notFound } = _notFound6324;
import uploadRoutes from "./routes/upload.js";
import supportRoutes from "./routes/support.js";
import settingsRoutes from "./routes/settings.js";
import productRoutes from "./routes/products.js";
import panelRoutes from "./routes/panel/panelRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationsRoutes from "./routes/notifications.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Request Logger (dev only) ─────────────────────────────────────────────────
app.use((req, _res, next) => {
  // Skip noisy health checks and static/public reads
  const skip = ["/api/health", "/favicon"];
  if (skip.some(p => req.path.startsWith(p))) return next();

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const method = req.method.padEnd(7);
  const path   = req.originalUrl || req.path;

  const parts = [`\n\x1b[36m[${ts}]\x1b[0m \x1b[1m${method}\x1b[0m ${path}`];

  if (Object.keys(req.query).length)
    parts.push(`  \x1b[33mQuery :\x1b[0m ${JSON.stringify(req.query)}`);

  if (req.body && Object.keys(req.body).length) {
    // Mask sensitive fields before logging
    const safe = { ...req.body };
    ["password","token","credential","secret","accessToken","refreshToken"].forEach(k => {
      if (safe[k]) safe[k] = "[MASKED]";
    });
    parts.push(`  \x1b[33mBody   :\x1b[0m ${JSON.stringify(safe)}`);
  }

  // If auth middleware has already run (e.g. nested routes), show user id
  if (req.user?._id)
    parts.push(`  \x1b[32mUser   :\x1b[0m ${req.user._id} (${req.user.email || "?"}`);

  next();
});

// ── 1. Security Audit Logger ──
// MUST be placed here before any blockers so it can intercept their responses and log them!
app.use(securityAudit);

// Blocks direct document navigation to API endpoints.
app.use(blockDocumentRequests);

app.get("/api/health", (_request, response) => response.json({ ok: true }));
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/panel", panelRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/hire", hireRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/shipping-rates", shippingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationsRoutes);


app.use("/api/public", publicRoutes);
app.use("/api/p", publicRoutes);
app.use("/public", publicRoutes);
app.use("/p", publicRoutes);
app.use("/", publicRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
