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
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., License Renewal"
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
              <p className="mt-1 text-xs text-slate-400">3-150 characters</p>
            </div>

            {/* Base Fee */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fee || ""}
                onChange={(e) => handleFieldChange("fee", e.target.value)}
                placeholder="e.g., 500.00"
                className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 transition-colors ${
                  getFieldError("fee") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("fee") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("fee")}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">Enter a positive amount (e.g., 500 or 500.50)</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={4}
                placeholder="Describe the service in detail..."
                className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 transition-colors resize-none ${
                  getFieldError("description") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                required
              />
              {getFieldError("description") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("description")}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">20-1000 characters describing the service</p>
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Required Documents
              </label>
              <input
                value={form.docs || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, docs: e.target.value }))}
                placeholder="e.g., photo, medical_report, id_scan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-400">
                Comma-separated list of required documents (optional)
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors"
            >
              <ShieldCheck size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}