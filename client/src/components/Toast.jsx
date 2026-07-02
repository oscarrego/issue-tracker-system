const Toast = ({ message, type = "success", onClose }) => {
  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      <span>{message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;
