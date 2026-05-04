import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  cancelApplication,
  reviewApplication,
  getApplicationById,
} from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  X,
  File,
  FileImage,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import ReviewThread from "@/components/dashboard/ReviewThread";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "paid":
      return "bg-amber-100 text-amber-700";
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

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFileInfo = (filename) => {
  const extension = filename?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension);
  const isPdf = extension === 'pdf';
  const isWord = ['doc', 'docx'].includes(extension);
  const isExcel = ['xls', 'xlsx', 'csv'].includes(extension);
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension);
  const isText = ['txt', 'md', 'json', 'xml', 'log'].includes(extension);
  
  return {
    extension,
    isImage,
    isPdf,
    isWord,
    isExcel,
    isArchive,
    isText,
    icon: isImage ? FileImage : isPdf ? FileCheck : isWord ? FileText : isExcel ? FileSpreadsheet : isArchive ? FileArchive : FileCode
  };
};

const DocumentPreviewModal = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const fileUrl = typeof file === 'string' ? file : file.url || file.path;
  const fileName = typeof file === 'string' ? file.split('/').pop() : file.name || 'Document';
  const { isImage, isPdf, extension } = getFileInfo(fileName);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">{fileName}</h3>
            <span className="text-xs text-slate-500 uppercase">.{extension}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {isImage && (
            <div className="flex justify-center items-center min-h-[400px]">
              <img 
                src={fileUrl} 
                alt={fileName}
                className="max-w-full h-auto rounded-lg shadow-md"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}
          
          {isPdf && (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1`}
              title={fileName}
              className="w-full h-[80vh] rounded-lg border border-slate-200"
              onLoad={() => setLoading(false)}
            />
          )}
          
          {!isImage && !isPdf && (
            <div className="text-center py-12">
              <File className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download {fileName}
              </a>
            </div>
          )}
          
          {loading && (isImage || isPdf) && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DocumentThumbnail = ({ file, onClick }) => {
  const fileUrl = typeof file === 'string' ? file : file.url || file.path;
  const fileName = typeof file === 'string' ? file.split('/').pop() : file.name || 'Document';
  const { isImage, icon: Icon, extension } = getFileInfo(fileName);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  return (
    <div 
      className="group relative rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-video bg-slate-50 flex items-center justify-center p-4">
        {isImage && !thumbnailError ? (
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <Icon className="h-12 w-12 text-slate-400" />
        )}
      </div>
      
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
            <p className="text-xs text-slate-500 uppercase mt-0.5">{extension || 'file'}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(fileUrl, '_blank');
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showCommentPanel, setShowCommentPanel] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const returnUrl = queryParams.get('returnTo');

  const handleBack = () => {
    if (returnUrl) {
      navigate(returnUrl);
    } else {
      navigate("/applications");
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await getApplicationById(id);
      
      let appData = data;
      if (data?.data) {
        appData = data.data;
      }
      
      setApplication(appData);
    } catch (err) {
      console.error("Error loading application:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to load application.");
      navigate("/applications");
    } finally {
      setLoading(false);
    }
  };

  const getDocuments = (item) => {
    if (!item) return [];
    
    const documents = item.documents || item.attached_documents || item.files || item.attachments;
    
    if (Array.isArray(documents)) {
      return documents.filter(doc => doc && doc.trim?.()?.length > 0);
    }
    
    return [];
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await reviewApplication(id, { application_status: "approved", delivery_status: "pending" });
      await loadApplication();
      toastSuccess("Application approved successfully!");
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to approve application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await reviewApplication(id, { application_status: "rejected", notes: "Rejected by agency review team." });
      await loadApplication();
      toastSuccess("Application rejected successfully!");
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelApplication(id, "Cancelled by agency administration.");
      await loadApplication();
      toastSuccess("Application cancelled successfully!");
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to cancel application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentAdded = (comment) => {
    console.log("Comment added:", comment);
    // Optional: Refresh application data or show notification
    toastSuccess("New comment added!");
  };

  const handleCommentUpdated = (commentId, newText) => {
    console.log("Comment updated:", commentId, newText);
    toastSuccess("Comment updated successfully!");
  };

  const handleCommentDeleted = (commentId) => {
    console.log("Comment deleted:", commentId);
    toastSuccess("Comment deleted successfully!");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-600">Application not found.</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const documents = getDocuments(application);

  return (
    <div className="p-8 space-y-6">
      {previewFile && (
        <DocumentPreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Review Application</h1>
          <p className="text-sm text-slate-500 mt-1">Review application details, documents, and make a decision</p>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className={`transition-all duration-300 ${showCommentPanel ? 'grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6' : 'block'}`}>
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">Applicant</p>
                <p className="text-lg font-semibold text-slate-900">{application.citizen_name || "Citizen"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(application.application_status)}`}>
                  {application.application_status || "unknown"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {application.payment_status || "payment unknown"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">Service</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{application.service_name || application.service_type || "N/A"}</p>
                {application.service_description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{application.service_description}</p>
                )}
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">Submitted</p>
                <p className="mt-2 text-sm text-slate-900">{formatDate(application.created_at)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">Application ID</p>
                <p className="mt-2 text-sm font-mono text-slate-900 truncate">{application.id}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">FIN / ID</p>
                <p className="mt-2 text-sm text-slate-900">{application.citizen_fin || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Attached Documents</p>
                <p className="mt-1 text-sm text-slate-700">Click on any document to preview its contents.</p>
              </div>
              <span className="text-xs font-medium text-slate-500">{documents.length} file(s)</span>
            </div>
            
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc, index) => (
                  <DocumentThumbnail 
                    key={`${application.id}-doc-${index}`}
                    file={doc}
                    onClick={() => setPreviewFile(doc)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No documents attached for this application.</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Application Actions</p>
                <p className="text-xs text-slate-500 mt-0.5">Review, decide, or add comments</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.application_status !== "approved" && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {actionLoading ? "..." : "✓ Approve"}
                  </button>
                )}
                {application.application_status !== "rejected" && (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {actionLoading ? "..." : "✗ Reject"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {actionLoading ? "..." : "⊗ Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentPanel(!showCommentPanel)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1 ${
                    showCommentPanel 
                      ? 'bg-slate-600 text-white hover:bg-slate-700' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  {showCommentPanel ? "Close Comments" : "Add Comment"}
                  <ChevronRight className={`h-4 w-4 transition-transform ${showCommentPanel ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showCommentPanel && (
          <div className="animate-slide-in">
            <ReviewThread
              applicationId={application.id}
              readOnly={false}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}