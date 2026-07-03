import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import LabelPicker from "../components/LabelPicker";
import { PRIORITIES, STATUSES } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const EditIssuePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cache, setCacheValue, setDetailCacheValue } = useData();
  const cachedIssue = cache.issueDetails[id];
  const cachedUsers = cache.members;
  const cachedProjects = cache.projects;

  const [form, setForm] = useState(
    cachedIssue
      ? {
          title: cachedIssue.title,
          description: cachedIssue.description || "",
          status: cachedIssue.status,
          priority: cachedIssue.priority || "Medium",
          labels: cachedIssue.labels || [],
          dueDate: cachedIssue.dueDate ? cachedIssue.dueDate.slice(0, 10) : "",
          assignedTo: cachedIssue.assignedTo?._id || cachedIssue.assignedTo || "",
          project: cachedIssue.project?._id || cachedIssue.project || "",
        }
      : {
          title: "",
          description: "",
          status: "Open",
          priority: "Medium",
          labels: [],
          dueDate: "",
          assignedTo: "",
          project: "",
        }
  );
  const [users, setUsers] = useState(cachedUsers || []);
  const [projects, setProjects] = useState(cachedProjects || []);
  const [loading, setLoading] = useState(!cachedIssue || !cachedUsers || !cachedProjects);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!cachedIssue || !cachedUsers || !cachedProjects) {
        setLoading(true);
      }
      try {
        const [issueRes, usersRes, projectsRes] = await Promise.all([
          api.get(`/issues/${id}`),
          api.get("/users"),
          api.get("/projects"),
        ]);
        const issue = issueRes.data.issue;
        setForm({
          title: issue.title,
          description: issue.description || "",
          status: issue.status,
          priority: issue.priority || "Medium",
          labels: issue.labels || [],
          dueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : "",
          assignedTo: issue.assignedTo?._id || "",
          project: issue.project?._id || "",
        });
        setUsers(usersRes.data.users || []);
        setProjects(projectsRes.data.projects || []);

        setDetailCacheValue("issueDetails", id, issue);
        setCacheValue("members", usersRes.data.users || []);
        setCacheValue("projects", projectsRes.data.projects || []);
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
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

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
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        labels: form.labels,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        project: form.project || null,
      };
      await api.put(`/issues/${id}`, payload);
      navigate(`/issues/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update issue.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Issue">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Edit Issue">
      <Link to={`/issues/${id}`} className="back-link">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="3" x2="3" y2="8" />
          <line x1="3" y1="8" x2="10" y2="13" />
          <line x1="3" y1="8" x2="14" y2="8" />
        </svg>
        Back to Issue
      </Link>

      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div className="page-header-left">
          <h1 className="page-title">Edit Issue</h1>
          <p className="page-subtitle">Update the issue details below</p>
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
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
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
                Assign to
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                className="form-select"
                value={form.assignedTo}
                onChange={handleChange}
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
                Project
              </label>
              <select
                id="project"
                name="project"
                className="form-select"
                value={form.project}
                onChange={handleChange}
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
                Due date
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
              <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>
                Labels
              </label>
              <LabelPicker
                selected={form.labels}
                onChange={(labels) => {
                  setForm((prev) => ({ ...prev, labels }));
                  setError("");
                }}
              />
            </div>
          </div>

          <div className="issue-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <Link to={`/issues/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditIssuePage;
