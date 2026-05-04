// Updated Layout.jsx
import { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown } from "lucide-react";
import ToastViewport from "@/components/ui/ToastViewport";
import ProfileDropdown from "@/pages/Profile";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { getProfile, updateProfile, changePassword } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

export default function Layout() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user from localStorage as fallback
  let localUser = null;
  try {
    localUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localUser = null;
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        const normalized = {
          fullName: data.fullName || data.name || localUser?.fullName || localUser?.name || "Agency Admin",
          email: data.email || localUser?.email || "",
          bureauId: data.bureauId || data.bureau_id || "",
          role: data.role || localUser?.role || "Operations Manager",
        };
        setProfile(normalized);
        // Update localStorage with latest profile
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {
        console.error("Failed to load profile:", err);
        // Use localStorage data as fallback
        if (localUser) {
          setProfile({
            fullName: localUser.fullName || localUser.name || "Agency Admin",
            email: localUser.email || "",
            bureauId: "",
            role: localUser.role || "Operations Manager",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSave = async (formData) => {
    try {
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        bureauId: formData.bureauId,
      });
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile);
      localStorage.setItem("user", JSON.stringify(updatedProfile));
      toastSuccess("Profile updated successfully.");
    } catch (err) {
      toastError(err?.message || "Failed to update profile.");
      throw err;
    }
  };

  const handlePasswordSave = async (passwordData) => {
    try {
      await changePassword(passwordData);
      toastSuccess("Password changed successfully.");
    } catch (err) {
      toastError(err?.message || "Failed to change password.");
      throw err;
    }
  };

  const getInitials = (name) => {
    if (!name) return "AA";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  const accountName = profile.fullName;
  const accountRole = profile.role?.replaceAll("_", " ") || "Operations Manager";
  const initials = getInitials(accountName);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <ToastViewport />
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-3 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search staff, applications..."
              className="w-full bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <Bell size={18} className="text-slate-500" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-12 pl-2.5 pr-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                  {initials || "AA"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{accountName}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{accountRole}</p>
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </button>

              {showDropdown && (
                <ProfileDropdown
                  user={profile}
                  onEditProfile={() => {
                    setShowDropdown(false);
                    setShowEditProfileModal(true);
                  }}
                  onChangePassword={() => {
                    setShowDropdown(false);
                    setShowChangePasswordModal(true);
                  }}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        profile={profile}
        onSave={handleProfileSave}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onChangePassword={handlePasswordSave}
      />
    </div>
  );
}