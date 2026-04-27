import type { ExperimentPreset, PlaygroundSettings } from "@/physics/types";

export const baseSettings: PlaygroundSettings = {
  experimentId: "gravity-sandbox",
  paused: false,
  debug: true,
  showVectors: true,
  showTrails: true,
  showForces: true,
  objectType: "ball",
  gravityX: 0,
  gravityY: 1,
  gravityZ: -9.81,
  mass: 3,
  friction: 0.18,
  restitution: 0.55,
  windSpeed: 0,
  damping: 0.02,
  springStiffness: 0.012,
  pendulumLength: 280,
  fieldStrength: 0.45,
  orbitalGravity: 0.34,
  initialVelocity: 4.5
};

export const experimentPresets: ExperimentPreset[] = [
  {
    id: "gravity-sandbox",
    name: "Gravity Sandbox",
    engine: "matter2d",
    tagline: "Live 2D rigid bodies with editable gravity.",
    description: "Spawn balls and cubes, redirect gravity, drag bodies, and watch collisions settle with true mass, friction, and restitution.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 1,
      windSpeed: 0,
      restitution: 0.5,
      friction: 0.18,
      mass: 3,
      objectType: "ball"
    }
  },
  {
    id: "collision-lab",
    name: "Collision Lab",
    engine: "matter2d",
    tagline: "Momentum, bounce, friction, and impact vectors.",
    description: "Two launchers fire bodies into a measured impact zone with velocity vectors, collision markers, and kinetic energy readouts.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 0.7,
      restitution: 0.82,
      friction: 0.08,
      mass: 5,
      initialVelocity: 7,
      objectType: "box"
    }
  },
  {
    id: "pendulum-spring",
    name: "Pendulum / Spring Lab",
    engine: "matter2d",
    tagline: "Constraints, oscillation, damping, and spring stiffness.",
    description: "A constraint-driven pendulum and spring oscillator share the canvas so damping and stiffness changes are visible immediately.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 1,
      pendulumLength: 300,
      springStiffness: 0.014,
      damping: 0.03,
      mass: 4,
      restitution: 0.25
    }
  },
  {
    id: "wind-aerodynamics",
    name: "Wind / Aerodynamics",
    engine: "matter2d",
    tagline: "A force field pushes bodies through stream particles.",
    description: "Directional wind is applied as a real force to each body, with simple drag and streamlines that reveal airflow.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 0.45,
      windSpeed: 8,
      friction: 0.04,
      restitution: 0.35,
      objectType: "capsule"
    }
  },
  {
    id: "orbit-gravity",
    name: "Orbit / Planet Gravity",
    engine: "matter2d",
    tagline: "Pairwise attraction and orbital trails.",
    description: "Bodies attract one another with an inverse-square approximation, producing slingshots, captures, and orbital decay.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 0,
      orbitalGravity: 0.5,
      initialVelocity: 5.4,
      mass: 10,
      friction: 0,
      restitution: 0.95,
      objectType: "ball"
    }
  },
  {
    id: "magnet-field",
    name: "Magnet / Force Field",
    engine: "matter2d",
    tagline: "Attractors, repellers, particles, and field lines.",
    description: "Invisible attract and repel points apply continuous forces while probe particles reveal the field direction.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 0,
      fieldStrength: 0.62,
      damping: 0.01,
      mass: 3,
      restitution: 0.72,
      objectType: "ball"
    }
  },
  {
    id: "chain-ragdoll",
    name: "Chain / Ragdoll Lab",
    engine: "matter2d",
    tagline: "Linked rigid bodies and articulated constraints.",
    description: "Drag a linked chain or torso rig and watch constraint impulses propagate through the connected bodies.",
    defaultSettings: {
      gravityX: 0,
      gravityY: 1,
      damping: 0.015,
      restitution: 0.22,
      friction: 0.2,
      mass: 3,
      objectType: "compound"
    }
  },
  {
    id: "gravity-3d",
    name: "3D Gravity Sandbox",
    engine: "rapier3d",
    tagline: "Rapier rigid bodies, shadows, orbit camera, and real contacts.",
    description: "Drop cubes and spheres into a 3D lab, tune gravity, and inspect collisions with a proper Rapier physics world.",
    defaultSettings: {
      gravityX: 0,
      gravityY: -9.81,
      gravityZ: 0,
      mass: 4,
      friction: 0.18,
      restitution: 0.38,
      objectType: "box"
    }
  }
];

export const getExperiment = (id: PlaygroundSettings["experimentId"]) =>
  experimentPresets.find((experiment) => experiment.id === id) ?? experimentPresets[0];

export const settingsForExperiment = (id: PlaygroundSettings["experimentId"]): PlaygroundSettings => ({
  ...baseSettings,
  experimentId: id,
  ...getExperiment(id).defaultSettings
});
