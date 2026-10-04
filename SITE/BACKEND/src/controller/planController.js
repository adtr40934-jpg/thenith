import _asyncHandler9213 from "../util/asyncHandler.js";
const { asyncHandler  } = _asyncHandler9213;
import Plan from "../models/Plan.js";

import Coupon from "../models/Coupon.js";

// ── GET /api/plans ────────────────────────────────────────────────────────────
const getPlans = asyncHandler(async (_request, response) => {
  const plans = await Plan.find({ isActive: true }).sort({ key: 1 }).lean();
  
  // Find the best active coupon for subscriptions (or all)
  const now = new Date();
  const activeCoupon = await Coupon.findOne({
    isActive: true,
    appliesTo: { $in: ["subscriptions", "all"] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    $expr: {
      $or: [
        { $eq: ["$maxUses", null] },
        { $lt: ["$usedCount", "$maxUses"] }
      ]
    }
  }).sort({ discountValue: -1 }).lean();

  // Apply active coupon logic to calculate final prices for each plan
  const plansWithCalculatedPrices = plans.map(plan => {
    let monthlyDiscountVal = 0;
    let yearlyDiscountVal = 0;
    let canApplyMonthly = false;
    let canApplyYearly = false;

    if (activeCoupon) {
      if (activeCoupon.appliesTo === "subscriptions" || activeCoupon.appliesTo === "all") {
        if (activeCoupon.monthlyDiscountValue != null) {
          monthlyDiscountVal = activeCoupon.monthlyDiscountValue;
          canApplyMonthly = true;
        } else if (activeCoupon.appliesTo === "all") {
          monthlyDiscountVal = activeCoupon.discountValue;
          canApplyMonthly = true;
        }

        if (activeCoupon.yearlyDiscountValue != null) {
          yearlyDiscountVal = activeCoupon.yearlyDiscountValue;
          canApplyYearly = true;
        } else if (activeCoupon.appliesTo === "all") {
          yearlyDiscountVal = activeCoupon.discountValue;
          canApplyYearly = true;
        }
      }
    }

    const calcDiscount = (price, discountVal, discountType, canApply) => {
      if (!canApply || discountVal <= 0) return 0;
      if (discountType === "percentage") {
        return Math.round((price * discountVal) / 100);
      }
      return Math.min(discountVal, price);
    };

    const monthlyPrice = plan.prices?.monthly || 0;
    const yearlyPrice = plan.prices?.yearly || 0;

    const monthlyDiscountAmount = calcDiscount(monthlyPrice, monthlyDiscountVal, activeCoupon?.discountType, canApplyMonthly);
    const yearlyDiscountAmount = calcDiscount(yearlyPrice, yearlyDiscountVal, activeCoupon?.discountType, canApplyYearly);

    return {
      ...plan,
      calculatedPrice: {
        monthly: {
          originalPrice: monthlyPrice,
          finalPrice: Math.max(0, monthlyPrice - monthlyDiscountAmount),
          discountAmount: monthlyDiscountAmount,
          appliedDiscountVal: monthlyDiscountVal,
          discountType: activeCoupon?.discountType || "percentage"
        },
        yearly: {
          originalPrice: yearlyPrice,
          finalPrice: Math.max(0, yearlyPrice - yearlyDiscountAmount),
          discountAmount: yearlyDiscountAmount,
          appliedDiscountVal: yearlyDiscountVal,
          discountType: activeCoupon?.discountType || "percentage"
        }
      }
    };
  });

  response.json({ plans: plansWithCalculatedPrices, activeCoupon });
});


export default { getPlans };
