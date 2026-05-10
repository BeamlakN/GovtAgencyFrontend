import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Users, FileText, Clock, CheckCircle, 
  Activity, TrendingUp, Zap, Award, 
  ArrowUpRight, ChevronRight
} from "lucide-react";

// API Imports
import { getAgencyStaff } from "@/api/agencyService";
import { getApplications, getTransportStats, getDetailedAnalytics } from "@/api/transportService";

// UI Components
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Helper Component
const MetricGradientCard = ({ title, value, icon: Icon, description, color, trend }) => (
  <div className={`rounded-xl bg-gradient-to-br ${color} p-4 text-white shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] opacity-90 uppercase tracking-wider font-bold">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-medium">
              <ArrowUpRight size={10} /> {trend}
            </span>
          )}
          <span className="text-[10px] opacity-80 font-medium">{description}</span>
        </div>
      </div>
      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("am") ? "am-ET" : "en-US";
  const [staff, setStaff] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [detailed, setDetailed] = useState(null);
  const [appSearchTerm, setAppSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, appData, statsData, detailedData] = await Promise.all([
        getAgencyStaff(),
        getApplications(),
        getTransportStats(),
        getDetailedAnalytics().catch(() => null)
      ]);
      
      setStaff(Array.isArray(staffData) ? staffData : []);
      setApplications(Array.isArray(appData) ? appData : []);
      setStats(statsData);
      setDetailed(detailedData);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalApps = stats?.total_apps ?? applications.length;
  const approvedApps = stats?.total_approved ?? applications.filter(a => a.application_status === "approved").length;
  const approvalRate = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : 0;
  
  const filteredApps = useMemo(() => 
    applications.filter(app => 
      (app.citizen_name || "").toLowerCase().includes(appSearchTerm.toLowerCase()) ||
      (app.service_type || "").toLowerCase().includes(appSearchTerm.toLowerCase())
    ).slice(0, 10)
  , [applications, appSearchTerm]);

  const applicationTrendData = useMemo(() => {
    const rawData = detailed?.monthlyTrend || detailed?.monthly_trend || detailed?.applicationsOverTime || [];
    if (rawData.length) {
      return rawData.map(item => ({
        date: item.month || item.date || item.label || item.day,
        count: item.count || item.value || 0
      }));
    }
    return [];
  }, [detailed]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">{t("common.loading")}</p>
      </div>
    </div>
  );

  return (
    <div className="p-5 space-y-5 bg-slate-50/50 min-h-screen">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricGradientCard title={t("dashboard.totalRevenue")} value={formatCurrency(stats?.revenue || 0)} icon={Activity} color="from-sky-600 to-sky-700" description={t("dashboard.grossEarnings")} trend="+8.2%" />
        <MetricGradientCard title={t("dashboard.totalApps")} value={formatNumber(totalApps, numberLocale)} icon={FileText} color="from-indigo-600 to-indigo-700" description={t("dashboard.cumulative")} trend="+12%" />
        <MetricGradientCard title={t("dashboard.processing")} value={t("dashboard.days", { count: detailed?.avgProcessingDays || 0 })} icon={Clock} color="from-cyan-600 to-cyan-700" description={t("dashboard.avgTurnaround")} />
        <MetricGradientCard title={t("dashboard.approvalRate")} value={`${approvalRate}%`} icon={CheckCircle} color="from-emerald-600 to-emerald-700" description={t("dashboard.successRate")} />
      </div>

      {/* Middle Section: Chart + Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800">{t("dashboard.applicationTrend")}</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} /> {t("dashboard.growth")}
            </div>
          </div>
          <div className="h-[280px]">
            {applicationTrendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={applicationTrendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">{t("dashboard.noTrendData")}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Award className="text-amber-500" size={18} /> {t("dashboard.topServices")}
          </h2>
          <div className="space-y-3">
            {(detailed?.topServices || []).slice(0, 8).map((service, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{service.service}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{service.applications} {t("dashboard.appsShort")}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">{t("dashboard.recentApplications")}</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredApps.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm font-medium">{t("dashboard.noResults")}</div>
            ) : (
              filteredApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                      app.application_status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">{app.service_type}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{app.citizen_name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold capitalize px-2 py-1 rounded-full ${
                     app.application_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {app.application_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" size={18} /> {t("dashboard.teamAvailability")}
          </h2>
          <div className="overflow-hidden">
            <Table>
              <THead>
                <TR className="bg-slate-50">
                  <TH className="text-[10px] font-bold uppercase py-3 text-slate-500">{t("dashboard.member")}</TH>
                  <TH className="text-[10px] font-bold uppercase py-3 text-slate-500 text-right">{t("dashboard.role")}</TH>
                </TR>
              </THead>
              <TBody>
                {staff.slice(0, 8).map((s) => (
                  <TR key={s.id || s._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <TD className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 uppercase shadow-sm">
                          {s.name?.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800">{s.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium truncate">{s.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="py-3 text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 uppercase tracking-wide">
                        {s.role === "super_admin" ? t("dashboard.super") : s.role}
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formatting Helpers
function formatNumber(num, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(num || 0);
}

function formatCurrency(amount) { 
  return new Intl.NumberFormat('en-ET', { 
    style: 'currency', 
    currency: 'ETB', 
    minimumFractionDigits: 0 
  }).format(amount || 0); 
}