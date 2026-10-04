import mongoose from 'mongoose';
import CustomerService from 'file:///c:/Users/Adam/Desktop/thenith/site/DASH/back/src/models/CustomerService.js';
import Subscription from 'file:///c:/Users/Adam/Desktop/thenith/site/DASH/back/src/models/Subscription.js';

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/thenith');
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
        const isFree = !sub || sub.status !== "active" || !sub.planId || sub.planId.price === 0;
        cs.user.planType = isFree ? "free" : "paid";
        cs.user.planName = sub?.planId?.name_ar || "مجاني";
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
