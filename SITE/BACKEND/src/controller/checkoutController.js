import OrderDraft from "../models/OrderDraft.js";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ShippingRate from "../models/ShippingRate.js";
import mailService from "../util/mail.js";
import _dashboardNotifications from "../util/dashboardNotifications.js";
const { notifyUser } = _dashboardNotifications;
const { sendOrderEmail } = mailService;

// ── Coupon model (mapped to the shared "coupons" collection from Admin Dashboard) ──
// SITE/backend's DiscountCode collection is "discountcodes" but Admin Dashboard uses "coupons"
// We query the "coupons" collection directly to share coupons with the Admin Dashboard.
const Coupon =
  mongoose.models.Coupon ||
  mongoose.model(
    "Coupon",
    new mongoose.Schema({
      code: { type: String, uppercase: true, trim: true },
      discountType: { type: String }, // "percentage" | "fixed"
      discountValue: { type: Number },
      appliesTo: { type: String }, // "all" | "store" | "subscriptions"
      maxUses: { type: Number, default: null },
      usedCount: { type: Number, default: 0 },
      expiresAt: { type: Date, default: null },
      isActive: { type: Boolean, default: true },
    }),
  );

// POST /api/checkout/validate-coupon
export const validateCoupon = async (req, res) => {
  try {
    const { code, target } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ error: "هذا الكوبون غير موجود." });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ error: "هذا الكوبون غير مفعل." });
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: "انتهت صلاحية هذا الكوبون." });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res
        .status(400)
        .json({ error: "تم استنفاد الحد الأقصى لاستخدام هذا الكوبون." });
    }

    // Validate target: coupon must apply to "all" or "store"
    if (target === "store" && coupon.appliesTo === "subscriptions") {
      return res
        .status(400)
        .json({ error: "هذا الكوبون خاص بالاشتراكات فقط وليس المتجر." });
    }

    return res.json({
      valid: true,
      type: coupon.discountType, // "percentage" | "fixed"
      value: coupon.discountValue,
      code: coupon.code,
    });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء التحقق من الكوبون." });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, customer, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain items." });
    }

    if (
      !customer ||
      !customer.name ||
      !customer.phone ||
      !customer.address ||
      !customer.city
    ) {
      return res.status(400).json({ error: "Incomplete customer details." });
    }

    if (!["online", "cash_on_delivery"].includes(paymentMethod)) {
      return res.status(400).json({
        error: "A supported payment method is required.",
        code: "INVALID_PAYMENT_METHOD",
      });
    }
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ error: "Sign in before placing an order." });
    }

    if (!req.user.phone) {
      return res.status(400).json({ error: "يجب إضافة رقم هاتف لحسابك قبل إتمام الطلب." });
    }

    // 1. Fetch real prices from database
    const productIds = items.map((item) => item.productId || item.id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    let subTotal = 0;
    const finalItems = [];

    for (const item of items) {
      const dbProduct = productsFromDb.find(
        (p) => p._id.toString() === (item.productId || item.id),
      );
      if (!dbProduct) {
        return res
          .status(400)
          .json({ error: `Product not found: ${item.name}` });
      }

      const itemTotal = dbProduct.price * item.quantity;
      subTotal += itemTotal;

      finalItems.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
      });
    }

    // 2. Fetch shipping rate from DB
    let shippingCost = 0;
    const shippingRate = await ShippingRate.findOne({
      $or: [{ governorate: customer.city }, { governorateAr: customer.city }],
    });
    if (shippingRate) {
      shippingCost = shippingRate.cost;
    }

    // 3. Apply coupon from DB
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
      });
      if (appliedCoupon && appliedCoupon.isActive) {
        let isValid = true;
        if (
          appliedCoupon.expiresAt &&
          new Date() > new Date(appliedCoupon.expiresAt)
        )
          isValid = false;
        if (
          appliedCoupon.maxUses !== null &&
          appliedCoupon.usedCount >= appliedCoupon.maxUses
        )
          isValid = false;
        if (appliedCoupon.appliesTo === "subscriptions") isValid = false;

        if (isValid) {
          if (appliedCoupon.discountType === "percentage") {
            discount = Math.round(
              (subTotal * appliedCoupon.discountValue) / 100,
            );
          } else {
            discount = Math.min(appliedCoupon.discountValue, subTotal);
          }
        }
      }
    }

    // 4. Calculate Final Total
    const finalTotal = subTotal + shippingCost - discount;

    if (paymentMethod === "cash_on_delivery") {
      const order = await Order.create({
        userId: req.user._id,
        customer,
        items: finalItems,
        totalAmount: finalTotal,
        shippingCost,
        discount,
        status: "received",
        paymentMethod: "cash_on_delivery",
        paymentMethodName: "Cash on delivery",
        paymentStatus: "pending",
      });

      if (appliedCoupon && discount > 0) {
        appliedCoupon.usedCount += 1;
        await appliedCoupon.save();
      }

      notifyUser(req.user._id.toString(), {
        type: "order_created",
        payload: { id: order._id, name: customer.name },
      });
      sendOrderEmail({
        email: customer.email || req.user.email,
        name: customer.name,
        orderNumber: order.orderNumber,
        items: finalItems,
        totalAmount: finalTotal,
        shippingCost,
        discount,
        paymentMethod: "Cash on delivery",
        customerAddress: `${customer.address}, ${customer.city}`,
        status: "cash_on_delivery",
      }).catch(() => { });

      return res.status(201).json({
        message: "Cash-on-delivery order received.",
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
      });
    }

    // For online payment, create an OrderDraft
    const orderDraft = await OrderDraft.create({
      userId: req.user._id,
      customer,
      items: finalItems,
      totalAmount: finalTotal,
      shippingCost,
      discount,
      couponId: appliedCoupon && discount > 0 ? appliedCoupon._id : null,
      paymentMethod: "online",
    });

    res.status(201).json({
      message: "Checkout prepared. Complete payment to place the order.",
      orderId: orderDraft._id,
      orderNumber: orderDraft.orderNumber,
      amount: finalTotal,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order." });
  }
};
