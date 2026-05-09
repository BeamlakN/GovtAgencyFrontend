import { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, X, Plus, Trash2, Edit2, Send, AlertCircle, Clock, CheckCircle } from "lucide-react";
import ToastViewport from "@/components/ui/ToastViewport";
import ProfileDropdown from "@/pages/Profile";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { getProfile, updateProfile, changePassword, getNotifications, createNotification, updateNotification, deleteNotification, sendNotification } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

// Map routes to page titles
const getPageTitle = (pathname, searchParams) => {
  const routes = {
    "/dashboard": "Dashboard Overview",
    "/staff": "Staff Administration",
    "/services": "Services Management",
    "/announcements": "Announcements",
    "/applications": "Applications",
    "/license-onboarding": "License Onboarding",
    "/audit-logs": "Audit Logs",
    "/suggestions": "Suggestions & Feedback",
    "/analytics": "Analytics Dashboard",
    "/settings": "Settings",
  };
  
  // Handle application review page
  if (pathname.match(/^\/applications\/[^/]+\/review$/)) {
    return "Review Application";
  }

  if (pathname === "/applications") {
    const type = searchParams.get("type");
    if (type) {
      const formattedType = type
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `Applications / ${formattedType}`;
    }
  }

  // Handle suggestion detail page
  if (pathname.match(/^\/suggestions\/[^/]+$/)) {
    return "Suggestion Details";
  }
  
  return routes[pathname] || "Transport Agency Dashboard";
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
        console.log("Profile loaded:", data);
        
        const normalized = {
          id: data.id || data.userId,
          fullName: data.fullName || data.name || localUser?.fullName || localUser?.name || "Agency Admin",
          name: data.name || data.fullName || localUser?.name || "Agency Admin",
          email: data.email || localUser?.email || "",
          bureauId: data.bureauId || data.bureau_id || "",
          role: data.role || localUser?.role || "admin",
          position: data.position || "Agency Administrator",
        };
        setProfile(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (localUser) {
          setProfile({
            id: localUser.id,
            fullName: localUser.fullName || localUser.name || "Agency Admin",
            name: localUser.name || localUser.fullName || "Agency Admin",
            email: localUser.email || "",
            bureauId: localUser.bureauId || "",
            role: localUser.role || "admin",
            position: localUser.position || "Agency Administrator",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Load notifications when drawer is opened
  useEffect(() => {
    if (showNotificationsDrawer) {
      loadNotificationsData();
    }
  }, [showNotificationsDrawer]);

  const loadNotificationsData = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getNotifications({ limit: 50 });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "sent") return <CheckCircle className="text-green-600" size={16} />;
    if (status === "scheduled") return <Clock className="text-blue-600" size={16} />;
    return <AlertCircle className="text-slate-400" size={16} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      success: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-slate-100 text-slate-800";
  };

  const handleProfileSave = async (formData) => {
    try {
      // Using PUT method as per API documentation
      const payload = {
        name: formData.name || formData.fullName,
        email: formData.email,
      };
      
      console.log("Updating profile with payload:", payload);
      const response = await updateProfile(payload);
      console.log("Update response:", response);
      
      const updatedProfile = { 
        ...profile, 
        fullName: formData.name || formData.fullName,
        name: formData.name || formData.fullName,
        email: formData.email,
        position: formData.position,
      };
      setProfile(updatedProfile);
      localStorage.setItem("user", JSON.stringify(updatedProfile));
      toastSuccess("Profile updated successfully.");
      return response;
    } catch (err) {
      console.error("Update error:", err);
      toastError(err?.response?.data?.error || err?.message || "Failed to update profile.");
      throw err;
    }
  };

  const handlePasswordSave = async (passwordData) => {
    try {
      await changePassword(passwordData);
      toastSuccess("Password changed successfully.");
    } catch (err) {
      toastError(err?.response?.data?.error || err?.message || "Failed to change password.");
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

  const searchParams = new URLSearchParams(location.search);
  const pageTitle = getPageTitle(location.pathname, searchParams);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  const accountName = profile.fullName || profile.name;
  const accountRole = profile.role === "super_admin" ? "Super Administrator" : "Agency Administrator";
  const initials = getInitials(accountName);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <ToastViewport />
      <div className="ml-72 flex flex-col min-h-screen">
        {/* Header with dynamic page title */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationsDrawer(true)}
                  className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
                  title="Notifications"
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
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs font-semibold flex items-center justify-center">
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
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

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

      {/* Notifications Drawer */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowNotificationsDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-lg flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-6 text-center text-slate-600">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-600">No notifications</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.slice(0, 10).map((notif) => (
                    <div key={notif.id || notif._id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded capitalize ${getTypeColor(notif.type)}`}>
                              {notif.type}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(notif.status)}
                              <span className="text-xs text-slate-600 capitalize">{notif.status}</span>
                            </div>
                          </div>
                          <p className="font-medium text-slate-900 text-sm">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 p-4">
              <button
                onClick={() => {
                  setShowNotificationsDrawer(false);
                  navigate("/settings");
                }}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Manage Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}