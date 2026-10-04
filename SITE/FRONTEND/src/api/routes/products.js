import { publicClient } from "../client.js";

export const productRoutes = {
  list: async () => {
    const response = await publicClient.get("/products");
    return response.data;
  },

  get: async (id = "") => {
    const response = await publicClient.get(
      `/products/${encodeURIComponent(id)}`,
    );
    return response.data;
  },
};

export default productRoutes;
