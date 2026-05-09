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
      // Clear confirm password error when new password changes
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
      
      <div className="absolute top-16 right-4 w-full max-w-md">
        <div
          ref={modalRef}
          className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="text-sm text-slate-300 mt-0.5">Update your security credentials</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
                  className={`w-full rounded-xl border pl-10 pr-12 py-2.5 text-slate-900 outline-none focus:ring-2 transition-all ${
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
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getFieldError("currentPassword") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("currentPassword")}
                </p>
              )}
            </div>
            
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleFieldChange("newPassword", e.target.value)}
                  className={`w-full rounded-xl border pl-10 pr-12 py-2.5 text-slate-900 outline-none focus:ring-2 transition-all ${
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
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? "bg-red-500" :
                          passwordStrength.score <= 4 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  {/* Password Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${passwordReqs.minLength ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.minLength ? "✓" : "○"}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasLowercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasLowercase ? "✓" : "○"}</span>
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasUppercase ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasUppercase ? "✓" : "○"}</span>
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordReqs.hasNumber ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasNumber ? "✓" : "○"}</span>
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.hasSpecialChar ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.hasSpecialChar ? "✓" : "○"}</span>
                      <span>Special character (@$!%*?&)</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1 ${passwordReqs.noSpaces ? "text-green-600" : "text-slate-400"}`}>
                      <span>{passwordReqs.noSpaces ? "✓" : "○"}</span>
                      <span>No spaces allowed</span>
                    </div>
                  </div>
                </div>
              )}
              
              {getFieldError("newPassword") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("newPassword")}
                </p>
              )}
            </div>
            
            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                  className={`w-full rounded-xl border pl-10 pr-12 py-2.5 text-slate-900 outline-none focus:ring-2 transition-all ${
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
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {getFieldError("confirmPassword") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("confirmPassword")}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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