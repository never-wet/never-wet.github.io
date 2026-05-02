import { create } from "zustand";
import { applyBlackHoleTidalEffects, convertToBlackHole } from "../lib/events/BlackHole";
import { resolveCollisions } from "../lib/events/Collision";
import { triggerSupernova } from "../lib/events/Supernova";
import { velocityVerletStep, initializeAccelerations } from "../lib/physics/Integrator";
import {
  BodyType,
  CelestialBody,
  DEFAULT_PHYSICS_OPTIONS,
  EARTH_MASS_KG,
  EARTH_RADIUS_KM,
  PhysicsOptions,
  ShockwaveShell,
  SimulationParticle,
  Vector3D,
  add,
  createCelestialBody,
  detectCollisions,
  makeId,
  normalize,
  scale,
  stepParticles,
  stepShockwaves,
  subtract,
  vec,
} from "../lib/physics/NBodyEngine";
import { PredictionResult, predictFuture } from "../lib/physics/PredictionEngine";
import { ScenarioId, createScenario } from "../lib/scenarios/SolarSystem";

export type VisualizationToggles = {
  orbitTrails: boolean;
  predictionPaths: boolean;
  gravityField: boolean;
  velocityVectors: boolean;
  collisionRisk: boolean;
  objectLabels: boolean;
  habitableZone: boolean;
  accretionDisk: boolean;
  eventHorizon: boolean;
  simulationGrid: boolean;
};

export type CameraMode = "orbit" | "follow" | "cinematic" | "top-down" | "free";

export type BodyDraft = {
  name: string;
  type: BodyType;
  massEarth: number;
  radiusEarth: number;
  temperatureK: number;
  color: string;
  position: Vector3D;
  velocity: Vector3D;
};

type SavedScenario = {
  bodies: CelestialBody[];
  simTimeDays: number;
  selectedId?: string;
};

type SimulationStore = {
  bodies: CelestialBody[];
  particles: SimulationParticle[];
  shells: ShockwaveShell[];
  prediction: PredictionResult | null;
  selectedId?: string;
  scenarioId: ScenarioId;
  simTimeDays: number;
  accumulatorDays: number;
  isPlaying: boolean;
  timeSpeed: number;
  cameraMode: CameraMode;
  physics: PhysicsOptions;
  visualization: VisualizationToggles;
  eventLog: string[];
  tick: (deltaSeconds: number) => void;
  stepForward: () => void;
  togglePlay: () => void;
  setTimeSpeed: (speed: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedId: (id: string | undefined) => void;
  updateBody: (id: string, patch: Partial<CelestialBody>) => void;
  createBody: (draft: BodyDraft, orbitSelected: boolean) => void;
  deleteBody: (id: string) => void;
  loadScenario: (id: ScenarioId) => void;
  resetScenario: () => void;
  triggerSupernova: () => void;
  convertSelectedToBlackHole: () => void;
  seedDustDisk: () => void;
  toggleVisualization: (key: keyof VisualizationToggles) => void;
  setGravityMultiplier: (value: number) => void;
  saveScenario: () => void;
  loadSavedScenario: () => void;
  refreshPrediction: () => void;
};

const STORAGE_KEY = "never-wet-galaxy-simulator-scenario";
const DEFAULT_VISUALIZATION: VisualizationToggles = {
  orbitTrails: true,
  predictionPaths: true,
  gravityField: false,
  velocityVectors: false,
  collisionRisk: true,
  objectLabels: true,
  habitableZone: false,
  accretionDisk: true,
  eventHorizon: true,
  simulationGrid: false,
};

const initialScenario = createScenario("solar-system");

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  bodies: initializeAccelerations(initialScenario.bodies, DEFAULT_PHYSICS_OPTIONS),
  particles: [],
  shells: [],
  prediction: null,
  selectedId: initialScenario.selectedId,
  scenarioId: initialScenario.id,
  simTimeDays: 0,
  accumulatorDays: 0,
  isPlaying: true,
  timeSpeed: 10,
  cameraMode: "orbit",
  physics: DEFAULT_PHYSICS_OPTIONS,
  visualization: DEFAULT_VISUALIZATION,
  eventLog: [`Loaded scenario: ${initialScenario.name}.`],

  tick(deltaSeconds) {
    const state = get();
    if (!state.isPlaying) return;

    simulateDays(deltaSeconds * state.timeSpeed);
  },

  stepForward() {
    simulateDays(get().physics.fixedTimeStepDays * 4);
  },

  togglePlay() {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setTimeSpeed(speed) {
    set({ timeSpeed: speed });
  },

  setCameraMode(mode) {
    set({ cameraMode: mode });
  },

  setSelectedId(id) {
    set({ selectedId: id });
    get().refreshPrediction();
  },

  updateBody(id, patch) {
    set((state) => ({
      bodies: initializeAccelerations(
        state.bodies.map((body) =>
          body.id === id
            ? rederiveBody({
                ...body,
                ...patch,
                trail: patch.position ? [{ ...patch.position }] : body.trail,
              })
            : body,
        ),
        state.physics,
      ),
    }));
    get().refreshPrediction();
  },

  createBody(draft, orbitSelected) {
    const state = get();
    if (state.bodies.length >= state.physics.maxBodies) {
      pushLog("Body cap reached. Delete objects before adding more.");
      return;
    }

    const selected = state.bodies.find((body) => body.id === state.selectedId);
    const position = orbitSelected && selected ? add(selected.position, draft.position) : draft.position;
    const velocity =
      orbitSelected && selected
        ? add(selected.velocity, circularOrbitVelocity(selected, draft.position))
        : draft.velocity;
    const body = createCelestialBody({
      name: draft.name || draft.type,
      type: draft.type,
      massKg: draft.massEarth * EARTH_MASS_KG,
      radiusKm: draft.radiusEarth * EARTH_RADIUS_KM,
      position,
      velocity,
      temperatureK: draft.temperatureK,
      color: draft.color,
      primaryId: orbitSelected ? selected?.id : undefined,
    });

    set((current) => ({
      bodies: initializeAccelerations([...current.bodies, body], current.physics),
      selectedId: body.id,
      eventLog: [`Created ${body.name}.`, ...current.eventLog].slice(0, 8),
    }));
    get().refreshPrediction();
  },

  deleteBody(id) {
    set((state) => {
      const body = state.bodies.find((entry) => entry.id === id);
      const bodies = state.bodies.filter((entry) => entry.id !== id);
      return {
        bodies,
        selectedId: bodies[0]?.id,
        eventLog: [`Deleted ${body?.name ?? "body"}.`, ...state.eventLog].slice(0, 8),
      };
    });
    get().refreshPrediction();
  },

  loadScenario(id) {
    const scenario = createScenario(id);
    set((state) => ({
      bodies: initializeAccelerations(scenario.bodies, state.physics),
      particles: [],
      shells: [],
      selectedId: scenario.selectedId,
      scenarioId: id,
      simTimeDays: 0,
      accumulatorDays: 0,
      isPlaying: true,
      eventLog: [`Loaded scenario: ${scenario.name}.`, scenario.description].slice(0, 8),
    }));
    get().refreshPrediction();
  },

  resetScenario() {
    get().loadScenario(get().scenarioId);
  },

  triggerSupernova() {
    const state = get();
    const result = triggerSupernova(
      state.bodies,
      state.particles,
      state.shells,
      state.selectedId,
      state.physics,
    );
    set({
      bodies: initializeAccelerations(result.bodies, state.physics),
      particles: result.particles,
      shells: result.shells,
      selectedId: result.selectedId,
      eventLog: [result.log, ...state.eventLog].slice(0, 8),
    });
    get().refreshPrediction();
  },

  convertSelectedToBlackHole() {
    const state = get();
    const result = convertToBlackHole(state.bodies, state.particles, state.selectedId, state.physics);
    set({
      bodies: initializeAccelerations(result.bodies, state.physics),
      particles: result.particles,
      selectedId: result.selectedId,
      eventLog: [result.log, ...state.eventLog].slice(0, 8),
    });
    get().refreshPrediction();
  },

  seedDustDisk() {
    const state = get();
    const primary =
      state.bodies.find((body) => body.id === state.selectedId && (body.type === "star" || body.type === "black-hole")) ??
      state.bodies.find((body) => body.type === "star" || body.type === "black-hole");

    if (!primary) {
      pushLog("Dust disk requires a star or black hole.");
      return;
    }

    const room = Math.max(0, state.physics.maxBodies - state.bodies.length);
    const count = Math.min(room, 32);
    const dust = Array.from({ length: count }, (_, index) => {
      const angle = index * 2.399963 + Math.random() * 0.2;
      const radius = 1.8 + Math.sqrt(index + 1) * 0.62;
      const offset = vec(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.05, Math.sin(angle) * radius);
      const body = createCelestialBody({
        id: makeId("dust"),
        name: `Accretion seed ${index + 1}`,
        type: "dust",
        massKg: EARTH_MASS_KG * (0.000001 + Math.random() * 0.00001),
        radiusKm: 8 + Math.random() * 30,
        position: add(primary.position, offset),
        velocity: add(primary.velocity, circularOrbitVelocity(primary, offset)),
        temperatureK: 90,
        color: "#9a8b78",
        primaryId: primary.id,
      });
      return body;
    });

    set((current) => ({
      bodies: initializeAccelerations([...current.bodies, ...dust], current.physics),
      eventLog: [`Seeded ${dust.length} accretion particles around ${primary.name}.`, ...current.eventLog].slice(0, 8),
    }));
  },

  toggleVisualization(key) {
    set((state) => ({
      visualization: {
        ...state.visualization,
        [key]: !state.visualization[key],
      },
    }));
  },

  setGravityMultiplier(value) {
    set((state) => ({
      physics: {
        ...state.physics,
        gravitationalConstant: DEFAULT_PHYSICS_OPTIONS.gravitationalConstant * value,
      },
    }));
    get().refreshPrediction();
  },

  saveScenario() {
    const state = get();
    const payload: SavedScenario = {
      bodies: state.bodies,
      simTimeDays: state.simTimeDays,
      selectedId: state.selectedId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    pushLog("Scenario saved to browser storage.");
  },

  loadSavedScenario() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      pushLog("No saved scenario found.");
      return;
    }

    const payload = JSON.parse(raw) as SavedScenario;
    set((state) => ({
      bodies: initializeAccelerations(payload.bodies, state.physics),
      particles: [],
      shells: [],
      selectedId: payload.selectedId,
      simTimeDays: payload.simTimeDays ?? 0,
      scenarioId: "custom-sandbox",
      eventLog: ["Loaded saved browser scenario.", ...state.eventLog].slice(0, 8),
    }));
    get().refreshPrediction();
  },

  refreshPrediction() {
    const state = get();
    set({
      prediction:
        state.selectedId && state.visualization.predictionPaths
          ? predictFuture(state.selectedId, state.bodies, state.physics)
          : null,
    });
  },
}));

function simulateDays(daysToSimulate: number): void {
  const state = useSimulationStore.getState();
  const physics = state.physics;
  const accumulated = Math.min(
    daysToSimulate + state.accumulatorDays,
    physics.fixedTimeStepDays * physics.maxSubstepsPerFrame,
  );
  const steps = Math.floor(accumulated / physics.fixedTimeStepDays);
  const accumulatorDays = accumulated - steps * physics.fixedTimeStepDays;

  if (steps <= 0) {
    useSimulationStore.setState({ accumulatorDays });
    return;
  }

  let bodies = state.bodies;
  let particles = state.particles;
  let shells = state.shells;
  let simTimeDays = state.simTimeDays;
  const logs: string[] = [];
  let selectedId = state.selectedId;

  for (let index = 0; index < steps; index += 1) {
    const tidal = applyBlackHoleTidalEffects(bodies, particles, physics);
    bodies = tidal.bodies;
    particles = tidal.particles;
    logs.push(...tidal.logs);

    const integrated = velocityVerletStep(bodies, physics.fixedTimeStepDays, physics);
    bodies = integrated.bodies;

    const collisionCandidates = detectCollisions(bodies, physics);
    if (collisionCandidates.length) {
      const collision = resolveCollisions(bodies, particles, collisionCandidates, physics);
      bodies = initializeAccelerations(collision.bodies, physics);
      particles = collision.particles;
      selectedId = collision.selectedId ?? selectedId;
      logs.push(...collision.logs);
    }

    particles = stepParticles(particles, physics.fixedTimeStepDays, physics.maxParticles);
    shells = stepShockwaves(shells, physics.fixedTimeStepDays);
    simTimeDays += physics.fixedTimeStepDays;
  }

  const selectedStillExists = selectedId ? bodies.some((body) => body.id === selectedId) : false;
  if (!selectedStillExists) selectedId = bodies[0]?.id;

  useSimulationStore.setState((current) => ({
    bodies,
    particles,
    shells,
    simTimeDays,
    accumulatorDays,
    selectedId,
    eventLog: [...logs.reverse(), ...current.eventLog].slice(0, 8),
  }));

  if (Math.floor(simTimeDays) % 4 === 0) {
    useSimulationStore.getState().refreshPrediction();
  }
}

function circularOrbitVelocity(primary: CelestialBody, offset: Vector3D): Vector3D {
  const radius = Math.max(Math.sqrt(offset.x ** 2 + offset.y ** 2 + offset.z ** 2), 0.001);
  const tangent = normalize(vec(-offset.z, 0, offset.x));
  const speed = Math.sqrt((DEFAULT_PHYSICS_OPTIONS.gravitationalConstant * primary.massSolar) / radius);
  return scale(tangent, speed);
}

function pushLog(message: string): void {
  useSimulationStore.setState((state) => ({
    eventLog: [message, ...state.eventLog].slice(0, 8),
  }));
}

function rederiveBody(body: CelestialBody): CelestialBody {
  const derived = createCelestialBody({
    id: body.id,
    name: body.name,
    type: body.type,
    massKg: body.massKg,
    radiusKm: body.radiusKm,
    position: body.position,
    velocity: body.velocity,
    temperatureK: body.temperatureK,
    color: body.color,
    luminositySolar: body.luminositySolar,
    primaryId: body.primaryId,
  });

  return {
    ...derived,
    acceleration: body.acceleration,
    trail: body.trail,
  };
}
