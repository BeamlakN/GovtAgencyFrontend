import { useState, useEffect, useCallback } from "react";
import { Send, Edit2, Trash2, RefreshCw } from "lucide-react";
import { getComments, addComment, updateComment, deleteComment } from "@/api/transportService";
import { toastError, toastSuccess } from "@/components/ui/toast";

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

  // Load comments from API
  const loadComments = useCallback(async () => {
    if (!applicationId) return;
    
    try {
      setLoading(true);
      const data = await getComments(applicationId);
      
      // Transform API response to match component format
      const formattedMessages = (data || []).map(comment => ({
        id: comment.id,
        author: comment.authorRole === "admin" ? "admin" : "citizen",
        text: comment.comment_text,
        createdAt: comment.createdAt,
        updatedAt: comment.updated_at,
        isEdited: !!comment.updated_at
      }));
      
      setMessages(formattedMessages);
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

  // Poll for new comments every 5 seconds (real-time simulation)
  useEffect(() => {
    if (!applicationId || readOnly) return;
    
    const interval = setInterval(() => {
      loadComments();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [applicationId, readOnly, loadComments]);

  const handleSubmitComment = async () => {
    const text = draftComment.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const newComment = await addComment(applicationId, text);
      
      const formattedComment = {
        id: newComment.id,
        author: newComment.authorRole === "admin" ? "admin" : "citizen",
        text: newComment.comment_text,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updated_at,
        isEdited: false
      };
      
      setMessages(prev => [...prev, formattedComment]);
      setDraftComment("");
      toastSuccess("Comment added successfully!");
      
      if (onCommentAdded) onCommentAdded(formattedComment);
    } catch (err) {
      console.error("Error adding comment:", err);
      toastError(err?.response?.data?.error || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    if (!newText.trim() || editing) return;

    setEditing(true);
    try {
      const updated = await updateComment(commentId, newText);
      
      setMessages(prev => prev.map(message =>
        message.id === commentId
          ? { 
              ...message, 
              text: updated.comment_text, 
              updatedAt: updated.updated_at,
              isEdited: true 
            }
          : message
      ));
      
      setEditCommentId(null);
      setEditText("");
      toastSuccess("Comment updated successfully!");
      
      if (onCommentUpdated) onCommentUpdated(commentId, newText);
    } catch (err) {
      console.error("Error updating comment:", err);
      toastError(err?.response?.data?.error || "Failed to update comment");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (deleting) return;
    
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    setDeleting(true);
    try {
      await deleteComment(commentId);
      
      setMessages(prev => prev.filter(message => message.id !== commentId));
      toastSuccess("Comment deleted successfully!");
      
      if (onCommentDeleted) onCommentDeleted(commentId);
    } catch (err) {
      console.error("Error deleting comment:", err);
      toastError(err?.response?.data?.error || "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (message) => {
    setEditCommentId(message.id);
    setEditText(message.text);
  };

  const cancelEdit = () => {
    setEditCommentId(null);
    setEditText("");
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

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 p-5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
          <span className="ml-2 text-sm text-slate-500">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Review Thread</p>
          <p className="mt-1 text-sm text-slate-700">
            {readOnly ? "View comments" : "Chat-style comments between admin and citizen."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{messages.length} message(s)</span>
          <button
            onClick={loadComments}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh comments"
          >
            <RefreshCw className="h-3 w-3 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No comments yet.</p>
            {!readOnly && (
              <p className="text-xs text-slate-400 mt-1">Be the first to add a comment.</p>
            )}
          </div>
        )}
        
        {messages.map((message) => {
          const isAdmin = message.author === "admin";
          return (
            <div 
              key={message.id} 
              className={`rounded-3xl p-4 ${
                isAdmin 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {isAdmin ? "Admin" : "Citizen"}
                  {message.isEdited && (
                    <span className="ml-2 text-[10px] opacity-70">(edited)</span>
                  )}
                </p>
                <span className="text-[11px] opacity-70">
                  {formatDate(message.createdAt)}
                  {message.isEdited && message.updatedAt && (
                    <span className="ml-1">· updated {formatDate(message.updatedAt)}</span>
                  )}
                </span>
              </div>
              
              {editCommentId === message.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 p-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                    placeholder="Edit your comment..."
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSubmit}
                      disabled={!editText.trim() || editing}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {editing ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm whitespace-pre-line">{message.text}</p>
              )}
              
              {isAdmin && !readOnly && editCommentId !== message.id && (
                <div className="mt-3 flex items-center gap-2 text-[11px] opacity-70">
                  <button 
                    type="button" 
                    onClick={() => startEdit(message)} 
                    className="underline hover:opacity-100 flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteComment(message.id)} 
                    className="underline hover:opacity-100 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-5 space-y-3">
          <textarea
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={4}
            placeholder="Add a review comment... (Press Enter to send, Shift+Enter for new line)"
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            disabled={submitting}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 rounded">Shift+Enter</kbd> for new line
            </div>
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!draftComment.trim() || submitting}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Send Comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewThread;