export default function SectionHeader({ title, subtitle, className = "" }) {
  return (
    <div className={className}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white px-1 mb-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
