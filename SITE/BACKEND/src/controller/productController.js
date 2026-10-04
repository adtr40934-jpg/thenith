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
});

const getPublicProducts = asyncHandler(async (_request, response) => {
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .select("name description images price currency quantity sku category")
    .lean();

  response.json({ products: products.map(toPublicProduct) });
});

const getPublicProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(404, "Product not found");
  }

  const product = await Product.findOne({ _id: id, isActive: true })
    .select("name description images price currency quantity sku category")
    .lean();

  if (!product) throw new HttpError(404, "Product not found");
  response.json({ product: toPublicProduct(product) });
});


export default {
  getPublicProducts,
  getPublicProduct
};
