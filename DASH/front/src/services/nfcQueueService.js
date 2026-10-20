const QUEUE_STORAGE_KEY = "thenith_nfc_provision_queue";
const HISTORY_STORAGE_KEY = "thenith_nfc_provision_history";

export function getProvisionQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProvisionQueue(queue) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save provision queue:", err);
  }
}

export function addToProvisionQueue(cardItem) {
  const queue = getProvisionQueue();
  const existingIdx = queue.findIndex((q) => q.cardId === cardItem.cardId || q.id === cardItem.id);
  const queueEntry = {
    ...cardItem,
    queueStatus: "queued", // 'queued' | 'processing' | 'awaiting_verification' | 'manual_match' | 'api_error' | 'unsupported_op' | 'failed' | 'completed'
    addedAt: new Date().toISOString(),
    retryCount: 0,
    lastError: null,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = { ...queue[existingIdx], ...queueEntry };
  } else {
    queue.unshift(queueEntry);
  }
  saveProvisionQueue(queue);
  return queue;
}

export function updateQueueItemStatus(identifier, newStatus, extra = {}) {
  const queue = getProvisionQueue();
  const updated = queue.map((item) => {
    if (item.cardId === identifier || item.id === identifier || item.publicId === identifier) {
      return {
        ...item,
        queueStatus: newStatus,
        updatedAt: new Date().toISOString(),
        ...extra,
      };
    }
    return item;
  });
  saveProvisionQueue(updated);
  return updated;
}

export function removeQueueItem(identifier) {
  const queue = getProvisionQueue();
  const filtered = queue.filter((i) => i.cardId !== identifier && i.id !== identifier);
  saveProvisionQueue(filtered);
  return filtered;
}

export function clearCompletedQueue() {
  const queue = getProvisionQueue();
  const filtered = queue.filter((i) => i.queueStatus !== "completed");
  saveProvisionQueue(filtered);
  return filtered;
}

// History Log
export function getProvisionHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendProvisionHistory(entry) {
  try {
    const history = getProvisionHistory();
    const newEntry = {
      id: "LOG-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      cardId: entry.cardId || "N/A",
      publicId: entry.publicId || "N/A",
      targetUrl: entry.targetUrl || "N/A",
      chipType: entry.chipType || "NTAG215",
      operation: entry.operation || "PROVISION_WRITE_AND_LOCK",
      writeStatus: entry.writeStatus || "success",
      protectionStatus: entry.protectionStatus || "locked",
      hardwareUid: entry.hardwareUid || null,
      apiSyncStatus: entry.apiSyncStatus || "synced",
      errorMessage: entry.errorMessage ? String(entry.errorMessage).slice(0, 300) : null,
      // Passwords are never saved in logs!
      hasPasswordConfigured: Boolean(entry.hasPasswordConfigured),
    };

    history.unshift(newEntry);
    // Keep last 200 history logs
    const trimmed = history.slice(0, 200);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.error("Failed to append provision history:", err);
    return [];
  }
}

export function clearProvisionHistory() {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  return [];
}
