import {
  CelestialBody,
  SOLAR_MASS_KG,
  createCelestialBody,
  vec,
} from "../physics/NBodyEngine";
import type { ScenarioPreset } from "./SolarSystem";

export function createGalaxyCollisionScenario(): ScenarioPreset {
  const bodies: CelestialBody[] = [];
  const countPerCluster = 42;

  bodies.push(...createCluster("andromeda-lab", vec(-18, 0, -5), vec(0.012, 0, 0.004), countPerCluster, "#dcebff"));
  bodies.push(...createCluster("milky-lab", vec(18, 0, 5), vec(-0.012, 0, -0.004), countPerCluster, "#ffe8b8"));

  return {
    id: "galaxy-collision",
    name: "Galaxy Collision",
    description: "Two simplified star clusters pass through each other and form tidal tail structures.",
    bodies,
    selectedId: bodies[0]?.id,
  };
}

function createCluster(
  prefix: string,
  center: ReturnType<typeof vec>,
  drift: ReturnType<typeof vec>,
  count: number,
  tint: string,
): CelestialBody[] {
  const bodies: CelestialBody[] = [];
  const core = createCelestialBody({
    id: `${prefix}-core`,
    name: `${prefix} core`,
    type: "black-hole",
    massKg: 4.2e6 * SOLAR_MASS_KG,
    radiusKm: 12_000_000,
    position: center,
    velocity: drift,
    temperatureK: 0,
    color: "#05060c",
  });

  bodies.push(core);

  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.399963 + (prefix.length % 5);
    const radius = 1.2 + Math.sqrt(index + 1) * 0.72;
    const y = Math.sin(index * 0.71) * 0.28;
    const orbitalSpeed = 0.004 + 0.018 / Math.sqrt(radius);
    const position = vec(
      center.x + Math.cos(angle) * radius,
      center.y + y,
      center.z + Math.sin(angle) * radius,
    );
    const velocity = vec(
      drift.x - Math.sin(angle) * orbitalSpeed,
      drift.y,
      drift.z + Math.cos(angle) * orbitalSpeed,
    );

    bodies.push(
      createCelestialBody({
        id: `${prefix}-star-${index}`,
        name: `${prefix} star ${index + 1}`,
        type: "star",
        massKg: (0.3 + (index % 8) * 0.12) * SOLAR_MASS_KG,
        radiusKm: 390000 + (index % 6) * 41000,
        position,
        velocity,
        temperatureK: 3200 + (index % 7) * 520,
        color: index % 4 === 0 ? "#9ffcff" : tint,
      }),
    );
  }

  return bodies;
}
