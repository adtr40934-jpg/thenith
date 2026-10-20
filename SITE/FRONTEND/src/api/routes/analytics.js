import { publicClient } from "../client.js";

// Cache the detected country for the current session
let _detectedCountry = null;

async function detectCountry() {
  if (_detectedCountry !== null) return _detectedCountry;
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) {
        _detectedCountry = data.country_code;
        return _detectedCountry;
      }
    }
  } catch {
    try {
      const r = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(600) });
      const text = await r.text();
      const match = text.match(/loc=(\w+)/);
      if (match?.[1]) {
        _detectedCountry = match[1];
        return _detectedCountry;
      }
    } catch { /* ignore */ }
  }
  _detectedCountry = "";
  return null;
}

function getDeviceId() {
  try {
    let id = localStorage.getItem("thenith_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("thenith_device_id", id);
    }
    return id;
  } catch {
    return "";
  }
}

export const analyticsRoutes = {
  trackVisit: async (cardId) => {
    const country = await detectCountry();
    const deviceId = getDeviceId();
    const body = {
      ...(country ? { country } : {}),
      ...(deviceId ? { deviceId } : {}),
    };
    const response = await publicClient.post(
      `/analytics/${encodeURIComponent(cardId)}/visit`,
      body,
    );
    return response.data;
  },

  trackClick: async (cardId, payload) => {
    const country = await detectCountry();
    const deviceId = getDeviceId();
    const base =
      typeof payload === "string"
        ? { linkUrl: payload, linkId: payload }
        : payload;

    const data = {
      ...base,
      ...(country ? { country } : {}),
      ...(deviceId ? { deviceId } : {}),
    };

    const response = await publicClient.post(
      `/analytics/${encodeURIComponent(cardId)}/click`,
      data,
    );
    return response.data;
  },
};

export default analyticsRoutes;
