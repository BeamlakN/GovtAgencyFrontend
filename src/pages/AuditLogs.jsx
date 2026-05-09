import { useEffect, useState } from "react";
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  User, 
  FileText, 
  Settings, 
  Wrench,
  Filter,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  X
} from "lucide-react";
import { getAuditLogs } from "@/api/transportService";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Megaphone, MessageSquare } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFullDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getActionConfig = (action) => {
  const configs = {
    create: { icon: "✨", color: "emerald", label: "Created", bgClass: "bg-emerald-50", textClass: "text-emerald-700" },
    update: { icon: "✏️", color: "blue", label: "Updated", bgClass: "bg-blue-50", textClass: "text-blue-700" },
    delete: { icon: "🗑️", color: "red", label: "Deleted", bgClass: "bg-red-50", textClass: "text-red-700" },
    status_change: { icon: "🔄", color: "amber", label: "Status Changed", bgClass: "bg-amber-50", textClass: "text-amber-700" },
    review: { icon: "👁️", color: "purple", label: "Reviewed", bgClass: "bg-purple-50", textClass: "text-purple-700" },
    login: { icon: "🔐", color: "indigo", label: "Logged In", bgClass: "bg-indigo-50", textClass: "text-indigo-700" },
    logout: { icon: "🚪", color: "gray", label: "Logged Out", bgClass: "bg-gray-50", textClass: "text-gray-700" },
    upload: { icon: "📎", color: "orange", label: "Uploaded", bgClass: "bg-orange-50", textClass: "text-orange-700" },
    comment: { icon: "💬", color: "pink", label: "Commented", bgClass: "bg-pink-50", textClass: "text-pink-700" },
  };
  return configs[action?.toLowerCase()] || { icon: "📝", color: "slate", label: action || "Action", bgClass: "bg-slate-50", textClass: "text-slate-700" };
};

const getTypeConfig = (type) => {
  const configs = {
    application: { icon: FileText, color: "blue", label: "Application" },
    user: { icon: User, color: "green", label: "User" },
    staff: { icon: User, color: "green", label: "Staff" },
    service: { icon: Wrench, color: "purple", label: "Service" },
    announcement: { icon: Megaphone, color: "yellow", label: "Announcement" },
    comment: { icon: MessageSquare, color: "pink", label: "Comment" },
    setting: { icon: Settings, color: "gray", label: "Setting" },
    login: { icon: Shield, color: "indigo", label: "Security" },
  };
  return configs[type?.toLowerCase()] || { icon: Activity, color: "slate", label: type || "General" };
};

function DetailModal({ log, onClose }) {
  const actionConfig = getActionConfig(log.action);
  const typeConfig = getTypeConfig(log.log_type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Audit Log Details</h2>
            <p className="text-sm text-slate-500 mt-1">Detailed information about this activity</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Log ID</p>
              <p className="text-sm font-mono text-slate-900">{log.id}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Timestamp</p>
              <p className="text-sm text-slate-900">{formatFullDateTime(log.created_at)}</p>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Admin Information
            </h3>
            <div className="space-y-2">
              <p><strong className="text-slate-600">Name:</strong> {log.admin_name || log.changed_by || "Unknown"}</p>
              {log.admin_email && <p><strong className="text-slate-600">Email:</strong> {log.admin_email}</p>}
              {log.admin_role && <p><strong className="text-slate-600">Role:</strong> {log.admin_role}</p>}
            </div>
          </div>

          {/* Action Info */}
          <div className="bg-gradient-to-r from-amber-50 to-white rounded-xl p-4 border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Action Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${actionConfig.bgClass} flex items-center justify-center`}>
                  <span className="text-sm">{actionConfig.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{actionConfig.label}</p>
                  <p className="text-xs text-slate-500">Action Type</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  {TypeIcon && <TypeIcon className="h-4 w-4 text-slate-600" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{typeConfig.label}</p>
                  <p className="text-xs text-slate-500">Entity Type</p>
                </div>
              </div>
            </div>
          </div>

          {/* Entity Info */}
          {(log.entity_name || log.entity_id) && (
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Entity Information
              </h3>
              <div className="space-y-2">
                {log.entity_name && <p><strong className="text-slate-600">Name:</strong> {log.entity_name}</p>}
                {log.entity_id && <p><strong className="text-slate-600">ID:</strong> <span className="font-mono">{log.entity_id}</span></p>}
              </div>
            </div>
          )}

          {/* Status Change (if applicable) */}
          {log.action === "status_change" && (log.old_status || log.new_status) && (
            <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-4 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-700 mb-3">Status Change</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">Previous</p>
                  <span className="inline-flex rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
                    {log.old_status?.replace(/_/g, ' ') || "Unknown"}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">New</p>
                  <span className="inline-flex rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                    {log.new_status?.replace(/_/g, ' ') || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Comment Text (if applicable) */}
          {log.action === "comment" && log.comment_text && (
            <div className="bg-gradient-to-r from-pink-50 to-white rounded-xl p-4 border border-pink-200">
              <h3 className="text-sm font-semibold text-pink-700 mb-3">Comment</h3>
              <p className="text-slate-700 italic">"{log.comment_text}"</p>
            </div>
          )}

          {/* Notes */}
          {log.action_notes && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Additional Notes</h3>
              <p className="text-slate-600">{log.action_notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const hasPrevious = offset > 0;
  const hasNext = count === null ? false : offset + limit < count;
  const totalPages = count ? Math.ceil(count / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAuditLogs({ limit, offset });
      setLogs(Array.isArray(response.data) ? response.data : []);
      setCount(typeof response.count === "number" ? response.count : null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [limit, offset]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesType = selectedType === "all" || log.log_type?.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch = !searchTerm || 
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== "all" && log.created_at) {
      const logDate = new Date(log.created_at);
      const now = new Date();
      const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);
      if (dateRange === "today") matchesDate = daysDiff < 1;
      else if (dateRange === "week") matchesDate = daysDiff < 7;
      else if (dateRange === "month") matchesDate = daysDiff < 30;
    }
    
    return matchesType && matchesSearch && matchesDate;
  });

  // Get unique log types for filter
  const logTypes = ["all", ...new Set(logs.map(log => log.log_type).filter(Boolean))];

  const handleRefresh = () => {
    loadLogs();
  };

  const handleExport = () => {
    const csvData = filteredLogs.map(log => ({
      Timestamp: formatDate(log.created_at),
      Admin: log.admin_name || log.changed_by || "Unknown",
      Type: log.log_type || "-",
      Action: log.action || "-",
      Details: log.action_notes || log.entity_name || ""
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvRows = [headers.join(',')];
    csvRows.push(...csvData.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(',')));
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Detail Modal */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by admin, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
            >
              {logTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-slate-500">
        Showing {filteredLogs.length} of {count?.toLocaleString() || 0} records
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="w-full">
            <THead>
              <TR className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <TH className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</TH>
                <TH className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin</TH>
                <TH className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</TH>
                <TH className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</TH>
                <TH className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</TH>
              </TR>
            </THead>
            <TBody>
              {loading && (
                <TR>
                  <TD colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                      <p className="text-sm text-slate-500">Loading audit logs...</p>
                    </div>
                  </TD>
                </TR>
              )}

              {!loading && filteredLogs.length === 0 && (
                <TR>
                  <TD colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Activity size={40} className="text-slate-300" />
                      <p className="text-sm text-slate-500">No audit log entries found</p>
                    </div>
                  </TD>
                </TR>
              )}

              {!loading && filteredLogs.map((log, index) => {
                const actionConfig = getActionConfig(log.action);
                const typeConfig = getTypeConfig(log.log_type);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <TR 
                    key={log.id} 
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <TD className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-sm text-slate-600">{formatDate(log.created_at)}</span>
                      </div>
                    </TD>
                    <TD className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {log.admin_name || log.changed_by || "Unknown"}
                          </p>
                          {log.admin_email && (
                            <p className="text-xs text-slate-500">{log.admin_email}</p>
                          )}
                        </div>
                      </div>
                    </TD>
                    <TD className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                        <TypeIcon size={12} />
                        {typeConfig.label}
                      </div>
                    </TD>
                    <TD className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                        <span>{actionConfig.icon}</span>
                        {actionConfig.label}
                      </div>
                    </TD>
                    <TD className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs hover:bg-slate-800 transition-colors"
                      >
                        <Eye size={12} />
                        View Details
                      </button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Page <span className="font-medium text-slate-900">{currentPage}</span> of{' '}
              <span className="font-medium text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={!hasPrevious}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={!hasNext}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}