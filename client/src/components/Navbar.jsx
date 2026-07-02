import { iconForTitle } from "./AppIcons";

const Navbar = ({ title }) => {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <div className="topnav-tab">
          {iconForTitle(title)}
          <span className="topnav-title">{title || "Issue Tracker"}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
