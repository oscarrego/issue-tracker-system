import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import InvitePeopleModal from "../components/InvitePeopleModal";
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useData } from "../context/DataContext";

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const MembersPage = () => {
  const { user } = useAuth();
  const { cache, setCacheValue } = useData();
  const [members, setMembers] = useState(cache.members || []);
  const [loading, setLoading] = useState(!cache.members);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    if (!cache.members) {
      setLoading(true);
    }
    try {
      const { data } = await api.get("/users");
      setMembers(data.users || []);
      setCacheValue("members", data.users || []);
    } catch {
      setError("Could not load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchMembers, 0);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      `${member.name} ${member.email}`.toLowerCase().includes(term)
    );
  }, [members, search]);

  const removeMember = async () => {
    if (!removeTarget || confirmText !== removeTarget.name) return;
    setRemoving(true);
    setError("");
    try {
      await api.delete(`/users/${removeTarget._id}`);
      const updated = members.filter((member) => member._id !== removeTarget._id);
      setMembers(updated);
      setCacheValue("members", updated);
      setRemoveTarget(null);
      setConfirmText("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove member.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Layout title="Members">
      <div className="workspace-panel members-panel">
        <div className="members-header">
          <div>
            <h1 className="page-title">Members</h1>
            <p className="page-subtitle">Invite, review, and remove workspace members.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => setInviteOpen(true)}>
            Invite
          </button>
        </div>

        <div className="filters-bar">
          <div className="filter-search wide">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6.5" cy="6.5" r="5.5" />
              <path d="m10.5 10.5 3.5 3.5" />
            </svg>
            <input
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="members-table">
            <div className="members-row members-head">
              <span>Name</span>
              <span>Email</span>
              <span>Status</span>
              <span>Joined</span>
              <span />
            </div>
            <div className="members-section">Active {filtered.length}</div>
            {filtered.map((member) => (
              <div className="members-row" key={member._id}>
                <div className="member-identity">
                  <Avatar user={member} />
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email.split("@")[0]}</small>
                  </div>
                </div>
                <span>{member.email}</span>
                <span><b className="online-dot" /> {member._id === user?.id ? "You" : "Member"}</span>
                <span>{formatDate(member.createdAt)}</span>
                <span className="member-actions">
                  {member._id !== user?.id && (
                    <button className="btn btn-ghost-danger btn-sm" type="button" onClick={() => setRemoveTarget(member)}>
                      Remove
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <InvitePeopleModal isOpen={inviteOpen} onClose={() => { setInviteOpen(false); fetchMembers(); }} />

      {removeTarget && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => setRemoveTarget(null)}>
          <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Remove {removeTarget.name}?</h2>
            <p className="modal-body">
              This removes the member from the workspace and unassigns their issues. Type their name to confirm.
            </p>
            <input
              className="form-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={removeTarget.name}
              autoFocus
            />
            <div className="modal-actions double-confirm-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setRemoveTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={confirmText !== removeTarget.name || removing}
                onClick={removeMember}
              >
                {removing ? "Removing..." : "Remove member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MembersPage;
