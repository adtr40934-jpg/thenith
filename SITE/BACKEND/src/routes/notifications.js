import express from "express";
import notificationsController from "../controller/notificationsController.js";
import _auth from "../middleware/auth.js";
const { requireAuth } = _auth;

const router = express.Router();

// User routes (require authentication)
router.get("/", requireAuth, notificationsController.getMyNotifications);
router.post("/", requireAuth, notificationsController.createMyNotification);
router.patch("/read-all", requireAuth, notificationsController.markAllRead);
router.patch("/:id/read", requireAuth, notificationsController.markRead);
router.delete("/", requireAuth, notificationsController.clearAll);
router.delete("/:id", requireAuth, notificationsController.deleteOne);

// Admin routes (use cookie-based admin auth, no requireAuth)
router.post("/push", notificationsController.sendPushNotification);
router.get("/users", notificationsController.getUsers);

export default router;
