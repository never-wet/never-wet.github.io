import { NAVIGATION_ROUTES } from "./navigationRoutes";

export type BuildingKind =
  | "portfolio"
  | "ai"
  | "terminal"
  | "music"
  | "galaxy"
  | "contact";

export type BuildingDestination = {
  id: string;
  name: string;
  shortName: string;
  section: string;
  href: string;
  hint: string;
  icon: string;
  color: string;
  base: string;
  position: [number, number, number];
  size: [number, number, number];
  shape: BuildingKind;
};

export type CharacterCustomization = {
  outfitColor: string;
  hairColor: string;
  hairStyle: "short" | "wave" | "crest";
  accessory: "none" | "visor" | "halo";
  avatarType: "scout" | "architect" | "pilot";
};

export type TimePreset = {
  label: "Night" | "Morning" | "Afternoon" | "Sunset";
  value: number;
};

export const WORLD_LIMIT = 20;
export const INTERACTION_RADIUS = 3.15;
export const CHARACTER_STORAGE_KEY = "neverWetRpgCharacter";

export const CHARACTER_OPTIONS = {
  outfitColors: ["#f7f7ef", "#54e0d8", "#a78bfa", "#ff7a9c", "#9cff8c", "#ff9a5f"],
  hairColors: ["#f2ede0", "#20242b", "#b67743", "#a78bfa", "#54e0d8"],
  hairStyles: ["short", "wave", "crest"],
  accessories: ["none", "visor", "halo"],
  avatarTypes: ["scout", "architect", "pilot"]
} as const;

export const DEFAULT_CHARACTER: CharacterCustomization = {
  outfitColor: "#f7f7ef",
  hairColor: "#20242b",
  hairStyle: "short",
  accessory: "visor",
  avatarType: "scout"
};

export const TIME_PRESETS: TimePreset[] = [
  { label: "Night", value: 0.04 },
  { label: "Morning", value: 0.24 },
  { label: "Afternoon", value: 0.46 },
  { label: "Sunset", value: 0.72 }
];

const route = (id: string) => {
  const match = NAVIGATION_ROUTES.find((item) => item.id === id);
  if (!match) throw new Error(`Missing route for ${id}`);
  return match;
};

export const WORLD_BUILDINGS: BuildingDestination[] = [
  {
    ...route("portfolio"),
    name: "Portfolio Building",
    shortName: "Portfolio",
    hint: "A clean gallery tower for web experiments and project launches.",
    icon: "P",
    color: "#54e0d8",
    base: "#1b3434",
    position: [0, 0, -12],
    size: [3.7, 2.8, 3.1],
    shape: "portfolio"
  },
  {
    ...route("ai-lab"),
    name: "AI Lab",
    shortName: "AI Lab",
    hint: "A faceted research lab with glowing model cores and tool demos.",
    icon: "A",
    color: "#a78bfa",
    base: "#2b2440",
    position: [-12, 0, -6],
    size: [3.5, 3.3, 3.2],
    shape: "ai"
  },
  {
    ...route("stock-terminal"),
    name: "Stock Terminal",
    shortName: "Stocks",
    hint: "A data tower for Market Pulse Trader, portfolio decisions, and live trading practice.",
    icon: "S",
    color: "#9cff8c",
    base: "#1d3323",
    position: [12, 0, -6],
    size: [3.0, 4.6, 3.0],
    shape: "terminal"
  },
  {
    ...route("music-studio"),
    name: "Music Studio",
    shortName: "Music",
    hint: "A low studio block with speaker cores and loop production tools.",
    icon: "M",
    color: "#ff7a9c",
    base: "#402431",
    position: [-12, 0, 7],
    size: [4.0, 2.35, 3.4],
    shape: "music"
  },
  {
    ...route("galaxy-lab"),
    name: "Galaxy Lab",
    shortName: "Galaxy",
    hint: "An observatory-style portal for orbital physics, cosmic events, and galaxy scenarios.",
    icon: "G",
    color: "#ffd66b",
    base: "#3f351d",
    position: [11.5, 0, 7.5],
    size: [3.8, 3.25, 3.8],
    shape: "galaxy"
  },
  {
    ...route("contact-office"),
    name: "Contact Office",
    shortName: "Contact",
    hint: "A quiet office beacon that routes back to the contact point.",
    icon: "C",
    color: "#ff9a5f",
    base: "#422a1d",
    position: [0, 0, 13],
    size: [3.4, 3.1, 2.9],
    shape: "contact"
  }
];

export function getBuildingById(id?: string | null) {
  return WORLD_BUILDINGS.find((building) => building.id === id) ?? null;
}

export function getTimeLabel(value: number) {
  if (value < 0.18 || value > 0.88) return "Night";
  if (value < 0.36) return "Morning";
  if (value < 0.64) return "Afternoon";
  return "Sunset";
}

export function getNightLift(value: number) {
  const daylight = Math.min(1, Math.max(0, Math.sin(value * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5));
  return 1 - daylight;
}
