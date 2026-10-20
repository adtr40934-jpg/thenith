export default function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, disabled = false, maxLength = 250, invalid = false }) {
  const inputClass = `w-full rounded-xl border bg-white dark:bg-slate-900/60 px-3.5 py-2.5 text-base sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-hidden shadow-2xs ${
    invalid
      ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20'
      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
  }`;

  const handleChange = (e) => {
    // Strip HTML tags for basic sanitization
    const sanitized = e.target.value.replace(/<[^>]*>?/gm, '');
    onChange?.(sanitized);
  };

  return (
    <label className="flex flex-col gap-1.5 text-end ltr:text-left">
      {label && (
        <span className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      {textarea ? (
        <textarea
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${inputClass} min-h-[90px] resize-y leading-relaxed ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}`}
        />
      ) : (
        <input
          disabled={disabled}
          maxLength={maxLength}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${inputClass} min-h-[44px] ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}`}
        />
      )}
    </label>
  );
}
