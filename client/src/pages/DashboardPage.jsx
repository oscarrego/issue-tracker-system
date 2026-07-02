import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <span className="stat-card-label">{label}</span>
    </div>
    <div className="stat-card-value">{value ?? "—"}</div>
    <div className="stat-card-meta">All time</div>
  </div>
);

const DashboardPage = () => {
  const { cache, setCacheValue } = useData();
  const [data, setData] = useState(cache.dashboard);
  const [loading, setLoading] = useState(!cache.dashboard);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!cache.dashboard) setLoading(true);
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
        setCacheValue("dashboard", res.data);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of all issues and activity</p>
        </div>
        <Link to="/issues/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          New Issue
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Total Issues" value={data?.stats?.total} />
        <StatCard label="Open"         value={data?.stats?.open} />
        <StatCard label="In Progress"  value={data?.stats?.inProgress} />
        <StatCard label="Closed"       value={data?.stats?.closed} />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Issues</h2>
          <Link to="/issues" className="btn btn-secondary btn-sm">
            View all
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.recentIssues || data.recentIssues.length === 0) ? (
                <tr>
                  <td colSpan={4}>
                    <div className="table-empty">
                      <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="8" r="7" />
                        <circle cx="8" cy="8" r="2" />
                      </svg>
                      No issues yet.{" "}
                      <Link to="/issues/new">Create the first one.</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data.recentIssues.map((issue) => (
                  <tr key={issue._id}>
                    <td>
                      <Link
                        to={`/issues/${issue._id}`}
                        className="table-issue-title"
                      >
                        {issue.title}
                      </Link>
                      <div className="table-meta">
                        #{issue._id.slice(-6)} · by {issue.createdBy?.name || "Unknown"}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={issue.status} />
                    </td>
                    <td style={{ color: issue.assignedTo ? "var(--color-text)" : "var(--color-text-subtle)", fontSize: "13px" }}>
                      {issue.assignedTo ? (
                        <span className="person-cell">
                          <Avatar user={issue.assignedTo} size={22} />
                          {issue.assignedTo.name}
                        </span>
                      ) : "Unassigned"}
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>
                      {formatDate(issue.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
