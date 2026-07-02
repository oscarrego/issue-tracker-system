import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const InboxPage = () => {
  const { user } = useAuth();
  const { cache, setCacheValue } = useData();
  const [issues, setIssues] = useState(cache.inbox || []);
  const [loading, setLoading] = useState(!cache.inbox);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!cache.inbox) {
        setLoading(true);
      }
      try {
        const { data } = await api.get("/issues", { params: { assignedTo: user?.id } });
        setIssues(data.issues || []);
        setCacheValue("inbox", data.issues || []);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchIssues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <Layout title="Inbox">
      <div className="workspace-panel split-panel">
        <section className="inbox-list-pane">
          <div className="panel-toolbar">
            <h1 className="page-title">Inbox</h1>
            <span className="count-pill">{issues.length}</span>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : issues.length === 0 ? (
            <div className="quiet-state small">No assigned issues yet.</div>
          ) : (
            <div className="compact-list">
              {issues.map((issue) => (
                <Link className="compact-list-item" key={issue._id} to={`/issues/${issue._id}`}>
                  <span className="issue-ring" />
                  <span className="compact-list-text">
                    <strong>{issue.title}</strong>
                    <small>{issue.createdBy?.name || "Unknown"} assigned this to you</small>
                  </span>
                  <span className="list-badge-pair">
                    <PriorityBadge priority={issue.priority} noIcon />
                    <StatusBadge status={issue.status} noIcon />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="inbox-detail-pane">
          <div className="inbox-brand-logo">
            <svg width="52" height="52" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)" }}>
              <circle cx="11" cy="11" r="10" />
              <circle cx="11" cy="11" r="3" />
              <line x1="11" y1="1" x2="11" y2="8" />
              <line x1="11" y1="14" x2="11" y2="21" />
            </svg>
            <span className="inbox-brand-name">IssueTracker</span>
          </div>
          <h2>{issues.length ? "Select an issue" : "All caught up"}</h2>
          <p>{issues.length ? "Open an item from the left to review it." : "Issues assigned to you will appear here."}</p>
        </section>
      </div>
    </Layout>
  );
};

export default InboxPage;
