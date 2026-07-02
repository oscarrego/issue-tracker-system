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
          <div className="empty-illustration">
            <span />
          </div>
          <h2>{issues.length ? "Select an issue" : "All caught up"}</h2>
          <p>{issues.length ? "Open an item from the left to review it." : "Issues assigned to you will appear here."}</p>
        </section>
      </div>
    </Layout>
  );
};

export default InboxPage;
