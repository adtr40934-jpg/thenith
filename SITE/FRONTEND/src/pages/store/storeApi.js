import api from "../../api/index.js";

export const formatMoney = (value, currency = "EGP") => {
  let locale = "ar-EG-u-nu-latn";
  try {
    if (localStorage.getItem("global_lang") === "en") {
      locale = "en-EG";
    }
  } catch (e) {
    // Ignore
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export const normalizeProduct = (product = {}, language = 'ar') => {
  const parseObjStr = (val) => {
    if (!val) return "";
    if (typeof val === "object") return val[language] || val.ar || val.en || "";
    if (typeof val === "string" && val.startsWith("{") && val.includes("ar:") && val.includes("en:")) {
      try {
        const arMatch = val.match(/ar:\s*['"]([^'"]+)['"]/);
        const enMatch = val.match(/en:\s*['"]([^'"]+)['"]/);
        if (language === 'ar' && arMatch) return arMatch[1];
        if (language === 'en' && enMatch) return enMatch[1];
        return (arMatch ? arMatch[1] : (enMatch ? enMatch[1] : val));
      } catch {
        return val;
      }
    }
    return val;
  };

  const getName = (nameObj) => parseObjStr(nameObj);
  const getDesc = (descObj) => parseObjStr(descObj);
  return {
    id: product.id || product._id,
    name: getName(product.name),
    rawName: product.name,
    price: Number(product.price || 0),
    currency: product.currency || "EGP",
    image: product.image || product.images?.[0] || "",
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
    desc: getDesc(product.description),
    features: Array.isArray(product.features) ? product.features : [],
    quantity: Number(product.quantity || 0),
    sku: product.sku || "",
    isCustomizable: Boolean(product.isCustomizable),
  };
};

export const loadStoreProducts = async (language = 'ar') => {
  const data = await api.products.list();
  return (data.products || []).map(p => normalizeProduct(p, language)).filter((item) => item.id);
};

export const getShippingRates = async () => {
  try {
    const res = await api.client.get("/shipping-rates");
    return res.data;
  } catch (err) {
    return [];
  }
};

import { getCardDraftImages, clearAllCardDraftImages } from "../../utils/customCardStorage.js";

export const prepareCustomDesignsForOrder = async (items) => {
  const preparedItems = [];
  for (const item of items) {
    if (!item.customDesign) {
      preparedItems.push(item);
      continue;
    }

    const customDesign = { ...item.customDesign };
    const frontIsHosted = typeof customDesign.image === "string" && customDesign.image.startsWith("http");
    const backIsHosted = typeof customDesign.backImage === "string" && customDesign.backImage.startsWith("http");

    if (frontIsHosted && (!customDesign.backImage || backIsHosted)) {
      preparedItems.push({ ...item, customDesign });
      continue;
    }

    // Retrieve high-res images from IndexedDB storage
    const draftImages = (await getCardDraftImages(item.cartItemId || item.id || item.productId)) || {};
    const frontToUpload = draftImages.frontImage || customDesign.image;
    const backToUpload = draftImages.backImage || customDesign.backImage;

    // Upload front high-res design to Cloudinary
    if (frontToUpload && !frontIsHosted) {
      try {
        const uploadRes = await api.client.post("/products/custom-card-design", {
          imageData: frontToUpload,
        });
        if (uploadRes.data?.url) {
          customDesign.image = uploadRes.data.url;
        }
      } catch (err) {
        console.warn("[checkout] Front card design upload failed:", err);
      }
    }

    // Upload back high-res design to Cloudinary
    if (backToUpload && !backIsHosted) {
      try {
        const uploadBackRes = await api.client.post("/products/custom-card-design", {
          imageData: backToUpload,
        });
        if (uploadBackRes.data?.url) {
          customDesign.backImage = uploadBackRes.data.url;
        }
      } catch (err) {
        console.warn("[checkout] Back card design upload failed:", err);
      }
    }

    preparedItems.push({
      ...item,
      customDesign,
    });
  }
  return preparedItems;
};

export const createOrder = async (orderData) => {
  let finalItems = orderData.items;
  if (Array.isArray(finalItems) && finalItems.some((i) => i.customDesign)) {
    finalItems = await prepareCustomDesignsForOrder(finalItems);
  }

  const res = await api.client.post("/checkout/order", {
    ...orderData,
    items: finalItems,
  });

  // Clean up draft storage upon successful order creation
  clearAllCardDraftImages().catch(() => {});

  return res.data;
};

export const validateCoupon = async (code, target = "store") => {
  const res = await api.client.post("/checkout/validate-coupon", { code, target });
  return res.data;
};

