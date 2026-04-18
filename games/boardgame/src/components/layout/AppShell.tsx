import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <TopNav />
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
