const priorityClass = {
  Low: "priority-low",
  Medium: "priority-medium",
  High: "priority-high",
  Urgent: "priority-urgent",
};

const PriorityBadge = ({ priority = "Medium", noIcon = false }) => (
  <span className={`priority-badge ${priorityClass[priority] || priorityClass.Medium}`}>
    {!noIcon && <span />}
    {priority}
  </span>
);

export default PriorityBadge;
