const FEATURE_TYPE = {
  BOOLEAN: "boolean",
  COUNT: "count",
  MONTHLY: "monthly",
};

function canAccess(entitlements, featureKey) {
  if (!entitlements?.features) return false;
  return entitlements.features[featureKey]?.enabled === true;
}

function getFeatureLimit(entitlements, featureKey) {
  if (!entitlements?.features) return null;
  const f = entitlements.features[featureKey];
  if (!f) return null;
  return f.limit ?? null;
}

function buildEntitlements(planKey, definition, usage = {}) {
  const features = {};

  if (!definition) return { plan: planKey, features: {} };

  const limits =
    definition.limits instanceof Map
      ? Object.fromEntries(definition.limits)
      : definition.limits || {};
  const f =
    definition.features instanceof Map
      ? Object.fromEntries(definition.features)
      : definition.features || {};

  for (const [key, limitValue] of Object.entries(limits)) {
    features[key] = {
      type: FEATURE_TYPE.COUNT,
      enabled: true,
      limit: limitValue ?? null,
      used: usage[key + "Used"] ?? 0,
    };
  }

  for (const [key, enabledValue] of Object.entries(f)) {
    features[key] = {
      type: FEATURE_TYPE.BOOLEAN,
      enabled: !!enabledValue,
    };
  }

  if (features.maxCards) {
    features.maxCards.totalStored = usage.cardsTotalStored ?? 0;
    if (
      features.maxCards.totalStored != null &&
      features.maxCards.limit != null
    ) {
      features.maxCards.hiddenCount = Math.max(
        0,
        features.maxCards.totalStored - features.maxCards.limit,
      );
    }
  }

  return { plan: planKey, features };
}

function buildDashboardCardDTO(card, entitlements) {
  if (!card) return null;
  const f = entitlements?.features || {};
  const cardObj = card.toObject ? card.toObject() : { ...card };

  const linkLimit = f.maxLinks?.limit;
  let hiddenCount = 0;
  if (linkLimit !== null && linkLimit !== undefined) {
    const totalLinks = cardObj.links?.length || 0;
    cardObj.links = (cardObj.links || []).slice(0, linkLimit);
    hiddenCount = Math.max(0, totalLinks - linkLimit);
  }

  cardObj.features = {
    links: { limit: linkLimit, hiddenCount },
  };

  for (const [key, value] of Object.entries(f)) {
    if (value.type === FEATURE_TYPE.BOOLEAN) {
      cardObj.features[key] = { enabled: value.enabled };
    }
  }

  // Fallback actionType to form if user doesn't have calendarBooking entitlement
  if (!f.calendarBooking?.enabled && cardObj.actionType === "calendar") {
    cardObj.actionType = "form";
  }

  return cardObj;
}

function buildPublicCardDTO(card, entitlements) {
  if (!card) return null;
  const f = entitlements?.features || {};
  const cardObj = card.toObject ? card.toObject() : { ...card };

  const maxLinks = f.maxLinks?.limit;
  let links = Array.isArray(cardObj.links) ? [...cardObj.links] : [];
  if (maxLinks !== null && maxLinks !== undefined) {
    links = links.slice(0, maxLinks);
  }

  const personal = { ...(cardObj.personal || {}) };
  if (!f.coverImage?.enabled) {
    delete personal.coverImage;
  }

  // Pure allowlist projection: strictly exclude requests, appointments, analytics, userId
  const publicData = {
    id: cardObj.publicId || (cardObj._id ? cardObj._id.toString() : cardObj.id),
    publicId: cardObj.publicId,
    name: cardObj.name,
    personal,
    contacts: Array.isArray(cardObj.contacts) ? cardObj.contacts : [],
    links,
    actionType: (!f.calendarBooking?.enabled && cardObj.actionType === "calendar") ? "form" : cardObj.actionType,
    calendarSettings: cardObj.calendarSettings,
    isActive: cardObj.isActive,
    createdAt: cardObj.createdAt,
    updatedAt: cardObj.updatedAt,
  };

  if (f.removeBranding?.enabled) publicData.removeBranding = true;
  if (f.verifiedBadge?.enabled) publicData.verifiedBadge = true;

  return publicData;
}

export default {
  FEATURE_TYPE,
  canAccess,
  getFeatureLimit,
  buildEntitlements,
  buildDashboardCardDTO,
  buildPublicCardDTO,
};
