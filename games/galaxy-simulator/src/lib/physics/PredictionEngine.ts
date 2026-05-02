import { resolveCollisions } from "../events/Collision";
import { applyBlackHoleTidalEffects } from "../events/BlackHole";
import {
  CelestialBody,
  DEFAULT_PHYSICS_OPTIONS,
  PhysicsOptions,
  SimulationParticle,
  Vector3D,
  cloneBodies,
  collisionRadiusAU,
  detectCollisions,
  distance,
} from "./NBodyEngine";
import { velocityVerletStep } from "./Integrator";
import { computeOrbitalElements, formatDurationDays } from "./OrbitalMath";

export type PredictionStatus =
  | "stable"
  | "unstable"
  | "collision"
  | "escape"
  | "decay"
  | "black-hole-capture";

export type PredictionResult = {
  selectedId: string;
  status: PredictionStatus;
  summary: string;
  trajectory: Vector3D[];
  futurePosition: Vector3D | null;
  estimatedTimeToEventDays: number | null;
  collisionProbability: number;
  closestApproachAU: number | null;
  warnings: string[];
};

export type PredictionOptions = {
  horizonDays: number;
  dtDays: number;
  sampleEvery: number;
  maxSteps: number;
};

export const DEFAULT_PREDICTION_OPTIONS: PredictionOptions = {
  horizonDays: 365 * 8,
  dtDays: 2,
  sampleEvery: 3,
  maxSteps: 1460,
};

export function predictFuture(
  selectedId: string | undefined,
  sourceBodies: CelestialBody[],
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
  predictionOptions: PredictionOptions = DEFAULT_PREDICTION_OPTIONS,
): PredictionResult | null {
  if (!selectedId) return null;

  let bodies = cloneBodies(sourceBodies);
  let particles: SimulationParticle[] = [];
  const selected = bodies.find((body) => body.id === selectedId);
  if (!selected) return null;

  const trajectory: Vector3D[] = [];
  const warnings: string[] = [];
  const maxSteps = Math.min(
    predictionOptions.maxSteps,
    Math.ceil(predictionOptions.horizonDays / predictionOptions.dtDays),
  );
  let closestApproachAU = Number.POSITIVE_INFINITY;
  let minimumClearanceAU = Number.POSITIVE_INFINITY;
  let status: PredictionStatus = "stable";
  let estimatedTimeToEventDays: number | null = null;
  let summary = "Stable orbit detected across the prediction horizon.";

  for (let step = 0; step <= maxSteps; step += 1) {
    const current = bodies.find((body) => body.id === selectedId);
    const elapsed = step * predictionOptions.dtDays;

    if (!current) {
      status = "collision";
      estimatedTimeToEventDays = elapsed;
      summary = `Collision predicted in ${formatDurationDays(elapsed)}.`;
      break;
    }

    if (step % predictionOptions.sampleEvery === 0) {
      trajectory.push({ ...current.position });
    }

    const nearest = nearestApproach(current, bodies, options);
    if (nearest) {
      closestApproachAU = Math.min(closestApproachAU, nearest.distanceAU);
      minimumClearanceAU = Math.min(minimumClearanceAU, nearest.clearanceAU);

      if (nearest.clearanceAU <= 0) {
        status = nearest.body.type === "black-hole" ? "black-hole-capture" : "collision";
        estimatedTimeToEventDays = elapsed;
        summary =
          status === "black-hole-capture"
            ? `Black hole capture likely in ${formatDurationDays(elapsed)}.`
            : `Collision predicted in ${formatDurationDays(elapsed)}.`;
        break;
      }
    }

    const orbital = computeOrbitalElements(current, bodies, options.gravitationalConstant);
    if (orbital.primary) {
      if (!orbital.isBound && orbital.distanceAU > 10 && elapsed > predictionOptions.horizonDays * 0.08) {
        status = "escape";
        estimatedTimeToEventDays = elapsed;
        summary = `Object will escape system in roughly ${formatDurationDays(elapsed)}.`;
        break;
      }

      if (orbital.periapsisAU != null && orbital.periapsisAU < orbital.primary.renderRadiusAU * 1.8) {
        status = orbital.primary.type === "black-hole" ? "black-hole-capture" : "decay";
        estimatedTimeToEventDays = elapsed || predictionOptions.dtDays;
        summary =
          status === "black-hole-capture"
            ? "Black hole capture likely on current trajectory."
            : "Orbit decay warning: periapsis intersects the primary body.";
        break;
      }

      if (orbital.eccentricity != null && orbital.eccentricity > 0.82 && orbital.isBound) {
        warnings.push("High eccentricity orbit.");
      }
    }

    const tidal = applyBlackHoleTidalEffects(bodies, particles, options);
    bodies = tidal.bodies;
    particles = tidal.particles;

    const integrated = velocityVerletStep(bodies, predictionOptions.dtDays, {
      ...options,
      trailLength: 4,
    });
    bodies = integrated.bodies;

    const collisions = detectCollisions(bodies, options);
    if (collisions.length) {
      const collision = collisions.find(
        (candidate) => candidate.aId === selectedId || candidate.bId === selectedId,
      );

      if (collision) {
        const otherId = collision.aId === selectedId ? collision.bId : collision.aId;
        const other = bodies.find((body) => body.id === otherId);
        status = other?.type === "black-hole" ? "black-hole-capture" : "collision";
        estimatedTimeToEventDays = elapsed + predictionOptions.dtDays;
        summary =
          status === "black-hole-capture"
            ? `Black hole capture likely in ${formatDurationDays(estimatedTimeToEventDays)}.`
            : `Collision predicted in ${formatDurationDays(estimatedTimeToEventDays)}.`;
        break;
      }

      const resolved = resolveCollisions(bodies, particles, collisions, options);
      bodies = resolved.bodies;
      particles = resolved.particles;
    }
  }

  if (status === "stable" && warnings.length > 2) {
    status = "unstable";
    summary = "Orbit unstable: repeated high-eccentricity states detected.";
  }

  const future = bodies.find((body) => body.id === selectedId);
  const collisionProbability = estimateCollisionProbability(
    minimumClearanceAU,
    collisionRadiusAU(selected, options),
  );

  if (status === "stable" && collisionProbability > 0.42) {
    status = "unstable";
    summary = `Close approach risk detected. Collision probability ${Math.round(collisionProbability * 100)}%.`;
  }

  return {
    selectedId,
    status,
    summary,
    trajectory,
    futurePosition: future ? { ...future.position } : trajectory.at(-1) ?? null,
    estimatedTimeToEventDays,
    collisionProbability,
    closestApproachAU: Number.isFinite(closestApproachAU) ? closestApproachAU : null,
    warnings: [...new Set(warnings)].slice(0, 4),
  };
}

function nearestApproach(
  selected: CelestialBody,
  bodies: CelestialBody[],
  options: PhysicsOptions,
):
  | {
      body: CelestialBody;
      distanceAU: number;
      clearanceAU: number;
    }
  | undefined {
  let nearest:
    | {
        body: CelestialBody;
        distanceAU: number;
        clearanceAU: number;
      }
    | undefined;

  for (const body of bodies) {
    if (body.id === selected.id) continue;
    const centerDistance = distance(selected.position, body.position);
    const clearance =
      centerDistance - collisionRadiusAU(selected, options) - collisionRadiusAU(body, options);
    if (!nearest || clearance < nearest.clearanceAU) {
      nearest = {
        body,
        distanceAU: centerDistance,
        clearanceAU: clearance,
      };
    }
  }

  return nearest;
}

function estimateCollisionProbability(clearanceAU: number, bodyRadiusAU: number): number {
  if (!Number.isFinite(clearanceAU)) return 0;
  if (clearanceAU <= 0) return 1;
  const riskBand = Math.max(bodyRadiusAU * 18, 0.04);
  return Math.round((1 - Math.min(clearanceAU / riskBand, 1)) ** 2 * 100) / 100;
}
