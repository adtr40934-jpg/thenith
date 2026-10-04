import { Share2 } from "lucide-react";
import { motion } from "motion/react";

export default function ShareProfileButton({ onClick, title }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="absolute top-2 end-2 rtl:right-auto rtl:left-2 z-20 p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-800/80 shadow-xs cursor-pointer transition-all"
      title={title}
    >
      <Share2 className="w-4 h-4" />
    </motion.button>
  );
}
