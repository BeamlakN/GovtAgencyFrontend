import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  createTransportService,
  deleteTransportService,
  getTransportServices,
  updateTransportService,
} from "@/api/transportService";
import ServiceCreateModal from "@/components/dashboard/ServiceCreateModal";
import ServiceEditModal from "@/components/dashboard/ServiceEditModal";
import ServiceCard from "@/components/dashboard/ServiceCard";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";
import { toastError, toastSuccess } from "@/components/ui/toast";

const SERVICES_UPDATED_EVENT = "agency-services-updated";

const initialForm = {
  name: "",
  description: "",
  fee: "",
  docs: "",
};

export default function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isSuperAdmin = user?.role === "super_admin";
  const canManageServices = user?.role === "admin" || isSuperAdmin;

  const loadServices = async () => {
    try {
      const data = await getTransportServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to load services.");
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageServices) return;

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Service name is required.";
    else if (form.name.trim().length < 3) nextErrors.name = "Service name must be at least 3 characters.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    else if (form.description.trim().length < 10) nextErrors.description = "Description must be at least 10 characters.";
    if (!form.fee && form.fee !== 0) nextErrors.fee = "Base fee is required.";
    else if (Number(form.fee) < 0) nextErrors.fee = "Base fee cannot be negative.";
    if (form.docs.trim()) {
      const docsArray = form.docs
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      if (docsArray.length === 0) nextErrors.docs = "Provide valid document names separated by commas.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await createTransportService({
        name: form.name,
        description: form.description,
        fee: Number(form.fee || 0),
        docs: form.docs
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      });

      setForm(initialForm);
      setShowCreateForm(false);
      toastSuccess("Service type registered successfully.");
      window.dispatchEvent(new Event(SERVICES_UPDATED_EVENT));
      await loadServices();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to register service.");
    } finally {
      setLoading(false);
    }
  };

  const getServiceId = (service) => service?.id ?? service?._id ?? service?.service_id ?? "";

  const startEdit = (service) => {
    setEditingService(service);
    setEditErrors({});
    setEditForm({
      name: service?.service_name || service?.name || "",
      description: service?.service_description || service?.description || "",
      fee: (service?.base_fee ?? service?.fee ?? "").toString(),
      docs: Array.isArray(service?.required_docs || service?.docs)
        ? (service?.required_docs || service?.docs).join(", ")
        : "",
    });
  };

  const closeEdit = () => {
    setEditingService(null);
    setEditErrors({});
    setEditForm(initialForm);
  };

  const openDeleteModal = (service) => {
    if (!canManageServices) return;
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setServiceToDelete(null);
    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    
    const id = getServiceId(serviceToDelete);
    if (!id) {
      toastError("Unable to delete: missing service id.");
      closeDeleteModal();
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteTransportService(id);
      toastSuccess("Service deleted.");
      window.dispatchEvent(new Event(SERVICES_UPDATED_EVENT));
      await loadServices();
      closeDeleteModal();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to delete service.");
      setDeleteLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!canManageServices || !editingService) return;

    const id = getServiceId(editingService);
    if (!id) {
      toastError("Unable to edit: missing service id.");
      return;
    }

    setEditLoading(true);
    setEditErrors({});
    try {
      await updateTransportService(id, {
        name: editForm.name,
        description: editForm.description,
        fee: Number(editForm.fee || 0),
        docs: editForm.docs
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      });
      toastSuccess("Service updated.");
      window.dispatchEvent(new Event(SERVICES_UPDATED_EVENT));
      closeEdit();
      await loadServices();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") setEditErrors(apiErrors);
      toastError(err?.response?.data?.error || err.message || "Failed to update service.");
    } finally {
      setEditLoading(false);
    }
  };

  const getServiceName = (service) => {
    return service?.service_name || service?.name || "this service";
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Services Management</h1>
        </div>
        {canManageServices && (
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            {showCreateForm ? "Close Form" : "Create Service"}
          </button>
        )}
      </div>

      {!canManageServices && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          You do not have permission to manage service types.
        </div>
      )}

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={getServiceId(service) || service.service_name || service.name}
              service={service}
              canEdit={canManageServices}
              onEdit={() => startEdit(service)}
              onDelete={() => openDeleteModal(service)}
            />
          ))}
          {services.length === 0 && <p className="text-sm text-slate-500">No services found.</p>}
        </div>
      </div>

      <ServiceCreateModal
        isOpen={canManageServices && showCreateForm}
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        loading={loading}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleSubmit}
      />

      <ServiceEditModal
        isOpen={canManageServices && Boolean(editingService)}
        form={editForm}
        setForm={setEditForm}
        fieldErrors={editErrors}
        loading={editLoading}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Service"
        description={`Are you sure you want to delete "${getServiceName(serviceToDelete)}"? This action cannot be undone.`}
        loading={deleteLoading}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}