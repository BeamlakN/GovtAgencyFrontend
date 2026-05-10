import { ShieldCheck, UserCog, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { validateField, getValidationRules, getPasswordStrength, getPasswordRequirements } from "@/utils/validation";
import { toastError } from "@/components/ui/toast";

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
    const isValid = !errors.name && !errors.email && !errors.password;
    
    if (!isValid) {
      toastError("Please fix the errors in the form");
    }
    
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", form);
    
    if (validateAllFields()) {
      console.log("Validation passed, calling onSubmit");
      onSubmit(e);
    } else {
      console.log("Validation failed:", localErrors);
    }
  };

  if (!isOpen) return null;

  const getFieldError = (field) => localErrors[field] || fieldErrors?.[field];
  const passwordStrength = getPasswordStrength(form.password);
  const passwordReqs = getPasswordRequirements(form.password);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 px-2 sm:px-3 overflow-y-auto" onClick={onClose}>
      <div className="mx-auto mt-16 sm:mt-20 md:mt-24 mb-8 w-full max-w-[95%] sm:max-w-lg md:max-w-xl rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <UserCog size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600" />
              Create Staff Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Add a new admin to your agency</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg sm:text-xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="e.g., John Doe"
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm outline-none focus:ring-2 transition-colors ${
                  getFieldError("name") 
                    ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                    : "border-slate-300 focus:ring-indigo-500"
                }`}
              />
              {getFieldError("name") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" /> {getFieldError("name")}
                </p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                placeholder="e.g., officer@agency.gov.et"
                type="email"
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-sm outline-none focus:ring-2 transition-colors ${
                  getFieldError("email") 
                    ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                    : "border-slate-300 focus:ring-indigo-500"
                }`}
              />
              {getFieldError("email") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" /> {getFieldError("email")}
                </p>
              )}
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  value={form.password || ""}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  type={showPassword ? "text" : "password"}
                  className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2.5 pr-8 sm:pr-10 text-sm outline-none focus:ring-2 transition-colors ${
                    getFieldError("password") 
                      ? "border-red-500 focus:ring-red-500 bg-red-50/10" 
                      : "border-slate-300 focus:ring-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={14} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
              
              {form.password && (
                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 2 ? "bg-red-500" : passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-green-500"
                      }`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-xs">
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordReqs.minLength ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.minLength ? "✓" : "○"}</span> 8+ chars
                    </div>
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordReqs.hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasLowercase ? "✓" : "○"}</span> Lowercase
                    </div>
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordReqs.hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasUppercase ? "✓" : "○"}</span> Uppercase
                    </div>
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${passwordReqs.hasNumber ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasNumber ? "✓" : "○"}</span> Number
                    </div>
                    <div className={`col-span-2 flex items-center gap-0.5 sm:gap-1 ${passwordReqs.hasSpecialChar ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasSpecialChar ? "✓" : "○"}</span> Special char (@$!%*?&)
                    </div>
                  </div>
                </div>
              )}
              
              {getFieldError("password") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" /> {getFieldError("password")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex items-center justify-end gap-2 sm:gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="rounded-lg border border-slate-300 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ShieldCheck size={14} className="sm:w-[16px] sm:h-[16px]" />
              {loading ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}