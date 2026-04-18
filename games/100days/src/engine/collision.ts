import type { Vec2 } from "../memory/types";

export const WORLD_RADIUS = 1320;

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const lerp = (from: number, to: number, alpha: number): number => from + (to - from) * alpha;

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });

export const copyVec = (value: Vec2): Vec2 => ({ x: value.x, y: value.y });

export const add = (left: Vec2, right: Vec2): Vec2 => ({ x: left.x + right.x, y: left.y + right.y });

export const subtract = (left: Vec2, right: Vec2): Vec2 => ({ x: left.x - right.x, y: left.y - right.y });

export const scale = (value: Vec2, amount: number): Vec2 => ({ x: value.x * amount, y: value.y * amount });

export const lengthSq = (value: Vec2): number => value.x * value.x + value.y * value.y;

export const length = (value: Vec2): number => Math.sqrt(lengthSq(value));

export const distanceSq = (left: Vec2, right: Vec2): number => lengthSq(subtract(left, right));

export const distance = (left: Vec2, right: Vec2): number => Math.sqrt(distanceSq(left, right));

export const normalize = (value: Vec2): Vec2 => {
  const size = length(value);
  if (size <= 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: value.x / size, y: value.y / size };
};

export const limit = (value: Vec2, max: number): Vec2 => {
  const size = length(value);
  if (size <= max) {
    return value;
  }
  return scale(normalize(value), max);
};

export const angleTo = (from: Vec2, to: Vec2): number => Math.atan2(to.y - from.y, to.x - from.x);

export const directionFromAngle = (angle: number): Vec2 => ({ x: Math.cos(angle), y: Math.sin(angle) });

export const circlesOverlap = (a: Vec2, aRadius: number, b: Vec2, bRadius: number): boolean =>
  distanceSq(a, b) <= (aRadius + bRadius) * (aRadius + bRadius);

export const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

export const randomInt = (min: number, max: number): number => Math.floor(randomRange(min, max + 1));

export const wrapAngle = (angle: number): number => {
  let value = angle;
  while (value <= -Math.PI) {
    value += Math.PI * 2;
  }
  while (value > Math.PI) {
    value -= Math.PI * 2;
  }
  return value;
};

export const pointToSegmentDistance = (point: Vec2, start: Vec2, end: Vec2): number => {
  const segment = subtract(end, start);
  const pointDelta = subtract(point, start);
  const segmentLengthSq = lengthSq(segment);
  if (segmentLengthSq === 0) {
    return distance(point, start);
  }
  const t = clamp((pointDelta.x * segment.x + pointDelta.y * segment.y) / segmentLengthSq, 0, 1);
  const projection = { x: start.x + segment.x * t, y: start.y + segment.y * t };
  return distance(point, projection);
};

export const weightedChoice = <T>(items: readonly T[], getWeight: (item: T) => number): T | null => {
  const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);
  if (total <= 0) {
    return null;
  }
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0, getWeight(item));
    if (roll <= 0) {
      return item;
    }
  }
  return items[items.length - 1] ?? null;
};

export const hash2D = (x: number, y: number): number => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export const clampToWorld = (position: Vec2): Vec2 => {
  const size = length(position);
  if (size <= WORLD_RADIUS) {
    return position;
  }
  return scale(normalize(position), WORLD_RADIUS);
};

export const applySoftWorldBounds = (position: Vec2, velocity: Vec2, dt: number): void => {
  const size = length(position);
  if (size > WORLD_RADIUS) {
    const push = normalize(scale(position, -1));
    velocity.x += push.x * dt * 320;
    velocity.y += push.y * dt * 320;
  }
};
