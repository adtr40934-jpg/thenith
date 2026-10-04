/**
 * src/panel/services/billingApi.js
 *
 * Billing & subscription API service.
 */

import api from "../../api/index.js";

export async function fetchPlans() {
  return api.plans.getPlans();
}

export async function fetchSubscription() {
  return api.subscription.getCurrent();
}

export async function fetchSubscriptionStatus() {
  return api.subscription.getStatus();
}

export async function cancelSubscription() {
  return api.subscription.cancel();
}
