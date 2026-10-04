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
  ArrowLeft,
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
  onNavigateToProfile,
}) {
  const navigate = useNavigate();
  const isArabic = typeof t === "function" ? t("home") === "الرئيسية" : true;

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
    initialSubscription || null,
  );
  const [currentUser, setCurrentUser] = useState(initialUser || null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelMessage, setCancelMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPendingDetails, setSelectedPendingDetails] = useState(null);

  // Fetch plans, fresh subscription details and pending payments from backend
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
            headers,
          });
          if (mounted) setUserSubscription(subData);

          const { data: sessionData } = await apiClient.get("/auth/me", {
            headers,
          });
          if (mounted && sessionData.user) setCurrentUser(sessionData.user);

          // Check pending payments
          try {
            const pendingRes = await apiClient.get("/payment/pending", { headers });
            if (mounted && pendingRes.data?.success) {
              const allPending = [
                ...(pendingRes.data.subscriptions || []),
                ...(pendingRes.data.orders || []),
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
    return (plan?.marketingFeatures || [])
      .filter((feature) => feature.enabled)
      .map((feature) => {
        return typeof feature.name === 'object' ? (feature.name[isArabic ? "ar" : "en"] || feature.name.ar) : feature.name;
      });
  };

  const proFeatures = getFeaturesList(proPlan);
  const visibleProFeatures = showAllFeatures
    ? proFeatures
    : proFeatures.slice(0, 5);
  // Synchronously compute price from backend-provided calculatedPrice
  const couponValidationResult = proPlan?.calculatedPrice
    ? (isAnnual ? proPlan.calculatedPrice.yearly : proPlan.calculatedPrice.monthly)
    : null;

  // Calculate real annual saving percentage from backend prices
  const monthlyPrice = proPlan?.prices?.monthly || 0;
  const yearlyPrice = proPlan?.prices?.yearly || 0;
  const annualSavingPct =
    monthlyPrice > 0 && yearlyPrice > 0
      ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
      : null;

  const isCurrentSubscribed =
    userSubscription?.plan === proPlan?.key &&
    (userSubscription?.status === "active" ||
      userSubscription?.status === "trialing");

  const formatDate = (dateStr) => {
    if (!dateStr) return isArabic ? "غير محدد" : "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString(isArabic ? "ar-EG-u-nu-latn" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubscribe = () => {
    if (!proPlan) return;
    const planName = typeof proPlan.name === "object"
      ? (proPlan.name[isArabic ? "ar" : "en"] || proPlan.name.ar)
      : proPlan.name;

    const period = isAnnual ? "yearly" : "monthly";
    const price = isAnnual ? proPlan.prices?.yearly : proPlan.prices?.monthly;

    // Build payment URL with all needed params
    const params = new URLSearchParams({
      type: "subscription",
      planId: proPlan._id,
      billingPeriod: period,
      amount: price || "",
      planName: planName || "",
    });

    if (activeCoupon?.code) {
      params.append("couponCode", activeCoupon.code);
    }

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
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        setUserSubscription(data.state || null);
        setCancelMessage({
          type: "success",
          text: t("cancelledSuccessfully"),
        });
        setShowCancelConfirm(false);
        // Notify bell notifications
        window.dispatchEvent(new CustomEvent("dashboard-action", {
          detail: {
            type: "subscription_cancelled",
            title: isArabic ? "تم إلغاء الاشتراك بنجاح" : "Subscription cancelled successfully",
          },
        }));
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.message || "فشل إلغاء الاشتراك");
      }
    } catch (err) {
      setCancelMessage({
        type: "error",
        text:
          err.message ||
          (isArabic ? "حدث خطأ أثناء إلغاء الاشتراك" : "Failed to cancel"),
      });
    } finally {
      setCancelling(false);
    }
  };

  if (!loading && !proPlan) {
    return (
      <div
        className="space-y-8 pb-20 p-2 sm:p-0"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="text-center pt-4 pb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isArabic ? "إدارة الاشتراك" : "Subscription Management"}
          </h1>
          <p className="mt-6 text-slate-500 dark:text-slate-400">
            {t("noPlansAvailable")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 p-2 sm:p-0 relative" dir={isArabic ? "rtl" : "ltr"}>
      {/* Section Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {t("subscriptionManagement")}
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          {t("controlYourPlan")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Notification Feedback */}
          {cancelMessage && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${cancelMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
            >
              {cancelMessage.type === "success" ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{cancelMessage.text}</span>
            </div>
          )}

          {/* Pro Plan Card - Matching Landing Page Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-800 text-white overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -end-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Plan Title & Subscribed Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  {typeof proPlan.name === 'object' ? proPlan.name[isArabic ? "ar" : "en"] || proPlan.name.ar : proPlan.name}
                  {isCurrentSubscribed && (
                    <BadgeCheck className="w-7 h-7 text-indigo-400" />
                  )}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {isArabic
                    ? "كل ما تحتاجه للنجاح والاحترافية بدون أي قيود"
                    : "Everything you need to succeed without limits"}
                </p>
              </div>

              {/* Subscribed Status Pill */}
              {isCurrentSubscribed ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {t("alreadySubscribed")} ({t("planActive")})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold self-start sm:self-auto">
                  <span>{t("mostFeatured")}</span>
                </div>
              )}
            </div>

            {/* If User has Pending Payment: Show Pending Banner matching Homepage design */}
            {pendingPayments.length > 0 ? (
              <div className="mb-8 space-y-4 text-start">
                {pendingPayments.map((item, idx) => {
                  const tx = item.transaction || item;
                  const planName = typeof item.planId?.name === "object"
                    ? (item.planId.name[isArabic ? "ar" : "en"] || item.planId.name.ar)
                    : (item.planId?.name || "pro");

                  return (
                    <div
                      key={idx}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 shrink-0">
                          <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black text-amber-200 text-base sm:text-lg">
                            {isArabic ? "دفع اشتراك غير مكتمل" : "Incomplete Subscription Payment"}
                          </h4>
                          <p className="text-slate-300 text-xs sm:text-sm mt-1">
                            {isArabic
                              ? `لديك طلب اشتراك في باقة ${planName} قيد انتظار الدفع.`
                              : `You have a pending subscription payment for ${planName} plan.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full sm:w-auto shrink-0 gap-2">
                        <button
                          onClick={async () => {
                            const confirmCancel = window.confirm(
                              isArabic
                                ? "هل أنت متأكد من إلغاء هذا الدفع؟"
                                : "Are you sure you want to cancel this payment?"
                            );
                            if (!confirmCancel) return;
                            try {
                              const token = getAccessToken();
                              const headers = token ? { Authorization: `Bearer ${token}` } : {};
                              await apiClient.post("/payment/cancel", { intentKey: tx?.intentKey }, { headers });
                              toast.success(isArabic ? "تم إلغاء الدفع بنجاح" : "Payment cancelled");
                              setPendingPayments((prev) => prev.filter(p => (p.transaction || p).intentKey !== tx?.intentKey));
                            } catch (err) {
                              toast.error(isArabic ? "حدث خطأ أثناء الإلغاء" : "Failed to cancel");
                            }
                          }}
                          className="w-1/2 sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 border border-slate-700"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isArabic ? "إلغاء" : "Cancel"}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            const params = new URLSearchParams({
                              type: item.type || "subscription",
                              planId: item.planId?._id || item.planId,
                              id: item._id,
                              intentKey: tx?.intentKey
                            });
                            window.location.href = `/payment?${params.toString()}`;
                          }}
                          className="w-1/2 sm:w-auto shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <span>{isArabic ? " استكمال الدفع" : "Check Status"}</span>
                          {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : isCurrentSubscribed ? (
              <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-sm">
                <div className="flex items-center gap-2 text-indigo-300 font-bold border-b border-white/10 pb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t("currentSubDetails")}:</span>
                </div>

                {(userSubscription?.intentKey || userSubscription?.providerSubscriptionId || userSubscription?._id) && (
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">{isArabic ? "رقم الفاتورة:" : "Invoice ID:"}</span>
                    <span className="font-mono font-black text-indigo-300 text-xs tracking-wider">
                      {userSubscription.intentKey || userSubscription.providerSubscriptionId || userSubscription._id}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">
                    {isArabic ? "تاريخ الاشتراك:" : "Start Date:"}
                  </span>
                  <span className="font-bold text-white">
                    {formatDate(
                      userSubscription?.startedAt ||
                      userSubscription?.createdAt,
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">
                    {t("expiryDate")} / {t("renewalDate")}:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {formatDate(userSubscription?.expiresAt)}
                  </span>
                </div>

                {userSubscription?.billingPeriod && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">{t("billingCycle")}:</span>
                    <span className="font-bold text-indigo-200">
                      {userSubscription.billingPeriod === "yearly"
                        ? t("annual")
                        : t("monthlyPeriod")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* If User is NOT Subscribed: Show Billing Toggle & Price */
              <>
                <div className="flex justify-start mb-8">
                  <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-full flex items-center border border-white/10 shadow-sm relative w-[340px] max-w-full">
                    <button
                      onClick={() => setIsAnnual(false)}
                      className={`flex-1 relative z-10 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${!isAnnual
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                        }`}
                    >
                      {t("monthlyPeriod")}
                    </button>
                    <button
                      onClick={() => setIsAnnual(true)}
                      className={`flex-1 relative z-10 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 ${isAnnual
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                        }`}
                    >
                      {t("annual")}
                      {annualSavingPct > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isAnnual ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"}`}>
                          {t("savePct")} {annualSavingPct}%
                        </span>
                      )}
                    </button>

                    {/* Sliding Background */}
                    <div
                      className="absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-full transition-all duration-300 shadow-md bg-indigo-600 border border-indigo-500"
                      style={{
                        insetInlineStart: !isAnnual ? "0.375rem" : "calc(50% + 0.1875rem)"
                      }}
                    />
                  </div>
                </div>

                <div className="relative mb-8">
                  {couponValidationResult ? (
                    <>
                      {couponValidationResult.discountAmount > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-slate-400 line-through text-lg" dir="ltr">
                            {couponValidationResult.originalPrice} {isArabic ? "ج.م" : "EGP"}
                          </span>
                          <span className="bg-rose-500/20 text-rose-400 text-xs font-bold px-2 py-1 rounded-full border border-rose-500/20">
                            {couponValidationResult.discountType === "percentage"
                              ? `خصم ${couponValidationResult.appliedDiscountVal}%`
                              : `خصم ${couponValidationResult.appliedDiscountVal} ج.م`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-white" dir="ltr">
                          {couponValidationResult.finalPrice}
                          <span className="text-xl ms-2">{isArabic ? "ج.م" : "EGP"}</span>
                        </span>
                        <span className="text-slate-400 font-bold text-base sm:text-lg">
                          / {isAnnual ? t("perYear") : t("perMonth")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2 animate-pulse">
                      <div className="h-12 w-32 bg-slate-700/50 rounded-lg"></div>
                      <span className="text-slate-400 font-bold text-base sm:text-lg">
                        / {isAnnual ? t("perYear") : t("perMonth")}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons: Cancel vs Subscribe */}
            {pendingPayments.length > 0 ? null : isCurrentSubscribed ? (
              <div className="mb-8">
                {showCancelConfirm ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center">
                    <p className="text-rose-200 font-bold text-sm mb-4">
                      {t("confirmCancelSub")}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {cancelling && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isArabic ? "تأكيد الإلغاء" : "Confirm Cancellation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={cancelling}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-sm transition-all"
                      >
                        {t("revert")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3.5 px-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isArabic ? "إلغاء الاشتراك" : "Cancel Subscription"}</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="relative flex items-center justify-center w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-colors mb-8 group overflow-hidden disabled:opacity-50 shadow-lg shadow-indigo-600/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {subscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("subscribeNowBtn")
                  )}
                  {!subscribing && (
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  )}
                </span>
              </button>
            )}

            {/* Features Section */}
            <div className="pt-6 border-t border-slate-800">
              <p className="text-sm font-bold text-indigo-300 mb-4">
                {t("allPlans")}
              </p>

              <div className="space-y-3.5">
                {visibleProFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-slate-300 text-sm font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {proFeatures.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-xs"
                >
                  {showAllFeatures ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {t("hideDetails")}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {`${t("showMoreFeatures")} (${proFeatures.length - 5})`}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Pending Payment Details Modal (Removed) */}

      {/* Complete Missing Profile Details Modal */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        currentUser={currentUser}
        onClose={() => setShowProfileModal(false)}
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          setShowProfileModal(false);
        }}
      />
    </div>
  );
}
