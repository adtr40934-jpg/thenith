import { request } from "../client.js";

export const panelRoutes = {
  getProfile: () => request("/panel/profile"),

  updateProfile: (payload = {}) =>
    request("/panel/profile", {
      method: "PATCH",
      data: payload,
    }),

  requestSecondaryEmail: (payload = {}) =>
    request("/panel/profile/emails/request", {
      method: "POST",
      data: payload,
    }),

  verifySecondaryEmail: (payload = {}) =>
    request("/panel/profile/emails/verify", {
      method: "POST",
      data: payload,
    }),

  deleteSecondaryEmail: (payload = {}) =>
    request("/panel/profile/emails", {
      method: "DELETE",
      data: payload,
    }),

  getLinks: () => request("/panel/links"),

  updateLinks: (payload = {}) =>
    request("/panel/links", {
      method: "PATCH",
      data: payload,
    }),

  getOrders: () => request(`/panel/orders?t=${Date.now()}`),

  cancelOrder: (orderId) =>
    request(`/panel/orders/${orderId}/cancel`, { method: "PATCH" }),

  deleteOrder: (orderId) =>
    request(`/panel/orders/${orderId}`, { method: "DELETE" }),

  getSubscriptions: () => request("/panel/subscriptions"),

  cancelSubscription: (subId) =>
    request(`/panel/subscriptions/${subId}/cancel`, { method: "POST" }),
};

export default panelRoutes;
