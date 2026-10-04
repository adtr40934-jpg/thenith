import { publicClient, request } from "../client.js";

export const planRoutes = {
  getPlans: async () => {
    // Plans are public, but authenticated users can also call it
    try {
      return await request("/plans");
    } catch {
      const res = await publicClient.get("/plans");
      return res.data;
    }
  },
};

export default planRoutes;
