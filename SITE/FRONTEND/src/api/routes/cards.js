import { request, publicClient } from "../client.js";

export const cardRoutes = {
  list: () => request("/cards"),

  create: (name) =>
    request("/cards", {
      method: "POST",
      data: { name },
    }),

  update: (cardId, cardData) =>
    request(`/cards/${encodeURIComponent(cardId)}`, {
      method: "PATCH",
      data: cardData,
    }),

  reorderLinks: (cardId, linkIds = []) =>
    request(`/cards/${encodeURIComponent(cardId)}/links/reorder`, {
      method: "PATCH",
      data: { linkIds },
    }),

  delete: (cardId) =>
    request(`/cards/${encodeURIComponent(cardId)}`, {
      method: "DELETE",
    }),

  getPublicCard: async (cardId) => {
    const response = await publicClient.get(
      `/cards/public/${encodeURIComponent(cardId)}`,
    );
    return response.data;
  },

  // NFC — backend determines the canonical URL; frontend only initiates the write
  getNfcPayload: () =>
    request("/cards/nfc-payload", { method: "POST" }),

  recordNfcLinked: () =>
    request("/cards/nfc-linked", { method: "POST" }),

  // Physical NFC Card Registry
  listPhysicalCards: () =>
    request("/cards/physical"),

  registerPhysicalCard: (scannedUrl, label = "", serialNumber = null, ndefRecords = [], scanMeta = null) =>
    request("/cards/physical/register", {
      method: "POST",
      data: { scannedUrl, label, serialNumber, ndefRecords, scanMeta },
    }),

  deletePhysicalCard: (id) =>
    request(`/cards/physical/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export default cardRoutes;

