import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  QrCode,
  Radio,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  Camera,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  SmartphoneNfc,
  Layers,
  Unlink,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import cardRoutes from "../../../api/routes/cards.js";
import { useGlobalLanguage } from "../../../context/GlobalLanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function PhysicalSmartCardsSection({ profiles = [], activeCardId }) {
  const { language } = useGlobalLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [reassigningCardId, setReassigningCardId] = useState(null);
  const [selectedNewProfileId, setSelectedNewProfileId] = useState("");
  const [savingReassign, setSavingReassign] = useState(false);
  const [unlinkingCardId, setUnlinkingCardId] = useState(null);

  // Load user's physical cards
  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await cardRoutes.listMyClaimedPhysicalCards();
      if (res?.success) {
        setCards(res.cards || []);
      }
    } catch (err) {
      // Ignore load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleUnlink = async (cardId) => {
    if (
      !window.confirm(
        isAr
          ? "هل أنت متأكد من رغبتك في إلغاء ربط هذا الكارت بحسابك؟"
          : "Are you sure you want to unlink this card from your account?"
      )
    ) {
      return;
    }
    try {
      setUnlinkingCardId(cardId);
      const res = await cardRoutes.unlinkPhysicalCard(cardId);
      if (res?.success) {
        toast.success(isAr ? "تم إلغاء ربط الكارت بنجاح!" : "Card unlinked successfully!");
        loadCards();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err.message ||
          (isAr ? "فشل إلغاء ربط الكارت" : "Failed to unlink card")
      );
    } finally {
      setUnlinkingCardId(null);
    }
  };

  const handleReassign = async (cardId) => {
    if (!selectedNewProfileId) return;
    try {
      setSavingReassign(true);
      const res = await cardRoutes.reassignPhysicalCardProfile(cardId, selectedNewProfileId);
      if (res?.success) {
        toast.success(isAr ? "تم تحديث البروفايل المرتبط بنجاح!" : "Linked profile updated!");
        setReassigningCardId(null);
        setSelectedNewProfileId("");
        loadCards();
      }
    } catch (err) {
      toast.error(err.message || (isAr ? "فشل تحديث البروفايل" : "Failed to update profile"));
    } finally {
      setSavingReassign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── ACTION HEADER (Clean & Minimal) ─────────────────────────────────── */}
      {cards.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isAr ? `الكروت المرتبطة (${cards.length})` : `Linked Cards (${cards.length})`}
          </p>
          <button
            type="button"
            onClick={() => setShowClaimModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "ربط وتفعيل كارت جديد" : "Link & Activate New Card"}</span>
          </button>
        </div>
      )}

      {/* ── CARDS LIST / EMPTY STATE ────────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">
            {isAr ? "جاري تحميل كروتك الذكية..." : "Loading your smart cards..."}
          </p>
        </div>
      ) : cards.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isAr ? "لم تقم بربط أي كارت ذكي بعد" : "No smart cards linked yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? "إذا استلمت كارت Thenith المادي، يمكنك تفعيله وربطه بحسابك الآن عبر تقريب الشريحة (NFC) أو مسح رمز QR أو كتابة الكود."
                : "If you received your physical Thenith card, you can activate and link it to your account via NFC tap, QR scan, or code."}
            </p>
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "ربط أول كارت ذكي الآن" : "Link Your First Card Now"}</span>
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const isEditing = reassigningCardId === card._id;
            const linkedProfile = card.profileId;

            return (
              <div
                key={card._id}
                className="group relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between transition-all hover:border-indigo-500/50 hover:shadow-indigo-500/5"
              >
                {/* Decorative Chip & Hologram */}
                <div className="flex items-center justify-between mb-6">
                  {/* EMV Smart Chip Visual */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-yellow-600/40 p-1 flex flex-col justify-between shadow-sm">
                      <div className="h-0.5 bg-yellow-700/40 rounded-full" />
                      <div className="h-0.5 bg-yellow-700/40 rounded-full" />
                      <div className="h-0.5 bg-yellow-700/40 rounded-full" />
                    </div>
                    <Radio className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isAr ? "نشط ومربوط" : "Active & Linked"}
                    </span>

                    <button
                      type="button"
                      disabled={unlinkingCardId === card._id}
                      onClick={() => handleUnlink(card._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                      title={isAr ? "إلغاء ربط الكارت" : "Unlink Card"}
                    >
                      {unlinkingCardId === card._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlink className="w-3 h-3" />
                      )}
                      <span>{isAr ? "إلغاء الربط" : "Unlink"}</span>
                    </button>
                  </div>
                </div>

                {/* Card ID & Public ID */}
                <div className="space-y-1 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">
                      {isAr ? "المعرّف الداخلي للكارت:" : "Internal Card ID:"}
                    </span>
                    {card.publicId && (
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        ID: {card.publicId}
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-mono font-black tracking-widest text-white drop-shadow-xs flex items-center gap-2">
                    <span>{card.cardId}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-sans">
                    <span>{card.cardType || "Standard"}</span>
                    <span>•</span>
                    <span className="capitalize">{card.color || "Black"}</span>
                    {card.claimedAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(card.claimedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Direct Profile Info */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">
                      {isAr ? "رابط البروفايل المباشر:" : "Direct Profile Link:"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono font-bold">
                      publicId
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-3 min-w-0">
                      {user?.avatar || linkedProfile?.personal?.avatar ? (
                        <img
                          src={user?.avatar || linkedProfile?.personal?.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {user?.name?.[0] || linkedProfile?.name?.[0] || "P"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.name || linkedProfile?.name || "My Profile"}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-indigo-400 truncate" dir="ltr">
                          {card.targetUrl || `/p/${user?.publicId}`}
                        </p>
                      </div>
                    </div>

                    <a
                      href={card.targetUrl || `/p/${user?.publicId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                      title={isAr ? "معاينة رابط البروفايل" : "Preview profile"}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: LINK & ACTIVATE SMART CARD ─────────────────────────────────── */}
      {showClaimModal && (
        <ClaimCardModal
          profiles={profiles}
          activeCardId={activeCardId}
          onClose={() => setShowClaimModal(false)}
          onSuccess={() => {
            loadCards();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: CLAIM & ACTIVATE SMART CARD (NFC / QR / MANUAL)
// ─────────────────────────────────────────────────────────────────────────────
function ClaimCardModal({ profiles, activeCardId, onClose, onSuccess }) {
  const { language } = useGlobalLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const [activeTab, setActiveTab] = useState(() => {
    return typeof window !== "undefined" && "NDEFReader" in window ? "nfc" : "qr";
  });
  const [selectedProfileId, setSelectedProfileId] = useState(activeCardId || (profiles[0]?.id || profiles[0]?._id || ""));
  const [publicIdInput, setPublicIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successCard, setSuccessCard] = useState(null);

  // NFC scanning state
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const nfcAbortRef = useRef(null);

  // QR scanning state
  const [qrScanning, setQrScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Check Web NFC support
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setNfcSupported(true);
    }
  }, []);

  const stopNfcScan = () => {
    if (nfcAbortRef.current) {
      try {
        nfcAbortRef.current.abort();
      } catch (e) {}
      nfcAbortRef.current = null;
    }
    setNfcScanning(false);
  };

  // Cleanup NFC & QR on unmount
  useEffect(() => {
    return () => {
      stopNfcScan();
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Submit claim
  const handleClaim = async (rawCode) => {
    const code = (rawCode || publicIdInput).trim();
    if (!code) {
      setErrorMsg(isAr ? "يرجى مسح أو إدخال كود الكارت" : "Please scan or enter card code");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await cardRoutes.claimPhysicalCard(code, selectedProfileId || null);

      if (res?.success) {
        setSuccessCard(res.card);
        setPublicIdInput("");
        toast.success(isAr ? "تم ربط الكارت بنجاح!" : "Card linked successfully!");
        onSuccess?.();
      } else {
        setErrorMsg(res?.message || (isAr ? "فشل ربط الكارت" : "Failed to link card"));
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        (isAr ? "حدث خطأ أثناء ربط الكارت" : "An error occurred while linking card");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 1. NFC Handler - Automatically requests permission and begins scanning
  const startNfcScan = async () => {
    setErrorMsg("");

    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      setNfcScanning(false);
      setErrorMsg(
        isAr
          ? "متصفحك الحالي لا يدعم قراءة NFC مباشرة (Web NFC). هذه الميزة مدعومة رسمياً على متصفح Google Chrome لهواتف أندرويد مع تفعيل الـ NFC. إذا كنت تستخدم كمبيوتر أو آيفون، يرجى استخدام كاميرا QR أو إدخال الكود يدوياً."
          : "Web NFC is not supported in this browser. Please use Google Chrome on an Android phone with NFC enabled, or switch to QR / Manual code."
      );
      return;
    }

    try {
      stopNfcScan();
      const controller = new AbortController();
      nfcAbortRef.current = controller;

      setNfcScanning(true);

      const ndef = new window.NDEFReader();
      // Calling ndef.scan() prompts the browser for permission!
      await ndef.scan({ signal: controller.signal });

      ndef.onreading = (event) => {
        let scannedUrl = "";
        if (event.message?.records) {
          for (const record of event.message.records) {
            if (record.recordType === "url") {
              const textDecoder = new TextDecoder(record.encoding || "utf-8");
              scannedUrl = textDecoder.decode(record.data);
              break;
            }
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding || "utf-8");
              scannedUrl = textDecoder.decode(record.data);
              break;
            }
          }
        }

        if (scannedUrl) {
          stopNfcScan();
          handleClaim(scannedUrl);
        } else if (event.serialNumber) {
          stopNfcScan();
          handleClaim(event.serialNumber);
        }
      };

      ndef.onreadingerror = () => {
        setErrorMsg(isAr ? "تعذرت قراءة الشريحة، يرجى تقريب الكارت من الهاتف مجدداً" : "Failed to read NFC tag. Please tap again.");
      };
    } catch (err) {
      if (err.name === "AbortError") return;
      setNfcScanning(false);

      if (err.name === "NotAllowedError") {
        setErrorMsg(
          isAr
            ? "طلب المتصفح إذن الوصول إلى NFC ولكن تم الرفض. يرجى تفعيل إذن NFC في إعدادات الموقع أعلى المتصفح."
            : "NFC permission was denied by the browser. Please allow NFC access in site permissions."
        );
      } else if (err.name === "NotSupportedError") {
        setErrorMsg(
          isAr
            ? "خاصية NFC غير مفعّلة على هاتفك أو غير مدعومة. يرجى التأكد من تشغيل NFC في إعدادات الهاتف."
            : "NFC is turned off or not supported on this device. Please turn on NFC in phone settings."
        );
      } else {
        setErrorMsg(err.message || (isAr ? "تعذر تشغيل قارئ NFC" : "Could not start NFC reader"));
      }
    }
  };

  // 2. Camera QR Handler
  const startQrScanner = async () => {
    try {
      setErrorMsg("");
      setQrScanning(true);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader-qr-container");
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          // Success detected!
          html5QrCodeRef.current.stop().then(() => {
            setQrScanning(false);
            handleClaim(decodedText);
          }).catch(() => {
            setQrScanning(false);
            handleClaim(decodedText);
          });
        },
        (error) => {
          // Silent scan frame miss
        }
      );
    } catch (err) {
      setQrScanning(false);
      setErrorMsg(isAr ? "تعذر فتح الكاميرا للمسح. تأكد من منح الإذن للمتصفح." : "Could not access camera. Please allow camera permissions.");
    }
  };

  const stopQrScanner = () => {
    if (html5QrCodeRef.current && qrScanning) {
      html5QrCodeRef.current.stop().catch(() => {});
      setQrScanning(false);
    }
  };

  // 3. File Image QR Handler
  const handleQrFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg("");
      const html5QrCode = new Html5Qrcode("reader-qr-container-file");
      const decoded = await html5QrCode.scanFile(file, true);
      handleClaim(decoded);
    } catch (err) {
      setErrorMsg(isAr ? "لم نتمكن من العثور على رمز QR في الصورة" : "Could not find a valid QR code in this image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <SmartphoneNfc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? "تفعيل وربط كارت Thenith ذكي" : "Activate Thenith Smart Card"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? "اختر طريقة القراءة المناسبة لجهازك" : "Select reading method for your device"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopNfcScan();
              stopQrScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SUCCESS STATE VIEW ────────────────────────────────────────────── */}
        {successCard ? (
          <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? "تم ربط الكارت الذكي بنجاح! 🎉" : "Smart Card Linked Successfully! 🎉"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? "الكارت الآن نشط وجاهز لمشاركة بروفايلك بنقرة واحدة عند تقريبه من أي هاتف."
                  : "The card is now active and ready to share your profile with a tap."}
              </p>
            </div>

            {/* Confirmed Internal Card ID & Direct Profile Link */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto space-y-2.5 text-start">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                  {isAr ? "المعرّف الداخلي:" : "Internal Card ID:"}
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {successCard.cardId}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-[10px] text-slate-400 font-sans">
                  {isAr ? "رابط البروفايل المباشر:" : "Profile Link:"}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs" dir="ltr">
                  /p/{user?.publicId}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                stopNfcScan();
                stopQrScanner();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {isAr ? "تم، العودة لكروتي" : "Done, View My Cards"}
            </button>
          </div>
        ) : (
          /* ── MAIN CLAIM TABS ─────────────────────────────────────────────── */
          <div className="space-y-5">
            {/* Direct Profile Link Target */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                    {user?.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || "حسابك الشخصي"}</p>
                  <p className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate" dir="ltr">
                    /p/{user?.publicId}
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[10px] px-2.5 py-1 bg-indigo-600 text-white dark:bg-indigo-900/80 dark:text-indigo-200 rounded-lg font-bold shrink-0 shadow-xs">
                {isAr ? "رابط البروفايل المباشر (publicId)" : "Direct Profile Link"}
              </span>
            </div>

            {/* Methods Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  stopQrScanner();
                  setActiveTab("nfc");
                  startNfcScan();
                }}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "nfc"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <SmartphoneNfc className="w-4 h-4" />
                <span>NFC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopNfcScan();
                  setActiveTab("qr");
                  startQrScanner();
                }}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "qr"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopNfcScan();
                  stopQrScanner();
                  setActiveTab("manual");
                }}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "manual"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isAr ? "يدوي" : "Manual"}</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: NFC */}
            {activeTab === "nfc" && (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  {nfcScanning && (
                    <span className="animate-ping absolute inset-0 rounded-full bg-indigo-500/30" />
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                    nfcScanning
                      ? "bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-600/30"
                      : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    <SmartphoneNfc className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {nfcScanning
                      ? (isAr ? "المتصفح يستمع لـ NFC الآن... قرّب الكارت من ظهر الهاتف" : "NFC active! Hold card near the back of phone...")
                      : (isAr ? "المسح المباشر عبر تقنية NFC" : "Direct NFC Tap")}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {nfcSupported
                      ? (isAr
                          ? (nfcScanning
                              ? "تم تشغيل مستشعر NFC بنجاح! بمجرد ملامسة الكارت لظهر هاتفك سيتم التعرف عليه وربطه فوراً."
                              : "سيطلب المتصفح إذن الوصول إلى NFC بمجرد الضغط. قرّب الكارت بعد منح الإذن.")
                          : "سيطلب المتصفح الإذن للوصول إلى شريحة NFC لقراءة الكارت تلقائياً.")
                      : (isAr ? "قراءة NFC من المتصفح مدعومة على هواتف أندرويد عبر Google Chrome. إذا كنت تستخدم آيفون أو كمبيوتر، يمكنك مسح كود QR أو الإدخال اليدوي بسهولة." : "Web NFC is supported on Android with Chrome. On other devices, please use QR code or manual entry.")}
                  </p>
                </div>

                {nfcSupported ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={startNfcScan}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                    >
                      {nfcScanning && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {nfcScanning
                          ? (isAr ? "جاري انتظار ملامسة الكارت... (إعادة الطلب)" : "Waiting for card tap... (Retry)")
                          : (isAr ? "طلب إذن NFC والبدء بالقراءة" : "Request NFC Permission & Scan")}
                      </span>
                    </button>
                    {nfcScanning && (
                      <button
                        type="button"
                        onClick={stopNfcScan}
                        className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold underline cursor-pointer"
                      >
                        {isAr ? "إيقاف القراءة مؤقتاً" : "Pause scanning"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-start space-y-2">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        <SmartphoneNfc className="w-4 h-4" />
                        <span>{isAr ? "كيف تعمل كروت NFC على جميع الأجهزة؟" : "How NFC cards work across all devices?"}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                        <p>
                          <strong className="text-slate-900 dark:text-white">
                            {isAr ? "• على الآيفون (iPhone): " : "• iPhone users: "}
                          </strong>
                          {isAr
                            ? "لا تحتاج لأي متصفح! نظام iOS يقرأ الكارت تلقائياً بمجرد ملامسته لأعلى ظهر الهاتف وسيفتح معك إشعار التفعيل والمشاركة فوراً في Safari."
                            : "No browser required! iOS reads the card natively when held near the top of iPhone."}
                        </p>
                        <p>
                          <strong className="text-slate-900 dark:text-white">
                            {isAr ? "• على هواتف الأندرويد: " : "• Android users: "}
                          </strong>
                          {isAr
                            ? "تدعم القراءة التلقائية بلمس ظهر الهاتف مباشرة أو عبر متصفح Chrome."
                            : "Supported automatically via phone tap or Google Chrome."}
                        </p>
                        <p>
                          <strong className="text-slate-900 dark:text-white">
                            {isAr ? "• لجميع المتصفحات والكمبيوتر: " : "• All other devices: "}
                          </strong>
                          {isAr
                            ? "استخدم كاميرا الـ QR المطبوع على ظهر الكارت لمسحه وربطه في ثانية واحدة."
                            : "Use the instant QR camera scanner."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("qr");
                        startQrScanner();
                      }}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isAr ? "تشغيل كاميرا مسح رمز الـ QR الآن" : "Start QR Camera Scanner Now"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QR CODE */}
            {activeTab === "qr" && (
              <div className="space-y-4">
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                  <div id="reader-qr-container" className="w-full max-w-[280px]" />
                  <div id="reader-qr-container-file" className="hidden" />

                  {!qrScanning && (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        {isAr ? "افتح كاميرا الهاتف لمسح رمز QR المطبوع على الكارت" : "Open camera to scan QR code printed on card"}
                      </p>
                      <button
                        type="button"
                        onClick={startQrScanner}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isAr ? "تشغيل الكاميرا الآن" : "Start Camera"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Image Option */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? "أو اختر صورة رمز QR من جهازك:" : "Or upload QR image:"}
                  </span>
                  <label className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer hover:bg-slate-50 flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAr ? "اختيار صورة" : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: MANUAL ENTRY */}
            {activeTab === "manual" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? "كود الكارت أو المعرّف أو الرابط:" : "Card ID, Public ID or URL:"}
                  </label>
                  <input
                    type="text"
                    value={publicIdInput}
                    onChange={(e) => setPublicIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && publicIdInput.trim() && !loading) {
                        e.preventDefault();
                        handleClaim();
                      }
                    }}
                    placeholder={isAr ? "مثال: THN-C-HZ3GCS أو uh4whu أو https://thenith.com/c/uh4whu" : "e.g. THN-C-HZ3GCS, uh4whu, or card URL"}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    dir="ltr"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {isAr
                      ? "يمكنك كتابة كود الكارت (مثل THN-C-XXXXXX) المطبوع على الكارت، أو معرّف الرابط، أو لصق الرابط كاملاً."
                      : "Enter card ID (e.g. THN-C-XXXXXX), public code, or paste full card URL."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading || !publicIdInput.trim()}
                  onClick={() => handleClaim()}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isAr ? "تأكيد وربط الكارت" : "Confirm & Link Card"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
