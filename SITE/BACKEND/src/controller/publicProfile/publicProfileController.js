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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findCardById(identifier) {
  let card = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    card = await Card.findById(identifier);
  }
  if (!card) card = await Card.findOne({ publicId: identifier });
  if (!card) throw new HttpError(404, "Public card not found");
  return card;
}

async function findUserByPublicIdentifier(identifier) {
  const normalized = identifier.trim().toLowerCase();
  const user = await User.findOne({
    isActive: { $ne: false },
    $or: [{ publicId: normalized }, { username: normalized }],
  });
  if (!user) throw new HttpError(404, "Public profile not found");
  return user;
}

// ── GET /p/:identifier (also /:identifier) ────────────────────────────────────
const getPublicProfile = asyncHandler(async (request, response) => {
  const identifier = request.params.identifier;
  let user = await findUserByPublicIdentifier(identifier).catch(() => null);
  let subscription = null;

  if (user) {
    subscription = await getSubscriptionState(user._id);
    if (
      user.username &&
      identifier.trim().toLowerCase() === user.username.toLowerCase() &&
      !canAccess(subscription.entitlements, "customLink")
    ) {
      user = null;
    }
  }

  let card = null;
  if (user) {
    if (user.activeCardId) {
      card = await Card.findOne({ _id: user.activeCardId, userId: user._id });
    }
    if (!card) {
      card =
        (await Card.findOne({ userId: user._id, isActive: true })) ||
        (await Card.findOne({ userId: user._id }).sort({ createdAt: 1 }));
    }
  } else {
    card = await findCardById(identifier).catch(() => null);
    if (card) {
      user = await User.findOne({ _id: card.userId, isActive: { $ne: false } });
      if (!user) card = null;
      if (card) subscription = await getSubscriptionState(card.userId);
    }
  }

  if (!card) throw new HttpError(404, "Public card not found");

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

  response.json({
    ...cardObj,
    userPublicId: user?.publicId || null,
    username: canUseUsername ? user.username : null,
    profileUrl: primaryLink,
  });
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
};
