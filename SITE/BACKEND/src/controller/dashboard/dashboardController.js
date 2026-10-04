import Card from "../../models/Card.js";

import Appointment from "../../models/Appointment.js";
import _asyncHandler5014 from "../../util/asyncHandler.js";
const { asyncHandler  } = _asyncHandler5014;
import _httpError2650 from "../../util/httpError.js";
const { HttpError  } = _httpError2650;
import _entitlements5136 from "../../util/entitlements.js";
const { getFeatureLimit  } = _entitlements5136;
import _dashboardNotifications8195 from "../../util/dashboardNotifications.js";
const { addClient, removeClient  } = _dashboardNotifications8195;
import _dashboardResponse2010 from "../../util/dashboardResponse.js";
const { buildActiveCardResponse,
  buildDashboardResponse,
 } = _dashboardResponse2010;

// ── GET /api/dashboard/stream (SSE) ──────────────────────────────────────────
const streamNotifications = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  addClient(req.user._id.toString(), res);
  req.on("close", () => removeClient(req.user._id.toString(), res));
};

// ── GET /api/dashboard ────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (request, response) => {
  const allCards = await Card.find({ userId: request.user._id }).sort({
    createdAt: 1,
  });

  const totalStored = allCards.length;
  const maxCards = getFeatureLimit(request.subscription.entitlements, "maxCards");

  const selectedCard =
    allCards.find((card) => card._id.equals(request.user.activeCardId)) ||
    allCards.find((card) => card.isActive) ||
    allCards[0];

  if (selectedCard) {
    await Card.updateMany(
      { userId: request.user._id, _id: { $ne: selectedCard._id } },
      { $set: { isActive: false } },
    );
    if (!selectedCard.isActive) {
      selectedCard.isActive = true;
      await selectedCard.save();
    }
    if (!request.user.activeCardId?.equals(selectedCard._id)) {
      request.user.activeCardId = selectedCard._id;
      await request.user.save();
    }
  }

  response.json(
    await buildDashboardResponse({
      user: request.user,
      cards: maxCards !== null ? allCards.slice(0, maxCards) : allCards,
      subscription: request.subscription,
      totalStored,
      activeCard: selectedCard,
    }),
  );
});

// ── PATCH /api/dashboard/active-card ─────────────────────────────────────────
const setActiveCard = asyncHandler(async (request, response) => {
  const card = await Card.findOne({
    _id: request.body?.cardId,
    userId: request.user._id,
  });
  if (!card)
    return response
      .status(404)
      .json({ error: { code: "CARD_NOT_FOUND", message: "Card not found" } });

  const maxCards = getFeatureLimit(request.subscription.entitlements, "maxCards");
  if (maxCards !== null) {
    const earlierCards = await Card.countDocuments({
      userId: request.user._id,
      createdAt: { $lt: card.createdAt },
    });
    if (earlierCards >= maxCards) {
      throw new HttpError(
        403,
        "This card is locked because it exceeds your current plan's limits",
      );
    }
  }

  await Card.updateMany(
    { userId: request.user._id },
    { $set: { isActive: false } },
  );
  card.isActive = true;
  await card.save();
  request.user.activeCardId = card._id;
  await request.user.save();

  const allCards = await Card.find({ userId: request.user._id }).sort({
    createdAt: 1,
  });
  response.json(
    await buildActiveCardResponse({
      user: request.user,
      cards: allCards,
      subscription: request.subscription,
      activeCard: card,
    }),
  );
});

import ContactRequest from "../../models/ContactRequest.js";

// ── DELETE /api/dashboard/cards/:cardId/requests/:requestId ──────────────────
const deleteRequest = asyncHandler(async (req, res) => {
  const { cardId, requestId } = req.params;
  const card = await Card.findOne({ _id: cardId, userId: req.user._id });
  if (!card) throw new HttpError(404, "Card not found");
  await ContactRequest.deleteOne({ _id: requestId, cardId });
  card.requests = card.requests.filter((r) => r.id !== requestId);
  card.markModified("requests");
  await card.save();
  res.status(204).send();
});

// ── DELETE /api/dashboard/cards/:cardId/appointments/:appointmentId ───────────
const deleteAppointment = asyncHandler(async (req, res) => {
  const { cardId, appointmentId } = req.params;
  const card = await Card.findOne({ _id: cardId, userId: req.user._id });
  if (!card) throw new HttpError(404, "Card not found");
  await Appointment.deleteOne({ _id: appointmentId, cardId });
  card.appointments = card.appointments.filter((a) => a.id !== appointmentId);
  card.markModified("appointments");
  await card.save();
  res.status(204).send();
});

// ── PUT /api/dashboard/cards/:cardId/requests/:requestId/read ────────────────
const markRequestRead = asyncHandler(async (req, res) => {
  const { cardId, requestId } = req.params;
  const card = await Card.findOne({ _id: cardId, userId: req.user._id });
  if (!card) throw new HttpError(404, "Card not found");
  let updated = false;
  card.requests = card.requests.map((r) => {
    if (r.id === requestId && !r.read) {
      updated = true;
      return { ...r, read: true };
    }
    return r;
  });
  if (updated) {
    card.markModified("requests");
    await card.save();
  }
  res.json({ success: true });
});

// ── PUT /api/dashboard/cards/:cardId/appointments/:appointmentId/read ─────────
const markAppointmentRead = asyncHandler(async (req, res) => {
  const { cardId, appointmentId } = req.params;
  const card = await Card.findOne({ _id: cardId, userId: req.user._id });
  if (!card) throw new HttpError(404, "Card not found");
  let updated = false;
  card.appointments = card.appointments.map((a) => {
    if (a.id === appointmentId && !a.read) {
      updated = true;
      return { ...a, read: true };
    }
    return a;
  });
  if (updated) {
    card.markModified("appointments");
    await card.save();
  }
  res.json({ success: true });
});


export default {
  streamNotifications,
  getDashboard,
  setActiveCard,
  deleteRequest,
  deleteAppointment,
  markRequestRead,
  markAppointmentRead
};
