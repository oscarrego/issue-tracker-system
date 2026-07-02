import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LabelPicker from "../components/LabelPicker";
import { LABEL_OPTIONS, PRIORITIES, STATUSES } from "../utils/issueOptions";
import api from "../api/axios";

/* ── Status dot colours ───────────────────────────────── */
const STATUS_COLOR = {
  "Open": "#4caf82",
  "In Progress": "#e8a838",
  "Closed": "#5e6ad2",
};

const PRIORITY_COLOR = {
  "Low": "#6db56d",
  "Medium": "#e8a838",
  "High": "#e87038",
  "Urgent": "#e53e3e",
};

/* ── Generic property dropdown (profile-menu style) ───── */
const PropDropdown = ({ value, options, onChange, renderOption, renderValue }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="ci-dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="ci-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        {renderValue ? renderValue(value) : <span>{value}</span>}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </button>

      {open && (
        <div className="ci-dropdown-menu">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`ci-dropdown-item${opt === value ? " selected" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Property row wrapper ────────────────────────────── */
const PropRow = ({ icon, label, children }) => (
  <div className="ci-prop-row">
    <span className="ci-prop-label">
      {icon}
      {label}
    </span>
    <div className="ci-prop-value">{children}</div>
  </div>
);

/* ── Dot indicator ───────────────────────────────────── */
const Dot = ({ color }) => (
  <span style={{
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }} />
);

/* ── Main page ───────────────────────────────────────── */
const CreateIssuePage = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Open",
    priority: "Medium",
    labels: [],
    dueDate: "",
    assignedTo: "",
    project: "",
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          api.get("/users"),
          api.get("/projects"),
        ]);
        setUsers(usersRes.data.users || []);
        setProjects(projectsRes.data.projects || []);
      } catch {
        // Assignees and projects are optional
      } finally {
        setUsersLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        labels: form.labels,
        dueDate: form.dueDate || null,
      };
      if (form.assignedTo) payload.assignedTo = form.assignedTo;
      if (form.project) payload.project = form.project;
      const res = await api.post("/issues", payload);
      navigate(`/issues/${res.data.issue._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create issue.");
    } finally {
      setLoading(false);
    }
  };

  /* Assignee & Project options (with "none" sentinel) */
  const assigneeOptions = ["", ...users.map((u) => u._id)];
  const projectOptions  = ["", ...projects.map((p) => p._id)];

  const findUser    = (id) => users.find((u) => u._id === id);
  const findProject = (id) => projects.find((p) => p._id === id);

  return (
    <Layout title="New Issue">
      <form onSubmit={handleSubmit} noValidate className="ci-shell">
        {/* ── Top bar ──────────────────────────────────── */}
        <div className="ci-topbar">
          <Link to="/issues" className="ci-topbar-back">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="10" y1="3" x2="3" y2="8" />
              <line x1="3"  y1="8" x2="10" y2="13" />
              <line x1="3"  y1="8" x2="14" y2="8" />
            </svg>
            Issues
          </Link>
          <span className="ci-topbar-sep">›</span>
          <span className="ci-topbar-crumb">New Issue</span>
          <div className="ci-topbar-actions">
            {error && <span className="ci-topbar-error">{error}</span>}
            <Link to="/issues" className="btn btn-secondary btn-sm">Cancel</Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? "Creating…" : "Create issue"}
            </button>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────── */}
        <div className="ci-body">
          {/* Left — main content */}
          <div className="ci-main">
            <input
              id="title"
              name="title"
              type="text"
              className="ci-title-input"
              value={form.title}
              onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setError(""); }}
              placeholder="Issue title"
              autoFocus
            />
            <textarea
              id="description"
              name="description"
              className="ci-desc-input"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Add a description, steps to reproduce, expected behavior…"
            />
          </div>

          {/* Right — properties sidebar */}
          <aside className="ci-sidebar">
            <p className="ci-sidebar-heading">Properties</p>

            {/* Status */}
            <PropRow
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="7"/><polyline points="5,8 7,10 11,6"/></svg>}
              label="Status"
            >
              <PropDropdown
                value={form.status}
                options={STATUSES}
                onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                renderValue={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot color={STATUS_COLOR[v] || "#888"} />
                    {v}
                  </span>
                )}
                renderOption={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot color={STATUS_COLOR[v] || "#888"} />
                    {v}
                  </span>
                )}
              />
            </PropRow>

            {/* Priority */}
            <PropRow
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14V6l6-4 6 4v8"/><line x1="8" y1="10" x2="8" y2="14"/></svg>}
              label="Priority"
            >
              <PropDropdown
                value={form.priority}
                options={PRIORITIES}
                onChange={(v) => setForm((p) => ({ ...p, priority: v }))}
                renderValue={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Dot color={PRIORITY_COLOR[v] || "#888"} />
                    {v}
                  </span>
                )}
                renderOption={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot color={PRIORITY_COLOR[v] || "#888"} />
                    {v}
                  </span>
                )}
              />
            </PropRow>

            {/* Assignee */}
            <PropRow
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/></svg>}
              label="Assignee"
            >
              <PropDropdown
                value={form.assignedTo}
                options={assigneeOptions}
                onChange={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
                renderValue={(v) => <span>{v ? (findUser(v)?.name || "Unknown") : "Unassigned"}</span>}
                renderOption={(v) => <span>{v ? (findUser(v)?.name || "Unknown") : "Unassigned"}</span>}
              />
            </PropRow>

            {/* Project */}
            <PropRow
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M4 6h8M4 9h5"/></svg>}
              label="Project"
            >
              <PropDropdown
                value={form.project}
                options={projectOptions}
                onChange={(v) => setForm((p) => ({ ...p, project: v }))}
                renderValue={(v) => <span>{v ? (findProject(v)?.name || "Unknown") : "No project"}</span>}
                renderOption={(v) => <span>{v ? (findProject(v)?.name || "Unknown") : "No project"}</span>}
              />
            </PropRow>

            {/* Due date */}
            <PropRow
              icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="2" width="14" height="13" rx="2"/><line x1="1" y1="7" x2="15" y2="7"/><line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/></svg>}
              label="Due date"
            >
              <input
                name="dueDate"
                type="date"
                className="ci-prop-date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </PropRow>

            {
            /* Labels */
            }
            <div className="ci-labels-section">
              <p className="ci-labels-heading">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2H2v7l6.293 6.293a1 1 0 0 0 1.414 0l5.293-5.293a1 1 0 0 0 0-1.414L9 2z"/>
                  <circle cx="4.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                Labels
              </p>
              <LabelPicker
                selected={form.labels}
                onChange={(labels) => setForm((p) => ({ ...p, labels }))}
              />
            </div>
          </aside>
        </div>
      </form>
    </Layout>
  );
};

export default CreateIssuePage;
