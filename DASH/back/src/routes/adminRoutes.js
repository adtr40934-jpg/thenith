import { Router } from "express";
import _adminController9802 from "../controller/adminController.js";
const { adminLogin,
  getSubscriptionStats,
  getStats,
  getUsers,
  createUser,
  updateUser,
  toggleUserBan,
  changeUserPlan,
  deleteUser,
  getUserCards,
  getCard,
  updateCard,
  deleteCard,
  adminUpload,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStoreStats,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getAdminPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStoreSettings,
  updateStoreSettings,
  getLandingSettings,
  updateLandingSettings,
  updateSettings,
  getMessages,
  markMessageRead,
  deleteMessage,
  getCustomerServices,
  getCustomerServiceMessages,
  sendCustomerServiceMessage,
  updateCustomerServiceStatus,
  getAuditLogs,
  getAuditStats,
  getFilteredUsers,
} = _adminController9802;
import notificationsController from "../controller/notificationsController.js";
import _shippingController from "../controller/shippingController.js";
const {
  getShippingRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  bulkUpdateShippingCost,
} = _shippingController;
import _rateLimit5219 from "../middleware/rateLimit.js";
const { adminLoginRateLimit } = _rateLimit5219;
import _admin5886 from "../middleware/admin.js";
const { requireAdminToken } = _admin5886;
import cardManagementController from "../controller/cardManagementController.js";
import PhysicalCard from "../models/PhysicalCard.js";

const router = Router();

// Public: Login
router.post("/login", adminLoginRateLimit, adminLogin);

// All routes below require admin token
router.use(requireAdminToken);

// Subscriptions
router.get("/subscriptions/stats", getSubscriptionStats);
router.get("/subscriptions/filtered-users", getFilteredUsers);

// Stats
router.get("/stats", getStats);

// Users
router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/ban", toggleUserBan);
router.patch("/users/:id/plan", changeUserPlan);
router.delete("/users/:id", deleteUser);
router.get("/users/:id/cards", getUserCards);

// ── Smart Physical Cards Management ──────────────────────────────────────────
router.get("/cards", cardManagementController.getCards);
router.post("/cards", cardManagementController.createCard);
router.post("/cards/bulk", cardManagementController.createBulkCards);
router.get("/cards/stats", cardManagementController.getCardStats);
router.patch("/cards/:id/status", cardManagementController.updateCardStatus);
router.get("/cards/:id/qr", cardManagementController.getCardQr);
router.get("/cards/:id/logs", cardManagementController.getCardLogs);
router.post("/cards/:id/nfc/provision", cardManagementController.startNfcProvision);
router.post("/cards/:id/nfc/verify", cardManagementController.verifyNfcProvision);
router.post("/cards/:id/nfc/simulate-test", cardManagementController.simulateNfcTest);

// Card details resolver (supports Physical Card or fallback to Digital Profile Card)
router.get("/cards/:id", async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = [{ cardId: req.params.id.toUpperCase() }, { publicId: req.params.id }];
    if (isObjectId) query.unshift({ _id: req.params.id });

    const isPhysical = await PhysicalCard.findOne({ $or: query });
    if (isPhysical) {
      return cardManagementController.getCardDetails(req, res, next);
    }
    return getCard(req, res, next);
  } catch (err) {
    return getCard(req, res, next);
  }
});
router.patch("/cards/:id", async (req, res, next) => {
  try {
    const isPhysical = await PhysicalCard.exists({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { cardId: req.params.id.toUpperCase() },
        { publicId: req.params.id },
      ],
    });
    if (isPhysical) {
      return cardManagementController.updateCardDetails(req, res, next);
    }
    return updateCard(req, res, next);
  } catch (err) {
    return updateCard(req, res, next);
  }
});
router.delete("/cards/:id", async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = [{ cardId: req.params.id.toUpperCase() }, { publicId: req.params.id }];
    if (isObjectId) query.unshift({ _id: req.params.id });

    const isPhysical = await PhysicalCard.findOne({ $or: query });
    if (isPhysical) {
      return cardManagementController.deleteCard(req, res, next);
    }
    return deleteCard(req, res, next);
  } catch (err) {
    return deleteCard(req, res, next);
  }
});
router.post("/cards/:id/unlink", cardManagementController.unlinkCard);

// Dedicated aliases
router.get("/physical-cards", cardManagementController.getCards);
router.get("/physical-cards/stats", cardManagementController.getCardStats);
router.post("/physical-cards", cardManagementController.createCard);
router.post("/physical-cards/bulk", cardManagementController.createBulkCards);
router.get("/physical-cards/:id", cardManagementController.getCardDetails);
router.patch("/physical-cards/:id", cardManagementController.updateCardDetails);
router.patch("/physical-cards/:id/status", cardManagementController.updateCardStatus);
router.post("/physical-cards/:id/unlink", cardManagementController.unlinkCard);
router.delete("/physical-cards/:id", cardManagementController.deleteCard);
router.get("/physical-cards/:id/qr", cardManagementController.getCardQr);
router.get("/physical-cards/:id/logs", cardManagementController.getCardLogs);
router.post("/physical-cards/:id/nfc/provision", cardManagementController.startNfcProvision);
router.post("/physical-cards/:id/nfc/verify", cardManagementController.verifyNfcProvision);
router.post("/physical-cards/:id/nfc/simulate-test", cardManagementController.simulateNfcTest);

// ── Card Batches & Inventory ─────────────────────────────────────────────────
router.get("/card-batches", cardManagementController.getCardBatches);
router.post("/card-batches", cardManagementController.createCardBatch);
router.get("/card-batches/:id", cardManagementController.getCardBatchDetails);

// Upload
router.post("/upload", adminUpload);

// Products
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Store
router.get("/store/stats", getStoreStats);

// Orders
router.get("/orders", getOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

// Plans
router.get("/plans", getAdminPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// Coupons
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// Settings
router.get("/settings/store", getStoreSettings);
router.put("/settings/store", updateStoreSettings);
router.get("/settings/landing", getLandingSettings);
router.put("/settings/landing", updateLandingSettings);
router.put("/settings", updateSettings);

// Messages
router.get("/messages", getMessages);
router.patch("/messages/:id/read", markMessageRead);
router.delete("/messages/:id", deleteMessage);

// Support / CustomerServices
router.get("/customerServices", getCustomerServices);
router.get("/customerServices/:id/messages", getCustomerServiceMessages);
router.post("/customerServices/:id/messages", sendCustomerServiceMessage);
router.put("/customerServices/:id/status", updateCustomerServiceStatus);

// Audit Logs
router.get("/audit/logs", getAuditLogs);
router.get("/audit/stats", getAuditStats);

// Shipping Rates
router.get("/shipping-rates", getShippingRates);
router.post("/shipping-rates", createShippingRate);
router.post("/shipping-rates/bulk-update", bulkUpdateShippingCost);
router.put("/shipping-rates/:id", updateShippingRate);
router.delete("/shipping-rates/:id", deleteShippingRate);

// Push Notifications
router.post("/notifications/push", notificationsController.sendPushNotification);
router.get("/notifications/users", notificationsController.getUsers);

export default router;
