import { PencilLine, Trash2 } from "lucide-react";

export default function ServiceCard({ service, canEdit = false, onEdit, onDelete }) {
  const title = service?.service_name || service?.name || "Service";
  const description = service?.service_description || service?.description || "No description provided.";
  const fee = service?.base_fee ?? service?.fee ?? 0;
  const docs = service?.required_docs || service?.docs || [];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-xl bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
            ETB {fee}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">Required documents</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.isArray(docs) && docs.length > 0 ? (
            docs.map((d) => (
              <span
                key={d}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              >
                {d}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Not specified</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title="Edit service"
            aria-label="Edit service"
          >
            <PencilLine size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            title="Delete service"
            aria-label="Delete service"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

