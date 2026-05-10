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
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || notif.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleClick = (notification) => {
    const type = notification.type;
    const targetId = notification.targetId || notification.entityId || notification.applicationId;
    
    if (type === "application" || type === "application_submitted" || type === "application_review") {
      navigate(targetId ? `/applications/${targetId}/review` : "/applications");
    } else if (type === "comment" || type === "new_comment") {
      navigate(targetId ? `/applications/${targetId}/review` : "/applications");
    } else if (type === "suggestion" || type === "feedback") {
      navigate(targetId ? `/suggestions/${targetId}` : "/suggestions");
    } else if (type === "announcement") {
      navigate("/announcements");
    } else if (type === "staff") {
      navigate("/staff");
    } else if (type === "service") {
      navigate("/services");
    } else if (type === "license") {
      navigate("/license-onboarding");
    } else {
      navigate("/dashboard");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this notification?")) return;
    try {
      setDeleting(id);
      await deleteNotification(id);
      toastSuccess("Deleted");
      loadNotifications();
    } catch (err) {
      toastError("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleSend = async (id, e) => {
    e.stopPropagation();
    try {
      await sendNotification(id);
      toastSuccess("Sent");
      loadNotifications();
    } catch (err) {
      toastError("Send failed");
    }
  };

  const getStatusIcon = (status) => {
    if (status === "sent") return <CheckCircle className="text-green-500" size={12} />;
    if (status === "scheduled") return <Clock className="text-blue-500" size={12} />;
    return <AlertCircle className="text-slate-400" size={12} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      application: "bg-purple-100 text-purple-700",
      comment: "bg-pink-100 text-pink-700",
      suggestion: "bg-amber-100 text-amber-700",
      announcement: "bg-indigo-100 text-indigo-700",
      staff: "bg-slate-100 text-slate-700",
      license: "bg-cyan-100 text-cyan-700",
    };
    return colors[type] || "bg-blue-100 text-blue-700";
  };

  const getTypeIcon = (type) => {
    if (type === "application") return <FileText size={14} />;
    if (type === "comment") return <MessageSquare size={14} />;
    if (type === "announcement") return <Bell size={14} />;
    if (type === "staff") return <Users size={14} />;
    return <Bell size={14} />;
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const diffMins = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="text-xs text-slate-500 mt-0.5">Click to view related content</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 border rounded-lg text-sm"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
        </select>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Bell size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleClick(notification)}
              className="bg-white rounded-lg border p-3 hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="flex gap-3">
                <div className={`p-1.5 rounded-lg ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {getStatusIcon(notification.status)}
                        <span className="text-[10px] text-slate-500 capitalize">{notification.status}</span>
                      </div>
                      {notification.status === "draft" && (
                        <button onClick={(e) => handleSend(notification.id, e)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Send">
                          <Send size={12} />
                        </button>
                      )}
                      <button onClick={(e) => handleDelete(notification.id, e)} disabled={deleting === notification.id} className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5"><User size={10} />{notification.recipientRole === "all" ? "All" : notification.recipientRole}</span>
                    <span className="flex items-center gap-0.5"><Calendar size={10} />{getTimeAgo(notification.created_at)}</span>
                    <span className="capitalize">{notification.type}</span>
                    <span className="ml-auto flex items-center gap-0.5">Click <ChevronRight size={10} /></span>
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