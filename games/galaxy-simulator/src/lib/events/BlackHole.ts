import {
  CelestialBody,
  PhysicsOptions,
  SimulationParticle,
  add,
  clamp,
  createCelestialBody,
  distance,
  makeId,
  normalize,
  scale,
  subtract,
  vec,
} from "../physics/NBodyEngine";

export type BlackHoleResult = {
  bodies: CelestialBody[];
  particles: SimulationParticle[];
  selectedId?: string;
  log: string;
};

export function convertToBlackHole(
  bodies: CelestialBody[],
  particles: SimulationParticle[],
  selectedId: string | undefined,
  options: PhysicsOptions,
): BlackHoleResult {
  const selected = bodies.find((body) => body.id === selectedId);

  if (!selected) {
    const blackHole = createCelestialBody({
      name: "Artificial Kerr Well",
      type: "black-hole",
      massKg: 9 * 1.98847e30,
      radiusKm: 27,
      position: vec(0, 0, 0),
      velocity: vec(0, 0, 0),
      temperatureK: 0,
      color: "#02030a",
    });

    return {
      bodies: [...bodies, blackHole].slice(0, options.maxBodies),
      particles: [...particles, ...createAccretionParticles(blackHole)].slice(-options.maxParticles),
      selectedId: blackHole.id,
      log: "Spawned a 9 solar mass black hole at the barycenter.",
    };
  }

  const massKg = Math.max(selected.massKg * 3.4, 3 * 1.98847e30);
  const blackHole = createCelestialBody({
    id: selected.id,
    name: `${selected.name} Event Horizon`,
    type: "black-hole",
    massKg,
    radiusKm: Math.max(2.95 * (massKg / 1.98847e30), 18),
    position: selected.position,
    velocity: selected.velocity,
    temperatureK: 0,
    color: "#02030a",
  });

  return {
    bodies: bodies.map((body) => (body.id === selected.id ? blackHole : body)),
    particles: [...particles, ...createAccretionParticles(blackHole)].slice(-options.maxParticles),
    selectedId: blackHole.id,
    log: `${selected.name} collapsed into a black hole.`,
  };
}

export function applyBlackHoleTidalEffects(
  bodies: CelestialBody[],
  particles: SimulationParticle[],
  options: PhysicsOptions,
): { bodies: CelestialBody[]; particles: SimulationParticle[]; logs: string[] } {
  const blackHoles = bodies.filter((body) => body.type === "black-hole");
  if (!blackHoles.length) return { bodies, particles, logs: [] };

  const nextBodies = bodies.map((body) => ({ ...body }));
  const nextParticles: SimulationParticle[] = [...particles];
  const logs: string[] = [];

  for (const blackHole of blackHoles) {
    for (const body of nextBodies) {
      if (body.id === blackHole.id || body.type === "black-hole") continue;

      const separation = distance(blackHole.position, body.position);
      const disruptionRadius = blackHole.renderRadiusAU * 36 + body.renderRadiusAU * 8;

      if (separation < disruptionRadius && body.massSolar < blackHole.massSolar * 0.02) {
        const inward = normalize(subtract(blackHole.position, body.position));
        const proximity = clamp(1 - separation / Math.max(disruptionRadius, 0.0001), 0, 1);
        body.velocity = add(body.velocity, scale(inward, 0.0009 * proximity));

        if (Math.random() < 0.04) {
          nextParticles.push(...createTidalParticles(body, blackHole, proximity));
          logs.push(`${body.name} is undergoing tidal disruption near ${blackHole.name}.`);
        }
      }
    }
  }

  return {
    bodies: nextBodies,
    particles: nextParticles.slice(-options.maxParticles),
    logs: logs.slice(0, 2),
  };
}

export function createAccretionParticles(blackHole: CelestialBody): SimulationParticle[] {
  return Array.from({ length: 180 }, (_, index) => {
    const angle = (index / 180) * Math.PI * 2;
    const radius = blackHole.renderRadiusAU * (8 + Math.random() * 18);
    const position = add(
      blackHole.position,
      vec(Math.cos(angle) * radius, (Math.random() - 0.5) * blackHole.renderRadiusAU, Math.sin(angle) * radius),
    );
    const tangent = normalize(vec(-Math.sin(angle), (Math.random() - 0.5) * 0.08, Math.cos(angle)));

    return {
      id: makeId("accretion"),
      kind: "accretion",
      position,
      velocity: add(blackHole.velocity, scale(tangent, 0.012 + Math.random() * 0.014)),
      color: index % 2 === 0 ? "#ffb35a" : "#8ffcff",
      lifeDays: 120 + Math.random() * 180,
      maxLifeDays: 300,
      sizeAU: 0.005 + Math.random() * 0.014,
    };
  });
}

function createTidalParticles(
  body: CelestialBody,
  blackHole: CelestialBody,
  proximity: number,
): SimulationParticle[] {
  const toward = normalize(subtract(blackHole.position, body.position));
  const tangent = normalize(vec(-toward.z, 0, toward.x));

  return Array.from({ length: 16 }, () => {
    const mixedDirection = normalize(add(scale(toward, 0.45 + proximity), scale(tangent, Math.random() - 0.5)));

    return {
      id: makeId("tidal"),
      kind: "debris",
      position: add(body.position, scale(mixedDirection, body.renderRadiusAU)),
      velocity: add(body.velocity, scale(mixedDirection, 0.004 + proximity * 0.008)),
      color: "#f4d6aa",
      lifeDays: 40 + Math.random() * 80,
      maxLifeDays: 120,
      sizeAU: 0.003 + Math.random() * 0.008,
    };
  });
}
