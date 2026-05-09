import { useEffect, useState } from "react";
import { MessageSquare, Search, Eye, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getSuggestions,
} from "@/api/transportService";
import { toastError } from "@/components/ui/toast";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

const statusBadgeClass = (status) => {
  switch (status) {
    case "responded":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "responded":
      return "Responded";
    case "pending":
      return "Pending";
    default:
      return status || "Unknown";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
      const suggestionsData = response?.suggestions || response || [];
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

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

    if (filterStatus !== "all") {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    setFilteredSuggestions(filtered);
  }, [suggestions, searchTerm, filterStatus]);

  const handleViewDetails = (suggestionId) => {
    navigate(`/suggestions/${suggestionId}`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-4 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-slate-500">
        Showing {filteredSuggestions.length} of {suggestions.length} suggestions
        {(searchTerm || filterStatus !== "all") && " (filtered)"}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3"></div>
          <p className="text-slate-500">Loading suggestions...</p>
        </div>
      )}

      {/* Suggestions Table */}
      {!loading && filteredSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <THead>
                <TR className="bg-slate-50 border-b border-slate-200">
                  <TH className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Citizen</TH>
                  <TH className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Subject</TH>
                  <TH className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</TH>
                  <TH className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Submitted</TH>
                  <TH className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filteredSuggestions.map((suggestion) => (
                  <TR key={suggestion.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <TD className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{suggestion.citizen_name || suggestion.user_name || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{suggestion.citizen_email || suggestion.user_email || "No email"}</p>
                        {suggestion.citizen_fin && (
                          <p className="text-xs text-slate-400">ID: {suggestion.citizen_fin}</p>
                        )}
                      </div>
                    </TD>
                    <TD className="px-4 py-3">
                      <p className="text-sm text-slate-800 font-medium">{suggestion.subject || "No Subject"}</p>
                    </TD>
                    <TD className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(suggestion.status)}`}>
                        {suggestion.status === "responded" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {statusLabel(suggestion.status)}
                      </span>
                    </TD>
                    <TD className="px-4 py-3">
                      <span className="text-sm text-slate-600">{formatDate(suggestion.created_at)}</span>
                    </TD>
                    <TD className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetails(suggestion.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSuggestions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No suggestions found.</p>
          {searchTerm && (
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Suggestions;