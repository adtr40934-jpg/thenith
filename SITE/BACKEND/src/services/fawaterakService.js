/**
 * src/services/fawaterakService.js
 *
 * Fawaterak Payment Gateway — OAuth v3 Integration
 * ─────────────────────────────────────────────────
 * Handles:
 *  - OAuth access token acquisition & refresh
 *  - Listing available payment methods
 *  - Creating transaction intents (hosted checkout or direct dispatch)
 *  - Querying transaction status by intent_key
 *
 * All API calls are server-to-server; credentials never reach the client.
 */

import axios from "axios";
import _env from "../config/env.js";
const { env } = _env;

// ── In-memory token cache (single-process) ────────────────────────────────────
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Returns a valid Bearer access token, fetching a new one if needed.
 */
async function getAccessToken() {
  const now = Date.now();
  // Return cached token if it's still valid with a 60-second buffer
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const base = env.FAWATERAK_BASE_URL;
  const response = await axios.post(
    `${base}/oauth/token`,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.FAWATERAK_CLIENT_ID,
      client_secret: env.FAWATERAK_CLIENT_SECRET,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
    }
  );

  const { access_token, expires_in } = response.data;
  if (!access_token) {
    throw new Error("Fawaterak: Failed to obtain access token");
  }

  cachedToken = access_token;
  // expires_in is in seconds; convert to ms
  tokenExpiresAt = now + (expires_in || 3600) * 1_000;

  return access_token;
}

/**
 * Returns an authenticated Axios instance pre-configured for Fawaterak API v3.
 */
async function fawaterakClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: `${env.FAWATERAK_BASE_URL}/api/v3`,
    timeout: 15_000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the list of integration-enabled payment methods for this vendor.
 * Each item has: payment_method_id, name_en, name_ar, redirect, logo, commission_on_customer
 */
async function getPaymentMethods() {
  const client = await fawaterakClient();
  const { data } = await client.get("/getTrPaymentmethods");

  if (data?.status !== "success") {
    throw new Error("Fawaterak: Failed to fetch payment methods");
  }

  return data.data || [];
}

function normalizeEgyptianPhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).trim().replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("+20")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("+2")) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("0020")) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith("002")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("20") && cleaned.length === 12) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith("2") && cleaned.length === 12) cleaned = cleaned.slice(1);
  return cleaned;
}

/**
 * Creates a transaction intent on Fawaterak.
 *
 * @param {object} opts
 * @param {number}  opts.amount        - Total amount in EGP
 * @param {number}  [opts.methodId]    - payment_method_id (omit for hosted checkout)
 * @param {string}  [opts.walletNumber]- Mobile wallet number (Meeza / Electronic wallets)
 * @param {object}  opts.customer      - { firstName, lastName, email, phone, address, userId }
 * @param {string}  opts.orderId       - Internal order/subscription ID (stored in pay_load)
 * @param {string}  opts.orderType     - "store" | "subscription"
 * @param {string}  opts.successUrl
 * @param {string}  opts.failUrl
 * @param {string}  opts.pendingUrl
 * @param {string}  opts.webhookUrl
 *
 * @returns {object} Fawaterak response data:
 *   Hosted:  { intent_key, url, expires_in }
 *   Direct:  { intent_key, payment_data }
 */
async function createTransaction(opts) {
  const {
    amount,
    methodId,
    walletNumber,
    customer = {},
    orderId,
    orderType,
    successUrl,
    failUrl,
    pendingUrl,
    webhookUrl,
  } = opts;

  const cleanWallet = normalizeEgyptianPhone(walletNumber);
  const cleanPhone =
    normalizeEgyptianPhone(customer.phone) ||
    cleanWallet ||
    "01000000000";

  const payload = {
    cartTotal: Number(amount),
    currency: "EGP",
    customer: {
      first_name: customer.firstName || "Customer",
      last_name: customer.lastName || ".",
      email: customer.email || "customer@thenith.com",
      phone: cleanPhone,
      address: customer.address || "Egypt",
      customer_number: String(customer.userId || ""),
      customer_unique_id: String(customer.userId || ""),
    },
    cartItems: [
      {
        name: orderType === "subscription" ? "Thenith Pro Subscription" : "Thenith Store Order",
        price: Number(amount),
        quantity: 1,
      },
    ],
    pay_load: {
      order_id: String(orderId),
      order_type: orderType, // "store" | "subscription"
    },
    redirectionUrls: {
      successUrl,
      failUrl,
      pendingUrl,
      backUrl: successUrl.replace(/\/payment\/success.*$/, "/pricing"),
      webhookUrl,
    },
    sendEmail: false,
    sendSMS: false,
    lang: "ar",
  };

  // Direct payment method selected
  if (methodId) {
    payload.payment_method_id = Number(methodId);
    if (cleanWallet) {
      payload.mobileWalletNumber = cleanWallet;
    }
  }

  let response;
  try {
    const client = await fawaterakClient();
    response = await client.post("/createTransaction", payload);
  } catch (err) {
    const errData = err.response?.data;
    const msg =
      errData?.message ||
      (typeof errData?.data === "string" ? errData.data : null) ||
      (errData ? JSON.stringify(errData) : err.message);
    throw new Error(`Fawaterak: ${msg}`);
  }

  const { data } = response;
  if (data?.status !== "success") {
    throw new Error(
      `Fawaterak: Transaction creation failed — ${data?.message || JSON.stringify(data)}`
    );
  }

  return data.data;
}

/**
 * Fetches the current status of a transaction by its intent_key.
 * Returns { paid, status_text, payment_method, total, pay_load, transaction_history, ... }
 */
async function getTransactionData(intentKey) {
  const client = await fawaterakClient();
  const { data } = await client.post("/getTransactionData", { intent_key: intentKey });

  if (data?.status !== "success") {
    throw new Error(`Fawaterak: Failed to fetch transaction — ${data?.message}`);
  }

  return data.data;
}

export default {
  getAccessToken,
  getPaymentMethods,
  createTransaction,
  getTransactionData,
};
