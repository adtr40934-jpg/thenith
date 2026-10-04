import plansRoutes from "./plans.js";
import subscriptionRoutes from "./subscription.js";
import productRoutes from "./products.js";

export const storeRoutes = {
  getPlans: plansRoutes.getPlans,
  getCurrentSubscription: subscriptionRoutes.getCurrent,
  listProducts: productRoutes.list,
  getProduct: productRoutes.get,
};

export default storeRoutes;
