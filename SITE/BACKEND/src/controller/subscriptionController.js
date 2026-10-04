import _asyncHandler6935 from "../util/asyncHandler.js";
const { asyncHandler  } = _asyncHandler6935;
import _subscriptionService3438 from "../services/subscriptionService.js";
const { getSubscriptionState  } = _subscriptionService3438;
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import AuditLog from "../models/AuditLog.js";
import Coupon from "../models/Coupon.js";
import _dashboardNotifications1234 from "../util/dashboardNotifications.js";
const { notifyUser } = _dashboardNotifications1234;

// ── GET /api/subscription ─────────────────────────────────────────────────────
const getSubscription = asyncHandler(async (request, response) =>
  response.json(request.subscription),
);

// ── GET /api/subscription/status ─────────────────────────────────────────────
const getSubscriptionStatus = asyncHandler(async (request, response) =>
  response.json(request.subscription),
);

// ── POST /api/subscription/cancel ────────────────────────────────────────────
const cancelSubscription = asyncHandler(async (request, response) => {
  const freePlan = await Plan.findOne({ key: "free" });
  const subscription = await Subscription.findOne({
    userId: request.user._id,
    status: { $in: ["active", "trialing"] },
  }).sort({ createdAt: -1 });

  if (subscription) {
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    if (freePlan) subscription.planId = freePlan._id;
    subscription.expiresAt = null;
    subscription.billingPeriod = null;
    await subscription.save();

    const Card = (await import("../models/Card.js")).default;
    await Card.updateMany(
      { userId: request.user._id },
      { $set: { actionType: "form" } }
    );

    await AuditLog.create({
      message: "subscription_cancelled_by_user",
      category: "payment",
      userId: request.user._id,
      details: { subscriptionId: subscription._id },
      ip: request.ip,
    });

    notifyUser(request.user._id.toString(), {
      type: "subscription_cancelled",
      payload: { id: subscription._id },
    });
  }

  response.json({
    success: true,
    message: "تم إلغاء الاشتراك بنجاح والعودة للباقة المجانية",
    state: await getSubscriptionState(request.user._id),
  });
});


// ── POST /api/subscription/checkout ──────────────────────────────────────────
const createSubscriptionCheckout = asyncHandler(async (req, res) => {
  const { planId, billingPeriod, couponCode } = req.body;
  const user = req.user;

  if (!planId || !billingPeriod) {
    return res.status(400).json({ error: "Missing planId or billingPeriod" });
  }

  const plan = await Plan.findById(planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  let price = billingPeriod === "yearly" ? plan.prices.yearly : plan.prices.monthly;

  // Apply Coupon
  let discount = 0;
  if (couponCode) {
    if (Coupon) {
      const appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (appliedCoupon && appliedCoupon.isActive) {
        let isValid = true;
        if (appliedCoupon.expiresAt && new Date() > new Date(appliedCoupon.expiresAt)) isValid = false;
        if (appliedCoupon.maxUses !== null && appliedCoupon.usedCount >= appliedCoupon.maxUses) isValid = false;
        if (appliedCoupon.appliesTo === "store") isValid = false; // "all" or "subscriptions" allowed

        if (isValid) {
          let discountVal = appliedCoupon.discountValue;
          if (appliedCoupon.appliesTo === "subscriptions" || appliedCoupon.appliesTo === "all") {
             if (billingPeriod === "monthly" && appliedCoupon.monthlyDiscountValue != null) {
               discountVal = appliedCoupon.monthlyDiscountValue;
             } else if (billingPeriod === "yearly" && appliedCoupon.yearlyDiscountValue != null) {
               discountVal = appliedCoupon.yearlyDiscountValue;
             } else if (appliedCoupon.appliesTo === "subscriptions") {
               discountVal = 0;
             }
          }

          if (appliedCoupon.discountType === "percentage") {
            discount = Math.round((price * discountVal) / 100);
          } else {
            discount = Math.min(discountVal, price);
          }
        }
      }
    }
  }

  const subscription = new Subscription({
    userId: user._id,
    planId: plan._id,
    status: "pending",
    billingPeriod,
    startedAt: new Date(),
    provider: "manual"
  });

  subscription.expiresAt = new Date();
  subscription.expiresAt.setMonth(subscription.expiresAt.getMonth() + (billingPeriod === "yearly" ? 12 : 1));
  await subscription.save();

  return res.json({ 
    success: true, 
    message: "Subscription created, pending payment",
    subscriptionId: subscription._id
  });
});

// ── POST /api/subscription/validate-coupon ────────────────────────────────────
const validateCoupon = asyncHandler(async (req, res) => {
  const { planId, billingPeriod, couponCode } = req.body;

  if (!planId || !billingPeriod) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const plan = await Plan.findById(planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  let originalPrice = billingPeriod === "yearly" ? plan.prices.yearly : plan.prices.monthly;
  let discountAmount = 0;
  let finalPrice = originalPrice;
  let isValid = false;
  let message = "No coupon applied";
  let appliedDiscountVal = 0;
  let discountType = "percentage";

  if (couponCode && Coupon) {
    const appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (appliedCoupon && appliedCoupon.isActive) {
      let isDateValid = true;
      if (appliedCoupon.expiresAt && new Date() > new Date(appliedCoupon.expiresAt)) isDateValid = false;
      if (appliedCoupon.maxUses !== null && appliedCoupon.usedCount >= appliedCoupon.maxUses) isDateValid = false;
      if (appliedCoupon.appliesTo === "store") isDateValid = false; 

      if (isDateValid) {
        let discountVal = appliedCoupon.discountValue;
        let canApply = false;

        if (appliedCoupon.appliesTo === "subscriptions" || appliedCoupon.appliesTo === "all") {
           if (billingPeriod === "monthly" && appliedCoupon.monthlyDiscountValue != null) {
             discountVal = appliedCoupon.monthlyDiscountValue;
             canApply = true;
           } else if (billingPeriod === "yearly" && appliedCoupon.yearlyDiscountValue != null) {
             discountVal = appliedCoupon.yearlyDiscountValue;
             canApply = true;
           } else if (appliedCoupon.appliesTo === "all") {
             // Fallback for "all" without specific subscription values
             canApply = true;
           } else if (appliedCoupon.appliesTo === "subscriptions") {
             // Explicitly prevent fallback if the value was null for the selected period
             canApply = false;
           }
        }

        if (canApply && discountVal > 0) {
          isValid = true;
          message = "Coupon applied successfully";
          appliedDiscountVal = discountVal;
          discountType = appliedCoupon.discountType;

          if (appliedCoupon.discountType === "percentage") {
            discountAmount = Math.round((originalPrice * discountVal) / 100);
          } else {
            discountAmount = Math.min(discountVal, originalPrice);
          }
          finalPrice = Math.max(0, originalPrice - discountAmount);
        } else {
          message = "هذا الكوبون لا ينطبق على هذه الباقة";
        }
      }
    }
  }

  return res.json({ 
    success: true, 
    isValid,
    message,
    originalPrice,
    discountAmount,
    finalPrice,
    appliedDiscountVal,
    discountType
  });
});

export default {
  getSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  createSubscriptionCheckout,
  validateCoupon
};
