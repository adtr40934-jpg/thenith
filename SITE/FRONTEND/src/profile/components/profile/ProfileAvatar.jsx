import { motion } from "motion/react";

export default function ProfileAvatar({ avatar, name }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
      className="relative z-10 mt-20 sm:mt-24 lg:mt-28 mb-4"
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-32 h-32 lg:w-36 lg:h-36 rounded-full object-cover border-[6px] border-white dark:border-slate-900 shadow-lg shadow-slate-200/80 dark:shadow-slate-950/50"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full border-[6px] border-white dark:border-slate-900 shadow-lg shadow-slate-200/80 dark:shadow-slate-950/50 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
      )}
    </motion.div>
  );
}
