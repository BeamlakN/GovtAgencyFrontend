import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";
import AnnouncementCreateModal from "@/components/dashboard/AnnouncementCreateModal";
import AnnouncementEditModal from "@/components/dashboard/AnnouncementEditModal";
import AnnouncementCard from "@/components/dashboard/AnnouncementCard";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const defaultForm = {
  title: "",
  content: "",
  image_url: "",
  target_role: "citizen",
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAnnouncement, setPendingAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAnnouncements({ limit: 100, offset: 0 });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title || "",
      content: announcement.content || "",
      image_url: announcement.image_url || "",
      target_role: announcement.target_role || "citizen",
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setForm(defaultForm);
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setForm(defaultForm);
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { title, content, image_url, target_role } = form;

    if (!title.trim() || !content.trim()) {
      toastError("Title and content are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          title: title.trim(),
          content: content.trim(),
          image_url: image_url.trim() || null,
          target_role,
        });
        toastSuccess("Announcement updated successfully.");
      } else {
        await createAnnouncement({
          title: title.trim(),
          content: content.trim(),
          image_url: image_url.trim() || null,
          target_role,
        });
        toastSuccess("Announcement created successfully.");
      }
      resetForm();
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (announcement) => {
    setSaving(true);
    try {
      await deleteAnnouncement(announcement.id);
      toastSuccess("Announcement deactivated.");
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to deactivate announcement.");
    } finally {
      setSaving(false);
    }
  };

  const openDeactivateModal = (announcement) => {
    setPendingAnnouncement(announcement);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setPendingAnnouncement(null);
    setShowConfirmModal(false);
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingAnnouncement) return;
    setShowConfirmModal(false);
    await handleDeactivate(pendingAnnouncement);
    setPendingAnnouncement(null);
  };

  const handleReactivate = async (announcement) => {
    setSaving(true);
    try {
      await updateAnnouncement(announcement.id, { is_active: true });
      toastSuccess("Announcement reactivated.");
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to reactivate announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-2">Create and manage bureau announcements for citizens and admins.</p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      {showCreateModal && (
        <AnnouncementCreateModal
          isOpen={showCreateModal}
          form={form}
          setForm={setForm}
          loading={saving}
          onClose={resetForm}
          onSubmit={handleSubmit}
        />
      )}

      {showEditModal && (
        <AnnouncementEditModal
          isOpen={showEditModal}
          form={form}
          setForm={setForm}
          loading={saving}
          onClose={resetForm}
          onSubmit={handleSubmit}
        />
      )}

      <div className="space-y-6">
        {/* <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Announcement list</h2>
            <p className="text-sm text-slate-500 mt-1">Manage existing bureau announcements and publish updates.</p>
          </div>
          <div className="text-sm text-slate-500">{announcements.length} announcements</div>
        </div> */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No announcements available.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={() => handleEdit(announcement)}
                  onDeactivate={() => openDeactivateModal(announcement)}
                  onReactivate={() => handleReactivate(announcement)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        title="Deactivate Announcement"
        description={`Are you sure you want to deactivate "${pendingAnnouncement?.title || "this announcement"}"?`}
        confirmText="Deactivate"
        loading={saving}
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
