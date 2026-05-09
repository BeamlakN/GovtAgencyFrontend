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
  Clock as ClockIcon,
  Zap,
  Target,
  Award,
  Eye,
  ArrowUpRight,
  ArrowDownRight
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
  Area,
  ComposedChart,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16', '#f97316', '#a855f7'];

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

export default function Analytics() {
  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const detailedData = await getDetailedAnalytics();
      setDetailed(detailedData);
    } catch (err) {
      console.error("Error loading analytics:", err);
      toastError(err?.response?.data?.error || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!detailed) return;
    const csvRows = [];
    csvRows.push(['Analytics Report', new Date().toLocaleString()]);
    csvRows.push([]);
    csvRows.push(['Applications by Status']);
    csvRows.push(['Status', 'Count']);
    Object.entries(detailed.applicationsByStatus || {}).forEach(([key, value]) => csvRows.push([key, value]));
    csvRows.push([]);
    csvRows.push(['Applications by Service']);
    csvRows.push(['Service', 'Count']);
    Object.entries(detailed.applicationsByService || {}).forEach(([key, value]) => csvRows.push([key, value]));
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
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
    ? Object.entries(detailed.applicationsByStatus).map(([name, value]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), value }))
    : [];

  const applicationsByServiceData = detailed.applicationsByService
    ? Object.entries(detailed.applicationsByService).map(([name, value]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), value }))
    : [];

  const revenueByServiceData = detailed.revenueByService
    ? Object.entries(detailed.revenueByService).map(([name, value]) => ({ name: name.replace(/_/g, ' ').toUpperCase(), revenue: value }))
    : [];

  const genderData = detailed.citizensByGender
    ? Object.entries(detailed.citizensByGender).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  const totalApplications = Object.values(detailed.applicationsByStatus || {}).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(detailed.revenueByService || {}).reduce((a, b) => a + b, 0);
  const totalCitizens = Object.values(detailed.citizensByGender || {}).reduce((a, b) => a + b, 0);
  const approvalRate = totalApplications > 0 ? ((detailed.applicationsByStatus?.approved || 0) / totalApplications * 100).toFixed(1) : 0;
  const rejectionRate = totalApplications > 0 ? ((detailed.applicationsByStatus?.rejected || 0) / totalApplications * 100).toFixed(1) : 0;

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 to-white min-h-screen">
      {/* Export Button - No Header */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <button onClick={exportToCSV} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Quick Insights Row - UPDATED COLORS to match system */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-90 uppercase tracking-wide">Unique Citizens</p>
              <p className="text-3xl font-bold mt-2">{formatNumber(totalCitizens)}</p>
              <p className="text-xs opacity-80 mt-1">Total citizens served</p>
            </div>
            <Users size={24} className="opacity-80" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-90 uppercase tracking-wide">Pending Review</p>
              <p className="text-3xl font-bold mt-2">{detailed.applicationsByStatus?.under_review || 0}</p>
              <p className="text-xs opacity-80 mt-1">Awaiting your action</p>
            </div>
            <Clock size={24} className="opacity-80" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-90 uppercase tracking-wide">Paid Applications</p>
              <p className="text-3xl font-bold mt-2">{detailed.applicationsByStatus?.paid || 0}</p>
              <p className="text-xs opacity-80 mt-1">{totalApplications > 0 ? ((detailed.applicationsByStatus?.paid || 0) / totalApplications * 100).toFixed(1) : 0}% paid rate</p>
            </div>
            <DollarSign size={24} className="opacity-80" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-90 uppercase tracking-wide">Rejected</p>
              <p className="text-3xl font-bold mt-2">{detailed.applicationsByStatus?.rejected || 0}</p>
              <p className="text-xs opacity-80 mt-1">{rejectionRate}% of total</p>
            </div>
            <XCircle size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Applications Over Time */}
      {detailed.applicationsOverTime && detailed.applicationsOverTime.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Applications Trend</h2>
              <p className="text-sm text-slate-500 mt-1">Daily application submissions over time</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp size={16} />
              <span>+23% vs last period</span>
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

      {/* Service Performance - Combined Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-5 w-5 text-slate-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Service Performance</h2>
            <p className="text-sm text-slate-500 mt-1">Applications and revenue by service type</p>
          </div>
        </div>
        {applicationsByServiceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={applicationsByServiceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Applications', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight', fill: '#10b981' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="value" name="Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-slate-500">No service data available</div>
        )}
      </div>

      {/* Status Distribution & Revenue by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status - Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <PieChartIcon className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Applications by Status</h2>
          </div>
          {applicationsByStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={applicationsByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">{detailed.applicationsByStatus?.approved || 0}</p>
                  <p className="text-xs text-slate-500">Approved</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600">{detailed.applicationsByStatus?.under_review || 0}</p>
                  <p className="text-xs text-slate-500">Under Review</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">No data available</div>
          )}
        </div>

        {/* Revenue by Service - Horizontal Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Revenue by Service</h2>
          </div>
          {revenueByServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueByServiceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]}>
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
      </div>

      {/* Process Performance & Citizen Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Process Performance</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-900">{detailed.avgProcessingDays || 0}</p>
              <p className="text-xs text-blue-700 mt-1">Avg Processing Days</p>
            </div>
            <div className="text-center py-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl">
              <Zap className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-900">{approvalRate}%</p>
              <p className="text-xs text-emerald-700 mt-1">Approval Rate</p>
            </div>
            <div className="text-center py-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl">
              <Eye className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-amber-900">{detailed.applicationsByStatus?.under_review || 0}</p>
              <p className="text-xs text-amber-700 mt-1">Under Review</p>
            </div>
            <div className="text-center py-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-900">{detailed.applicationsByStatus?.approved || 0}</p>
              <p className="text-xs text-purple-700 mt-1">Approved</p>
            </div>
          </div>
        </div>

        {/* Citizen Demographics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Citizen Demographics</h2>
          </div>
          {genderData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec489a" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Citizens Served:</span>
                <span className="text-xl font-bold text-slate-900">{formatNumber(totalCitizens)}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">No demographic data available</div>
          )}
        </div>
      </div>

      {/* Top Performing Services */}
      {detailed.topServices && detailed.topServices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Top Performing Services</h2>
          </div>
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
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Performance Summary</h3>
            <p className="text-sm text-slate-300 mt-1">Overall system performance at a glance</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatNumber(totalApplications)}</p>
              <p className="text-xs text-slate-300">Total Applications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-slate-300">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{approvalRate}%</p>
              <p className="text-xs text-slate-300">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}