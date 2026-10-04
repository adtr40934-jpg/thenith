import UserNotification from "../models/UserNotification.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import _auth from "../middleware/auth.js";
const { requireAuth } = _auth;
import _env from "../config/env.js";
const { env } = _env;
import _socketService from "../services/socketService.js";
const { getIO } = _socketService;

import { sanitizeNotification } from "../util/apiResponseDTO.js";

// Helper: get admin from cookie
function getAdminFromCookie(req) {
  try {
    const adminToken = req.cookies?.admin_token;
    if (!adminToken) return null;
    const admin = jwt.verify(adminToken, env.ADMIN_JWT_SECRET);
    return admin.role === "superadmin" ? admin : null;
  } catch {
    return null;
  }
}

// ── GET /api/notifications/ ──────────────────────────────────────────────────
// Get all notifications for the current user (newest first, max 50)
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications.map(sanitizeNotification));
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/ ─────────────────────────────────────────────────
// Create a notification for the current user (called from frontend on actions)
const createMyNotification = async (req, res, next) => {
  try {
    const { type = "action", title, message = "", link = "" } = req.body;
    if (!title) return res.status(400).json({ error: { code: "INVALID_INPUT", message: "title required" } });

    // Keep max 50 per user
    const count = await UserNotification.countDocuments({ userId: req.user._id });
    if (count >= 50) {
      // Delete oldest
      const oldest = await UserNotification.find({ userId: req.user._id })
        .sort({ createdAt: 1 })
        .limit(count - 49)
        .select("_id");
      await UserNotification.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }

    const notif = await UserNotification.create({
      userId: req.user._id,
      type,
      title,
      message,
      link,
    });

    res.json(sanitizeNotification(notif));
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
// Mark single notification as read
const markRead = async (req, res, next) => {
  try {
    const notif = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: { code: "NOT_FOUND" } });
    res.json(sanitizeNotification(notif));
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
// Mark all notifications as read
const markAllRead = async (req, res, next) => {
  try {
    await UserNotification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
// Delete a single notification
const deleteOne = async (req, res, next) => {
  try {
    await UserNotification.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/ ───────────────────────────────────────────────
// Clear all notifications for current user
const clearAll = async (req, res, next) => {
  try {
    await UserNotification.deleteMany({ userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/push (Admin only) ─────────────────────────────────
// Send push notification to all users or specific user
const sendPushNotification = async (req, res, next) => {
  try {
    const admin = getAdminFromCookie(req);
    if (!admin) return res.status(403).json({ error: { code: "FORBIDDEN" } });

    const { target, userId, title, message = "" } = req.body;
    if (!title || !target) {
      return res.status(400).json({ error: { code: "INVALID_INPUT", message: "title and target are required" } });
    }

    const io = await getIO();

    if (target === "all") {
      // Save to ALL users' notifications
      const users = await User.find({ isActive: true }).select("_id").lean();
      const docs = users.map(u => ({ userId: u._id, type: "admin_push", title, message }));
      await UserNotification.insertMany(docs, { ordered: false });

      // Emit to all connected sockets
      io.emit("adminNotification", { type: "admin_push", title, message, timestamp: new Date().toISOString() });
      return res.json({ ok: true, sent: "all", count: docs.length });

    } else if (target === "user" && userId) {
      const user = await User.findById(userId).select("_id name email");
      if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });

      const notif = await UserNotification.create({ userId, type: "admin_push", title, message });

      io.to(`user_${userId}`).emit("adminNotification", {
        type: "admin_push",
        title,
        message,
        notifId: notif._id,
        timestamp: new Date().toISOString(),
      });
      return res.json({ ok: true, sent: "user", userId, notifId: notif._id });

    } else {
      return res.status(400).json({ error: { code: "INVALID_TARGET" } });
    }
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notifications/users (Admin only) ─────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const admin = getAdminFromCookie(req);
    if (!admin) return res.status(403).json({ error: { code: "FORBIDDEN" } });
    const users = await User.find({ isActive: true })
      .select("_id name email username")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export default {
  getMyNotifications,
  createMyNotification,
  markRead,
  markAllRead,
  deleteOne,
  clearAll,
  sendPushNotification,
  getUsers,
};
