import { publicClient } from "../client.js";

export const hireRoutes = {
  submit: async (cardId, payload) => {
    const response = await publicClient.post(
      `/hire/${encodeURIComponent(cardId)}`,
      {
        name: payload.fullName || payload.name,
        email: payload.email,
        phone: payload.phone,
        message: payload.message || payload.details,
      },
    );
    return response.data;
  },

  getMyRequests: async (cardId) => {
    const response = await publicClient.get(
      `/hire/${encodeURIComponent(cardId)}/my-requests`,
    );
    return response.data?.requests || response.data || [];
  },

  delete: async (requestId) => {
    const response = await publicClient.delete(
      `/hire/${encodeURIComponent(requestId)}`,
    );
    return response.data;
  },
};

export default hireRoutes;
