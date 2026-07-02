import { useState } from "react";
import api from "../api/axios";

const splitEmails = (value) =>
  value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);

const InvitePeopleModal = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await api.post("/users/invite", {
        emails: splitEmails(emails),
      });
      const sent = data.invites?.filter((invite) => invite.status === "sent").length || 0;
      setEmails("");
      setMessage(
        data.emailConfigured
          ? `${sent} invite${sent === 1 ? "" : "s"} sent.`
          : `SMTP feature will be added soon`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not send invites.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className="modal invite-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">Invite people</h2>
            <p className="modal-kicker">Enter one or more email addresses.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="invite-emails">Emails</label>
            <textarea
              id="invite-emails"
              className="form-textarea"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="maya@example.com, team@example.com"
              rows={4}
              autoFocus
            />
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvitePeopleModal;
