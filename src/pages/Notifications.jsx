import { useEffect, useState } from "react";
import {
  Trash2,
  Send,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  Bell,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  CreditCard,
  Truck,
  User,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  deleteNotification,
  sendNotification,
} from "@/api/transportService";
import { toastSuccess, toastError } from "@/components/ui/toast";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 100 });
      console.log("Loaded notifications:", data);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      toastError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || notif.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Test function to verify click works
  const handleClick = (notification, e) => {
    console.log("✅ NOTIFICATION CLICKED!", notification);
    console.log("Notification type:", notification.type);
    console.log("Notification data:", notification);
    
    // Test navigation first
    // navigate("/dashboard");
    
    const type = notification.type;
    const targetId = notification.targetId || notification.entityId || notification.applicationId;
    
    if (type === "application" || type === "application_submitted" || type === "application_review") {
      if (targetId) {
        console.log("Navigating to:", `/applications/${targetId}/review`);
        navigate(`/applications/${targetId}/review`);
      } else {
        console.log("Navigating to: /applications");
        navigate("/applications");
      }
    } 
    else if (type === "comment" || type === "new_comment") {
      if (targetId) {
        console.log("Navigating to:", `/applications/${targetId}/review`);
        navigate(`/applications/${targetId}/review`);
      } else {
        console.log("Navigating to: /applications");
        navigate("/applications");
      }
    }
    else if (type === "suggestion" || type === "feedback") {
      if (targetId) {
        console.log("Navigating to:", `/suggestions/${targetId}`);
        navigate(`/suggestions/${targetId}`);
      } else {
        console.log("Navigating to: /suggestions");
        navigate("/suggestions");
      }
    }
    else if (type === "announcement") {
      console.log("Navigating to: /announcements");
      navigate("/announcements");
    }
    else if (type === "staff") {
      console.log("Navigating to: /staff");
      navigate("/staff");
    }
    else if (type === "service") {
      console.log("Navigating to: /services");
      navigate("/services");
    }
    else if (type === "license") {
      console.log("Navigating to: /license-onboarding");
      navigate("/license-onboarding");
    }
    else {
      console.log("Default navigation to: /dashboard");
      navigate("/dashboard");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Delete clicked for:", id);
    if (!window.confirm("Delete this notification?")) return;

    try {
      setDeleting(id);
      await deleteNotification(id);
      toastSuccess("Notification deleted");
      loadNotifications();
    } catch (err) {
      console.error("Delete failed:", err);
      toastError("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleSend = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Send clicked for:", id);
    try {
      await sendNotification(id);
      toastSuccess("Notification sent");
      loadNotifications();
    } catch (err) {
      console.error("Send failed:", err);
      toastError("Failed to send");
    }
  };

  const getStatusIcon = (status) => {
    if (status === "sent") return <CheckCircle className="text-green-500" size={16} />;
    if (status === "scheduled") return <Clock className="text-blue-500" size={16} />;
    return <AlertCircle className="text-slate-400" size={16} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      application: "bg-purple-100 text-purple-700",
      comment: "bg-pink-100 text-pink-700",
      suggestion: "bg-amber-100 text-amber-700",
      announcement: "bg-indigo-100 text-indigo-700",
      staff: "bg-slate-100 text-slate-700",
      payment: "bg-emerald-100 text-emerald-700",
      license: "bg-cyan-100 text-cyan-700",
      message: "bg-teal-100 text-teal-700",
    };
    return colors[type] || "bg-blue-100 text-blue-700";
  };

  const getTypeIcon = (type) => {
    if (type === "application") return <FileText size={16} />;
    if (type === "comment") return <MessageSquare size={16} />;
    if (type === "suggestion") return <MessageSquare size={16} />;
    if (type === "announcement") return <Bell size={16} />;
    if (type === "staff") return <Users size={16} />;
    if (type === "payment") return <CreditCard size={16} />;
    if (type === "license") return <Truck size={16} />;
    return <Bell size={16} />;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-slate-500 mt-3">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 mt-1">Click any notification to view related content</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
        </select>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Bell size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={(e) => handleClick(notification, e)}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(notification.status)}
                        <span className="text-xs text-slate-500 capitalize">{notification.status}</span>
                      </div>
                      {notification.status === "draft" && (
                        <button
                          onClick={(e) => handleSend(notification.id, e)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        disabled={deleting === notification.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {notification.recipientRole === "all" ? "All Users" : notification.recipientRole}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {getTimeAgo(notification.created_at)}
                    </span>
                    <span className="capitalize">{notification.type}</span>
                    <span className="ml-auto flex items-center gap-1">
                      Click to view <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}