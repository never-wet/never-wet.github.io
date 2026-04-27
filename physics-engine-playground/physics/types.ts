export type ExperimentEngine = "matter2d" | "rapier3d";

export type ExperimentId =
  | "gravity-sandbox"
  | "collision-lab"
  | "pendulum-spring"
  | "wind-aerodynamics"
  | "orbit-gravity"
  | "magnet-field"
  | "chain-ragdoll"
  | "gravity-3d";

export type SpawnShape = "ball" | "box" | "capsule" | "compound";

export type DebugMetric = {
  fps: number;
  bodyCount: number;
  constraintCount: number;
  timestep: number;
  collisions: number;
  kineticEnergy: number;
};

export type PlaygroundSettings = {
  experimentId: ExperimentId;
  paused: boolean;
  debug: boolean;
  showVectors: boolean;
  showTrails: boolean;
  showForces: boolean;
  objectType: SpawnShape;
  gravityX: number;
  gravityY: number;
  gravityZ: number;
  mass: number;
  friction: number;
  restitution: number;
  windSpeed: number;
  damping: number;
  springStiffness: number;
  pendulumLength: number;
  fieldStrength: number;
  orbitalGravity: number;
  initialVelocity: number;
};

export type ExperimentPreset = {
  id: ExperimentId;
  name: string;
  engine: ExperimentEngine;
  tagline: string;
  description: string;
  defaultSettings: Partial<PlaygroundSettings>;
};

export type SavedPreset = {
  name: string;
  settings: PlaygroundSettings;
  createdAt: string;
};
