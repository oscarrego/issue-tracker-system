import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import Avatar from "../components/Avatar";
import PriorityBadge from "../components/PriorityBadge";
import LabelChips from "../components/LabelChips";
import { isOverdue } from "../utils/issueOptions";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cache, setDetailCacheValue } = useData();
  const cachedIssue = cache.issueDetails[id];
  const cachedActivities = cache.issueActivities[id];

  const [issue, setIssue] = useState(cachedIssue || null);
  const [activities, setActivities] = useState(cachedActivities || []);
  const [loading, setLoading] = useState(!cachedIssue);
  const [activitiesLoading, setActivitiesLoading] = useState(!cachedActivities);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      if (!cache.issueDetails[id]) {
        setLoading(true);
      }
      try {
        const res = await api.get(`/issues/${id}`);
        setIssue(res.data.issue);
        setDetailCacheValue("issueDetails", id, res.data.issue);
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/issues", { replace: true });
        } else {
          setError("Failed to load issue.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchActivities = async () => {
      if (!cache.issueActivities[id]) {
        setActivitiesLoading(true);
      }
      try {
        const res = await api.get(`/issues/${id}/activities`);
        setActivities(res.data.activities || []);
        setDetailCacheValue("issueActivities", id, res.data.activities || []);
      } catch {
        // Ignore activity load errors
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchIssue();
    fetchActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setSubmittingComment(true);
    setCommentError("");
    try {
      await api.post(`/issues/${id}/comments`, {
        comment: commentText.trim(),
      });
      const activityRes = await api.get(`/issues/${id}/activities`);
      setActivities(activityRes.data.activities || []);
      setCommentText("");
    } catch (err) {
      setCommentError(err.response?.data?.message || "Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (activity) => {
    const commentId = activity.comment?._id;
    if (!commentId) return;
    try {
      await api.delete(`/issues/${id}/comments/${commentId}`);
      const activityRes = await api.get(`/issues/${id}/activities`);
      setActivities(activityRes.data.activities || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const startEditComment = (activity) => {
    setEditingCommentId(activity.comment._id);
    setEditText(activity.comment.comment);
  };

  const handleSaveEdit = async (activity) => {
    const commentId = activity.comment?._id;
    if (!editText.trim() || !commentId) return;
    setSavingEdit(true);
    try {
      await api.patch(`/issues/${id}/comments/${commentId}`, { comment: editText.trim() });
      const activityRes = await api.get(`/issues/${id}/activities`);
      setActivities(activityRes.data.activities || []);
      setEditingCommentId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update comment.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/issues/${id}`);
      navigate("/issues");
    } catch {
      setError("Failed to delete issue.");
      setDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Issue">
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!issue) {
    return (
      <Layout title="Issue Not Found">
        <p style={{ color: "var(--color-text-muted)" }}>Issue not found.</p>
      </Layout>
    );
  }

  return (
    <Layout title={issue.title}>
      <Link to="/issues" className="back-link">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="3" x2="3" y2="8" />
          <line x1="3" y1="8" x2="10" y2="13" />
          <line x1="3" y1="8" x2="14" y2="8" />
        </svg>
        All Issues
      </Link>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="issue-detail-header">
        <div className="issue-detail-status">
          <StatusBadge status={issue.status} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="issue-detail-title">{issue.title}</h1>
          <div className="issue-detail-meta">
            <span className="issue-detail-meta-item">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="12" height="11" rx="1" />
                <line x1="5" y1="1" x2="5" y2="5" />
                <line x1="11" y1="1" x2="11" y2="5" />
                <line x1="2" y1="7" x2="14" y2="7" />
              </svg>
              Opened {formatDateShort(issue.createdAt)}
            </span>
            <span className="issue-detail-meta-item">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2 14a6 6 0 0 1 12 0" />
              </svg>
              {issue.createdBy?.name || "Unknown"}
            </span>
            <span className="issue-detail-meta-item" style={{ color: "var(--color-text-subtle)", fontSize: "12px" }}>
              #{id.slice(-6)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link to={`/issues/${id}/edit`} className="btn btn-secondary btn-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15H2v-3L11.5 2.5z" />
            </svg>
            Edit
          </Link>
          <button
            className="btn btn-ghost-danger btn-sm"
            onClick={() => setDeleteModal(true)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,4 14,4" />
              <path d="M5 4V2h6v2" />
              <path d="M3 4l1 10h8l1-10" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div className="issue-layout">
        <div>
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <span className="card-title">Description</span>
            </div>
            <div className="card-body">
              {issue.description ? (
                <p className="issue-body">{issue.description}</p>
              ) : (
                <p className="issue-body-empty">No description provided.</p>
              )}
            </div>
          </div>

          <div className="comments-section">
            <h2 className="comments-title">
              Activity
              <span className="comment-count">{activities.length}</span>
            </h2>

            {activitiesLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {activities.length === 0 ? (
                  <div className="comment-empty">No activity yet.</div>
                ) : (
                  <div className="timeline-list">
                    {activities.map((activity) => {
                      const isOwner = activity.comment?._id && String(activity.user?._id) === String(user?.id);
                      const isEditing = editingCommentId === activity.comment?._id;
                      return (
                        <div key={activity._id} className="timeline-item">
                          <Avatar user={activity.user} size={26} className="comment-avatar" />
                          <div className="comment-content">
                            <div className="comment-header">
                              <span className="comment-author">{activity.user?.name || "Unknown"}</span>
                              <span className="comment-time">{formatDateShort(activity.createdAt)}</span>
                              {isOwner && !isEditing && (
                                <span className="comment-action-btns">
                                  <button
                                    className="comment-action-btn"
                                    title="Edit comment"
                                    onClick={() => startEditComment(activity)}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15H2v-3L11.5 2.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="comment-action-btn danger"
                                    title="Delete comment"
                                    onClick={() => handleDeleteComment(activity)}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="2,4 14,4" />
                                      <path d="M5 4V2h6v2" />
                                      <path d="M3 4l1 10h8l1-10" />
                                      <line x1="6.5" y1="7" x2="6.5" y2="11" />
                                      <line x1="9.5" y1="7" x2="9.5" y2="11" />
                                    </svg>
                                  </button>
                                </span>
                              )}
                            </div>
                            {!activity.comment?._id && (
                              <p className="comment-text">
                                {activity.message}
                                {(activity.from || activity.to) && (
                                  <span className="timeline-change">
                                    {activity.from && <b>{activity.from}</b>}
                                    {activity.from && activity.to && " -> "}
                                    {activity.to && <b>{activity.to}</b>}
                                  </span>
                                )}
                              </p>
                            )}
                            {activity.comment?.comment && (
                              isEditing ? (
                                <div className="comment-edit-box">
                                  <textarea
                                    className="comment-edit-input"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") setEditingCommentId(null);
                                    }}
                                    rows={3}
                                    disabled={savingEdit}
                                    autoFocus
                                  />
                                  <div className="comment-edit-actions">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleSaveEdit(activity)}
                                      disabled={savingEdit || !editText.trim()}
                                    >
                                      {savingEdit ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => setEditingCommentId(null)}
                                      disabled={savingEdit}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="timeline-comment">{activity.comment.comment}</p>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form className="comment-form" onSubmit={handleAddComment}>
                  <Avatar user={user} size={26} className="comment-form-avatar" />
                  <div className="comment-form-body">
                    <textarea
                      className="comment-form-input"
                      placeholder="Leave a comment..."
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        setCommentError("");
                      }}
                      rows={3}
                    />
                    {commentError && (
                      <div className="form-error" style={{ marginTop: "4px" }}>
                        {commentError}
                      </div>
                    )}
                    <div className="comment-form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={submittingComment}
                      >
                        {submittingComment ? "Posting..." : "Comment"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="issue-sidebar-panel">
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Status</div>
              <StatusBadge status={issue.status} />
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Priority</div>
              <PriorityBadge priority={issue.priority} />
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Project</div>
              <span className="issue-sidebar-value-muted">{issue.project?.name || "No project"}</span>
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Labels</div>
              <LabelChips labels={issue.labels || []} />
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Due Date</div>
              <span className={isOverdue(issue.dueDate, issue.status) ? "issue-sidebar-value due-overdue" : "issue-sidebar-value-muted"}>
                {issue.dueDate ? formatDate(issue.dueDate) : "No due date"}
              </span>
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Assigned To</div>
              {issue.assignedTo ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar user={issue.assignedTo} size={24} className="comment-avatar" />
                  <span className="issue-sidebar-value">{issue.assignedTo.name}</span>
                </div>
              ) : (
                <span className="issue-sidebar-value-muted">Unassigned</span>
              )}
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Created By</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Avatar user={issue.createdBy} size={24} className="comment-avatar" />
                <span className="issue-sidebar-value">{issue.createdBy?.name || "Unknown"}</span>
              </div>
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Created</div>
              <span className="issue-sidebar-value-muted">{formatDate(issue.createdAt)}</span>
            </div>
            <div className="issue-sidebar-section">
              <div className="issue-sidebar-label">Last Updated</div>
              <span className="issue-sidebar-value-muted">{formatDate(issue.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        title="Delete issue"
        message={`Are you sure you want to delete "${issue.title}"? This will also delete all comments and cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        loading={deleting}
      />
    </Layout>
  );
};

export default IssueDetailPage;
