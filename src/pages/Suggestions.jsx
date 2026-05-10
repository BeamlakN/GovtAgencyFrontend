import { useEffect, useState } from "react";
import { MessageSquare, Search, Eye, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSuggestions } from "@/api/transportService";
import { toastError } from "@/components/ui/toast";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

const statusBadgeClass = (status) => {
  switch (status) {
    case "responded": return "bg-emerald-100 text-emerald-700";
    case "pending": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "responded": return "Responded";
    case "pending": return "Pending";
    default: return status || "Unknown";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const diffMins = Math.floor((new Date() - date) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const Suggestions = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadSuggestions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSuggestions({ limit: 100, offset: 0 });
      setSuggestions(Array.isArray(response?.suggestions || response) ? (response?.suggestions || response) : []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuggestions(); }, []);

  useEffect(() => {
    let filtered = [...suggestions];
    if (searchTerm) {
      filtered = filtered.filter(s =>
        (s.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.citizen_name || s.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.citizen_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.citizen_fin || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") filtered = filtered.filter(s => s.status === filterStatus);
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setFilteredSuggestions(filtered);
  }, [suggestions, searchTerm, filterStatus]);

  const handleViewDetails = (suggestionId) => navigate(`/suggestions/${suggestionId}`);

  return (
    <div className="p-5 space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="all">All</option><option value="pending">Pending</option><option value="responded">Responded</option>
        </select>
      </div>

      <div className="text-xs text-slate-500">{filteredSuggestions.length} of {suggestions.length}</div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}

      {loading && (
        <div className="rounded-lg border p-8 text-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading...</p>
        </div>
      )}

      {!loading && filteredSuggestions.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600">Citizen</th><th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600">Subject</th><th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600">Status</th><th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600">Submitted</th><th className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600"></th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredSuggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <div><p className="font-medium text-slate-800 text-xs">{s.citizen_name || s.user_name || "Anonymous"}</p><p className="text-[9px] text-slate-400">{s.citizen_email || "No email"}</p></div>
                    </td>
                    <td className="px-2 py-2"><p className="text-xs font-medium text-slate-800">{s.subject || "No Subject"}</p></td>
                    <td className="px-2 py-2"><span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusBadgeClass(s.status)}`}>{s.status === "responded" ? <CheckCircle size={9} /> : <Clock size={9} />}{statusLabel(s.status)}</span></td>
                    <td className="px-2 py-2"><span className="text-xs text-slate-500">{formatDate(s.created_at)}</span></td>
                    <td className="px-2 py-2 text-center"><button onClick={() => handleViewDetails(s.id)} className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-slate-900 text-white text-[10px] hover:bg-slate-800"><Eye size={10} />View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredSuggestions.length === 0 && (
        <div className="rounded-lg border bg-slate-50 p-8 text-center">
          <MessageSquare size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No suggestions found.</p>
        </div>
      )}
    </div>
  );
};

export default Suggestions;