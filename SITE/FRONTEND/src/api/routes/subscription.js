import { request } from "../client.js";

export const subscriptionRoutes = {
  getCurrent: () => request("/subscription"),

  getStatus: () => request("/subscription/status"),

  cancel: () =>
    request("/subscription/cancel", {
      method: "POST",
    }),
};

export default subscriptionRoutes;
