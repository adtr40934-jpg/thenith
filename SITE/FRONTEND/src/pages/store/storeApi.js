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

export const createOrder = async (orderData) => {
  const res = await api.client.post("/checkout/order", orderData);
  return res.data;
};

export const validateCoupon = async (code, target = "store") => {
  const res = await api.client.post("/checkout/validate-coupon", { code, target });
  return res.data;
};
