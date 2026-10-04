import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Usage from "../models/Usage.js";
import Card from "../models/Card.js";
import _subscription788 from "../util/subscription.js";
const { getDaysRemaining  } = _subscription788;
import _entitlements6033 from "../util/entitlements.js";
const { buildEntitlements  } = _entitlements6033;

/**
 * Returns the full subscription state for a given userId.
 * @param {ObjectId|string} userId
 * @param {boolean} includeUsage - Whether to include card usage counts
 */
async function getSubscriptionState(userId, includeUsage = false) {
  const freePlan = await Plan.findOne({ key: "free" });
  const subscription = await Subscription.findOne({ userId })
    .sort({ updatedAt: -1 })
    .populate("planId");

  const isExpired =
    subscription?.expiresAt && subscription.expiresAt <= new Date();
  const isEntitled =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    !isExpired;
  const plan = isEntitled ? subscription.planId : freePlan;
  const definition = plan
    ? plan.toObject()
    : freePlan
      ? freePlan.toObject()
      : { key: "free", features: {}, limits: {} };
  const planKey = definition.key === "pro" ? "pro" : "free";

  const month = new Date().toISOString().slice(0, 7);
  const usageDoc = await Usage.findOne({ userId, month });
  const brUsed = usageDoc?.businessRequests || 0;

  let cardsTotalStored = undefined;
  let cardsUsed = undefined;
  if (includeUsage) {
    cardsTotalStored = await Card.countDocuments({ userId });
    const maxCards = definition.limits?.maxCards ?? null;
    cardsUsed =
      maxCards !== null
        ? Math.min(cardsTotalStored, maxCards)
        : cardsTotalStored;
  }

  const entitlements = buildEntitlements(planKey, definition, {
    businessRequests: brUsed,
    cardsUsed,
    cardsTotalStored,
  });

  return {
    plan: planKey,
    planDetails: definition,
    status: isExpired ? "expired" : subscription?.status || "active",
    startedAt: subscription?.startedAt || null,
    expiresAt: isExpired ? null : subscription?.expiresAt || null,
    billingPeriod: subscription?.billingPeriod || null,
    daysRemaining: isExpired ? 0 : getDaysRemaining(subscription?.expiresAt),
    usage: { month, businessRequests: brUsed },
    entitlements,
  };
}

/**
 * Consumes one business request for the given user, respecting the monthly limit.
 * Returns the updated Usage doc, or null if the limit is reached.
 */
async function consumeBusinessRequest(userId, limit) {
  const month = new Date().toISOString().slice(0, 7);
  if (limit === null || limit === undefined) {
    return Usage.findOneAndUpdate(
      { userId, month },
      { $inc: { businessRequests: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  try {
    await Usage.create({ userId, month, businessRequests: 1 });
    return Usage.findOne({ userId, month });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const usage = await Usage.findOneAndUpdate(
    { userId, month, businessRequests: { $lt: limit } },
    { $inc: { businessRequests: 1 } },
    { new: true },
  );
  if (!usage) return null;
  return usage;
}


export default {
  getSubscriptionState,
  consumeBusinessRequest
};
