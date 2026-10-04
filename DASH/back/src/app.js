import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import corsOptions from "./config/cors.js";
import adminRoutes from "./routes/adminRoutes.js";
import _errorHandler from "./middleware/errorHandler.js";
const { errorHandler } = _errorHandler;
import _securityAudit from "./middleware/securityAudit.js";
const { securityAudit } = _securityAudit;
import _apiRequest from "./middleware/apiRequest.js";
const { blockDocumentRequests } = _apiRequest;
import _notFound from "./middleware/notFound.js";
const { notFound } = _notFound;
import _env from "./config/env.js";
const { env } = _env;

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// ── Security Audit Logger ──
app.use(securityAudit);

// Blocks direct browser document navigation to admin endpoints
app.use(blockDocumentRequests);

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
