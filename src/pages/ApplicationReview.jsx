import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Building2,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  ExternalLink,
  FileImage,
  FileArchive,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getApplicationById,
  reviewApplication,
} from "@/api/transportService";
import ReviewThread from "@/components/dashboard/ReviewThread";
import { toastError, toastSuccess } from "@/components/ui/toast";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "submitted":
      return "bg-blue-100 text-blue-700";
    case "under_review":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const paymentStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) => {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    default:
      return status || "Unknown";
  }
};

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDecision, setActionDecision] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [showFormData, setShowFormData] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    if (!id) return;
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const data = await getApplicationById(id);
      setApplication(data);
      setDocuments(extractDocuments(data));
    } catch (err) {
      toastError(
        err?.response?.data?.error || err.message || "Failed to load application."
      );
      navigate("/applications");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision) => {
    setActionDecision(decision);
    setActionLoading(true);
    try {
      const payload = {
        appStatus: decision === "approved" ? "approved" : "rejected",
        deliveryStatus: decision === "approved" ? "processing" : "cancelled",
        notes: actionNotes.trim() || undefined,
      };
      await reviewApplication(id, payload);
      toastSuccess(
        `Application ${decision === "approved" ? "approved" : "rejected"} successfully.`
      );
      await loadApplication();
      setActionNotes("");
    } catch (err) {
      toastError(
        err?.response?.data?.error || err.message || `Failed to ${decision} application.`
      );
    } finally {
      setActionDecision("");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
        <FileText size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600">Application not found.</p>
        <button
          onClick={() => navigate("/applications")}
          className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const canReview =
    application.application_status === "submitted" ||
    application.application_status === "under_review";

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      {/* Navigation Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/applications")}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Left Column - Application Details + Comments */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5">
          {/* Application Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm md:text-base font-semibold text-slate-900 truncate">
                    {application.service_name || "Application"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    By {application.citizen_name || application.applicant_name || "Citizen"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                      application.application_status || application.status
                    )}`}
                  >
                    {application.application_status === "approved" ||
                    application.status === "approved" ? (
                      <CheckCircle size={12} />
                    ) : application.application_status === "rejected" ||
                      application.status === "rejected" ? (
                      <XCircle size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {statusLabel(
                      application.application_status || application.status
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${paymentStatusBadgeClass(
                      application.payment_status
                    )}`}
                  >
                    {application.payment_status || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {application.application_data || application.form_data ? (
                <div>
                  <button
                    onClick={() => setShowFormData(!showFormData)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2 hover:text-slate-900"
                  >
                    <FileText size={12} />
                    Application Details
                    {showFormData ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {showFormData && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                        {JSON.stringify(
                          application.application_data ||
                            application.form_data,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No additional form data available.</p>
              )}

              {/* Documents */}
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500">No documents attached.</p>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Paperclip size={12} /> Documents ({documents.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {documents.map((doc, idx) => (
                      <DocThumbnail
                        key={doc.id || idx}
                        doc={doc}
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {application.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-1">
                    Admin Notes
                  </h3>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <MessageSquare size={14} /> Comments
              </h3>
            </div>
            <div className="p-4">
              <ReviewThread applicationId={id} />
            </div>
          </div>

          {/* Review Actions */}
          {canReview && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Send size={14} /> Review Decision
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes or reason for your decision..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview("approved")}
                    disabled={
                      actionLoading && actionDecision === "approved"
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading && actionDecision === "approved" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {actionLoading && actionDecision === "approved"
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReview("rejected")}
                    disabled={
                      actionLoading && actionDecision === "rejected"
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading && actionDecision === "rejected" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {actionLoading && actionDecision === "rejected"
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Applicant Information */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-4 overflow-hidden">
            <div className="p-3 border-b bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <User size={12} /> Applicant Info
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <InfoRow
                icon={<User size={12} />}
                label="Name"
                value={
                  application.citizen_name ||
                  application.applicant_name ||
                  "N/A"
                }
              />
              {application.citizen_email && (
                <InfoRow
                  icon={<Mail size={12} />}
                  label="Email"
                  value={application.citizen_email}
                />
              )}
              {application.citizen_fin && (
                <InfoRow
                  icon={<FileText size={12} />}
                  label="FIN"
                  value={application.citizen_fin}
                />
              )}
              {application.citizen_phone && (
                <InfoRow
                  icon={<Phone size={12} />}
                  label="Phone"
                  value={application.citizen_phone}
                />
              )}
              <InfoRow
                icon={<Calendar size={12} />}
                label="Submitted"
                value={formatDateTime(
                  application.created_at || application.submitted_at
                )}
              />
              {application.service_name && (
                <InfoRow
                  icon={<Building2 size={12} />}
                  label="Service"
                  value={application.service_name}
                />
              )}
              {application.application_status && (
                <InfoRow
                  icon={<Clock size={12} />}
                  label="Status"
                  value={statusLabel(
                    application.application_status || application.status
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex >= 0 && documents[lightboxIndex] && (
        <Lightbox
          docs={documents}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
          onPrev={() => setLightboxIndex((i) => (i - 1 + documents.length) % documents.length)}
          onNext={() => setLightboxIndex((i) => (i + 1) % documents.length)}
        />
      )}
    </div>
  );
}

const normalizeDoc = (doc) => {
  if (!doc) return null;
  if (typeof doc === "string") {
    const name = doc.split("/").pop() || doc.split("\\").pop() || "file";
    return { url: doc, file_name: name, file_url: doc };
  }
  return {
    ...doc,
    file_name: doc.file_name || doc.filename || doc.name || doc.fileName || "file",
    file_url: doc.file_url || doc.url || doc.path || doc.fileUrl || doc.document_url || "#",
  };
};

const extractDocuments = (data) => {
  if (!data) return [];

  const raw =
    (Array.isArray(data.documents) && data.documents) ||
    (Array.isArray(data.files) && data.files) ||
    (Array.isArray(data.attachments) && data.attachments) ||
    (Array.isArray(data.document_urls) && data.document_urls) ||
    (Array.isArray(data.uploaded_files) && data.uploaded_files);

  if (raw) return raw.map(normalizeDoc).filter(Boolean);

  const appData = data.application_data || data.form_data;
  if (appData) {
    let parsed = appData;
    if (typeof appData === "string") {
      try { parsed = JSON.parse(appData); } catch { return []; }
    }
    return extractFromAppData(parsed);
  }
  return [];
};

const extractFromAppData = (appData) => {
  if (!appData) return [];

  const docKeys = ["document", "documents", "file", "files", "upload", "uploads", "attachment", "attachments", "photo", "photos", "image", "images", "img", "uploaded_file", "uploaded_files", "file_url", "document_url", "file_upload"];
  for (const key of Object.keys(appData)) {
    const val = appData[key];
    if (!val) continue;

    if (Array.isArray(val) && val.length > 0) {
      return val.map(normalizeDoc).filter(Boolean);
    }
    if (typeof val === "string" && (val.startsWith("http") || val.startsWith("/uploads") || val.startsWith("data:"))) {
      return [{ file_url: val, file_name: key }];
    }
  }

  const lowerKeys = Object.keys(appData);
  for (const key of docKeys) {
    const match = lowerKeys.find((k) => k.toLowerCase() === key || k.toLowerCase().includes(key));
    if (match) {
      const val = appData[match];
      if (Array.isArray(val)) return val.map(normalizeDoc).filter(Boolean);
      if (typeof val === "string" && (val.startsWith("http") || val.startsWith("/uploads") || val.startsWith("data:"))) {
        return [{ file_url: val, file_name: match }];
      }
    }
  }

  return [];
};

function DocThumbnail({ doc, onClick }) {
  const [failed, setFailed] = useState(false);
  const url = doc.file_url;
  const name = doc.file_name;

  if (failed || !url || url === "#") {
    return (
      <a
        href={url !== "#" ? url : undefined}
        target={url !== "#" ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 group col-span-2 sm:col-span-1"
      >
        <FileText size={14} className="text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-700 truncate">{name}</span>
        {url !== "#" && <ExternalLink size={10} className="text-slate-400 flex-shrink-0" />}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:ring-2 hover:ring-slate-900/20 transition-all group"
    >
      <img
        src={url}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
        <p className="text-[10px] text-white truncate leading-tight">{name}</p>
      </div>
    </button>
  );
}

function Lightbox({ docs, currentIndex, onClose, onPrev, onNext }) {
  const doc = docs[currentIndex];
  const fileUrl = doc.file_url;
  const filename = doc.file_name;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
      >
        <X size={20} />
      </button>

      {docs.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <img
        src={fileUrl}
        alt={filename}
        className="max-w-full max-h-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs">
        {filename}{docs.length > 1 ? ` (${currentIndex + 1}/${docs.length})` : ""}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-xs font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
