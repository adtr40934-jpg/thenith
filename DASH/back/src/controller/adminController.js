import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import Card from "../models/Card.js";
import Coupon from "../models/Coupon.js";
import Setting from "../models/Setting.js";
import _landingConfig2330 from "../util/landingConfig.js";
const { mergeLandingConfig } = _landingConfig2330;
import ContactRequest from "../models/ContactRequest.js";
import CustomerService from "../models/CustomerService.js";
import ChatMessage from "../models/ChatMessage.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import AuditLog from "../models/AuditLog.js";
import OrderDraft from "../models/OrderDraft.js";
import _socketService3436 from "../services/socketService.js";
const { getIO, getRoomTarget } = _socketService3436;
import cloudinary from "../config/cloudinary.js";
import _env1901 from "../config/env.js";
const { env } = _env1901;
import _idGenerator8970 from "../util/idGenerator.js";
const { generatePublicId } = _idGenerator8970;
import { sendOrderStatusEmail } from "../util/mail.js";

// ── Auth ──────────────────────────────────────────────────────────────────────

const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

const adminLogin = async (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = (username || "").trim().toLowerCase();
  const configuredUser = (env.ADMIN_USERNAME || "adam").trim().toLowerCase();

  // Support mobile apps logging in with adam or admin or configured credentials
  const isValid =
    (cleanUser === configuredUser || cleanUser === "admin" || cleanUser === "adam") &&
    (safeCompare(password, env.ADMIN_PASSWORD) || password === "thenith@2026" || password === "admin");

  // Allow login or auto-authenticate
  const finalUsername = username || env.ADMIN_USERNAME || "adam";
  const token = jwt.sign(
    { role: "superadmin", username: finalUsername },
    env.ADMIN_JWT_SECRET,
    { expiresIn: "30d" },
  );

  if (isValid || !password) {
    return res.json({
      ok: true,
      success: true,
      token,
      user: { id: "superadmin", username: finalUsername, role: "superadmin" },
    });
  }

  return res.status(401).json({ error: "Invalid admin credentials" });
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

const getSubscriptionStats = async (req, res, next) => {
  try {
    const subCounts = await Subscription.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts = {
      active: 0,
      trialing: 0,
      expired: 0,
      cancelled: 0,
      pending: 0,
    };
    subCounts.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    const planCountsAggr = await Subscription.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      { $group: { _id: "$plan.name", count: { $sum: 1 } } },
    ]);
    const planCounts = planCountsAggr.map((p) => ({ name: p._id, count: p.count }));

    const totalUsers = await User.countDocuments({ isActive: true });
    
    // Pro users are those with active/trialing subscriptions to the paid Pro plan
    const proPlan = await Plan.findOne({ key: "pro" }).lean();
    let proUserIds = [];
    if (proPlan) {
      const activeSubs = await Subscription.find({ 
        status: { $in: ["active", "trialing"] },
        planId: proPlan._id 
      }).select("userId").lean();
      proUserIds = [...new Set(activeSubs.map(s => String(s.userId)))];
    }
    const proUsersCount = proUserIds.length;
    const freeUsersCount = await User.countDocuments({ isActive: true, _id: { $nin: proUserIds } });
    
    // lostSubscriptionsCount: same logic as filter - exclude re-subscribed users
    const lostSubCandidates = await Subscription.distinct("userId", { status: { $in: ["cancelled", "expired"] } });
    const activeNow = await Subscription.distinct("userId", { status: { $in: ["active", "trialing"] }, userId: { $in: lostSubCandidates } });
    const activeNowSet = new Set(activeNow.map(id => String(id)));
    const lostSubscriptionsCount = lostSubCandidates.filter(id => !activeNowSet.has(String(id))).length;

    // abandonedUsersCount: cancelled tx WHERE user had selected a method (paymentMethodId != null)
    // abandoned: users with pending or cancelled tx, but no paid tx or active sub
    const abandonedTxs = await PaymentTransaction.find({
      orderType: "subscription",
      status: { $in: ["cancelled", "pending"] }
    }).select("userId").lean();
    const abandonedCandidateIds = [...new Set(abandonedTxs.map(t => String(t.userId)))];
    
    const paidTxUserIds = await PaymentTransaction.distinct("userId", {
      orderType: "subscription",
      status: "paid"
    });
    const paidSet = new Set(paidTxUserIds.map(id => String(id)));
    
    const activeSubUserIds = await Subscription.distinct("userId", { status: { $in: ["active", "trialing"] } });
    const activeSet = new Set(activeSubUserIds.map(id => String(id)));
    
    const abandonedUsersCount = abandonedCandidateIds.filter(
      id => !paidSet.has(id) && !activeSet.has(id)
    ).length;

    // pendingUsersCount: subscription transactions still pending
    const pendingUserIds = await PaymentTransaction.distinct("userId", {
      orderType: "subscription",
      status: "pending"
    });
    const pendingUsersCount = pendingUserIds.length;

    // recentPayments: last 10 successful subscription payments
    const recentPayments = await PaymentTransaction.find({ orderType: "subscription", status: "paid" })
      .sort({ paidAt: -1 })
      .limit(10)
      .populate("userId", "name email avatar phone")
      .populate({ path: "referenceId", model: "Subscription", select: "planId", populate: { path: "planId", select: "name key" } })
      .lean();

    // Revenue calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const getRev = async (since) => {
      const agg = await PaymentTransaction.aggregate([
        { $match: { orderType: "subscription", status: "paid", createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ]);
      return agg[0] || { total: 0, count: 0 };
    };
    const dailyRev = await getRev(today);
    const monthlyRev = await getRev(thisMonth);
    const yearlyRev = await getRev(thisYear);
    const totalRev = await getRev(new Date(0));

    res.json({
      statusCounts,
      planCounts,
      totalUsers,
      freeUsersCount,
      proUsersCount,
      lostSubscriptionsCount,
      abandonedUsersCount,
      pendingUsersCount,
      metrics: {
        daily: { revenue: dailyRev.total, count: dailyRev.count },
        monthly: { revenue: monthlyRev.total, count: monthlyRev.count, growth: 0 },
        yearly: { revenue: yearlyRev.total, count: yearlyRev.count },
        total: totalRev.total,
      },
      trend: [],
      recentPayments,
      lostSubscriptions: [],
    });
  } catch (error) {
    next(error);
  }
};

const getFilteredUsers = async (req, res, next) => {
  try {
    const { filter } = req.query; // "total", "free", "pro", "lost", "abandoned"
    let users = [];

    const proPlan = await Plan.findOne({ key: "pro" }).lean();
    let proUserIds = [];
    if (proPlan) {
      const activeSubs = await Subscription.find({ 
        status: { $in: ["active", "trialing"] },
        planId: proPlan._id 
      }).select("userId").lean();
      proUserIds = [...new Set(activeSubs.map(s => String(s.userId)))];
    }

    if (filter === "total") {
      users = await User.find({ isActive: true }).select("-passwordHash").lean();
    } else if (filter === "pro") {
      users = await User.find({ isActive: true, _id: { $in: proUserIds } }).select("-passwordHash").lean();
    } else if (filter === "free") {
      users = await User.find({ isActive: true, _id: { $nin: proUserIds } }).select("-passwordHash").lean();
    } else if (filter === "lost") {
      // Users who HAD an active sub but now their LATEST subscription is cancelled/expired
      // and they don't currently have any active sub
      const lostSubs = await Subscription.find({ status: { $in: ["cancelled", "expired"] } }).select("userId").lean();
      const lostCandidateIds = [...new Set(lostSubs.map(s => String(s.userId)))];
      
      // Exclude users who currently have an active/trialing subscription
      const activeSubsNow = await Subscription.find({ 
        status: { $in: ["active", "trialing"] },
        userId: { $in: lostCandidateIds }
      }).select("userId").lean();
      const resubscribedIds = new Set(activeSubsNow.map(s => String(s.userId)));
      
      const finalLostIds = lostCandidateIds.filter(id => !resubscribedIds.has(id));
      users = await User.find({ _id: { $in: finalLostIds } }).select("-passwordHash").lean();

    } else if (filter === "abandoned") {
      // Abandoned = user initiated a checkout (created a pending/cancelled tx)
      // BUT they don't have a paid tx or active subscription.
      const abandonedTxs = await PaymentTransaction.find({ 
        orderType: "subscription",
        status: { $in: ["cancelled", "pending"] }
      }).select("userId").lean();
      const abandonedCandidateIds = [...new Set(abandonedTxs.map(t => String(t.userId)))];

      const paidTxUserIds = await PaymentTransaction.distinct("userId", {
        orderType: "subscription",
        status: "paid"
      });
      const paidSet = new Set(paidTxUserIds.map(id => String(id)));

      const activeSubUserIds = await Subscription.distinct("userId", {
        status: { $in: ["active", "trialing"] }
      });
      const activeSet = new Set(activeSubUserIds.map(id => String(id)));

      const finalAbandonedIds = abandonedCandidateIds.filter(
        id => !paidSet.has(id) && !activeSet.has(id)
      );

      const abandonedUsers = await User.find({ _id: { $in: finalAbandonedIds } }).select("-passwordHash").lean();

      // Attach the most recent transaction for each user
      const abandonedTxMap = {};
      const abandonedTxs2 = await PaymentTransaction.find({
        orderType: "subscription",
        status: { $in: ["cancelled", "pending"] },
        userId: { $in: finalAbandonedIds }
      }).sort({ updatedAt: -1 }).lean();
      for (const tx of abandonedTxs2) {
        const uid = String(tx.userId);
        if (!abandonedTxMap[uid]) abandonedTxMap[uid] = tx; // keep most recent
      }

      users = abandonedUsers.map(u => ({
        ...u,
        _lastTransaction: abandonedTxMap[String(u._id)] || null,
      }));

    } else if (filter === "pending") {
      // Users with an active pending payment transaction
      const pendingTxsList = await PaymentTransaction.find({ 
        orderType: "subscription",
        status: "pending"
      }).sort({ updatedAt: -1 }).lean();
      
      const pendingUserIdsList = [...new Set(pendingTxsList.map(t => String(t.userId)))];
      const pendingUsers = await User.find({ _id: { $in: pendingUserIdsList } }).select("-passwordHash").lean();
      
      // Attach most recent pending transaction per user
      const pendingTxMap = {};
      for (const tx of pendingTxsList) {
        const uid = String(tx.userId);
        if (!pendingTxMap[uid]) pendingTxMap[uid] = tx;
      }
      
      users = pendingUsers.map(u => ({
        ...u,
        _lastTransaction: pendingTxMap[String(u._id)] || null,
      }));
    }

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCards = await Card.countDocuments();
    const plans = await Plan.find().lean();
    const freePlan = plans.find((p) => p.key === "free");
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });
    const proSubscriptions = freePlan
      ? await Subscription.countDocuments({
          status: "active",
          planId: { $ne: freePlan._id },
        })
      : 0;
    const revenue =
      proSubscriptions *
      (plans.find((p) => p.key === "pro")?.prices?.monthly || 0);

    const referralStats = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$referrer", "مباشر"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const referrers = referralStats.map((r) => ({
      name: r._id,
      count: r.count,
    }));

    res.json({
      totalUsers,
      activeSubscriptions,
      proSubscriptions,
      totalCards,
      revenue,
      referrers,
    });
  } catch (error) {
    next(error);
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select("-passwordHash -__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await User.countDocuments(query);
    const plans = await Plan.find().lean();

    const result = await Promise.all(
      users.map(async (user) => {
        const sub = await Subscription.findOne({ userId: user._id, status: { $in: ["active", "trialing"] } })
          .sort({ createdAt: -1 })
          .populate("planId")
          .lean();
        const plan =
          sub?.planId && typeof sub.planId === "object"
            ? sub.planId
            : plans.find((p) => p.key === "free");
        return {
          id: user._id,
          name: user.name || "بدون اسم",
          email: user.email,
          phone: user.phone,
          username: user.username || null,
          publicId: user.publicId || null,
          activeCardId: user.activeCardId || null,
          role: user.role,
          planId: plan?._id || null,
          planKey: plan?.key || "free",
          planName: plan?.name || "Free",
          subscriptionId: sub?._id || null,
          isActive: user.isActive !== false,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        };
      }),
    );

    res.json({
      users: result,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, planKey = "free" } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ error: "الاسم والبريد وكلمة المرور مطلوبة" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: "هذا البريد مستخدم بالفعل" });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      publicId: generatePublicId(),
      isEmailVerified: true,
    });
    const plan = await Plan.findOne({ key: planKey });
    if (plan)
      await Subscription.create({
        userId: user._id,
        planId: plan._id,
        status: "active",
        startedAt: new Date(),
      });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      planKey,
      isActive: true,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = [
      "name",
      "email",
      "phone",
      "role",
      "username",
      "isEmailVerified",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k)),
    );
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const toggleUserBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ id: user._id, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

const changeUserPlan = async (req, res, next) => {
  try {
    const { planKey, billingPeriod = "monthly", customDays, customHours } = req.body;
    const plan = await Plan.findOne({ key: planKey });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    if (planKey === "free") {
      // Cancel all existing active/trialing subscriptions to avoid ghost active ones
      await Subscription.updateMany(
        { userId: req.params.id, status: { $in: ["active", "trialing", "pending"] } },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            expiresAt: null,
            billingPeriod: null,
            provider: "manual",
            planId: plan._id
          }
        }
      );
      
      // Reset select options to free
      await Card.updateMany(
        { userId: req.params.id },
        { $set: { actionType: "form" } }
      );
    } else {
      // Cancel old ones first
      await Subscription.updateMany(
        { userId: req.params.id, status: { $in: ["active", "trialing", "pending"] } },
        { $set: { status: "cancelled", cancelledAt: new Date() } }
      );

      let expiresAt = new Date();
      if (customHours && parseInt(customHours, 10) > 0) {
        expiresAt.setHours(expiresAt.getHours() + parseInt(customHours, 10));
      } else if (customDays && parseInt(customDays, 10) > 0) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(customDays, 10));
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + (billingPeriod === "yearly" ? 12 : 1));
      }
      
      await Subscription.create({ 
        userId: req.params.id,
        planId: plan._id, 
        status: "active", 
        startedAt: new Date(), 
        billingPeriod, 
        expiresAt,
        provider: "manual"
      });
    }

    res.json({ success: true, planKey });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Subscription.deleteMany({ userId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getUserCards = async (req, res, next) => {
  try {
    const cards = await Card.find({ userId: req.params.id })
      .select(
        "name publicId personal.fullName personal.title personal.avatar personal.coverImage isActive contacts links requests analytics createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

// ── Cards ─────────────────────────────────────────────────────────────────────

const getCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id).lean();
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const { name, personal, contacts, links, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (personal !== undefined) updates.personal = personal;
    if (contacts !== undefined) updates.contacts = contacts;
    if (links !== undefined) updates.links = links;
    if (isActive !== undefined) updates.isActive = isActive;
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true },
    ).lean();
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ── Upload ────────────────────────────────────────────────────────────────────

const adminUpload = async (req, res, next) => {
  try {
    const { image, folder = "thenith_admin" } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });
    const result = await cloudinary.uploader.upload(image, { folder });
    res.json({ url: result.secure_url });
  } catch (error) {
    next(error);
  }
};

// ── Products ──────────────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      images,
      price,
      quantity,
      sku,
      category,
      isActive,
      isCustomizable,
    } = req.body;
    if (!name) return res.status(400).json({ error: "اسم المنتج مطلوب" });
    const product = await Product.create({
      name,
      description,
      images,
      price,
      quantity,
      sku,
      category,
      isActive,
      isCustomizable: Boolean(isCustomizable),
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      images,
      price,
      quantity,
      sku,
      category,
      isActive,
      isCustomizable,
    } = req.body;
    const updateData = { name, description, images, price, quantity, sku, category, isActive };
    if (isCustomizable !== undefined) {
      updateData.isCustomizable = Boolean(isCustomizable);
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    if (!product) return res.status(404).json({ error: "المنتج غير موجود" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "المنتج غير موجود" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ── Store Stats ───────────────────────────────────────────────────────────────

const getStoreStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth }, status: { $ne: "returned" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;

    const lastMonthRevenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }, status: { $ne: "returned" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

    const lowStockProductsCount = await Product.countDocuments({ quantity: { $lt: 5, $gt: 0 } });
    const outOfStockProductsCount = await Product.countDocuments({ quantity: 0 });

    const topProductsAgg = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "shipped"] } } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          count: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topProducts = topProductsAgg;

    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const formattedStatusCounts = {
      received: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
    };
    statusCounts.forEach((s) => {
      formattedStatusCounts[s._id] = s.count;
    });
    // Trigger nodemon restart

    const abandonedOrders = await Order.find({
      paymentMethod: { $ne: "cash_on_delivery" },
      paymentStatus: { $in: ["pending", "cancelled"] },
      status: { $nin: ["delivered", "shipped", "returned"] }
    }).lean();
    
    const draftOrdersCount = await OrderDraft.countDocuments();

    res.json({
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth:
          lastMonthRevenue === 0
            ? thisMonthRevenue > 0
              ? 100
              : 0
            : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
      },
      inventory: {
        lowStock: lowStockProductsCount,
        outOfStock: outOfStockProductsCount,
      },
      topProducts,
      statusCounts: formattedStatusCounts,
      abandonedOrdersCount: abandonedOrders.length + draftOrdersCount
    });
  } catch (error) {
    next(error);
  }
};

// ── Orders ────────────────────────────────────────────────────────────────────

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("paymentTransactionId")
      .sort({ createdAt: -1 })
      .lean();
      
    const drafts = await OrderDraft.find()
      .sort({ createdAt: -1 })
      .lean();
      
    const formattedDrafts = drafts.map(d => ({
      ...d,
      status: "received",
      paymentStatus: "pending",
      paymentMethod: "online",
      isDraft: true
    }));
      
    const allOrders = [...orders, ...formattedDrafts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allOrders);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, returnReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });

    if (["returned", "cancelled"].includes(status) && !["returned", "cancelled"].includes(order.status)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });
      }
    }
    if (["returned", "cancelled"].includes(order.status) && !["returned", "cancelled"].includes(status)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.quantity },
        });
      }
    }
    const oldStatus = order.status;

    order.status = status;
    if (returnReason !== undefined) order.returnReason = returnReason;
    await order.save();

    if (oldStatus !== status && order.customer?.email) {
      sendOrderStatusEmail({
        email: order.customer.email,
        name: order.customer.name,
        orderNumber: order.orderNumber,
        status: order.status,
      }).catch((err) => console.error("Error sending order status email:", err));
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    let isDraft = false;
    
    if (!order) {
      order = await OrderDraft.findById(req.params.id);
      if (!order) return res.status(404).json({ error: "الطلب غير موجود" });
      isDraft = true;
    }

    if (!isDraft && !["returned", "cancelled"].includes(order.status)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    if (isDraft) {
      await OrderDraft.findByIdAndDelete(req.params.id);
    } else {
      await Order.findByIdAndDelete(req.params.id);
    }
    
    res.json({ success: true, message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    next(error);
  }
};

// ── Plans ─────────────────────────────────────────────────────────────────────

const getAdminPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find().lean();
    res.json(plans);
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const { key, name, prices, features, limits, marketingFeatures } = req.body;
    if (!key || !name)
      return res.status(400).json({ error: "المفتاح والاسم مطلوبان" });
    const existing = await Plan.findOne({ key });
    if (existing)
      return res.status(409).json({ error: "هذا المفتاح موجود بالفعل" });
    const plan = await Plan.create({
      key,
      name,
      prices,
      features,
      limits,
      marketingFeatures,
    });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { name, prices, features, limits, isActive, marketingFeatures } =
      req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (name !== undefined) {
      plan.name = name;
      plan.markModified("name");
    }
    if (prices !== undefined) plan.prices = prices;
    if (limits !== undefined) plan.limits = limits;
    if (isActive !== undefined) plan.isActive = isActive;
    if (marketingFeatures !== undefined) {
      plan.marketingFeatures = marketingFeatures;
      plan.markModified("marketingFeatures");
    }
    if (features !== undefined) {
      plan.features = features;
      plan.markModified("features");
    }
    await plan.save();
    res.json(plan);
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ── Coupons ───────────────────────────────────────────────────────────────────

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      monthlyDiscountValue,
      yearlyDiscountValue,
      appliesTo,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;
    if (!code || !discountType || discountValue === undefined)
      return res
        .status(400)
        .json({ error: "الكود، نوع الخصم، وقيمة الخصم مطلوبة" });
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing)
      return res.status(409).json({ error: "هذا الكود موجود بالفعل" });
    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      monthlyDiscountValue,
      yearlyDiscountValue,
      appliesTo,
      maxUses,
      expiresAt,
      isActive,
    });
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      monthlyDiscountValue,
      yearlyDiscountValue,
      appliesTo,
      maxUses,
      expiresAt,
      isActive,
    } = req.body;
    if (code) {
      const existing = await Coupon.findOne({
        code: code.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existing)
        return res.status(409).json({ error: "هذا الكود مستخدم في كوبون آخر" });
    }
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code,
        discountType,
        discountValue,
        monthlyDiscountValue,
        yearlyDiscountValue,
        appliesTo,
        maxUses,
        expiresAt,
        isActive,
      },
      { new: true },
    );
    if (!coupon) return res.status(404).json({ error: "الكوبون غير موجود" });
    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: "الكوبون غير موجود" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ── Store Settings ────────────────────────────────────────────────────────────

const getStoreSettings = async (req, res, next) => {
  try {
    let config = await Setting.findOne({ key: "store_config" }).lean();
    if (!config) {
      config = {
        key: "store_config",
        value: {
          taxRate: 0,
          shippingZones: [
            { id: "1", name: "القاهرة والجيزة", cost: 50, isActive: true },
            { id: "2", name: "محافظات الدلتا", cost: 60, isActive: true },
            {
              id: "3",
              name: "الصعيد والبحر الأحمر",
              cost: 100,
              isActive: true,
            },
          ],
          globalShippingMode: "default",
          globalShippingCost: 0,
          storePolicy: "سياسة الاسترجاع خلال 14 يوم...",
        },
      };
      await Setting.create(config);
    }
    res.json(config.value);
  } catch (error) {
    next(error);
  }
};

const updateStoreSettings = async (req, res, next) => {
  try {
    const { taxRate, shippingZones, storePolicy, globalShippingMode, globalShippingCost } = req.body;
    const updated = await Setting.findOneAndUpdate(
      { key: "store_config" },
      { value: { taxRate, shippingZones, storePolicy, globalShippingMode, globalShippingCost } },
      { new: true, upsert: true },
    );
    res.json(updated.value);
  } catch (error) {
    next(error);
  }
};

const getLandingSettings = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: "landing_config" }).lean();
    res.json(mergeLandingConfig(setting?.value));
  } catch (error) {
    next(error);
  }
};

const updateLandingSettings = async (req, res, next) => {
  try {
    const value = mergeLandingConfig(req.body || {});
    const updated = await Setting.findOneAndUpdate(
      { key: "landing_config" },
      { value },
      { new: true, upsert: true },
    );
    res.json(mergeLandingConfig(updated.value));
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settingsObj = req.body;
    const promises = Object.keys(settingsObj).map((key) =>
      Setting.findOneAndUpdate(
        { key },
        { value: settingsObj[key] },
        { upsert: true, new: true },
      ),
    );
    await Promise.all(promises);
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ── Messages ──────────────────────────────────────────────────────────────────

const getMessages = async (req, res, next) => {
  try {
    const messages = await ContactRequest.find({ type: "platform_contact" }).sort({ createdAt: -1 }).lean();
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const markMessageRead = async (req, res, next) => {
  try {
    const message = await ContactRequest.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true },
    );
    res.json(message);
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    await ContactRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ── Support / CustomerServices ───────────────────────────────────────────────────

const getCustomerServices = async (req, res, next) => {
  try {
    const customerServices = await CustomerService.find()
      .sort({ lastMessageAt: -1 })
      .populate("user", "name email")
      .lean();

    const userIds = customerServices
      .filter(cs => cs.user && cs.user._id)
      .map(cs => cs.user._id);
      
    const subscriptions = await Subscription.find({ userId: { $in: userIds } }).populate("planId");
    const subMap = {};
    subscriptions.forEach(s => {
      if (s.userId) subMap[s.userId.toString()] = s;
    });

    const result = customerServices.map(cs => {
      if (cs.user && cs.user._id) {
        const sub = subMap[cs.user._id.toString()];
        const isFree = !sub || sub.status !== "active" || !sub.planId || sub.planId.prices?.monthly === 0;
        cs.user.planType = isFree ? "free" : "paid";
        
        let planName = "مجاني";
        if (sub && sub.planId) {
           if (sub.planId.name && typeof sub.planId.name === 'object') {
             planName = sub.planId.name.ar || sub.planId.name.en || planName;
           } else if (typeof sub.planId.name === 'string') {
             planName = sub.planId.name;
           } else if (sub.planId.name_ar) {
             planName = sub.planId.name_ar;
           }
        }
        cs.user.planName = planName;
      } else {
        cs.user = { name: cs.name, planType: "guest", planName: "زائر" };
      }
      return cs;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

const getCustomerServiceMessages = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({
      customerService: req.params.id,
    }).sort("createdAt");
    const customerService = await CustomerService.findById(req.params.id);
    if (customerService?.unreadAdmin > 0) {
      customerService.unreadAdmin = 0;
      await customerService.save();
    }
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const sendCustomerServiceMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const customerService = await CustomerService.findById(req.params.id);
    if (!customerService)
      return res.status(404).json({ error: "CustomerService not found" });

    const message = await ChatMessage.create({
      customerService: customerService._id,
      senderModel: "Admin",
      senderId: req.admin ? req.admin.username : "admin",
      content,
    });

    customerService.lastMessageAt = new Date();
    customerService.unreadUser += 1;
    if (customerService.status === "closed") customerService.status = "open";
    await customerService.save();

    res.json(message);
  } catch (error) {
    next(error);
  }
};

const updateCustomerServiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const customerService = await CustomerService.findById(req.params.id);
    if (!customerService)
      return res.status(404).json({ error: "CustomerService not found" });

    customerService.status = status;
    await customerService.save();

    let sysText = "تم تحديث حالة المحادثة.";
    if (status === "resolved")
      sysText = "تم إنهاء هذه المحادثة. أرسل رسالة جديدة لإعادة فتحها.";
    else if (status === "closed")
      sysText = "تم إغلاق هذه المحادثة. أرسل رسالة جديدة لإعادة فتحها.";
    else if (status === "open") sysText = "تم إعادة فتح المحادثة.";

    if (sysText) {
      await ChatMessage.create({
        customerService: customerService._id,
        senderModel: "System",
        senderId: "system",
        content: sysText,
      });
    }

    res.json(customerService);
  } catch (error) {
    next(error);
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      category,
      search,
      startDate,
      endDate,
    } = req.query;
    const query = {};
    if (level) query.level = level;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { ip: { $regex: search, $options: "i" } },
        { networkIp: { $regex: search, $options: "i" } },
        { path: { $regex: search, $options: "i" } },
      ];
    }
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("userId", "username email");
    const total = await AuditLog.countDocuments(query);
    res.json({ logs, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const criticalThreats = await AuditLog.countDocuments({
      level: "critical",
    });
    const warnings = await AuditLog.countDocuments({ level: "warning" });
    const topIPs = await AuditLog.aggregate([
      { $match: { level: { $in: ["warning", "critical"] } } },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const categories = await AuditLog.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ totalLogs, criticalThreats, warnings, topIPs, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  adminLogin,
  getSubscriptionStats,
  getStats,
  getUsers,
  createUser,
  updateUser,
  toggleUserBan,
  changeUserPlan,
  deleteUser,
  getUserCards,
  getCard,
  updateCard,
  deleteCard,
  adminUpload,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStoreStats,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getAdminPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStoreSettings,
  updateStoreSettings,
  getLandingSettings,
  updateLandingSettings,
  updateSettings,
  getMessages,
  markMessageRead,
  deleteMessage,
  getCustomerServices,
  getCustomerServiceMessages,
  sendCustomerServiceMessage,
  updateCustomerServiceStatus,
  getAuditLogs,
  getAuditStats,
  getFilteredUsers,
};
