/**
 * src/controller/paymentController.js
 *
 * Payment gateway integration — Fawaterak v3
 * ──────────────────────────────────────────
 * Endpoints:
 *  GET  /api/payment/methods          — list available payment methods
 *  POST /api/payment/subscription     — create subscription payment intent
 *  POST /api/payment/order/:orderId   — create order payment intent
 *  POST /api/payment/verify           — verify transaction & activate record
 *  POST /api/payment/webhook          — Fawaterak webhook (unsigned for now)
 */

import mongoose from "mongoose";
import _asyncHandler from "../util/asyncHandler.js";
const { asyncHandler } = _asyncHandler;

import fawaterak from "../services/fawaterakService.js";
import Subscription from "../models/Subscription.js";
import Order from "../models/Order.js";
import OrderDraft from "../models/OrderDraft.js";
import Plan from "../models/Plan.js";
import AuditLog from "../models/AuditLog.js";
import Coupon from "../models/Coupon.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import _dashboardNotifications1234 from "../util/dashboardNotifications.js";
const { notifyUser } = _dashboardNotifications1234;
import _subscriptionService from "../services/subscriptionService.js";
const { getSubscriptionState } = _subscriptionService;
import _env from "../config/env.js";
const { env } = _env;
import mailService from "../util/mail.js";
const { sendSubscriptionEmail, sendOrderEmail } = mailService;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeFawaterakData(data) {
  if (!data || typeof data !== "object") return data;
  const sensitiveKeys = new Set([
    "api_key",
    "apikey",
    "secret",
    "client_secret",
    "clientsecret",
    "token",
    "access_token",
    "accesstoken",
    "password",
    "authorization",
    "auth",
    "private_key",
  ]);

  if (Array.isArray(data)) {
    return data.map(sanitizeFawaterakData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (sensitiveKeys.has(cleanKey)) continue;
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeFawaterakData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function getRedirectionUrls(req, extraQuery = "") {
  const base =
    env.APP_URL ||
    `${req.protocol}://${req.get("host").replace(":4000", ":3000")}`;
  return {
    successUrl: `${base}/payment/success${extraQuery}`,
    failUrl: `${base}/payment/fail`,
    pendingUrl: `${base}/payment/pending`,
    webhookUrl: `${base.replace(":3000", ":4000")}/api/payment/webhook`,
  };
}

function buildCustomer(user, extra = {}) {
  const nameParts = (user.name || "").trim().split(" ");
  return {
    firstName: nameParts[0] || "User",
    lastName: nameParts.slice(1).join(" ") || ".",
    email: user.email || "",
    phone: user.phone || extra.phone || "",
    address: user.address || "",
    userId: user._id,
  };
}

async function processVerifiedPayment(pTx, txData) {
  // 1. Check idempotency (Already Paid)
  if (pTx.status === "paid") {
    return { success: true, alreadyProcessed: true };
  }

  // 2. Verify Amount (Crucial Security Check)
  // Expected amount is set server-side when order/intent is created
  const expectedAmount = Number(pTx.amount || 0);
  // Actual amount from Fawaterak verified transaction
  const actualAmount = Number(txData.total || txData.amount || txData.invoice_amount || 0);

  if (Math.abs(expectedAmount - actualAmount) > 0.1) {
    
    // Mark as suspicious
    pTx.status = "suspicious_amount";
    pTx.fawaterakLogs.push({
      action: "verify_amount_failed",
      data: txData,
      note: `Amount mismatch. Expected ${expectedAmount}, got ${actualAmount}`
    });
    await pTx.save();
    return { success: false, error: "amount_mismatch" };
  }

  // 3. Mark as paid securely
  pTx.status = "paid";
  pTx.paymentMethodName = txData.payment_method;
  pTx.fawaterakResponse = txData;
  pTx.paidAt = new Date(txData.paid_at || Date.now());
  pTx.fawaterakLogs.push({ action: "verify_success", data: txData });
  await pTx.save();

  // 4. Activate business logic atomically
  const orderType = txData.pay_load?.order_type || pTx.orderType;
  if (orderType === "subscription") {
    const subscription = await Subscription.findById(pTx.referenceId);
    if (subscription) {
      await activateSubscription(subscription, txData, pTx);
    }
  } else if (orderType === "store") {
    await finalizeStoreOrder(pTx, txData);
  }

  return { success: true, alreadyProcessed: false };
}

async function activateSubscription(subscription, txData, pTx) {
  if (pTx && pTx.paymentData && pTx.paymentData.targetPlanId) {
    subscription.planId = pTx.paymentData.targetPlanId;
    subscription.billingPeriod = pTx.paymentData.targetBillingPeriod;
    subscription.expiresAt =
      pTx.paymentData.targetExpiresAt || subscription.expiresAt;
    subscription.startedAt = new Date();
  }

  subscription.status = "active";
  subscription.provider = "fawaterak";
  subscription.paidAt = new Date(txData.paid_at || Date.now());
  // Source of truth: use pTx.amount (set from DB plan price at checkout creation)
  // Fallback to txData.total only if pTx.amount is unavailable
  subscription.paidAmount = (pTx && pTx.amount) ? pTx.amount : (txData.total || 0);
  subscription.paymentMethod = txData.payment_method;
  subscription.intentKey = txData.intent_key;
  subscription.transactionId = String(txData.transaction_id || txData.invoice_id || "");
  if (txData.transaction_history?.[0]?.reference) {
    subscription.fawaterakRef = txData.transaction_history[0].reference;
  }
  await subscription.save();

  // Send activation email
  try {
    const subUser = await mongoose.model("User").findById(subscription.userId);
    const subPlan = await Plan.findById(subscription.planId);
    if (subUser && subPlan) {
      sendSubscriptionEmail({
        email: subUser.email,
        name: subUser.name,
        planName:
          subPlan.name?.ar ||
          subPlan.name?.en ||
          (typeof subPlan.name === "string" ? subPlan.name : "Pro"),
        billingPeriod: subscription.billingPeriod || "monthly",
        amount: subscription.paidAmount || txData.total,
        invoiceDate: new Date(
          subscription.paidAt || Date.now(),
        ).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        startDate: new Date(
          subscription.startedAt || Date.now(),
        ).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        endDate: subscription.expiresAt
          ? new Date(subscription.expiresAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined,
        status: "active",
        paymentMethodName: txData.payment_method || null,
      }).catch(() => {});
    }
  } catch (err) {
  }

  // Update cards to keep their current actionType
  await AuditLog.create({
    message: "subscription_activated_via_fawaterak",
    category: "payment",
    userId: subscription.userId,
    details: {
      subscriptionId: subscription._id,
      intentKey: subscription.intentKey,
      transactionId: subscription.transactionId,
      amount: txData.total,
      method: txData.payment_method,
      fawaterakResponse: txData,
    },
  }).catch(() => {}); // Non-critical

  if (subscription.userId) {
    notifyUser(subscription.userId.toString(), {
      type: "subscription_created",
      payload: { id: subscription._id, planId: subscription.planId },
    });
  }
}

function getOrderPaymentMethod(pTx, txData) {
  const methodName = String(
    txData?.payment_method || pTx?.paymentMethodName || "",
  ).trim();
  const normalizedName = methodName.toLowerCase();
  const methodId = Number(pTx?.paymentMethodId || txData?.payment_method_id);

  if (/fawry|فوري/.test(normalizedName) || methodId === 3) {
    return { paymentMethod: "fawry", paymentMethodName: methodName || "Fawry" };
  }
  if (/meeza|wallet|محفظ/.test(normalizedName) || methodId === 4) {
    return {
      paymentMethod: "meeza",
      paymentMethodName: methodName || "Meeza / Mobile Wallet",
    };
  }
  if (/visa|master|card|بطاقة/.test(normalizedName) || methodId === 2) {
    return {
      paymentMethod: "card",
      paymentMethodName: methodName || "Visa / Mastercard",
    };
  }
  return {
    paymentMethod: "online",
    paymentMethodName: methodName || "Online payment",
  };
}

async function activateOrder(order, txData, pTx) {
  const paymentMethod = getOrderPaymentMethod(pTx, txData);
  order.paymentMethod = paymentMethod.paymentMethod;
  order.paymentMethodName = paymentMethod.paymentMethodName;
  order.paymentStatus = "paid";
  order.paidAt = new Date(txData.paid_at || Date.now());
  order.transactionId = String(txData.transaction_id || txData.invoice_id || "");
  if (txData.transaction_history?.[0]?.reference) {
    order.fawaterakRef = txData.transaction_history[0].reference;
  }
  await order.save();

  try {
    const orderUser = await mongoose.model("User").findById(order.userId);
    if (orderUser || order.customer?.email) {
      sendOrderEmail({
        email: order.customer?.email || orderUser?.email,
        name: order.customer?.name || orderUser?.name,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0,
        paymentMethod: order.paymentMethodName,
        customerAddress: order.customer
          ? `${order.customer.address}, ${order.customer.city || ""}`
          : "",
        status: "paid",
      }).catch(() => {});
    }
  } catch (err) {
  }

  await AuditLog.create({
    message: "order_paid_via_fawaterak",
    category: "payment",
    userId: order.userId,
    details: {
      orderId: order._id,
      intentKey: order.intentKey,
      amount: txData.total,
      method: order.paymentMethodName,
      fawaterakResponse: txData,
    },
  }).catch(() => {});
}

async function finalizeStoreOrder(pTx, txData) {
  let order =
    (await Order.findOne({ paymentTransactionId: pTx._id })) ||
    (await Order.findOne({ intentKey: pTx.intentKey }));
  let created = false;

  if (!order) {
    const draft = await OrderDraft.findById(pTx.referenceId);
    if (!draft) return null;

    order = new Order({
      orderNumber: draft.orderNumber,
      userId: draft.userId,
      customer: draft.customer,
      items: draft.items,
      totalAmount: draft.totalAmount,
      shippingCost: draft.shippingCost,
      discount: draft.discount,
      status: "received",
      paymentMethod: "online",
      paymentStatus: "pending",
      intentKey: pTx.intentKey,
      paymentTransactionId: pTx._id,
    });

    try {
      await order.save();
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
      order =
        (await Order.findOne({ paymentTransactionId: pTx._id })) ||
        (await Order.findOne({ intentKey: pTx.intentKey }));
      if (!order) throw error;
    }

    await OrderDraft.deleteOne({ _id: draft._id });
    pTx.referenceId = order._id;
    await pTx.save();

    if (created && draft.couponId) {
      await Coupon.updateOne(
        { _id: draft.couponId },
        { $inc: { usedCount: 1 } },
      );
    }
    if (created && draft.userId) {
      notifyUser(draft.userId.toString(), {
        type: "order_created",
        payload: { id: order._id, name: draft.customer.name },
      });
    }
  }

  if (order.paymentStatus !== "paid") {
    await activateOrder(order, txData, pTx);
  }
  return order;
}

// ── GET /api/payment/methods ──────────────────────────────────────────────────

export const getPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const methods = await fawaterak.getPaymentMethods();
    if (Array.isArray(methods) && methods.length > 0) {
      return res.json({ success: true, methods });
    }
  } catch (err) {
  }

  // Resilient fallback list matching Fawaterak active integrations
  const fallbackMethods = [
    {
      payment_method_id: 2,
      name_en: "Visa-Mastercard",
      name_ar: "بطاقة بنكية (فيزا / ماستركارد)",
      redirect: "true",
      logo: "https://app.fawaterk.com/clients/payment_options/mastercard-visa.png",
      commission_on_customer: 2,
      integration_status: 1,
    },
    {
      payment_method_id: 3,
      name_en: "Fawry",
      name_ar: "فوري (Fawry Pay)",
      redirect: "false",
      logo: "https://app.fawaterk.com/clients/payment_options/fawry.png",
      commission_on_customer: 2,
      integration_status: 1,
    },
    {
      payment_method_id: 4,
      name_en: "Meeza Digital / Mobile Wallets",
      name_ar: "المحافظ الإلكترونية (فودافون كاش، اتصالات، أورنج، وي، ميزة)",
      redirect: "false",
      logo: "https://app.fawaterk.com/clients/payment_options/MeezaDigitalSmall.png",
      commission_on_customer: 1,
      integration_status: 1,
    },
  ];

  res.json({ success: true, methods: fallbackMethods });
});

// ── POST /api/payment/subscription ───────────────────────────────────────────
// Body: { planId, billingPeriod, methodId?, walletNumber?, couponCode? }

export const createSubscriptionPayment = asyncHandler(async (req, res) => {
  const { planId, billingPeriod, methodId, walletNumber, couponCode } =
    req.body;
  const user = req.user;

  if (!planId || !billingPeriod) {
    return res
      .status(400)
      .json({ error: "planId and billingPeriod are required" });
  }

  // Check if there are any existing pending transactions for subscriptions
  const pendingTxs = await PaymentTransaction.find({
    userId: user._id,
    status: "pending",
    orderType: "subscription"
  });
  
  if (pendingTxs.length > 0) {
    return res.status(400).json({
      error: "يوجد عملية دفع لاشتراك قيد الانتظار بالفعل. يرجى إكمالها أو إلغائها من لوحة التحكم قبل بدء عملية جديدة.",
      code: "PENDING_PAYMENT_EXISTS",
      pendingTx: pendingTxs[0]
    });
  }

  // Validate electronic wallet number if provided
  if (walletNumber) {
    const cleanWallet = String(walletNumber)
      .trim()
      .replace(/[\s\-\(\)\.]/g, "");
    if (!/^01[0125][0-9]{8}$/.test(cleanWallet)) {
      return res.status(400).json({
        error:
          "رقم المحفظة الإلكترونية غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015.",
        code: "INVALID_WALLET_NUMBER",
      });
    }
  }

  const plan = await Plan.findById(planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });

  let price =
    billingPeriod === "yearly" ? plan.prices.yearly : plan.prices.monthly;
  let discount = 0;
  let appliedCoupon = null;

  // Apply coupon if provided
  if (couponCode) {
    appliedCoupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
    });
    if (appliedCoupon?.isActive) {
      let valid = true;
      if (
        appliedCoupon.expiresAt &&
        new Date() > new Date(appliedCoupon.expiresAt)
      )
        valid = false;
      if (
        appliedCoupon.maxUses !== null &&
        appliedCoupon.usedCount >= appliedCoupon.maxUses
      )
        valid = false;
      if (appliedCoupon.appliesTo === "store") valid = false;

      if (valid) {
        let discountVal = appliedCoupon.discountValue;
        if (
          billingPeriod === "monthly" &&
          appliedCoupon.monthlyDiscountValue != null
        ) {
          discountVal = appliedCoupon.monthlyDiscountValue;
        } else if (
          billingPeriod === "yearly" &&
          appliedCoupon.yearlyDiscountValue != null
        ) {
          discountVal = appliedCoupon.yearlyDiscountValue;
        }
        discount =
          appliedCoupon.discountType === "percentage"
            ? Math.round((price * discountVal) / 100)
            : Math.min(discountVal, price);
      }
    }
  }

  const finalAmount = Math.max(price - discount, 1); // Minimum 1 EGP

  // Retrieve the existing (default Free) subscription
  const existingSub = await Subscription.findOne({ userId: user._id });
  if (!existingSub) {
    return res.status(404).json({ error: "لا يوجد اشتراك حالي للمستخدم." });
  }

  // Calculate new expiration date
  const expiresAt = new Date();
  expiresAt.setMonth(
    expiresAt.getMonth() + (billingPeriod === "yearly" ? 12 : 1),
  );

  // Create Fawaterak transaction (do NOT modify the existing subscription yet)
  const urls = getRedirectionUrls(
    req,
    `?type=subscription&id=${existingSub._id}`,
  );
  const txData = await fawaterak.createTransaction({
    amount: finalAmount,
    methodId: methodId || null,
    walletNumber: walletNumber || null,
    customer: buildCustomer(user, { phone: walletNumber }),
    orderId: existingSub._id,
    orderType: "subscription",
    ...urls,
  });

  // Create detailed transaction record containing target plan
  await PaymentTransaction.create({
    userId: user._id,
    referenceId: existingSub._id,
    orderType: "subscription",
    intentKey: txData.intent_key,
    amount: finalAmount,
    paymentMethodId: methodId || null,
    checkoutUrl: txData.url || null,
    paymentData: {
      ...(txData.payment_data || {}),
      targetPlanId: plan._id,
      targetBillingPeriod: billingPeriod,
      targetExpiresAt: expiresAt,
    },
    fawaterakResponse: txData,
    fawaterakLogs: [
      {
        action: "create",
        data: txData,
      },
    ],
  });

  // Increment coupon usage
  if (appliedCoupon && discount > 0) {
    appliedCoupon.usedCount += 1;
    await appliedCoupon.save();
  }

  res.json({
    success: true,
    intentKey: txData.intent_key,
    // Hosted checkout URL (present when no methodId or redirect="true")
    checkoutUrl: txData.url || null,
    paymentData: txData.payment_data || null,
    invoiceInfo: sanitizeFawaterakData(txData),
    subscriptionId: existingSub._id,
    transactionId:
      txData.transaction_id || txData.invoice_id || txData.intent_key,
    orderNumber: null, // Subscriptions don't have order numbers
    amount: finalAmount,
  });
});

// ── POST /api/payment/order/:orderId ─────────────────────────────────────────
// Initiates payment for an existing COD order that the user wants to pay online
// OR creates a new order with online payment

export const createOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { methodId, walletNumber } = req.body;
  const user = req.user;

  let order = await Order.findById(orderId);
  let draft = null;
  if (order && (!order.userId || !order.userId.equals(user._id))) {
    return res.status(403).json({ error: "غير مصرح لك بسداد هذا الطلب" });
  }
  if (order?.paymentStatus === "paid") {
    return res.status(400).json({ error: "Order already paid" });
  }
  if (!order) {
    draft = await OrderDraft.findOne({
      _id: orderId,
      userId: user._id,
      expiresAt: { $gt: new Date() },
    });
    if (!draft)
      return res.status(404).json({ error: "Checkout draft not found" });
  }
  const checkout = order || draft;

  if (user) {
    // Check if there are any existing pending transactions for this user
    const pendingTxs = await PaymentTransaction.find({
      userId: user._id,
      status: "pending",
      orderType: "store"
    });
    
    if (pendingTxs.length > 0) {
      return res.status(400).json({
        error: "يوجد طلب متجر قيد الانتظار بالفعل. يرجى إكماله أو إلغائه أولاً.",
        code: "PENDING_PAYMENT_EXISTS",
        pendingTx: pendingTxs[0]
      });
    }
  }

  if (walletNumber) {
    const cleanWallet = String(walletNumber)
      .trim()
      .replace(/[\s\-\(\)\.]/g, "");
    if (!/^01[0125][0-9]{8}$/.test(cleanWallet)) {
      return res.status(400).json({
        error:
          "رقم المحفظة الإلكترونية غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015.",
        code: "INVALID_WALLET_NUMBER",
      });
    }
  }

  const customer = {
    firstName: (checkout.customer.name || "").split(" ")[0] || "User",
    lastName:
      (checkout.customer.name || "").split(" ").slice(1).join(" ") || ".",
    email: checkout.customer.email || user?.email || "",
    phone: checkout.customer.phone || walletNumber || user?.phone || "",
    address: checkout.customer.address || "",
    userId: checkout.userId,
  };

  const urls = getRedirectionUrls(req, `?type=order&id=${checkout._id}`);
  const txData = await fawaterak.createTransaction({
    amount: checkout.totalAmount,
    methodId: methodId || null,
    walletNumber: walletNumber || null,
    customer,
    orderId: checkout._id,
    orderType: "store",
    ...urls,
  });

  if (order) {
    order.intentKey = txData.intent_key;
    order.paymentMethod = "online";
    await order.save();
  }

  // Create detailed transaction record
  await PaymentTransaction.create({
    userId: user._id,
    referenceId: checkout._id,
    orderType: "store",
    intentKey: txData.intent_key,
    amount: checkout.totalAmount,
    paymentMethodId: methodId || null,
    checkoutUrl: txData.url || null,
    paymentData: {
      ...(txData.payment_data || {}),
      ...(draft ? { checkoutDraftId: String(draft._id) } : {}),
    },
    fawaterakResponse: txData,
    fawaterakLogs: [
      {
        action: "create",
        data: txData,
      },
    ],
  });

  res.json({
    success: true,
    intentKey: txData.intent_key,
    checkoutUrl: txData.url || null,
    paymentData: txData.payment_data || null,
    invoiceInfo: sanitizeFawaterakData(txData),
    orderId: checkout._id,
    orderNumber: order?.orderNumber || null,
    transactionId:
      txData.transaction_id || txData.invoice_id || txData.intent_key,
    amount: checkout.totalAmount,
  });
});

// ── POST /api/payment/verify ──────────────────────────────────────────────────
// Body: { intentKey }
// Called by frontend after redirect from Fawaterak to confirm payment status

export const verifyPayment = asyncHandler(async (req, res) => {
  const { intentKey } = req.body;

  if (!intentKey) {
    return res.status(400).json({ error: "intentKey is required" });
  }

  let effectiveIntentKey = intentKey;
  if (mongoose.Types.ObjectId.isValid(intentKey)) {
    const sub = await Subscription.findById(intentKey);
    if (sub?.intentKey) {
      effectiveIntentKey = sub.intentKey;
    } else {
      const ord = await Order.findById(intentKey);
      if (ord?.intentKey) {
        effectiveIntentKey = ord.intentKey;
      } else {
        const ptx =
          (await PaymentTransaction.findOne({
            orderType: "store",
            $or: [
              { referenceId: intentKey },
              { "paymentData.checkoutDraftId": String(intentKey) },
            ],
          })) || (await PaymentTransaction.findById(intentKey));
        if (ptx?.intentKey) effectiveIntentKey = ptx.intentKey;
      }
    }
  }

  // Fetch live status from Fawaterak
  let txData;
  try {
    txData = await fawaterak.getTransactionData(effectiveIntentKey);
  } catch (err) {
    return res.json({
      success: false,
      status: "pending",
      message: err.message || "Payment is still processing",
    });
  }

  const isPaid = txData.paid === 1 || txData.status_text === "paid";

  // Update PaymentTransaction securely
  const pTx = await PaymentTransaction.findOne({
    intentKey: effectiveIntentKey,
  });
  
  if (!pTx) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  // Authorize User (Ownership Check)
  // verifyPayment is protected by requireAuth, so req.user exists
  if (pTx.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Unauthorized access to this payment" });
  }

  if (!isPaid) {
    // If not paid but pending/failed, just update the status safely
    if (pTx.status !== "paid" && pTx.status !== "suspicious_amount") {
      pTx.status = txData.status_text === "failed" || txData.status_text === "expired" ? "failed" : "pending";
      pTx.paymentMethodName = txData.payment_method;
      pTx.fawaterakResponse = txData;

      // Prevent duplicate logging (only log if status changes to avoid large arrays)
      const lastLog = pTx.fawaterakLogs[pTx.fawaterakLogs.length - 1];
      if (!lastLog || lastLog.action !== "verify" || lastLog.data?.status_text !== txData.status_text) {
        pTx.fawaterakLogs.push({ action: "verify", data: txData });
      }
      
      await pTx.save();
    }

    return res.json({
      success: false,
      status: txData.status_text || "pending",
      message: "Payment not confirmed yet",
    });
  }

  // Payment is confirmed by Fawaterak! Process it securely via our robust helper
  const processResult = await processVerifiedPayment(pTx, txData);
  
  if (!processResult.success && processResult.error === "amount_mismatch") {
    return res.status(400).json({
      success: false,
      status: "failed",
      message: "Payment amount does not match expected amount. Please contact support.",
    });
  }

  // Resolve what this intentKey belongs to for UI updates
  const orderType = txData.pay_load?.order_type || pTx.orderType;

  if (orderType === "subscription") {
    const subscription = await Subscription.findById(pTx.referenceId);
    const state = subscription
      ? await getSubscriptionState(subscription.userId)
      : null;
    return res.json({
      success: true,
      status: "paid",
      type: "subscription",
      state,
      intentKey: effectiveIntentKey,
      transactionId:
        txData.transaction_id || txData.invoice_id || effectiveIntentKey,
      amount: txData.amount || txData.invoice_amount || pTx.amount,
      paymentMethodName: txData.payment_method || pTx.paymentMethodName,
    });
  }

  if (orderType === "store") {
    const order = await Order.findOne({ paymentTransactionId: pTx._id }) || await Order.findOne({ intentKey: pTx.intentKey });
    return res.json({
      success: true,
      status: "paid",
      type: "store",
      orderId: order?._id,
      orderNumber: order?.orderNumber,
      intentKey: effectiveIntentKey,
      transactionId:
        txData.transaction_id || txData.invoice_id || effectiveIntentKey,
      amount: txData.amount || txData.invoice_amount || pTx.amount,
      paymentMethodName: txData.payment_method || pTx.paymentMethodName,
    });
  }

  res.json({ success: true, status: "paid", type: "unknown" });
});

// ── POST /api/payment/webhook ─────────────────────────────────────────────────
// Fawaterak calls this URL when a payment succeeds (configured in redirectionUrls.webhookUrl)
// This is the reliable source of truth — always fires before the customer redirect

export const handleWebhook = asyncHandler(async (req, res) => {
  // Fawaterak sends the intent data in the request body
  const body = req.body;
  const intentKey = body?.intent_key || body?.data?.intent_key;

  await AuditLog.create({
    message: "fawaterak_webhook_received",
    category: "payment",
    level: "info",
    isExternal: true,
    details: {
      payload: body,
      fawaterakResponse: body,
    },
  }).catch(() => {});
  const paid =
    body?.paid === 1 || body?.paid === "1" || body?.status_text === "paid";

  if (!intentKey) {
    return res
      .status(400)
      .json({ error: "Missing intent_key in webhook body" });
  }

  if (!paid) {
    return res.json({ received: true, status: "not_paid" });
  }

  // Fetch authoritative transaction data
  let txData;
  try {
    txData = await fawaterak.getTransactionData(intentKey);
  } catch (err) {
    return res.json({ received: true, status: "fetch_failed" });
  }

  const providerPaid = txData?.paid === 1 || txData?.status_text === "paid";
  const providerFailed = txData?.status_text === "failed" || txData?.status_text === "expired" || txData?.status_text === "cancelled";

  if (!providerPaid && !providerFailed) {
    return res.json({ received: true, status: "ignored" });
  }

  // Find the exact PaymentTransaction
  const pTx = await PaymentTransaction.findOne({ intentKey });
  
  if (!pTx) {
    return res.status(404).json({ received: true, status: "transaction_not_found" });
  }

  if (providerPaid) {
    // Process the successful webhook securely
    const processResult = await processVerifiedPayment(pTx, txData);

    if (!processResult.success) {
      return res.status(400).json({ received: true, status: "processing_failed", error: processResult.error });
    }
  } else if (providerFailed) {
    // Handle Cancellation / Failed Operations Webhook
    if (pTx.status !== "paid" && pTx.status !== "suspicious_amount") {
      pTx.status = "failed";
      pTx.paymentMethodName = txData.payment_method;
      pTx.fawaterakResponse = txData;
      pTx.fawaterakLogs.push({ action: "webhook_failed", data: txData });
      await pTx.save();

      const orderType = txData?.pay_load?.order_type || pTx?.orderType;
      if (orderType === "store") {
        const ord = await Order.findOne({ intentKey: pTx.intentKey });
        if (ord && ord.paymentStatus === "pending") {
          ord.paymentStatus = "failed";
          await ord.save();
        }
        await OrderDraft.deleteOne({ _id: pTx.referenceId });
      } else if (orderType === "subscription") {
        const sub = await Subscription.findOne({ intentKey: pTx.intentKey });
        if (sub && sub.status === "pending") {
          sub.status = "failed";
          await sub.save();
        }
      }
    }
  }

  // Always return 200 to Fawaterak
  res.json({ received: true, status: "processed" });
});

// ── GET /api/payment/pending ──────────────────────────────────────────────────
// Returns the user's pending payments (unpaid subscriptions or online orders)

export const getPendingPayments = asyncHandler(async (req, res) => {
  const user = req.user;

  // Retrieve all pending payment transactions for the user
  const pendingTransactions = await PaymentTransaction.find({
    userId: user._id,
    status: "pending",
  }).sort({ createdAt: -1 });

  const subscriptions = [];
  const orders = [];

  for (const tx of pendingTransactions) {
    let isActivePending = true;

    // Auto-cancel pending Visa/Mastercard (Method 2) payments since they can't be resumed
    // Also auto-cancel Wallet (Method 4) payments older than 5 minutes
    const isExpiredWallet =
      tx.paymentMethodId === 4 &&
      Date.now() - new Date(tx.createdAt).getTime() > 5 * 60 * 1000;

    if (
      tx.paymentMethodId === 2 ||
      tx.paymentMethodName?.toLowerCase().includes("visa") ||
      isExpiredWallet
    ) {
      tx.status = "cancelled";
      await tx.save();

      if (tx.orderType === "subscription") {
        const sub = await Subscription.findOne({ intentKey: tx.intentKey });
        if (sub && sub.status === "pending") {
          sub.status = "cancelled";
          await sub.save();
        }
      } else if (tx.orderType === "store") {
        const ord = await Order.findOne({ intentKey: tx.intentKey });
        if (ord && ord.paymentStatus === "pending") {
          ord.paymentStatus = "cancelled";
          await ord.save();
        }
      }
      continue;
    }

    // Check with Fawaterak to get the live status with a safe timeout
    try {
      const liveData = await Promise.race([
        fawaterak.getTransactionData(tx.intentKey),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Fawaterak lookup timed out")),
            3500,
          ),
        ),
      ]);
      const isPaid = liveData.paid === 1 || liveData.status_text === "paid";
      const isFailed =
        liveData.status_text === "failed" || liveData.status_text === "expired";

      if (isPaid || isFailed) {
        if (isPaid) {
          // Process the webhook securely
          const processResult = await processVerifiedPayment(tx, liveData);
          if (processResult.success) {
            isActivePending = false;
          } else {
            // Mismatch or other error, mark failed instead of paid
            tx.status = "failed";
            await tx.save();
            isActivePending = false;
          }
        } else if (isFailed) {
          tx.status = "failed";
          tx.paymentMethodName = liveData.payment_method;
          tx.fawaterakResponse = liveData;
          tx.fawaterakLogs.push({ action: "poll_failed", data: liveData });
          await tx.save();

          isActivePending = false;

          if (tx.orderType === "store") {
            const ord = await Order.findOne({ intentKey: tx.intentKey });
            if (ord && ord.paymentStatus === "pending") {
              ord.paymentStatus = "failed";
              await ord.save();
            }
            await OrderDraft.deleteOne({ _id: tx.referenceId });
          }
        }
      }
    } catch (error) {
      console.error(
        "[getPendingPayments] Error fetching live data for",
        tx.intentKey,
        error,
      );
    }

    if (isActivePending) {
      if (tx.orderType === "subscription") {
        let sub = await Subscription.findById(tx.referenceId)
          .populate("planId")
          .lean();

        if (sub) {
          // If the subscription is already active, this pending transaction is obsolete
          if (sub.status === "active") {
            tx.status = "cancelled";
            await tx.save();
            continue;
          }

          // Temporarily mock the plan and status so the UI shows what the user is paying for
          if (tx.paymentData?.targetPlanId) {
            sub.planId = await Plan.findById(
              tx.paymentData.targetPlanId,
            ).lean();
            sub.status = "pending";
          }
          subscriptions.push({ ...sub, transaction: tx });
        }
      } else if (tx.orderType === "store") {
        const ord =
          (await Order.findById(tx.referenceId).lean()) ||
          (await OrderDraft.findById(tx.referenceId).lean());
        if (ord && (ord.paymentStatus === "pending" || !ord.paymentStatus)) {
          orders.push({ ...ord, transaction: tx });
        }
      }
    }
  }

  res.json({
    success: true,
    subscriptions,
    orders,
  });
});

// ── POST /api/payment/cancel ──────────────────────────────────────────────────
// Body: { intentKey }
// Cancels a pending payment

export const cancelPayment = asyncHandler(async (req, res) => {
  const { intentKey } = req.body;
  const user = req.user;

  if (!intentKey) {
    return res.status(400).json({ error: "intentKey is required" });
  }

  const pTx = await PaymentTransaction.findOne({ intentKey, userId: user._id });
  if (!pTx) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  // Change status to cancelled instead of deleting the transaction so it remains in invoice history
  pTx.status = "cancelled";
  await pTx.save();

  // We DO NOT delete the existing subscription.
  if (pTx.orderType === "store") {
    const ord = await Order.findOne({ intentKey });
    if (ord && ord.paymentStatus === "pending") {
      ord.paymentStatus = "cancelled";
      await ord.save();
    }
  }

  res.json({ success: true, message: "Payment cancelled successfully" });
});

// ── GET /api/payment/invoice/:type/:id ───────────────────────────────────────
// Get invoice details from backend to ensure secure amount loading
export const getInvoiceDetails = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  if (type === "order") {
    let order = await Order.findById(id);
    if (!order) {
      order = await OrderDraft.findById(id);
    }
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    // Only the user who owns it (or guest checkout) can view
    if (order.userId && req.user && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access to this order" });
    }

    return res.json({
      success: true,
      data: {
        id: order._id,
        orderNumber: order.orderNumber || null,
        amount: order.totalAmount,
        name: "Thenith Store Order",
      }
    });
  } else if (type === "subscription") {
    const plan = await Plan.findById(id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const billingPeriod = req.query.billingPeriod || "monthly";
    const couponCode = req.query.couponCode || "";
    
    let baseAmount = billingPeriod === "yearly"
      ? (plan.prices?.yearly || 0)
      : (plan.prices?.monthly || 0);

    let discount = 0;
    if (couponCode) {
      const appliedCoupon = await mongoose.model("Coupon").findOne({
        code: couponCode.toUpperCase().trim(),
      });
      if (appliedCoupon?.isActive) {
        let valid = true;
        if (appliedCoupon.expiresAt && new Date() > new Date(appliedCoupon.expiresAt)) valid = false;
        if (appliedCoupon.maxUses !== null && appliedCoupon.usedCount >= appliedCoupon.maxUses) valid = false;
        if (appliedCoupon.appliesTo === "store") valid = false;

        if (valid) {
          let discountVal = appliedCoupon.discountValue;
          if (billingPeriod === "monthly" && appliedCoupon.monthlyDiscountValue != null) discountVal = appliedCoupon.monthlyDiscountValue;
          else if (billingPeriod === "yearly" && appliedCoupon.yearlyDiscountValue != null) discountVal = appliedCoupon.yearlyDiscountValue;
          
          discount = appliedCoupon.discountType === "percentage"
            ? Math.round((baseAmount * discountVal) / 100)
            : Math.min(discountVal, baseAmount);
        }
      }
    }

    const amount = baseAmount - discount;

    return res.json({
      success: true,
      data: {
        id: plan._id,
        name: plan.name?.ar || plan.name?.en || plan.name,
        priceMonthly: plan.prices?.monthly || 0,
        priceYearly: plan.prices?.yearly || 0,
        amount,
        discount,
      }
    });
  }

  res.status(400).json({ error: "Invalid invoice type" });
});
