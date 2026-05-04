import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import { getAgencyStaff } from "@/api/agencyService";
import { getApplications, getTransportStats } from "@/api/transportService";
import { getCurrentUser } from "@/lib/utils";

import { Users, FileText, Clock, CheckCircle } from "lucide-react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

export default function Dashboard() {
  const [staff, setStaff] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);

  const user = useMemo(() => getCurrentUser(), []);
  const role = user?.role || "admin";
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffData, appData, statsData] = await Promise.all([
        getAgencyStaff(),
        getApplications({ status: "paid" }),
        getTransportStats(),
      ]);

      setStaff(Array.isArray(staffData) ? staffData : []);
      setApplications(Array.isArray(appData) ? appData : []);
      setStats(statsData || null);
    } catch (err) {
      console.error(err);
    }
  };

  const totalStaff = staff.length;
  const totalApps = stats?.total_apps ?? applications.length;
  const pendingApps = stats?.awaiting_review ?? applications.filter((a) => a.application_status === "pending").length;
  const approvedApps = stats?.total_approved ?? applications.filter((a) => a.application_status === "approved").length;

  const getStaffId = (user) =>
    user?.id ?? user?._id ?? user?.staff_id ?? user?.staffId ?? user?.user_id ?? user?.userId ?? "";

  const getInitials = (name) =>
    (name || "")
      .toString()
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

  const statusBadgeClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isSuperAdmin ? "Super Admin Dashboard" : "Agency Admin Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isSuperAdmin
              ? "Global bureau oversight with staff and application summaries across the agency."
              : "Agency-level operations summary for your assigned bureau."}
          </p>
        </div>
      </header>

      {/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {isSuperAdmin ? (
          <p>
            You have agency super admin access, so you can manage bureau staff and review application trends for your assigned bureau.
          </p>
        ) : (
          <p>
            You have agency admin access, so you can view staff and manage applications and services within your bureau.
          </p>
        )}
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Staff" value={totalStaff} icon={<Users />} />
        <StatCard title="Applications" value={totalApps} icon={<FileText />} />
        <StatCard title="Pending" value={pendingApps} icon={<Clock />} />
        <StatCard title="Approved" value={approvedApps} icon={<CheckCircle />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Recent Applications</h2>

          {applications.length === 0 && (
            <p className="text-sm text-slate-500">No applications available yet.</p>
          )}

          {applications.slice(0, 6).map((app) => (
            <div key={app.id} className="flex justify-between items-center border-b border-slate-100 py-3">
              <span className="text-slate-700">{app.service_type || app.serviceType || "N/A"}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadgeClass(app.application_status)}`}>
                {app.application_status || "unknown"}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Team Members</h2>

          {staff.length === 0 && (
            <p className="text-sm text-slate-500">No staff records available yet.</p>
          )}

          {staff.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-2/5" />
                  <col className="w-2/5" />
                  <col className="w-1/5" />
                </colgroup>
                <THead>
                  <TR className="text-left border-b border-slate-200 bg-slate-50">
                    <TH>Member</TH>
                    <TH>Email</TH>
                    <TH>Role</TH>
                  </TR>
                </THead>
                <TBody>
                  {staff.slice(0, 6).map((user) => {
                    const name = user.name || "Unknown Staff";
                    const email = user.email || "—";
                    const role = user.role || "staff";
                    const id = getStaffId(user) || email || name;
                    return (
                      <TR key={id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <TD>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                              {getInitials(name) || "TM"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{name}</p>
                              <p className="text-xs text-slate-500">
                                Status: {(user.status || "active").toString()}
                              </p>
                            </div>
                          </div>
                        </TD>
                        <TD className="text-slate-600">{email}</TD>
                        <TD>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              role === "super_admin"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {role}
                          </span>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}