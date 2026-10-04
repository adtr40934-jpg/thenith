import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Calendar,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Clock,
  ArrowLeft
} from "lucide-react";
import apiClient from "../../../api/client.js";
import { getAccessToken } from "../../services/authApi.js";
import CompleteProfileModal from "./CompleteProfileModal.jsx";
import { useNavigate } from "react-router-dom";
import UnifiedPaymentBox from "./UnifiedPaymentBox.jsx";
import toast from "react-hot-toast";
export default function SubscriptionsPage({
  t,
  subscription: initialSubscription,
  user: initialUser,
  onNavigateToProfile
}) {
  const navigate = useNavigate();
  const isArabic = typeof t === "function" ? t("home") === "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629" : true;
  const searchParams = new URLSearchParams(window.location.search);
  const initialPeriod = searchParams.get("period");
  const defaultIsAnnual = initialPeriod ? initialPeriod === "yearly" : false;
  const [isAnnual, setIsAnnual] = useState(defaultIsAnnual);
  const [plans, setPlans] = useState([]);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [userSubscription, setUserSubscription] = useState(
    initialSubscription || null
  );
  const [currentUser, setCurrentUser] = useState(initialUser || null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelMessage, setCancelMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPendingDetails, setSelectedPendingDetails] = useState(null);
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data: plansData } = await apiClient.get("/plans");
        if (mounted && plansData.plans) {
          setPlans(plansData.plans);
          setActiveCoupon(plansData.activeCoupon || null);
        }
        if (token) {
          const { data: subData } = await apiClient.get("/subscription", {
            headers
          });
          if (mounted) setUserSubscription(subData);
          const { data: sessionData } = await apiClient.get("/auth/me", {
            headers
          });
          if (mounted && sessionData.user) setCurrentUser(sessionData.user);
          try {
            const pendingRes = await apiClient.get("/payment/pending", { headers });
            if (mounted && pendingRes.data?.success) {
              const allPending = [
                ...pendingRes.data.subscriptions || [],
                ...pendingRes.data.orders || []
              ];
              setPendingPayments(allPending);
            }
          } catch (e) {
          }
        }
      } catch (err) {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);
  const proPlan = plans.find((item) => item.key === "pro");
  const getFeaturesList = (plan) => {
    return (plan?.marketingFeatures || []).filter((feature) => feature.enabled).map((feature) => {
      return typeof feature.name === "object" ? feature.name[isArabic ? "ar" : "en"] || feature.name.ar : feature.name;
    });
  };
  const proFeatures = getFeaturesList(proPlan);
  const visibleProFeatures = showAllFeatures ? proFeatures : proFeatures.slice(0, 5);
  const couponValidationResult = proPlan?.calculatedPrice ? isAnnual ? proPlan.calculatedPrice.yearly : proPlan.calculatedPrice.monthly : null;
  const monthlyPrice = proPlan?.prices?.monthly || 0;
  const yearlyPrice = proPlan?.prices?.yearly || 0;
  const annualSavingPct = monthlyPrice > 0 && yearlyPrice > 0 ? Math.round((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12) * 100) : null;
  const isCurrentSubscribed = userSubscription?.plan === proPlan?.key && (userSubscription?.status === "active" || userSubscription?.status === "trialing");
  const formatDate = (dateStr) => {
    if (!dateStr) return isArabic ? "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F" : "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString(isArabic ? "ar-EG-u-nu-latn" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };
  const handleSubscribe = () => {
    if (!proPlan) return;
    const planName = typeof proPlan.name === "object" ? proPlan.name[isArabic ? "ar" : "en"] || proPlan.name.ar : proPlan.name;
    const period = isAnnual ? "yearly" : "monthly";
    const price = isAnnual ? proPlan.prices?.yearly : proPlan.prices?.monthly;
    const params = new URLSearchParams({
      type: "subscription",
      planId: proPlan._id,
      billingPeriod: period,
      amount: price || "",
      planName: planName || ""
    });
    navigate(`/payment?${params.toString()}`);
  };
  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const token = getAccessToken();
      const { data } = await apiClient.post(
        "/subscription/cancel",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (data.success) {
        setUserSubscription(data.state || null);
        setCancelMessage({
          type: "success",
          text: t("cancelledSuccessfully")
        });
        setShowCancelConfirm(false);
        window.dispatchEvent(new CustomEvent("dashboard-action", {
          detail: {
            type: "subscription_cancelled",
            title: isArabic ? "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0646\u062C\u0627\u062D" : "Subscription cancelled successfully"
          }
        }));
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.message || "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643");
      }
    } catch (err) {
      setCancelMessage({
        type: "error",
        text: err.message || (isArabic ? "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Failed to cancel")
      });
    } finally {
      setCancelling(false);
    }
  };
  if (!loading && !proPlan) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "space-y-8 pb-20 p-2 sm:p-0",
        dir: isArabic ? "rtl" : "ltr"
      },
      /* @__PURE__ */ React.createElement("div", { className: "text-center pt-4 pb-2" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight" }, isArabic ? "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Subscription Management"), /* @__PURE__ */ React.createElement("p", { className: "mt-6 text-slate-500 dark:text-slate-400" }, t("noPlansAvailable")))
    );
  }
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-8 pb-20 p-2 sm:p-0 relative", dir: isArabic ? "rtl" : "ltr" }, /* @__PURE__ */ React.createElement("div", { className: "text-center pt-4 pb-2" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight" }, t("subscriptionManagement")), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto" }, t("controlYourPlan"))), loading ? /* @__PURE__ */ React.createElement("div", { className: "flex justify-center py-24" }, /* @__PURE__ */ React.createElement(Loader2, { className: "w-10 h-10 animate-spin text-indigo-600" })) : /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto" }, cancelMessage && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${cancelMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`
    },
    cancelMessage.type === "success" ? /* @__PURE__ */ React.createElement(ShieldCheck, { className: "w-5 h-5 text-emerald-600 shrink-0" }) : /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5 text-rose-600 shrink-0" }),
    /* @__PURE__ */ React.createElement("span", null, cancelMessage.text)
  ), /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "relative bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-800 text-white overflow-hidden"
    },
    /* @__PURE__ */ React.createElement("div", { className: "absolute -top-24 -end-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-2xl sm:text-3xl font-black text-white flex items-center gap-2" }, typeof proPlan.name === "object" ? proPlan.name[isArabic ? "ar" : "en"] || proPlan.name.ar : proPlan.name, isCurrentSubscribed && /* @__PURE__ */ React.createElement(BadgeCheck, { className: "w-7 h-7 text-indigo-400" })), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-sm mt-1" }, isArabic ? "\u0643\u0644 \u0645\u0627 \u062A\u062D\u062A\u0627\u062C\u0647 \u0644\u0644\u0646\u062C\u0627\u062D \u0648\u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u0642\u064A\u0648\u062F" : "Everything you need to succeed without limits")), isCurrentSubscribed ? /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black self-start sm:self-auto" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, t("alreadySubscribed"), " (", t("planActive"), ")")) : /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold self-start sm:self-auto" }, /* @__PURE__ */ React.createElement("span", null, t("mostFeatured")))),
    pendingPayments.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "mb-8 space-y-4 text-start" }, pendingPayments.map((item, idx) => {
      const tx = item.transaction || item;
      const planName = typeof item.planId?.name === "object" ? item.planId.name[isArabic ? "ar" : "en"] || item.planId.name.ar : item.planId?.name || "pro";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: idx,
          className: "bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "mt-1 shrink-0" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-6 h-6 text-amber-400 animate-pulse" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-black text-amber-200 text-base sm:text-lg" }, isArabic ? "\u062F\u0641\u0639 \u0627\u0634\u062A\u0631\u0627\u0643 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644" : "Incomplete Subscription Payment"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-300 text-xs sm:text-sm mt-1" }, isArabic ? `\u0644\u062F\u064A\u0643 \u0637\u0644\u0628 \u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0628\u0627\u0642\u0629 ${planName} \u0642\u064A\u062F \u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u062F\u0641\u0639.` : `You have a pending subscription payment for ${planName} plan.`))),
        /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              const params = new URLSearchParams({
                type: item.type || "subscription",
                planId: item.planId?._id || item.planId,
                id: item._id,
                intentKey: tx?.intentKey
              });
              window.location.href = `/payment?${params.toString()}`;
            },
            className: "w-full sm:w-auto shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          },
          /* @__PURE__ */ React.createElement("span", null, isArabic ? " \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u062F\u0641\u0639" : "Check Status"),
          isArabic ? /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4" }) : /* @__PURE__ */ React.createElement(ChevronDown, { className: "w-4 h-4" })
        )
      );
    })) : isCurrentSubscribed ? /* @__PURE__ */ React.createElement("div", { className: "mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-indigo-300 font-bold border-b border-white/10 pb-2" }, /* @__PURE__ */ React.createElement(Calendar, { className: "w-4 h-4" }), /* @__PURE__ */ React.createElement("span", null, t("currentSubDetails"), ":")), (userSubscription?.intentKey || userSubscription?.providerSubscriptionId || userSubscription?._id) && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center py-1 border-b border-white/5" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-400" }, isArabic ? "\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629:" : "Invoice ID:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono font-black text-indigo-300 text-xs tracking-wider" }, userSubscription.intentKey || userSubscription.providerSubscriptionId || userSubscription._id)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center py-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-400" }, isArabic ? "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643:" : "Start Date:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white" }, formatDate(
      userSubscription?.startedAt || userSubscription?.createdAt
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center py-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-400" }, t("expiryDate"), " / ", t("renewalDate"), ":"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-400" }, formatDate(userSubscription?.expiresAt))), userSubscription?.billingPeriod && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center py-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-400" }, t("billingCycle"), ":"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-indigo-200" }, userSubscription.billingPeriod === "yearly" ? t("annual") : t("monthlyPeriod")))) : (
      /* If User is NOT Subscribed: Show Billing Toggle & Price */
      /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-start mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/10 backdrop-blur-sm p-1.5 rounded-full flex items-center border border-white/10 shadow-sm relative w-[340px] max-w-full" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setIsAnnual(false),
          className: `flex-1 relative z-10 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${!isAnnual ? "text-white" : "text-slate-400 hover:text-white"}`
        },
        t("monthlyPeriod")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setIsAnnual(true),
          className: `flex-1 relative z-10 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 ${isAnnual ? "text-white" : "text-slate-400 hover:text-white"}`
        },
        t("annual"),
        annualSavingPct > 0 && /* @__PURE__ */ React.createElement("span", { className: `text-[10px] px-2 py-0.5 rounded-full font-black ${isAnnual ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"}` }, t("savePct"), " ", annualSavingPct, "%")
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-full transition-all duration-300 shadow-md bg-indigo-600 border border-indigo-500",
          style: {
            insetInlineStart: !isAnnual ? "0.375rem" : "calc(50% + 0.1875rem)"
          }
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "relative mb-8" }, couponValidationResult ? /* @__PURE__ */ React.createElement(React.Fragment, null, couponValidationResult.discountAmount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-slate-400 line-through text-lg", dir: "ltr" }, couponValidationResult.originalPrice, " ", isArabic ? "\u062C.\u0645" : "EGP"), /* @__PURE__ */ React.createElement("span", { className: "bg-rose-500/20 text-rose-400 text-xs font-bold px-2 py-1 rounded-full border border-rose-500/20" }, couponValidationResult.discountType === "percentage" ? `\u062E\u0635\u0645 ${couponValidationResult.appliedDiscountVal}%` : `\u062E\u0635\u0645 ${couponValidationResult.appliedDiscountVal} \u062C.\u0645`)), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-4xl sm:text-5xl font-black text-white", dir: "ltr" }, couponValidationResult.finalPrice, /* @__PURE__ */ React.createElement("span", { className: "text-xl ms-2" }, isArabic ? "\u062C.\u0645" : "EGP")), /* @__PURE__ */ React.createElement("span", { className: "text-slate-400 font-bold text-base sm:text-lg" }, "/ ", isAnnual ? t("perYear") : t("perMonth")))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2 animate-pulse" }, /* @__PURE__ */ React.createElement("div", { className: "h-12 w-32 bg-slate-700/50 rounded-lg" }), /* @__PURE__ */ React.createElement("span", { className: "text-slate-400 font-bold text-base sm:text-lg" }, "/ ", isAnnual ? t("perYear") : t("perMonth")))))
    ),
    pendingPayments.length > 0 ? null : isCurrentSubscribed ? /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, showCancelConfirm ? /* @__PURE__ */ React.createElement("div", { className: "bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-rose-200 font-bold text-sm mb-4" }, t("confirmCancelSub")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 justify-center" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleCancelSubscription,
        disabled: cancelling,
        className: "bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
      },
      cancelling && /* @__PURE__ */ React.createElement(Loader2, { className: "w-4 h-4 animate-spin" }),
      isArabic ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0625\u0644\u063A\u0627\u0621" : "Confirm Cancellation"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowCancelConfirm(false),
        disabled: cancelling,
        className: "bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-sm transition-all"
      },
      t("revert")
    ))) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowCancelConfirm(true),
        className: "w-full py-3.5 px-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
      },
      /* @__PURE__ */ React.createElement(XCircle, { className: "w-4 h-4" }),
      /* @__PURE__ */ React.createElement("span", null, isArabic ? "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Cancel Subscription")
    )) : /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSubscribe,
        disabled: subscribing,
        className: "relative flex items-center justify-center w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-colors mb-8 group overflow-hidden disabled:opacity-50 shadow-lg shadow-indigo-600/30"
      },
      /* @__PURE__ */ React.createElement("span", { className: "relative z-10 flex items-center gap-2" }, subscribing ? /* @__PURE__ */ React.createElement(Loader2, { className: "w-5 h-5 animate-spin" }) : t("subscribeNowBtn"), !subscribing && /* @__PURE__ */ React.createElement(ArrowRight, { className: "w-5 h-5 group-hover:-translate-x-1 transition-transform" }))
    ),
    /* @__PURE__ */ React.createElement("div", { className: "pt-6 border-t border-slate-800" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-indigo-300 mb-4" }, t("allPlans")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3.5" }, visibleProFeatures.map((feature, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5" }, /* @__PURE__ */ React.createElement(Check, { className: "w-3.5 h-3.5 text-indigo-400" })), /* @__PURE__ */ React.createElement("span", { className: "text-slate-300 text-sm font-medium" }, feature)))), proFeatures.length > 5 && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowAllFeatures(!showAllFeatures),
        className: "mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-xs"
      },
      showAllFeatures ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ChevronUp, { className: "w-4 h-4" }), t("hideDetails")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ChevronDown, { className: "w-4 h-4" }), `${t("showMoreFeatures")} (${proFeatures.length - 5})`)
    ))
  )), /* @__PURE__ */ React.createElement(
    CompleteProfileModal,
    {
      isOpen: showProfileModal,
      currentUser,
      onClose: () => setShowProfileModal(false),
      onSuccess: (updatedUser) => {
        setCurrentUser(updatedUser);
        setShowProfileModal(false);
      }
    }
  ));
}
