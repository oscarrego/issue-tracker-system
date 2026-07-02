const LabelChips = ({ labels = [] }) => {
  if (!labels.length) return <span className="issue-sidebar-value-muted">No labels</span>;

  return (
    <span className="label-chip-row">
      {labels.map((label) => (
        <span className="label-chip" key={label}>{label}</span>
      ))}
    </span>
  );
};

export default LabelChips;
