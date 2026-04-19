import { Euler, Vector3 } from "three";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha;
}

export function damp(current: number, target: number, smoothing: number, delta: number) {
  return lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

export function dampVector3(
  current: Vector3,
  target: Vector3 | [number, number, number],
  smoothing: number,
  delta: number,
) {
  const alpha = 1 - Math.exp(-smoothing * delta);
  if (target instanceof Vector3) {
    current.lerp(target, alpha);
    return current;
  }

  current.x = lerp(current.x, target[0], alpha);
  current.y = lerp(current.y, target[1], alpha);
  current.z = lerp(current.z, target[2], alpha);
  return current;
}

export function dampEuler(
  current: Euler,
  target: [number, number, number],
  smoothing: number,
  delta: number,
) {
  const alpha = 1 - Math.exp(-smoothing * delta);
  current.x = lerp(current.x, target[0], alpha);
  current.y = lerp(current.y, target[1], alpha);
  current.z = lerp(current.z, target[2], alpha);
  return current;
}

export function smoothstep(min: number, max: number, value: number) {
  const normalized = clamp((value - min) / (max - min), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  const ratio = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return lerp(outMin, outMax, ratio);
}
