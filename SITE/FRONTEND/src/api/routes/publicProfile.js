import { publicClient } from "../client.js";

export const publicProfileRoutes = {
  getPublicProfile: async (identifier = "") => {
    const endpoint = identifier ? `/p/${encodeURIComponent(identifier)}` : "/";
    const response = await publicClient.get(endpoint);
    return response.data;
  },

  submitContact: async (payload = {}) => {
    const response = await publicClient.post("/public/contact", payload);
    return response.data;
  },
};

export default publicProfileRoutes;
