import { useState } from "react";
import { motion } from "motion/react";

export default function ProfileAvatar({ avatar, name }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.trim() ? Array.from(name.trim())[0].toUpperCase() : "U";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
      className="relative z-10 mt-20 sm:mt-24 lg:mt-28 mb-4"
    >
      {avatar && !imgError ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-32 h-32 lg:w-36 lg:h-36 rounded-full object-cover border-[6px] border-white dark:border-slate-900 shadow-lg shadow-slate-200/80 dark:shadow-slate-950/50"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full border-[6px] border-white dark:border-slate-900 shadow-lg shadow-slate-200/80 dark:shadow-slate-950/50 bg-indigo-600 flex items-center justify-center text-white text-5xl lg:text-6xl font-black select-none">
          {initial}
        </div>
      )}
    </motion.div>
  );
}
