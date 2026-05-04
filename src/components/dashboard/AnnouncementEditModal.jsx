import { PencilLine, CheckCircle } from "lucide-react";

const TARGET_ROLES = [
  { value: "citizen", label: "Citizen" },
  { value: "admin", label: "Admin" },
  { value: "all", label: "All users" },
];

export default function AnnouncementEditModal({
  isOpen,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4">
      <div className="mx-auto mt-24 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <PencilLine size={18} className="text-slate-600" />
              Edit Announcement
            </h2>
            <p className="text-sm text-slate-500">Update the announcement details and save changes.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
                placeholder="Announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Target Role</label>
              <select
                value={form.target_role}
                onChange={(e) => setForm((prev) => ({ ...prev, target_role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
                required
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-500 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-white min-h-24"
              placeholder="Write the announcement content here"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs text-slate-500 mb-1">Image URL</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
              placeholder="Optional image URL"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              <CheckCircle size={16} />
              {loading ? "Updating..." : "Update Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}