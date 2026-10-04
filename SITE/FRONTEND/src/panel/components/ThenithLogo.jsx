import React from "react";
import { motion } from "motion/react";
import GlobalLogo from "../../components/GlobalLogo.jsx";

export default function ThenithLogo({
  size = "md",
  showBadge = true,
  badgeText = "Admin",
  className = "",
}) {
  const sizeClasses = {
    sm: {
      text: "text-base font-extrabold",
      badge: "text-[9px] px-1.5 py-0.2",
      gap: "gap-1.5",
    },
    md: {
      text: "text-lg md:text-xl font-black",
      badge: "text-[10px] px-2 py-0.5",
      gap: "gap-2",
    },
    lg: {
      text: "text-2xl font-black",
      badge: "text-xs px-2.5 py-1",
      gap: "gap-2.5",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center ${currentSize.gap} ${className}`}
    >
      <GlobalLogo
        className={`${currentSize.text} bg-clip-text bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-300 font-sans select-none`}
      />

      {showBadge && (
        <span
          className={`font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/80 shadow-2xs ${currentSize.badge}`}
        >
          {badgeText}
        </span>
      )}
    </motion.div>
  );
}
