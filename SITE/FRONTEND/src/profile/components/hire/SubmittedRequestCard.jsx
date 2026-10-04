import { Mail, Phone, Trash2 } from "lucide-react";

export default function SubmittedRequestCard({ request, onDelete, deleteTitle }) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-start justify-between gap-3 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate"
            dir="auto"
          >
            {request.fullName}
          </span>
          <span
            className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono"
            dir="auto"
          >
            {request.timestamp}
          </span>
        </div>

        {(request.phone || request.email) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {request.phone && (
              <span
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold"
                
              >
                <Phone className="w-3 h-3" />
                {request.phone}
              </span>
            )}
            {request.email && (
              <span
                className="flex items-center gap-1 text-slate-600 dark:text-slate-300"
                
              >
                <Mail className="w-3 h-3 text-slate-400" />
                {request.email}
              </span>
            )}
          </div>
        )}

        <p
          className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed"
          dir="auto"
        >
          {request.message}
        </p>
      </div>

      <button
        onClick={() => onDelete(request.id)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-60 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
        title={deleteTitle}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
