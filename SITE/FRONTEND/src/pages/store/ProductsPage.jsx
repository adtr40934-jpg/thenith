import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney, loadStoreProducts } from "./storeApi.js";
import { useCart } from "../../context/CartContext.jsx";
import { ShoppingCart, Sparkles } from "lucide-react";
import { applyPageSeo, PRODUCTION_DOMAIN } from "../../utils/seo.js";

export default function ProductsPage() {
  const { t, language } = useGlobalLanguage();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const isAr = language === "ar";
    const title = isAr
      ? "متجر بطاقات Thenith الذكية | Smart NFC Cards Store"
      : "Thenith Smart NFC Cards Store";
    const description = isAr
      ? "استكشف واطلب بطاقات Thenith الذكية الفاخرة بتقنية NFC. بطاقات معدنية وبلاستيكية مخصصة لمشاركة هويتك الرقمية باحترافية."
      : "Explore and buy luxury Thenith smart NFC business cards. Premium metal and matte digital cards to share your identity effortlessly.";

    applyPageSeo({
      title,
      description,
      canonicalUrl: `${PRODUCTION_DOMAIN}/products`,
      robots: "index, follow",
      breadcrumbs: [
        { name: isAr ? "الرئيسية" : "Home", url: "/" },
        { name: isAr ? "المتجر والبطاقات الذكية" : "Store & Smart Cards", url: "/products" },
      ],
      lang: language,
      dir: isAr ? "rtl" : "ltr",
      openGraph: {
        title,
        description,
        url: `${PRODUCTION_DOMAIN}/products`,
        type: "website",
      },
    });
  }, [language]);

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
              {products.map((product, index) => {
                const isCustomCard = Boolean(product.isCustomizable);
                const productUrl = isCustomCard
                  ? `/custom-card?productId=${product.id}`
                  : `/products/${product.id}`;

                return (
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
                      to={productUrl}
                      className="relative block aspect-square w-full bg-[#EEEEEE] mb-4 flex items-center justify-center transition-opacity hover:opacity-95 overflow-hidden rounded-2xl"
                    >
                      {isCustomCard && (
                        <div className="absolute top-3 start-3 z-10 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-900 shadow-md flex items-center gap-1.5 border border-white/60">
                          <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-pulse" />
                          <span>{language === "ar" ? "تصميم مخصص" : "Custom Card"}</span>
                        </div>
                      )}
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
                        to={productUrl}
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
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="text-xl font-extrabold text-[#111827]">
                          {formatMoney(product.price, product.currency)}
                        </div>
                        {isCustomCard ? (
                          <Link
                            to={productUrl}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{language === "ar" ? "صمّم كارتك" : "Customize"}</span>
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product);
                              import("sweetalert2").then((Swal) => {
                                Swal.default.fire({
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
                              });
                            }}
                            className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-sm relative z-20 cursor-pointer"
                            title={t("store.buyNow")}
                          >
                            <ShoppingCart className="w-4 h-4 pointer-events-none" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
