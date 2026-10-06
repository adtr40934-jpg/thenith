import express, { Router } from "express";
import ShippingRate from "../models/ShippingRate.js";
import Setting from "../models/Setting.js";

const router = Router();

// GET all active shipping rates (public for checkout)
router.get("/", async (req, res) => {
  try {
    const rates = await ShippingRate.find({ isActive: true }).sort({
      governorateAr: 1,
    });

    const config = await Setting.findOne({ key: "store_config" }).lean();
    const mode = config?.value?.globalShippingMode;
    const cost = config?.value?.globalShippingCost;

    if (mode === "free") {
      rates.forEach((rate) => { rate.cost = 0; });
    } else if (mode === "fixed" && typeof cost === "number") {
      rates.forEach((rate) => { rate.cost = cost; });
    }

    const safeRates = rates.map((r) => ({
      _id: r._id.toString(),
      id: r._id.toString(),
      governorate: r.governorate,
      governorateAr: r.governorateAr,
      cost: r.cost,
    }));

    res.json(safeRates);
  } catch (err) {
    res.status(500).json({ error: "Failed to load shipping rates" });
  }
});

// POST to seed default shipping rates (if empty)
router.post("/seed", async (req, res) => {
  try {
    const count = await ShippingRate.countDocuments();
    if (count > 0) {
      return res.json({ message: "Shipping rates already seeded", count });
    }

    const defaultRates = [
      { governorate: "Cairo", governorateAr: "القاهرة", cost: 50 },
      { governorate: "Giza", governorateAr: "الجيزة", cost: 50 },
      { governorate: "Alexandria", governorateAr: "الإسكندرية", cost: 60 },
      { governorate: "Qalyubia", governorateAr: "القليوبية", cost: 60 },
      { governorate: "Dakahlia", governorateAr: "الدقهلية", cost: 70 },
      { governorate: "Red Sea", governorateAr: "البحر الأحمر", cost: 100 },
      { governorate: "Aswan", governorateAr: "أسوان", cost: 120 },
      { governorate: "Luxor", governorateAr: "الأقصر", cost: 120 },
    ];

    await ShippingRate.insertMany(defaultRates);
    res.json({ message: "Successfully seeded default rates", data: defaultRates });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed rates" });
  }
});

export default router;
