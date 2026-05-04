//service create modal
import { PencilLine, ShieldCheck } from "lucide-react";

export default function ServiceEditModal({
  isOpen,
  form,
  setForm,
  fieldErrors,
  loading,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4">
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <PencilLine size={18} className="text-slate-600" />
              Edit Service
            </h2>
            <p className="text-sm text-slate-500">Update name, fee, description, and required documents.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Service Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                required
              />
              {fieldErrors?.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Base Fee</label>
              <input
                type="number"
                min="0"
                value={form.fee}
                onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                required
              />
              {fieldErrors?.fee && <p className="mt-1 text-xs text-red-600">{fieldErrors.fee}</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-24"
                required
              />
              {fieldErrors?.description && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Required Documents (comma separated)</label>
              <input
                value={form.docs}
                onChange={(e) => setForm((prev) => ({ ...prev, docs: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
              {fieldErrors?.docs && <p className="mt-1 text-xs text-red-600">{fieldErrors.docs}</p>}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-70"
            >
              <ShieldCheck size={16} />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

