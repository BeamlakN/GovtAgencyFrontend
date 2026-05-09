import { useEffect, useState } from "react";
import { Activity, Building2, ChevronDown, FileText, Home, LogOut, Settings, Users, Wrench, BarChart3, IdCard, MessageSquare } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getTransportServices } from "@/api/transportService";

const SERVICES_UPDATED_EVENT = "agency-services-updated";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showApplications, setShowApplications] = useState(true);
  const [applicationItems, setApplicationItems] = useState([]);
  const [selectedApplicationType, setSelectedApplicationType] = useState(null);

  const loadApplicationItems = async () => {
    try {
      // Fetch actual registered services from the database
      const services = await getTransportServices();

      
      // Transform services into application items
      const items = (services || []).map((service) => {
        // Get the service name (priority: service_name, name, or fallback)
        const serviceName = service.service_name || service.name || "";
        // Create a key from the service name (lowercase with underscores)
        const key = serviceName.toLowerCase().replace(/ /g, "_");
        
        return {
          id: service.id || service._id || service.service_id,
          key: key,
          label: serviceName,
        };
      });
      
      setApplicationItems(items);
    } catch (error) {
      console.error("Failed to load services for sidebar:", error);
      setApplicationItems([]);
    }
  };

  useEffect(() => {
    loadApplicationItems();
    const onUpdated = () => loadApplicationItems();
    window.addEventListener(SERVICES_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(SERVICES_UPDATED_EVENT, onUpdated);
  }, []);

  // Determine which application type should be highlighted based on current path
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    // If we're on the applications list page, get the type from URL params
    if (path === "/applications") {
      const typeFromUrl = searchParams.get("type");
      setSelectedApplicationType(typeFromUrl);
    } 
    // If we're on an application review page, extract the service type from the application data
    else if (path.match(/^\/applications\/[^/]+\/review$/)) {
      const storedType = sessionStorage.getItem(`app_${path.split('/')[2]}_type`);
      if (storedType) {
        setSelectedApplicationType(storedType);
      }
    }
    // For other pages, clear the selected application type
    else {
      setSelectedApplicationType(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Function to check if an application link is active
  const isApplicationActive = (itemKey) => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    // Check if we're on the applications list page with matching type
    if (path === "/applications" && searchParams.get("type") === itemKey) {
      return true;
    }
    
    // Check if we're on a review page for this type
    if (path.match(/^\/applications\/[^/]+\/review$/)) {
      return selectedApplicationType === itemKey;
    }
    
    return false;
  };

  return (
    <aside className="fixed top-0 left-0 w-72 h-full bg-slate-900 text-slate-100 border-r border-slate-800 p-6 flex flex-col overflow-y-auto z-30">
      <div className="mb-8 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Building2 size={30} className="text-slate-200" />
        </div>
        <h1 className="text-2xl font-semibold mt-3">Transport Agency Dashboard</h1>
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <Home size={18} /> Dashboard
        </NavLink>

        <NavLink
          to="/staff"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <Users size={18} /> Staff
        </NavLink>

        <NavLink
          to="/services"
          className={({ isActive }) =>
            `w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <span className="flex items-center gap-3">
            <Wrench size={18} /> Services
          </span>
        </NavLink>

        <NavLink
          to="/announcements"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <span className="flex items-center gap-3">
            <FileText size={18} /> Announcements
          </span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <BarChart3 size={18} /> Analytics
        </NavLink>

        {/* Suggestions & Feedback Link */}
        <NavLink
          to="/suggestions"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <MessageSquare size={18} /> Suggestions & Feedback
        </NavLink>

        {/* License Onboarding Link */}
        <NavLink
          to="/license-onboarding"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <IdCard size={18} /> License Onboarding
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <span className="flex items-center gap-3">
            <Settings size={18} /> Settings
          </span>
        </NavLink>

        <NavLink
          to="/audit-logs"
          className={({ isActive }) =>
            `w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <Activity size={18} /> Audit Logs
        </NavLink>

        <div className="rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setShowApplications((prev) => !prev)}
            className={`w-full text-left flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
              location.pathname.startsWith("/applications")
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <FileText size={18} />
              Applications
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showApplications ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {showApplications && (
            <div className="px-2 pb-2 space-y-1">
              {applicationItems.length === 0 ? (
                <div className="text-slate-400 text-xs px-3 py-2">
                  No services registered
                </div>
              ) : (
                applicationItems.map((item) => {
                  const isActive = isApplicationActive(item.key);
                  return (
                    <Link
                      key={item.id || item.key}
                      to={`/applications?type=${item.key}`}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors capitalize ${
                        isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="pt-6 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}