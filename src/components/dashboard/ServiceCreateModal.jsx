import { ShieldCheck, Wrench, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { validateField, getValidationRules } from "@/utils/validation";
import { SERVICE_TYPES } from "@/api/transportService";

const toTitle = (value) =>
  (value || "")
    .toString()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ServiceCreateModal({
  isOpen,
  form,
  setForm,
  fieldErrors,
  loading,
  onClose,
  onSubmit,
  existingServices = [],
}) {
  const [localErrors, setLocalErrors] = useState({});
  const rules = getValidationRules("service");

  // Custom validation for description - should not be only numbers
  const validateDescription = (value) => {
    if (!value || value.trim() === "") {
      return "Description is required";
    }
    if (value.trim().length < 20) {
      return "Description must be at least 20 characters";
    }
    if (value.trim().length > 1000) {
      return "Description must not exceed 1000 characters";
    }
    // Check if description is only numbers
    if (/^\d+$/.test(value.trim())) {
      return "Description cannot contain only numbers. Please add meaningful text.";
    }
    // Check if description is only special characters
    if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
      return "Description cannot contain only special characters. Please add meaningful text.";
    }
    return "";
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    let error = "";
    
    if (field === "name") {
      error = validateField(field, value, rules);
      // Check for duplicate service name against existing services from DB
      if (value && !error) {
        const isDuplicate = existingServices.some(
          service => (service.name || service.service_name || "").toLowerCase() === value.toLowerCase()
        );
        if (isDuplicate) {
          error = "This service already exists in the database. Please select a different service.";
        }
      }
    } else if (field === "fee") {
      error = validateField(field, value, rules);
    } else if (field === "description") {
      error = validateDescription(value);
    }
    
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    
    // Validate name - check against existing DB services
    errors.name = validateField("name", form.name, rules);
    if (form.name && !errors.name) {
      const isDuplicate = existingServices.some(
        service => (service.name || service.service_name || "").toLowerCase() === form.name.toLowerCase()
      );
      if (isDuplicate) {
        errors.name = "This service already exists in the database. Please select a different service.";
      }
    }
    
    // Validate fee
    errors.fee = validateField("fee", form.fee, rules);
    
    // Validate description
    errors.description = validateDescription(form.description);
    
    setLocalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAllFields()) {
      onSubmit(e);
    }
  };

  // Filter out services that already exist in the database
  const getAvailableServices = () => {
    // Get all service names that are already registered in the DB
    const registeredServiceNames = existingServices.map(s => 
      (s.name || s.service_name || "").toLowerCase()
    );
    
    // Filter SERVICE_TYPES to only show those not in DB
    const available = SERVICE_TYPES.filter(type => {
      const typeTitle = toTitle(type).toLowerCase();
      return !registeredServiceNames.includes(typeTitle);
    });
    
    return available;
  };

  if (!isOpen) return null;

  const getFieldError = (field) => localErrors[field] || fieldErrors?.[field];
  const availableServices = getAvailableServices();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4">
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Wrench size={18} className="text-slate-600" />
              Register Service Type
            </h2>
            <p className="text-sm text-slate-500">Super admins register agency service types here.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Service Name Select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <select
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 bg-white outline-none focus:ring-2 transition-colors ${
                  getFieldError("name") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                required
              >
                <option value="" disabled>
                  Select a service type...
                </option>
                {availableServices.map((t) => (
                  <option key={t} value={toTitle(t)}>
                    {toTitle(t)}
                  </option>
                ))}
              </select>
              {getFieldError("name") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("name")}
                </p>
              )}
              {availableServices.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  All available services have already been registered in the database.
                </p>
              )}
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
                placeholder="e.g., 500"
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
              <p className="mt-1 text-xs text-slate-400">
                20-1000 characters describing the service. Cannot be only numbers or special characters.
              </p>
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Required Documents
              </label>
              <input
                value={form.docs || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, docs: e.target.value }))}
                placeholder="photo, medical_report, id_scan"
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
              disabled={loading || availableServices.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShieldCheck size={16} />
              {loading ? "Registering..." : "Register Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}