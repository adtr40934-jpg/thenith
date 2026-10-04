import apiClient, { publicClient, readAuthToken } from "../client.js";

const getClient = () => {
  const token = readAuthToken();
  return token ? apiClient : publicClient;
};

export const supportRoutes = {
  init: async (payload = {}) => {
    const client = getClient();
    const response = await client.post("/support/init", payload);
    return response.data;
  },

  getMessages: async (ticketId, guestId = "") => {
    const client = getClient();
    const response = await client.get(
      `/support/${encodeURIComponent(ticketId)}/messages`,
      {
        params: guestId ? { guestId } : {},
      },
    );
    return response.data;
  },

  sendMessage: async (ticketId, content) => {
    const client = getClient();
    const response = await client.post(
      `/support/${encodeURIComponent(ticketId)}/messages`,
      { content, text: content },
    );
    return response.data;
  },
};

export default supportRoutes;
