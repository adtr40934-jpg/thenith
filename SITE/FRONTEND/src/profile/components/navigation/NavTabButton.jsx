import { motion } from "motion/react";

export default function NavTabButton({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  layoutId,
  variant = "desktop",
}) {
  if (variant === "mobile") {
    return (
      <button
        id={id}
        onClick={onClick}
        className="flex flex-col items-center flex-1 cursor-pointer py-1 relative"
      >
        <div className="relative flex flex-col items-center justify-center">
          <div className="px-6 py-1.5 rounded-2xl flex items-center justify-center relative overflow-hidden">
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="profile-nav-indicator absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-2xl -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className={`w-5 h-5 transition-transform duration-300 ${
                isActive
                  ? "text-slate-900 dark:text-white scale-110 profile-tab-active"
                  : "text-slate-500 dark:text-slate-400 profile-tab-inactive"
              }`}
            />
          </div>
          <span
            className={`text-[10px] font-bold tracking-tight mt-1 transition-colors ${
              isActive
                ? "text-slate-900 dark:text-white font-extrabold profile-tab-active"
                : "text-slate-400 dark:text-slate-500 font-medium profile-tab-inactive"
            }`}
          >
            {label}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors duration-300 cursor-pointer relative z-10 ${
        isActive
          ? "text-white dark:text-slate-900 font-bold profile-tab-active"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 profile-tab-inactive"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="profile-tab-indicator absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-xl -z-10 shadow-sm"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}
