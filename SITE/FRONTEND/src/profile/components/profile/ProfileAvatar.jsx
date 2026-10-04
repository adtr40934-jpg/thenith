import { motion } from "motion/react";

export default function ProfileAvatar({ avatar, name }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
      className="relative z-10 mt-20 sm:mt-24 lg:mt-28 mb-4"
    >
      <img
        src={avatar || undefined}
        alt={name}
        className="w-32 h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg shadow-slate-200/80 dark:shadow-slate-950/50"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
}
