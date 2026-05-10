import { useEffect, useState } from "react";
import { 
  Activity, ChevronLeft, ChevronRight, Eye, User, FileText, 
  Settings, Wrench, Filter, Calendar, Search, Download, 
  RefreshCw, Shield, AlertCircle, CheckCircle, XCircle, Clock, X
} from "lucide-react";
import { getAuditLogs } from "@/api/transportService";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Megaphone, MessageSquare } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatFullDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const getActionConfig = (action) => {
  const configs = {
    create: { icon: "✨", label: "Created", bg: "bg-emerald-50", text: "text-emerald-700" },
    update: { icon: "✏️", label: "Updated", bg: "bg-blue-50", text: "text-blue-700" },
    delete: { icon: "🗑️", label: "Deleted", bg: "bg-red-50", text: "text-red-700" },
    status_change: { icon: "🔄", label: "Status", bg: "bg-amber-50", text: "text-amber-700" },
    review: { icon: "👁️", label: "Review", bg: "bg-purple-50", text: "text-purple-700" },
    login: { icon: "🔐", label: "Login", bg: "bg-indigo-50", text: "text-indigo-700" },
    logout: { icon: "🚪", label: "Logout", bg: "bg-gray-50", text: "text-gray-700" },
    comment: { icon: "💬", label: "Comment", bg: "bg-pink-50", text: "text-pink-700" },
  };
  return configs[action?.toLowerCase()] || { icon: "📝", label: action || "Action", bg: "bg-slate-50", text: "text-slate-700" };
};

const getTypeConfig = (type) => {
  const configs = {
    application: { icon: FileText, label: "Application" },
    staff: { icon: User, label: "Staff" },
    service: { icon: Wrench, label: "Service" },
    announcement: { icon: Megaphone, label: "Announcement" },
    comment: { icon: MessageSquare, label: "Comment" },
    login: { icon: Shield, label: "Login" },
  };
  return configs[type?.toLowerCase()] || { icon: Activity, label: type || "General" };
};

function DetailModal({ log, onClose }) {
  const actionConfig = getActionConfig(log.action);
  const typeConfig = getTypeConfig(log.log_type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-base font-semibold text-slate-900">Audit Log Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4 overflow-auto max-h-[calc(85vh-70px)]">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-500 uppercase">Log ID</p><p className="text-xs font-mono mt-0.5">{log.id}</p></div>
            <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-500 uppercase">Timestamp</p><p className="text-xs mt-0.5">{formatFullDateTime(log.created_at)}</p></div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase">Admin</p>
            <p className="text-sm font-medium mt-0.5">{log.admin_name || "Unknown"}</p>
            {log.admin_email && <p className="text-xs text-slate-500 mt-0.5">{log.admin_email}</p>}
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2"><div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center"><span className="text-sm">{actionConfig.icon}</span></div><span className="text-sm font-medium">{actionConfig.label}</span></div>
            <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">{TypeIcon && <TypeIcon size={14} />}</div><span className="text-sm">{typeConfig.label}</span></div>
          </div>
          {(log.entity_name || log.entity_id) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase">Entity</p>
              {log.entity_name && <p className="text-sm font-medium mt-1">{log.entity_name}</p>}
              {log.entity_id && <p className="text-xs font-mono mt-1">{log.entity_id}</p>}
            </div>
          )}
          {log.action === "status_change" && (log.old_status || log.new_status) && (
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase mb-2">Status Change</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="bg-red-100 px-3 py-1 rounded-full">{log.old_status?.replace(/_/g, ' ') || "Unknown"}</span>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="bg-green-100 px-3 py-1 rounded-full">{log.new_status?.replace(/_/g, ' ') || "Unknown"}</span>
              </div>
            </div>
          )}
          {log.action === "comment" && log.comment_text && (
            <div className="bg-pink-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase">Comment</p>
              <p className="text-sm italic mt-1">"{log.comment_text}"</p>
            </div>
          )}
          {log.action_notes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase">Notes</p>
              <p className="text-sm mt-1">{log.action_notes}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800">Close</button>
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
  const hasNext = count ? offset + limit < count : false;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = count ? Math.ceil(count / limit) : 0;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditLogs({ limit, offset });
      setLogs(Array.isArray(response.data) ? response.data : []);
      setCount(typeof response.count === "number" ? response.count : null);
    } catch (err) {
      setError(err?.message || "Failed to load logs.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, [limit, offset]);

  const filteredLogs = logs.filter(log => {
    const matchesType = selectedType === "all" || log.log_type?.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch = !searchTerm || (log.admin_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (log.action || "").toLowerCase().includes(searchTerm.toLowerCase());
    let matchesDate = true;
    if (dateRange !== "all" && log.created_at) {
      const daysDiff = (new Date() - new Date(log.created_at)) / (1000 * 60 * 60 * 24);
      if (dateRange === "today") matchesDate = daysDiff < 1;
      else if (dateRange === "week") matchesDate = daysDiff < 7;
      else if (dateRange === "month") matchesDate = daysDiff < 30;
    }
    return matchesType && matchesSearch && matchesDate;
  });

  const logTypes = ["all", ...new Set(logs.map(l => l.log_type).filter(Boolean))];

  return (
    <div className="p-5 space-y-4">
      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border pl-9 pr-3 py-1.5 text-sm" />
          </div>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm">
            <option value="all">All Time</option><option value="today">Today</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option>
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm">
            {logTypes.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLogs} className="rounded-lg border px-3 py-1.5 text-sm"><RefreshCw size={14} /></button>
          <button onClick={() => { const csv = filteredLogs.map(l => `${l.created_at},${l.admin_name},${l.action}`).join("\n"); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `audit-logs.csv`; a.click(); URL.revokeObjectURL(blob); }} className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">Export</button>
        </div>
      </div>

      <div className="text-xs text-slate-500">{filteredLogs.length} of {count || 0} records</div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Time</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Admin</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Action</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div><p className="text-sm text-slate-500 mt-2">Loading...</p></td></tr>
              )}
              {!loading && filteredLogs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No audit logs found</td></tr>
              )}
              {!loading && filteredLogs.map((log, idx) => {
                const action = getActionConfig(log.action);
                const type = getTypeConfig(log.log_type);
                const TypeIcon = type.icon;
                return (
                  <tr key={log.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap"><div className="flex items-center gap-2"><Clock size={12} /><span>{formatDate(log.created_at)}</span></div></td>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center"><User size={12} className="text-white" /></div><div><p className="font-medium">{log.admin_name || "Unknown"}</p>{log.admin_email && <p className="text-xs text-slate-500">{log.admin_email}</p>}</div></div></td>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100"><TypeIcon size={12} />{type.label}</span></td>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100"><span>{action.icon}</span>{action.label}</span></td>
                    <td className="px-4 py-2.5"><button onClick={() => setSelectedLog(log)} className="rounded-lg bg-slate-900 text-white px-3 py-1 text-sm hover:bg-slate-800">View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t px-4 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">Page {currentPage} of {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={!hasPrevious} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"><ChevronLeft size={14} /> Prev</button>
            <button onClick={() => setOffset(offset + limit)} disabled={!hasNext} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}