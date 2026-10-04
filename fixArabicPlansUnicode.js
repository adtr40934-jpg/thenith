const fs = require("fs");
const freeFeatures = [
  {
    name: "\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u062a\u0648\u0627\u0635\u0644",
    enabled: true,
  },
  {
    name: "\u062d\u0641\u0638 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644",
    enabled: true,
  },
  { name: "QR Code", enabled: true },
  {
    name: "\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0623\u0633\u0627\u0633\u064a\u0629",
    enabled: true,
  },
  {
    name: "\u0625\u0646\u0634\u0627\u0621 \u0628\u0637\u0627\u0642\u0629 \u0639\u0645\u0644 \u0648\u0627\u062d\u062f\u0629",
    enabled: true,
  },
  {
    name: "5 \u0637\u0644\u0628\u0627\u062a \u0639\u0645\u0644 \u0634\u0647\u0631\u064a\u064b\u0627",
    enabled: true,
  },
  {
    name: "\u0625\u0636\u0627\u0641\u0629 3 \u0631\u0648\u0627\u0628\u0637",
    enabled: true,
  },
];

const proFeatures = [
  {
    name: "\u0634\u0627\u0631\u0629 Thenith \u0627\u0644\u0645\u0648\u062b\u0642\u0629",
    enabled: true,
  },
  {
    name: "\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u062a\u0648\u0627\u0635\u0644",
    enabled: true,
  },
  {
    name: "\u0625\u0636\u0627\u0641\u0629 \u0631\u0648\u0627\u0628\u0637 \u0628\u0644\u0627 \u062d\u062f\u0648\u062f",
    enabled: true,
  },
  {
    name: "\u062a\u063a\u064a\u064a\u0631 \u0635\u0648\u0631\u0629 \u0627\u0644\u063a\u0644\u0627\u0641",
    enabled: true,
  },
  {
    name: "\u0631\u0627\u0628\u0637 \u0645\u062e\u0635\u0635 \u0627\u062d\u062a\u0631\u0627\u0641\u064a",
    enabled: true,
  },
  {
    name: "\u062a\u0631\u062a\u064a\u0628 \u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0648\u0627\u0628\u0637",
    enabled: true,
  },
  {
    name: "\u0625\u0646\u0634\u0627\u0621 5 \u0628\u0637\u0627\u0642\u0627\u062a \u0639\u0645\u0644",
    enabled: true,
  },
  {
    name: "\u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0637\u0644\u0628\u0627\u062a \u0639\u0645\u0644 \u0628\u0644\u0627 \u062d\u062f\u0648\u062f",
    enabled: true,
  },
  {
    name: "\u062d\u0641\u0638 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644",
    enabled: true,
  },
  { name: "QR Code", enabled: true },
  {
    name: "\u0625\u0632\u0627\u0644\u0629 \u0634\u0639\u0627\u0631 Thenith",
    enabled: true,
  },
  {
    name: "\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629",
    enabled: true,
  },
  {
    name: "\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629 \u0641\u064a \u0627\u0644\u062f\u0639\u0645 \u0627\u0644\u0641\u0646\u064a",
    enabled: true,
  },
  {
    name: "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629 \u0645\u0633\u062a\u0642\u0628\u0644\u064b\u0627",
    enabled: true,
  },
];

async function run() {
  const loginRes = await fetch("http://localhost:4001/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "adam", password: "thenith@2026" }),
  });
  const { token } = await loginRes.json();

  const plansRes = await fetch("http://localhost:4001/api/admin/plans", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const plans = await plansRes.json();

  const freePlan = plans.find((p) => p.key === "free");
  const proPlan = plans.find((p) => p.key === "pro");

  if (freePlan) {
    await fetch(`http://localhost:4001/api/admin/plans/${freePlan._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ marketingFeatures: freeFeatures }),
    });
    console.log("Free Updated!");
  }

  if (proPlan) {
    await fetch(`http://localhost:4001/api/admin/plans/${proPlan._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ marketingFeatures: proFeatures }),
    });
    console.log("Pro Updated!");
  }
}
run();
