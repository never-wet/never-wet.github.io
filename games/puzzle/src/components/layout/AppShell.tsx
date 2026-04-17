import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../../hooks/useGame";
import { ToastViewport } from "../common/ToastViewport";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const gamesHubHref = "../index.html";

  return (
    <div
      className={[
        "app-shell",
        state.settings.highContrast ? "app-shell--contrast" : "",
        state.settings.reducedMotion ? "app-shell--reduced-motion" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TopNav />
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <div className="app-footer__brand">
          <strong>MONOLITH_OPERATIONS</strong>
          <p>puzzle_escape_lab // local-first // original-content // no backend</p>
        </div>
        <div className="app-footer__links">
          <a href={gamesHubHref}>GAMES_HUB</a>
          <Link to="/puzzles">MODE_DIRECTORY</Link>
          <Link to="/escape">ESCAPE_MATRIX</Link>
          <Link to="/dashboard">ACTIVITY_LOGS</Link>
          <Link to="/about">SUPPORT_COMMS</Link>
        </div>
      </footer>
      <ToastViewport />
    </div>
  );
}
