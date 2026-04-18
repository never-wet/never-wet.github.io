import { NavLink } from "react-router-dom";
import { gameManifest } from "../../memory/gameManifest";
import { externalNavItems, navItems } from "../../memory/uiManifest";

export function TopNav() {
  return (
    <header className="top-nav">
      <NavLink className="brand-lockup" to="/">
        <span className="brand-mark">BG</span>
        <div>
          <strong>{gameManifest.appName}</strong>
          <p>{gameManifest.tagline}</p>
        </div>
      </NavLink>
      <nav className="nav-links" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
        {externalNavItems.map((item) => (
          <a className="nav-link-button" href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
