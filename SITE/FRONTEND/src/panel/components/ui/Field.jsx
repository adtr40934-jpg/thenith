export default function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, disabled = false, maxLength = 250, invalid = false }) {
  const inputClass = `w-full rounded-xl border bg-white dark:bg-slate-950/40 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-hidden ${invalid ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'}`;

  const handleChange = (e) => {
    // Strip HTML tags for basic sanitization
    const sanitized = e.target.value.replace(/<[^>]*>?/gm, '');
    onChange?.(sanitized);
  };

  return (
    <label className="flex flex-col gap-1.5 text-end ltr:text-left">
      <span className="text-[11px] font-bold text-slate-400">{label}</span>
      {textarea ? (
        <textarea disabled={disabled} maxLength={maxLength} rows={4} value={value || ''} onChange={handleChange} placeholder={placeholder} className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
      ) : (
        <input disabled={disabled} maxLength={maxLength} type={type} value={value || ''} onChange={handleChange} placeholder={placeholder} className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
      )}
    </label>
  );
}
