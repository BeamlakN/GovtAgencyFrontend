import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Reply, 
  Send, 
  User, 
  Mail, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Phone,
  AlertCircle
} from "lucide-react";
import { getSuggestionById, respondToSuggestion } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

const statusBadgeClass = (status) => {
  switch (status) {
    case "responded": return "bg-emerald-100 text-emerald-700";
    case "pending": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "responded": return "Responded";
    case "pending": return "Pending Response";
    default: return status || "Unknown";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const validateResponse = (text) => {
  const trimmedText = text?.trim();
  if (!trimmedText) return "Response cannot be empty";
  if (trimmedText.length < 3) return "Response must be at least 3 characters";
  if (trimmedText.length > 2000) return "Response must not exceed 2000 characters";
  if (/^\d+$/.test(trimmedText)) return "Response cannot contain only numbers";
  if (/^[^a-zA-Z0-9]+$/.test(trimmedText)) return "Response cannot contain only special characters";
  return null;
};

export default function SuggestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [validationError, setValidationError] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => { loadSuggestion(); }, [id]);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const data = await getSuggestionById(id);
      setSuggestion(data);
      if (data.response) setResponseText(data.response);
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to load suggestion.");
      navigate("/suggestions");
    } finally { setLoading(false); }
  };

  const clearInput = () => {
    setResponseText("");
    setValidationError("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleRespond = async () => {
    const error = validateResponse(responseText);
    if (error) {
      setValidationError(error);
      toastError(error);
      return;
    }
    setSaving(true);
    setValidationError("");
    try {
      await respondToSuggestion(id, responseText.trim());
      toastSuccess("Response sent!");
      await loadSuggestion();
      clearInput();
    } catch (err) {
      toastError(err?.response?.data?.error || err.message || "Failed to send response.");
    } finally { setSaving(false); }
  };

  const handleResponseChange = (e) => {
    setResponseText(e.target.value);
    if (validationError) setValidationError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!saving && responseText.trim()) handleRespond();
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600">Suggestion not found.</p>
        <button onClick={() => navigate("/suggestions")} className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">Back</button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      {/* Navigation Bar */}
      <div className="flex justify-end">
        <button onClick={() => navigate("/suggestions")} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm hover:bg-slate-50">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5">
          {/* Suggestion Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-white">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1">
                  <h2 className="text-sm md:text-base font-semibold text-slate-900">{suggestion.subject || "Suggestion / Feedback"}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">By {suggestion.citizen_name || suggestion.user_name || "Anonymous"}</p>
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${statusBadgeClass(suggestion.status)}`}>
                  {suggestion.status === "responded" ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {statusLabel(suggestion.status)}
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> Message</h3>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-sm text-slate-700">{suggestion.content || suggestion.message || "No content"}</p></div>
            </div>
          </div>

          {/* Response Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><Reply size={14} /> {suggestion.status === "responded" ? "Your Response" : "Send Response"}</h3>
            </div>
            <div className="p-4">
              {suggestion.status === "responded" && suggestion.response && (
                <div className="mb-4 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-800 mb-1">Previous Response:</p>
                  <p className="text-sm text-slate-700">{suggestion.response}</p>
                  {suggestion.responded_at && <p className="text-[10px] text-slate-500 mt-1">Sent on {formatDateTime(suggestion.responded_at)}</p>}
                </div>
              )}
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-700">{suggestion.status === "responded" ? "Edit Response" : "Your Response"}</label>
                <div className="relative">
                  <textarea ref={textareaRef} value={responseText} onChange={handleResponseChange} onKeyPress={handleKeyPress} rows={4} placeholder="Type your response..." className={`w-full rounded-lg border p-3 text-sm focus:ring-1 focus:outline-none resize-none ${validationError ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-slate-400"}`} />
                  {validationError && <div className="absolute -bottom-5 left-0 flex items-center gap-0.5"><AlertCircle size={10} className="text-red-500" /><span className="text-[9px] text-red-500">{validationError}</span></div>}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleRespond} disabled={saving || !responseText.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-50">
                    {saving ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Send size={12} />}
                    {saving ? "Sending..." : suggestion.status === "responded" ? "Update" : "Send"}
                  </button>
                </div>
                <p className="text-center text-[9px] text-slate-400">Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[8px]">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[8px]">Shift+Enter</kbd> new line</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Citizen Information */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-4 overflow-hidden">
            <div className="p-3 border-b bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <h3 className="text-xs font-semibold flex items-center gap-1.5"><User size={12} /> Citizen Info</h3>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><User size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">Name</p><p className="text-xs font-medium">{suggestion.citizen_name || suggestion.user_name || "Anonymous"}</p></div></div>
              {suggestion.citizen_email && <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><Mail size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">Email</p><p className="text-xs font-medium truncate">{suggestion.citizen_email}</p></div></div>}
              {suggestion.citizen_fin && <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><FileText size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">FIN</p><p className="text-xs font-medium">{suggestion.citizen_fin}</p></div></div>}
              {suggestion.citizen_phone && <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><Phone size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">Phone</p><p className="text-xs font-medium">{suggestion.citizen_phone}</p></div></div>}
              <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><Calendar size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">Submitted</p><p className="text-xs font-medium">{formatDateTime(suggestion.created_at)}</p></div></div>
              {suggestion.bureau_name && <div className="flex items-start gap-2.5"><div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><Building2 size={12} className="text-slate-600" /></div><div><p className="text-[10px] text-slate-500">Bureau</p><p className="text-xs font-medium">{suggestion.bureau_name}</p></div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}