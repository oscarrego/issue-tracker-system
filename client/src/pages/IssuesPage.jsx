import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import Avatar from "../components/Avatar";
import PriorityBadge from "../components/PriorityBadge";
import LabelChips from "../components/LabelChips";
import { LABEL_OPTIONS, PRIORITIES, isOverdue } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const UPPERCASE_LABELS = new Set(["ui", "api", "ux"]);
const formatLabel = (label) => {
  const lower = label.toLowerCase();
  if (UPPERCASE_LABELS.has(lower)) return lower.toUpperCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};


const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const IssuesPage = () => {
  const { cache, setCacheValue } = useData();
  const [issues, setIssues] = useState(cache.issues || []);
  const [projects, setProjects] = useState(cache.projects || []);
  const [loading, setLoading] = useState(!cache.issues || !cache.projects);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, issue: null });
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchIssues = useCallback(async () => {
    const isFiltered = Boolean(search.trim() || statusFilter || priorityFilter || labelFilter || projectFilter);
    if (!cache.issues || isFiltered) {
      setLoading(true);
    }
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (labelFilter) params.labels = labelFilter;
      if (projectFilter) params.project = projectFilter;
      const res = await api.get("/issues", { params });
      setIssues(res.data.issues);
      if (!isFiltered) {
        setCacheValue("issues", res.data.issues);
      }
    } catch {
      setError("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, labelFilter, projectFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchIssues, 300);
    return () => clearTimeout(delay);
  }, [fetchIssues]);

  useEffect(() => {
    api.get("/projects")
      .then((res) => {
        setProjects(res.data.projects || []);
        setCacheValue("projects", res.data.projects || []);
      })
      .catch(() => setProjects([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.issue) return;
    setDeleting(true);
    try {
      await api.delete(`/issues/${deleteModal.issue._id}`);
      const updated = issues.filter((i) => i._id !== deleteModal.issue._id);
      setIssues(updated);
      setCacheValue("issues", updated);
      setDeleteModal({ open: false, issue: null });
    } catch {
      setError("Failed to delete issue.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="Issues">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">
            {loading ? "Loading..." : `${issues.length} issue${issues.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link to="/issues/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          New Issue
        </Link>
      </div>

      <div className="filters-bar">
        <div className="filter-search">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.5" cy="6.5" r="5.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            id="issue-search"
            type="text"
            className="form-input"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="issue-status-filter"
          className="form-select filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          className="form-select filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <select
          className="form-select filter-select"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
        >
          <option value="">All labels</option>
          {LABEL_OPTIONS.map((label) => <option key={label} value={label}>{formatLabel(label)}</option>)}
        </select>
        <select
          className="form-select filter-select"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All projects</option>
          <option value="none">No project</option>
          {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
        </select>
        {(search || statusFilter || priorityFilter || labelFilter || projectFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setLabelFilter(""); setProjectFilter(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Labels</th>
                  <th>Due</th>
                  <th>Assigned To</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="table-empty">
                        <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="8" r="7" />
                          <circle cx="8" cy="8" r="2" />
                          <line x1="8" y1="1" x2="8" y2="6" />
                          <line x1="8" y1="10" x2="8" y2="15" />
                        </svg>
                        {search || statusFilter || priorityFilter || labelFilter || projectFilter
                          ? "No issues match your filters."
                          : "No issues yet. "}
                        {!search && !statusFilter && !priorityFilter && !labelFilter && !projectFilter && (
                          <Link to="/issues/new">Create the first one.</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue._id} className={isOverdue(issue.dueDate, issue.status) ? "overdue-row" : ""}>
                      <td style={{ maxWidth: "360px" }}>
                        <Link
                          to={`/issues/${issue._id}`}
                          className="table-issue-title"
                        >
                          {issue.title}
                        </Link>
                        <div className="table-meta">
                          {formatDate(issue.createdAt)} · by {issue.createdBy?.name || "Unknown"}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={issue.status} noIcon />
                      </td>
                      <td>
                        <PriorityBadge priority={issue.priority} noIcon />
                      </td>
                      <td>
                        <LabelChips labels={issue.labels || []} />
                      </td>
                      <td style={{ fontSize: "13px", color: isOverdue(issue.dueDate, issue.status) ? "var(--color-danger)" : "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {issue.dueDate ? formatDate(issue.dueDate) : "-"}
                      </td>
                      <td style={{ fontSize: "13px", color: issue.assignedTo ? "var(--color-text)" : "var(--color-text-subtle)" }}>
                        {issue.assignedTo ? (
                          <span className="person-cell">
                            <Avatar user={issue.assignedTo} size={22} />
                            {issue.assignedTo.name}
                          </span>
                        ) : "Unassigned"}
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: "center" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/issues/${issue._id}`)}
                            title="View issue"
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
                              <circle cx="8" cy="8" r="2" />
                            </svg>
                            View
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/issues/${issue._id}/edit`)}
                            title="Edit issue"
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15H2v-3L11.5 2.5z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost-danger btn-sm"
                            onClick={() => setDeleteModal({ open: true, issue })}
                            title="Delete issue"
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2,4 14,4" />
                              <path d="M5 4V2h6v2" />
                              <path d="M3 4l1 10h8l1-10" />
                              <line x1="6.5" y1="7" x2="6.5" y2="11" />
                              <line x1="9.5" y1="7" x2="9.5" y2="11" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete issue"
        message={`Are you sure you want to delete "${deleteModal.issue?.title}"? This will also delete all associated comments and cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, issue: null })}
        loading={deleting}
      />
    </Layout>
  );
};

export default IssuesPage;
