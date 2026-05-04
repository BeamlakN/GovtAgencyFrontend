import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getApplicationsGroupedByService, getApplicationsByType } from "@/api/transportService";
import { toastError } from "@/components/ui/toast";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "paid":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "submitted":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Applications() {
  const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type");
  const [applications, setApplications] = useState([]);
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
        } else {
          setServiceName(typeFromUrl.replaceAll("_", " "));
          setApplications([]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        toastError(err?.response?.data?.error || err.message || "Failed to load applications.");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [typeFromUrl]);

  const handleReview = (applicationId) => {
    // Store the application type in sessionStorage for the sidebar to read
    sessionStorage.setItem(`app_${applicationId}_type`, typeFromUrl);
    navigate(`/applications/${applicationId}/review?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  if (!typeFromUrl) {
    return (
      <div className="p-8 space-y-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
          <p className="text-slate-500">Please select an application type from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{serviceName} Applications</h1>
        <p className="text-slate-500 mt-1">View and manage all {serviceName.toLowerCase()} applications</p>
      </div>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 overflow-x-auto">
        {loading && <p className="text-sm text-slate-500">Loading applications...</p>}
        {!loading && applications.length === 0 && (
          <p className="text-sm text-slate-500">No {serviceName.toLowerCase()} applications found.</p>
        )}

        {!loading && applications.length > 0 && (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide text-[11px]">
              <tr>
                <th className="px-4 py-3 text-left">Applicant</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {applications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{item.citizen_name || item.applicant_name || "Citizen"}</div>
                    <div className="text-xs text-slate-500">{item.citizen_fin || item.fin || "N/A"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.application_status || item.status)}`}>
                      {item.application_status || item.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{item.payment_status || "N/A"}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">{formatDate(item.created_at || item.submitted_at)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleReview(item.id)}
                      className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}