import { PencilLine, Save, AlertCircle } from "lucide-react";
import { useState } from "react";
import { validateField, getValidationRules } from "@/utils/validation";

export default function StaffEditModal({
  editingId,
  editForm,
  setEditForm,
  fieldErrors,
  loading,
  onClose,
  onSubmit,
}) {
  const [localErrors, setLocalErrors] = useState({});
  const rules = getValidationRules("staffEdit");

  const handleFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, rules);
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.name = validateField("name", editForm.name, rules);
    
    setLocalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAllFields()) {
      onSubmit(e);
    }
  };

  if (!editingId) return null;

  const getFieldError = (field) => localErrors[field] || fieldErrors?.[field];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4" onClick={onClose}>
      <div className="mx-auto mt-24 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <PencilLine size={18} className="text-slate-600" />
              Edit Staff Account
            </h2>
            <p className="text-sm text-slate-500 mt-1">Update staff name and role</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={editForm.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., John Doe"
                className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 transition-colors ${
                  getFieldError("name") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("name") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("name")}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">3-100 characters, letters and spaces only</p>
            </div>
            
            {/* Email Address (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">Email address cannot be changed</p>
            </div>
            
            {/* Role Selection - Only Admin role available */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.role || "admin"}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="admin">Admin</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Admins can manage applications and view agency data
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}