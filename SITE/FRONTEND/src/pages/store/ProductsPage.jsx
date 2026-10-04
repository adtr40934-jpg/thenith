import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney, loadStoreProducts } from "./storeApi.js";
import { useCart } from "../../context/CartContext.jsx";
import { ShoppingCart } from "lucide-react";
import Swal from "sweetalert2";

export default function ProductsPage() {
  const { t, language } = useGlobalLanguage();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    loadStoreProducts(language)
      .then((items) => {
        if (mounted) setProducts(items);
      })
      .catch(() => {
        if (mounted) setError(t("store.loadFailed"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans selection:bg-black selection:text-white pb-32">
      <header className="pt-28 pb-12 px-6 max-w-[1200px] mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#111827]"
        >
          {t("store.storeTitle") || "Store"}
        </motion.h1>
      </header>

      <main className="max-w-[1200px] mx-auto px-6">
        <div className="mb-8 flex justify-end">
          <Link
            to="/cart"
            aria-label={`${t("store.cartTitle")}: ${totalItems}`}
            title={t("store.cartTitle")}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-32 text-red-500 text-lg font-medium">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32">
            <h2 className="text-2xl font-bold text-gray-400">
              {t("store.noMatchingProducts")}
            </h2>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12"
          >
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  key={product.id}
                  className="group flex flex-col relative"
                >
                  <Link
                    to={`/products/${product.id}`}
                    className="relative block aspect-square w-full bg-[#EEEEEE] mb-4 flex items-center justify-center transition-opacity hover:opacity-95 overflow-hidden"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        {t("store.noImage")}
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col flex-1 px-1 text-left">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex justify-between items-start gap-2 mb-2"
                    >
                      <h3 className="text-[15px] font-bold text-[#111827] line-clamp-2 leading-snug hover:underline decoration-2 underline-offset-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <span className="text-[13px] text-gray-600 font-medium">
                          5.0
                        </span>
                        <span className="text-[12px] text-[#FBBF24]">★</span>
                      </div>
                    </Link>

                    {/* Price and Cart Button Row */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-xl font-extrabold text-[#111827]">
                        {formatMoney(product.price, product.currency)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                          Swal.fire({
                            toast: true,
                            position: "bottom-end",
                            icon: "success",
                            title: t("store.addedToCart") || "Added to cart!",
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                            background: "#111827",
                            color: "#fff",
                            iconColor: "#10B981",
                          });
                        }}
                        className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-sm relative z-20 cursor-pointer"
                        title={t("store.buyNow")}
                      >
                        <ShoppingCart className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
