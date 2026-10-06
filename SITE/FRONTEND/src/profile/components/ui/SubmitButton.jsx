import { motion } from "motion/react";

export default function SubmitButton({
  children,
  isLoading = false,
  loadingLabel,
  className = "",
  ...buttonProps
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`profile-btn-submit mt-2 w-full py-3.5 px-6 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${className}`}
      {...buttonProps}
    >
      {isLoading ? <span>{loadingLabel}</span> : children}
    </motion.button>
  );
}
