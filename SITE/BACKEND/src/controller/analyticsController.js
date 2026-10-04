import { isValidObjectId } from "mongoose";
import _asyncHandler1727 from "../util/asyncHandler.js";
const { asyncHandler } = _asyncHandler1727;
import _httpError2235 from "../util/httpError.js";
const { HttpError } = _httpError2235;
import Card from "../models/Card.js";
import AnalyticEvent from "../models/AnalyticEvent.js";
import geoip from "geoip-lite";

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
  const visitorId = req.cookies?.visitorId || "";

  await AnalyticEvent.create({
    cardId: card._id,
    eventType: "visit",
    country,
    visitorId,
  });
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
    const matchingLink = card.links.find((link) => link?.id === linkId);
    if (matchingLink) {
      targetUrl =
        matchingLink.url || matchingLink.href || matchingLink.value || "";
    }
  }

  if (!targetUrl || targetUrl.length > 2048) {
    throw new HttpError(400, "A valid linkUrl or linkId is required");
  }

  const cardLinks = card.links.map(
    (link) => link?.url || link?.href || link?.value || "",
  );
  if (!cardLinks.includes(targetUrl)) {
    throw new HttpError(400, "The link does not belong to this card");
  }

  const bodyCountry = typeof req.body?.country === "string" && req.body.country.length === 2
    ? req.body.country.toUpperCase()
    : null;
  const country = bodyCountry || getCountryFromIP(req);
  const visitorId = req.cookies?.visitorId || "";

  await AnalyticEvent.create({
    cardId: card._id,
    eventType: "click",
    country,
    linkUrl: linkUrl || "",
    visitorId,
  });
  res.status(204).send();
});

export default {
  trackVisit,
  trackClick,
};
