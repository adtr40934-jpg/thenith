import { publicClient } from "../client.js";

export const healthRoutes = {
  check: async () => {
    const response = await publicClient.get("/health");
    return response.data;
  },
};

export default healthRoutes;
