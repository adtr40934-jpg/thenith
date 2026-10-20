import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import corsOptions from "./config/cors.js";
import adminRoutes from "./routes/adminRoutes.js";
import _errorHandler from "./middleware/errorHandler.js";
const { errorHandler } = _errorHandler;
import _securityAudit from "./middleware/securityAudit.js";
const { securityAudit } = _securityAudit;
import _notFound from "./middleware/notFound.js";
const { notFound } = _notFound;
import _env from "./config/env.js";
const { env } = _env;

export const app = express();

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ── Security Audit Logger (non-blocking monitoring) ──
app.use(securityAudit);

// Root route: Redirect browser to frontend dashboard or return status JSON
app.get("/", (req, res) => {
  const host = req.hostname || "localhost";
  if (req.accepts("html")) {
    return res.redirect(`http://${host}:3001`);
  }
  return res.json({
    ok: true,
    service: "Thenith Standalone Admin Dashboard Backend",
    dashboard: `http://${host}:3001`,
    port: env.PORT,
    status: "Online",
  });
});

app.get("/api", (_request, response) =>
  response.json({
    ok: true,
    service: "Thenith Admin API",
    routes: "/api/admin/*",
    health: "/api/admin/health",
  }),
);

// Health check
app.get("/api/admin/health", (_request, response) =>
  response.json({
    ok: true,
    service: "Thenith Standalone Admin Dashboard",
    port: env.PORT,
    timestamp: new Date(),
  }),
);

// Mount Admin Routes
app.use("/api/admin", adminRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
