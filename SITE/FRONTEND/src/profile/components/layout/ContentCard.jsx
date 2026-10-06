export default function ContentCard({ children, className = "" }) {
  return (
    <div
      className={`profile-card bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl rounded-[1.5rem] sm:rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-lg sm:shadow-xl dark:shadow-slate-950/20 transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
