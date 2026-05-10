import { PencilLine, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { validateField, getValidationRules } from "@/utils/validation";

export default function ServiceEditModal({
  isOpen,
  form,
  setForm,
  fieldErrors,
  loading,
  onClose,
  onSubmit,
}) {
  const [localErrors, setLocalErrors] = useState({});
  const rules = getValidationRules("service");

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, rules);
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.name = validateField("name", form.name, rules);
    errors.fee = validateField("fee", form.fee, rules);
    errors.description = validateField("description", form.description, rules);
    
    setLocalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAllFields()) {
      onSubmit(e);
    }
  };

  if (!isOpen) return null;

  const getFieldError = (field) => localErrors[field] || fieldErrors?.[field];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[2px] px-2 sm:px-3 overflow-y-auto">
      <div className="mx-auto mt-16 sm:mt-20 md:mt-24 mb-8 w-full max-w-[95%] sm:max-w-lg md:max-w-xl rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <PencilLine size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600 dark:text-slate-400" />
              Edit Service
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Update name, fee, description, and required documents</p>
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
            {/* Service Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., License Renewal"
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
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">3-150 characters</p>
            </div>

            {/* Base Fee */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Base Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fee || ""}
                onChange={(e) => handleFieldChange("fee", e.target.value)}
                placeholder="e.g., 500.00"
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm bg-white dark:bg-slate-950 dark:text-slate-100 outline-none focus:ring-2 transition-colors ${
                  getFieldError("fee") 
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 dark:border-slate-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("fee") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("fee")}
                </p>
              )}
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">Enter a positive amount (e.g., 500 or 500.50)</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={3}
                placeholder="Describe the service in detail..."
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm bg-white dark:bg-slate-950 dark:text-slate-100 outline-none focus:ring-2 transition-colors resize-none ${
                  getFieldError("description") 
                    ? "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 dark:border-slate-600 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("description") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("description")}
                </p>
              )}
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">20-1000 characters describing the service</p>
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Required Documents
              </label>
              <input
                value={form.docs || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, docs: e.target.value }))}
                placeholder="e.g., photo, medical_report, id_scan"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 dark:text-slate-100 px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors"
              />
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
                Comma-separated list of required documents (optional)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 sm:mt-6 flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <ShieldCheck size={14} className="sm:w-[16px] sm:h-[16px]" />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}