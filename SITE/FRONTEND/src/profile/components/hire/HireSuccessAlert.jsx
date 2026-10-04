import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export default function HireSuccessAlert({ title, message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-start gap-3"
    >
      <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs opacity-90 mt-0.5">{message}</p>
      </div>
    </motion.div>
  );
}
