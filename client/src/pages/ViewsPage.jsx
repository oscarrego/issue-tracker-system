import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import LabelPicker from "../components/LabelPicker";
import { LABEL_OPTIONS, PRIORITIES, STATUSES, formatDate } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const emptyView = { name: "", description: "", search: "", status: "", assignee: "", project: "", priority: "", labels: [] };

const ViewModal = ({ view, users, projects, onClose, onSaved }) => {
  const [form, setForm] = useState(view ? {
    ...emptyView,
    ...view,
    assignee: view.assignee?._id || view.assignee || "",
    project: view.project?._id || view.project || "",
  } : emptyView);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("View name is required.");
    setSaving(true);
    try {
      if (view?._id) await api.put(`/views/${view._id}`, form);
      else await api.post("/views", form);
      onSaved(view?._id ? "View updated." : "View created.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save view.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className="modal invite-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{view?._id ? "Edit view" : "Create view"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={save}>
          <div className="form-grid two">
            <div className="form-group"><label className="form-label">View Name</label><input name="name" className="form-input" value={form.name} onChange={change} autoFocus /></div>
            <div className="form-group"><label className="form-label">Search Text</label><input name="search" className="form-input" value={form.search} onChange={change} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea name="description" className="form-textarea" value={form.description} onChange={change} rows={3} /></div>
          <div className="form-grid two">
            <div className="form-group"><label className="form-label">Status</label><select name="status" className="form-select" value={form.status} onChange={change}><option value="">Any</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Priority</label><select name="priority" className="form-select" value={form.priority} onChange={change}><option value="">Any</option>{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Assignee</label><select name="assignee" className="form-select" value={form.assignee || ""} onChange={change}><option value="">Any</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Project</label><select name="project" className="form-select" value={form.project || ""} onChange={change}><option value="">Any</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Labels</label><LabelPicker selected={form.labels || []} onChange={(lbls) => setForm((prev) => ({ ...prev, labels: lbls }))} /></div>
          <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save view"}</button></div>
        </form>
      </div>
    </div>
  );
};

const ViewsPage = () => {
  const { cache, setCacheValue } = useData();
  const [views, setViews] = useState(cache.views || []);
  const [users, setUsers] = useState(cache.members || []);
  const [projects, setProjects] = useState(cache.projects || []);
  const [loading, setLoading] = useState(!cache.views || !cache.members || !cache.projects);
  const [modalView, setModalView] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");

  const load = async () => {
    if (!cache.views || !cache.members || !cache.projects) {
      setLoading(true);
    }
    try {
      const [viewsRes, usersRes, projectsRes] = await Promise.all([
        api.get("/views"),
        api.get("/users"),
        api.get("/projects")
      ]);
      setViews(viewsRes.data.views || []);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data.projects || []);
      setCacheValue("views", viewsRes.data.views || []);
      setCacheValue("members", usersRes.data.users || []);
      setCacheValue("projects", projectsRes.data.projects || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saved = (message) => { setModalOpen(false); setModalView(null); setToast(message); load(); };
  const remove = async () => { await api.delete(`/views/${deleteTarget._id}`); setDeleteTarget(null); setToast("View deleted."); load(); };

  return (
    <Layout title="Views">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="page-header"><div className="page-header-left"><h1 className="page-title">Views</h1><p className="page-subtitle">Saved issue filters for focused work.</p></div><button className="btn btn-primary" type="button" onClick={() => { setModalView(null); setModalOpen(true); }}>Create View</button></div>
      {loading ? <LoadingSpinner /> : views.length === 0 ? (
        <div className="quiet-state">
          <div style={{ marginTop: "80px", marginBottom: "12px", display: "flex", justifyContent: "center" }}>
            <svg width="96" height="96" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", opacity: 0.9 }}>
              <circle cx="11" cy="11" r="10" />
              <circle cx="11" cy="11" r="3" />
              <line x1="11" y1="1" x2="11" y2="8" />
              <line x1="11" y1="14" x2="11" y2="21" />
            </svg>
          </div>
          <h2>No saved views yet.</h2>
          
        </div>
      ) : (
        <div className="project-grid">
          {views.map((view) => (
            <div className="project-card" key={view._id}>
              <div className="project-card-head"><Link className="project-title" to={`/views/${view._id}`}>{view.name}</Link><span className="count-pill">{view.matchingIssues || 0}</span></div>
              <p>{view.description || "No description"}</p>
              <div className="label-chip-row">{view.status && <span className="label-chip">{view.status}</span>}{view.priority && <span className="label-chip">{view.priority}</span>}{(view.labels || []).map((label) => <span className="label-chip" key={label}>{label}</span>)}</div>
              <div className="project-card-foot"><small>Created {formatDate(view.createdAt)}</small><span><button className="btn btn-ghost btn-sm" onClick={() => { setModalView(view); setModalOpen(true); }}>Edit</button><button className="btn btn-ghost-danger btn-sm" onClick={() => setDeleteTarget(view)}>Delete</button></span></div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && <ViewModal view={modalView} users={users} projects={projects} onClose={() => setModalOpen(false)} onSaved={saved} />}
      <ConfirmModal isOpen={Boolean(deleteTarget)} title="Delete view" message={`Delete "${deleteTarget?.name}"?`} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </Layout>
  );
};

export default ViewsPage;
