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

  const getStaffId = (user) =>
    user?.id ??
    user?._id ??
    user?.staff_id ??
    user?.staffId ??
    user?.user_id ??
    user?.userId ??
    "";

  const getStaffStatus = (user) => {
    // Check status from API response
    if (user?.status === "inactive") return "inactive";
    if (user?.status === "active") return "active";
    if (user?.is_active === false) return "inactive";
    if (user?.is_active === true) return "active";
    return "active";
  };

  const isStaffInactive = (user) => getStaffStatus(user) === "inactive";
  const getStaffDisplayStatus = (user) => isStaffInactive(user) ? "Suspended" : "Active";

  const loadStaff = async () => {
    try {
      const data = await getAgencyStaff();
      console.log("Loaded staff data:", data);
      const list = Array.isArray(data) ? data : [];
      // Filter out locally deleted staff
      const filteredList = list.filter((u) => !locallyDeletedIds.has(getStaffId(u)));
      setStaff(filteredList);
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to load staff.");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    let filtered = [...staff];
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRole !== "all") {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(u => 
        filterStatus === "active" ? !isStaffInactive(u) : isStaffInactive(u)
      );
    }
    
    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterRole, filterStatus]);

const handleCreate = async (e) => {
  if (!isSuperAdmin) return;
  e.preventDefault();
  setCreateLoading(true);
  setCreateFieldErrors({});
  
  try {
    // Try different payload structures
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: "admin", // Add default role
    };
    
    console.log("📤 Sending create staff request:", payload);
    
    const created = await createAgencyStaff(payload);
    console.log("✅ Create staff response:", created);
    
    setForm(initialForm);
    setShowCreateForm(false);
    toastSuccess("Staff account created successfully.");
    await loadStaff();
  } catch (error) {
    console.error("❌ Create staff error:", error);
    
    // Try alternative payload structure
    try {
      const altPayload = {
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      console.log("📤 Trying alternative payload:", altPayload);
      
      const created = await createAgencyStaff(altPayload);
      console.log("✅ Alternative payload success:", created);
      
      setForm(initialForm);
      setShowCreateForm(false);
      toastSuccess("Staff account created successfully.");
      await loadStaff();
    } catch (altError) {
      console.error("❌ Alternative payload also failed:", altError);
      const errorMessage = error?.response?.data?.error || error.message || "Failed to create staff account.";
      toastError(errorMessage);
    }
  } finally {
    setCreateLoading(false);
  }
};

  const startEdit = (user) => {
    if (!isSuperAdmin) return;
    setShowCreateForm(false);
    setEditingId(getStaffId(user));
    setEditForm({
      name: user.name || "",
      role: user.role || "admin",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(initialEditForm);
    setEditFieldErrors({});
  };

  const handleUpdate = async (id) => {
    if (!isSuperAdmin) return;
    setEditLoading(true);
    setEditFieldErrors({});
    try {
      await updateAgencyStaff(id, editForm);
      toastSuccess("Staff details updated.");
      cancelEdit();
      await loadStaff();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") setEditFieldErrors(apiErrors);
      toastError(err?.response?.data?.error || err.message || "Failed to update staff details.");
    } finally {
      setEditLoading(false);
    }
  };

  // Fix: Use setAgencyStaffStatus endpoint for suspend
  const handleSuspend = async (user) => {
    if (!isSuperAdmin || !user) return;
    const id = getStaffId(user);
    setActionLoadingId(id);

    try {
      // Send status as "inactive" for suspend
      const response = await setAgencyStaffStatus(id, "inactive");
      console.log("Suspend response:", response);
      
      toastSuccess(`Staff account suspended successfully.`);
      
      // IMPORTANT: Refresh the staff list to get the updated status
      await loadStaff();
    } catch (err) {
      console.error("Suspend error:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to suspend staff account.");
    } finally {
      setActionLoadingId("");
    }
  };

  // Fix: Use setAgencyStaffStatus endpoint for activate
  const handleActivate = async (user) => {
    if (!isSuperAdmin || !user) return;
    const id = getStaffId(user);
    setActionLoadingId(id);

    try {
      // Send status as "active" for activate
      const response = await setAgencyStaffStatus(id, "active");
      console.log("Activate response:", response);
      
      toastSuccess(`Staff account activated successfully.`);
      
      // IMPORTANT: Refresh the staff list to get the updated status
      await loadStaff();
    } catch (err) {
      console.error("Activate error:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to activate staff account.");
    } finally {
      setActionLoadingId("");
    }
  };

  const openSuspendModal = (user) => {
    if (!isSuperAdmin || !user) return;
    setSuspendCandidate(user);
  };

  const closeSuspendModal = () => {
    setSuspendCandidate(null);
  };

  const confirmSuspend = async () => {
    if (!suspendCandidate) return;
    const user = suspendCandidate;
    setSuspendCandidate(null);
    await handleSuspend(user);
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin || !id) return;
    setActionLoadingId(id);
    try {
      await deleteAgencyStaff(id);
      setLocallyDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      toastSuccess("Staff account removed.");
      await loadStaff();
    } catch (err) {
      console.error("Delete error:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to remove staff.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="p-8">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              setShowCreateForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            {showCreateForm ? "Cancel" : "Create Staff"}
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm mb-6">
          Agency admins can view staff records. Only agency super admins can create, edit, suspend, or remove staff accounts.
        </div>
      )}

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <THead>
              <TR className="text-left border-b border-slate-200 bg-slate-50">
                <TH className="px-4 py-3">Name</TH>
                <TH className="px-4 py-3">Email</TH>
                <TH className="px-4 py-3">Role</TH>
                <TH className="px-4 py-3">Status</TH>
                <TH className="px-4 py-3">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filteredStaff.map((user) => {
                const userId = getStaffId(user);
                const isInactive = isStaffInactive(user);
                const uniqueKey = userId || `${user.email}-${Date.now()}`;
                
                return (
                  <TR
                    key={uniqueKey}
                    className="border-b border-slate-100 align-top hover:bg-slate-50/60 transition-colors"
                  >
                    <TD className="px-4 py-3">
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </TD>
                    <TD className="px-4 py-3 text-slate-600">{user.email}</TD>
                    <TD className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === "super_admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {user.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </TD>
                    <TD className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isInactive
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {getStaffDisplayStatus(user)}
                      </span>
                    </TD>
                    <TD className="px-4 py-3">
                      {isSuperAdmin ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            disabled={actionLoadingId === userId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                            title="Edit"
                          >
                            <PencilLine size={14} />
                          </button>
                          
                          {/* Suspend/Activate Button using setAgencyStaffStatus */}
                          {isInactive ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(user)}
                              disabled={actionLoadingId === userId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              title="Activate"
                            >
                              <UserRoundCheck size={14} />
                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openSuspendModal(user)}
                              disabled={actionLoadingId === userId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                              title="Suspend"
                            >
                              <UserRoundCheck size={14} />
                              Suspend
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteCandidateId(userId);
                            }}
                            disabled={actionLoadingId === userId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">View only</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>

          {filteredStaff.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">No staff found.</p>
          )}
        </div>
      </section>

      <ConfirmDeleteModal
        isOpen={!!deleteCandidateId}
        title="Remove staff account?"
        description="This action will permanently remove this staff member."
        loading={actionLoadingId === deleteCandidateId}
        onCancel={() => setDeleteCandidateId("")}
        onConfirm={async () => {
          const id = deleteCandidateId;
          setDeleteCandidateId("");
          await handleDelete(id);
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(suspendCandidate)}
        title="Suspend staff account?"
        description={`Are you sure you want to suspend "${suspendCandidate?.name || suspendCandidate?.email || "this staff account"}"? Suspended staff cannot access the system.`}
        confirmText="Suspend"
        loading={actionLoadingId === getStaffId(suspendCandidate)}
        onCancel={closeSuspendModal}
        onConfirm={confirmSuspend}
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
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdate(editingId);
        }}
      />
    </div>
  );
}