import ShippingRate from "../models/ShippingRate.js";

// Get all shipping rates
export const getShippingRates = async (req, res, next) => {
  try {
    const rates = await ShippingRate.find().sort({ governorateAr: 1 });
    res.json(rates);
  } catch (error) {
    next(error);
  }
};

// Create a new shipping rate
export const createShippingRate = async (req, res, next) => {
  try {
    const { governorate, governorateAr, cost, isActive } = req.body;
    const rate = await ShippingRate.create({ governorate, governorateAr, cost, isActive });
    res.json(rate);
  } catch (error) {
    next(error);
  }
};

// Update a shipping rate
export const updateShippingRate = async (req, res, next) => {
  try {
    const { governorate, governorateAr, cost, isActive } = req.body;
    const rate = await ShippingRate.findByIdAndUpdate(
      req.params.id,
      { governorate, governorateAr, cost, isActive },
      { new: true }
    );
    if (!rate) return res.status(404).json({ error: "Shipping rate not found" });
    res.json(rate);
  } catch (error) {
    next(error);
  }
};

// Delete a shipping rate
export const deleteShippingRate = async (req, res, next) => {
  try {
    const rate = await ShippingRate.findByIdAndDelete(req.params.id);
    if (!rate) return res.status(404).json({ error: "Shipping rate not found" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Bulk update shipping cost
export const bulkUpdateShippingCost = async (req, res, next) => {
  try {
    const { cost } = req.body;
    await ShippingRate.updateMany({}, { cost: Number(cost) });
    res.json({ success: true, cost: Number(cost) });
  } catch (error) {
    next(error);
  }
};

export default {
  getShippingRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  bulkUpdateShippingCost,
};
