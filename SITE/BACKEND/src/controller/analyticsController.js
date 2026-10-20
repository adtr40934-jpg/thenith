import { isValidObjectId } from "mongoose";
import _asyncHandler1727 from "../util/asyncHandler.js";
const { asyncHandler } = _asyncHandler1727;
import _httpError2235 from "../util/httpError.js";
const { HttpError } = _httpError2235;
import Card from "../models/Card.js";
import AnalyticEvent from "../models/AnalyticEvent.js";
import geoip from "geoip-lite";
import crypto from "crypto";

import _dashboardNotifications from "../util/dashboardNotifications.js";
const { notifyUser } = _dashboardNotifications;

function getDeviceFingerprint(req, res) {
  const bodyDeviceId = typeof req.body?.deviceId === "string" && req.body.deviceId.trim()
    ? req.body.deviceId.trim()
    : null;

  const cookieVid = req.cookies?.visitorId || "";

  const ip = req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";
  const ipHash = crypto.createHash("sha256").update(`${ip}-${userAgent}`).digest("hex").slice(0, 32);

  const finalVid = bodyDeviceId || cookieVid || `fp_${ipHash}`;

  if (!cookieVid && res && typeof res.cookie === "function") {
    try {
      res.cookie("visitorId", finalVid, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    } catch {}
  }

  return { visitorId: finalVid, ipHash: `fp_${ipHash}` };
}

function getCountryFromIP(req) {
  // Check Cloudflare country header first
  if (req.headers["cf-ipcountry"]) {
    return req.headers["cf-ipcountry"];
  }

  // Extract real IP behind proxies
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  
  let ip = req.ip || req.socket?.remoteAddress || "";
  
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp;
  }

  // If local development IP, we can't geo-lookup accurately, but geoip will just return null
  const geo = geoip.lookup(ip);
  return geo?.country || "Unknown";
}

// ── POST /api/analytics/:cardId/visit ────────────────────────────────────────
const trackVisit = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const card = await Card.findOne({
    $or: [
      { _id: isValidObjectId(cardId) ? cardId : null },
      { publicId: cardId },
    ],
  });
  if (!card) throw new HttpError(404, "Card not found");

  // Prefer country sent from frontend (accurate), fallback to IP-based detection
  const bodyCountry = typeof req.body?.country === "string" && req.body.country.length === 2
    ? req.body.country.toUpperCase()
    : null;
  const country = bodyCountry || getCountryFromIP(req);

  const { visitorId, ipHash } = getDeviceFingerprint(req, res);

  // Maximum 3 visits per device per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const visitConditions = [{ visitorId }];
  if (ipHash && ipHash !== visitorId) {
    visitConditions.push({ visitorId: ipHash });
  }

  const existingVisitsToday = await AnalyticEvent.countDocuments({
    cardId: card._id,
    eventType: "visit",
    createdAt: { $gte: todayStart },
    $or: visitConditions,
  });

  if (existingVisitsToday >= 3) {
    // Daily cap of 3 visits per device reached
    return res.status(200).json({ recorded: false, reason: "Daily limit of 3 visits per device reached" });
  }

  await AnalyticEvent.create({
    cardId: card._id,
    eventType: "visit",
    country,
    visitorId,
  });

  // Real-time notification to card owner's dashboard
  if (card.userId) {
    notifyUser(card.userId.toString(), {
      type: "analytics_update",
      cardId: card._id.toString(),
      eventType: "visit",
    });
  }

  res.status(204).send();
});

// ── POST /api/analytics/:cardId/click ────────────────────────────────────────
const trackClick = asyncHandler(async (req, res) => {
  const { cardId } = req.params;
  const { linkUrl, linkId } = req.body;

  const card = await Card.findOne({
    $or: [
      { _id: isValidObjectId(cardId) ? cardId : null },
      { publicId: cardId },
    ],
  });
  if (!card) throw new HttpError(404, "Card not found");

  let targetUrl = typeof linkUrl === "string" ? linkUrl : "";
  if (!targetUrl && linkId) {
    const matchingLink = (card.links || []).find((link) => link?.id === linkId);
    if (matchingLink) {
      targetUrl =
        matchingLink.url || matchingLink.href || matchingLink.value || "";
    }
  }

  if (!targetUrl || targetUrl.length > 2048) {
    throw new HttpError(400, "A valid linkUrl or linkId is required");
  }

  // Collect all valid URLs belonging to this card (links + contacts)
  const allowedUrls = new Set();
  (card.links || []).forEach((link) => {
    const u = link?.url || link?.href || link?.value;
    if (u) allowedUrls.add(u);
  });
  (card.contacts || []).forEach((contact) => {
    const val = contact?.value || contact?.url;
    if (val) {
      allowedUrls.add(val);
      allowedUrls.add(`tel:${val.replace(/\s+/g, "")}`);
      allowedUrls.add(`mailto:${val.trim()}`);
      allowedUrls.add(`https://wa.me/${val.replace(/[^0-9]/g, "")}`);
    }
    if (contact?.url) allowedUrls.add(contact.url);
  });

  const isAllowed = allowedUrls.has(targetUrl) ||
    [...allowedUrls].some((u) => u && (targetUrl.includes(u) || u.includes(targetUrl)));

  if (!isAllowed) {
    throw new HttpError(400, "The link does not belong to this card");
  }

  const bodyCountry = typeof req.body?.country === "string" && req.body.country.length === 2
    ? req.body.country.toUpperCase()
    : null;
  const country = bodyCountry || getCountryFromIP(req);
  const { visitorId } = getDeviceFingerprint(req, res);

  await AnalyticEvent.create({
    cardId: card._id,
    eventType: "click",
    country,
    linkUrl: targetUrl,
    visitorId,
  });

  // Real-time notification to card owner's dashboard
  if (card.userId) {
    notifyUser(card.userId.toString(), {
      type: "analytics_update",
      cardId: card._id.toString(),
      eventType: "click",
      linkUrl: targetUrl,
    });
  }

  res.status(204).send();
});

export default {
  trackVisit,
  trackClick,
};
