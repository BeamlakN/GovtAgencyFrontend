import { CheckCircle, Edit2, XCircle, Image as ImageIcon } from "lucide-react";

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDeactivate,
  onReactivate,
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {announcement.image_url && (
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-full bg-slate-100">
                  <div class="text-center">
                    <ImageIcon class="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p class="text-xs text-slate-500">Image failed to load</p>
                  </div>
                </div>
              `;
            }}
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 truncate">{announcement.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{announcement.content}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${announcement.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
            {announcement.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">Target: {announcement.target_role || "citizen"}</span>
          <span>{new Date(announcement.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>

          {announcement.is_active ? (
            <button
              type="button"
              onClick={onDeactivate}
              className="inline-flex items-center gap-1 rounded-2xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <XCircle size={14} /> Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              className="inline-flex items-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle size={14} /> Reactivate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}