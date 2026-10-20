import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import api from "../../../api/index.js";
import {
  formatMoney,
  normalizeProduct,
} from "../../../pages/store/storeApi.js";
import { useCart } from "../../../context/CartContext.jsx";
import ErrorNotice from "../../../components/ErrorNotice.jsx";

export default function ProductsPage({ t, personal, onOrder, onOpenCart, onOpenCustomCard }) {
  const isArabic = t("home") === "الرئيسية";
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, totalItems } = useCart();

  const isProfileComplete = Boolean(personal?.address && personal?.phone);

  useEffect(() => {
    let mounted = true;

    api.products
      .list()
      .then((data) => {
        if (mounted) {
          setProducts(
            (data.products || []).map((p) =>
              normalizeProduct(p, isArabic ? "ar" : "en"),
            ),
          );
        }
      })
      .catch(() => {
        if (mounted) {
          setError(
            isArabic
              ? t("loadProductsFailed")
              : "Unable to load products right now",
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isArabic]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    );
    return [
      { id: "all", label: isArabic ? t("allCategories") : "All" },
      ...unique.map((category) => ({ id: category, label: category })),
    ];
  }, [isArabic, products]);

  const filteredProducts = products.filter(
    (product) =>
      activeCategory === "all" || product.category === activeCategory,
  );

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct);
    setOrderSuccess(true);
    setTimeout(() => {
      setOrderSuccess(false);
      setSelectedProduct(null);
      setActiveImageIndex(0);
    }, 1000);
  };

  return (
    <section className="space-y-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-slate-900 p-5 sm:p-8 md:p-12 shadow-2xl dark:bg-slate-950">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h1 className="mt-1 text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              {t("thenithProducts")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`${isArabic ? "السلة" : "Cart"}: ${totalItems}`}
              title={isArabic ? "السلة" : "Cart"}
              className="group relative flex min-h-12 sm:min-h-14 items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/15 bg-white/[0.07] py-2 ps-2 pe-3.5 sm:py-2.5 sm:ps-2.5 sm:pe-4 text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:border-indigo-300/50 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-950/25 transition-colors group-hover:bg-indigo-400">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -end-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-white px-1 text-[9px] font-black text-indigo-700">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-bold leading-tight">
                  {isArabic ? "سلة المشتريات" : "Shopping cart"}
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  {totalItems > 0
                    ? isArabic
                      ? `${totalItems} قطعة`
                      : `${totalItems} items`
                    : isArabic
                      ? "السلة فارغة"
                      : "Cart is empty"}
                </span>
              </span>
            </button>
            <CreditCard className="hidden h-28 w-28 text-slate-500 sm:block" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
              activeCategory === cat.id
                ? "bg-slate-800 text-white shadow-md dark:bg-indigo-600"
                : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-slate-500 dark:bg-slate-900">
          {isArabic ? t("loadingProducts") : "Loading products..."}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-5 dark:bg-slate-900">
          <ErrorNotice error={error} language={isArabic ? "ar" : "en"} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-slate-500 dark:bg-slate-900">
          {isArabic ? t("noProductsAvailable") : "No products available"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isCustom = Boolean(product.isCustomizable);

            return (
              <motion.button
                layout
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (isCustom) {
                    if (onOpenCustomCard) {
                      onOpenCustomCard(product);
                      return;
                    }
                    window.location.href = `/custom-card?productId=${product.id}`;
                    return;
                  }
                  setSelectedProduct(product);
                  setActiveImageIndex(0);
                }}
                className="group cursor-pointer text-start relative"
              >
                <div className="relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#f0f0f0] transition-all duration-300 dark:bg-slate-900/60">
                  {isCustom && (
                    <div className="absolute top-2.5 start-2.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow flex items-center gap-1 border border-white/50">
                      <Sparkles className="w-3 h-3 text-amber-900 animate-pulse" />
                      <span>{isArabic ? "تصميم مخصص" : "Custom Card"}</span>
                    </div>
                  )}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={
                        typeof product.name === "object"
                          ? product.name?.ar || product.name?.en
                          : product.name
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Package className="relative z-10 h-24 w-24 text-slate-800 dark:text-slate-300" />
                  )}
                </div>

                <div className="px-1">
                  <h3 className="line-clamp-1 text-[13px] font-bold text-slate-900 dark:text-white">
                    {typeof product.name === "object"
                      ? product.name?.ar || product.name?.en
                      : product.name}
                  </h3>
                  <div className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {formatMoney(product.price, product.currency)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && !orderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelectedProduct(null);
              setActiveImageIndex(0);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-slate-950 sm:flex-row"
            >
              <div className="relative flex flex-col w-full bg-[#f0f0f0] dark:bg-slate-900/60 sm:w-2/5 p-4 sm:p-6 justify-center">
                <div className="relative flex w-full aspect-square items-center justify-center bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-sm">
                  {selectedProduct.images?.[activeImageIndex] ||
                  selectedProduct.image ? (
                    <img
                      src={
                        selectedProduct.images?.[activeImageIndex] ||
                        selectedProduct.image
                      }
                      alt={
                        typeof selectedProduct.name === "object"
                          ? selectedProduct.name?.ar || selectedProduct.name?.en
                          : selectedProduct.name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-32 w-32 text-slate-800 dark:text-slate-300" />
                  )}
                </div>
                {selectedProduct.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto mt-4 pb-2 scrollbar-hide w-full justify-start">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(idx);
                        }}
                        className={`relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === idx
                            ? "border-indigo-600 shadow-md"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex max-h-[70vh] flex-col overflow-y-auto p-6 scrollbar-hide sm:max-h-[80vh] sm:w-3/5 sm:p-10">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setActiveImageIndex(0);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <h2 className="text-2xl font-black text-slate-800 dark:text-white sm:text-3xl">
                  {typeof selectedProduct.name === "object"
                    ? selectedProduct.name?.ar || selectedProduct.name?.en
                    : selectedProduct.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {selectedProduct.desc || t("noDescriptionAvailable")}
                </p>

                <div className="my-8 h-px w-full bg-slate-100 dark:bg-slate-800/80"></div>

                <div className="mt-auto flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 sm:p-5">
                  <div>
                    <p className="text-xs font-bold text-slate-400">
                      {isArabic ? "السعر" : "Price"}
                    </p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">
                      {formatMoney(
                        selectedProduct.price,
                        selectedProduct.currency,
                      )}
                    </p>
                  </div>
                  {(() => {
                    const isSelectedCustom = Boolean(selectedProduct.isCustomizable);

                    if (isSelectedCustom) {
                      return (
                        <button
                          onClick={() => {
                            window.location.href = `/custom-card?productId=${selectedProduct.id}`;
                          }}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                          <Sparkles className="h-4 w-4 text-amber-200 animate-pulse" />
                          <span>{isArabic ? "صمّم كارتك الآن" : "Customize Your Card"}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={handleAddToCart}
                        disabled={selectedProduct.quantity <= 0}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {selectedProduct.quantity > 0
                          ? isArabic
                            ? "أضف للسلة"
                            : "Add to Cart"
                          : isArabic
                            ? "غير متوفر"
                            : "Unavailable"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex max-w-sm flex-col items-center rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-950"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-xl font-black text-slate-800 dark:text-white">
                {isArabic ? "تمت الإضافة للسلة!" : "Added to Cart!"}
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
