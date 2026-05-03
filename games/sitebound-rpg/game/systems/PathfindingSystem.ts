import { isInsideWorld, isWalkableTile, worldMap, type WorldObjectDefinition } from "../data/worldMap";
import type { PortalDefinition } from "../data/portals";
import type { TilePoint } from "../../store/useWorldStore";

interface NodeRecord {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: NodeRecord | null;
}

export class PathfindingSystem {
  private readonly blocked = new Set<string>();

  constructor(portals: PortalDefinition[], objects: WorldObjectDefinition[]) {
    for (const portal of portals) {
      for (let y = portal.y; y < portal.y + portal.height; y += 1) {
        for (let x = portal.x; x < portal.x + portal.width; x += 1) {
          this.blocked.add(key(x, y));
        }
      }
    }

    for (const object of objects) {
      if (!object.solid) {
        continue;
      }

      for (let y = object.y; y < object.y + object.height; y += 1) {
        for (let x = object.x; x < object.x + object.width; x += 1) {
          this.blocked.add(key(x, y));
        }
      }
    }

    // Door tiles and road gates must remain reachable.
    for (const portal of portals) {
      this.blocked.delete(key(portal.door.x, portal.door.y));
    }
  }

  findPath(start: TilePoint, goal: TilePoint) {
    const normalizedStart = clampPoint(start);
    const normalizedGoal = this.findNearestWalkable(clampPoint(goal));
    const open: NodeRecord[] = [
      {
        x: normalizedStart.x,
        y: normalizedStart.y,
        g: 0,
        h: heuristic(normalizedStart, normalizedGoal),
        f: heuristic(normalizedStart, normalizedGoal),
        parent: null
      }
    ];
    const seen = new Map<string, NodeRecord>();
    const closed = new Set<string>();

    seen.set(key(normalizedStart.x, normalizedStart.y), open[0]);

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift()!;
      const currentKey = key(current.x, current.y);

      if (current.x === normalizedGoal.x && current.y === normalizedGoal.y) {
        return reconstructPath(current);
      }

      closed.add(currentKey);

      for (const neighbor of neighbors(current)) {
        if (!this.isWalkable(neighbor.x, neighbor.y) || closed.has(key(neighbor.x, neighbor.y))) {
          continue;
        }

        const stepCost = current.x !== neighbor.x && current.y !== neighbor.y ? 1.4 : 1;
        const tentativeG = current.g + stepCost;
        const neighborKey = key(neighbor.x, neighbor.y);
        const existing = seen.get(neighborKey);

        if (existing && tentativeG >= existing.g) {
          continue;
        }

        const h = heuristic(neighbor, normalizedGoal);
        const record: NodeRecord = {
          x: neighbor.x,
          y: neighbor.y,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current
        };

        seen.set(neighborKey, record);

        if (!existing) {
          open.push(record);
        } else {
          const index = open.indexOf(existing);
          if (index >= 0) {
            open[index] = record;
          } else {
            open.push(record);
          }
        }
      }
    }

    return [];
  }

  isWalkable(x: number, y: number) {
    if (!isInsideWorld(x, y)) {
      return false;
    }

    return isWalkableTile(worldMap.ground[y][x]) && !this.blocked.has(key(x, y));
  }

  private findNearestWalkable(point: TilePoint) {
    if (this.isWalkable(point.x, point.y)) {
      return point;
    }

    for (let radius = 1; radius < 8; radius += 1) {
      for (let y = point.y - radius; y <= point.y + radius; y += 1) {
        for (let x = point.x - radius; x <= point.x + radius; x += 1) {
          if (this.isWalkable(x, y)) {
            return { x, y };
          }
        }
      }
    }

    return point;
  }
}

function key(x: number, y: number) {
  return `${x}:${y}`;
}

function clampPoint(point: TilePoint) {
  return {
    x: Math.max(0, Math.min(worldMap.width - 1, Math.round(point.x))),
    y: Math.max(0, Math.min(worldMap.height - 1, Math.round(point.y)))
  };
}

function heuristic(a: TilePoint, b: TilePoint) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function neighbors(node: TilePoint) {
  return [
    { x: node.x + 1, y: node.y },
    { x: node.x - 1, y: node.y },
    { x: node.x, y: node.y + 1 },
    { x: node.x, y: node.y - 1 }
  ];
}

function reconstructPath(node: NodeRecord) {
  const path: TilePoint[] = [];
  let current: NodeRecord | null = node;

  while (current) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path.reverse();
}
