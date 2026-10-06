import Plan from "../models/Plan.js";
import User from "../models/User.js";
import _idGenerator6120 from "../util/idGenerator.js";
const { generatePublicId } = _idGenerator6120;

const NEW_FREE_PLAN = {
  name: { ar: "مجاني", en: "Free" },
  prices: { monthly: 0, yearly: 0 },
  limits: { maxLinks: 3, maxCards: 1, monthlyBusinessRequests: 5 },
  features: {
    contactMethods: true,
    saveContact: true,
    qrCode: true,
    basicAnalytics: true,
    verifiedBadge: false,
    coverImage: false,
    customLink: false,
    reorderLinks: false,
    removeBranding: false,
    advancedAnalytics: false,
    prioritySupport: false,
    futureFeatures: false,
    themeSelection: false,
  },
  marketingFeatures: [
    { name: { ar: "إضافة وسائل الاتصال", en: "Add Contact Methods" }, enabled: true },
    { name: { ar: "حفظ جهة الاتصال", en: "Save Contact" }, enabled: true },
    { name: { ar: "QR Code", en: "QR Code" }, enabled: true },
    { name: { ar: "إحصائيات بسيطة", en: "Basic Analytics" }, enabled: true },
    { name: { ar: "إضافة 3 روابط", en: "Add 3 Links" }, enabled: true },
    { name: { ar: "إنشاء 1 بطاقات عمل", en: "Create 1 Business Card" }, enabled: true },
  ],
};

const NEW_PRO_PLAN = {
  name: { ar: "Pro", en: "Pro" },
  prices: { monthly: 149, yearly: 1499 },
  limits: { maxLinks: null, maxCards: 5, monthlyBusinessRequests: null },
  features: {
    contactMethods: true,
    saveContact: true,
    qrCode: true,
    basicAnalytics: false,
    verifiedBadge: true,
    coverImage: true,
    customLink: true,
    reorderLinks: true,
    calendarBooking: true,
    removeBranding: true,
    advancedAnalytics: true,
    prioritySupport: true,
    futureFeatures: true,
    themeSelection: true,
  },
  marketingFeatures: [
    { name: { ar: "شارة Thenith الموثقة", en: "Verified Thenith Badge" }, enabled: true },
    { name: { ar: "إضافة وسائل الاتصال", en: "Add Contact Methods" }, enabled: true },
    { name: { ar: "إضافة روابط بلا حدود", en: "Unlimited Links" }, enabled: true },
    { name: { ar: "تغيير صورة الغلاف", en: "Cover Image" }, enabled: true },
    { name: { ar: "رابط مخصص احترافي", en: "Professional Custom Link" }, enabled: true },
    { name: { ar: "ترتيب صفحة الروابط", en: "Reorder Links Page" }, enabled: true },
    { name: { ar: "اختيار مظهر", en: "Choose Appearance" }, enabled: true },
    { name: { ar: "إنشاء 5 بطاقات عمل", en: "Create 5 Business Cards" }, enabled: true },
    { name: { ar: "الحصول على طلبات عمل بلا حدود", en: "Unlimited Business Requests" }, enabled: true },
    { name: { ar: "حفظ جهة الاتصال", en: "Save Contact" }, enabled: true },
    { name: { ar: "QR Code", en: "QR Code" }, enabled: true },
    { name: { ar: "إزالة شعار Thenith", en: "Remove Thenith Branding" }, enabled: true },
    { name: { ar: "إحصائيات متقدمة", en: "Advanced Analytics" }, enabled: true },
    { name: { ar: "الأولوية في الدعم الفني", en: "Priority Support" }, enabled: true },
    { name: { ar: "جميع المميزات الجديدة مستقبلًا", en: "All Future Features" }, enabled: true },
    { name: { ar: "تغيير طريقة التواصل (فورم - حجز)", en: "Communication Method (Form / Calendar)" }, enabled: true },

  ],
};

async function seedPlans() {
  await Plan.updateOne(
    { key: "free" },
    { $setOnInsert: NEW_FREE_PLAN },
    { upsert: true },
  );
  await Plan.updateOne(
    { key: "pro" },
    { $setOnInsert: NEW_PRO_PLAN },
    { upsert: true },
  );
}

async function backfillPublicIds() {
  const users = await User.find({
    $or: [{ publicId: { $exists: false } }, { publicId: null }],
  });
  for (const user of users) {
    let publicId;
    do {
      publicId = generatePublicId();
    } while (await User.exists({ publicId }));
    await User.updateOne(
      {
        _id: user._id,
        $or: [{ publicId: { $exists: false } }, { publicId: null }],
      },
      { $set: { publicId } },
    );
  }
}


export default {
  seedPlans,
  backfillPublicIds
};
