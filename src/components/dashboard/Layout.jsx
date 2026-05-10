import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./SideBar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import ToastViewport from "@/components/ui/ToastViewport";
import ProfileDropdown from "@/pages/Profile";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { getProfile, updateProfile, changePassword, getNotifications } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

export default function Layout() {
  const { t } = useTranslation();
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  let localUser = null;
  try {
    localUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localUser = null;
  }

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === "true");
    }
  }, []);

  const handleSidebarToggle = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        
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
    if (status === "sent") return <CheckCircle className="text-green-500" size={12} />;
    if (status === "scheduled") return <Clock className="text-blue-500" size={12} />;
    return <AlertCircle className="text-slate-400" size={12} />;
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
      const payload = {
        name: formData.name || formData.fullName,
        email: formData.email,
      };
      
      const response = await updateProfile(payload);
      
      const updatedProfile = { 
        ...profile, 
        fullName: formData.name || formData.fullName,
        name: formData.name || formData.fullName,
        email: formData.email,
        position: formData.position,
      };
      setProfile(updatedProfile);
      localStorage.setItem("user", JSON.stringify(updatedProfile));
      toastSuccess(t("layout.profileUpdated"));
      return response;
    } catch (err) {
      console.error("Update error:", err);
      toastError(err?.response?.data?.error || err?.message || t("layout.profileUpdateFailed"));
      throw err;
    }
  };

  const handlePasswordSave = async (passwordData) => {
    try {
      await changePassword(passwordData);
      toastSuccess(t("layout.passwordChanged"));
    } catch (err) {
      toastError(err?.response?.data?.error || err?.message || t("layout.passwordChangeFailed"));
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
  const pageTitle = useMemo(() => {
    const routes = {
      "/dashboard": t("pageTitles.dashboard"),
      "/staff": t("pageTitles.staff"),
      "/services": t("pageTitles.services"),
      "/announcements": t("pageTitles.announcements"),
      "/applications": t("pageTitles.applications"),
      "/license-onboarding": t("pageTitles.licenseOnboarding"),
      "/audit-logs": t("pageTitles.auditLogs"),
      "/suggestions": t("pageTitles.suggestions"),
      "/analytics": t("pageTitles.analytics"),
      "/settings": t("pageTitles.settings"),
      "/profile": t("pageTitles.profile"),
    };
    const pathname = location.pathname;
    if (pathname.match(/^\/applications\/[^/]+\/review$/)) {
      return t("pageTitles.reviewApplication");
    }
    if (pathname === "/applications") {
      const type = searchParams.get("type");
      if (type) {
        const formattedType = type
          .replaceAll("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return t("pageTitles.applicationsWithType", { type: formattedType });
      }
    }
    if (pathname.match(/^\/suggestions\/[^/]+$/)) {
      return t("pageTitles.suggestionDetails");
    }
    return routes[pathname] || t("pageTitles.fallback");
  }, [location.pathname, location.search, t]);
  const mainMarginClass = isSidebarCollapsed ? "ml-16" : "ml-64";

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleSidebarToggle} />
        <div className={`flex-1 ${mainMarginClass} transition-all duration-300 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
        </div>
      </div>
    );
  }

  const accountName = profile.fullName || profile.name;
  const accountRole = profile.role === "super_admin" ? t("layout.superAdmin") : t("layout.agencyAdmin");
  const initials = getInitials(accountName);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleSidebarToggle} />
      <ToastViewport />
      <div className={`${mainMarginClass} transition-all duration-300 flex flex-col min-h-screen`}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">{pageTitle}</h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationsDrawer(true)}
                  className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
                  title={t("layout.notifications")}
                >
                  <Bell size={16} className="sm:w-[18px] sm:h-[18px] text-slate-500" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="h-10 sm:h-11 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2"
                  >
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white text-[10px] sm:text-xs font-semibold flex items-center justify-center">
                      {initials || "AA"}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-none">{accountName}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 capitalize">{accountRole}</p>
                    </div>
                    <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-slate-500" />
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
          <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">{t("layout.notificationsTitle")}</h2>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} className="sm:w-[20px] sm:h-[20px] text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-4 sm:p-5 text-center text-slate-600 text-sm">{t("layout.loadingNotifications")}</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 sm:p-5 text-center text-slate-600 text-sm">{t("layout.noNotifications")}</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.slice(0, 10).map((notif) => (
                    <div key={notif.id || notif._id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded capitalize ${getTypeColor(notif.type)}`}>
                              {notif.type}
                            </span>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              {getStatusIcon(notif.status)}
                              <span className="text-[10px] sm:text-xs text-slate-600 capitalize">{notif.status}</span>
                            </div>
                          </div>
                          <p className="font-medium text-slate-900 text-xs sm:text-sm">{notif.title}</p>
                          <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-3 sm:p-4">
              <button
                onClick={() => {
                  setShowNotificationsDrawer(false);
                  navigate("/settings");
                }}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs sm:text-sm font-medium"
              >
                {t("layout.manageNotifications")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}