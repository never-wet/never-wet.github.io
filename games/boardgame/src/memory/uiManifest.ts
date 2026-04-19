import type { DashboardPanel, NavItem } from "./types";

export const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Games", to: "/games" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Settings", to: "/settings" },
];

export const externalNavItems = [
  {
    label: "Games Folder",
    href: "../",
  },
] as const;

export const dashboardPanels: DashboardPanel[] = [
  {
    title: "Performance Snapshot",
    description: "Cross-game totals, win rate, streak, and last-played status.",
  },
  {
    title: "By Game",
    description: "Per-game cards show progress, tendencies, and last-used difficulty.",
  },
  {
    title: "Recent Matches",
    description: "A rolling local history of your newest board sessions.",
  },
];

export const playViewNotes = {
  shared: {
    aiTurnLock:
      "Live boards should lock player input immediately when state control passes to the AI so users cannot place the computer's move during the think-delay window.",
  },
  chess: {
    layout: "Chess uses a denser dedicated play layout with a centered wide shell and a smaller board target for one-screen viewing.",
    controls: "Chess intentionally hides undo and uses a single primary New Game action.",
    readability:
      "Chess play surfaces must force explicit light-on-dark text colors even when the paper theme is active.",
  },
  navigation: {
    external:
      "Boardgame Vault should keep a direct exit link back to the parent /games/ folder in the top navigation.",
  },
};
