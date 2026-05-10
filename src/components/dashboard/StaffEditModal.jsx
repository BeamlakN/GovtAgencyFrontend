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
    <div className="fixed inset-0 z-50 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[2px] px-2 sm:px-3 overflow-y-auto" onClick={onClose}>
      <div className="mx-auto mt-16 sm:mt-20 md:mt-24 mb-8 w-full max-w-[95%] sm:max-w-md md:max-w-lg rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <PencilLine size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600 dark:text-slate-400" />
              Edit Staff Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update staff name and role</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors text-lg sm:text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={editForm.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., John Doe"
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm bg-white dark:bg-slate-950 dark:text-slate-100 outline-none focus:ring-2 transition-colors ${
                  getFieldError("name") 
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 dark:border-slate-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("name") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("name")}
                </p>
              )}
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">3-100 characters, letters and spaces only</p>
            </div>
            
            {/* Email Address (Read-only) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email || ""}
                disabled
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
              />
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">Email address cannot be changed</p>
            </div>
            
            {/* Role Selection - Only Admin role available */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={editForm.role || "admin"}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 dark:text-slate-100 px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors"
              >
                <option value="admin">Admin</option>
              </select>
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
                Admins can manage applications and view agency data
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-5 flex items-center gap-2 sm:gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={14} className="sm:w-[16px] sm:h-[16px]" />
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}