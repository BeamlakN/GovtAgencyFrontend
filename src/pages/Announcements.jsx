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

  const handleDeactivate = async (announcement) => {
    setSaving(true);
    try {
      await updateAnnouncement(announcement.id, { is_active: false });
      toastSuccess("Announcement deactivated.");
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to deactivate announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (announcement) => {
    setSaving(true);
    try {
      const payload = {
        title: announcement.title,
        content: announcement.content,
        image_url: announcement.image_url || null,
        target_role: announcement.target_role || "citizen",
        is_active: true
      };
      
      await updateAnnouncement(announcement.id, payload);
      toastSuccess("Announcement reactivated successfully.");
      await loadAnnouncements();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to reactivate announcement.");
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-8 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="pl-8 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Results Summary */}
      <div className="mb-3">
        <div className="text-xs text-slate-500">
          Showing {filteredAnnouncements.length} of {announcements.length}
          {(searchTerm || filterStatus !== "all") && " (filtered)"}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-sm">
          Loading...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 text-sm">
          No announcements found.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((announcement) => (
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