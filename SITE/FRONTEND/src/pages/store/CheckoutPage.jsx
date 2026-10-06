import { useGlobalLanguage } from "../../context/GlobalLanguageContext.jsx";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, CreditCard, Truck, Phone, Building2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import GlobalLogo from "../../components/GlobalLogo.jsx";
import {
  getShippingRates,
  createOrder,
  formatMoney,
  validateCoupon,
} from "./storeApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveProfile } from "../../panel/services/authApi.js";
import ErrorNotice from "../../components/ErrorNotice.jsx";
import { getLocalizedErrorMessage } from "../../utils/errorHandling.js";
import { toast } from "../../util/toast";
import api from "../../api/index.js";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./phone-input-overrides.css";

export default function CheckoutPage() {
  const { t, language } = useGlobalLanguage();
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [walletNumber, setWalletNumber] = useState("");

  useEffect(() => {
    let mounted = true;
    api.payment.getMethods().then(res => {
      if (mounted && res.methods) {
        setMethods(res.methods);
        if (res.methods.length > 0) {
          const wallet = res.methods.find(m => m.payment_method_id === 4 || m.name_en?.toLowerCase().includes("wallet"));
          setSelectedMethod(wallet || res.methods[0]);
        }
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const isWalletMethod = (m) => m?.payment_method_id === 4 || m?.name_en?.toLowerCase().includes("wallet");
  const isWalletValid = /^01[0125][0-9]{8}$/.test(walletNumber);

  const [isSuccess, setIsSuccess] = useState(false);
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate("/login?returnTo=/checkout");
    }
  }, [isAuthenticated, isInitializing, navigate]);

  React.useEffect(() => {
    if (user) {
      if (!phone) setPhone(user.phone || "");
      if (!address) setAddress(user.address || "");
    }
  }, [user]);

  React.useEffect(() => {
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
        setCouponError("الكوبون غير صالح");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponStatus("invalid");
      setCouponError(getLocalizedErrorMessage(err, language));
      setAppliedCoupon(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const firstName = formData.get("firstName") || "";
    const lastName = formData.get("lastName") || "";
    const email = formData.get("email") || "";

    const selectedRate = shippingRates.find(
      (r) => r._id === selectedGovernorate,
    );
    const cityName = selectedRate
      ? t("home") === "الرئيسية"
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
        } else {
          const params = new URLSearchParams({
            type: "order",
            orderId: result.orderId,
            amount: result.amount || finalTotal,
          });
          
            if (selectedMethod) {
              try {
                const intentResult = await api.client.post(`/payment/order/${result.orderId}`, {
                  methodId: selectedMethod.payment_method_id,
                  walletNumber: walletNumber || null,
                });
                const txData = intentResult.data;
                const redirectUrl = txData.checkoutUrl || txData.paymentData?.redirectTo;
                if (redirectUrl) {
                  window.location.href = redirectUrl;
                  return;
                }
              } catch(err) {
                 toast.error(getLocalizedErrorMessage(err, isArabic ? "ar" : "en"));
                 return;
              }
            }
            navigate(`/payment?type=order&orderId=${result.orderId}`);

        }
      }
    } catch (err) {
      toast.error(getLocalizedErrorMessage(err, language));
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-center text-slate-900 flex flex-col items-center justify-center">
        <CheckCircle className="mb-6 h-20 w-20 text-emerald-500" />
        <h1 className="mb-4 text-3xl font-black">
          {isArabic ? "تم استلام طلبك" : "Order received"}
        </h1>
        <p className="mb-8 max-w-md text-slate-500">
          {isArabic
            ? "سيتم الدفع عند استلام الطلب. سنتواصل معك لتأكيد التفاصيل."
            : "Payment is due on delivery. We will contact you to confirm the details."}
        </p>
        <Link
          to="/products"
          className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-600"
        >
          {t("store.backToStore")}
        </Link>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">
          {t("store.cartEmptyTitle") || "سلة المشتريات فارغة"}
        </h1>
        <p className="text-slate-500 mb-8 max-w-md">
          {t("store.cartEmptyDesc") || "لم تقم بإضافة أي منتجات للسلة بعد."}
        </p>
        <Link
          to="/products"
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
        >
          {t("store.backToStore") || "تصفح المنتجات"}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      <main className="max-w-[1200px] mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-12 text-slate-900">
          {t("store.completeOrder")}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <form
            key={user?._id || "guest"}
            onSubmit={handleCheckout}
            className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            {/* Shipping Details */}
            <h2 className="text-xl font-bold mb-4 border-b border-slate-100 pb-4 text-slate-900">
              {t("store.shippingDetails")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  {t("store.firstName")}
                </label>
                <input
                  required
                  type="text"
                  name="firstName"
                  defaultValue={user?.name?.split(" ")[0] || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  {t("store.lastName") || "الاسم الأخير"}
                </label>
                <input
                  required
                  type="text"
                  name="lastName"
                  defaultValue={user?.name?.split(" ").slice(1).join(" ") || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  {t("store.emailAddress") || "البريد الإلكتروني"}
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user?.email || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-right"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  رقم التليفون
                </label>
                <div
                  dir="ltr"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 text-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors"
                >
                  <PhoneInput
                    international
                    defaultCountry="EG"
                    value={phone}
                    onChange={setPhone}
                    className="w-full h-10 outline-none"
                    placeholder="رقم التليفون"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  الدولة
                </label>
                <select
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors opacity-80 cursor-not-allowed"
                >
                  <option value="EG">مصر (Egypt)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2 font-medium">
                  {t("store.governorate") || "المحافظة"}
                </label>
                <select
                  required
                  value={selectedGovernorate}
                  onChange={handleGovernorateChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="" disabled>
                    {t("store.selectGovernorate") || "اختر المحافظة"}
                  </option>
                  {shippingRates.map((rate) => (
                    <option key={rate._id} value={rate._id}>
                      {t("home") === "الرئيسية"
                        ? rate.governorateAr
                        : rate.governorate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-2 font-medium">
                {t("store.fullAddress") || "العنوان بالتفصيل"}
              </label>
              <textarea
                required
                name="address"
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("store.fullAddress") || "العنوان بالتفصيل"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
              ></textarea>
            </div>

            {/* Payment Methods */}
            <h2 className="text-xl font-bold mb-4 border-b border-slate-100 pb-4 pt-4 text-slate-900">
              {t("store.paymentMethod") || "طريقة الدفع"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "online" ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-slate-200 hover:border-indigo-300"}`}
              >
                <span className="flex items-center gap-3 font-bold text-slate-900">
                  <input
                    type="radio"
                    name="checkoutPaymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  {t("store.visaOnline") || "دفع أونلاين"}
                </span>
                <span className="mt-2 block text-sm text-slate-500">
                  {t("store.onlinePaymentRequired")}
                </span>
              
                {paymentMethod === "online" && methods.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 p-4 bg-white rounded-xl border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-2">
                      {isArabic ? "OOOO1 OO1USU,O O U,O_U?O1" : "Select Payment Gateway"}
                    </p>
                    {[...methods].sort((a, b) => {
                      const getWeight = (m) => {
                        if (m.payment_method_id === 4 || m.name_en?.toLowerCase().includes("wallet")) return 1;
                        if (m.payment_method_id === 3 || m.name_en?.toLowerCase().includes("fawry")) return 2;
                        if (m.payment_method_id === 2 || m.name_en?.toLowerCase().includes("card") || m.name_en?.toLowerCase().includes("visa")) return 3;
                        return 4;
                      };
                      return getWeight(a) - getWeight(b);
                    }).map(m => (
                      <label key={m.payment_method_id} className={`cursor-pointer p-3 border rounded-lg flex flex-col ${selectedMethod?.payment_method_id === m.payment_method_id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="fawaterak_method" checked={selectedMethod?.payment_method_id === m.payment_method_id} onChange={() => setSelectedMethod(m)} className="h-4 w-4 accent-indigo-600" />
                          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border shadow-sm">
                            <img src={m.logo} alt={isArabic ? m.name_ar : m.name_en} className="max-w-[24px] max-h-[24px] object-contain" />
                          </div>
                          <span className="font-semibold text-sm">{isArabic ? m.name_ar : m.name_en}</span>
                        </div>
                        {selectedMethod?.payment_method_id === m.payment_method_id && isWalletMethod(m) && (
                          <div className="mt-3 ml-7">
                             <input type="tel" value={walletNumber} onChange={e => setWalletNumber(e.target.value.replace(/\D/g, '').slice(0,11))} placeholder="01XXXXXXXXX" className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${walletNumber.length === 11 ? (isWalletValid ? 'border-emerald-500 ring-emerald-100' : 'border-rose-500 ring-rose-100') : 'border-slate-200 focus:border-indigo-500 ring-indigo-100'}`} />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

              </label>
              <label
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "cash_on_delivery" ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-slate-200 hover:border-indigo-300"}`}
              >
                <span className="flex items-center gap-3 font-bold text-slate-900">
                  <input
                    type="radio"
                    name="checkoutPaymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={() => setPaymentMethod("cash_on_delivery")}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <Truck className="h-5 w-5 text-indigo-500" />
                  {t("store.cashOnDelivery")}
                </span>
                <span className="mt-2 block text-sm text-slate-500">
                  {t("store.cashOnDeliveryDesc")}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (paymentMethod === "online" && (!selectedMethod || (isWalletMethod(selectedMethod) && !isWalletValid)))}
              className="w-full mt-8 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg text-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                "جاري إتمام الطلب..."
              ) : (
                <>
                  {paymentMethod === "cash_on_delivery"
                    ? t("store.confirmOrder")
                    : t("store.continueCheckout")}{" "}
                  ({formatMoney(finalTotal)})
                </>
              )}
            </button>
          </form>

          {/* Cart Summary */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-28">
            <h2 className="text-xl font-bold mb-6 text-slate-900">
              {t("store.yourProducts")}
            </h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-slate-800">
                      {item.rawName?.[language] ||
                        item.rawName?.ar ||
                        item.name}
                    </span>
                  </div>
                  <span className="font-bold">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                كوبون الخصم
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
                  placeholder="أدخل الكوبون هنا"
                  disabled={!!appliedCoupon}
                  className={`flex-1 w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                    couponStatus === "valid"
                      ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500"
                      : couponStatus === "invalid"
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
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
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap"
                  >
                    إزالة
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "checking" || !couponCode.trim()}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {couponStatus === "checking" ? "..." : "تطبيق"}
                  </button>
                )}
              </div>
              {couponStatus === "valid" && appliedCoupon && (
                <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                  ✓ تم تطبيق الكوبون! خصم{" "}
                  {appliedCoupon.type === "percentage"
                    ? `${appliedCoupon.value}%`
                    : formatMoney(appliedCoupon.value)}
                </p>
              )}
              {couponStatus === "invalid" && (
                <ErrorNotice
                  error={couponError || t("panel.errors.invalidCoupon")}
                  language={language}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-6 pb-6 text-slate-600">
              <div className="flex justify-between items-center">
                <span>{t("store.subtotal") || "المجموع الفرعي"}:</span>
                <span className="font-medium text-slate-900">
                  {formatMoney(totalPrice)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600">
                    خصم الكوبون ({appliedCoupon?.code}):
                  </span>
                  <span className="font-bold text-emerald-600">
                    - {formatMoney(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>{t("store.shipping") || "الشحن"}:</span>
                <span className="font-medium text-indigo-600">
                  {selectedGovernorate
                    ? formatMoney(shippingCost)
                    : t("store.calculatedAtCheckout") || "يحدد لاحقاً"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-between text-2xl font-bold text-slate-900">
              <span>{t("store.grandTotal") || "الإجمالي"}:</span>
              <span className="text-indigo-600">{formatMoney(finalTotal)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
