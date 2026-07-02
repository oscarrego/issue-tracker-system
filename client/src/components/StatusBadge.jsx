const IcOpen = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.75" stroke="#5e6ad2" strokeWidth="1.4" />
    <circle cx="7" cy="7" r="2" fill="#5e6ad2" />
  </svg>
);

const IcInProgress = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.75" stroke="#e07b39" strokeWidth="1.4" />
    <path d="M7 1.25 A5.75 5.75 0 0 1 7 12.75 Z" fill="#e07b39" />
  </svg>
);

const IcDone = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.25" fill="#26b68f" />
    <polyline
      points="4.2,7 6,9 9.8,4.8"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const statusConfig = {
  Open:          { icon: <IcOpen />,       cls: "badge-open" },
  "In Progress": { icon: <IcInProgress />, cls: "badge-inprogress" },
  Closed:        { icon: <IcDone />,       cls: "badge-closed" },
};

const StatusBadge = ({ status, noIcon = false }) => {
  const cfg = statusConfig[status] || statusConfig.Open;
  return (
    <span className={`badge ${cfg.cls}`}>
      {!noIcon && cfg.icon}
      {status}
    </span>
  );
};

export default StatusBadge;
