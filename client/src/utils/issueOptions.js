export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const LABEL_OPTIONS = [
  "Bug",
  "Feature",
  "UI",
  "Backend",
  "Frontend",
  "Documentation",
  "Enhancement",
  "API",
  "Database",
];

export const STATUSES = ["Open", "In Progress", "Closed"];
export const PROJECT_STATUSES = ["Planning", "Active", "Completed"];

export const isOverdue = (date, status) => {
  if (!date || status === "Closed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

export const formatDate = (dateStr, options = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", options);
};
