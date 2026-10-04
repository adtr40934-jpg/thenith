import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ label, className = "" }) {
  return (
    <div className={`relative group inline-flex items-center cursor-pointer ${className}`}>
      <BadgeCheck
        className="w-5 h-5 lg:w-6 lg:h-6 text-sky-500 dark:text-sky-400 fill-sky-500/15 dark:fill-sky-400/20 shrink-0 transition-transform group-hover:scale-110"
        title={label}
      />
      <div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1 px-2.5 py-1 bg-slate-900/95 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold rounded-lg shadow-xl backdrop-blur-md  z-30 pointer-events-none transition-all duration-200">
        <span>{label}</span>
        <div className="absolute top-full start-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-100" />
      </div>
    </div>
  );
}
