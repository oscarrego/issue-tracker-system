/* eslint-disable react-refresh/only-export-components */

const getInitials = (name = "") =>
  name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "?";

const Avatar = ({ user, src, size = 26, className = "" }) => {
  const imageSrc = src || user?.avatar || user?.avatarUrl;

  if (imageSrc) {
    return (
      <img
        className={`avatar-img ${className}`.trim()}
        src={imageSrc}
        alt=""
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  return (
    <div className={`user-avatar ${className}`.trim()} style={{ width: size, height: size }}>
      {getInitials(user?.name)}
    </div>
  );
};

export { getInitials };
export default Avatar;
