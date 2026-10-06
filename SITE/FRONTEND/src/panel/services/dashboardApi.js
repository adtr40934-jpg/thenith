/**
 * src/panel/services/dashboardApi.js
 *
 * Dashboard & card management API service.
 * Leverages the modular central API routes (dashboardRoutes, cardRoutes, subscriptionRoutes, planRoutes).
 */

import api from "../../api/index.js";
import { normalizeDashboardData } from "../data/dashboardSeed.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardData() {
  const data = await api.dashboard.overview();
  return normalizeDashboardData({
    ...data,
    owner: { ...data.owner, plan: data.subscription?.plan },
    subscription: data.subscription,
  });
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function createCard(name) {
  const data = await api.cards.create(name);
  return data.card;
}

export async function saveCard(card) {

  const data = await api.cards.update(card.id, card);
  return data.card;
}

export async function deleteCard(cardId) {
  return api.cards.delete(cardId);
}

export async function setActiveCard(cardId) {
  return api.dashboard.setActiveCard(cardId);
}

// ─── Inbox ────────────────────────────────────────────────────────────────────

export async function submitBusinessRequest(target, payload) {
  const cardId = target.value;
  return api.hire.submit(cardId, payload);
}

export async function deleteInboxItemApi(cardId, actionType, itemId) {
  return actionType === "calendar"
    ? api.dashboard.deleteAppointment(cardId, itemId)
    : api.dashboard.deleteRequest(cardId, itemId);
}

export async function toggleInboxItemReadApi(cardId, actionType, itemId) {
  return actionType === "calendar"
    ? api.dashboard.markAppointmentRead(cardId, itemId)
    : api.dashboard.markRequestRead(cardId, itemId);
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export async function fetchSubscription() {
  return api.subscription.getCurrent();
}

export async function fetchPlans() {
  return api.plans.getPlans();
}

