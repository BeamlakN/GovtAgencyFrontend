import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, ShieldCheck, Trash2, UserCog, UserRoundCheck, Users, Search, Filter, AlertCircle } from "lucide-react";
import {
  createAgencyStaff,
  deleteAgencyStaff,
  getAgencyStaff,
  setAgencyStaffStatus,
  updateAgencyStaff,
} from "@/api/agencyService";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";
import { toastError, toastSuccess } from "@/components/ui/toast";
import StaffCreateModal from "@/components/dashboard/StaffCreateModal";
import StaffEditModal from "@/components/dashboard/StaffEditModal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

const initialForm = { name: "", email: "", password: "" };
const initialEditForm = { name: "", role: "admin" };

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState(initialForm);
  
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isSuperAdmin = user?.role === "super_admin";
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState("");
  const [suspendCandidate, setSuspendCandidate] = useState(null);
  const [locallyDeletedIds, setLocallyDeletedIds] = useState(() => new Set());

  const getStaffId = (user) => user?.id ?? user?._id ?? user?.staff_id ?? user?.staffId ?? user?.user_id ?? user?.userId ?? "";
  
  const getStaffStatus = (user) => {
    if (user?.status === "inactive") return "inactive";
    if (user?.status === "active") return "active";
    if (user?.is_active === false) return "inactive";
    if (user?.is_active === true) return "active";
    return "active";
  };

  const isStaffInactive = (user) => getStaffStatus(user) === "inactive";

  const loadStaff = async () => {
    try {
      const data = await getAgencyStaff();
      const list = Array.isArray(data) ? data : [];
      setStaff(list.filter((u) => !locallyDeletedIds.has(getStaffId(u))));
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to load staff.");
    }
  };

  useEffect(() => { loadStaff(); }, []);

  useEffect(() => {
    let filtered = [...staff];
    if (searchTerm) filtered = filtered.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterRole !== "all") filtered = filtered.filter(u => u.role === filterRole);
    if (filterStatus !== "all") filtered = filtered.filter(u => filterStatus === "active" ? !isStaffInactive(u) : isStaffInactive(u));
    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterRole, filterStatus]);

  const handleCreate = async (e) => {
    if (!isSuperAdmin) {
      toastError("Only super admins can create staff");
      return;
    }
    
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toastError("All fields are required");
      return;
    }
    
    setCreateLoading(true);
    setCreateFieldErrors({});
    
    try {
      await createAgencyStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      
      setForm(initialForm);
      setShowCreateForm(false);
      toastSuccess("Staff account created successfully!");
      await loadStaff();
    } catch (error) {
      toastError(error?.response?.data?.error || "Failed to create staff account.");
      if (error?.response?.data?.errors) setCreateFieldErrors(error.response.data.errors);
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (user) => {
    if (!isSuperAdmin) return;
    setShowCreateForm(false);
    setEditingId(getStaffId(user));
    setEditForm({ name: user.name || "", role: user.role || "admin" });
  };

  const cancelEdit = () => { setEditingId(""); setEditForm(initialEditForm); setEditFieldErrors({}); };

  const handleUpdate = async (id) => {
    if (!isSuperAdmin) return;
    setEditLoading(true);
    try {
      await updateAgencyStaff(id, editForm);
      toastSuccess("Staff updated.");
      cancelEdit();
      await loadStaff();
    } catch (err) {
      if (err?.response?.data?.errors) setEditFieldErrors(err.response.data.errors);
      toastError(err?.response?.data?.error || "Failed to update.");
    } finally { setEditLoading(false); }
  };

  const handleSuspend = async (user) => {
    const id = getStaffId(user);
    setActionLoadingId(id);
    try {
      await setAgencyStaffStatus(id, "inactive");
      toastSuccess("Staff suspended.");
      await loadStaff();
    } catch (err) {
      toastError("Failed to suspend.");
    } finally { setActionLoadingId(""); }
  };

  const handleActivate = async (user) => {
    const id = getStaffId(user);
    setActionLoadingId(id);
    try {
      await setAgencyStaffStatus(id, "active");
      toastSuccess("Staff activated.");
      await loadStaff();
    } catch (err) {
      toastError("Failed to activate.");
    } finally { setActionLoadingId(""); }
  };

  const openSuspendModal = (user) => { if (!isSuperAdmin || !user) return; setSuspendCandidate(user); };
  
  const handleDelete = async (id) => {
    setActionLoadingId(id);
    try {
      await deleteAgencyStaff(id);
      setLocallyDeletedIds(prev => new Set([...prev, id]));
      toastSuccess("Staff removed.");
      await loadStaff();
    } catch (err) {
      toastError("Failed to remove.");
    } finally { setActionLoadingId(""); }
  };

  return (
    <div className="p-5 space-y-4 bg-slate-50 min-h-screen">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900" 
            />
          </div>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)} 
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => { cancelEdit(); setShowCreateForm(prev => !prev); }} 
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={14} /> {showCreateForm ? "Cancel" : "Create Staff"}
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-xs">
          View only mode. Only super admins can manage staff members.
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((user) => {
                const userId = getStaffId(user);
                const isInactive = isStaffInactive(user);
                return (
                  <tr key={userId || user.email} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-900">{user.name}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.role === "super_admin" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        isInactive 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isInactive ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {isSuperAdmin ? (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => startEdit(user)} 
                            disabled={actionLoadingId === userId} 
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Edit"
                          >
                            <PencilLine size={12} />
                          </button>
                          {isInactive ? (
                            <button 
                              onClick={() => handleActivate(user)} 
                              disabled={actionLoadingId === userId} 
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Activate"
                            >
                              <UserRoundCheck size={12} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => openSuspendModal(user)} 
                              disabled={actionLoadingId === userId} 
                              className="p-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                              title="Suspend"
                            >
                              <UserRoundCheck size={12} />
                            </button>
                          )}
                          <button 
                            onClick={() => setDeleteCandidateId(userId)} 
                            disabled={actionLoadingId === userId} 
                            className="p-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">No staff members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!deleteCandidateId} 
        title="Remove staff member?" 
        description="This action will permanently remove this user from the system." 
        loading={actionLoadingId === deleteCandidateId} 
        onCancel={() => setDeleteCandidateId("")} 
        onConfirm={async () => { const id = deleteCandidateId; setDeleteCandidateId(""); await handleDelete(id); }} 
      />
      
      <ConfirmDeleteModal 
        isOpen={Boolean(suspendCandidate)} 
        title="Suspend staff?" 
        description={`Are you sure you want to suspend "${suspendCandidate?.name}"?`} 
        confirmText="Suspend" 
        loading={actionLoadingId === getStaffId(suspendCandidate)} 
        onCancel={() => setSuspendCandidate(null)} 
        onConfirm={async () => { const user = suspendCandidate; setSuspendCandidate(null); await handleSuspend(user); }} 
      />
      
      <StaffCreateModal 
        isOpen={isSuperAdmin && showCreateForm} 
        form={form} 
        setForm={setForm} 
        fieldErrors={createFieldErrors} 
        loading={createLoading} 
        onClose={() => setShowCreateForm(false)} 
        onSubmit={handleCreate} 
      />
      
      <StaffEditModal 
        editingId={editingId} 
        editForm={editForm} 
        setEditForm={setEditForm} 
        fieldErrors={editFieldErrors} 
        loading={editLoading} 
        onClose={cancelEdit} 
        onSubmit={(e) => { e.preventDefault(); handleUpdate(editingId); }} 
      />
    </div>
  );
}