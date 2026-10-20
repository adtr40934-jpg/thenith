import mongoose from "mongoose";
import _asyncHandler2226 from "../../util/asyncHandler.js";
const { asyncHandler } = _asyncHandler2226;
import _httpError391 from "../../util/httpError.js";
const { HttpError } = _httpError391;
import Card, { ensurePrimaryContacts } from "../../models/Card.js";
import User from "../../models/User.js";
import ContactRequest from "../../models/ContactRequest.js";
import _subscriptionService4542 from "../../services/subscriptionService.js";
const { getSubscriptionState } = _subscriptionService4542;
import _entitlements1852 from "../../util/entitlements.js";
const { canAccess, getFeatureLimit, buildPublicCardDTO } = _entitlements1852;
import _env1982 from "../../config/env.js";
const { env } = _env1982;

// ── In-Memory LRU/TTL Caching for Public Profiles ──────────────────────────────
const profileCache = new Map();
const negative404Cache = new Map();
const PROFILE_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const NEGATIVE_CACHE_TTL_MS = 10 * 1000; // 10 seconds for 404 lookups
const MAX_CACHE_ENTRIES = 500;

export function invalidateProfileCache(identifier = null) {
  if (identifier) {
    const key = String(identifier).trim().toLowerCase();
    profileCache.delete(key);
    negative404Cache.delete(key);
  } else {
    profileCache.clear();
    negative404Cache.clear();
  }
}

export function invalidateProfileCacheForUser(userId, publicId = null, username = null) {
  if (publicId) {
    const pKey = String(publicId).trim().toLowerCase();
    profileCache.delete(pKey);
    negative404Cache.delete(pKey);
  }
  if (username) {
    const uKey = String(username).trim().toLowerCase();
    profileCache.delete(uKey);
    negative404Cache.delete(uKey);
  }
  const uIdStr = String(userId);
  for (const [key, val] of profileCache.entries()) {
    if (val.userId === uIdStr || val.data?.userPublicId === publicId) {
      profileCache.delete(key);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findCardById(identifier) {
  let card = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    card = await Card.findById(identifier).lean();
  }
  if (!card) card = await Card.findOne({ publicId: identifier }).lean();
  if (!card) throw new HttpError(404, "Public card not found");
  return card;
}

async function findUserByPublicIdentifier(identifier) {
  const normalized = identifier.trim().toLowerCase();
  const user = await User.findOne({
    isActive: { $ne: false },
    $or: [{ publicId: normalized }, { username: normalized }],
  })
    .select("_id publicId username activeCardId isActive")
    .lean();
  if (!user) throw new HttpError(404, "Public profile not found");
  return user;
}

// ── GET /p/:identifier (also /:identifier) ────────────────────────────────────
const getPublicProfile = asyncHandler(async (request, response) => {
  const identifier = request.params.identifier;
  const normalizedId = String(identifier).trim().toLowerCase();
  const now = Date.now();

  // 1. Negative 404 cache check
  const cached404 = negative404Cache.get(normalizedId);
  if (cached404 && now - cached404 < NEGATIVE_CACHE_TTL_MS) {
    throw new HttpError(404, "Public profile not found");
  }

  // 2. Positive cache check
  const cached = profileCache.get(normalizedId);
  if (cached && now - cached.timestamp < PROFILE_CACHE_TTL_MS) {
    response.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=45");
    return response.json(cached.data);
  }

  let user = await findUserByPublicIdentifier(identifier).catch(() => null);
  let subscription = null;
  let card = null;

  if (user) {
    // Parallelize subscription and active card lookup
    [subscription, card] = await Promise.all([
      getSubscriptionState(user._id),
      Card.findActiveForUser(user._id, user.activeCardId),
    ]);

    if (
      user.username &&
      identifier.trim().toLowerCase() === user.username.toLowerCase() &&
      !canAccess(subscription.entitlements, "customLink")
    ) {
      user = null;
      card = null;
    }
  }

  if (!card) {
    card = await findCardById(identifier).catch(() => null);
    if (card) {
      [user, subscription] = await Promise.all([
        User.findOne({ _id: card.userId, isActive: { $ne: false } })
          .select("_id publicId username activeCardId isActive")
          .lean(),
        getSubscriptionState(card.userId),
      ]);
      if (!user) card = null;
    }
  }

  if (!card) {
    negative404Cache.set(normalizedId, now);
    throw new HttpError(404, "Public card not found");
  }

  const maxCards = getFeatureLimit(subscription.entitlements, "maxCards");
  if (maxCards !== null) {
    const earlierCards = await Card.countDocuments({
      userId: card.userId,
      createdAt: { $lt: card.createdAt },
    });
    if (earlierCards >= maxCards)
      throw new HttpError(404, "This profile is currently locked");
  }

  let cardObj = buildPublicCardDTO(card, subscription.entitlements);
  cardObj.contacts = ensurePrimaryContacts(cardObj.contacts);

  const canUseUsername =
    user?.username && canAccess(subscription.entitlements, "customLink");
  const baseUrl = env.APP_URL
    ? env.APP_URL.replace(/\/+$/, "")
    : "http://localhost:3000";
  const userIdentifier = canUseUsername
    ? user.username
    : user?.publicId || card.publicId;
  const primaryLink = `${baseUrl}/p/${userIdentifier}`;

  const responsePayload = {
    ...cardObj,
    userPublicId: user?.publicId || null,
    username: canUseUsername ? user.username : null,
    profileUrl: primaryLink,
  };

  // Cache positive response (LRU eviction if limit reached)
  if (profileCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = profileCache.keys().next().value;
    profileCache.delete(oldestKey);
  }
  const uIdStr = String(user?._id || card.userId);
  profileCache.set(normalizedId, { data: responsePayload, timestamp: now, userId: uIdStr });
  if (user?.publicId) {
    profileCache.set(String(user.publicId).toLowerCase(), { data: responsePayload, timestamp: now, userId: uIdStr });
  }
  if (canUseUsername && user?.username) {
    profileCache.set(String(user.username).toLowerCase(), { data: responsePayload, timestamp: now, userId: uIdStr });
  }

  response.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=45");
  response.json(responsePayload);
});

// ── POST /public/contact ──────────────────────────────────────────────────────
const submitContact = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "")
    .trim()
    .slice(0, 120);
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const phone = String(req.body?.phone || "")
    .trim()
    .slice(0, 40);
  const subject = String(req.body?.subject || "بدون عنوان")
    .trim()
    .slice(0, 160);
  const message = String(req.body?.message || "")
    .trim()
    .slice(0, 2000);
  if (!name || !email || !message) {
    throw new HttpError(400, "الاسم، البريد، والرسالة مطلوبة");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(400, "A valid email address is required");
  }
  await ContactRequest.create({
    type: "platform_contact",
    name,
    email,
    phone: phone || "",
    subject: subject || "بدون عنوان",
    message,
    isRead: false,
  });
  res.status(201).json({ success: true, message: "تم إرسال رسالتك بنجاح." });
});

export default {
  getPublicProfile,
  submitContact,
  invalidateProfileCache,
  invalidateProfileCacheForUser,
};
