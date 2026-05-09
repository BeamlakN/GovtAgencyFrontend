import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut, Shield, Building2 } from "lucide-react";

function ProfileDropdown({ user, onEditProfile, onChangePassword, onClose }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
    >
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{user?.fullName || user?.name || "Agency Admin"}</p>
            <p className="text-xs text-blue-100 truncate">{user?.email || "admin@agency.gov"}</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <Shield size={12} className="text-blue-200" />
          <span className="text-xs font-medium text-blue-100">
            {user?.role === "super_admin" ? "Super Administrator" : "Agency Administrator"}
          </span>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="py-2">
        <button
          onClick={onEditProfile}
          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">Edit Profile</p>
            <p className="text-xs text-slate-400">Update your personal information</p>
          </div>
        </button>
        
        <button
          onClick={onChangePassword}
          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">Change Password</p>
            <p className="text-xs text-slate-400">Update your security credentials</p>
          </div>
        </button>
        
        <div className="border-t border-slate-100 my-1"></div>
        
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <LogOut size={16} className="text-red-500" />
          </div>
          <div>
            <p className="font-medium text-red-600">Sign Out</p>
            <p className="text-xs text-red-400">Log out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default ProfileDropdown;