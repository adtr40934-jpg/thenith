import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  CreditCard,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  formatMoney,
  getShippingRates,
  createOrder,
  validateCoupon,
} from "../../../pages/store/storeApi.js";
import { saveProfile } from "../../services/authApi.js";
import ErrorNotice from "../../../components/ErrorNotice.jsx";
import { getLocalizedErrorMessage } from "../../../utils/errorHandling.js";
import toast from "react-hot-toast";
import api from "../../../api/index.js";


export default function PanelCheckout({ t, onBack }) {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");

  const isArabic = t("home") === "الرئيسية";

  useEffect(() => {
    if (user) {
      if (!phone) setPhone(user.phone || "");
      if (!address) setAddress(user.address || "");
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    getShippingRates().then((rates) => {
      if (mounted && rates.length > 0) {
        setShippingRates(rates);
        if (user && user.city) {
          const matchedRate = rates.find(
            (r) => r.governorate === user.city || r.governorateAr === user.city,
          );
          if (matchedRate) {
            setSelectedGovernorate(matchedRate._id);
            setShippingCost(matchedRate.cost);
          }
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleGovernorateChange = (e) => {
    const govId = e.target.value;
    setSelectedGovernorate(govId);
    const rate = shippingRates.find((r) => r._id === govId);
    setShippingCost(rate ? rate.cost : 0);
  };

  const discount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? Math.round((totalPrice * appliedCoupon.value) / 100)
      : Math.min(appliedCoupon.value, totalPrice)
    : 0;
  const finalTotal = totalPrice + shippingCost - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus("checking");
    setCouponError("");
    try {
      const result = await validateCoupon(couponCode.trim(), "store");
      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          type: result.type,
          value: result.value,
        });
        setCouponStatus("valid");
      } else {
        setCouponStatus("invalid");
        setCouponError(isArabic ? "الكوبون غير صالح" : "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponStatus("invalid");
      setCouponError(getLocalizedErrorMessage(err, isArabic ? "ar" : "en"));
      setAppliedCoupon(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const firstName = formData.get("firstName") || "";
    const lastName = formData.get("lastName") || "";
    const email = formData.get("email") || user?.email || "";

    const selectedRate = shippingRates.find(
      (r) => r._id === selectedGovernorate,
    );
    const cityName = selectedRate
      ? isArabic
        ? selectedRate.governorateAr
        : selectedRate.governorate
      : "";

    try {
      const result = await createOrder({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        customer: {
          name: `${firstName} ${lastName}`.trim(),
          phone,
          email,
          address,
          city: cityName,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      });

      if (result?.orderId) {
        if (paymentMethod === "cash_on_delivery") {
          clearCart();
          setIsSuccess(true);
          window.dispatchEvent(new CustomEvent("dashboard-action", {
            detail: {
              type: "order_created",
              title: isArabic ? "تم تسجيل طلبك بنجاح" : "Order placed successfully",
            },
          }));
        } else {
          navigate(`/payment?type=order&orderId=${result.orderId}`);
        }
      }
    } catch (err) {
      toast.error(getLocalizedErrorMessage(err, isArabic ? "ar" : "en"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[32px] border border-slate-200 bg-white py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CheckCircle2 className="mb-6 h-16 w-16 text-emerald-500" />
        <h2 className="mb-3 text-2xl font-black text-slate-900 dark:text-white">
          {isArabic ? "تم استلام طلبك" : "Order received"}
        </h2>
        <p className="mb-8 max-w-md px-6 text-sm text-slate-500 dark:text-slate-400">
          {isArabic
            ? "سيتم الدفع عند استلام الطلب. سنتواصل معك لتأكيد التفاصيل."
            : "Payment is due on delivery. We will contact you to confirm the details."}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-600 dark:bg-slate-800"
        >
          {isArabic ? "العودة للمتجر" : "Back to store"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 font-bold"
      >
        <ArrowRight className={`w-5 h-5 ${!isArabic && "rotate-180"}`} />
        {isArabic ? "عودة للسلة" : "Back to Cart"}
      </button>

      <form
        key={user?._id || "guest"}
        onSubmit={handleCheckout}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {isArabic ? "تفاصيل الشحن" : "Shipping Details"}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "الاسم الأول" : "First Name"}
                </label>
                <input
                  required
                  type="text"
                  name="firstName"
                  defaultValue={user?.name?.split(" ")[0] || ""}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "الاسم الأخير" : "Last Name"}
                </label>
                <input
                  required
                  type="text"
                  name="lastName"
                  defaultValue={user?.name?.split(" ").slice(1).join(" ") || ""}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user?.email || ""}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "رقم الهاتف" : "Phone Number"}
                </label>
                <input
                  required
                  type="text"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "الدولة" : "Country"}
                </label>
                <select
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 opacity-80 cursor-not-allowed"
                >
                  <option value="EG">{isArabic ? "مصر" : "Egypt"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isArabic ? "المحافظة / المدينة" : "Governorate"}
                </label>
                <select
                  required
                  value={selectedGovernorate}
                  onChange={handleGovernorateChange}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    {isArabic ? "اختر المحافظة" : "Select Governorate"}
                  </option>
                  {shippingRates.map((rate) => (
                    <option key={rate._id} value={rate._id}>
                      {isArabic ? rate.governorateAr : rate.governorate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isArabic ? "العنوان بالتفصيل" : "Full Address"}
              </label>
              <textarea
                required
                name="address"
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isArabic ? "طريقة الدفع" : "Payment Method"}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "online" ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:bg-indigo-900/30" : "border-slate-200 hover:border-indigo-300 dark:border-slate-700"}`}
                >
                  <span className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                    <input
                      type="radio"
                      name="checkoutPaymentMethod"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <CreditCard className="h-5 w-5 text-indigo-500" />
                    {isArabic ? "دفع أونلاين" : "Online Payment"}
                  </span>
                  <span className="mt-2 block text-sm text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "يتحول الطلب لطلب مؤكد بعد إتمام الدفع."
                      : "The order is confirmed after full payment."}
                  </span>
                </label>
                <label
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "cash_on_delivery" ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:bg-indigo-900/30" : "border-slate-200 hover:border-indigo-300 dark:border-slate-700"}`}
                >
                  <span className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                    <input
                      type="radio"
                      name="checkoutPaymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === "cash_on_delivery"}
                      onChange={() => setPaymentMethod("cash_on_delivery")}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <Truck className="h-5 w-5 text-indigo-500" />
                    {isArabic ? "دفع عند الاستلام" : "Cash on delivery"}
                  </span>
                  <span className="mt-2 block text-sm text-slate-500 dark:text-slate-400">
                    {isArabic
                      ? "يُحفظ الطلب بحالة غير مدفوعة لحين استلامه."
                      : "The order is saved as unpaid until delivery."}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-950 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {isArabic ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Coupon Code */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isArabic ? "كوبون الخصم" : "Discount Coupon"}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponStatus(null);
                    setCouponError("");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleApplyCoupon())
                  }
                  placeholder={
                    isArabic ? "أدخل كود الكوبون" : "Enter coupon code"
                  }
                  disabled={!!appliedCoupon}
                  className={`flex-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${
                    couponStatus === "valid"
                      ? "border-emerald-400 focus:ring-emerald-500"
                      : couponStatus === "invalid"
                        ? "border-rose-400 focus:ring-rose-500"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                  }`}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                      setCouponStatus(null);
                      setCouponError("");
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20 transition-colors whitespace-nowrap"
                  >
                    {isArabic ? "إزالة" : "Remove"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "checking" || !couponCode.trim()}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {couponStatus === "checking"
                      ? "..."
                      : isArabic
                        ? "تطبيق"
                        : "Apply"}
                  </button>
                )}
              </div>
              {couponStatus === "valid" && appliedCoupon && (
                <p className="text-xs text-emerald-500 font-bold mt-1.5">
                  ✓{" "}
                  {isArabic
                    ? `تم تطبيق الكوبون! خصم ${appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatMoney(appliedCoupon.value)}`
                    : `Coupon applied! Discount: ${appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatMoney(appliedCoupon.value)}`}
                </p>
              )}
              {couponStatus === "invalid" && (
                <ErrorNotice
                  error={couponError || t("panel.errors.invalidCoupon")}
                  language={isArabic ? "ar" : "en"}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-4 mb-6 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex justify-between">
                <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatMoney(totalPrice)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-emerald-500">
                    {isArabic
                      ? `خصم (${appliedCoupon?.code})`
                      : `Discount (${appliedCoupon?.code})`}
                  </span>
                  <span className="font-bold text-emerald-500">
                    - {formatMoney(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{isArabic ? "الشحن" : "Shipping"}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {shippingCost === 0 && !selectedGovernorate
                    ? isArabic
                      ? "حدد المحافظة"
                      : "Select Gov"
                    : formatMoney(shippingCost)}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white mb-8">
              <span>{isArabic ? "الإجمالي" : "Total"}</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {formatMoney(finalTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isArabic ? (
                paymentMethod === "cash_on_delivery" ? (
                  "تأكيد الطلب"
                ) : (
                  "متابعة الدفع"
                )
              ) : paymentMethod === "cash_on_delivery" ? (
                "Place order"
              ) : (
                "Continue to Payment"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
