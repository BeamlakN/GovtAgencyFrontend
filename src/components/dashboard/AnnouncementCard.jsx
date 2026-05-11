import { Edit2, Trash2, Image as ImageIcon } from "lucide-react";

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
}) {
  return (
    <div className="group rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {announcement.image_url && (
        <div className="relative h-24 sm:h-28 md:h-32 overflow-hidden bg-slate-100">
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-full bg-slate-100">
                  <div class="text-center px-2">
                    <ImageIcon class="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mx-auto mb-1" />
                    <p class="text-[9px] sm:text-[10px] text-slate-500">Failed to load</p>
                  </div>
                </div>
              `;
            }}
          />
        </div>
      )}
      
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{announcement.title}</h3>
            <p className="mt-1 text-[11px] sm:text-xs leading-4 sm:leading-5 text-slate-600 line-clamp-2">{announcement.content}</p>
          </div>
          <span className={`shrink-0 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${announcement.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
            {announcement.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px]">Target: {announcement.target_role || "citizen"}</span>
          <span className="text-[9px] sm:text-[10px]">{new Date(announcement.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" })}</span>
        </div>

        <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={10} className="sm:w-[11px] sm:h-[11px]" /> 
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl bg-red-600 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 size={10} className="sm:w-[11px] sm:h-[11px]" /> 
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}