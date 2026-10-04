import apiClient from "../client.js";

export const notificationsApi = {
  // Get all my notifications
  getAll: async () => {
    const res = await apiClient.get("/notifications");
    return res.data;
  },

  // Create a notification (for frontend-triggered actions)
  create: async (payload) => {
    const res = await apiClient.post("/notifications", payload);
    return res.data;
  },

  // Mark single notification as read
  markRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all as read
  markAllRead: async () => {
    const res = await apiClient.patch("/notifications/read-all");
    return res.data;
  },

  // Delete single notification
  deleteOne: async (id) => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },

  // Clear all notifications
  clearAll: async () => {
    const res = await apiClient.delete("/notifications");
    return res.data;
  },
};

export default notificationsApi;
