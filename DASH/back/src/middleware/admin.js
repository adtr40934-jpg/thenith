import jwt from "jsonwebtoken";
import User from "../models/User.js";
import _env5352 from "../config/env.js";
const { env } = _env5352;
import _tokens652 from "../util/tokens.js";
const { verifyAccessToken } = _tokens652;

// Verifies an admin token or an active user with the admin role.
async function requireAdminToken(request, response, next) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({
      error: { code: "AUTH_REQUIRED", message: "Unauthorized" },
    });
  }

  try {
    const token = authorization.slice(7);
    try {
      const decoded = jwt.verify(token, env.ADMIN_JWT_SECRET);
      if (decoded.role !== "superadmin") throw new Error("Admin role required");
      request.admin = decoded;
    } catch {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user || user.isActive === false || user.role !== "admin") {
        throw new Error("Admin role required");
      }
      request.admin = { id: user._id.toString(), role: user.role };
    }
    next();
  } catch {
    response.status(401).json({
      error: {
        code: "INVALID_ADMIN_TOKEN",
        message: "Invalid or expired admin token",
      },
    });
  }
}

export default { requireAdminToken };
