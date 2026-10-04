import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  CreditCard,
  Truck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  formatMoney,
  getShippingRates,
  createOrder,
  validateCoupon
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
  const isArabic = t("home") === "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629";
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
            (r) => r.governorate === user.city || r.governorateAr === user.city
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
  const discount = appliedCoupon ? appliedCoupon.type === "percentage" ? Math.round(totalPrice * appliedCoupon.value / 100) : Math.min(appliedCoupon.value, totalPrice) : 0;
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
          value: result.value
        });
        setCouponStatus("valid");
      } else {
        setCouponStatus("invalid");
        setCouponError(isArabic ? "\u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" : "Invalid coupon");
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
      (r) => r._id === selectedGovernorate
    );
    const cityName = selectedRate ? isArabic ? selectedRate.governorateAr : selectedRate.governorate : "";
    try {
      const result = await createOrder({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        customer: {
          name: `${firstName} ${lastName}`.trim(),
          phone,
          email,
          address,
          city: cityName
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || null
      });
      if (result?.orderId) {
        if (paymentMethod === "cash_on_delivery") {
          clearCart();
          setIsSuccess(true);
          window.dispatchEvent(new CustomEvent("dashboard-action", {
            detail: {
              type: "order_created",
              title: isArabic ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628\u0643 \u0628\u0646\u062C\u0627\u062D" : "Order placed successfully"
            }
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
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center rounded-[32px] border border-slate-200 bg-white py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "mb-6 h-16 w-16 text-emerald-500" }), /* @__PURE__ */ React.createElement("h2", { className: "mb-3 text-2xl font-black text-slate-900 dark:text-white" }, isArabic ? "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628\u0643" : "Order received"), /* @__PURE__ */ React.createElement("p", { className: "mb-8 max-w-md px-6 text-sm text-slate-500 dark:text-slate-400" }, isArabic ? "\u0633\u064A\u062A\u0645 \u0627\u0644\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628. \u0633\u0646\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644." : "Payment is due on delivery. We will contact you to confirm the details."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onBack,
        className: "rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-600 dark:bg-slate-800"
      },
      isArabic ? "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0645\u062A\u062C\u0631" : "Back to store"
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto pb-20" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onBack,
      className: "flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 font-bold"
    },
    /* @__PURE__ */ React.createElement(ArrowRight, { className: `w-5 h-5 ${!isArabic && "rotate-180"}` }),
    isArabic ? "\u0639\u0648\u062F\u0629 \u0644\u0644\u0633\u0644\u0629" : "Back to Cart"
  ), /* @__PURE__ */ React.createElement(
    "form",
    {
      key: user?._id || "guest",
      onSubmit: handleCheckout,
      className: "grid grid-cols-1 lg:grid-cols-12 gap-8"
    },
    /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-8 space-y-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-6" }, isArabic ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0634\u062D\u0646" : "Shipping Details"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4 mb-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0648\u0644" : "First Name"), /* @__PURE__ */ React.createElement(
      "input",
      {
        required: true,
        type: "text",
        name: "firstName",
        defaultValue: user?.name?.split(" ")[0] || "",
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u062E\u064A\u0631" : "Last Name"), /* @__PURE__ */ React.createElement(
      "input",
      {
        required: true,
        type: "text",
        name: "lastName",
        defaultValue: user?.name?.split(" ").slice(1).join(" ") || "",
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "email",
        name: "email",
        defaultValue: user?.email || "",
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" : "Phone Number"), /* @__PURE__ */ React.createElement(
      "input",
      {
        required: true,
        type: "text",
        name: "phone",
        value: phone,
        onChange: (e) => setPhone(e.target.value),
        dir: "ltr",
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-left"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u062F\u0648\u0644\u0629" : "Country"), /* @__PURE__ */ React.createElement(
      "select",
      {
        disabled: true,
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 opacity-80 cursor-not-allowed"
      },
      /* @__PURE__ */ React.createElement("option", { value: "EG" }, isArabic ? "\u0645\u0635\u0631" : "Egypt")
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629 / \u0627\u0644\u0645\u062F\u064A\u0646\u0629" : "Governorate"), /* @__PURE__ */ React.createElement(
      "select",
      {
        required: true,
        value: selectedGovernorate,
        onChange: handleGovernorateChange,
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
      },
      /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, isArabic ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629" : "Select Governorate"),
      shippingRates.map((rate) => /* @__PURE__ */ React.createElement("option", { key: rate._id, value: rate._id }, isArabic ? rate.governorateAr : rate.governorate))
    ))), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0628\u0627\u0644\u062A\u0641\u0635\u064A\u0644" : "Full Address"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        required: true,
        name: "address",
        rows: "3",
        value: address,
        onChange: (e) => setAddress(e.target.value),
        className: "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639" : "Payment Method"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2" }, /* @__PURE__ */ React.createElement(
      "label",
      {
        className: `cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "online" ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:bg-indigo-900/30" : "border-slate-200 hover:border-indigo-300 dark:border-slate-700"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-3 font-bold text-slate-900 dark:text-white" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "radio",
          name: "checkoutPaymentMethod",
          value: "online",
          checked: paymentMethod === "online",
          onChange: () => setPaymentMethod("online"),
          className: "h-4 w-4 accent-indigo-600"
        }
      ), /* @__PURE__ */ React.createElement(CreditCard, { className: "h-5 w-5 text-indigo-500" }), isArabic ? "\u062F\u0641\u0639 \u0623\u0648\u0646\u0644\u0627\u064A\u0646" : "Online Payment"),
      /* @__PURE__ */ React.createElement("span", { className: "mt-2 block text-sm text-slate-500 dark:text-slate-400" }, isArabic ? "\u064A\u062A\u062D\u0648\u0644 \u0627\u0644\u0637\u0644\u0628 \u0644\u0637\u0644\u0628 \u0645\u0624\u0643\u062F \u0628\u0639\u062F \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0641\u0639." : "The order is confirmed after full payment.")
    ), /* @__PURE__ */ React.createElement(
      "label",
      {
        className: `cursor-pointer rounded-xl border-2 p-4 transition-colors ${paymentMethod === "cash_on_delivery" ? "border-indigo-600 bg-indigo-50/50 shadow-sm dark:bg-indigo-900/30" : "border-slate-200 hover:border-indigo-300 dark:border-slate-700"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-3 font-bold text-slate-900 dark:text-white" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "radio",
          name: "checkoutPaymentMethod",
          value: "cash_on_delivery",
          checked: paymentMethod === "cash_on_delivery",
          onChange: () => setPaymentMethod("cash_on_delivery"),
          className: "h-4 w-4 accent-indigo-600"
        }
      ), /* @__PURE__ */ React.createElement(Truck, { className: "h-5 w-5 text-indigo-500" }), isArabic ? "\u062F\u0641\u0639 \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645" : "Cash on delivery"),
      /* @__PURE__ */ React.createElement("span", { className: "mt-2 block text-sm text-slate-500 dark:text-slate-400" }, isArabic ? "\u064A\u064F\u062D\u0641\u0638 \u0627\u0644\u0637\u0644\u0628 \u0628\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u062F\u0641\u0648\u0639\u0629 \u0644\u062D\u064A\u0646 \u0627\u0633\u062A\u0644\u0627\u0645\u0647." : "The order is saved as unpaid until delivery.")
    ))))),
    /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-950 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-6" }, isArabic ? "\u0645\u0644\u062E\u0635 \u0627\u0644\u0637\u0644\u0628" : "Order Summary"), /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2" }, isArabic ? "\u0643\u0648\u0628\u0648\u0646 \u0627\u0644\u062E\u0635\u0645" : "Discount Coupon"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-2" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: couponCode,
        onChange: (e) => {
          setCouponCode(e.target.value.toUpperCase());
          setCouponStatus(null);
          setCouponError("");
        },
        onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon()),
        placeholder: isArabic ? "\u0623\u062F\u062E\u0644 \u0643\u0648\u062F \u0627\u0644\u0643\u0648\u0628\u0648\u0646" : "Enter coupon code",
        disabled: !!appliedCoupon,
        className: `flex-1 w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 transition-colors ${couponStatus === "valid" ? "border-emerald-400 focus:ring-emerald-500" : couponStatus === "invalid" ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"}`
      }
    ), appliedCoupon ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setAppliedCoupon(null);
          setCouponCode("");
          setCouponStatus(null);
          setCouponError("");
        },
        className: "w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20 transition-colors whitespace-nowrap"
      },
      isArabic ? "\u0625\u0632\u0627\u0644\u0629" : "Remove"
    ) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleApplyCoupon,
        disabled: couponStatus === "checking" || !couponCode.trim(),
        className: "w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      },
      couponStatus === "checking" ? "..." : isArabic ? "\u062A\u0637\u0628\u064A\u0642" : "Apply"
    )), couponStatus === "valid" && appliedCoupon && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-emerald-500 font-bold mt-1.5" }, "\u2713", " ", isArabic ? `\u062A\u0645 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0643\u0648\u0628\u0648\u0646! \u062E\u0635\u0645 ${appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatMoney(appliedCoupon.value)}` : `Coupon applied! Discount: ${appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : formatMoney(appliedCoupon.value)}`), couponStatus === "invalid" && /* @__PURE__ */ React.createElement(
      ErrorNotice,
      {
        error: couponError || t("panel.errors.invalidCoupon"),
        language: isArabic ? "ar" : "en",
        className: "mt-2"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 mb-6 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", null, isArabic ? "\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0641\u0631\u0639\u064A" : "Subtotal"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-900 dark:text-white" }, formatMoney(totalPrice))), discount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-emerald-500" }, isArabic ? `\u062E\u0635\u0645 (${appliedCoupon?.code})` : `Discount (${appliedCoupon?.code})`), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-500" }, "- ", formatMoney(discount))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", null, isArabic ? "\u0627\u0644\u0634\u062D\u0646" : "Shipping"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-indigo-600 dark:text-indigo-400" }, shippingCost === 0 && !selectedGovernorate ? isArabic ? "\u062D\u062F\u062F \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629" : "Select Gov" : formatMoney(shippingCost)))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-xl font-black text-slate-900 dark:text-white mb-8" }, /* @__PURE__ */ React.createElement("span", null, isArabic ? "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A" : "Total"), /* @__PURE__ */ React.createElement("span", { className: "text-indigo-600 dark:text-indigo-400" }, formatMoney(finalTotal))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: isSubmitting || cart.length === 0,
        className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      },
      isSubmitting ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin" }) : isArabic ? paymentMethod === "cash_on_delivery" ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628" : "\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062F\u0641\u0639" : paymentMethod === "cash_on_delivery" ? "Place order" : "Continue to Payment"
    )))
  ));
}
