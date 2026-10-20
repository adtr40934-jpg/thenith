/**
 * PaymentResultPage.jsx
 *
 * Handles the three Fawaterak redirect callbacks:
 *   /payment/success?type=subscription|order&id=...
 *   /payment/fail
 *   /payment/pending
 *
 * On success: calls /api/payment/verify with the intentKey from the subscription/order record.
 */

import React, { useEffect, useState } from "react";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Home,
  RefreshCw,
} from "lucide-react";
import api from "../api/index.js";
import GlobalLogo from "../components/GlobalLogo.jsx";
import { useGlobalLanguage } from "../context/GlobalLanguageContext.jsx";
import ErrorNotice from "../components/ErrorNotice.jsx";
import { getLocalizedErrorMessage } from "../utils/errorHandling.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function PaymentResultPage() {
  const { language } = useGlobalLanguage();
  const { clearCart } = useCart();
  const { refreshSession } = useAuth();
  const isArabic = language === "ar" || !language;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type"); // "subscription" | "order"
  const id = searchParams.get("id"); // subscription or order MongoDB ID
  const intentKeyParam =
    searchParams.get("intentKey") ||
    searchParams.get("invoice_key") ||
    searchParams.get("intent_key") ||
    "";

  // Determine result from path
  const path = location.pathname;
  const isSuccess = path.includes("/success");
  const isFail = path.includes("/fail");
  const isPending = path.includes("/pending");

  const [verifying, setVerifying] = useState(isSuccess);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [verifyError, setVerifyError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [transactionData, setTransactionData] = useState(null);
  const [paymentTypeState, setPaymentTypeState] = useState(type);

  const verifyKey = intentKeyParam || id || "";

  const runVerification = async (isRetry = false) => {
    // If we are inside an iframe (like the Visa 3DS modal), break out immediately!
    if (window !== window.top) {
      window.top.location.href = window.location.href;
      return;
    }

    setVerifying(true);
    setVerifyError("");

    try {
      const result = await api.payment.verify(verifyKey);
      if (result.success && result.status === "paid") {
        setVerified(true);
        if (result.type) setPaymentTypeState(result.type);
        if (result.orderNumber) setOrderNumber(result.orderNumber);
        if (result.type === "store" || result.type === "order") clearCart();

        setTransactionData({
          intentKey: result.intentKey,
          transactionId: result.transactionId || result.intentKey,
          amount: result.amount,
          paymentMethodName: result.paymentMethodName,
        });

        // The backend has confirmed the payment! Refresh session so Pro plan is immediately active in AuthContext!
        try {
          await refreshSession();
        } catch {}
      } else {
        setVerifyError(
          result.message ||
            (isArabic
              ? "لم يتم تأكيد الدفع بعد من بوابة الدفع. يرجى الانتظار ثم إعادة المحاولة."
              : "Payment not confirmed yet. Check transaction details or try again."),
        );
      }
    } catch (err) {
      setVerifyError(getLocalizedErrorMessage(err, language));
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) {
      setVerifying(false);
      return;
    }

    runVerification();
  }, [isSuccess, verifyKey]);

  // Handle countdown and navigation
  useEffect(() => {
    if (verified) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        if (paymentTypeState === "order" || paymentTypeState === "store") {
          navigate("/products", { replace: true });
        } else {
          navigate("/u", { replace: true });
        }
      }
    }
  }, [verified, countdown, navigate, paymentTypeState]);

  // Prevent reload while redirecting
  useEffect(() => {
    if (!verified) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [verified]);

  useEffect(() => {
    if (!isPending || !id) return;
    let mounted = true;
    api.payment
      .getPending()
      .then((data) => {
        if (!mounted || !data.success) return;
        const list = type === "subscription" ? data.subscriptions : data.orders;
        const match = list.find((item) => item._id === id);
        if (match && match.transaction) {
          setTransactionData(match.transaction);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isPending, id, type]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
          {isArabic ? "جاري التحقق من الدفع مع السيرفر..." : "Verifying payment with server..."}
        </p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <GlobalLogo />
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10 max-w-md w-full text-center"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {verified && !verifyError ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50 dark:ring-amber-900/20">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-400" />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
            {verified
              ? isArabic
                ? "تم تأكيد الدفع بنجاح 🎉"
                : "Payment Confirmed Successfully 🎉"
              : isArabic
                ? "جاري تأكيد حالة الدفع"
                : "Confirming Payment Status"}
          </h1>

          {verifyError ? (
            <div className="space-y-4 mb-6">
              <ErrorNotice
                error={verifyError}
                language={language}
                className="text-start"
              />
              <button
                type="button"
                onClick={() => runVerification(true)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isArabic ? "التحقق من حالة الدفع الآن" : "Check Payment Status Now"}</span>
              </button>
              <Link
                to="/u"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>{isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}</span>
              </Link>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {paymentTypeState === "subscription"
                ? isArabic
                  ? "تم تفعيل اشتراكك بنجاح في باقة Pro! استمتع بجميع المميزات المتقدمة."
                  : "Your Pro subscription has been activated successfully!"
                : isArabic
                  ? `تم تأكيد دفع طلبك${orderNumber ? ` #${orderNumber}` : ""} بنجاح.`
                  : `Your order${orderNumber ? ` #${orderNumber}` : ""} has been confirmed!`}
            </p>
          )}

          {verified && transactionData && !verifyError && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-start space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isArabic ? "المرجع" : "Reference"}
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                  {transactionData.transactionId &&
                  !String(transactionData.transactionId).match(/[a-z]/i)
                    ? `#${transactionData.transactionId}`
                    : orderNumber
                      ? `#${orderNumber}`
                      : ""}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isArabic ? "طريقة الدفع" : "Payment Method"}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {transactionData.paymentMethodName ||
                    (isArabic ? "أونلاين" : "Online")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isArabic ? "المبلغ المدفوع" : "Amount Paid"}
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {transactionData.amount} EGP
                </span>
              </div>
            </div>
          )}

          {!verifyError && verified && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>
                  {isArabic
                    ? `سيتم توجيهك تلقائياً خلال ${countdown} ثوانٍ...`
                    : `Redirecting you automatically in ${countdown} seconds...`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (paymentTypeState === "order" || paymentTypeState === "store") {
                    navigate("/products", { replace: true });
                  } else {
                    navigate("/u", { replace: true });
                  }
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{isArabic ? "الانتقال إلى لوحة التحكم الآن" : "Go to Dashboard Now"}</span>
                <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Fail ──────────────────────────────────────────────────────────────────────
  if (isFail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <GlobalLogo />
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-10 max-w-md w-full text-center"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-rose-500" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            {isArabic ? "فشل الدفع" : "Payment Failed"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            {isArabic
              ? "لم يتم إتمام الدفع. يرجى المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة."
              : "Payment was not completed. Please try again or choose a different payment method."}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
            >
              {isArabic ? "حاول مرة أخرى" : "Try Again"}
            </button>
            <Link
              to="/u"
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              {isArabic ? "لوحة التحكم (البروفايل)" : "Dashboard (Profile)"}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Pending ───────────────────────────────────────────────────────────────────
  const isCardTx =
    transactionData &&
    (transactionData.paymentMethodId === 2 ||
      /visa|mastercard|card|فيزا|ماستر|بطاقة/i.test(
        transactionData.paymentMethodName || "",
      ));

  if (isPending && isCardTx) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <GlobalLogo />
        </header>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-10 max-w-md w-full text-center"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-rose-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
            {isArabic ? "لم يكتمل الدفع بالبطاقة" : "Card Payment Incomplete"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            {isArabic
              ? "لم يتم إتمام عملية الدفع بالبطاقة البنكية أو تم إلغاؤها. الدفع بالبطاقات البنكية إما أن يكتمل بنجاح أو ينتهي فوراً ولا يدعم وضع الانتظار."
              : "Bank card payment was not completed or was cancelled. Card payments must succeed or terminate immediately and do not remain pending."}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-sm"
            >
              {isArabic ? "إعادة المحاولة" : "Try Again"}
            </button>
            <Link
              to="/u"
              className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              {isArabic ? "لوحة التحكم" : "Dashboard"}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <GlobalLogo />
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-10 max-w-md w-full text-center"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
          {isArabic ? "الدفع قيد المعالجة" : "Payment Pending"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {isArabic
            ? "طلبك تحت المعالجة (فوري / محفظة إلكترونية). سيتم تفعيله تلقائياً عند اكتمال الدفع."
            : "Your payment is being processed (Fawry / Mobile Wallet). It will activate automatically once confirmed."}
        </p>

        {transactionData && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-8 text-start border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
              {isArabic ? "تفاصيل الدفع" : "Payment Details"}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {isArabic ? "رقم الفاتورة:" : "Transaction ID:"}
                </span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded select-all">
                  {transactionData.intentKey}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {isArabic ? "تاريخ الإصدار:" : "Date:"}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {new Date(transactionData.createdAt).toLocaleDateString(
                    isArabic ? "ar-EG" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {isArabic ? "المبلغ:" : "Amount:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {transactionData.amount} EGP
                </span>
              </div>
              {transactionData.paymentMethodName && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isArabic ? "طريقة الدفع:" : "Method:"}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {transactionData.paymentMethodName}
                  </span>
                </div>
              )}
              {transactionData.paymentData?.fawryCode && (
                <>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {isArabic ? "كود فوري المرجعي:" : "Fawry Reference Code:"}
                    </span>
                    <span className="font-black text-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg select-all">
                      {transactionData.paymentData.fawryCode}
                    </span>
                  </div>
                  {transactionData.paymentData.expireDate && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {isArabic ? "صلاحية الكود حتى:" : "Code expires on:"}
                      </span>
                      <span className="font-bold text-xs text-rose-500 dark:text-rose-400">
                        {new Date(
                          transactionData.paymentData.expireDate,
                        ).toLocaleString(isArabic ? "ar-EG" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    {isArabic
                      ? "يرجى التوجه لأقرب منفذ فوري أو استخدام تطبيق فوري أو المحافظ الإلكترونية لدفع الكود المرجعي أعلاه لإتمام طلبك."
                      : "Please go to the nearest Fawry outlet, use the Fawry app, or mobile wallets to pay the reference code above to complete your order."}
                  </p>
                </>
              )}
              {transactionData.checkoutUrl && (
                <div className="mt-4">
                  <a
                    href={transactionData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
                  >
                    {isArabic ? "الذهاب لصفحة الدفع" : "Go to Payment Page"}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/u"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors"
          >
            {isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
