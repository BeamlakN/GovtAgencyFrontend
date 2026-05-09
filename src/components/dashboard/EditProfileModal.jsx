import { useEffect, useState, useRef } from "react";
import { User, X, Save, Phone, AlertCircle, Camera, Upload } from "lucide-react";
import { toastError } from "@/components/ui/toast";
import { validateField, getValidationRules } from "@/utils/validation";
import { supabase } from "@/lib/supabase";

function EditProfileModal({ isOpen, onClose, profile, onSave }) {
  const [formData, setFormData] = useState({
    name: profile?.name || profile?.fullName || "",
    phone_number: profile?.phone_number || "",
    image_url: profile?.image_url || profile?.image || null,
  });
  const [localErrors, setLocalErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const rules = getValidationRules("editProfile");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: profile?.name || profile?.fullName || "",
        phone_number: profile?.phone_number || "",
        image_url: profile?.image_url || profile?.image || null,
      });
      setLocalErrors({});
    }
  }, [isOpen, profile]);

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toastError('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toastError('Image size should be less than 2MB');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toastSuccess("Profile picture uploaded successfully!");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toastError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "phone_number") {
      const phoneRegex = /^[0-9+\-\s]{8,15}$/;
      if (value && !phoneRegex.test(value)) {
        setLocalErrors(prev => ({ ...prev, [field]: "Please enter a valid phone number (8-15 digits)" }));
      } else {
        setLocalErrors(prev => ({ ...prev, [field]: "" }));
      }
    } else {
      const error = validateField(field, value, rules);
      setLocalErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAllFields = () => {
    const errors = {};
    errors.name = validateField("name", formData.name, rules);
    
    if (formData.phone_number) {
      const phoneRegex = /^[0-9+\-\s]{8,15}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        errors.phone_number = "Please enter a valid phone number (8-15 digits)";
      }
    }
    
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
      await onSave({
        name: formData.name,
        phone_number: formData.phone_number,
        image: formData.image_url,
      });
      onClose();
    } catch (err) {
      // Error handled in parent
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (field) => localErrors[field];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute top-16 right-4 w-full max-w-lg">
        <div
          ref={modalRef}
          className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <p className="text-sm text-slate-300 mt-0.5">Update your profile information</p>
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
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <Camera size={14} className="text-slate-400" />
                  Profile Picture
                </span>
              </label>
              
              <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center overflow-hidden">
                    {formData.image_url ? (
                      <img 
                        src={formData.image_url} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {(formData.name?.charAt(0) || "U").toUpperCase()}
                      </span>
                    )}
                  </div>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                
                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                        <span className="text-sm">Uploading... {Math.round(uploadProgress)}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span className="text-sm">Upload Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">JPEG, PNG, GIF, WEBP up to 2MB</p>
            </div>

            {/* Full Name - Editable */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  Full Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 outline-none focus:ring-2 transition-all ${
                  getFieldError("name") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                }`}
                placeholder="Enter your full name"
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
            
            {/* Phone Number - Editable */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  Phone Number
                </span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleFieldChange("phone_number", e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 outline-none focus:ring-2 transition-all ${
                  getFieldError("phone_number") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                }`}
                placeholder="e.g., +251 911 123456"
              />
              {getFieldError("phone_number") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {getFieldError("phone_number")}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">Enter your phone number (optional)</p>
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
                disabled={saving || uploadingImage}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;