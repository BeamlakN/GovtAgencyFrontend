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
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-lg">
        <p className="text-xs font-semibold text-slate-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[10px] text-slate-600">
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
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-3"></div>
            <p className="text-sm text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!detailed) {
    return (
      <div className="p-6">
        <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
          <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No analytics data available</p>
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
    <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-br from-slate-50 to-white min-h-screen">
      {/* Export Button */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-700"
          >
            <option value="7days">7 days</option>
            <option value="30days">30 days</option>
            <option value="90days">90 days</option>
            <option value="year">Year</option>
          </select>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <Download size={14} className="sm:w-[16px] sm:h-[16px]" /> Export
          </button>
        </div>
      </div>

      {/* Quick Insights Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 text-white shadow-sm">
          <p className="text-[9px] opacity-90 uppercase tracking-wide">Unique Citizens</p>
          <p className="text-lg font-bold mt-1">{formatNumber(totalCitizens)}</p>
          <p className="text-[8px] opacity-80 mt-0.5">Total served</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-3 text-white shadow-sm">
          <p className="text-[9px] opacity-90 uppercase tracking-wide">Pending Review</p>
          <p className="text-lg font-bold mt-1">{detailed.applicationsByStatus?.under_review || 0}</p>
          <p className="text-[8px] opacity-80 mt-0.5">Awaiting action</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-white shadow-sm">
          <p className="text-[9px] opacity-90 uppercase tracking-wide">Paid Applications</p>
          <p className="text-lg font-bold mt-1">{detailed.applicationsByStatus?.paid || 0}</p>
          <p className="text-[8px] opacity-80 mt-0.5">{totalApplications > 0 ? ((detailed.applicationsByStatus?.paid || 0) / totalApplications * 100).toFixed(1) : 0}% paid</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-3 text-white shadow-sm">
          <p className="text-[9px] opacity-90 uppercase tracking-wide">Rejected</p>
          <p className="text-lg font-bold mt-1">{detailed.applicationsByStatus?.rejected || 0}</p>
          <p className="text-[8px] opacity-80 mt-0.5">{rejectionRate}% total</p>
        </div>
      </div>

      {/* Applications Over Time */}
      {detailed.applicationsOverTime && detailed.applicationsOverTime.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Applications Trend</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Daily submissions over time</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600">
              <TrendingUp size={12} />
              <span>+23%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={detailed.applicationsOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Service Performance */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">Service Performance</h2>
        </div>
        {applicationsByServiceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={applicationsByServiceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar yAxisId="left" dataKey="value" name="Apps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500">No service data available</div>
        )}
      </div>

      {/* Status Distribution & Revenue by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Applications by Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Applications by Status</h2>
          </div>
          {applicationsByStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={applicationsByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {applicationsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-emerald-600">{detailed.applicationsByStatus?.approved || 0}</p>
                  <p className="text-[10px] text-slate-500">Approved</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-amber-600">{detailed.applicationsByStatus?.under_review || 0}</p>
                  <p className="text-[10px] text-slate-500">Under Review</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No data available</div>
          )}
        </div>

        {/* Revenue by Service */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Revenue by Service</h2>
          </div>
          {revenueByServiceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByServiceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${value}`} tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
                <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No data available</div>
          )}
        </div>
      </div>

      {/* Process Performance & Citizen Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Process Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Process Performance</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-900">{detailed.avgProcessingDays || 0}</p>
              <p className="text-[9px] text-blue-700">Avg Days</p>
            </div>
            <div className="text-center py-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
              <Zap className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-900">{approvalRate}%</p>
              <p className="text-[9px] text-emerald-700">Approval</p>
            </div>
            <div className="text-center py-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
              <Eye className="h-6 w-6 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-900">{detailed.applicationsByStatus?.under_review || 0}</p>
              <p className="text-[9px] text-amber-700">Review</p>
            </div>
            <div className="text-center py-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-900">{detailed.applicationsByStatus?.approved || 0}</p>
              <p className="text-[9px] text-purple-700">Approved</p>
            </div>
          </div>
        </div>

        {/* Citizen Demographics */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Citizens</h2>
          </div>
          {genderData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec489a" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                <span className="text-[10px] text-slate-600">Total Served:</span>
                <span className="text-base font-bold text-slate-900">{formatNumber(totalCitizens)}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">No data available</div>
          )}
        </div>
      </div>

      {/* Top Performing Services */}
      {detailed.topServices && detailed.topServices.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Top Services</h2>
          </div>
          <div className="space-y-2">
            {detailed.topServices.slice(0, 5).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-900">{service.service}</p>
                </div>
                <p className="text-xs font-semibold text-emerald-600">
                  {formatCurrency(detailed.revenueByService?.[service.service] || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Performance Summary</h3>
            <p className="text-[10px] text-slate-300 mt-0.5">At a glance</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-base font-bold">{formatNumber(totalApplications)}</p>
              <p className="text-[9px] text-slate-300">Apps</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-[9px] text-slate-300">Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold">{approvalRate}%</p>
              <p className="text-[9px] text-slate-300">Success</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}