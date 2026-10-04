import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Download, QrCode, Share2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";

export default function ShareModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { profile } = usePortfolio();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const currentUrl = profile.profileUrl || window.location.href;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement("input");
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: profile.name,
        text: profile.bio,
        url: currentUrl,
      });
    } catch (err) {
      if (err.name !== "AbortError") 
    }
  };

  const handleDownloadQr = () => {
    const svgElement = document.getElementById("profile-qr-code");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);

      const downloadLink = document.createElement("a");
      downloadLink.download = `${profile.name.replace(/\s+/g, "_")}_QR.png`;
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-[360px] sm:max-w-sm max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 z-10 text-slate-900 dark:text-slate-100 my-auto custom-scrollbar"
        >
          <button
            onClick={onClose}
            className="absolute top-3.5 end-3.5 rtl:right-auto rtl:left-3.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label={t.settingsClose}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mt-1 mb-4">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mb-2 border border-indigo-100 dark:border-indigo-900/50">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.shareProfile}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.shareProfileHint}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-inner mb-4">
            <div className="p-2.5 sm:p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center">
              <QRCodeSVG
                id="profile-qr-code"
                value={currentUrl}
                size={150}
                bgColor="#FFFFFF"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]"
              />
            </div>

            <span className="mt-2.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 sm:py-1 rounded-full border border-indigo-100/80 dark:border-indigo-900/50">
              {profile.name}
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {t.directProfileLink}
            </label>
            <div className="flex items-center gap-1.5 p-1 ps-2.5 rtl:pl-1 rtl:pr-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <input
                type="text"
                readOnly
                
                value={currentUrl}
                className="w-full bg-transparent text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none truncate font-mono text-start"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  copied
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-2xs"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.copiedShort}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.share}</span>
            </button>

            <button
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.saveQr}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
