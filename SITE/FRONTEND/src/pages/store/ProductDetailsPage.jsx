import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import api from "../../api/index.js";
import { formatMoney, normalizeProduct } from "./storeApi.js";

export default function ProductDetailsPage() {
  const { t, language } = useGlobalLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;

    api.products
      .get(id)
      .then((data) => {
        if (mounted) setProduct(normalizeProduct(data.product, language));
      })
      .catch(() => {
        if (mounted) setError(t("store.productNotFound"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        {t("store.loadingProduct")}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-slate-900">
        <h1 className="text-2xl font-bold">{t("store.productNotFound")}</h1>
        <button
          onClick={() => navigate("/products")}
          className="bg-slate-900 text-white px-6 py-2 rounded-full"
        >
          {t("store.backToStoreLink")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500/30">
      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0 text-sm text-slate-400 flex items-center gap-2">
            <Link
              to="/products"
              className="shrink-0 hover:text-indigo-600 transition-colors"
            >
              {t("store.storeTitle")}
            </Link>
            <span>/</span>
            <span className="truncate text-slate-600 font-medium">
              {product.name}
            </span>
          </div>
          <Link
            to="/cart"
            aria-label={`${t("store.cartTitle")}: ${totalItems}`}
            title={t("store.cartTitle")}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-slate-50 rounded-[2.5rem] p-4 md:p-8 flex items-center justify-center border border-slate-100 shadow-inner aspect-square overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-2xl transition-transform duration-500 bg-white"
                />
              ) : (
                <div className="flex aspect-square w-full max-w-[400px] items-center justify-center rounded-2xl bg-white text-slate-400">
                  {t("store.noImage")}
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-indigo-600 shadow-lg scale-105"
                        : "border-transparent opacity-60 hover:opacity-100 bg-slate-50"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain bg-white p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-bold text-indigo-600 mb-6">
              {formatMoney(product.price, product.currency)}
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              {product.desc || t("store.noDescription")}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="space-y-4 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">
                  {t("store.details")}:
                </h3>
                {product.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-slate-700"
                  >
                    <div className="bg-indigo-100 p-1 rounded-full text-indigo-600">
                      <Check className="w-4 h-4" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  addToCart(product);
                  navigate("/checkout");
                }}
                disabled={product.quantity <= 0}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {product.quantity > 0 ? t("store.buyNow") : t("store.inStock")}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => addToCart(product)}
                disabled={product.quantity <= 0}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("store.addToCart")}
                <ShoppingBag className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
