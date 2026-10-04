import { Clock } from "lucide-react";
import SubmittedRequestCard from "./SubmittedRequestCard.jsx";

export default function HireRequestsList({
  requests,
  language,
  labels,
  onDeleteRequest,
}) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {labels.submittedRequests} (
          {requests.length.toLocaleString(language === "ar" ? "ar-EG-u-nu-latn" : "en-US")})
        </h3>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3" />
          {labels.liveFeed}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {requests.map((request) => (
          <SubmittedRequestCard
            key={request.id}
            request={request}
            onDelete={onDeleteRequest}
            deleteTitle={labels.deleteRequest}
          />
        ))}
      </div>
    </div>
  );
}
