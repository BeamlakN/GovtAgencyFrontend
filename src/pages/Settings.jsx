import { useState, useEffect } from "react";
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
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
  });

  const [languageSettings, setLanguageSettings] = useState({
    language: "en",
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: "system",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      toastError("Failed to load profile data");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      await updateProfile(updatedData);
      await loadProfile();
      toastSuccess("Profile updated successfully!");
    } catch (err) {
      toastError("Failed to update profile");
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
      toastError("Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotificationId) {
        await updateNotification(editingNotificationId, notificationFormData);
        toastSuccess("Notification updated");
      } else {
        await createNotification(notificationFormData);
        toastSuccess("Notification created");
      }
      resetNotificationForm();
      loadNotificationsData();
    } catch (err) {
      toastError("Action failed");
    }
  };

  const resetNotificationForm = () => {
    setNotificationFormData({ title: "", message: "", type: "info", recipientRole: "all", status: "draft" });
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
    if (!window.confirm("Delete this notification?")) return;
    try {
      setDeletingNotification(id);
      await deleteNotification(id);
      toastSuccess("Notification deleted");
      loadNotificationsData();
    } catch (err) {
      toastError("Delete failed");
    } finally {
      setDeletingNotification(null);
    }
  };

  const handleSendNotification = async (id) => {
    try {
      await sendNotification(id);
      toastSuccess("Notification sent successfully");
      loadNotificationsData();
    } catch (err) {
      toastError("Send failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toastSuccess("Settings saved successfully!");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "language", label: "Language", icon: Languages },
    { id: "theme", label: "Theme", icon: Palette },
  ];

  const getTypeColor = (type) => {
    const colors = { 
      info: "bg-blue-50 text-blue-700 border-blue-200", 
      warning: "bg-amber-50 text-amber-700 border-amber-200", 
      error: "bg-red-50 text-red-700 border-red-200", 
      success: "bg-emerald-50 text-emerald-700 border-emerald-200" 
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

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Tabs Navigation - No Header Title */}
        <div className="mb-8">
          <div className="border-b border-slate-200 bg-white rounded-t-2xl px-6">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 ${
                      isActive
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div>
              {loadingProfile ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : profile && (
                <>
                  {/* Profile Header */}
                  <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-10">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-bold text-white">{getInitials(profile.name)}</span>
                        </div>
                        <button
                          onClick={() => setShowEditProfileModal(true)}
                          className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors"
                        >
                          <Pencil size={14} className="text-slate-600" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-white/20 text-xs font-medium text-white">
                            {profile.role === "super_admin" ? "Super Administrator" : "Agency Administrator"}
                          </span>
                          <span className="text-sm text-slate-300">•</span>
                          <span className="text-sm text-slate-300">ID: {profile.id?.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information Grid */}
                  <div className="p-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{profile.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Mail size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Phone size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Phone Number</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{profile.phone_number || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Building2 size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Bureau</p>
                          <p className="text-sm font-semibold text-slate-900 mt-0.5">{profile.bureauName || profile.bureau_name || "Not assigned"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        <Pencil size={16} />
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">System Notifications</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Create and manage broadcast notifications</p>
                </div>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Create Notification
                </button>
              </div>

              {showNotificationForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="px-6 py-4 bg-slate-900">
                      <h2 className="text-lg font-semibold text-white">
                        {editingNotificationId ? "Edit Notification" : "Create Notification"}
                      </h2>
                    </div>
                    <form onSubmit={handleNotificationSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={notificationFormData.title}
                          onChange={(e) => setNotificationFormData({ ...notificationFormData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                          placeholder="Notification title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                        <textarea
                          value={notificationFormData.message}
                          onChange={(e) => setNotificationFormData({ ...notificationFormData, message: e.target.value })}
                          rows="4"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                          placeholder="Notification message"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={resetNotificationForm} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                          {editingNotificationId ? "Update" : "Create"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loadingNotifications ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl">
                  <Bell size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id || notif._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getTypeColor(notif.type)}`}>
                            {notif.type}
                          </span>
                          <div className="flex items-center gap-1">
                            {notif.status === "sent" ? (
                              <CheckCircle size={12} className="text-emerald-500" />
                            ) : notif.status === "scheduled" ? (
                              <Clock size={12} className="text-blue-500" />
                            ) : (
                              <AlertCircle size={12} className="text-slate-400" />
                            )}
                            <span className="text-xs text-slate-500 capitalize">{notif.status}</span>
                          </div>
                        </div>
                        <p className="font-semibold text-slate-900">{notif.title}</p>
                        <p className="text-sm text-slate-600 line-clamp-1">{notif.message}</p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        {notif.status === "draft" && (
                          <>
                            <button onClick={() => handleEditNotification(notif)} className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleSendNotification(notif.id || notif._id)} className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors" title="Send">
                              <Send size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDeleteNotification(notif.id || notif._id)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
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
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Protect your account with additional security measures</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Key size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSecuritySettings(s => ({...s, twoFactorAuth: !s.twoFactorAuth}))}
                      className={`relative w-11 h-6 rounded-full transition-all ${securitySettings.twoFactorAuth ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${securitySettings.twoFactorAuth ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Clock size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Session Timeout</p>
                        <p className="text-xs text-slate-500">Automatically log out after inactivity</p>
                      </div>
                    </div>
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(s => ({...s, sessionTimeout: e.target.value}))}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language Section */}
          {activeSection === "language" && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Language Preferences</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Choose your preferred language for the dashboard</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Globe size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Interface Language</p>
                      <p className="text-xs text-slate-500">Select your display language</p>
                    </div>
                  </div>
                  <select
                    value={languageSettings.language}
                    onChange={(e) => setLanguageSettings({ language: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="en">English (US)</option>
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Theme Section */}
          {activeSection === "theme" && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Theme Preferences</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Customize the dashboard appearance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "light", label: "Light Mode", icon: Sun, description: "Bright and clean interface" },
                    { id: "dark", label: "Dark Mode", icon: Moon, description: "Easy on the eyes, low light" },
                    { id: "system", label: "System", icon: Monitor, description: "Follow device settings" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setThemeSettings({ theme: option.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        themeSettings.theme === option.id
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <option.icon size={20} className={themeSettings.theme === option.id ? "text-slate-900" : "text-slate-500"} />
                        </div>
                        <div>
                          <p className={`font-semibold ${themeSettings.theme === option.id ? "text-slate-900" : "text-slate-700"}`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button for Settings Sections */}
          {(activeSection === "security" || activeSection === "language" || activeSection === "theme") && (
            <div className="border-t border-slate-200 px-8 py-5 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />
    </div>
  );
}