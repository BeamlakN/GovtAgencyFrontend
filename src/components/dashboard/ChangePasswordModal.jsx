import { useEffect, useState, useRef } from "react";
import { Lock, Eye, EyeOff, X, KeyRound, AlertCircle } from "lucide-react";
import { toastError } from "@/components/ui/toast";
import { validateField, getValidationRules, getPasswordStrength, getPasswordRequirements } from "@/utils/validation";

function ChangePasswordModal({ isOpen, onClose, onChangePassword }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [localErrors, setLocalErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const rules = getValidationRules("changePassword");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLocalErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    let error = "";
    if (field === "currentPassword") {
      error = validateField("currentPassword", value, rules);
    } else if (field === "newPassword") {
      error = validateField("newPassword", value, rules);
      if (formData.confirmPassword) {
        const confirmError = validateField("confirmPassword", formData.confirmPassword, rules, value);
        setLocalErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    } else if (field === "confirmPassword") {
      error = validateField("confirmPassword", value, rules, formData.newPassword);
    }
    
    setLocalErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.currentPassword = validateField("currentPassword", formData.currentPassword, rules);
    errors.newPassword = validateField("newPassword", formData.newPassword, rules);
    errors.confirmPassword = validateField("confirmPassword", formData.confirmPassword, rules, formData.newPassword);
    
    setLocalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      return;
    }
    
    setSaving(true);
    try {
      await onChangePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      onClose();
    } catch (err) {
      // Error handled in parent
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getFieldError = (field) => localErrors[field];
  const passwordStrength = getPasswordStrength(formData.newPassword);
  const passwordReqs = getPasswordRequirements(formData.newPassword);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute top-16 right-4 w-full max-w-[95%] sm:max-w-md">
        <div
          ref={modalRef}
          className="relative transform overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-2xl transition-all"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Change Password</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Update your security credentials</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
              >
                <X size={18} className="sm:w-[20px] sm:h-[20px]" />
              </button>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-9 sm:pr-12 py-1.5 sm:py-2.5 text-sm text-slate-900 outline-none focus:ring-2 transition-all ${
                    getFieldError("currentPassword") 
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
              {getFieldError("currentPassword") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("currentPassword")}
                </p>
              )}
            </div>
            
            {/* New Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleFieldChange("newPassword", e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-9 sm:pr-12 py-1.5 sm:py-2.5 text-sm text-slate-900 outline-none focus:ring-2 transition-all ${
                    getFieldError("newPassword") 
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? "bg-red-500" :
                          passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  {/* Password Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <div className={`flex items-center gap-1 ${passwordReqs.minLength ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.minLength ? "✓" : "○"}</span>
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasLowercase ? "✓" : "○"}</span>
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasUppercase ? "✓" : "○"}</span>
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasNumber ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasNumber ? "✓" : "○"}</span>
                      <span>Number</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.hasSpecialChar ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasSpecialChar ? "✓" : "○"}</span>
                      <span>Special char (@$!%*?&)</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.noSpaces ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.noSpaces ? "✓" : "○"}</span>
                      <span>No spaces</span>
                    </div>
                  </div>
                </div>
              )}
              
              {getFieldError("newPassword") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("newPassword")}
                </p>
              )}
            </div>
            
            {/* Confirm New Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                  className={`w-full rounded-lg sm:rounded-xl border pl-9 sm:pl-10 pr-9 sm:pr-12 py-1.5 sm:py-2.5 text-sm text-slate-900 outline-none focus:ring-2 transition-all ${
                    getFieldError("confirmPassword") 
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
              {getFieldError("confirmPassword") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("confirmPassword")}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg sm:rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg sm:rounded-xl bg-slate-900 px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordModal;