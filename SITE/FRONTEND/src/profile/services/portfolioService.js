/**
 * src/profile/services/portfolioService.js
 *
 * Public portfolio API — uses modular routes for hire, analytics, and public profile.
 */

import api from "../../api/index.js";
import { normalizePortfolio } from "../utils/normalizePortfolio.js";

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolio(publicId) {
  const data = await api.publicProfile.getPublicProfile(publicId);
  return normalizePortfolio(data);
}

// ─── Hire requests ────────────────────────────────────────────────────────────

export async function sendHireRequest(cardId, payload) {
  return api.hire.submit(cardId, payload);
}

export async function fetchMyRequests(cardId) {
  return api.hire.getMyRequests(cardId);
}

export async function deleteHireRequest(requestId) {
  return api.hire.delete(requestId);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function trackVisit(cardId) {
  return api.analytics.trackVisit(cardId);
}

export async function trackClick(cardId, linkUrl) {
  return api.analytics.trackClick(cardId, linkUrl);
}
