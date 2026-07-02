import { LABEL_OPTIONS } from "../utils/issueOptions";

const UPPERCASE_LABELS = new Set(["ui", "api", "ux"]);
const formatLabel = (label) => {
  const lower = label.toLowerCase();
  if (UPPERCASE_LABELS.has(lower)) return lower.toUpperCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const LabelPicker = ({ selected, onChange }) => {
  const toggle = (label) => {
    if (selected.includes(label)) {
      onChange(selected.filter((l) => l !== label));
    } else {
      onChange([...selected, label]);
    }
  };

  return (
    <div className="label-picker">
      {LABEL_OPTIONS.map((label) => {
        const active = selected.includes(label);
        return (
          <button
            key={label}
            type="button"
            className={`label-chip-btn${active ? " active" : ""}`}
            onClick={() => toggle(label)}
          >
            {active && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1,6 4,9 11,2" />
              </svg>
            )}
            {formatLabel(label)}
          </button>
        );
      })}
    </div>
  );
};

export default LabelPicker;
