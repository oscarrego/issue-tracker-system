import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InvitePeopleModal from "./InvitePeopleModal";
import Avatar from "./Avatar";
import { Icons } from "./AppIcons";
import api from "../api/axios";

const sidebarDefaults = {
  inbox: true,
  myIssues: true,
  dashboard: true,
  issues: true,
  newIssue: true,
  projects: true,
  views: true,
  invite: true,
  github: true,
};

const sidebarGroups = [
  {
    title: "Personal",
    items: [
      ["inbox", "Inbox"],
      ["myIssues", "My issues"],
    ],
  },
  {
    title: "Workspace",
    items: [
      ["dashboard", "Dashboard"],
      ["issues", "Issues"],
      ["newIssue", "New issue"],
      ["projects", "Projects"],
      ["views", "Views"],
    ],
  },
  {
    title: "Try",
    items: [
      ["invite", "Invite people"],
      ["github", "Connect GitHub"],
    ],
  },
];

const ToggleRow = ({ label, checked, onChange }) => (
  <button type="button" className="customize-row" onClick={onChange}>
    <span>{label}</span>
    <em className={checked ? "customize-pill visible" : "customize-pill hidden"}>
      {checked ? "Visible" : "Hidden"}
    </em>
  </button>
);

const Sidebar = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [tryOpen, setTryOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [githubStatus, setGithubStatus] = useState("");
  const [visibleItems, setVisibleItems] = useState(() => {
    const stored = localStorage.getItem("sidebar_visibility");
    return stored ? { ...sidebarDefaults, ...JSON.parse(stored) } : sidebarDefaults;
  });
  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("sidebar_visibility", JSON.stringify(visibleItems));
  }, [visibleItems]);

  useEffect(() => {
    const handle = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const savePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Please select a PNG, JPG, or WebP image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const avatar = ev.target.result;
      setProfilePic(avatar);
      try {
        const { data } = await api.put("/users/me/avatar", { avatar });
        updateUser(data.user);
      } catch {
        setGithubStatus("Could not save profile photo for other members yet.");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const connectGithub = async () => {
    setGithubStatus("");
    try {
      const { data } = await api.get("/users/github");
      window.open(data.url, "_blank", "noopener,noreferrer");
      if (!data.configured) setGithubStatus(data.message);
    } catch {
      setGithubStatus("Could not start GitHub connection.");
    }
  };

  const toggleItem = (key) => {
    setVisibleItems((current) => ({ ...current, [key]: !current[key] }));
  };

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef(null);

  const openNameEdit = () => {
    setNameValue(user?.name || "");
    setNameError("");
    setEditingName(true);
    // Focus input on next tick after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) { setNameError("Name cannot be empty."); return; }
    if (trimmed === user?.name) { setEditingName(false); return; }
    setNameSaving(true);
    setNameError("");
    try {
      const { data } = await api.put("/users/me/name", { name: trimmed });
      updateUser(data.user);
      setEditingName(false);
    } catch (err) {
      setNameError(err.response?.data?.message || "Could not update name.");
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header-row">
        <div className="sidebar-top-profile" ref={menuRef}>
          <button className="workspace-button" type="button" onClick={() => setMenuOpen((value) => {
            if (value) setEditingName(false);
            return !value;
          })}>
            <Avatar user={user} src={profilePic || user?.avatar} />
            <span>{user?.name || "Workspace"}</span>
            {menuOpen ? Icons.chevronDown : Icons.chevronRight}
          </button>

          {menuOpen && (
            <div className="profile-menu">
              {editingName ? (
                <div className="profile-name-edit">
                  <input
                    ref={nameInputRef}
                    className="profile-name-input"
                    type="text"
                    value={nameValue}
                    maxLength={60}
                    onChange={(e) => { setNameValue(e.target.value); setNameError(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    placeholder="Your name"
                    disabled={nameSaving}
                  />
                  <div className="profile-name-actions">
                    <button
                      className="profile-name-btn confirm"
                      type="button"
                      onClick={saveName}
                      disabled={nameSaving}
                      title="Save name"
                    >
                      {nameSaving ? (
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 1v3M8 12v3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M1 8h3M12 8h3M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,8 6,12 14,4" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="profile-name-btn cancel"
                      type="button"
                      onClick={() => setEditingName(false)}
                      title="Cancel"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="3" x2="13" y2="13" />
                        <line x1="13" y1="3" x2="3" y2="13" />
                      </svg>
                    </button>
                  </div>
                  {nameError && <div className="profile-name-error">{nameError}</div>}
                </div>
              ) : (
                <button className="profile-menu-item" onClick={openNameEdit}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.5 2.5a2.121 2.121 0 0 1 3 3L5 15H2v-3L11.5 2.5z" />
                  </svg>
                  Edit name
                </button>
              )}
              <button className="profile-menu-item" onClick={() => { setInviteOpen(true); setMenuOpen(false); }}>
                {Icons.invite} Invite members
              </button>
              <button className="profile-menu-item" onClick={() => { navigate("/members"); setMenuOpen(false); }}>
                {Icons.members} Manage members
              </button>
              <button className="profile-menu-item" onClick={() => fileInputRef.current?.click()}>
                {Icons.camera} Change profile photo
              </button>
              <button className="profile-menu-item logout" onClick={logout}>
                {Icons.logout} Log out
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-history">
          <button className="sidebar-history-btn" type="button" aria-label="Go back" onClick={() => navigate(-1)}>
            {Icons.back}
          </button>
          <button className="sidebar-history-btn" type="button" aria-label="Go forward" onClick={() => navigate(1)}>
            {Icons.forward}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.inbox && (
          <NavLink to="/inbox" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            {Icons.inbox} Inbox
          </NavLink>
        )}
        {visibleItems.myIssues && (
          <NavLink to="/my-issues" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            {Icons.my} My issues
          </NavLink>
        )}

        <button className="sidebar-section-toggle" type="button" onClick={() => setWorkspaceOpen((value) => !value)}>
          <span>Workspace</span>
          {workspaceOpen ? Icons.chevronDown : Icons.chevronRight}
        </button>
        {workspaceOpen && (
          <>
            {visibleItems.dashboard && (
              <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                {Icons.grid} Dashboard
              </NavLink>
            )}
            {visibleItems.issues && (
              <NavLink to="/issues" end className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                {Icons.issue} Issues
              </NavLink>
            )}
            {visibleItems.newIssue && (
              <NavLink to="/issues/new" end className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                {Icons.plus} New issue
              </NavLink>
            )}
            {visibleItems.projects && (
              <NavLink to="/projects" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                {Icons.project} Projects
              </NavLink>
            )}
            {visibleItems.views && (
              <NavLink to="/views" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                {Icons.views} Views
              </NavLink>
            )}
          </>
        )}

        <div className="sidebar-more-wrap" ref={moreRef}>
          <button className={`sidebar-link sidebar-more-trigger${moreOpen ? " active" : ""}`} type="button" onClick={() => setMoreOpen((value) => !value)}>
            {Icons.more} More
          </button>
          {moreOpen && (
            <div className="sidebar-more-menu">
              <button type="button" onClick={() => { navigate("/members"); setMoreOpen(false); }}>
                {Icons.members} Members
              </button>
             
              <button type="button" onClick={() => { setCustomizeOpen(true); setMoreOpen(false); }}>
                {Icons.settings} Customize sidebar
              </button>
            </div>
          )}
        </div>

        <button className="sidebar-section-toggle" type="button" onClick={() => setTryOpen((value) => !value)}>
          <span>Try</span>
          {tryOpen ? Icons.chevronDown : Icons.chevronRight}
        </button>
        {tryOpen && (
          <>
            {visibleItems.invite && (
              <button className="sidebar-link" type="button" onClick={() => setInviteOpen(true)}>
                {Icons.invite} Invite people
              </button>
            )}
            {visibleItems.github && (
              <button className="sidebar-link" type="button" onClick={connectGithub}>
                {Icons.github} Connect GitHub
              </button>
            )}
            {githubStatus && <div className="sidebar-note">{githubStatus}</div>}
          </>
        )}
      </nav>

      {customizeOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => setCustomizeOpen(false)}>
          <div className="modal customize-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="modal-title">Customize sidebar</h2>
              <button className="btn btn-ghost btn-sm" type="button" aria-label="Close" onClick={() => setCustomizeOpen(false)}>
                {Icons.close}
              </button>
            </div>
            {sidebarGroups.map((group) => (
              <div className="customize-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="customize-list">
                  {group.items.map(([key, label]) => (
                    <ToggleRow
                      key={key}
                      label={label}
                      checked={visibleItems[key]}
                      onChange={() => toggleItem(key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={savePhoto} />
      <InvitePeopleModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </aside>
  );
};

export default Sidebar;
