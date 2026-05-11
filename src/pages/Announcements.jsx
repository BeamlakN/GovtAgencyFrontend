import { useEffect, useState } from "react";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
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

const defaultForm = {
  title: "",
  content: "",
  image_url: "",
  target_role: "citizen",
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAnnouncement, setPendingAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

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

  useEffect(() => {
    let filtered = [...announcements];
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(a => 
        filterStatus === "active" ? a.is_active : !a.is_active
      );
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, filterStatus, sortOrder]);

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

  const handleDelete = async (announcement) => {
    setSaving(true);
    try {
      await deleteAnnouncement(announcement.id);
      toastSuccess("Announcement deleted.");
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to delete announcement.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (announcement) => {
    setPendingAnnouncement(announcement);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setPendingAnnouncement(null);
    setShowConfirmModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!pendingAnnouncement) return;
    setShowConfirmModal(false);
    await handleDelete(pendingAnnouncement);
    setPendingAnnouncement(null);
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
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <div className="text-sm text-slate-500">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
          {(searchTerm || filterStatus !== "all") && " (filtered)"}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading announcements...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          No announcements found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={() => handleEdit(announcement)}
              onDelete={() => openDeleteModal(announcement)}
            />
          ))}
        </div>
      )}

      <AnnouncementCreateModal
        isOpen={showCreateModal}
        form={form}
        setForm={setForm}
        loading={saving}
        onClose={resetForm}
        onSubmit={handleSubmit}
      />

      <AnnouncementEditModal
        isOpen={showEditModal}
        form={form}
        setForm={setForm}
        loading={saving}
        onClose={resetForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${pendingAnnouncement?.title || "this announcement"}"?`}
        confirmText="Delete"
        loading={saving}
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}