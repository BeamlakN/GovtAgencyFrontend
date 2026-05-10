import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { getApplicationsGroupedByService, getApplicationsByType } from "@/api/transportService";
import { toastError } from "@/components/ui/toast";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved": return "bg-emerald-100 text-emerald-700";
    case "rejected": return "bg-red-100 text-red-700";
    case "submitted": return "bg-blue-100 text-blue-700";
    case "under_review": return "bg-purple-100 text-purple-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const paymentStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "paid": return "bg-emerald-100 text-emerald-700";
    case "pending": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function Applications() {
  const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateSort, setDateSort] = useState("newest");
  const [serviceName, setServiceName] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!typeFromUrl) { 
        setLoading(false); 
        return; 
      }
      setLoading(true);
      try {
        const groupedData = await getApplicationsGroupedByService();
        const service = groupedData.find(s => 
          s.service_name?.toLowerCase().replace(/ /g, "_") === typeFromUrl.toLowerCase() ||
          s.service_id === typeFromUrl
        );
        if (service) {
          setServiceName(service.service_name);
          const appsData = await getApplicationsByType(service.service_id);
          let apps = [];
          if (Array.isArray(appsData)) apps = appsData;
          else if (appsData?.applications) apps = appsData.applications;
          else if (appsData?.data) apps = appsData.data;
          setApplications(apps);
          setFilteredApplications(apps);
        } else {
          setApplications([]);
          setFilteredApplications([]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        toastError("Failed to load applications.");
        setApplications([]);
        setFilteredApplications([]);
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [typeFromUrl]);

  useEffect(() => {
    let filtered = [...applications];
    if (searchTerm) {
      filtered = filtered.filter(app => 
        (app.citizen_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.citizen_fin || "").includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => (app.application_status || "").toLowerCase() === statusFilter);
    }
    if (paymentFilter !== "all") {
      filtered = filtered.filter(app => (app.payment_status || "").toLowerCase() === paymentFilter);
    }
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });
    setFilteredApplications(filtered);
  }, [searchTerm, statusFilter, paymentFilter, dateSort, applications]);

  const handleReview = (id) => {
    sessionStorage.setItem(`app_${id}_type`, typeFromUrl);
    navigate(`/applications/${id}/review?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  if (!typeFromUrl) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">Select an application type from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4 bg-slate-50 min-h-screen">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or FIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select 
          value={paymentFilter} 
          onChange={(e) => setPaymentFilter(e.target.value)} 
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="all">All Payment</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <select 
          value={dateSort} 
          onChange={(e) => setDateSort(e.target.value)} 
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Summary */}
      <div className="text-xs text-slate-500">
        Showing {filteredApplications.length} of {applications.length} applications
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto mb-2"></div>
            <p className="text-sm text-slate-500">Loading applications...</p>
          </div>
        )}
        {!loading && filteredApplications.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No {serviceName.toLowerCase()} applications found.
          </div>
        )}
        {!loading && filteredApplications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Applicant</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Payment</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Submitted</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((item) => {
                  const submitDate = item.created_at;
                  const isNew = submitDate && new Date(submitDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{item.citizen_name || "Citizen"}</div>
                        <div className="text-xs text-slate-400">{item.citizen_fin || "N/A"}</div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(item.application_status)}`}>
                          {item.application_status || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusBadgeClass(item.payment_status)}`}>
                          {item.payment_status || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-xs">{formatDate(submitDate)}</span>
                          {isNew && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">New</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <button 
                          onClick={() => handleReview(item.id)} 
                          className="rounded-md bg-slate-900 text-white px-3 py-1 text-xs font-medium hover:bg-slate-800 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr> // Corrected from <tr> to </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}