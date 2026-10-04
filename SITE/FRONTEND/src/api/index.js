import apiClient, { publicClient, request } from "./client.js";
import authRoutes from "./routes/auth.js";
import panelRoutes from "./routes/panel.js";
import dashboardRoutes from "./routes/dashboard.js";
import cardRoutes from "./routes/cards.js";
import appointmentRoutes from "./routes/appointments.js";
import hireRoutes from "./routes/hire.js";
import planRoutes from "./routes/plans.js";
import subscriptionRoutes from "./routes/subscription.js";
import productRoutes from "./routes/products.js";
import supportRoutes from "./routes/support.js";
import uploadRoutes from "./routes/upload.js";
import analyticsRoutes from "./routes/analytics.js";
import publicProfileRoutes from "./routes/publicProfile.js";
import healthRoutes from "./routes/health.js";
import paymentRoutes from "./routes/payment.js";
import notificationsApi from "./routes/notifications.js";

const api = {
  auth: authRoutes,
  panel: panelRoutes,
  dashboard: dashboardRoutes,
  cards: cardRoutes,
  appointments: appointmentRoutes,
  hire: hireRoutes,
  plans: planRoutes,
  subscription: subscriptionRoutes,
  products: productRoutes,
  support: supportRoutes,
  upload: uploadRoutes,
  analytics: analyticsRoutes,
  publicProfile: publicProfileRoutes,
  health: healthRoutes,
  payment: paymentRoutes,
  notifications: notificationsApi,

  // Client references
  client: apiClient,
  publicClient,
  request,
};

export default api;
export {
  apiClient,
  publicClient,
  request,
  authRoutes,
  panelRoutes,
  dashboardRoutes,
  cardRoutes,
  appointmentRoutes,
  hireRoutes,
  planRoutes,
  subscriptionRoutes,
  productRoutes,
  supportRoutes,
  uploadRoutes,
  analyticsRoutes,
  publicProfileRoutes,
  healthRoutes,
};
