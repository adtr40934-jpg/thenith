import apiClient from "../api/client.js";

export async function adminFetch(path, options = {}) {
  const token = localStorage.getItem("admin_token");
  const { data } = await apiClient({
    url: path,
    method: "GET",
    withCredentials: true,
    ...options,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  return data;
}

export async function loginAdmin(username, password) {
  const { data } = await apiClient.post(
    "/admin/login",
    { username, password },
    { withCredentials: true },
  );

  if (data?.token) {
    localStorage.setItem("admin_token", data.token);
  }

  return data;
}

// ===== STATS =====
export async function fetchStats() {
  return adminFetch("/admin/stats");
}

// ===== USERS =====
export async function fetchUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return adminFetch(`/admin/users${query ? `?${query}` : ""}`);
}

export async function createUser(data) {
  return adminFetch("/admin/users", {
    method: "POST",
    data,
  });
}

export async function updateUser(id, data) {
  return adminFetch(`/admin/users/${id}`, {
    method: "PATCH",
    data,
  });
}

export async function toggleBanUser(id) {
  return adminFetch(`/admin/users/${id}/ban`, { method: "PATCH" });
}

export async function changeUserPlan(id, data) {
  return adminFetch(`/admin/users/${id}/plan`, {
    method: "PATCH",
    data,
  });
}

export async function deleteUser(id) {
  return adminFetch(`/admin/users/${id}`, { method: "DELETE" });
}

export async function fetchUserCards(userId) {
  return adminFetch(`/admin/users/${userId}/cards`);
}

export async function fetchCard(cardId) {
  return adminFetch(`/admin/cards/${cardId}`);
}

export async function updateCard(cardId, data) {
  return adminFetch(`/admin/cards/${cardId}`, {
    method: "PATCH",
    data,
  });
}

export async function deleteCard(cardId) {
  return adminFetch(`/admin/cards/${cardId}`, { method: "DELETE" });
}

// ===== PLANS =====
export async function fetchPlans() {
  return adminFetch("/admin/plans");
}

export async function createPlan(data) {
  return adminFetch("/admin/plans", {
    method: "POST",
    data,
  });
}

export async function updatePlan(id, data) {
  return adminFetch(`/admin/plans/${id}`, {
    method: "PUT",
    data,
  });
}

export async function deletePlan(id) {
  return adminFetch(`/admin/plans/${id}`, { method: "DELETE" });
}

export async function fetchSubscriptionStats() {
  return adminFetch("/admin/subscriptions/stats");
}

export async function fetchFilteredUsers(filter) {
  return adminFetch(`/admin/subscriptions/filtered-users?filter=${filter}`);
}

// ===== UPLOAD =====
export async function uploadAdminImage(base64Image, folder = "thenith_admin") {
  return adminFetch("/admin/upload", {
    method: "POST",
    data: { image: base64Image, folder },
  });
}

// ===== PRODUCTS =====
export async function fetchProducts() {
  return adminFetch("/admin/products");
}

export async function createProduct(data) {
  return adminFetch("/admin/products", {
    method: "POST",
    data,
  });
}

export async function updateProduct(id, data) {
  return adminFetch(`/admin/products/${id}`, {
    method: "PUT",
    data,
  });
}

export async function deleteProduct(id) {
  return adminFetch(`/admin/products/${id}`, { method: "DELETE" });
}

// ===== STORE STATS & ORDERS =====
export async function fetchStoreStats() {
  return adminFetch("/admin/store/stats");
}

export async function fetchOrders() {
  return adminFetch("/admin/orders");
}

export async function updateOrderStatus(id, data) {
  return adminFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    data,
  });
}

export async function deleteOrder(id) {
  return adminFetch(`/admin/orders/${id}`, { method: "DELETE" });
}

// ===== COUPONS =====
export async function fetchCoupons() {
  return adminFetch("/admin/coupons");
}

export async function createCoupon(data) {
  return adminFetch("/admin/coupons", {
    method: "POST",
    data,
  });
}

export async function updateCoupon(id, data) {
  return adminFetch(`/admin/coupons/${id}`, {
    method: "PUT",
    data,
  });
}

export async function deleteCoupon(id) {
  return adminFetch(`/admin/coupons/${id}`, { method: "DELETE" });
}

// ===== STORE SETTINGS =====
export async function fetchStoreSettings() {
  return adminFetch("/admin/settings/store");
}

export async function updateStoreSettings(data) {
  return adminFetch("/admin/settings/store", {
    method: "PUT",
    data,
  });
}

export async function fetchSiteSettings() {
  return adminFetch("/admin/settings");
}

export async function updateSiteSettings(data) {
  return adminFetch("/admin/settings", {
    method: "PUT",
    data,
  });
}

export async function fetchCmsSettings() {
  return adminFetch("/admin/settings/landing");
}

export async function updateCmsSettings(data) {
  return adminFetch("/admin/settings/landing", {
    method: "PUT",
    data,
  });
}

// ===== MESSAGES (INBOX) =====
export async function fetchMessages() {
  return adminFetch("/admin/messages");
}

export async function markMessageRead(id) {
  return adminFetch(`/admin/messages/${id}/read`, { method: "PATCH" });
}

export async function deleteMessage(id) {
  return adminFetch(`/admin/messages/${id}`, { method: "DELETE" });
}

export async function fetchShippingRates() { return adminFetch('/admin/shipping-rates'); }
export async function createShippingRate(data) { return adminFetch('/admin/shipping-rates', { method: 'POST', data }); }
export async function updateShippingRate(id, data) { return adminFetch('/admin/shipping-rates/' + id, { method: 'PUT', data }); }
export async function deleteShippingRate(id) { return adminFetch('/admin/shipping-rates/' + id, { method: 'DELETE' }); }

export async function bulkUpdateShippingCost(data) { return adminFetch('/admin/shipping-rates/bulk-update', { method: 'POST', data }); }

// ===== PHYSICAL SMART CARDS MANAGEMENT =====
export async function fetchPhysicalCards(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      query.append(key, val);
    }
  });
  const qs = query.toString();
  return adminFetch(`/admin/cards${qs ? `?${qs}` : ""}`);
}

export async function fetchPhysicalCardStats() {
  return adminFetch("/admin/cards/stats");
}

export async function createPhysicalCard(data) {
  return adminFetch("/admin/cards", {
    method: "POST",
    data,
  });
}

export async function createBulkPhysicalCards(data) {
  return adminFetch("/admin/cards/bulk", {
    method: "POST",
    data,
  });
}

export async function fetchPhysicalCardDetails(id) {
  return adminFetch(`/admin/cards/${id}`);
}

export async function updatePhysicalCardDetails(id, data) {
  return adminFetch(`/admin/physical-cards/${id}`, {
    method: "PATCH",
    data,
  });
}

export async function updatePhysicalCardStatus(id, data) {
  return adminFetch(`/admin/cards/${id}/status`, {
    method: "PATCH",
    data,
  });
}

export async function unlinkPhysicalCard(id) {
  return adminFetch(`/admin/cards/${id}/unlink`, {
    method: "POST",
  });
}

export async function deletePhysicalCard(id) {
  return adminFetch(`/admin/physical-cards/${id}`, {
    method: "DELETE",
  });
}

export async function fetchPhysicalCardQr(id, format = "png") {
  return adminFetch(`/admin/cards/${id}/qr?format=${format}`);
}

export async function fetchPhysicalCardLogs(id) {
  return adminFetch(`/admin/cards/${id}/logs`);
}

export async function startNfcProvisioning(id) {
  return adminFetch(`/admin/cards/${id}/nfc/provision`, {
    method: "POST",
  });
}

export async function verifyNfcProvisioning(id, data) {
  return adminFetch(`/admin/cards/${id}/nfc/verify`, {
    method: "POST",
    data,
  });
}

export async function simulateNfcTest(id) {
  return adminFetch(`/admin/cards/${id}/nfc/simulate-test`, {
    method: "POST",
  });
}

// ===== CARD BATCHES & INVENTORY =====
export async function fetchCardBatches() {
  return adminFetch("/admin/card-batches");
}

export async function createCardBatch(data) {
  return adminFetch("/admin/card-batches", {
    method: "POST",
    data,
  });
}

export async function fetchCardBatchDetails(id) {
  return adminFetch(`/admin/card-batches/${id}`);
}
