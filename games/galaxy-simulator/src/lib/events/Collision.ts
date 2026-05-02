import {
  AU_KM,
  CelestialBody,
  CollisionCandidate,
  DEFAULT_PHYSICS_OPTIONS,
  EARTH_MASS_KG,
  PhysicsOptions,
  SimulationParticle,
  add,
  clamp,
  cloneVector,
  computeDensityKgM3,
  createCelestialBody,
  makeId,
  magnitude,
  normalize,
  renderRadiusAU,
  scale,
  solarMassToKg,
  subtract,
  vec,
} from "../physics/NBodyEngine";

export type CollisionResult = {
  bodies: CelestialBody[];
  particles: SimulationParticle[];
  logs: string[];
  selectedId?: string;
};

export function resolveCollisions(
  bodies: CelestialBody[],
  particles: SimulationParticle[],
  collisions: CollisionCandidate[],
  options: PhysicsOptions = DEFAULT_PHYSICS_OPTIONS,
): CollisionResult {
  if (!collisions.length) {
    return { bodies, particles, logs: [] };
  }

  const byId = new Map(bodies.map((body) => [body.id, body]));
  const consumed = new Set<string>();
  const merged: CelestialBody[] = [];
  const debris: SimulationParticle[] = [];
  const logs: string[] = [];
  let selectedId: string | undefined;

  for (const collision of collisions) {
    const a = byId.get(collision.aId);
    const b = byId.get(collision.bId);
    if (!a || !b || consumed.has(a.id) || consumed.has(b.id)) continue;

    const mergedBody = mergeBodies(a, b);
    consumed.add(a.id);
    consumed.add(b.id);
    merged.push(mergedBody);
    selectedId = mergedBody.id;
    debris.push(...createImpactDebris(a, b, mergedBody, options.maxParticles));
    logs.push(`${a.name} merged with ${b.name}; mass and momentum conserved.`);
  }

  return {
    bodies: [...bodies.filter((body) => !consumed.has(body.id)), ...merged].slice(
      0,
      options.maxBodies,
    ),
    particles: [...particles, ...debris].slice(-options.maxParticles),
    logs,
    selectedId,
  };
}

export function mergeBodies(a: CelestialBody, b: CelestialBody): CelestialBody {
  const totalMassSolar = a.massSolar + b.massSolar;
  const totalMassKg = solarMassToKg(totalMassSolar);
  const position = scale(add(scale(a.position, a.massSolar), scale(b.position, b.massSolar)), 1 / totalMassSolar);
  const velocity = scale(add(scale(a.velocity, a.massSolar), scale(b.velocity, b.massSolar)), 1 / totalMassSolar);
  const dominant = a.massSolar >= b.massSolar ? a : b;
  const other = dominant === a ? b : a;
  const type = resolveMergedType(a, b, totalMassKg);
  const radiusKm = resolveMergedRadiusKm(a, b, type, totalMassKg);
  const temperatureK =
    type === "black-hole"
      ? 0
      : (a.temperatureK * a.massSolar + b.temperatureK * b.massSolar) / totalMassSolar;
  const color = resolveMergedColor(type, dominant.color);
  const merged = createCelestialBody({
    id: makeId("merger"),
    name: `${dominant.name} / ${other.name}`,
    type,
    massKg: totalMassKg,
    radiusKm,
    position,
    velocity,
    temperatureK,
    color,
    luminositySolar:
      type === "star"
        ? Math.max(a.luminositySolar + b.luminositySolar, dominant.luminositySolar)
        : 0,
  });

  merged.densityKgM3 = computeDensityKgM3(totalMassKg, radiusKm);
  merged.renderRadiusAU = renderRadiusAU(type, radiusKm, totalMassSolar);
  return merged;
}

export function createImpactDebris(
  a: CelestialBody,
  b: CelestialBody,
  merged: CelestialBody,
  maxParticles: number,
): SimulationParticle[] {
  const relativeVelocity = subtract(a.velocity, b.velocity);
  const speed = magnitude(relativeVelocity);
  const count = Math.min(160, Math.max(28, Math.round(speed * 2200)));
  const normal = normalize(subtract(a.position, b.position));
  const tangent = normalize(vec(-normal.z, normal.y * 0.2, normal.x));

  return Array.from({ length: Math.min(count, maxParticles) }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radial = normalize(add(scale(normal, Math.cos(angle)), scale(tangent, Math.sin(angle))));
    const kick = 0.0008 + Math.random() * 0.009 + speed * 0.16;

    return {
      id: makeId("debris"),
      kind: "debris",
      position: add(merged.position, scale(radial, merged.renderRadiusAU * (1.2 + Math.random()))),
      velocity: add(merged.velocity, scale(radial, kick)),
      color: index % 2 === 0 ? "#f4d6aa" : "#ff7b8d",
      lifeDays: 25 + Math.random() * 90,
      maxLifeDays: 115,
      sizeAU: clamp((a.radiusKm + b.radiusKm) / AU_KM / 3200, 0.002, 0.02),
    };
  });
}

function resolveMergedType(a: CelestialBody, b: CelestialBody, totalMassKg: number): CelestialBody["type"] {
  if (a.type === "black-hole" || b.type === "black-hole") return "black-hole";
  if (totalMassKg > 18 * 1.98847e30) return "black-hole";
  if (a.type === "neutron-star" || b.type === "neutron-star") return "neutron-star";
  if (a.type === "star" || b.type === "star" || totalMassKg > 18 * EARTH_MASS_KG) return "star";
  if (totalMassKg > 0.18 * EARTH_MASS_KG) return "planet";
  if (totalMassKg > 0.004 * EARTH_MASS_KG) return "moon";
  return "asteroid";
}

function resolveMergedRadiusKm(
  a: CelestialBody,
  b: CelestialBody,
  type: CelestialBody["type"],
  totalMassKg: number,
): number {
  if (type === "black-hole") {
    const solarMasses = totalMassKg / 1.98847e30;
    return Math.max(2.95 * solarMasses, 18);
  }

  if (type === "neutron-star") return 14;

  return Math.cbrt(a.radiusKm ** 3 + b.radiusKm ** 3);
}

function resolveMergedColor(type: CelestialBody["type"], fallback: string): string {
  if (type === "black-hole") return "#02030a";
  if (type === "neutron-star") return "#9ffcff";
  if (type === "star") return "#ffe6a8";
  return fallback;
}
