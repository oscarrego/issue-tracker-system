/* Labels that should be fully uppercased */
const UPPERCASE_LABELS = new Set(["ui", "api", "ux"]);

const formatLabel = (label) => {
  const lower = label.toLowerCase();
  if (UPPERCASE_LABELS.has(lower)) return lower.toUpperCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const LabelChips = ({ labels = [] }) => {
  if (!labels.length) return <span className="issue-sidebar-value-muted">No labels</span>;

  return (
    <span className="label-chip-row">
      {labels.map((label) => (
        <span className="label-chip" key={label}>{formatLabel(label)}</span>
      ))}
    </span>
  );
};

export default LabelChips;
