import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import LabelChips from "../components/LabelChips";
import { formatDate } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { cache, setDetailCacheValue } = useData();
  const cachedDetail = cache.projectDetails[id];
  const [project, setProject] = useState(cachedDetail?.project || null);
  const [issues, setIssues] = useState(cachedDetail?.issues || []);
  const [loading, setLoading] = useState(!cachedDetail);

  useEffect(() => {
    if (!cachedDetail) setLoading(true);
    api.get(`/projects/${id}`)
      .then(({ data }) => {
        setProject(data.project);
        setIssues(data.issues || []);
        setDetailCacheValue("projectDetails", id, { project: data.project, issues: data.issues || [] });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Layout title="Project"><LoadingSpinner /></Layout>;
  if (!project) return <Layout title="Project"><p className="page-subtitle">Project not found.</p></Layout>;

  return (
    <Layout title={project.name}>
      <Link to="/projects" className="back-link">All projects</Link>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || "No description"}</p>
        </div>
        <span className="project-status">{project.status}</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-card-label">Total</span><b className="stat-card-value">{project.stats.total}</b></div>
        <div className="stat-card"><span className="stat-card-label">Open</span><b className="stat-card-value">{project.stats.open}</b></div>
        <div className="stat-card"><span className="stat-card-label">In Progress</span><b className="stat-card-value">{project.stats.inProgress}</b></div>
        <div className="stat-card"><span className="stat-card-label">Closed</span><b className="stat-card-value">{project.stats.closed}</b></div>
      </div>
      <div className="progress-bar project-progress"><span style={{ width: `${project.stats.progress}%` }} /></div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Project Issues</h2></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Labels</th><th>Created</th></tr></thead>
            <tbody>
              {issues.length === 0 ? <tr><td colSpan={5}><div className="table-empty">No issues in this project.</div></td></tr> : issues.map((issue) => (
                <tr key={issue._id}>
                  <td><Link className="table-issue-title" to={`/issues/${issue._id}`}>{issue.title}</Link></td>
                  <td><StatusBadge status={issue.status} /></td>
                  <td><PriorityBadge priority={issue.priority} /></td>
                  <td><LabelChips labels={issue.labels || []} /></td>
                  <td>{formatDate(issue.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetailPage;
