/**
 * ============================================================
 * FRONTEND ENTITLEMENTS HELPERS
 * ============================================================
 * Single source of truth for all plan-related UI logic.
 *
 * Usage:
 *   import { canAccess, getLimit, getUsage, isFeatureEnabled } from '../utils/entitlements.js'
 *
 *   const e = subscription?.entitlements;
 *
 *   // Boolean features (camelCase — matches seed.js plan definition)
 *   if (canAccess(e, 'coverImage'))        { ... }
 *   if (canAccess(e, 'advancedAnalytics')) { ... }
 *   if (canAccess(e, 'customLink'))        { ... }
 *
 *   // Count limits (camelCase — matches seed.js plan limits definition)
 *   if (canCreate(e, 'maxCards'))  { ... }
 *   if (canCreate(e, 'maxLinks'))  { ... }
 *
 * Rule: Backend is the real security layer.
 *       Frontend helpers are for UX only.
 * ============================================================
 */

// ─── Core Selectors ──────────────────────────────────────────

/**
 * Check if a feature is enabled for the current user.
 * @param {object} entitlements - subscription.entitlements from Backend
 * @param {string} featureKey   - camelCase key matching seed.js plan definition
 *                                e.g. 'coverImage', 'customLink', 'advancedAnalytics',
 *                                'calendarBooking', 'reorderLinks', 'verifiedBadge'
 * @returns {boolean}
 */
export function canAccess(entitlements, featureKey) {
  if (!entitlements?.features) return false;
  return entitlements.features[featureKey]?.enabled === true;
}

/**
 * Alias for canAccess — more readable in boolean contexts.
 */
export const isFeatureEnabled = canAccess;

/**
 * Get the limit for a count/monthly feature.
 * @returns {number|null} - null means unlimited
 */
export function getLimit(entitlements, featureKey) {
  if (!entitlements?.features) return null;
  const f = entitlements.features[featureKey];
  if (!f) return null;
  return f.limit ?? null;
}

/**
 * Get the current usage for a feature.
 * @returns {number}
 */
export function getUsage(entitlements, featureKey) {
  if (!entitlements?.features) return 0;
  return entitlements.features[featureKey]?.used ?? 0;
}

/**
 * Get the hidden count for a count-limited feature (e.g. cards).
 * This comes directly from the Backend — never computed on Frontend.
 */
export function getHiddenCount(entitlements, featureKey) {
  if (!entitlements?.features) return 0;
  return entitlements.features[featureKey]?.hiddenCount ?? 0;
}

/**
 * Check if a count feature can create more items.
 * Uses the total stored count vs. the limit.
 */
export function canCreate(entitlements, featureKey, currentCount = 0) {
  if (!canAccess(entitlements, featureKey)) return false;
  const limit = getLimit(entitlements, featureKey);
  if (limit === null) return true; // unlimited
  // Use totalStored if available (server-authoritative), else fall back to currentCount
  const total =
    entitlements?.features?.[featureKey]?.totalStored ?? currentCount;
  return total < limit;
}

/**
 * Get remaining usage for a monthly feature.
 * @returns {number|null} - null means unlimited
 */
export function getRemainingUsage(entitlements, featureKey) {
  const limit = getLimit(entitlements, featureKey);
  if (limit === null) return null;
  const used = getUsage(entitlements, featureKey);
  return Math.max(0, limit - used);
}

/**
 * Convenience: get the current plan name.
 */
export function getPlan(entitlements) {
  return entitlements?.plan ?? "free";
}

/**
 * Convenience: is the user on a Pro plan?
 */
export function isPro(entitlements) {
  return getPlan(entitlements) === "pro";
}

// ─── Legacy bridge helpers ───────────────────────────────────
// These allow existing components using `permissions.xxx` to continue
// working. Gradually migrate them to the new helpers above.

/**
 * Build a flat permissions map from entitlements.
 * Useful for components that still use the old `permissions` prop.
 *
 * IMPORTANT: The backend seed (seed.js) defines plan features and limits in
 * camelCase exactly as stored in the Plan model's Map fields. The
 * buildEntitlements() function passes these keys through verbatim into
 * entitlements.features. So we must use the same camelCase keys here.
 *
 * Plan limits keys: maxCards, maxLinks, monthlyBusinessRequests
 * Plan feature keys: coverImage, customLink, reorderLinks, verifiedBadge,
 *   removeBranding, basicAnalytics, advancedAnalytics, calendarBooking,
 *   saveContact, qrCode, contactMethods, prioritySupport, futureFeatures
 */
export function permissionsFromEntitlements(entitlements) {
  if (!entitlements?.features) return {};
  const f = entitlements.features;
  return {
    // Boolean feature flags (camelCase — must match seed.js plan definition)
    coverImage: f.coverImage?.enabled ?? false,
    customLink: f.customLink?.enabled ?? false,
    reorderLinks: f.reorderLinks?.enabled ?? false,
    verifiedBadge: f.verifiedBadge?.enabled ?? false,
    removeBranding: f.removeBranding?.enabled ?? false,
    basicAnalytics: f.basicAnalytics?.enabled ?? true,
    advancedAnalytics: f.advancedAnalytics?.enabled ?? false,
    calendarBooking: f.calendarBooking?.enabled ?? false,
    saveContact: f.saveContact?.enabled ?? true,
    qrCode: f.qrCode?.enabled ?? true,
    contactMethods: f.contactMethods?.enabled ?? true,
    prioritySupport: f.prioritySupport?.enabled ?? false,
    futureFeatures: f.futureFeatures?.enabled ?? false,
    // Count/limit features (camelCase — must match seed.js plan limits definition)
    maxCards: f.maxCards?.limit ?? null,
    maxLinks: f.maxLinks?.limit ?? null,
    monthlyBusinessRequests: f.monthlyBusinessRequests?.limit ?? null,
    remainingBusinessRequests:
      f.monthlyBusinessRequests?.limit == null
        ? null
        : Math.max(
            0,
            (f.monthlyBusinessRequests?.limit ?? 0) -
              (f.monthlyBusinessRequests?.used ?? 0),
          ),
  };
}
