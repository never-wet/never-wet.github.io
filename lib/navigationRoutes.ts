export type NavigationRoute = {
  id: string;
  label: string;
  href: string;
  section: string;
};

export const NAVIGATION_ROUTES: NavigationRoute[] = [
  {
    id: "portfolio",
    label: "Portfolio Building",
    href: "./project-hub.html",
    section: "Projects Page"
  },
  {
    id: "ai-lab",
    label: "AI Lab",
    href: "./ai-lab/",
    section: "AI Projects"
  },
  {
    id: "stock-terminal",
    label: "Stock Terminal",
    href: "./games/stock-trading-sim/",
    section: "Trading App"
  },
  {
    id: "music-studio",
    label: "Music Studio",
    href: "./loop-daw/",
    section: "Music App"
  },
  {
    id: "galaxy-lab",
    label: "Galaxy Lab",
    href: "./games/galaxy-simulator/",
    section: "Space Simulator"
  },
  {
    id: "contact-office",
    label: "Contact Office",
    href: "./#contact",
    section: "Contact Page"
  }
];

export function getRouteById(id?: string | null) {
  return NAVIGATION_ROUTES.find((route) => route.id === id) ?? null;
}
