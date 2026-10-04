import React from "react";
import { Trash2, Plus, Minus, CreditCard } from "lucide-react";
import { useCart } from "../../../context/CartContext.jsx";
import { formatMoney } from "../../../pages/store/storeApi.js";
import { motion } from "motion/react";

export default function PanelCart({ t, onCheckout }) {
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();
  const isArabic = t("home") === "الرئيسية";

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">
          {isArabic ? "سلة المشتريات فارغة" : "Your cart is empty"}
        </h2>
        <p className="text-slate-500 mb-8 dark:text-slate-400">
          {isArabic ? "لم تقم بإضافة أي منتجات بعد." : "You haven't added any products yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
      <div className="lg:col-span-2 space-y-4">
        {cart.map((item) => (
          <motion.div
            layout
            key={item.id}
            className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 dark:bg-slate-950 dark:border-slate-800"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 flex items-center justify-center">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.rawName?.[isArabic ? 'ar' : 'en'] || item.rawName?.ar || item.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-start">
              <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">
                {item.rawName?.[isArabic ? 'ar' : 'en'] || item.rawName?.ar || item.name}
              </h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                {formatMoney(item.price, item.currency)}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-4 text-center text-slate-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-fit sticky top-6">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
          {isArabic ? "ملخص الطلب" : "Order Summary"}
        </h2>
        
        <div className="space-y-4 mb-6 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex justify-between">
            <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatMoney(totalPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{isArabic ? "الشحن" : "Shipping"}</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {isArabic ? "يحدد لاحقاً" : "Calculated at checkout"}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white mb-8">
          <span>{isArabic ? "الإجمالي" : "Total"}</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            {formatMoney(totalPrice)}
          </span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
        >
          {isArabic ? "إتمام الطلب" : "Proceed to Checkout"}
          <CreditCard className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
