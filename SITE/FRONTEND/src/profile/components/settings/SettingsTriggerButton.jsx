import { Settings } from "lucide-react";
import { motion } from "motion/react";

export default function SettingsTriggerButton({ onOpen }) {
  return (
    <motion.button
      id="settings-trigger-btn"
      whileHover={{ scale: 1.05, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onOpen}
      className="fixed top-4 end-4 rtl:right-auto rtl:left-4 z-40 hidden lg:flex items-center justify-center p-3 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md hover:shadow-lg transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
      aria-label="Settings"
    >
      <Settings className="w-5 h-5 animate-spin-slow" />
    </motion.button>
  );
}
