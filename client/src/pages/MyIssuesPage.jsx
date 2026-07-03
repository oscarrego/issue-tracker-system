import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { formatDate, isOverdue } from "../utils/issueOptions";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const tabs = [
  { key: "assigned", label: "Assigned" },
  { key: "created", label: "Created" },
];

const MyIssuesPage = () => {
  const { user } = useAuth();
  const { cache, setCacheValue } = useData();
  const [activeTab, setActiveTab] = useState("assigned");
  const cachedIssues = activeTab === "assigned" ? cache.myIssuesAssigned : cache.myIssuesCreated;
  const [issues, setIssues] = useState(cachedIssues || []);
  const [loading, setLoading] = useState(!cachedIssues);

  useEffect(() => {
    const nextCached = activeTab === "assigned" ? cache.myIssuesAssigned : cache.myIssuesCreated;
    setIssues(nextCached || []);
    setLoading(!nextCached);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const fetchIssues = async () => {
      const currentCached = activeTab === "assigned" ? cache.myIssuesAssigned : cache.myIssuesCreated;
      if (!currentCached) {
        setLoading(true);
      }
      try {
        const params = activeTab === "assigned"
          ? { assignedTo: user?.id }
          : { createdBy: user?.id };
        const { data } = await api.get("/issues", { params });
        setIssues(data.issues || []);
        setCacheValue(activeTab === "assigned" ? "myIssuesAssigned" : "myIssuesCreated", data.issues || []);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchIssues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id]);

  return (
    <Layout title="My issues">
      <div className="workspace-panel">
        <div className="panel-toolbar">
          <h1 className="page-title">My issues</h1>
          <div className="segmented-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? "active" : ""}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : issues.length === 0 ? (
          <div className="quiet-state">
            <div style={{ marginTop: "80px", marginBottom: "12px", display: "flex", justifyContent: "center" }}>
              <svg width="96" height="96" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", opacity: 0.9 }}>
                <circle cx="11" cy="11" r="10" />
                <circle cx="11" cy="11" r="3" />
                <line x1="11" y1="1" x2="11" y2="8" />
                <line x1="11" y1="14" x2="11" y2="21" />
              </svg>
            </div>
            <h2>No issues {activeTab === "assigned" ? "assigned to you" : "created by you"}</h2>
            <Link className="btn btn-primary" to="/issues/new">Create new issue</Link>
          </div>
        ) : (
          <div className="linear-list">
            {issues.map((issue) => (
              <Link className="linear-list-row" key={issue._id} to={`/issues/${issue._id}`}>
                <span className="issue-ring" />
                <span className="issue-key">ISS-{issue._id.slice(-3).toUpperCase()}</span>
                <strong>{issue.title}</strong>
                <span className="list-badge-pair">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </span>
                <small className={isOverdue(issue.dueDate, issue.status) ? "due-overdue" : ""}>
                  {issue.dueDate ? formatDate(issue.dueDate) : issue.assignedTo?.name || "Unassigned"}
                </small>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyIssuesPage;
