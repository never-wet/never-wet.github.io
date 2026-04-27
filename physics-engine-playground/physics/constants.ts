export const FIXED_TIMESTEP_MS = 1000 / 60;

export const WORLD_BOUNDS = {
  width: 1280,
  height: 760,
  wallThickness: 64
};

export const DEFAULT_METRICS = {
  fps: 0,
  bodyCount: 0,
  constraintCount: 0,
  timestep: FIXED_TIMESTEP_MS,
  collisions: 0,
  kineticEnergy: 0
};

export const COLOR = {
  panel: "rgba(10, 16, 24, 0.78)",
  panelStrong: "rgba(7, 12, 18, 0.94)",
  line: "rgba(155, 176, 195, 0.28)",
  text: "#eaf2ff",
  muted: "#93a6b8",
  accent: "#4fd1c5",
  accent2: "#f6c85f",
  danger: "#ff6b7a",
  blue: "#6aa9ff",
  green: "#68d391",
  purple: "#b794f4"
};
