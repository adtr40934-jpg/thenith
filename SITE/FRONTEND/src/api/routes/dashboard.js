import { request } from "../client.js";

export const dashboardRoutes = {
  overview: () => request("/dashboard"),

  stream: () => request("/dashboard/stream"),

  setActiveCard: (cardId = "") =>
    request("/dashboard/active-card", {
      method: "PATCH",
      data: { cardId },
    }),

  deleteRequest: (cardId, requestId) =>
    request(
      `/dashboard/cards/${encodeURIComponent(cardId)}/requests/${encodeURIComponent(requestId)}`,
      { method: "DELETE" },
    ),

  markRequestRead: (cardId, requestId) =>
    request(
      `/dashboard/cards/${encodeURIComponent(cardId)}/requests/${encodeURIComponent(requestId)}/read`,
      { method: "PUT" },
    ),

  deleteAppointment: (cardId, appointmentId) =>
    request(
      `/dashboard/cards/${encodeURIComponent(cardId)}/appointments/${encodeURIComponent(appointmentId)}`,
      { method: "DELETE" },
    ),

  markAppointmentRead: (cardId, appointmentId) =>
    request(
      `/dashboard/cards/${encodeURIComponent(cardId)}/appointments/${encodeURIComponent(appointmentId)}/read`,
      { method: "PUT" },
    ),
};

export default dashboardRoutes;
