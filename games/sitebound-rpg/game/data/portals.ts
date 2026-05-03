export type PortalId =
  | "workshop"
  | "ai_lab"
  | "trading_house"
  | "physics_lab"
  | "music_studio"
  | "particle_gallery"
  | "observatory"
  | "contact_house"
  | "archive_gate";

export interface PortalDefinition {
  id: PortalId;
  name: string;
  zone: "starter" | "tech" | "creative" | "observatory" | "locked";
  x: number;
  y: number;
  width: number;
  height: number;
  door: {
    x: number;
    y: number;
  };
  tag: string;
  description: string;
  lockedBy?: string;
  interior: {
    title: string;
    detail: string;
    accent: string;
    x: number;
    y: number;
    width: number;
    height: number;
    spawn: {
      x: number;
      y: number;
    };
    exit: {
      x: number;
      y: number;
    };
  };
}

export const portals: PortalDefinition[] = [
  {
    id: "workshop",
    name: "Workshop",
    zone: "starter",
    x: 24,
    y: 20,
    width: 7,
    height: 6,
    door: { x: 27, y: 26 },
    tag: "Projects",
    description: "The village workshop is a playable room full of tools and blueprint tasks.",
    interior: {
      title: "Workshop Interior",
      detail: "Workbench shelves, tool racks, and blueprint tables make this a real room instead of a link card.",
      accent: "#ffd06a",
      x: 104,
      y: 8,
      width: 17,
      height: 13,
      spawn: { x: 112, y: 18 },
      exit: { x: 112, y: 20 }
    }
  },
  {
    id: "contact_house",
    name: "Contact House",
    zone: "starter",
    x: 12,
    y: 30,
    width: 6,
    height: 5,
    door: { x: 15, y: 35 },
    tag: "Contact",
    description: "A quiet in-game house with letters, notice boards, and soft lamps.",
    interior: {
      title: "Contact House",
      detail: "Pinned letters and warm floor lamps turn this into a cozy house interior.",
      accent: "#f6b26b",
      x: 126,
      y: 8,
      width: 15,
      height: 12,
      spawn: { x: 133, y: 17 },
      exit: { x: 133, y: 19 }
    }
  },
  {
    id: "ai_lab",
    name: "AI Lab",
    zone: "tech",
    x: 58,
    y: 15,
    width: 8,
    height: 7,
    door: { x: 62, y: 22 },
    tag: "AI Projects",
    description: "Engineers tune language tools in a glowing glass-dome lab.",
    interior: {
      title: "AI Lab Interior",
      detail: "Terminals, antenna coils, and blue light strips give the lab an active sci-fantasy mood.",
      accent: "#8bd3ff",
      x: 146,
      y: 8,
      width: 18,
      height: 14,
      spawn: { x: 155, y: 19 },
      exit: { x: 155, y: 21 }
    }
  },
  {
    id: "trading_house",
    name: "Trading House",
    zone: "tech",
    x: 73,
    y: 17,
    width: 8,
    height: 6,
    door: { x: 77, y: 23 },
    tag: "Market Sim",
    description: "A market hall with boards, counters, and a timing game.",
    interior: {
      title: "Trading House",
      detail: "Price bells ring over the counter. Complete the market timing game to earn coins.",
      accent: "#70e6a2",
      x: 170,
      y: 8,
      width: 17,
      height: 13,
      spawn: { x: 178, y: 18 },
      exit: { x: 178, y: 20 }
    }
  },
  {
    id: "physics_lab",
    name: "Physics Lab",
    zone: "tech",
    x: 65,
    y: 27,
    width: 7,
    height: 6,
    door: { x: 68, y: 33 },
    tag: "Physics",
    description: "A testing room for movement, forces, and puzzle machinery.",
    interior: {
      title: "Physics Lab",
      detail: "Tiny pendulums, collision pads, and test rigs are arranged neatly on the lab floor.",
      accent: "#9ee8ff",
      x: 104,
      y: 29,
      width: 17,
      height: 13,
      spawn: { x: 112, y: 39 },
      exit: { x: 112, y: 41 }
    }
  },
  {
    id: "music_studio",
    name: "Music Studio",
    zone: "creative",
    x: 44,
    y: 48,
    width: 8,
    height: 6,
    door: { x: 48, y: 54 },
    tag: "Music",
    description: "A neon studio with speaker props and rhythm challenges.",
    interior: {
      title: "Music Studio",
      detail: "Warm meters bounce over a compact stage. The rhythm mini-game lives here.",
      accent: "#ff8faf",
      x: 126,
      y: 29,
      width: 17,
      height: 13,
      spawn: { x: 134, y: 39 },
      exit: { x: 134, y: 41 }
    }
  },
  {
    id: "particle_gallery",
    name: "Particle Gallery",
    zone: "creative",
    x: 60,
    y: 49,
    width: 8,
    height: 6,
    door: { x: 64, y: 55 },
    tag: "Visual Lab",
    description: "A gallery room with particle mosaics and studio props.",
    interior: {
      title: "Particle Gallery",
      detail: "Pixel mosaics animate like controlled sparks above the gallery floor.",
      accent: "#c5a7ff",
      x: 148,
      y: 29,
      width: 17,
      height: 13,
      spawn: { x: 156, y: 39 },
      exit: { x: 156, y: 41 }
    }
  },
  {
    id: "observatory",
    name: "Observatory",
    zone: "observatory",
    x: 75,
    y: 5,
    width: 9,
    height: 7,
    door: { x: 79, y: 12 },
    tag: "Galaxy Sim",
    description: "A telescope dome with star maps and orbit puzzles.",
    lockedBy: "observatory_pass",
    interior: {
      title: "Signal Observatory",
      detail: "The dome opens to star charts, orbit diagrams, and a telescope puzzle inside the room.",
      accent: "#ff8f70",
      x: 170,
      y: 29,
      width: 18,
      height: 14,
      spawn: { x: 179, y: 40 },
      exit: { x: 179, y: 42 }
    }
  },
  {
    id: "archive_gate",
    name: "Archive Gate",
    zone: "locked",
    x: 15,
    y: 58,
    width: 7,
    height: 5,
    door: { x: 18, y: 63 },
    tag: "Memory",
    description: "A locked archive room that opens after hidden shards are recovered.",
    lockedBy: "archive_key",
    interior: {
      title: "Archive Gate",
      detail: "Rune shelves store rules, memories, project notes, and the logic that keeps the town coherent.",
      accent: "#b6f7ff",
      x: 104,
      y: 50,
      width: 18,
      height: 14,
      spawn: { x: 113, y: 61 },
      exit: { x: 113, y: 63 }
    }
  }
];

export function getPortal(id: PortalId) {
  return portals.find((portal) => portal.id === id) ?? null;
}
