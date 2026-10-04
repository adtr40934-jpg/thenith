import AuditLog from "../models/AuditLog.js";
import _envConfig from "../config/env.js";

const SCANNER_PATHS = [
  ".env",
  ".git",
  "wp-admin",
  "wp-login.php",
  "phpmyadmin",
  "config.php",
  "xmlrpc.php",
  "shell.php",
  "cmd.php",
  "/.aws/",
  "/etc/passwd",
  "/proc/self",
  "/.ssh/",
];

const MALICIOUS_PATTERNS = [
  /<\s*script\b[^>]*>(.*?)<\s*\/\s*script\s*>/is,
  /union\s+(all\s+)?select/i,
  /(\.\.\/)+/i,
  /\/etc\/passwd/i,
  /\bexec\s*\(/i,
  /\beval\s*\(/i,
  /\bsystem\s*\(/i,
  /;\s*(drop|delete|truncate)\s+/i,
];

function isMalicious(payload) {
  if (!payload) return false;
  let str = typeof payload === "string" ? payload : "";
  if (typeof payload === "object") {
    try {
      str = JSON.stringify(payload);
    } catch {
      str = "";
    }
  }
  return MALICIOUS_PATTERNS.some((pattern) => pattern.test(str));
}

import geoip from "geoip-lite";

function getIp(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    "Unknown";
  if (ip.includes(",")) ip = ip.split(",")[0];
  if (ip === "::1") ip = "127.0.0.1";
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip.trim();
}

function getNetworkIp(req) {
  let ip = req.socket?.remoteAddress || "Unknown";
  if (ip === "::1") ip = "127.0.0.1";
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip.trim();
}

let _io = null;

export function setIO(ioInstance) {
  _io = ioInstance;
}

async function emitLog(log) {
  try {
    // Use cached io first for speed
    if (_io) {
      _io.to("admin_room").emit("newAuditLog", log);
      return;
    }
    // Fallback to dynamic import
    const socketModule = await import("../services/socketService.js");
    const io = socketModule.default.getIO();
    io.to("admin_room").emit("newAuditLog", log);
  } catch (err) {
    // Silent — socket may not be ready yet
  }
}

function getCategory(path) {
  if (
    path.startsWith("/api/auth") ||
    path.startsWith("/api/user") ||
    path.startsWith("/api/profile")
  )
    return "panel_profile";
  if (path.startsWith("/api/admin")) return "admin_dashboard";
  if (
    path.startsWith("/api/payment") ||
    path.startsWith("/api/subscription") ||
    path.startsWith("/api/plan")
  )
    return "payments_subscriptions";
  if (
    path.startsWith("/api/product") ||
    path.startsWith("/api/order") ||
    path.startsWith("/api/coupon") ||
    path.startsWith("/api/store")
  )
    return "store";
  return "system";
}

const securityAudit = async (req, res, next) => {
  if (req.path === "/api/health") return next();

  const ip = getIp(req);
  const networkIp = getNetworkIp(req);
  const path = req.path.toLowerCase();
  const method = req.method;
  const userAgent = req.headers["user-agent"] || "";

  // ── Geo location ──────────────────────────────────────────────
  const geo = geoip.lookup(ip);
  const country = geo?.country || "Unknown";
  const governorate = geo?.region || "Unknown";
  // Build human-readable location: city, region, country
  const locationParts = [geo?.city, geo?.region, geo?.country].filter(Boolean);
  const location =
    locationParts.length > 0 ? locationParts.join(", ") : "Unknown";

  // ── Request origin & source detection ─────────────────────────
  const origin = req.headers["origin"] || "";
  const referrer = req.headers["referer"] || req.headers["referrer"] || "";
  const queryString = req.url?.includes("?") ? req.url.split("?")[1] : "";
  const protocol = req.protocol || (req.secure ? "https" : "http");
  const host = req.headers["host"] || "";
  const fullUrl = `${protocol}://${host}${req.originalUrl || req.url || path}`;

  // ── isExternal detection ───────────────────────────────────────
  // Normalize and compare origin against the CORS-allowed frontend origins
  const allowedOrigins = _envConfig.clientOrigins || [];

  // Localhost/127.0.0.1 always treated as internal (dev environments)
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
    origin,
  );

  // Normalize: trim trailing slash, lowercase
  const normalizedOrigin = origin.trim().replace(/\/+$/, "").toLowerCase();
  const isAllowedByOrigin =
    isLocalhost ||
    allowedOrigins.some(
      (o) => o.trim().replace(/\/+$/, "").toLowerCase() === normalizedOrigin,
    );

  // ── Vite Proxy fallback ───────────────────────────────────────
  // When Vite dev server proxies a request with changeOrigin:true, it strips/changes
  // the Origin header — so we fallback to X-Requested-With or Referer headers.
  // The axios client always sends X-Requested-With: XMLHttpRequest.
  const xRequestedWith = req.headers["x-requested-with"] || "";
  const isViteProxied = xRequestedWith.toLowerCase() === "xmlhttprequest";

  // Also check referer: if it starts with one of the allowed origins → frontend
  const refererOrigin = referrer ? new URL(referrer).origin : "";
  const normalizedRefererOrigin = refererOrigin
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
  const isAllowedByReferer =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(refererOrigin) ||
    allowedOrigins.some(
      (o) =>
        o.trim().replace(/\/+$/, "").toLowerCase() === normalizedRefererOrigin,
    );

  // isExternal = true only if we have NO indication this came from our frontend
  const isExternal =
    !isAllowedByOrigin && !isViteProxied && !isAllowedByReferer;

  const logBase = {
    ip,
    networkIp,
    country,
    governorate,
    location,
    userAgent,
    origin,
    referrer,
    fullUrl,
    queryString,
    isExternal,
    method,
    path,
  };

  // 1. Scanner Detection
  const isScanner = SCANNER_PATHS.some((p) => path.includes(p));
  if (isScanner) {
    AuditLog.create({
      ...logBase,
      level: "critical",
      category: "security",
      message: `Directory probing: ${path}`,
      anomalyScore: 80,
    })
      .then(emitLog)
      .catch(() => {});
    return res.status(403).json({ error: "Access Forbidden." });
  }

  // 2. Malicious Payload Detection
  if (method !== "GET" && (isMalicious(req.body) || isMalicious(req.query))) {
    AuditLog.create({
      ...logBase,
      level: "critical",
      category: "security",
      message: "Malicious payload (XSS/SQLi) detected",
      anomalyScore: 100,
    })
      .then(emitLog)
      .catch(() => {});
    return res
      .status(403)
      .json({ error: "Access Forbidden: Malicious payload." });
  }

  // 3. Log API Activity (Asynchronous to prevent blocking)
  const originalSend = res.send.bind(res);
  res.send = function (data) {
    res.send = originalSend;

    setImmediate(async () => {
      try {
        const level =
          res.statusCode >= 500
            ? "critical"
            : res.statusCode >= 400
              ? "warning"
              : "info";
        // Always log everything? Or only specific paths? The current logic was only errors + auth + admin. Let's log everything for the requested categories or if error.
        const log = await AuditLog.create({
          ...logBase,
          level,
          category: getCategory(path),
          userId: req.user?._id || null,
          message: `${method} ${path} completed with status ${res.statusCode}`,
          details: { statusCode: res.statusCode },
        });

        await emitLog(log);
      } catch (err) {
        // Silent catch
      }
    });

    return originalSend(data);
  };

  next();
};

export default { securityAudit };
