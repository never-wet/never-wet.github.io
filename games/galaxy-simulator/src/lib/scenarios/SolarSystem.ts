import {
  EARTH_MASS_KG,
  EARTH_RADIUS_KM,
  G_AU3_SOLAR_MASS_DAY2,
  JUPITER_MASS_KG,
  SOLAR_MASS_KG,
  SOLAR_RADIUS_KM,
  CelestialBody,
  createCelestialBody,
  vec,
} from "../physics/NBodyEngine";
import { createGalaxyCollisionScenario } from "./GalaxyCollision";

export type ScenarioId =
  | "solar-system"
  | "binary-stars"
  | "black-hole-capture"
  | "supernova-event"
  | "galaxy-collision"
  | "custom-sandbox";

export type ScenarioPreset = {
  id: ScenarioId;
  name: string;
  description: string;
  bodies: CelestialBody[];
  selectedId?: string;
};

export const SCENARIO_OPTIONS: Array<{ id: ScenarioId; name: string }> = [
  { id: "solar-system", name: "Solar System" },
  { id: "binary-stars", name: "Binary Star System" },
  { id: "black-hole-capture", name: "Black Hole Capture" },
  { id: "supernova-event", name: "Supernova Event" },
  { id: "galaxy-collision", name: "Galaxy Collision" },
  { id: "custom-sandbox", name: "Custom Sandbox" },
];

export function createScenario(id: ScenarioId): ScenarioPreset {
  if (id === "binary-stars") return createBinaryStarScenario();
  if (id === "black-hole-capture") return createBlackHoleCaptureScenario();
  if (id === "supernova-event") return createSupernovaScenario();
  if (id === "galaxy-collision") return createGalaxyCollisionScenario();
  if (id === "custom-sandbox") return createCustomSandboxScenario();
  return createSolarSystemScenario();
}

export function createSolarSystemScenario(): ScenarioPreset {
  const sun = createCelestialBody({
    id: "sun",
    name: "Sun",
    type: "star",
    massKg: SOLAR_MASS_KG,
    radiusKm: SOLAR_RADIUS_KM,
    position: vec(0, 0, 0),
    velocity: vec(0, 0, 0),
    temperatureK: 5778,
    color: "#fff1a8",
    luminositySolar: 1,
  });
  const planets = [
    planet("mercury", "Mercury", 0.0553, 2439.7, 0.387, "#b7a58a", 440),
    planet("venus", "Venus", 0.815, 6051.8, 0.723, "#d8b37a", 737),
    planet("earth", "Earth", 1, EARTH_RADIUS_KM, 1, "#61a9ff", 288),
    planet("mars", "Mars", 0.107, 3389.5, 1.524, "#d77855", 210),
    planet("jupiter", "Jupiter", JUPITER_MASS_KG / EARTH_MASS_KG, 69911, 5.204, "#d7b08a", 165),
    planet("saturn", "Saturn", 95.16, 58232, 9.582, "#e5d19d", 134),
  ];
  const earth = planets.find((body) => body.id === "earth")!;
  const moon = createOrbitingBody({
    id: "moon",
    name: "Moon",
    type: "moon",
    massKg: 0.0123 * EARTH_MASS_KG,
    radiusKm: 1737.4,
    parent: earth,
    distanceAU: 0.00257,
    phase: 1.2,
    temperatureK: 220,
    color: "#dce5f2",
  });
  const bodies = [sun, ...planets, moon];

  return {
    id: "solar-system",
    name: "Solar System",
    description: "Scaled Sun, inner planets, Moon, Jupiter, and Saturn using AU/day orbital units.",
    bodies,
    selectedId: "earth",
  };
}

function planet(
  id: string,
  name: string,
  massEarth: number,
  radiusKm: number,
  distanceAU: number,
  color: string,
  temperatureK: number,
): CelestialBody {
  return createOrbitingBody({
    id,
    name,
    type: "planet",
    massKg: massEarth * EARTH_MASS_KG,
    radiusKm,
    parentMassSolar: 1,
    parentPosition: vec(0, 0, 0),
    parentVelocity: vec(0, 0, 0),
    distanceAU,
    phase: phaseFromId(id),
    temperatureK,
    color,
    primaryId: "sun",
  });
}

function createOrbitingBody({
  id,
  name,
  type,
  massKg,
  radiusKm,
  parent,
  parentMassSolar,
  parentPosition,
  parentVelocity,
  distanceAU,
  phase,
  temperatureK,
  color,
  primaryId,
}: {
  id: string;
  name: string;
  type: CelestialBody["type"];
  massKg: number;
  radiusKm: number;
  parent?: CelestialBody;
  parentMassSolar?: number;
  parentPosition?: ReturnType<typeof vec>;
  parentVelocity?: ReturnType<typeof vec>;
  distanceAU: number;
  phase: number;
  temperatureK: number;
  color: string;
  primaryId?: string;
}): CelestialBody {
  const sourcePosition = parent?.position ?? parentPosition ?? vec();
  const sourceVelocity = parent?.velocity ?? parentVelocity ?? vec();
  const sourceMassSolar = parent?.massSolar ?? parentMassSolar ?? 1;
  const position = vec(
    sourcePosition.x + Math.cos(phase) * distanceAU,
    Math.sin(phase * 1.7) * distanceAU * 0.012,
    sourcePosition.z + Math.sin(phase) * distanceAU,
  );
  const speed = Math.sqrt((G_AU3_SOLAR_MASS_DAY2 * sourceMassSolar) / distanceAU);
  const velocity = vec(
    sourceVelocity.x - Math.sin(phase) * speed,
    sourceVelocity.y,
    sourceVelocity.z + Math.cos(phase) * speed,
  );

  return createCelestialBody({
    id,
    name,
    type,
    massKg,
    radiusKm,
    position,
    velocity,
    temperatureK,
    color,
    primaryId: primaryId ?? parent?.id,
  });
}

function createBinaryStarScenario(): ScenarioPreset {
  const massA = 1.15 * SOLAR_MASS_KG;
  const massB = 0.82 * SOLAR_MASS_KG;
  const separation = 1.8;
  const speed = Math.sqrt((G_AU3_SOLAR_MASS_DAY2 * ((massA + massB) / SOLAR_MASS_KG)) / separation);
  const starA = createCelestialBody({
    id: "binary-a",
    name: "Kepler A",
    type: "star",
    massKg: massA,
    radiusKm: SOLAR_RADIUS_KM * 1.12,
    position: vec(-0.72, 0, 0),
    velocity: vec(0, 0, -speed * 0.42),
    temperatureK: 6100,
    color: "#fff0b3",
  });
  const starB = createCelestialBody({
    id: "binary-b",
    name: "Kepler B",
    type: "star",
    massKg: massB,
    radiusKm: SOLAR_RADIUS_KM * 0.78,
    position: vec(1.08, 0, 0),
    velocity: vec(0, 0, speed * 0.58),
    temperatureK: 4700,
    color: "#ffb36f",
  });
  const planetBody = createOrbitingBody({
    id: "circumbinary-planet",
    name: "Tatooine Candidate",
    type: "planet",
    massKg: 2.4 * EARTH_MASS_KG,
    radiusKm: 9500,
    parentMassSolar: (massA + massB) / SOLAR_MASS_KG,
    parentPosition: vec(0, 0, 0),
    parentVelocity: vec(0, 0, 0),
    distanceAU: 4.8,
    phase: 2.4,
    temperatureK: 255,
    color: "#65d4c7",
  });

  return {
    id: "binary-stars",
    name: "Binary Star System",
    description: "Two stars orbit a shared barycenter with a circumbinary planet.",
    bodies: [starA, starB, planetBody],
    selectedId: "circumbinary-planet",
  };
}

function createBlackHoleCaptureScenario(): ScenarioPreset {
  const blackHole = createCelestialBody({
    id: "capture-black-hole",
    name: "Cygnus-Analog X1",
    type: "black-hole",
    massKg: 14.8 * SOLAR_MASS_KG,
    radiusKm: 44,
    position: vec(0, 0, 0),
    velocity: vec(0, 0, 0),
    temperatureK: 0,
    color: "#02030a",
  });
  const star = createCelestialBody({
    id: "capture-star",
    name: "Captured Subgiant",
    type: "star",
    massKg: 1.8 * SOLAR_MASS_KG,
    radiusKm: SOLAR_RADIUS_KM * 2.4,
    position: vec(-9, 0.12, -2.5),
    velocity: vec(0.018, 0, 0.012),
    temperatureK: 6900,
    color: "#ddecff",
  });
  const planetBody = createCelestialBody({
    id: "capture-planet",
    name: "Falling Planet",
    type: "planet",
    massKg: 0.7 * EARTH_MASS_KG,
    radiusKm: 5600,
    position: vec(-4.8, -0.03, 1.3),
    velocity: vec(0.022, 0, -0.006),
    temperatureK: 390,
    color: "#c48460",
  });

  return {
    id: "black-hole-capture",
    name: "Black Hole Capture",
    description: "A star and planet pass near a compact black hole with capture and tidal risk.",
    bodies: [blackHole, star, planetBody],
    selectedId: "capture-planet",
  };
}

function createSupernovaScenario(): ScenarioPreset {
  const massiveStar = createCelestialBody({
    id: "supernova-star",
    name: "Betelgeuse Lab Star",
    type: "star",
    massKg: 21 * SOLAR_MASS_KG,
    radiusKm: SOLAR_RADIUS_KM * 9,
    position: vec(0, 0, 0),
    velocity: vec(0, 0, 0),
    temperatureK: 3500,
    color: "#ff8a5a",
    luminositySolar: 80000,
  });
  const observerPlanet = createOrbitingBody({
    id: "supernova-observer",
    name: "Outer Observer",
    type: "planet",
    massKg: 3 * EARTH_MASS_KG,
    radiusKm: 11000,
    parent: massiveStar,
    distanceAU: 18,
    phase: 1.1,
    temperatureK: 140,
    color: "#77c6ff",
  });
  const dust = Array.from({ length: 18 }, (_, index) =>
    createOrbitingBody({
      id: `pre-sn-dust-${index}`,
      name: `Pre-SN Dust ${index + 1}`,
      type: "asteroid",
      massKg: EARTH_MASS_KG * 0.00001,
      radiusKm: 42 + index,
      parent: massiveStar,
      distanceAU: 8 + (index % 6) * 1.2,
      phase: index * 0.7,
      temperatureK: 120,
      color: "#b99778",
    }),
  );

  return {
    id: "supernova-event",
    name: "Supernova Event",
    description: "A massive star is ready for collapse; trigger supernova from the event panel.",
    bodies: [massiveStar, observerPlanet, ...dust],
    selectedId: "supernova-star",
  };
}

function createCustomSandboxScenario(): ScenarioPreset {
  return {
    id: "custom-sandbox",
    name: "Custom Sandbox",
    description: "Empty simulation space for manual body creation.",
    bodies: [],
  };
}

function phaseFromId(id: string): number {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.037;
}
