import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";

async function expireSubscriptions() {
  const freePlan = await Plan.findOne({ key: "free" });
  if (!freePlan) return 0;

  const result = await Subscription.updateMany(
    {
      status: { $in: ["active", "trialing"] },
      expiresAt: { $lt: new Date() },
    },
    {
      $set: {
        planId: freePlan._id,
        status: "expired",
        billingPeriod: null,
      },
    },
  );

  return result.modifiedCount;
}

function startSubscriptionExpiryJob() {
  const run = async () => {
    try {
      await expireSubscriptions();
    } catch (error) {
    }
  };

  run();
  const interval = setInterval(run, 60 * 60 * 1000);
  return () => clearInterval(interval);
}

export default {
  expireSubscriptions,
  startSubscriptionExpiryJob,
};
