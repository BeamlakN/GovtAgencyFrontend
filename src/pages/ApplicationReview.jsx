import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { getApplicationsGroupedByService, getApplicationsByType } from "@/api/transportService";
import { toastError } from "@/components/ui/toast";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "submitted":
      return "bg-blue-100 text-blue-700";
    case "under_review":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const paymentStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const [serviceId, setServiceId] = useState(null);
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
          setServiceId(service.service_id);
          
          const applicationsData = await getApplicationsByType(service.service_id);
          
          let apps = [];
          if (Array.isArray(applicationsData)) {
            apps = applicationsData;
          } else if (applicationsData?.applications && Array.isArray(applicationsData.applications)) {
            apps = applicationsData.applications;
          } else if (applicationsData?.data && Array.isArray(applicationsData.data)) {
            apps = applicationsData.data;
          } else {
            apps = [];
          }
          
          setApplications(apps);
          setFilteredApplications(apps);
        } else {
          setServiceName(typeFromUrl.replaceAll("_", " "));
          setApplications([]);
          setFilteredApplications([]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        toastError(err?.response?.data?.error || err.message || "Failed to load applications.");
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
        (app.citizen_name || app.applicant_name || "Citizen").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.citizen_fin || app.fin || "").includes(searchTerm)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => 
        (app.application_status || app.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    if (paymentFilter !== "all") {
      filtered = filtered.filter(app => 
        (app.payment_status || "").toLowerCase() === paymentFilter.toLowerCase()
      );
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.submitted_at || 0);
      const dateB = new Date(b.created_at || b.submitted_at || 0);
      return dateSort === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredApplications(filtered);
  }, [searchTerm, statusFilter, paymentFilter, dateSort, applications]);

  const handleReview = (applicationId) => {
    sessionStorage.setItem(`app_${applicationId}_type`, typeFromUrl);
    navigate(`/applications/${applicationId}/review?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  if (!typeFromUrl) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
          <p className="text-slate-500">Please select an application type from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by applicant name or FIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
          >
            <option value="all">All Payment</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={dateSort}
            onChange={(e) => setDateSort(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <div className="text-sm text-slate-500">
          Showing {filteredApplications.length} of {applications.length} applications
        </div>
      </div>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {loading && <p className="text-sm text-slate-500 p-8 text-center">Loading applications...</p>}
        {!loading && filteredApplications.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No {serviceName.toLowerCase()} applications found.</p>
          </div>
        )}

        {!loading && filteredApplications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide text-[11px]">
                <tr>
                  <th className="px-3 py-3 text-left">Applicant</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-left">Payment</th>
                  <th className="px-3 py-3 text-left">Submitted</th>
                  <th className="px-3 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredApplications.map((item) => {
                  const submitDate = item.created_at || item.submitted_at;
                  const isNew = submitDate && new Date(submitDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{item.citizen_name || item.applicant_name || "Citizen"}</div>
                        <div className="text-xs text-slate-500">{item.citizen_fin || item.fin || "N/A"}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.application_status || item.status)}`}>
                          {item.application_status || item.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusBadgeClass(item.payment_status)}`}>
                          {item.payment_status || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{formatDate(submitDate)}</span>
                          {isNew && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleReview(item.id)}
                          className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
