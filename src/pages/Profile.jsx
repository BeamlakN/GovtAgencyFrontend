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
      className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">{user?.fullName || user?.name || "Agency Admin"}</p>
            <p className="text-[10px] text-slate-300 truncate">{user?.email || "admin@agency.gov"}</p>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
          <Shield size={10} className="text-slate-300" />
          <span className="text-[9px] font-medium text-slate-300">
            {user?.role === "super_admin" ? "Super Admin" : "Agency Admin"}
          </span>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={onEditProfile}
          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center">
            <User size={12} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">Edit Profile</p>
            <p className="text-[9px] text-slate-400">Update your info</p>
          </div>
        </button>
        
        <button
          onClick={onChangePassword}
          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center">
            <Lock size={12} className="text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">Change Password</p>
            <p className="text-[9px] text-slate-400">Security credentials</p>
          </div>
        </button>
        
        <div className="border-t border-slate-100 my-1"></div>
        
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-red-50 group-hover:bg-red-100 flex items-center justify-center">
            <LogOut size={12} className="text-red-500" />
          </div>
          <div>
            <p className="font-medium text-red-600">Sign Out</p>
            <p className="text-[9px] text-red-400">Log out</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default ProfileDropdown;