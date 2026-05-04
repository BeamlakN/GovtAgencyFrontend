import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Clock,
  Calendar,
  Download,
  PieChart as PieChartIcon,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from "lucide-react";
import { getTransportStats, getDetailedAnalytics } from "@/api/transportService";
import { toastError } from "@/components/ui/toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label, valuePrefix = "", valueSuffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-slate-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-slate-600">
            {entry.name}: {valuePrefix}{entry.value}{valueSuffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetailed, setLoadingDetailed] = useState(true);
  const [dateRange, setDateRange] = useState("30days");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingDetailed(true);
      
      // Load both overview and detailed stats in parallel
      const [overviewData, detailedData] = await Promise.all([
        getTransportStats(),
        getDetailedAnalytics()
      ]);
      
      setOverview(overviewData);
      setDetailed(detailedData);
    } catch (err) {
      console.error("Error loading analytics:", err);
      toastError(err?.response?.data?.error || "Failed to load analytics data");
    } finally {
      setLoading(false);
      setLoadingDetailed(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const exportToCSV = () => {
    if (!detailed) return;
    
    const csvRows = [];
    
    // Add header
    csvRows.push(['Analytics Report', new Date().toLocaleString()]);
    csvRows.push([]);
    
    // Applications by Status
    csvRows.push(['Applications by Status']);
    csvRows.push(['Status', 'Count']);
    Object.entries(detailed.applicationsByStatus || {}).forEach(([key, value]) => {
      csvRows.push([key, value]);
    });
    
    csvRows.push([]);
    
    // Applications by Service
    csvRows.push(['Applications by Service']);
    csvRows.push(['Service', 'Count']);
    Object.entries(detailed.applicationsByService || {}).forEach(([key, value]) => {
      csvRows.push([key, value]);
    });
    
    csvRows.push([]);
    
    // Revenue by Service
    csvRows.push(['Revenue by Service']);
    csvRows.push(['Service', 'Revenue']);
    Object.entries(detailed.revenueByService || {}).forEach(([key, value]) => {
      csvRows.push([key, formatCurrency(value)]);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!detailed) {
    return (
      <div className="p-8">
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const applicationsByStatusData = detailed.applicationsByStatus
    ? Object.entries(detailed.applicationsByStatus).map(([name, value]) => ({ 
        name: name.replace(/_/g, ' ').toUpperCase(), 
        value 
      }))
    : [];

  const applicationsByServiceData = detailed.applicationsByService
    ? Object.entries(detailed.applicationsByService).map(([name, value]) => ({ name, value }))
    : [];

  const revenueByServiceData = detailed.revenueByService
    ? Object.entries(detailed.revenueByService).map(([name, value]) => ({ name, revenue: value }))
    : [];

  const genderData = detailed.citizensByGender
    ? Object.entries(detailed.citizensByGender).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
    : [];

  const totalApplications = Object.values(detailed.applicationsByStatus || {}).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(detailed.revenueByService || {}).reduce((a, b) => a + b, 0);
  const totalCitizens = Object.values(detailed.citizensByGender || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Stats Cards (from existing endpoint) */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Applications"
            value={formatNumber(overview.total_apps)}
            icon={FileText}
            color="blue"
            trend="+12% from last month"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview.revenue)}
            icon={DollarSign}
            color="emerald"
            trend="+8% from last month"
          />
          <StatCard
            title="Unique Citizens"
            value={formatNumber(overview.unique_citizens)}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Approved"
            value={formatNumber(overview.total_approved)}
            icon={CheckCircle}
            color="green"
            subtitle={`${Math.round((overview.total_approved / overview.total_apps) * 100)}% approval rate`}
          />
        </div>
      )}

      {/* Second Row - Awaiting Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 uppercase tracking-wide">Awaiting Payment</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">{overview.awaiting_payment}</p>
                <p className="text-xs text-amber-600 mt-1">Pending payment confirmation</p>
              </div>
              <ClockIcon className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 uppercase tracking-wide">Awaiting Review</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{overview.awaiting_review}</p>
                <p className="text-xs text-blue-600 mt-1">Need your attention</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Applications Over Time */}
      {detailed.applicationsOverTime && detailed.applicationsOverTime.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Applications Trend</h2>
              <p className="text-sm text-slate-500 mt-1">Daily application submissions over time</p>
            </div>
            <div className="flex gap-2">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={detailed.applicationsOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Applications by Status & Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Applications by Status</h2>
          </div>
          {applicationsByStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={applicationsByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {applicationsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>

        {/* Applications by Service */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Applications by Service</h2>
          </div>
          {applicationsByServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={applicationsByServiceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>
      </div>

      {/* Revenue & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Revenue by Service</h2>
          </div>
          {revenueByServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueByServiceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {revenueByServiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>

        {/* Citizen Demographics */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Citizen Demographics</h2>
          </div>
          {genderData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec489a" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Citizens Served:</span>
                  <span className="text-lg font-bold text-slate-900">{formatNumber(totalCitizens)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>
      </div>

      {/* Top Services & Processing Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Top Performing Services</h2>
          </div>
          {detailed.topServices && detailed.topServices.length > 0 ? (
            <div className="space-y-3">
              {detailed.topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{service.service}</p>
                      <p className="text-xs text-slate-500">{service.applications} applications</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(detailed.revenueByService?.[service.service] || 0)}
                    </p>
                    <p className="text-xs text-slate-400">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>

        {/* Processing Metrics */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Processing Metrics</h2>
          </div>
          <div className="space-y-6">
            <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <p className="text-4xl font-bold text-blue-900">{detailed.avgProcessingDays || 0}</p>
              <p className="text-sm text-blue-700 mt-1">Average Processing Days</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-700">
                  {detailed.applicationsByStatus?.approved || 0}
                </p>
                <p className="text-xs text-emerald-600 uppercase mt-1">Approved</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <ClockIcon className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">
                  {detailed.applicationsByStatus?.under_review || 0}
                </p>
                <p className="text-xs text-amber-600 uppercase mt-1">Under Review</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">
                  {detailed.applicationsByStatus?.paid || 0}
                </p>
                <p className="text-xs text-blue-600 uppercase mt-1">Paid</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">
                  {detailed.applicationsByStatus?.rejected || 0}
                </p>
                <p className="text-xs text-red-600 uppercase mt-1">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}