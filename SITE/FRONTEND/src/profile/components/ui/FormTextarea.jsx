import ErrorNotice from "../../../components/ErrorNotice.jsx";

const baseTextareaClasses =
  "w-full ps-11 pe-4 rtl:pl-4 rtl:pr-11 py-3 bg-white dark:bg-slate-950/40 border rounded-xl text-sm dark:text-slate-100 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 focus:border-slate-900 dark:focus:border-slate-700 resize-none";

export default function FormTextarea({
  label,
  icon: Icon,
  error,
  rows = 4,
  className = "",
  inputClassName = "",
  iconClassName = "",
  ...textareaProps
}) {
  const stateClasses = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
    : "border-slate-200 dark:border-slate-800/80";

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ps-1 pe-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute start-4 rtl:left-auto rtl:right-4 top-3.5 w-4.5 h-4.5 text-slate-400 ${iconClassName}`}
          />
        )}
        <textarea
          rows={rows}
          className={`${baseTextareaClasses} ${stateClasses} ${inputClassName}`}
          {...textareaProps}
        />
      </div>
      <ErrorNotice error={error} className="mt-0.5 px-2.5 py-2 text-xs" />
    </div>
  );
}
