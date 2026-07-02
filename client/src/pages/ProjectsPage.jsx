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

const STATUS_CHIPS = [
  {
    value: "Planning",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="12" height="11" rx="2"/>
        <path d="M5 1v4M11 1v4M2 7h12"/>
      </svg>
    ),
  },
  {
    value: "In Progress",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/>
        <path d="M8 5v3l2 2"/>
      </svg>
    ),
  },
  {
    value: "On Hold",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="3" height="10" rx="1"/>
        <rect x="9" y="3" width="3" height="10" rx="1"/>
      </svg>
    ),
  },
  {
    value: "Completed",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/>
        <polyline points="5,8 7,10 11,6"/>
      </svg>
    ),
  },
  {
    value: "Cancelled",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/>
        <line x1="5" y1="5" x2="11" y2="11"/>
        <line x1="11" y1="5" x2="5" y2="11"/>
      </svg>
    ),
  },
];

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
      <div className="modal project-notion-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="project-notion-header">
          <div className="project-notion-breadcrumb">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h12M2 8h12M2 13h12" />
            </svg>
            <span>Projects</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,3 10,8 6,13" />
            </svg>
            <span>{project?._id ? "Edit project" : "New project"}</span>
          </div>
          <button className="project-notion-close" type="button" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={save}>
          <div className="project-notion-body">
            {/* Project icon */}
            <div className="project-notion-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="14" height="10" rx="2" />
                <path d="M4 6h8M4 9h5" />
              </svg>
            </div>

            {/* Name */}
            <input
              id="project-name"
              className="project-notion-name"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
              placeholder="Project name"
              autoFocus
            />

            {/* Summary */}
            <input
              className="project-notion-summary"
              value={form.summary || ""}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Add a short summary..."
            />

            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

            {/* Status chips */}
            <div className="project-notion-chips">
              {STATUS_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  className={`project-notion-chip${form.status === chip.value ? " selected" : ""}`}
                  onClick={() => setForm({ ...form, status: chip.value })}
                >
                  {chip.icon}
                  {chip.value}
                </button>
              ))}
            </div>

            {/* Description */}
            <textarea
              id="project-description"
              className="project-notion-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write a description, a project brief, or collect ideas..."
            />
          </div>

          {/* Footer */}
          <div className="project-notion-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : (project?._id ? "Save changes" : "Create project")}
            </button>
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
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => { setModalProject(project); setModalOpen(true); }}
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15H2v-3L11.5 2.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => setDeleteTarget(project)}
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,4 13,4"/><path d="M5 4V3h6v1"/><path d="M6 7v5M10 7v5"/><rect x="2" y="4" width="12" height="10" rx="2"/>
                    </svg>
                    Delete
                  </button>
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
