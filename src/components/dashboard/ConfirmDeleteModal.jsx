import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Delete",
  description = "Are you sure you want to continue?",
  confirmText = "Remove",
  loading,
  onCancel,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4">
      <div className="mx-auto mt-28 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            {title}
          </h2>
          <p className="text-sm text-slate-600 mt-2">{description}</p>
        </div>

        <div className="p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-70"
          >
            {loading ? `${confirmText}...` : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
