import { PencilLine, Trash2 } from "lucide-react";

export default function ServiceCard({ service, canEdit = false, onEdit, onDelete }) {
  const title = service?.service_name || service?.name || "Service";
  const description = service?.service_description || service?.description || "No description provided.";
  const fee = service?.base_fee ?? service?.fee ?? 0;
  const docs = service?.required_docs || service?.docs || [];

  return (
    <div className="group rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="shrink-0 rounded-lg sm:rounded-xl bg-slate-900 text-white px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold">
            ETB {fee}
          </span>
        </div>
      </div>

      <div className="mt-2 sm:mt-3">
        <p className="text-[10px] sm:text-xs font-medium text-slate-500">Required documents</p>
        <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2">
          {Array.isArray(docs) && docs.length > 0 ? (
            docs.map((d) => (
              <span
                key={d}
                className="rounded-full border border-slate-200 bg-slate-50 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-xs text-slate-700"
              >
                {d.length > 15 ? `${d.slice(0, 12)}...` : d}
              </span>
            ))
          ) : (
            <span className="text-[9px] sm:text-xs text-slate-500">Not specified</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl border border-slate-300 bg-white px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Edit service"
            aria-label="Edit service"
          >
            <PencilLine size={10} className="sm:w-[14px] sm:h-[14px]" /> 
            <span className="ml-1 sm:ml-1.5">Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-lg sm:rounded-2xl border border-red-200 bg-white px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
            title="Delete service"
            aria-label="Delete service"
          >
            <Trash2 size={10} className="sm:w-[14px] sm:h-[14px]" /> 
            <span className="ml-1 sm:ml-1.5">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}