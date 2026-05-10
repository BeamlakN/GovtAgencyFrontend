import { Megaphone, CheckCircle, Upload, X, Image, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { validateField, getValidationRules } from "@/utils/validation";

const TARGET_ROLES = [
  { value: "citizen", label: "Citizen" },
  { value: "admin", label: "Admin" },
  { value: "all", label: "All users" },
];

export default function AnnouncementCreateModal({
  isOpen,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
}) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localErrors, setLocalErrors] = useState({});
  const fileInputRef = useRef(null);
  const rules = getValidationRules("announcement");

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value, rules);
    setLocalErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAllFields = () => {
    const errors = {};
    errors.title = validateField("title", form.title, rules);
    errors.content = validateField("content", form.content, rules);
    
    setLocalErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateAllFields()) {
      onSubmit(e);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `announcement-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('announcement-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('announcement-images')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFieldError = (field) => localErrors[field];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] px-2 sm:px-3 overflow-y-auto">
      <div className="mx-auto mt-16 sm:mt-20 md:mt-24 mb-8 w-full max-w-[95%] sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Megaphone size={16} className="sm:w-[18px] sm:h-[18px] text-slate-600" />
              Create Announcement
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Add a new announcement with an optional image</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px] text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-3 sm:p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Title Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title || ""}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
                  getFieldError("title") 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-slate-300 focus:ring-slate-400 focus:border-transparent"
                }`}
                placeholder="Enter announcement title"
                required
              />
              {getFieldError("title") && (
                <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                  {getFieldError("title")}
                </p>
              )}
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400">3-200 characters, no spaces at ends</p>
            </div>

            {/* Target Role Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Target Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.target_role || "citizen"}
                onChange={(e) => setForm((prev) => ({ ...prev, target_role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                required
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Field */}
          <div className="mt-3">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content || ""}
              onChange={(e) => handleFieldChange("content", e.target.value)}
              rows={4}
              className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm bg-white focus:outline-none focus:ring-2 transition-colors resize-none ${
                getFieldError("content") 
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                  : "border-slate-300 focus:ring-slate-400 focus:border-transparent"
              }`}
              placeholder="Write the announcement content here"
              required
            />
            {getFieldError("content") && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={10} className="sm:w-[12px] sm:h-[12px]" />
                {getFieldError("content")}
              </p>
            )}
            <p className="mt-0.5 text-[9px] sm:text-xs text-slate-400">10-5000 characters</p>
          </div>

          {/* Image Upload Field */}
          <div className="mt-3">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Image (Optional)
            </label>
            
            {!form.image_url ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer transition-all ${
                  uploadingImage
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                
                {uploadingImage ? (
                  <div className="space-y-2">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 mx-auto animate-bounce" />
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-slate-700">Uploading...</div>
                      <div className="w-32 sm:w-40 mx-auto mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-600 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 mt-1">{Math.round(uploadProgress)}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Image className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 mx-auto" />
                    <div className="text-xs sm:text-sm font-medium text-slate-700">Click to upload image</div>
                    <div className="text-[9px] sm:text-xs text-slate-500">JPEG, PNG, GIF, WEBP up to 5MB</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <div className="relative group">
                  <img
                    src={form.image_url}
                    alt="Announcement preview"
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </div>
            )}
            
            {form.image_url && !uploadingImage && (
              <p className="text-[9px] sm:text-xs text-slate-500 mt-1.5 truncate">
                Current: {form.image_url.split('/').pop().slice(0, 40)}...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-5 flex justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <CheckCircle size={14} className="sm:w-[16px] sm:h-[16px]" />
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}