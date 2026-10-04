const fs = require("fs");

async function updatePlans() {
  // Free Plan Features
  const freeFeatures = [
    { name: "وسائل التواصل", enabled: true },
    { name: "حفظ جهة الاتصال", enabled: true },
    { name: "QR Code", enabled: true },
    { name: "إحصائيات أساسية", enabled: true },
    { name: "إنشاء بطاقة عمل واحدة", enabled: true },
    { name: "5 طلبات عمل شهريًا", enabled: true },
    { name: "إضافة 3 روابط", enabled: true },
  ];

  // Pro Plan Features
  const proFeatures = [
    { name: "شارة Thenith الموثقة", enabled: true },
    { name: "وسائل التواصل", enabled: true },
    { name: "إضافة روابط بلا حدود", enabled: true },
    { name: "تغيير صورة الغلاف", enabled: true },
    { name: "رابط مخصص احترافي", enabled: true },
    { name: "ترتيب صفحة الروابط", enabled: true },
    { name: "إنشاء 5 بطاقات عمل", enabled: true },
    { name: "الحصول على طلبات عمل بلا حدود", enabled: true },
    { name: "حفظ جهة الاتصال", enabled: true },
    { name: "QR Code", enabled: true },
    { name: "إزالة شعار Thenith", enabled: true },
    { name: "إحصائيات متقدمة", enabled: true },
    { name: "الأولوية في الدعم الفني", enabled: true },
    { name: "جميع المميزات الجديدة مستقبلًا", enabled: true },
  ];

  try {
    // 1. Get Token
    const loginRes = await fetch("http://localhost:4001/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "adam", password: "thenith@2026" }),
    });

    if (!loginRes.ok) throw new Error("Login failed");
    const { token } = await loginRes.json();

    // 2. Get Plans
    const plansRes = await fetch("http://localhost:4001/api/admin/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const plans = await plansRes.json();

    const freePlan = plans.find((p) => p.key === "free");
    const proPlan = plans.find((p) => p.key === "pro");

    // 3. Update Free Plan
    if (freePlan) {
      await fetch(`http://localhost:4001/api/admin/plans/${freePlan._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketingFeatures: freeFeatures }),
      });
      console.log("Free plan updated successfully in Arabic");
    }

    // 4. Update Pro Plan
    if (proPlan) {
      await fetch(`http://localhost:4001/api/admin/plans/${proPlan._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketingFeatures: proFeatures }),
      });
      console.log("Pro plan updated successfully in Arabic");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

updatePlans();
