export default function ContentCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl rounded-none sm:rounded-3xl border-0 sm:border border-slate-100 dark:border-slate-800/60 shadow-none sm:shadow-xl dark:shadow-slate-950/20 transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
