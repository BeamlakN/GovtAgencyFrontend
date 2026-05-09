import { ShieldCheck, UserCog, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { validateField, getValidationRules, getPasswordStrength, getPasswordRequirements } from "@/utils/validation";

export default function StaffCreateModal({
  isOpen,
  form,
  setForm,
  fieldErrors,
  loading,
  onClose,
  onSubmit,
}) {
  const [localErrors, setLocalErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const rules = getValidationRules("staffCreate");

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, rules);
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.name = validateField("name", form.name, rules);
    errors.email = validateField("email", form.email, rules);
    errors.password = validateField("password", form.password, rules);
    
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
  const passwordStrength = getPasswordStrength(form.password);
  const passwordReqs = getPasswordRequirements(form.password);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-4" onClick={onClose}>
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <UserCog size={18} className="text-slate-600" />
              Create Staff Account
            </h2>
            <p className="text-sm text-slate-500 mt-1">Add a new admin or super admin to your agency</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., John Doe"
                className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 transition-colors ${
                  getFieldError("name") 
                    ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                    : "border-slate-300 focus:ring-indigo-500"
                }`}
              />
              {getFieldError("name") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {getFieldError("name")}
                </p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="e.g., officer@agency.gov.et"
                type="email"
                className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 transition-colors ${
                  getFieldError("email") 
                    ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                    : "border-slate-300 focus:ring-indigo-500"
                }`}
              />
              {getFieldError("email") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {getFieldError("email")}
                </p>
              )}
            </div>
            
            {/* Password with Show/Hide */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  value={form.password || ""}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  type={showPassword ? "text" : "password"}
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 outline-none focus:ring-2 transition-colors ${
                    getFieldError("password") 
                      ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                      : "border-slate-300 focus:ring-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? "bg-red-500" : passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-green-500"
                      }`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${passwordReqs.minLength ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.minLength ? "✓" : "○"}</span> 8+ characters
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasLowercase ? "✓" : "○"}</span> Lowercase
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasUppercase ? "✓" : "○"}</span> Uppercase
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasNumber ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasNumber ? "✓" : "○"}</span> Number
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.hasSpecialChar ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasSpecialChar ? "✓" : "○"}</span> Special character (@$!%*?&)
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.noSpaces ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.noSpaces ? "✓" : "○"}</span> No spaces
                    </div>
                  </div>
                </div>
              )}
              
              {getFieldError("password") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {getFieldError("password")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-70">
              <ShieldCheck size={16} />
              {loading ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}