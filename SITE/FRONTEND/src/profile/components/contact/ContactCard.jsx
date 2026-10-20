import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../../lib/LanguageContext.jsx";
import { usePortfolio } from "../../lib/PortfolioContext.jsx";
import { trackClick } from "../../services/portfolioService.js";

export default function ContactCard({
  icon,
  label,
  value,
  href,
  copyable = false,
  isLtr = false,
  index = 0,
}) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const { profile } = usePortfolio();

  const handleLinkClick = () => {
    if (profile?.id && href) {
      trackClick(profile.id, href).catch(() => {});
    }
  };

  const handleCopy = (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
          {icon}
        </div>

        <div className="flex flex-col text-start rtl:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {label}
          </span>
          <span
            className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-all"
            dir={isLtr ? "ltr" : "auto"}
          >
            {value}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            title={t.copy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
        {href && (
          <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5" />
        )}
      </div>
    </div>
  );

  const containerClasses =
    "w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/30 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white/95 dark:hover:bg-slate-900/60 transition-all duration-300 group flex items-center";

  const motionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.05, duration: 0.25, ease: "easeOut" },
    whileHover: { y: -2 },
  };

  if (href) {
    return (
      <motion.a
        {...motionProps}
        whileTap={{ scale: 0.99 }}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        onClick={handleLinkClick}
        data-track-click="true"
        data-track-type="contact"
        data-track-section="contact"
        data-track-label={label}
        data-track-url={href}
        className={containerClasses}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div {...motionProps} className={containerClasses}>
      {content}
    </motion.div>
  );
}
