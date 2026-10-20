import axios from "axios";

const STORAGE_KEY = "thenith_nfc_api_config";

export const DEFAULT_NFC_API_CONFIG = {
  baseUrl: (typeof window !== "undefined" && window.location.origin) ? `${window.location.origin}/api` : "/api",
  endpoints: {
    cardsList: "/admin/cards",
    cardDetails: "/admin/cards/:id",
    provisionSession: "/admin/cards/:id/nfc/provision",
    verifyProvision: "/admin/cards/:id/nfc/verify",
    simulateTest: "/admin/cards/:id/nfc/simulate-test",
    createCard: "/admin/cards",
  },
  authMethod: "bearer", // 'bearer' | 'apiKey' | 'customHeader' | 'none'
  tokenOrKey: "",
  apiKeyHeaderName: "X-API-Key",
  timeout: 15000,
  autoRefreshInterval: 30, // seconds, 0 = disabled
  cardLookupConfig: {
    lookupBy: "any", // 'any' | 'publicId' | 'cardId' | 'url'
    caseSensitive: false,
  },
  fieldMappings: {
    recordId: "_id",
    physicalCardId: "cardId",
    publicId: "publicId",
    customStaticUrl: "targetUrl", // fallback or synthesized `${origin}/c/${publicId}`
    cardPassword: "cardPassword",
    recordStatus: "status",
    provisioningStatus: "nfcProtectionStatus",
    chipType: "nfcChipType",
    lastUpdated: "updatedAt",
  },
};

export function getStoredApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NFC_API_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NFC_API_CONFIG,
      ...parsed,
      endpoints: { ...DEFAULT_NFC_API_CONFIG.endpoints, ...(parsed.endpoints || {}) },
      fieldMappings: { ...DEFAULT_NFC_API_CONFIG.fieldMappings, ...(parsed.fieldMappings || {}) },
      cardLookupConfig: { ...DEFAULT_NFC_API_CONFIG.cardLookupConfig, ...(parsed.cardLookupConfig || {}) },
    };
  } catch (err) {
    console.error("Failed to read NFC API config from storage:", err);
    return { ...DEFAULT_NFC_API_CONFIG };
  }
}

export function saveStoredApiConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error("Failed to save NFC API config to storage:", err);
    return false;
  }
}

export function clearStoredApiConfig() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_NFC_API_CONFIG };
}

// Deep get helper for nested field mappings (e.g. "nfcSecurity.status")
export function getNestedValue(obj, path, fallback = "") {
  if (!obj || !path) return fallback;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current !== undefined && current !== null ? current : fallback;
}

/**
 * Maps a raw backend card record to Thenith standardized internal model
 */
export function mapCardRecord(rawRecord, mappings = DEFAULT_NFC_API_CONFIG.fieldMappings, baseUrl = "") {
  if (!rawRecord) return null;

  const recordId = getNestedValue(rawRecord, mappings.recordId, rawRecord._id || rawRecord.id);
  const cardId = getNestedValue(rawRecord, mappings.physicalCardId, rawRecord.cardId || rawRecord.code || "");
  const publicId = getNestedValue(rawRecord, mappings.publicId, rawRecord.publicId || "");
  const chipType = getNestedValue(rawRecord, mappings.chipType, rawRecord.nfcChipType || "NTAG215");

  // Determine Custom Static URL
  let customStaticUrl = getNestedValue(rawRecord, mappings.customStaticUrl, rawRecord.targetUrl || "");
  if (!customStaticUrl && publicId) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://thenith.com";
    customStaticUrl = `${origin}/c/${publicId}`;
  }

  // Password / credential handling: do not expose unless in provisioning state
  const rawPassword = getNestedValue(rawRecord, mappings.cardPassword, rawRecord.cardPassword || "");
  const hasPassword = Boolean(rawPassword && String(rawPassword).trim().length > 0);

  const status = getNestedValue(rawRecord, mappings.recordStatus, rawRecord.status || "unclaimed");
  const provisioningStatus = getNestedValue(
    rawRecord,
    mappings.provisioningStatus,
    rawRecord.nfcProtectionStatus || rawRecord.nfcSecurityId?.nfcProtectionStatus || "pending_setup"
  );
  const lastUpdated = getNestedValue(rawRecord, mappings.lastUpdated, rawRecord.updatedAt || rawRecord.createdAt || "");

  return {
    raw: rawRecord,
    id: recordId,
    cardId,
    publicId,
    chipType,
    customStaticUrl,
    hasPassword,
    // Sensitive: kept internally for write/verify requests, masked in regular table views
    cardPassword: rawPassword ? String(rawPassword).trim().toUpperCase() : "",
    status, // claimed | unclaimed | disabled
    provisioningStatus, // pending_setup | locked | unlocked | error
    lastUpdated,
    color: rawRecord.color || "black",
    cardType: rawRecord.cardType || "standard",
    distributionType: rawRecord.distributionType || "sale",
    user: rawRecord.userId || null,
  };
}

/**
 * Dedicated Client for NFC Provisioning API
 */
export class NfcApiClient {
  constructor(config = null) {
    this.config = config || getStoredApiConfig();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  buildHeaders(customHeaders = {}) {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const token = this.config.tokenOrKey || (typeof localStorage !== "undefined" ? localStorage.getItem("admin_token") : "");

    if (token) {
      if (this.config.authMethod === "bearer") {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (this.config.authMethod === "apiKey") {
        headers[this.config.apiKeyHeaderName || "X-API-Key"] = token;
      } else if (this.config.authMethod === "customHeader") {
        headers["X-Auth-Token"] = token;
      }
    }

    return headers;
  }

  getAxios() {
    let baseURL = this.config.baseUrl || "/api";
    // Ensure clean baseURL without trailing slash
    baseURL = baseURL.replace(/\/+$/, "");

    return axios.create({
      baseURL,
      timeout: this.config.timeout || 15000,
      withCredentials: true,
      headers: this.buildHeaders(),
    });
  }

  async testConnection() {
    const startTime = Date.now();
    try {
      const client = this.getAxios();
      // Test by pinging cards list endpoint with limit=1 or stats
      const endpoint = this.config.endpoints.cardsList || "/admin/cards";
      const response = await client.get(endpoint, {
        params: { limit: 1 },
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        latencyMs,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        status: err.response?.status || 0,
        message: err.response?.data?.message || err.response?.data?.error || err.message,
        details: err.response?.data,
      };
    }
  }

  async fetchSampleResponse() {
    const client = this.getAxios();
    const endpoint = this.config.endpoints.cardsList || "/admin/cards";
    const response = await client.get(endpoint, {
      params: { limit: 2 },
    });
    return response.data;
  }

  async fetchCardsList({ page = 1, limit = 20, search = "", status = "" } = {}) {
    const client = this.getAxios();
    const endpoint = this.config.endpoints.cardsList || "/admin/cards";

    const params = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await client.get(endpoint, { params });
    const resData = response.data;

    // Normalize raw card array (handles { data: [...] } or direct array)
    const rawCards = Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData?.cards)
      ? resData.cards
      : Array.isArray(resData)
      ? resData
      : [];

    const total = resData?.pagination?.total || resData?.total || rawCards.length;
    const mapped = rawCards.map((c) => mapCardRecord(c, this.config.fieldMappings, this.config.baseUrl));

    return {
      cards: mapped,
      total,
      raw: resData,
    };
  }

  async fetchCardDetails(cardIdOrIdentifier) {
    const client = this.getAxios();
    let endpoint = this.config.endpoints.cardDetails || "/admin/cards/:id";
    endpoint = endpoint.replace(":id", encodeURIComponent(cardIdOrIdentifier));

    const response = await client.get(endpoint);
    const cardData = response.data?.card || response.data?.data || response.data;
    return mapCardRecord(cardData, this.config.fieldMappings, this.config.baseUrl);
  }

  async startProvisionSession(cardId) {
    const client = this.getAxios();
    let endpoint = this.config.endpoints.provisionSession || "/admin/cards/:id/nfc/provision";
    endpoint = endpoint.replace(":id", encodeURIComponent(cardId));

    const response = await client.post(endpoint);
    return response.data?.session || response.data;
  }

  async verifyProvisionResult(cardId, verificationData) {
    const client = this.getAxios();
    let endpoint = this.config.endpoints.verifyProvision || "/admin/cards/:id/nfc/verify";
    endpoint = endpoint.replace(":id", encodeURIComponent(cardId));

    const response = await client.post(endpoint, verificationData);
    return response.data;
  }

  async simulateTestProvision(cardId) {
    const client = this.getAxios();
    let endpoint = this.config.endpoints.simulateTest || "/admin/cards/:id/nfc/simulate-test";
    endpoint = endpoint.replace(":id", encodeURIComponent(cardId));

    const response = await client.post(endpoint);
    return response.data;
  }

  async createNewCard(data) {
    const client = this.getAxios();
    const endpoint = this.config.endpoints.createCard || "/admin/cards";
    const response = await client.post(endpoint, data);
    const rawCreated = response.data?.card || response.data?.data || response.data;
    return mapCardRecord(rawCreated, this.config.fieldMappings, this.config.baseUrl);
  }
}

export const nfcApiClient = new NfcApiClient();
export default nfcApiClient;
