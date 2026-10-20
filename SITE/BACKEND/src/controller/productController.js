import mongoose from "mongoose";
import Product from "../models/Product.js";
import _asyncHandler4553 from "../util/asyncHandler.js";
const { asyncHandler  } = _asyncHandler4553;
import _httpError8715 from "../util/httpError.js";
const { HttpError  } = _httpError8715;

const toPublicProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  description: product.description || "",
  images: product.images || [],
  image: product.images?.[0] || "",
  price: product.price,
  currency: product.currency || "EGP",
  quantity: product.quantity,
  category: product.category || "",
  sku: product.sku || "",
  isCustomizable: Boolean(product.isCustomizable),
});

let cachedProductsList = null;
let cachedProductsListTime = 0;
const cachedProductById = new Map();
const PRODUCTS_CACHE_TTL_MS = 60 * 1000;

export function invalidateProductsCache(id = null) {
  cachedProductsList = null;
  cachedProductsListTime = 0;
  if (id) {
    cachedProductById.delete(id.toString());
  } else {
    cachedProductById.clear();
  }
}

const getPublicProducts = asyncHandler(async (_request, response) => {
  response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");

  const now = Date.now();
  if (cachedProductsList && now - cachedProductsListTime < PRODUCTS_CACHE_TTL_MS) {
    return response.json(cachedProductsList);
  }

  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .select("name description images price currency quantity sku category isCustomizable")
    .lean();

  const result = { products: products.map(toPublicProduct) };
  cachedProductsList = result;
  cachedProductsListTime = now;

  response.json(result);
});

const getPublicProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(404, "Product not found");
  }

  response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");

  const now = Date.now();
  const cached = cachedProductById.get(id);
  if (cached && now - cached.timestamp < PRODUCTS_CACHE_TTL_MS) {
    return response.json(cached.data);
  }

  const product = await Product.findOne({ _id: id, isActive: true })
    .select("name description images price currency quantity sku category isCustomizable")
    .lean();

  if (!product) throw new HttpError(404, "Product not found");

  const result = { product: toPublicProduct(product) };
  cachedProductById.set(id, { data: result, timestamp: now });

  response.json(result);
});

const uploadCustomCardDesign = asyncHandler(async (request, response) => {
  const { imageData } = request.body || {};
  if (!imageData) {
    throw new HttpError(400, "Image data is required");
  }

  let base64 = String(imageData);
  const dataUriMatch = base64.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
  if (dataUriMatch) {
    base64 = base64.slice(dataUriMatch[0].length);
  }
  const cleanBase64 = base64.trim().replace(/\s+/g, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  if (!buffer.length || buffer.length > 15 * 1024 * 1024) {
    throw new HttpError(400, "Image must be between 1 byte and 15 MB");
  }

  try {
    const { uploadToCloudinary } = await import("../services/uploadService.js");
    const filename = `custom_card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const uploadRes = await uploadToCloudinary(buffer, "thenith/custom_card_orders", filename);
    if (uploadRes?.secure_url) {
      return response.json({ url: uploadRes.secure_url });
    }
  } catch (err) {
    console.warn("[upload] Cloudinary upload fallback for custom card:", err?.message || err);
  }

  return response.json({ url: imageData.startsWith("data:") ? imageData : `data:image/png;base64,${cleanBase64}` });
});

export default {
  getPublicProducts,
  getPublicProduct,
  invalidateProductsCache,
  uploadCustomCardDesign,
};


