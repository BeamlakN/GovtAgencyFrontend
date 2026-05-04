import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, ShieldCheck, Trash2, UserCog, UserRoundCheck, Users } from "lucide-react";
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
  const superAdminCount = staff.filter((u) => u.role === "super_admin").length;

  const getStaffId = (user) =>
    user?.id ??
    user?._id ??
    user?.staff_id ??
    user?.staffId ??
    user?.user_id ??
    user?.userId ??
    "";

  const getStaffStatus = (user) => {
    const status = user?.status ?? user?.is_active ?? user?.isActive;
    if (status === undefined || status === null) return "active";
    if (typeof status === "boolean") return status ? "active" : "inactive";
    return status.toString().trim().toLowerCase();
  };

  const isStaffInactive = (user) => ["inactive", "suspended", "disabled", "deactivated"].includes(getStaffStatus(user));
  const getStaffDisplayStatus = (user) => (isStaffInactive(user) ? "suspended" : "active");
  const activeCount = staff.filter((u) => !isStaffInactive(u)).length;

  const isDeletedStaff = (user) => {
    const status = getStaffStatus(user);
    return (
      user?.deleted === true ||
      user?.isDeleted === true ||
      user?.is_deleted === true ||
      Boolean(user?.deletedAt || user?.deleted_at || user?.removedAt || user?.removed_at) ||
      status === "deleted" ||
      status === "removed"
    );
  };

  const loadStaff = async () => {
    try {
      const data = await getAgencyStaff();
      const list = Array.isArray(data) ? data : [];

      setStaff((prevStaff) =>
        list
          .map((user) => {
            const id = getStaffId(user);
            const existing = prevStaff.find((u) => getStaffId(u) === id);
            if (id && existing && existing.status && !user?.status) {
              return {
                ...user,
                status: existing.status,
                is_active: existing.is_active ?? existing.isActive ?? existing.status === "active",
                isActive: existing.isActive ?? existing.is_active ?? existing.status === "active",
              };
            }
            return user;
          })
          .filter((u) => {
            const id = getStaffId(u);
            return !isDeletedStaff(u) && (!id || !locallyDeletedIds.has(id));
          })
      );
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to load staff.");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    if (!isSuperAdmin) return;
    e.preventDefault();
    setCreateLoading(true);
    setCreateFieldErrors({});
    try {
      const created = await createAgencyStaff(form);
      setForm(initialForm);
      setShowCreateForm(false);
      toastSuccess("Staff account created successfully.");

      // Optimistic insert in case the list endpoint lags/filters differently.
      if (created && typeof created === "object") {
        setStaff((prev) => {
          const createdId = getStaffId(created);
          if (createdId && locallyDeletedIds.has(createdId)) return prev;
          if (isDeletedStaff(created)) return prev;
          const already = createdId
            ? prev.some((u) => getStaffId(u) === createdId)
            : prev.some((u) => u.email && created.email && u.email === created.email);
          return already ? prev : [created, ...prev];
        });
      }

      await loadStaff();
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") setCreateFieldErrors(apiErrors);
      toastError(error?.response?.data?.error || error.message || "Failed to create staff account.");
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

  const handleStatusToggle = async (user) => {
    if (!isSuperAdmin || !user) return;
    const id = getStaffId(user);
    const next = isStaffInactive(user) ? "active" : "inactive";
    setActionLoadingId(id);

    try {
      const result = await setAgencyStaffStatus(id, next);
      const updatedStatus = (result?.status || result?.data?.status || next).toString().toLowerCase();
      const finalStatus = ["active", "inactive"].includes(updatedStatus) ? updatedStatus : next;

      if (finalStatus !== next) {
        toastError(`Expected status change to ${next}, but server returned ${finalStatus}.`);
      } else {
        toastSuccess(`Staff account ${finalStatus === "inactive" ? "suspended" : "activated"}.`);
      }

      setStaff((prev) =>
        prev.map((u) =>
          getStaffId(u) === id
            ? {
                ...u,
                status: finalStatus,
                is_active: finalStatus === "active",
                isActive: finalStatus === "active",
              }
            : u
        )
      );

      await loadStaff();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to update staff status.");
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
    await handleStatusToggle(user);
  };

  // FIXED: Corrected delete handler - immediate UI update without waiting for refetch
  const handleDelete = async (id) => {
    if (!isSuperAdmin || !id) return;
    setActionLoadingId(id);
    try {
      await deleteAgencyStaff(id);
      
      // IMMEDIATE UI UPDATE - Remove from local state first
      setStaff((prev) => prev.filter((u) => getStaffId(u) !== id));
      setLocallyDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      
      toastSuccess("Staff account removed.");
      
      // Optional: Background refresh to sync with server
      // This won't affect UI because the item is already filtered out
      setTimeout(() => {
        loadStaff();
      }, 500);
      
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to remove staff.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Administration</h1>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              setShowCreateForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            {showCreateForm ? "Cancel" : "Create"}
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          Agency admins can view staff records. Only agency super admins can create, edit, suspend, or remove staff accounts.
        </div>
      )}

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            Current Staff
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <THead>
              <TR className="text-left border-b border-slate-200 bg-slate-50">
                <TH className="pr-3">Name</TH>
                <TH className="pr-3">Email</TH>
                <TH className="pr-3">Role</TH>
                <TH className="pr-3">Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
           <TBody>
  {staff.map((user) => {
    const userId = getStaffId(user);
    const isInactive = isStaffInactive(user);
    // Use a fallback key if userId is empty
    const uniqueKey = userId || `${user.email}-${Date.now()}`;
    
    return (
      <TR
        key={uniqueKey}
        className="border-b border-slate-100 align-top hover:bg-slate-50/60 transition-colors"
      >
        <TD className="pr-3">
          <span className="font-medium text-slate-800">{user.name}</span>
        </TD>
        <TD className="pr-3 text-slate-600">{user.email}</TD>
        <TD className="pr-3">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            user.role === "super_admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
          }`}>{user.role}</span>
        </TD>
        <TD className="pr-3">
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
        <TD>
          {isSuperAdmin ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => startEdit(user)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors"
                title="Edit"
                aria-label="Edit staff"
              >
                <PencilLine size={14} />
              </button>
              <button
                type="button"
                onClick={() => (isInactive ? handleStatusToggle(user) : openSuspendModal(user))}
                disabled={actionLoadingId === userId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-70 transition-colors"
                title={isInactive ? "Activate" : "Suspend"}
                aria-label={isInactive ? "Activate staff" : "Suspend staff"}
              >
                <UserRoundCheck size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteCandidateId(userId);
                }}
                disabled={actionLoadingId === userId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 transition-colors"
                title="Remove"
                aria-label="Remove staff"
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

          {staff.length === 0 && <p className="text-sm text-slate-500 py-4">No staff found.</p>}
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
        description={`Are you sure you want to suspend "${suspendCandidate?.name || suspendCandidate?.email || "this staff account"}"?`}
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