import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Trash2, Plus, Minus, CreditCard } from "lucide-react";
import { useCart } from "../../context/CartContext";
import GlobalLogo from "../../components/GlobalLogo.jsx";
import { formatMoney } from "./storeApi.js";

export default function CartPage() {
  const { t, language } = useGlobalLanguage();
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <main className="max-w-[1200px] mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-12 text-slate-900">
          {t("store.cartTitle")}
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-slate-700">
              {t("store.emptyCart")}
            </h2>
            <p className="text-slate-500 mb-8">{t("store.noProductsAdded")}.</p>
            <Link
              to="/products"
              className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg"
            >
              {t("store.browseProducts")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-20 object-cover rounded-xl shadow-sm"
                  />
                  <div className="flex-1 text-center sm:text-right">
                    <h3 className="font-bold text-lg mb-1 text-slate-900">
                      {item.rawName?.[language] || item.rawName?.ar || item.name}
                    </h3>
                    <p className="text-indigo-600 font-bold">
                      {formatMoney(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-full px-4 py-2 border border-slate-200">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="text-slate-500 hover:text-slate-900"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors border border-transparent hover:border-rose-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-fit sticky top-28">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">
                {t("store.orderSummary")}
              </h2>
              <div className="space-y-4 mb-6 text-slate-600 border-b border-slate-100 pb-6">
                <div className="flex justify-between">
                  <span>{t("store.subtotal")}:</span>
                  <span className="font-medium text-slate-900">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("store.shipping")}:</span>
                  <span className="font-medium text-indigo-600">
                    {t("store.calculatedAtCheckout") || "يحدد لاحقاً"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-2xl font-bold text-slate-900 mb-8">
                <span>{t("store.total")}:</span>
                <span className="text-indigo-600">
                  {formatMoney(totalPrice)}
                </span>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                {t("store.proceedToCheckout")}{" "}
                <CreditCard className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
