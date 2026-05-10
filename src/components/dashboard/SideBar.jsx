import { useEffect, useState } from "react";
import { 
  Activity, Building2, ChevronDown, FileText, Home, LogOut, Settings, 
  Users, Wrench, BarChart3, MessageSquare, Menu,IdCard
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTransportServices } from "@/api/transportService";

const SERVICES_UPDATED_EVENT = "agency-services-updated";

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showApplications, setShowApplications] = useState(true);
  const [applicationItems, setApplicationItems] = useState([]);
  const [selectedApplicationType, setSelectedApplicationType] = useState(null);

  const loadApplicationItems = async () => {
    try {
      const services = await getTransportServices();
      const items = (services || []).map((service) => ({
        id: service.id || service._id || service.service_id,
        key: (service.service_name || service.name || "").toLowerCase().replace(/ /g, "_"),
        label: service.service_name || service.name || "",
      }));
      setApplicationItems(items);
    } catch (error) {
      setApplicationItems([]);
    }
  };

  useEffect(() => {
    loadApplicationItems();
    const onUpdated = () => loadApplicationItems();
    window.addEventListener(SERVICES_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(SERVICES_UPDATED_EVENT, onUpdated);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    if (path === "/applications") {
      setSelectedApplicationType(searchParams.get("type"));
    } else if (path.match(/^\/applications\/[^/]+\/review$/)) {
      const storedType = sessionStorage.getItem(`app_${path.split('/')[2]}_type`);
      if (storedType) setSelectedApplicationType(storedType);
    } else {
      setSelectedApplicationType(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isApplicationActive = (itemKey) => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    if (path === "/applications" && searchParams.get("type") === itemKey) return true;
    if (path.match(/^\/applications\/[^/]+\/review$/)) return selectedApplicationType === itemKey;
    return false;
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
          isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? label : ""}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!isCollapsed && <span className="text-sm">{label}</span>}
      </NavLink>
    );
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col z-30 transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      {/* Logo Section */}
      <div className={`mb-6 text-center pt-5 flex-shrink-0 ${isCollapsed ? "px-2" : "px-3"}`}>
        <div className={`mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center transition-all ${
          isCollapsed ? "h-10 w-10" : "h-12 w-12"
        }`}>
          <Building2 size={isCollapsed ? 20 : 24} className="text-slate-200" />
        </div>
        {!isCollapsed && (
          <h1 className="text-xs font-semibold mt-2">{t("nav.brand")}</h1>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-2.5 top-16 bg-slate-800 rounded-full p-1.5 border border-slate-700 hover:bg-slate-700 transition-all z-40 shadow-md"
      >
        <Menu size={12} className="text-slate-300" />
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <nav className={`space-y-1 ${isCollapsed ? "px-2" : "px-3"} pb-3`}>
          <NavItem to="/dashboard" icon={Home} label={t("nav.dashboard")} />
          <NavItem to="/staff" icon={Users} label={t("nav.staff")} />
          <NavItem to="/services" icon={Wrench} label={t("nav.services")} />
          <NavItem to="/announcements" icon={FileText} label={t("nav.announcements")} />
          <NavItem to="/analytics" icon={BarChart3} label={t("nav.analytics")} />
          <NavItem to="/suggestions" icon={MessageSquare} label={t("nav.suggestions")} />
          <NavItem to="/license-onboarding" icon={IdCard} label={t("nav.licenseOnboarding")} />
          <NavItem to="/settings" icon={Settings} label={t("nav.settings")} />
          <NavItem to="/audit-logs" icon={Activity} label={t("nav.auditLogs")} />

          {/* Applications Dropdown */}
          <div className="rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => !isCollapsed && setShowApplications((prev) => !prev)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                location.pathname.startsWith("/applications")
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              } ${isCollapsed ? "justify-center" : "justify-between"}`}
              title={isCollapsed ? t("nav.applications") : ""}
            >
              <span className="flex items-center gap-2.5">
                <FileText size={18} />
                {!isCollapsed && <span className="text-sm">{t("nav.applications")}</span>}
              </span>
              {!isCollapsed && (
                <ChevronDown size={14} className={`transition-transform ${showApplications ? "rotate-180" : "rotate-0"}`} />
              )}
            </button>

            {!isCollapsed && showApplications && (
              <div className="px-2 pb-2 space-y-0.5">
                {applicationItems.length === 0 ? (
                  <div className="text-slate-400 text-xs px-3 py-1.5">{t("nav.noServicesRegistered")}</div>
                ) : (
                  applicationItems.map((item) => (
                    <Link
                      key={item.id || item.key}
                      to={`/applications?type=${item.key}`}
                      className={`block rounded-md px-3 py-1.5 text-xs transition-colors capitalize truncate ${
                        isApplicationActive(item.key) ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Logout Button */}
      <div className={`pt-4 mt-auto flex-shrink-0 ${isCollapsed ? "px-2" : "px-3"} pb-4 border-t border-slate-800`}>
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? t("nav.logout") : ""}
        >
          <LogOut size={16} />
          {!isCollapsed && <span className="text-sm">{t("nav.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}