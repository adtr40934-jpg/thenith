// ── IndexedDB Storage for High-Resolution Custom Card Drafts ────────────────
// Keeps large 2048x1292 base64 canvas exports safe without crashing localStorage quota,
// and ensures card designs are NOT uploaded to Cloudinary until the order is actually placed.

const DB_NAME = "thenith_card_storage";
const DB_VERSION = 1;
const STORE_NAME = "card_draft_images";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "cartItemId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save high-res front and back images in IndexedDB for a given cart item
 */
export async function saveCardDraftImages(cartItemId, { frontImage, backImage }) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const data = {
        cartItemId,
        frontImage: frontImage || null,
        backImage: backImage || null,
        updatedAt: Date.now(),
      };
      const req = store.put(data);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[customCardStorage] Could not save to IndexedDB:", err);
    return false;
  }
}

/**
 * Retrieve high-res images for a cart item
 */
export async function getCardDraftImages(cartItemId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cartItemId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("[customCardStorage] Could not read from IndexedDB:", err);
    return null;
  }
}

/**
 * Delete draft images from IndexedDB when an item is removed from cart
 */
export async function deleteCardDraftImages(cartItemId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(cartItemId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Clear all draft images after full order submission
 */
export async function clearAllCardDraftImages() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Generate a lightweight WebP/JPEG thumbnail from a full-res data URL for the cart
 */
export async function createThumbnailFromDataUrl(dataUrl, targetWidth = 360) {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, targetWidth / img.width);
        const targetHeight = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const webp = canvas.toDataURL("image/webp", 0.75);
          if (webp && webp.startsWith("data:image/webp")) {
            return resolve(webp);
          }
        } catch (_) {}
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (_) {
      resolve(dataUrl);
    }
  });
}
