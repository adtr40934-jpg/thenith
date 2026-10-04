import UserNotification from "../models/UserNotification.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

const sendPushNotification = async (req, res, next) => {
  try {
    const { target, userId, plan, title, message = "" } = req.body;
    if (!title || !target) {
      return res.status(400).json({ error: "title and target are required" });
    }

    if (target === "all") {
      const users = await User.find({ isActive: true }).select("_id").lean();
      const docs = users.map(u => ({ userId: u._id, type: "admin_push", title, message }));
      if (docs.length > 0) {
        await UserNotification.insertMany(docs, { ordered: false });
      }
      return res.json({ ok: true, sent: "all", count: docs.length });

    } else if (target === "plan" && plan) {
      // Find users with active subscriptions
      const activeSubs = await Subscription.find({ status: { $in: ["active", "trialing"] } }).select("userId").lean();
      const proUserIds = activeSubs.map(s => s.userId); // keep them as ObjectIds!

      let users = [];
      if (plan === "pro") {
        users = await User.find({ isActive: true, _id: { $in: proUserIds } }).select("_id").lean();
      } else if (plan === "free") {
        users = await User.find({ isActive: true, _id: { $nin: proUserIds } }).select("_id").lean();
      }

      const docs = users.map(u => ({ userId: u._id, type: "admin_push", title, message }));
      if (docs.length > 0) {
        await UserNotification.insertMany(docs, { ordered: false });
      }
      return res.json({ ok: true, sent: "plan", plan, count: docs.length });

    } else if (target === "user" && userId) {
      const user = await User.findById(userId).select("_id");
      if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

      const notif = await UserNotification.create({ userId, type: "admin_push", title, message });
      return res.json({ ok: true, sent: "user", userId, notifId: notif._id });

    } else {
      return res.status(400).json({ error: "INVALID_TARGET" });
    }
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select("_id name email username")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export default {
  sendPushNotification,
  getUsers,
};
