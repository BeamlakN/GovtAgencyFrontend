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
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-2 sm:px-3 flex items-center justify-center">
      <div className="w-full max-w-[90%] sm:max-w-md rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] text-amber-600 flex-shrink-0" />
            <h2 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2">{description}</p>
        </div>

        <div className="p-3 sm:p-5 flex justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 text-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? `${confirmText}...` : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}