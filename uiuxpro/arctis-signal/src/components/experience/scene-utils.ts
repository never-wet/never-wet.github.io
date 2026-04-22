import type { MutableRefObject } from "react";
import { Vector3 } from "three";

export const SCENE_PALETTE = {
  background: "#050607",
  fog: "#0b1117",
  steel: "#293544",
  steelBright: "#c7d9eb",
  accent: "#74d9ff",
  accentShadow: "#173744",
  text: "#edf4ff",
  muted: "#93a3b7",
} as const;

export type SceneMotionState = {
  activeChapter: number;
  lowPower: boolean;
  mobile: boolean;
  pointerX: number;
  pointerY: number;
  reducedMotion: boolean;
  storyProgress: number;
};

export type SceneStateRef = MutableRefObject<SceneMotionState>;

export type VectorKeyframe = {
  at: number;
  value: Vector3;
};

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = clamp01((value - edge0) / (edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
}

export function segmentProgress(value: number, start: number, end: number) {
  return smoothstep(start, end, value);
}

export function sampleVector3(
  keyframes: readonly VectorKeyframe[],
  progress: number,
  target: Vector3
) {
  if (progress <= keyframes[0].at) {
    return target.copy(keyframes[0].value);
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index];
    const next = keyframes[index + 1];

    if (progress <= next.at) {
      const localProgress = smoothstep(
        current.at,
        next.at,
        progress
      );

      return target.copy(current.value).lerp(next.value, localProgress);
    }
  }

  return target.copy(keyframes[keyframes.length - 1].value);
}
