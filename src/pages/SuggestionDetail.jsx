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
    case "responded":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "responded":
      return "Responded";
    case "pending":
      return "Pending Response";
    default:
      return status || "Unknown";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Validation function for response text
const validateResponse = (text) => {
  const trimmedText = text?.trim();
  
  if (!trimmedText) {
    return "Response cannot be empty";
  }
  
  if (trimmedText.length < 3) {
    return "Response must be at least 3 characters";
  }
  
  if (trimmedText.length > 2000) {
    return "Response must not exceed 2000 characters";
  }
  
  // Check if response is only numbers
  if (/^\d+$/.test(trimmedText)) {
    return "Response cannot contain only numbers. Please add meaningful text.";
  }
  
  // Check if response is only special characters
  if (/^[^a-zA-Z0-9]+$/.test(trimmedText)) {
    return "Response cannot contain only special characters. Please add meaningful text.";
  }
  
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

  useEffect(() => {
    loadSuggestion();
  }, [id]);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const data = await getSuggestionById(id);
      setSuggestion(data);
      if (data.response) {
        setResponseText(data.response);
      }
    } catch (err) {
      console.error("Error loading suggestion:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to load suggestion details.");
      navigate("/suggestions");
    } finally {
      setLoading(false);
    }
  };

  // Clear input and reset
  const clearInput = () => {
    setResponseText("");
    setValidationError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleRespond = async () => {
    // Validate before submitting
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
      toastSuccess("Response sent successfully!");
      await loadSuggestion();
      
      // Clear the input field after successful send
      clearInput();
    } catch (err) {
      console.error("Error sending response:", err);
      toastError(err?.response?.data?.error || err.message || "Failed to send response.");
    } finally {
      setSaving(false);
    }
  };

  const handleResponseChange = (e) => {
    setResponseText(e.target.value);
    if (validationError) {
      setValidationError("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!saving && responseText.trim()) {
        handleRespond();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading suggestion details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Suggestion not found.</p>
          <button
            onClick={() => navigate("/suggestions")}
            className="mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          >
            Back to Suggestions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Navigation Bar with Back Button on Right */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => navigate("/suggestions")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestions
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Suggestion Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Suggestion Card with Status inside */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">{suggestion.subject || "Suggestion / Feedback"}</h2>
                  <p className="text-sm text-slate-500 mt-1">Submitted by {suggestion.citizen_name || suggestion.user_name || "Anonymous"}</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(suggestion.status)}`}>
                  {suggestion.status === "responded" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {statusLabel(suggestion.status)}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {suggestion.content || suggestion.message || "No content provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Reply className="h-5 w-5" />
                {suggestion.status === "responded" ? "Your Response" : "Send Response"}
              </h3>
            </div>
            
            <div className="p-6">
              {suggestion.status === "responded" && suggestion.response && (
                <div className="mb-6 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-sm text-emerald-800 mb-2 font-medium">Previous Response:</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{suggestion.response}</p>
                  {suggestion.responded_at && (
                    <p className="text-xs text-slate-500 mt-2">
                      Sent on {formatDateTime(suggestion.responded_at)}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  {suggestion.status === "responded" ? "Edit Response (will overwrite)" : "Your Response"}
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={responseText}
                    onChange={handleResponseChange}
                    onKeyPress={handleKeyPress}
                    rows={6}
                    placeholder="Type your response to this suggestion..."
                    className={`w-full rounded-xl border p-4 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all resize-none ${
                      validationError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-200 focus:ring-slate-400 focus:border-slate-400"
                    }`}
                  />
                  {validationError && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500">{validationError}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleRespond}
                    disabled={saving || !responseText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {saving ? "Sending..." : suggestion.status === "responded" ? "Update Response" : "Send Response"}
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Enter</kbd> to send • 
                    <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-mono ml-1">Shift+Enter</kbd> for new line
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Citizen Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm sticky top-6">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Citizen Information
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-sm font-medium text-slate-900">{suggestion.citizen_name || suggestion.user_name || "Anonymous"}</p>
                </div>
              </div>
              
              {suggestion.citizen_email && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Email Address</p>
                    <p className="text-sm font-medium text-slate-900">{suggestion.citizen_email}</p>
                  </div>
                </div>
              )}
              
              {suggestion.citizen_fin && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">FIN / ID Number</p>
                    <p className="text-sm font-medium text-slate-900">{suggestion.citizen_fin}</p>
                  </div>
                </div>
              )}
              
              {suggestion.citizen_phone && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">{suggestion.citizen_phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Submitted On</p>
                  <p className="text-sm font-medium text-slate-900">{formatDateTime(suggestion.created_at)}</p>
                </div>
              </div>
              
              {suggestion.bureau_name && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bureau</p>
                    <p className="text-sm font-medium text-slate-900">{suggestion.bureau_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}