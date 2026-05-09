import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Edit2, Trash2, RefreshCw, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { getComments, addComment, updateComment, deleteComment } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";
import { getCurrentUser } from "@/lib/utils";

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (msgDate.getTime() === today.getTime()) {
    return formatTime(value);
  }
  
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Validation function for comments
const validateCommentText = (text) => {
  const trimmedText = text?.trim();
  
  if (!trimmedText) {
    return "Message cannot be empty";
  }
  
  if (trimmedText.length < 3) {
    return "Message must be at least 3 characters";
  }
  
  if (trimmedText.length > 1000) {
    return "Message must not exceed 1000 characters";
  }
  
  // Check if message is only numbers
  if (/^\d+$/.test(trimmedText)) {
    return "Message cannot contain only numbers. Please add meaningful text.";
  }
  
  // Check if message is only special characters
  if (/^[^a-zA-Z0-9]+$/.test(trimmedText)) {
    return "Message cannot contain only special characters. Please add meaningful text.";
  }
  
  // Check for too many consecutive spaces
  if (/\s{3,}/.test(trimmedText)) {
    return "Message cannot contain too many consecutive spaces";
  }
  
  return null;
};

const ReviewThread = ({ 
  applicationId, 
  readOnly = false,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}) => {
  const [draftComment, setDraftComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const messagesEndRef = useRef(null);
  
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load comments
  const loadComments = useCallback(async () => {
    if (!applicationId) return;
    
    try {
      setLoading(true);
      const data = await getComments(applicationId);
      
      const formattedMessages = (data || []).map(comment => ({
        id: comment.id,
        isAdmin: comment.authorRole === "admin" || comment.author_role === "admin" || comment.author === "admin",
        authorName: comment.authorName || comment.author || (comment.authorRole === "admin" ? "Admin" : "Citizen"),
        text: comment.comment_text || comment.text,
        createdAt: comment.createdAt || comment.created_at,
        updatedAt: comment.updated_at,
        isEdited: !!comment.updated_at
      }));
      
      formattedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(formattedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error loading comments:", err);
      toastError(err?.response?.data?.error || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Initial load
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async () => {
    // Validate before submitting
    const error = validateCommentText(draftComment);
    if (error) {
      setValidationError(error);
      toastError(error);
      return;
    }
    
    const text = draftComment.trim();
    if (submitting) return;

    setSubmitting(true);
    setValidationError("");
    
    try {
      const newComment = await addComment(applicationId, text);
      
      const formattedComment = {
        id: newComment.id,
        isAdmin: true,
        authorName: "Admin",
        text: newComment.comment_text || text,
        createdAt: newComment.createdAt || new Date().toISOString(),
        isEdited: false
      };
      
      setMessages(prev => [...prev, formattedComment]);
      setDraftComment("");
      toastSuccess("Message sent!");
      
      setTimeout(scrollToBottom, 100);
      
      if (onCommentAdded) onCommentAdded(formattedComment);
    } catch (err) {
      console.error("Error adding comment:", err);
      toastError(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    // Validate before editing
    const error = validateCommentText(newText);
    if (error) {
      toastError(error);
      return;
    }
    
    const trimmedText = newText.trim();
    if (editing) return;

    setEditing(true);
    try {
      const updated = await updateComment(commentId, trimmedText);
      
      setMessages(prev => prev.map(message =>
        message.id === commentId
          ? { 
              ...message, 
              text: updated.comment_text || trimmedText,
              updatedAt: new Date().toISOString(),
              isEdited: true 
            }
          : message
      ));
      
      setEditCommentId(null);
      setEditText("");
      toastSuccess("Message updated!");
      
      if (onCommentUpdated) onCommentUpdated(commentId, trimmedText);
    } catch (err) {
      console.error("Error updating comment:", err);
      toastError(err?.response?.data?.error || "Failed to update message");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (deleting) return;
    
    if (!confirm("Delete this message?")) return;
    
    setDeleting(true);
    try {
      await deleteComment(commentId);
      
      setMessages(prev => prev.filter(message => message.id !== commentId));
      toastSuccess("Message deleted!");
      
      if (onCommentDeleted) onCommentDeleted(commentId);
    } catch (err) {
      console.error("Error deleting comment:", err);
      toastError(err?.response?.data?.error || "Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (message) => {
    setEditCommentId(message.id);
    setEditText(message.text);
    setValidationError("");
  };

  const cancelEdit = () => {
    setEditCommentId(null);
    setEditText("");
    setValidationError("");
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editCommentId) {
      handleEditComment(editCommentId, editText.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editCommentId) {
        handleEditSubmit();
      } else {
        handleSubmitComment();
      }
    }
  };

  const handleDraftChange = (e) => {
    setDraftComment(e.target.value);
    if (validationError) {
      setValidationError("");
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-900"></div>
        <span className="ml-2 text-sm text-slate-500">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Review Conversation</h3>
            <p className="text-xs text-slate-500">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area - Telegram Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[500px] bg-gradient-to-b from-slate-50/50 to-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Send className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">Start the conversation with the citizen</p>
          </div>
        )}
        
        {messages.map((message, index) => {
          const isAdminMessage = message.isAdmin;
          const isLast = index === messages.length - 1;
          const showAvatar = !isAdminMessage && (!messages[index - 1] || messages[index - 1]?.isAdmin);
          
          return (
            <div
              key={message.id}
              className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div className={`flex gap-2 max-w-[75%] ${isAdminMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar - Citizen only, shown for first message in sequence */}
                {!isAdminMessage && showAvatar && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">C</span>
                    </div>
                  </div>
                )}
                
                {/* Spacer for alignment when no avatar */}
                {!isAdminMessage && !showAvatar && <div className="w-8 flex-shrink-0"></div>}
                
                {/* Message Content */}
                <div className={`flex flex-col ${isAdminMessage ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div className="relative group">
                    {editCommentId === message.id ? (
                      <div className="bg-white rounded-2xl p-3 shadow-lg border border-slate-200 min-w-[220px]">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 p-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                          onKeyPress={handleKeyPress}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={handleEditSubmit}
                            disabled={!editText.trim() || editing}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-2.5 shadow-sm ${
                          isAdminMessage
                            ? 'bg-slate-900 text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-slate-900 rounded-2xl rounded-bl-md border border-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line break-words leading-relaxed">
                          {message.text}
                        </p>
                      </div>
                    )}
                    
                    {/* Edit/Delete Buttons - Admin messages only */}
                    {isAdminMessage && !readOnly && editCommentId !== message.id && (
                      <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-0.5 bg-white rounded-lg shadow-md border border-slate-200 p-0.5">
                          <button
                            onClick={() => startEdit(message)}
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(message.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Footer - Time & Status */}
                  <div className={`flex items-center gap-1 mt-1 px-1 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(message.createdAt)}
                    </span>
                    {message.isEdited && (
                      <span className="text-[9px] text-slate-300">(edited)</span>
                    )}
                    {isAdminMessage && !readOnly && (
                      <CheckCheck className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* No avatar for admin messages */}
                {isAdminMessage && <div className="w-8 flex-shrink-0"></div>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Telegram Style with Validation */}
      {!readOnly && (
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={draftComment}
                  onChange={handleDraftChange}
                  onKeyPress={handleKeyPress}
                  rows={1}
                  placeholder="Write a message..."
                  className={`w-full rounded-2xl border px-4 py-2.5 pr-12 text-sm text-slate-900 outline-none focus:ring-1 transition-all resize-none ${
                    validationError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                  } bg-white`}
                  disabled={submitting}
                  style={{ minHeight: '42px', maxHeight: '100px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                />
                {validationError && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span className="text-[10px] text-red-500">{validationError}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={!draftComment.trim() || submitting}
                className={`rounded-full p-2.5 transition-all flex-shrink-0 ${
                  draftComment.trim() && !submitting && !validationError
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
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
      )}
    </div>
  );
};

export default ReviewThread;