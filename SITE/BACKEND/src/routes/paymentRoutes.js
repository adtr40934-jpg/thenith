import { Router } from "express";
import _auth from "../middleware/auth.js";
const { requireAuth } = _auth;
import {
  getPaymentMethods,
  createSubscriptionPayment,
  createOrderPayment,
  verifyPayment,
  handleWebhook,
  getPendingPayments,
  cancelPayment,
  getInvoiceDetails,
} from "../controller/paymentController.js";

const router = Router();

// Public — Fawaterak webhooks (no auth, no document-block middleware)
// We provide specific endpoints for each Fawaterak webhook type for clarity,
// but they all funnel into our unified smart handler.
router.post("/webhook", handleWebhook);
router.post("/webhook/paid", handleWebhook);
router.post("/webhook/failed", handleWebhook);
router.post("/webhook/cancelled", handleWebhook);
router.post("/webhook/tokenization", handleWebhook);

// Protected — require user session
router.use(requireAuth);

router.get("/methods", getPaymentMethods);
router.get("/pending", getPendingPayments);
router.post("/subscription", createSubscriptionPayment);
router.post("/order/:orderId", createOrderPayment);
router.get("/invoice/:type/:id", getInvoiceDetails);
router.post("/verify", verifyPayment);
router.post("/cancel", cancelPayment);

export default router;
