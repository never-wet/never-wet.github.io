export type BodyType =
  | "star"
  | "planet"
  | "moon"
  | "asteroid"
  | "black-hole"
  | "neutron-star"
  | "dust";

export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type CelestialBody = {
  id: string;
  name: string;
  type: BodyType;
  massKg: number;
  massSolar: number;
  radiusKm: number;
  densityKgM3: number;
  position: Vector3D;
  velocity: Vector3D;
  acceleration: Vector3D;
  temperatureK: number;
  luminositySolar: number;
  gravitationalInfluenceAU: number;
  color: string;
  trail: Vector3D[];
  renderRadiusAU: number;
  primaryId?: string;
};

export type SimulationParticle = {
  id: string;
  kind: "ejecta" | "debris" | "plasma" | "accretion";
  position: Vector3D;
  velocity: Vector3D;
  color: string;
  lifeDays: number;
  maxLifeDays: number;
  sizeAU: number;
};

export type ShockwaveShell = {
  id: string;
  center: Vector3D;
  radiusAU: number;
  expansionRateAUPerDay: number;
  color: string;
  opacity: number;
  lifeDays: number;
};

export type BodyInput = {
  id?: string;
  name: string;
  type: BodyType;
  massKg: number;
  radiusKm: number;
  position: Vector3D;
  velocity: Vector3D;
  temperatureK: number;
  color: string;
  luminositySolar?: number;
  primaryId?: string;
};

export type PhysicsOptions = {
  gravitationalConstant: number;
  softeningAU: number;
  fixedTimeStepDays: number;
  maxSubstepsPerFrame: number;
  maxBodies: number;
  maxParticles: number;
  trailLength: number;
  collisionRadiusScale: number;
  blackHoleCaptureMultiplier: number;
};

export type CollisionCandidate = {
  aId: string;
  bId: string;
  distanceAU: number;
};

export type StepDiagnostics = {
  accelerationSamples: Float32Array;
  maxAcceleration: number;
  centerOfMass: Vector3D;
};

export const AU_KM = 149_597_870.7;
export const DAY_SECONDS = 86_400;
export const SOLAR_MASS_KG = 1.98847e30;
export const EARTH_MASS_KG = 5.9722e24;
export const JUPITER_MASS_KG = 1.89813e27;
export const SOLAR_RADIUS_KM = 695_700;
export const EARTH_RADIUS_KM = 6_371;
export const G_AU3_SOLAR_MASS_DAY2 = 0.0002959122082855911;
export const AU_PER_DAY_TO_KM_PER_S = AU_KM / DAY_SECONDS;

export const DEFAULT_PHYSICS_OPTIONS: PhysicsOptions = {
  gravitationalConstant: G_AU3_SOLAR_MASS_DAY2,
  softeningAU: 0.00035,
  fixedTimeStepDays: 0.25,
  maxSubstepsPerFrame: 96,
  maxBodies: 140,
  maxParticles: 1400,
  trailLength: 420,
  collisionRadiusScale: 32,
  blackHoleCaptureMultiplier: 4,
};

export function vec(x = 0, y = 0, z = 0): Vector3D {
  return { x, y, z };
}

export function cloneVector(vector: Vector3D): Vector3D {
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function add(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: Vector3D, factor: number): Vector3D {
  return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

export function dot(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function magnitudeSquared(a: Vector3D): number {
  return dot(a, a);
}

export function magnitude(a: Vector3D): number {
  return Math.sqrt(magnitudeSquared(a));
}

export function distance(a: Vector3D, b: Vector3D): number {
  return magnitude(subtract(a, b));
}

export function normalize(a: Vector3D): Vector3D {
  const length = magnitude(a);
  return length > 1e-12 ? scale(a, 1 / length) : vec();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function cloneBody(body: CelestialBody): CelestialBody {
  return {
    ...body,
    position: cloneVector(body.position),
    velocity: cloneVector(body.velocity),
    acceleration: cloneVector(body.acceleration),
    trail: body.trail.map(cloneVector),
  };
}

export function cloneBodies(bodies: CelestialBody[]): CelestialBody[] {
  return bodies.map(cloneBody);
}

export function kgToSolarMass(massKg: number): number {
  return massKg / SOLAR_MASS_KG;
}

export function solarMassToKg(massSolar: number): number {
  return massSolar * SOLAR_MASS_KG;
}

export function computeDensityKgM3(massKg: number, radiusKm: number): number {
  const radiusMeters = Math.max(radiusKm * 1000, 1);
  const volume = (4 / 3) * Math.PI * radiusMeters ** 3;
  return massKg / volume;
}

export function luminosityFromTemperature(radiusKm: number, temperatureK: number): number {
  if (temperatureK <= 0) return 0;
  const radiusSolar = radiusKm / SOLAR_RADIUS_KM;
  return radiusSolar ** 2 * (temperatureK / 5778) ** 4;
}

export function gravitationalInfluenceAU(
  body: CelestialBody,
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
): number {
  const nominal = Math.sqrt(
    Math.max(options.gravitationalConstant * body.massSolar, 0) / 0.0000008,
  );

  if (body.type === "black-hole") return nominal * 2.2;
  if (body.type === "neutron-star") return nominal * 1.35;
  return nominal;
}

export function renderRadiusAU(type: BodyType, radiusKm: number, massSolar: number): number {
  const physicalAU = radiusKm / AU_KM;

  if (type === "black-hole") return clamp(Math.cbrt(Math.max(massSolar, 0.000001)) * 0.045, 0.025, 0.22);
  if (type === "neutron-star") return clamp(Math.cbrt(Math.max(massSolar, 0.000001)) * 0.024, 0.018, 0.12);
  if (type === "star") return clamp(Math.sqrt(physicalAU) * 0.9, 0.09, 0.38);
  if (type === "planet") return clamp(Math.sqrt(physicalAU) * 0.5, 0.026, 0.11);
  if (type === "moon") return clamp(Math.sqrt(physicalAU) * 0.36, 0.015, 0.058);
  if (type === "dust") return 0.01;
  return clamp(Math.sqrt(physicalAU) * 0.28, 0.01, 0.035);
}

export function collisionRadiusAU(
  body: CelestialBody,
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
): number {
  const physical = (body.radiusKm / AU_KM) * options.collisionRadiusScale;
  const visualMinimum = body.renderRadiusAU * 0.26;

  if (body.type === "black-hole") {
    return Math.max(physical, body.renderRadiusAU * options.blackHoleCaptureMultiplier);
  }

  return Math.max(physical, visualMinimum);
}

export function computeAccelerations(
  bodies: CelestialBody[],
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
): { accelerations: Vector3D[]; diagnostics: StepDiagnostics } {
  const accelerations = bodies.map(() => vec());
  const accelerationSamples = new Float32Array(bodies.length);
  let maxAcceleration = 0;

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      const offset = subtract(b.position, a.position);
      const rawDistanceSquared = magnitudeSquared(offset);
      const softenedDistanceSquared =
        rawDistanceSquared + options.softeningAU * options.softeningAU;
      const separation = Math.sqrt(softenedDistanceSquared);
      const direction = separation > 0 ? scale(offset, 1 / separation) : vec();
      const scalar = options.gravitationalConstant / Math.max(softenedDistanceSquared, 1e-12);

      accelerations[i] = add(accelerations[i], scale(direction, scalar * b.massSolar));
      accelerations[j] = add(accelerations[j], scale(direction, -scalar * a.massSolar));
    }
  }

  accelerations.forEach((acceleration, index) => {
    const value = magnitude(acceleration);
    accelerationSamples[index] = value;
    maxAcceleration = Math.max(maxAcceleration, value);
  });

  return {
    accelerations,
    diagnostics: {
      accelerationSamples,
      maxAcceleration,
      centerOfMass: centerOfMass(bodies),
    },
  };
}

export function detectCollisions(
  bodies: CelestialBody[],
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
): CollisionCandidate[] {
  const collisions: CollisionCandidate[] = [];
  const consumed = new Set<string>();

  for (let i = 0; i < bodies.length; i += 1) {
    if (consumed.has(bodies[i].id)) continue;

    for (let j = i + 1; j < bodies.length; j += 1) {
      if (consumed.has(bodies[j].id)) continue;

      const separation = distance(bodies[i].position, bodies[j].position);
      const contactDistance = collisionRadiusAU(bodies[i], options) + collisionRadiusAU(bodies[j], options);

      if (separation <= contactDistance) {
        consumed.add(bodies[i].id);
        consumed.add(bodies[j].id);
        collisions.push({
          aId: bodies[i].id,
          bId: bodies[j].id,
          distanceAU: separation,
        });
        break;
      }
    }
  }

  return collisions;
}

export function centerOfMass(bodies: CelestialBody[]): Vector3D {
  const totalMass = bodies.reduce((sum, body) => sum + body.massSolar, 0);
  if (totalMass <= 0) return vec();

  return bodies.reduce(
    (center, body) => add(center, scale(body.position, body.massSolar / totalMass)),
    vec(),
  );
}

export function stepParticles(
  particles: SimulationParticle[],
  dtDays: number,
  maxParticles: number,
): SimulationParticle[] {
  return particles
    .map((particle) => ({
      ...particle,
      position: add(particle.position, scale(particle.velocity, dtDays)),
      velocity: scale(particle.velocity, particle.kind === "accretion" ? 0.998 : 0.992),
      lifeDays: particle.lifeDays - dtDays,
    }))
    .filter((particle) => particle.lifeDays > 0)
    .slice(-maxParticles);
}

export function stepShockwaves(shells: ShockwaveShell[], dtDays: number): ShockwaveShell[] {
  return shells
    .map((shell) => ({
      ...shell,
      radiusAU: shell.radiusAU + shell.expansionRateAUPerDay * dtDays,
      opacity: Math.max(0, shell.opacity - dtDays / Math.max(shell.lifeDays, 1)),
      lifeDays: shell.lifeDays - dtDays,
    }))
    .filter((shell) => shell.lifeDays > 0 && shell.opacity > 0.02);
}

export function makeId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${random}-${Math.floor(performance.now() + Math.random() * 1000)}`;
}

export function createCelestialBody(input: BodyInput): CelestialBody {
  const massSolar = kgToSolarMass(input.massKg);
  const luminositySolar =
    input.luminositySolar ??
    (input.type === "star" ? luminosityFromTemperature(input.radiusKm, input.temperatureK) : 0);
  const body: CelestialBody = {
    id: input.id ?? makeId(input.type),
    name: input.name,
    type: input.type,
    massKg: input.massKg,
    massSolar,
    radiusKm: input.radiusKm,
    densityKgM3: computeDensityKgM3(input.massKg, input.radiusKm),
    position: cloneVector(input.position),
    velocity: cloneVector(input.velocity),
    acceleration: vec(),
    temperatureK: input.temperatureK,
    luminositySolar,
    gravitationalInfluenceAU: 0,
    color: input.color,
    trail: [cloneVector(input.position)],
    renderRadiusAU: renderRadiusAU(input.type, input.radiusKm, massSolar),
    primaryId: input.primaryId,
  };

  body.gravitationalInfluenceAU = gravitationalInfluenceAU(body);
  return body;
}
