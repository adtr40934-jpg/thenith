import mongoose from 'mongoose';
import CustomerService from 'file:///c:/Users/Adam/Desktop/thenith/site/DASH/back/src/models/CustomerService.js';
import Subscription from 'file:///c:/Users/Adam/Desktop/thenith/site/DASH/back/src/models/Subscription.js';

async function test() {
  try {
    await mongoose.connect('mongodb+srv://getthenith_db_user:7l19aQ85Z90vXOUs@thenith.rvk7mu4.mongodb.net/thenith');
    const customerServices = await CustomerService.find()
      .sort({ lastMessageAt: -1 })
      .populate("user", "name email")
      .lean();

    const userIds = customerServices.filter(cs => cs.user).map(cs => cs.user._id);
    const subscriptions = await Subscription.find({ userId: { $in: userIds } }).populate("planId");
    const subMap = {};
    subscriptions.forEach(s => subMap[s.userId.toString()] = s);

    const result = customerServices.map(cs => {
      if (cs.user) {
        const sub = subMap[cs.user._id.toString()];
        const isFree = !sub || sub.status !== "active" || !sub.planId || sub.planId.prices?.monthly === 0;
        cs.user.planType = isFree ? "free" : "paid";
        cs.user.planName = sub?.planId?.name?.ar || sub?.planId?.name || "مجاني";
      } else {
        cs.user = { name: cs.name, planType: "guest", planName: "زائر" };
      }
      return cs;
    });
    console.log('Success:', result.length);
  } catch (e) {
    console.error('ERROR:', e.stack);
  } finally {
    process.exit(0);
  }
}
test();
