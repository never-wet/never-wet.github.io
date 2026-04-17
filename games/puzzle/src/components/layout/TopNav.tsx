import { NavLink } from "react-router-dom";
import { useGame } from "../../hooks/useGame";

const navItems = [
  { to: "/", label: "System" },
  { to: "/puzzles", label: "Modes" },
  { to: "/escape", label: "Escape" },
  { to: "/dashboard", label: "Logs" },
  { to: "/settings", label: "Ctrl" },
  { to: "/about", label: "Help" },
];

export function TopNav() {
  const { state, getResumeRoute } = useGame();
  const hasProgress = state.stats.totalStarted > 0 || Object.keys(state.escapeProgress).length > 0;

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <NavLink to="/" className="brand">
          <span className="brand__core">KINETIC_CORE_V1</span>
          <small className="brand__sub">PUZZLE_ESCAPE_LAB // LOCAL_PROTOCOL</small>
        </NavLink>

        <nav className="topnav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "topnav__link topnav__link--active" : "topnav__link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          {hasProgress && (
            <NavLink to={getResumeRoute()} className="button button--ghost">
              Resume
            </NavLink>
          )}
          <NavLink to="/escape" className="button button--primary">
            Initiate
          </NavLink>
        </div>
      </div>
    </header>
  );
}
