import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Shield,
  Save,
  User,
  Moon,
  Sun,
  Languages,
  Palette,
  Plus,
  Trash2,
  Edit2,
  Send,
  AlertCircle,
  Clock,
  CheckCircle,
  Pencil,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Key,
  Globe,
  Monitor,
} from "lucide-react";
import { toastSuccess, toastError } from "@/components/ui/toast";
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
  getProfile,
  updateProfile,
} from "@/api/transportService";
import EditProfileModal from "@/components/dashboard/EditProfileModal";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingNotificationId, setEditingNotificationId] = useState(null);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const [notificationFormData, setNotificationFormData] = useState({
    title: "",
    message: "",
    type: "info",
    recipientRole: "all",
    status: "draft",
  });

  // Settings states
  const [securitySettings, setSecuritySettings] = useState(() => {
    const savedSessionTimeout = localStorage.getItem("sessionTimeout");
    return {
      twoFactorAuth: false,
      sessionTimeout: savedSessionTimeout || "30",
    };
  });

  const [languageSettings, setLanguageSettings] = useState({
    language: i18n.language?.startsWith("am") ? "am" : "en",
  });

  const [themeSettings, setThemeSettings] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return {
      theme: savedTheme || "system",
    };
  });

  // Session timeout management
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimer, setSessionTimer] = useState(null);
  const [warningTimer, setWarningTimer] = useState(null);

  // Update last activity on user interaction
  const updateLastActivity = () => {
    setLastActivity(Date.now());
    setSessionTimeoutWarning(false);
  };

  // Logout function
  const handleLogout = () => {
    // Clear all timers
    if (sessionTimer) clearTimeout(sessionTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionTimeout");
    
    // Redirect to login page
    window.location.href = "/login";
  };

  // Show warning before logout
  const showWarningAndLogout = () => {
    setSessionTimeoutWarning(true);
    toastWarning(t("settings.sessionTimeoutWarning"));
    
    // Set final logout timer
    const finalLogoutTimer = setTimeout(() => {
      handleLogout();
    }, 60000); // 1 minute grace period
    
    return () => clearTimeout(finalLogoutTimer);
  };

  // Reset timers based on session timeout setting
  const resetSessionTimer = () => {
    // Clear existing timers
    if (sessionTimer) clearTimeout(sessionTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    const timeoutMinutes = parseInt(securitySettings.sessionTimeout);
    if (!timeoutMinutes || timeoutMinutes === 0) return;
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 60000; // Show warning 1 minute before logout
    
    // Set warning timer
    if (warningMs > 0) {
      const newWarningTimer = setTimeout(() => {
        showWarningAndLogout();
      }, warningMs);
      setWarningTimer(newWarningTimer);
    }
    
    // Set logout timer
    const newSessionTimer = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
    setSessionTimer(newSessionTimer);
  };

  // Track user activity
  useEffect(() => {
    const activities = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];
    
    const handleActivity = () => {
      updateLastActivity();
      resetSessionTimer();
    };
    
    activities.forEach((activity) => {
      document.addEventListener(activity, handleActivity);
    });
    
    return () => {
      activities.forEach((activity) => {
        document.removeEventListener(activity, handleActivity);
      });
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [securitySettings.sessionTimeout]);

  // Initial timer setup
  useEffect(() => {
    resetSessionTimer();
    return () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [securitySettings.sessionTimeout]);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const theme = themeSettings.theme;
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (theme === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        if (systemPrefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    
    applyTheme();
    localStorage.setItem("theme", themeSettings.theme);
  }, [themeSettings.theme]);

  useEffect(() => {
    const lng = i18n.language?.startsWith("am") ? "am" : "en";
    setLanguageSettings((prev) => ({ ...prev, language: lng }));
  }, [i18n.language]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      toastError(t("settings.loadProfileFailed"));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      await updateProfile(updatedData);
      await loadProfile();
      toastSuccess(t("settings.profileUpdated"));
    } catch (err) {
      toastError(t("settings.profileUpdateFailed"));
      throw err;
    }
  };

  useEffect(() => {
    if (activeSection === "notifications") {
      loadNotificationsData();
    }
  }, [activeSection]);

  const loadNotificationsData = async () => {
    try {
      setLoadingNotifications(true);
      const data = await getNotifications({ limit: 100 });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(t("settings.loadNotifFailed"));
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotificationId) {
        await updateNotification(editingNotificationId, notificationFormData);
        toastSuccess(t("settings.notificationUpdated"));
      } else {
        await createNotification(notificationFormData);
        toastSuccess(t("settings.notificationCreated"));
      }
      resetNotificationForm();
      loadNotificationsData();
    } catch (err) {
      toastError(t("settings.actionFailed"));
    }
  };

  const resetNotificationForm = () => {
    setNotificationFormData({
      title: "",
      message: "",
      type: "info",
      recipientRole: "all",
      status: "draft",
    });
    setEditingNotificationId(null);
    setShowNotificationForm(false);
  };

  const handleEditNotification = (notif) => {
    setNotificationFormData({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      recipientRole: notif.recipientRole || "all",
      status: notif.status,
    });
    setEditingNotificationId(notif.id || notif._id);
    setShowNotificationForm(true);
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm(t("settings.deleteConfirm"))) return;
    try {
      setDeletingNotification(id);
      await deleteNotification(id);
      toastSuccess(t("settings.notificationDeleted"));
      loadNotificationsData();
    } catch (err) {
      toastError(t("settings.deleteFailed"));
    } finally {
      setDeletingNotification(null);
    }
  };

  const handleSendNotification = async (id) => {
    try {
      await sendNotification(id);
      toastSuccess(t("settings.notificationSent"));
      loadNotificationsData();
    } catch (err) {
      toastError(t("settings.sendFailed"));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save session timeout to localStorage
      localStorage.setItem("sessionTimeout", securitySettings.sessionTimeout);
      
      // Reset session timer with new value
      resetSessionTimer();
      
      await new Promise((r) => setTimeout(r, 800));
      toastSuccess(t("settings.settingsSaved"));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: t("settings.tabProfile"), icon: User },
    { id: "notifications", label: t("settings.tabNotifications"), icon: Bell },
    { id: "security", label: t("settings.tabSecurity"), icon: Shield },
    { id: "language", label: t("settings.tabLanguage"), icon: Languages },
    { id: "theme", label: t("settings.tabTheme"), icon: Palette },
  ];

  const getTypeColor = (type) => {
    const colors = {
      info: "bg-blue-50 text-blue-700 border-blue-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      error: "bg-red-50 text-red-700 border-red-200",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    return colors[type] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  };

  // Toast warning function
  const toastWarning = (message) => {
    // Implement your toast warning here
    console.warn(message);
  };

  return (
    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Session Timeout Warning Modal */}
      {sessionTimeoutWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 bg-amber-500">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={16} />
                {t("settings.sessionTimeoutWarningTitle")}
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700 mb-4">
                {t("settings.sessionTimeoutWarningMessage")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSessionTimeoutWarning(false);
                    updateLastActivity();
                    resetSessionTimer();
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                  {t("common.stayLoggedIn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200 bg-white rounded-t-xl px-3">
            <nav className="flex gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all border-b-2 ${
                      isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div>
              {loadingProfile ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                </div>
              ) : (
                profile && (
                  <>
                    {/* Profile Header */}
                    <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {getInitials(profile.name)}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowEditProfileModal(true)}
                            className="absolute -bottom-1.5 -right-1.5 p-1 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors"
                          >
                            <Pencil size={10} className="text-slate-600" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-white">
                            {profile.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-medium text-white">
                              {profile.role === "super_admin"
                                ? t("settings.superAdmin")
                                : t("settings.agencyAdmin")}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-300">
                              ID: {profile.id?.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Information Grid */}
                    <div className="p-5">
                      <h3 className="text-sm font-semibold text-slate-900 mb-4">
                        {t("settings.profileInformation")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg">
                          <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <User size={14} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                              {t("settings.fullName")}
                            </p>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {profile.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg">
                          <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <Mail size={14} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                              {t("settings.email")}
                            </p>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg">
                          <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <Phone size={14} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                              {t("settings.phone")}
                            </p>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {profile.phone_number || t("settings.notProvided")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg">
                          <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <Building2 size={14} className="text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                              {t("settings.bureau")}
                            </p>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {profile.bureauName ||
                                profile.bureau_name ||
                                t("settings.notAssigned")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => setShowEditProfileModal(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                        >
                          <Pencil size={12} />
                          {t("settings.editProfile")}
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <div className="p-5">
              <div className="mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {t("settings.systemNotifications")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("settings.systemNotificationsHint")}
                  </p>
                </div>
              </div>

              {showNotificationForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900">
                      <h2 className="text-sm font-semibold text-white">
                        {editingNotificationId
                          ? "Edit Notification"
                          : "Create Notification"}
                      </h2>
                    </div>
                    <form onSubmit={handleNotificationSubmit} className="p-4 space-y-3">
                      <input
                        type="text"
                        value={notificationFormData.title}
                        onChange={(e) =>
                          setNotificationFormData({
                            ...notificationFormData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-slate-900"
                        placeholder={t("settings.titlePlaceholder")}
                      />
                      <textarea
                        value={notificationFormData.message}
                        onChange={(e) =>
                          setNotificationFormData({
                            ...notificationFormData,
                            message: e.target.value,
                          })
                        }
                        rows="3"
                        className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-slate-900"
                        placeholder={t("settings.messagePlaceholder")}
                      />
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={resetNotificationForm}
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm"
                        >
                          {t("common.save")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loadingNotifications ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl">
                  <Bell size={40} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    {t("settings.noNotifications")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id || notif._id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full border ${getTypeColor(
                              notif.type
                            )}`}
                          >
                            {notif.type}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {notif.status === "sent" ? (
                              <CheckCircle size={10} className="text-emerald-500" />
                            ) : notif.status === "scheduled" ? (
                              <Clock size={10} className="text-blue-500" />
                            ) : (
                              <AlertCircle size={10} className="text-slate-400" />
                            )}
                            <span className="text-[9px] text-slate-500 capitalize">
                              {notif.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-900">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {notif.message}
                        </p>
                      </div>
                      <div className="flex gap-0.5 ml-3">
                        {notif.status === "draft" && (
                          <>
                            <button
                              onClick={() => handleEditNotification(notif)}
                              className="p-1.5 text-slate-600 hover:bg-white rounded"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() =>
                                handleSendNotification(notif.id || notif._id)
                              }
                              className="p-1.5 text-blue-600 hover:bg-white rounded"
                              title="Send"
                            >
                              <Send size={12} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notif.id || notif._id)
                          }
                          className="p-1.5 text-red-600 hover:bg-white rounded"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="p-5">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  {t("settings.securitySettings")}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-md shadow-sm">
                        <Key size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {t("settings.twoFactor")}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {t("settings.twoFactorHint")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSecuritySettings((s) => ({
                          ...s,
                          twoFactorAuth: !s.twoFactorAuth,
                        }))
                      }
                      className={`relative w-9 h-5 rounded-full transition-all ${
                        securitySettings.twoFactorAuth
                          ? "bg-emerald-600"
                          : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                          securitySettings.twoFactorAuth
                            ? "left-4.5"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-white rounded-md shadow-sm">
                        <Clock size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {t("settings.sessionTimeout")}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {t("settings.sessionTimeoutHint")}
                        </p>
                      </div>
                    </div>
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings((s) => ({
                          ...s,
                          sessionTimeout: e.target.value,
                        }))
                      }
                      className="px-2 py-1 bg-white border rounded-lg text-xs"
                    >
                      <option value="15">15 {t("minutes")}</option>
                      <option value="30">30 {t("minutes")}</option>
                      <option value="60">60 {t("minutes")}</option>
                      <option value="120">2 {t("hours")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language Section */}
          {activeSection === "language" && (
            <div className="p-5">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  {t("settings.languagePreferences")}
                </h2>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                      <Globe size={14} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        {t("settings.interfaceLanguage")}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {t("settings.interfaceLanguageHint")}
                      </p>
                    </div>
                  </div>
                  <select
                    value={languageSettings.language}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLanguageSettings({ language: v });
                      i18n.changeLanguage(v);
                    }}
                    className="px-2 py-1 bg-white border rounded-lg text-xs"
                  >
                    <option value="en">{t("settings.english")}</option>
                    <option value="am">{t("settings.amharic")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Theme Section */}
          {activeSection === "theme" && (
            <div className="p-5">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  {t("settings.themePreferences")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: "light", label: t("settings.themeLight"), icon: Sun },
                    { id: "dark", label: t("settings.themeDark"), icon: Moon },
                    { id: "system", label: t("settings.themeSystem"), icon: Monitor },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setThemeSettings({ theme: option.id })}
                      className={`p-3 rounded-lg border transition-all ${
                        themeSettings.theme === option.id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-md shadow-sm">
                          <option.icon size={14} />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            themeSettings.theme === option.id
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {(activeSection === "security" ||
            activeSection === "language" ||
            activeSection === "theme") && (
            <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                <Save size={12} />{" "}
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />
    </div>
  );
}