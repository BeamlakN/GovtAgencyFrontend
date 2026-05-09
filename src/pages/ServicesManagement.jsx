import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
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
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
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

  useEffect(() => {
    let filtered = [...services];
    if (searchTerm) {
      filtered = filtered.filter(s => 
        (s.service_name || s.name)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredServices(filtered);
  }, [services, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageServices) return;

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Service name is required.";
    else if (form.name.trim().length < 3) nextErrors.name = "Service name must be at least 3 characters.";
    
    // Check for duplicate service name
    const isDuplicate = services.some(
      service => (service.name || service.service_name || "").toLowerCase() === form.name.toLowerCase()
    );
    if (isDuplicate) {
      nextErrors.name = "This service already exists. Please select a different service.";
    }
    
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    else if (form.description.trim().length < 10) nextErrors.description = "Description must be at least 10 characters.";
    // Check if description is only numbers
    else if (/^\d+$/.test(form.description.trim())) {
      nextErrors.description = "Description cannot contain only numbers. Please add meaningful text.";
    }
    
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
    <div className="p-8">
      {/* Search Bar - Create button removed */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>

      {!canManageServices && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm mb-6">
          You do not have permission to manage service types.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <ServiceCard
            key={getServiceId(service) || service.service_name || service.name}
            service={service}
            canEdit={canManageServices}
            onEdit={() => startEdit(service)}
            onDelete={() => openDeleteModal(service)}
          />
        ))}
        {filteredServices.length === 0 && (
          <p className="text-sm text-slate-500 col-span-full text-center py-8">
            No services found.
          </p>
        )}
      </div>

      {/* ServiceCreateModal is kept but the button to open it is removed */}
      <ServiceCreateModal
        isOpen={canManageServices && showCreateForm}
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        loading={loading}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleSubmit}
        existingServices={services}
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