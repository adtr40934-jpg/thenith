import { CalendarDays, Clock, Phone, Trash2 } from "lucide-react";

export default function BookedAppointmentCard({
  appointment,
  language,
  onDelete,
  deleteTitle,
}) {
  const dateObj = new Date(appointment.startTime);

  const formattedDate = dateObj.toLocaleDateString(
    language === "ar" ? "ar-EG-u-nu-latn" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const formattedTime = dateObj.toLocaleTimeString(
    language === "ar" ? "ar-EG-u-nu-latn" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-start justify-between gap-3 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate"
            dir="auto"
          >
            {appointment.name}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          <span
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md"
            
          >
            <CalendarDays className="w-3.5 h-3.5 opacity-80" />
            {formattedDate}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md"
            
          >
            <Clock className="w-3.5 h-3.5 opacity-80" />
            {formattedTime}
          </span>
        </div>

        {appointment.phone && (
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1"
            
          >
            <Phone className="w-3 h-3 text-slate-400" />
            {appointment.phone}
          </div>
        )}

        {appointment.message && (
          <p
            className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800"
            dir="auto"
          >
            {appointment.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(appointment.id)}
        className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500 bg-rose-50 dark:bg-rose-500/10 dark:hover:bg-rose-600 transition-all cursor-pointer shrink-0"
        title={deleteTitle}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
