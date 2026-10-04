import { publicClient } from "../client.js";

// Cache the detected country for the current session
let _detectedCountry = null;

async function detectCountry() {
  if (_detectedCountry) return _detectedCountry;
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) {
        _detectedCountry = data.country_code;
        return _detectedCountry;
      }
    }
  } catch {
    // fallback: try cloudflare trace
    try {
      const r = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
      const text = await r.text();
      const match = text.match(/loc=(\w+)/);
      if (match?.[1]) {
        _detectedCountry = match[1];
        return _detectedCountry;
      }
    } catch { /* ignore */ }
  }
  return null;
}

export const analyticsRoutes = {
  trackVisit: async (cardId) => {
    const country = await detectCountry();
    const response = await publicClient.post(
      `/analytics/${encodeURIComponent(cardId)}/visit`,
      country ? { country } : {},
    );
    return response.data;
  },

  trackClick: async (cardId, payload) => {
    const country = await detectCountry();
    const base =
      typeof payload === "string"
        ? { linkUrl: payload, linkId: payload }
        : payload;

    const data = country ? { ...base, country } : base;

    const response = await publicClient.post(
      `/analytics/${encodeURIComponent(cardId)}/click`,
      data,
    );
    return response.data;
  },
};

export default analyticsRoutes;
