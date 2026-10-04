import AuditLog from "../models/AuditLog.js";

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

function getIp(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown";
  if (ip.includes(",")) ip = ip.split(",")[0];
  if (ip === "::1") ip = "127.0.0.1";
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
  return ip.trim();
}

async function emitLog(log) {
  try {
    const { getIO, getRoomTarget } =
      await import("../services/socketService.js");
    const io = getIO();
    const adminRoom = getRoomTarget(io, "admin_room");
    adminRoom?.emit("newAuditLog", log);
  } catch (err) {
    // Ignore socket errors
  }
}

const securityAudit = async (req, res, next) => {
  if (req.path === "/api/health") return next();

  const ip = getIp(req);
  const path = req.path.toLowerCase();
  const method = req.method;
  const userAgent = req.headers["user-agent"] || "";

  // 1. Scanner Detection
  const isScanner = SCANNER_PATHS.some((p) => path.includes(p));
  if (isScanner) {
    AuditLog.create({
      level: "critical",
      category: "security",
      ip,
      method,
      path,
      userAgent,
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
      level: "critical",
      category: "security",
      ip,
      method,
      path,
      userAgent,
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
        if (
          res.statusCode >= 400 ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/admin")
        ) {
          const level =
            res.statusCode >= 500
              ? "critical"
              : res.statusCode >= 400
                ? "warning"
                : "info";
          const log = await AuditLog.create({
            level,
            category: path.startsWith("/api/auth") ? "auth" : "request",
            ip,
            method,
            path,
            userAgent,
            userId: req.user?._id || null,
            message: `${method} ${path} completed with status ${res.statusCode}`,
            details: { statusCode: res.statusCode },
          });

          if (level === "critical") await emitLog(log);
        }
      } catch (err) {
        // Silent catch
      }
    });

    return originalSend(data);
  };

  next();
};

export default { securityAudit };
