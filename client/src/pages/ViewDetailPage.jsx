import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import LabelChips from "../components/LabelChips";
import { formatDate, isOverdue } from "../utils/issueOptions";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const ViewDetailPage = () => {
  const { id } = useParams();
  const { cache, setDetailCacheValue } = useData();
  const cachedDetail = cache.viewDetails[id];
  const [view, setView] = useState(cachedDetail?.view || null);
  const [issues, setIssues] = useState(cachedDetail?.issues || []);
  const [loading, setLoading] = useState(!cachedDetail);

  useEffect(() => {
    if (!cachedDetail) setLoading(true);
    api.get(`/views/${id}`)
      .then(({ data }) => {
        setView(data.view);
        setIssues(data.issues || []);
        setDetailCacheValue("viewDetails", id, { view: data.view, issues: data.issues || [] });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Layout title="View"><LoadingSpinner /></Layout>;
  if (!view) return <Layout title="View"><p className="page-subtitle">View not found.</p></Layout>;

  return (
    <Layout title={view.name}>
      <Link to="/views" className="back-link">All views</Link>
      <div className="page-header"><div className="page-header-left"><h1 className="page-title">{view.name}</h1><p className="page-subtitle">{view.description || `${issues.length} matching issues`}</p></div></div>
      <div className="card"><div className="table-wrapper"><table className="table"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Labels</th><th>Due</th><th>Project</th></tr></thead><tbody>
        {issues.length === 0 ? <tr><td colSpan={6}><div className="table-empty">No issues match this view.</div></td></tr> : issues.map((issue) => (
          <tr key={issue._id} className={isOverdue(issue.dueDate, issue.status) ? "overdue-row" : ""}>
            <td><Link className="table-issue-title" to={`/issues/${issue._id}`}>{issue.title}</Link></td>
            <td><StatusBadge status={issue.status} /></td>
            <td><PriorityBadge priority={issue.priority} /></td>
            <td><LabelChips labels={issue.labels || []} /></td>
            <td className={isOverdue(issue.dueDate, issue.status) ? "due-overdue" : ""}>{issue.dueDate ? formatDate(issue.dueDate) : "-"}</td>
            <td>{issue.project?.name || "-"}</td>
          </tr>
        ))}
      </tbody></table></div></div>
    </Layout>
  );
};

export default ViewDetailPage;
