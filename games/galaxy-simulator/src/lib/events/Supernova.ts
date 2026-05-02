import {
  CelestialBody,
  PhysicsOptions,
  ShockwaveShell,
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

export type SupernovaResult = {
  bodies: CelestialBody[];
  particles: SimulationParticle[];
  shells: ShockwaveShell[];
  selectedId?: string;
  log: string;
};

export function triggerSupernova(
  bodies: CelestialBody[],
  particles: SimulationParticle[],
  shells: ShockwaveShell[],
  sourceId: string | undefined,
  options: PhysicsOptions,
): SupernovaResult {
  const source = bodies.find((body) => body.id === sourceId && body.type === "star");

  if (!source) {
    return {
      bodies,
      particles,
      shells,
      selectedId: sourceId,
      log: "Supernova requires a selected star.",
    };
  }

  const remnantType = source.massSolar > 18 ? "black-hole" : "neutron-star";
  const remnantMassKg =
    remnantType === "black-hole" ? source.massKg * 0.56 : Math.max(source.massKg * 0.18, 1.4 * 1.98847e30);
  const remnant = createCelestialBody({
    id: source.id,
    name: remnantType === "black-hole" ? `${source.name} Remnant BH` : `${source.name} Pulsar Remnant`,
    type: remnantType,
    massKg: remnantMassKg,
    radiusKm: remnantType === "black-hole" ? Math.max(2.95 * (remnantMassKg / 1.98847e30), 24) : 14,
    position: source.position,
    velocity: source.velocity,
    temperatureK: remnantType === "black-hole" ? 0 : 900000,
    color: remnantType === "black-hole" ? "#02030a" : "#9ffcff",
  });
  const blastRadiusAU = clamp(Math.sqrt(source.massSolar) * 7.5, 4, 42);
  const nextBodies = bodies.map((body) => {
    if (body.id === source.id) return remnant;

    const separation = distance(source.position, body.position);
    if (separation > blastRadiusAU) return body;

    const direction = normalize(subtract(body.position, source.position));
    const proximity = clamp(1 - separation / blastRadiusAU, 0, 1);
    const impulseAUPerDay =
      (0.012 * source.massSolar ** 0.42 * proximity ** 1.5) / Math.max(body.massSolar ** 0.25, 0.02);

    return {
      ...body,
      velocity: add(body.velocity, scale(direction, impulseAUPerDay)),
    };
  });

  return {
    bodies: nextBodies,
    particles: [...particles, ...createEjecta(source, blastRadiusAU)].slice(-options.maxParticles),
    shells: [
      ...shells,
      {
        id: makeId("shockwave"),
        center: { ...source.position },
        radiusAU: source.renderRadiusAU * 2,
        expansionRateAUPerDay: blastRadiusAU / 180,
        color: "#ff9ab3",
        opacity: 0.72,
        lifeDays: 220,
      },
    ],
    selectedId: source.id,
    log: `${source.name} exploded; remnant formed as ${remnantType}. Shockwave impulse applied within ${blastRadiusAU.toFixed(1)} AU.`,
  };
}

function createEjecta(source: CelestialBody, blastRadiusAU: number): SimulationParticle[] {
  return Array.from({ length: 420 }, (_, index) => {
    const direction = randomSphereDirection();
    const speed = 0.018 + Math.random() * 0.11 + blastRadiusAU / 9000;

    return {
      id: makeId("ejecta"),
      kind: index % 3 === 0 ? "plasma" : "ejecta",
      position: add(source.position, scale(direction, source.renderRadiusAU * (1 + Math.random()))),
      velocity: add(source.velocity, scale(direction, speed)),
      color: index % 4 === 0 ? "#fff2b4" : index % 4 === 1 ? "#ff6f8b" : index % 4 === 2 ? "#b292ff" : "#8ffcff",
      lifeDays: 60 + Math.random() * 220,
      maxLifeDays: 280,
      sizeAU: 0.006 + Math.random() * 0.022,
    };
  });
}

function randomSphereDirection() {
  const theta = Math.random() * Math.PI * 2;
  const u = Math.random() * 2 - 1;
  const r = Math.sqrt(1 - u * u);
  return vec(r * Math.cos(theta), u, r * Math.sin(theta));
}
