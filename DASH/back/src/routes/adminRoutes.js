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
const { adminLoginRateLimit  } = _rateLimit5219;
import _admin5886 from "../middleware/admin.js";
const { requireAdminToken  } = _admin5886;

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

// Cards
router.get("/cards/:id", getCard);
router.patch("/cards/:id", updateCard);
router.delete("/cards/:id", deleteCard);

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
