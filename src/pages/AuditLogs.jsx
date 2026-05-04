import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "@/api/transportService";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderDetails = (log) => {
  if (log.action === "status_change") {
    return (
      <div className="space-y-1 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-900">{log.old_status || "N/A"}</span>
          <span className="mx-1">→</span>
          <span className="font-semibold text-slate-900">{log.new_status || "N/A"}</span>
        </p>
        {log.action_notes && <p>{log.action_notes}</p>}
      </div>
    );
  }

  if (log.new_values && typeof log.new_values === "object") {
    return (
      <div className="space-y-1 text-sm text-slate-600">
        {log.entity_type && <p className="font-medium text-slate-900">{log.entity_type}</p>}
        <pre className="overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs text-slate-700">{JSON.stringify(log.new_values, null, 2)}</pre>
      </div>
    );
  }

  return <span>{log.action_notes || log.entity_type || log.action || "No details"}</span>;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(null);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const hasPrevious = offset > 0;
  const hasNext = count === null ? false : offset + limit < count;

  const loadLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAuditLogs({ limit, offset });
      setLogs(Array.isArray(response.data) ? response.data : []);
      setCount(typeof response.count === "number" ? response.count : null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [limit, offset]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-2">Track application and admin actions made within your bureau.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <Activity size={16} className="text-slate-500" />
          <span>{count !== null ? `${count} total records` : "Loading count..."}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <THead>
              <TR className="bg-slate-50 text-left text-slate-700">
                <TH>Timestamp</TH>
                <TH>Admin</TH>
                <TH>Type</TH>
                <TH>Action</TH>
                <TH>Details</TH>
              </TR>
            </THead>
            <TBody>
              {loading && (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-slate-500">
                    Loading audit logs...
                  </TD>
                </TR>
              )}

              {!loading && logs.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-slate-500">
                    No audit log entries found.
                  </TD>
                </TR>
              )}

              {!loading && logs.map((log) => (
                <TR key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <TD>{formatDate(log.created_at)}</TD>
                  <TD>{log.admin_name || log.changed_by || "Unknown"}</TD>
                  <TD>{(log.log_type || "-").replaceAll("_", " ")}</TD>
                  <TD>{(log.action || "-").replaceAll("_", " ")}</TD>
                  <TD>{renderDetails(log)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Showing {logs.length} of {count !== null ? count : "?"} records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              disabled={!hasPrevious}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              type="button"
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={!hasNext}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
