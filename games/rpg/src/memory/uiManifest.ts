import type { UiNavItem } from "./types";

export const uiManifest: {
  primaryNav: UiNavItem[];
  titleActions: UiNavItem[];
} = {
  primaryNav: [
    { routeId: "game", label: "Camp", path: "/game", iconAssetId: "icon-lantern", showWhenPlaying: true },
    { routeId: "character", label: "Character", path: "/character", iconAssetId: "icon-sigil", showWhenPlaying: true },
    { routeId: "inventory", label: "Inventory", path: "/inventory", iconAssetId: "icon-pack", showWhenPlaying: true },
    { routeId: "quests", label: "Quests", path: "/quests", iconAssetId: "icon-scroll", showWhenPlaying: true },
    { routeId: "map", label: "Map", path: "/map", iconAssetId: "icon-map", showWhenPlaying: true },
    { routeId: "journal", label: "Journal", path: "/journal", iconAssetId: "icon-book", showWhenPlaying: true },
    { routeId: "settings", label: "Settings", path: "/settings", iconAssetId: "icon-gear", showWhenPlaying: true },
  ],
  titleActions: [
    { routeId: "new-game", label: "New Game", path: "/new-game", iconAssetId: "icon-star" },
    { routeId: "load", label: "Continue / Load", path: "/load", iconAssetId: "icon-archive" },
    { routeId: "settings", label: "Settings", path: "/settings", iconAssetId: "icon-gear" },
    { routeId: "credits", label: "Credits", path: "/credits", iconAssetId: "icon-scroll" },
  ],
};
