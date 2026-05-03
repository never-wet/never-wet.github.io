import { portals, type PortalDefinition } from "./portals";

export const TILE_SIZE = 32;
export const EXTERIOR_WIDTH = 96;
export const WORLD_WIDTH = 192;
export const WORLD_HEIGHT = 72;

export enum TileId {
  Grass = 1,
  Meadow = 2,
  Path = 3,
  Plaza = 4,
  RoadStone = 5,
  Water = 6,
  Bridge = 7,
  Forest = 8,
  Sand = 9,
  Ridge = 10,
  Cliff = 11,
  Fence = 12,
  Floor = 13
}

export interface WorldObjectDefinition {
  id: string;
  name: string;
  type:
    | "tree"
    | "rock"
    | "fence"
    | "shard"
    | "sign"
    | "practice_yard"
    | "lamp"
    | "interior_exit"
    | "workbench"
    | "console"
    | "counter"
    | "speaker"
    | "telescope"
    | "bookshelf"
    | "mosaic";
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
  prompt: string;
  portalId?: string;
  questItem?: string;
  questObjective?: {
    questId: string;
    objectiveId: string;
  };
}

export interface ZoneDefinition {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface WorldMapDefinition {
  width: number;
  height: number;
  tileSize: number;
  ground: number[][];
  collisionTiles: number[];
  spawn: { x: number; y: number };
  portals: PortalDefinition[];
  objects: WorldObjectDefinition[];
  zones: ZoneDefinition[];
}

export const collisionTiles = [TileId.Water, TileId.Cliff, TileId.Fence];

const ground = createStructuredGround();

export const worldMap: WorldMapDefinition = {
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  tileSize: TILE_SIZE,
  ground,
  collisionTiles,
  spawn: { x: 21, y: 36 },
  portals,
  objects: createWorldObjects(),
  zones: [
    { id: "starter", name: "Starter Village", bounds: { x: 8, y: 18, width: 32, height: 28 } },
    { id: "tech", name: "Tech District", bounds: { x: 52, y: 12, width: 36, height: 26 } },
    { id: "creative", name: "Creative District", bounds: { x: 40, y: 44, width: 36, height: 22 } },
    { id: "observatory", name: "Observatory Ridge", bounds: { x: 68, y: 2, width: 24, height: 14 } },
    { id: "locked", name: "Archive Grove", bounds: { x: 6, y: 50, width: 24, height: 18 } }
  ]
};

export function isWalkableTile(tile: number) {
  return !collisionTiles.includes(tile);
}

export function isInsideWorld(x: number, y: number) {
  return x >= 0 && y >= 0 && x < WORLD_WIDTH && y < WORLD_HEIGHT;
}

function createStructuredGround() {
  const tiles: TileId[][] = Array.from({ length: WORLD_HEIGHT }, () => Array.from({ length: WORLD_WIDTH }, () => TileId.Grass));

  const set = (x: number, y: number, tile: TileId) => {
    if (isInsideWorld(x, y)) {
      tiles[y][x] = tile;
    }
  };

  const fill = (x: number, y: number, width: number, height: number, tile: TileId) => {
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        set(x + column, y + row, tile);
      }
    }
  };

  const path = (points: Array<{ x: number; y: number }>, radius = 1, tile = TileId.Path) => {
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));

      for (let step = 0; step <= steps; step += 1) {
        const amount = steps === 0 ? 0 : step / steps;
        const x = Math.round(start.x + (end.x - start.x) * amount);
        const y = Math.round(start.y + (end.y - start.y) * amount);

        for (let oy = -radius; oy <= radius; oy += 1) {
          for (let ox = -radius; ox <= radius; ox += 1) {
            set(x + ox, y + oy, tile);
          }
        }
      }
    }
  };

  const meadowPatch = (centerX: number, centerY: number, radiusX: number, radiusY: number) => {
    for (let y = Math.floor(centerY - radiusY); y <= Math.ceil(centerY + radiusY); y += 1) {
      for (let x = Math.floor(centerX - radiusX); x <= Math.ceil(centerX + radiusX); x += 1) {
        const nx = (x - centerX) / radiusX;
        const ny = (y - centerY) / radiusY;
        const ripple = Math.sin(x * 0.6 + y * 0.35) * 0.12;

        if (nx * nx + ny * ny + ripple < 1) {
          set(x, y, TileId.Meadow);
        }
      }
    }
  };

  meadowPatch(18, 24, 13, 8);
  meadowPatch(34, 44, 10, 7);
  meadowPatch(82, 42, 15, 10);
  meadowPatch(34, 61, 11, 8);
  meadowPatch(54, 9, 12, 7);

  // River and bridges are placed first so every road crossing is intentional.
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    const center = Math.round(6 + Math.sin(y * 0.13) * 2);
    for (let x = center; x <= center + 4; x += 1) {
      set(x, y, TileId.Water);
    }
  }

  // The right half of the Phaser world stores playable building interiors.
  // Keep the space between rooms solid so interiors cannot leak into blank map.
  fill(EXTERIOR_WIDTH, 0, WORLD_WIDTH - EXTERIOR_WIDTH, WORLD_HEIGHT, TileId.Cliff);

  for (let y = 31; y <= 34; y += 1) {
    for (let x = 7; x <= 12; x += 1) {
      set(x, y, TileId.Bridge);
    }
  }

  for (let y = 60; y <= 63; y += 1) {
    for (let x = 7; x <= 12; x += 1) {
      set(x, y, TileId.Bridge);
    }
  }

  fill(16, 30, 14, 10, TileId.Plaza);
  fill(53, 14, 34, 24, TileId.RoadStone);
  fill(42, 46, 34, 18, TileId.Floor);
  fill(68, 3, 23, 12, TileId.Ridge);
  fill(7, 52, 22, 15, TileId.Forest);
  fill(2, 65, 14, 7, TileId.Sand);

  for (const portal of portals) {
    const foundation = foundationTileForZone(portal.zone);

    fill(portal.x - 1, portal.y - 1, portal.width + 2, portal.height + 2, foundation);
    fill(portal.door.x - 1, portal.door.y, 3, 2, foundation);
  }

  path([
    { x: 8, y: 33 },
    { x: 21, y: 35 },
    { x: 35, y: 35 },
    { x: 55, y: 28 },
    { x: 84, y: 28 }
  ], 1);
  path([
    { x: 24, y: 35 },
    { x: 34, y: 43 },
    { x: 48, y: 55 },
    { x: 70, y: 56 }
  ], 1);
  path([
    { x: 65, y: 28 },
    { x: 67, y: 22 },
    { x: 72, y: 14 },
    { x: 79, y: 12 }
  ], 1);
  path([
    { x: 19, y: 39 },
    { x: 16, y: 49 },
    { x: 18, y: 63 }
  ], 1);
  path([
    { x: 31, y: 35 },
    { x: 39, y: 36 }
  ], 1);

  path([
    { x: 27, y: 26 },
    { x: 27, y: 30 },
    { x: 24, y: 35 }
  ], 1);
  path([
    { x: 15, y: 35 },
    { x: 21, y: 35 }
  ], 1);
  path([
    { x: 62, y: 22 },
    { x: 62, y: 28 }
  ], 1, TileId.RoadStone);
  path([
    { x: 77, y: 23 },
    { x: 77, y: 28 }
  ], 1, TileId.RoadStone);
  path([
    { x: 68, y: 33 },
    { x: 65, y: 28 }
  ], 1, TileId.RoadStone);
  path([
    { x: 48, y: 54 },
    { x: 48, y: 56 },
    { x: 54, y: 56 }
  ], 1, TileId.Floor);
  path([
    { x: 64, y: 55 },
    { x: 64, y: 56 }
  ], 1, TileId.Floor);
  path([
    { x: 79, y: 12 },
    { x: 72, y: 14 }
  ], 1, TileId.Ridge);
  path([
    { x: 18, y: 63 },
    { x: 18, y: 58 }
  ], 1);

  // Logical cliffs fence the high ridge and archive edges without blocking road doors.
  for (let x = 66; x <= 91; x += 1) {
    set(x, 2, TileId.Cliff);
    set(x, 15, TileId.Cliff);
  }

  for (let y = 3; y <= 15; y += 1) {
    set(66, y, TileId.Cliff);
    set(91, y, TileId.Cliff);
  }

  for (let x = 6; x <= 29; x += 1) {
    set(x, 51, TileId.Fence);
    set(x, 68, TileId.Fence);
  }

  for (let y = 52; y <= 68; y += 1) {
    set(5, y, TileId.Fence);
    set(30, y, TileId.Fence);
  }

  // Open gates on paths.
  set(17, 51, TileId.Path);
  set(18, 51, TileId.Path);
  set(18, 68, TileId.Path);
  set(19, 68, TileId.Path);
  set(72, 15, TileId.Path);
  set(73, 15, TileId.Path);

  for (const portal of portals) {
    const room = portal.interior;
    fill(room.x, room.y, room.width, room.height, TileId.Floor);

    for (let x = room.x; x < room.x + room.width; x += 1) {
      set(x, room.y, TileId.Fence);
      set(x, room.y + room.height - 1, TileId.Fence);
    }

    for (let y = room.y; y < room.y + room.height; y += 1) {
      set(room.x, y, TileId.Fence);
      set(room.x + room.width - 1, y, TileId.Fence);
    }

    set(room.exit.x, room.exit.y, TileId.Floor);
  }

  return tiles;
}

function foundationTileForZone(zone: PortalDefinition["zone"]) {
  switch (zone) {
    case "tech":
      return TileId.RoadStone;
    case "creative":
      return TileId.Floor;
    case "observatory":
      return TileId.Ridge;
    case "locked":
      return TileId.Forest;
    case "starter":
      return TileId.Plaza;
  }
}

function createWorldObjects(): WorldObjectDefinition[] {
  const trees: Array<[number, number]> = [
    [10, 19],
    [14, 22],
    [34, 22],
    [36, 26],
    [33, 42],
    [24, 44],
    [12, 43],
    [13, 53],
    [21, 54],
    [26, 59],
    [10, 64],
    [25, 66],
    [87, 40],
    [91, 45],
    [83, 51],
    [34, 58],
    [37, 62]
  ];

  const rocks: Array<[number, number]> = [
    [70, 8],
    [88, 10],
    [68, 18],
    [86, 36],
    [41, 43],
    [78, 62]
  ];

  return [
    ...trees.filter(([x, y]) => isNaturalObjectArea(x, y, 2, 3)).map(([x, y], index) => ({
      id: `tree_${index}`,
      name: "Old Tree",
      type: "tree" as const,
      x,
      y,
      width: 2,
      height: 3,
      solid: true,
      prompt: "Inspect"
    })),
    ...rocks.filter(([x, y]) => isRockObjectArea(x, y, 1, 1)).map(([x, y], index) => ({
      id: `rock_${index}`,
      name: "Mossy Rock",
      type: "rock" as const,
      x,
      y,
      width: 1,
      height: 1,
      solid: true,
      prompt: "Inspect"
    })),
    {
      id: "practice_yard",
      name: "Practice Yard",
      type: "practice_yard",
      x: 37,
      y: 34,
      width: 5,
      height: 5,
      solid: false,
      prompt: "Train",
      questObjective: { questId: "observatory_pass", objectiveId: "training_duel" }
    },
    {
      id: "starter_sign",
      name: "Town Sign",
      type: "sign",
      x: 29,
      y: 35,
      width: 1,
      height: 1,
      solid: false,
      prompt: "Read"
    },
    {
      id: "shard_1",
      name: "Signal Shard",
      type: "shard",
      x: 38,
      y: 43,
      width: 1,
      height: 1,
      solid: false,
      prompt: "Pick up",
      questItem: "signal_shard",
      questObjective: { questId: "archive_shards", objectiveId: "collect_shards" }
    },
    {
      id: "shard_2",
      name: "Signal Shard",
      type: "shard",
      x: 86,
      y: 37,
      width: 1,
      height: 1,
      solid: false,
      prompt: "Pick up",
      questItem: "signal_shard",
      questObjective: { questId: "archive_shards", objectiveId: "collect_shards" }
    },
    {
      id: "shard_3",
      name: "Signal Shard",
      type: "shard",
      x: 29,
      y: 65,
      width: 1,
      height: 1,
      solid: false,
      prompt: "Pick up",
      questItem: "signal_shard",
      questObjective: { questId: "archive_shards", objectiveId: "collect_shards" }
    },
    ...[
      [31, 30],
      [55, 31],
      [73, 24],
      [52, 54],
      [68, 56],
      [72, 13]
    ].map(([x, y], index) => ({
      id: `lamp_${index}`,
      name: "Path Lamp",
      type: "lamp" as const,
      x,
      y,
      width: 1,
      height: 2,
      solid: false,
      prompt: "Inspect"
    })),
    ...createInteriorObjects()
  ];
}

function createInteriorObjects(): WorldObjectDefinition[] {
  const result: WorldObjectDefinition[] = [];

  for (const portal of portals) {
    const room = portal.interior;

    result.push({
      id: `${portal.id}_exit`,
      name: "Exit Door",
      type: "interior_exit",
      x: room.exit.x,
      y: room.exit.y,
      width: 1,
      height: 1,
      solid: false,
      prompt: "Exit",
      portalId: portal.id
    });

    const commonShelf = {
      id: `${portal.id}_shelf`,
      name: "Room Shelf",
      type: "bookshelf" as const,
      x: room.x + 2,
      y: room.y + 2,
      width: 3,
      height: 1,
      solid: true,
      prompt: "Inspect",
      portalId: portal.id
    };

    if (portal.id === "workshop") {
      result.push(
        commonShelf,
        {
          id: "workshop_table",
          name: "Blueprint Bench",
          type: "workbench",
          x: room.x + 7,
          y: room.y + 4,
          width: 4,
          height: 2,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        },
        {
          id: "workshop_toolwall",
          name: "Tool Wall",
          type: "workbench",
          x: room.x + 12,
          y: room.y + 2,
          width: 3,
          height: 1,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        }
      );
    } else if (portal.id === "ai_lab") {
      result.push(
        commonShelf,
        {
          id: "ai_terminal",
          name: "Blue Terminal",
          type: "console",
          x: room.x + 6,
          y: room.y + 3,
          width: 3,
          height: 2,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        },
        {
          id: "ai_antenna",
          name: "Antenna Coil",
          type: "console",
          x: room.x + 12,
          y: room.y + 5,
          width: 2,
          height: 2,
          solid: true,
          prompt: "Tune",
          portalId: portal.id
        }
      );
    } else if (portal.id === "trading_house") {
      result.push(
        {
          id: "market_counter",
          name: "Trading Counter",
          type: "counter",
          x: room.x + 4,
          y: room.y + 4,
          width: 8,
          height: 2,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        },
        {
          id: "market_board",
          name: "Price Board",
          type: "counter",
          x: room.x + 12,
          y: room.y + 2,
          width: 3,
          height: 1,
          solid: true,
          prompt: "Trade",
          portalId: portal.id
        }
      );
    } else if (portal.id === "music_studio") {
      result.push(
        {
          id: "studio_speakers",
          name: "Speaker Stack",
          type: "speaker",
          x: room.x + 3,
          y: room.y + 3,
          width: 3,
          height: 2,
          solid: true,
          prompt: "Listen",
          portalId: portal.id
        },
        {
          id: "studio_stage",
          name: "Tiny Stage",
          type: "speaker",
          x: room.x + 9,
          y: room.y + 4,
          width: 5,
          height: 2,
          solid: true,
          prompt: "Play",
          portalId: portal.id
        }
      );
    } else if (portal.id === "observatory") {
      result.push(
        {
          id: "observatory_telescope",
          name: "Telescope",
          type: "telescope",
          x: room.x + 7,
          y: room.y + 3,
          width: 4,
          height: 4,
          solid: true,
          prompt: "Look",
          portalId: portal.id
        },
        commonShelf
      );
    } else if (portal.id === "particle_gallery") {
      result.push(
        {
          id: "gallery_mosaic",
          name: "Particle Mosaic",
          type: "mosaic",
          x: room.x + 5,
          y: room.y + 3,
          width: 6,
          height: 3,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        },
        commonShelf
      );
    } else {
      result.push(
        commonShelf,
        {
          id: `${portal.id}_table`,
          name: "Room Table",
          type: "counter",
          x: room.x + 7,
          y: room.y + 4,
          width: 4,
          height: 2,
          solid: true,
          prompt: "Inspect",
          portalId: portal.id
        }
      );
    }
  }

  return result;
}

function isNaturalObjectArea(x: number, y: number, width: number, height: number) {
  return isObjectAreaValid(x, y, width, height, new Set([TileId.Grass, TileId.Meadow, TileId.Forest]));
}

function isRockObjectArea(x: number, y: number, width: number, height: number) {
  return isObjectAreaValid(x, y, width, height, new Set([TileId.Grass, TileId.Meadow, TileId.Forest, TileId.Ridge, TileId.Sand]));
}

function isObjectAreaValid(x: number, y: number, width: number, height: number, allowedTiles: Set<TileId>) {
  if (overlapsAnyPortal(x, y, width, height)) {
    return false;
  }

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const tileX = x + column;
      const tileY = y + row;

      if (!isInsideWorld(tileX, tileY) || !allowedTiles.has(ground[tileY][tileX])) {
        return false;
      }
    }
  }

  return true;
}

function overlapsAnyPortal(x: number, y: number, width: number, height: number) {
  return portals.some((portal) =>
    rectanglesOverlap(
      { x, y, width, height },
      { x: portal.x - 1, y: portal.y - 1, width: portal.width + 2, height: portal.height + 2 }
    )
  );
}

function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
