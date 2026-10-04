import { Check } from "lucide-react";

export default function SettingsSegmentButton({
  active,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-700/50"
          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {active && <Check className="w-3.5 h-3.5 text-emerald-500" />}
    </button>
  );
}
