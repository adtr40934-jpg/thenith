import CustomerService from "../models/CustomerService.js";
import ChatMessage from "../models/ChatMessage.js";

async function cleanupCustomerServices() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oldCustomerServices = await CustomerService.find({
    status: { $in: ["closed", "resolved"] },
    updatedAt: { $lt: sevenDaysAgo },
  });

  if (!oldCustomerServices.length) return 0;

  const customerServiceIds = oldCustomerServices.map((customerService) => customerService._id);
  await ChatMessage.deleteMany({ customerService: { $in: customerServiceIds } });
  await CustomerService.deleteMany({ _id: { $in: customerServiceIds } });
  return customerServiceIds.length;
}

async function startCustomerServiceCleanupJob() {
  const run = async () => {
    try {
      const deletedCount = await cleanupCustomerServices();
      if (deletedCount) {
        console.log(
          `[Job:cleanupCustomerServices] Deleted ${deletedCount} old customerServices and their messages.`,
        );
      }
    } catch (error) {
    }
  };

  run();
  const interval = setInterval(run, 24 * 60 * 60 * 1000);
  return () => clearInterval(interval);
}

export default {
  cleanupCustomerServices,
  startCustomerServiceCleanupJob
};
