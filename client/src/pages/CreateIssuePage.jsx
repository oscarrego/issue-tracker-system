import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LabelPicker from "../components/LabelPicker";
import { LABEL_OPTIONS, PRIORITIES, STATUSES } from "../utils/issueOptions";
import api from "../api/axios";

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
        // Assignees and projects are optional for the form
      } finally {
        setUsersLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
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

  return (
    <Layout title="New Issue">
      <Link to="/issues" className="back-link">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="3" x2="3" y2="8" />
          <line x1="3" y1="8" x2="10" y2="13" />
          <line x1="3" y1="8" x2="14" y2="8" />
        </svg>
        Back to Issues
      </Link>

      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div className="page-header-left">
          <h1 className="page-title">Create Issue</h1>
          <p className="page-subtitle">Fill in the details to open a new issue</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="issue-form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-input ${!form.title && error ? "error" : ""}`}
              value={form.title}
              onChange={handleChange}
              placeholder="Short, descriptive title for the issue"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description <span className="form-label-optional"></span>
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail - steps to reproduce, expected behavior, etc..."
              rows={5}
            />
          </div>

          <div className="form-grid two">
            <div className="form-group">
              <label className="form-label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-select"
                value={form.status}
                onChange={handleChange}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={form.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid two">
            <div className="form-group">
              <label className="form-label" htmlFor="assignedTo">
                Assign to <span className="form-label-optional"></span>
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                className="form-select"
                value={form.assignedTo}
                onChange={handleChange}
                disabled={usersLoading}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="project">
                Project <span className="form-label-optional"></span>
              </label>
              <select
                id="project"
                name="project"
                className="form-select"
                value={form.project}
                onChange={handleChange}
                disabled={usersLoading}
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid two">
            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">
                Due date <span className="form-label-optional"></span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Labels <span className="form-label-optional"></span>
              </label>
              <LabelPicker
                selected={form.labels}
                onChange={(labels) => setForm((prev) => ({ ...prev, labels }))}
              />
            </div>
          </div>

          <div className="issue-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create issue"}
            </button>
            <Link to="/issues" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateIssuePage;
