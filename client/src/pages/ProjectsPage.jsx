import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import { PROJECT_STATUSES, formatDate } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const emptyForm = { name: "", description: "", status: "Planning" };

const ProjectModal = ({ project, onClose, onSaved }) => {
  const [form, setForm] = useState(project || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Project name is required.");
    setSaving(true);
    try {
      if (project?._id) await api.put(`/projects/${project._id}`, form);
      else await api.post("/projects", form);
      onSaved(project?._id ? "Project updated." : "Project created.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className="modal invite-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{project?._id ? "Edit project" : "New project"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">Project Name</label>
            <input id="project-name" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-description">Description</label>
            <textarea id="project-description" className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="project-status">Status</label>
            <select id="project-status" className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save project"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const { cache, setCacheValue } = useData();
  const [projects, setProjects] = useState(cache.projects || []);
  const [loading, setLoading] = useState(!cache.projects);
  const [modalProject, setModalProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");

  const fetchProjects = async () => {
    if (!cache.projects) {
      setLoading(true);
    }
    try {
      const { data } = await api.get("/projects");
      setProjects(data.projects || []);
      setCacheValue("projects", data.projects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchProjects, 0);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saved = (message) => {
    setModalOpen(false);
    setModalProject(null);
    setToast(message);
    fetchProjects();
  };

  const deleteProject = async () => {
    await api.delete(`/projects/${deleteTarget._id}`);
    setDeleteTarget(null);
    setToast("Project deleted.");
    fetchProjects();
  };

  return (
    <Layout title="Projects">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Group issues into lightweight bodies of work.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => { setModalProject(null); setModalOpen(true); }}>New Project</button>
      </div>

      {loading ? <LoadingSpinner /> : projects.length === 0 ? (
        <div className="quiet-state">
          <div className="empty-illustration"><span /></div>
          <h2>No projects yet.</h2>
          <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>Create your first project</button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <div className="project-card" key={project._id}>
              <div className="project-card-head">
                <Link className="project-title" to={`/projects/${project._id}`}>{project.name}</Link>
                <span className="project-status">{project.status}</span>
              </div>
              <p>{project.description || "No description"}</p>
              <div className="progress-bar"><span style={{ width: `${project.stats?.progress || 0}%` }} /></div>
              <div className="project-stats">
                <span>Total <b>{project.stats?.total || 0}</b></span>
                <span>Open <b>{project.stats?.open || 0}</b></span>
                <span>Progress <b>{project.stats?.progress || 0}%</b></span>
              </div>
              <div className="project-card-foot">
                <small>Created {formatDate(project.createdAt)}</small>
                <span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setModalProject(project); setModalOpen(true); }}>Edit</button>
                  <button className="btn btn-ghost-danger btn-sm" type="button" onClick={() => setDeleteTarget(project)}>Delete</button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <ProjectModal project={modalProject} onClose={() => setModalOpen(false)} onSaved={saved} />}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete project"
        message={`Delete "${deleteTarget?.name}"? Related issues will stay, but their project will be cleared.`}
        onConfirm={deleteProject}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
};

export default ProjectsPage;
