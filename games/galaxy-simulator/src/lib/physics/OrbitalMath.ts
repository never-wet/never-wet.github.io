import {
  AU_KM,
  AU_PER_DAY_TO_KM_PER_S,
  DAY_SECONDS,
  EARTH_MASS_KG,
  G_AU3_SOLAR_MASS_DAY2,
  SOLAR_MASS_KG,
  add,
  distance,
  dot,
  magnitude,
  normalize,
  scale,
  subtract,
  vec,
} from "./NBodyEngine";
import type { CelestialBody, Vector3D } from "./NBodyEngine";

export type OrbitalElements = {
  primary?: CelestialBody;
  distanceAU: number;
  relativeSpeedKmS: number;
  orbitalSpeedKmS: number;
  semiMajorAxisAU: number | null;
  periapsisAU: number | null;
  apoapsisAU: number | null;
  eccentricity: number | null;
  orbitalPeriodDays: number | null;
  isBound: boolean;
};

export function findPrimary(
  body: CelestialBody,
  bodies: CelestialBody[],
): CelestialBody | undefined {
  return bodies
    .filter((candidate) => candidate.id !== body.id)
    .sort((a, b) => {
      const scoreA = a.massSolar / Math.max(distance(body.position, a.position) ** 2, 0.000001);
      const scoreB = b.massSolar / Math.max(distance(body.position, b.position) ** 2, 0.000001);
      return scoreB - scoreA;
    })[0];
}

export function computeOrbitalElements(
  body: CelestialBody,
  bodies: CelestialBody[],
  gravitationalConstant = G_AU3_SOLAR_MASS_DAY2,
): OrbitalElements {
  const primary = findPrimary(body, bodies);

  if (!primary) {
    return emptyElements();
  }

  const relativePosition = subtract(body.position, primary.position);
  const relativeVelocity = subtract(body.velocity, primary.velocity);
  const radius = magnitude(relativePosition);
  const speed = magnitude(relativeVelocity);
  const mu = gravitationalConstant * (body.massSolar + primary.massSolar);
  const specificEnergy = speed ** 2 / 2 - mu / Math.max(radius, 0.000001);
  const h = cross(relativePosition, relativeVelocity);
  const hMagnitude = magnitude(h);
  const eccentricityVector = subtract(
    scale(cross(relativeVelocity, h), 1 / Math.max(mu, 1e-12)),
    scale(relativePosition, 1 / Math.max(radius, 1e-12)),
  );
  const eccentricity = magnitude(eccentricityVector);
  const isBound = specificEnergy < 0 && eccentricity < 1.25;
  const semiMajorAxis = isBound ? -mu / (2 * specificEnergy) : null;
  const periapsis = semiMajorAxis ? semiMajorAxis * (1 - eccentricity) : null;
  const apoapsis =
    semiMajorAxis && eccentricity < 1 ? semiMajorAxis * (1 + eccentricity) : null;
  const period =
    semiMajorAxis && isBound
      ? 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / Math.max(mu, 1e-12))
      : null;
  const orbitalSpeed = Math.sqrt(mu / Math.max(radius, 0.000001));

  return {
    primary,
    distanceAU: radius,
    relativeSpeedKmS: speed * AU_PER_DAY_TO_KM_PER_S,
    orbitalSpeedKmS: orbitalSpeed * AU_PER_DAY_TO_KM_PER_S,
    semiMajorAxisAU: semiMajorAxis,
    periapsisAU: periapsis,
    apoapsisAU: apoapsis,
    eccentricity,
    orbitalPeriodDays: period,
    isBound,
  };
}

export function formatMass(massKg: number): string {
  const solar = massKg / SOLAR_MASS_KG;
  const earth = massKg / EARTH_MASS_KG;

  if (solar >= 0.01) return `${solar.toFixed(3)} Msol`;
  if (earth >= 0.1) return `${earth.toFixed(2)} Mearth`;
  return `${massKg.toExponential(2)} kg`;
}

export function formatRadius(radiusKm: number): string {
  if (radiusKm >= 1_000_000) return `${(radiusKm / 1_000_000).toFixed(2)}M km`;
  return `${Math.round(radiusKm).toLocaleString()} km`;
}

export function formatDistanceAU(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "unknown";
  if (value < 0.01) return `${(value * AU_KM).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
  return `${value.toFixed(3)} AU`;
}

export function formatSpeedKmS(value: number): string {
  return `${value.toFixed(2)} km/s`;
}

export function formatDurationDays(days: number | null | undefined): string {
  if (days == null || !Number.isFinite(days)) return "unknown";
  if (days < 2) return `${(days * 24).toFixed(1)} hours`;
  if (days < 900) return `${days.toFixed(1)} days`;
  return `${(days / 365.25).toFixed(2)} years`;
}

export function formatSimDate(days: number): string {
  const start = new Date(Date.UTC(2040, 0, 1));
  start.setUTCDate(start.getUTCDate() + Math.floor(days));
  const date = start.toISOString().slice(0, 10);
  return `${date} +${days.toFixed(1)} d`;
}

export function vectorToString(vector: Vector3D): string {
  return `${vector.x.toFixed(3)}, ${vector.y.toFixed(3)}, ${vector.z.toFixed(3)} AU`;
}

function emptyElements(): OrbitalElements {
  return {
    distanceAU: 0,
    relativeSpeedKmS: 0,
    orbitalSpeedKmS: 0,
    semiMajorAxisAU: null,
    periapsisAU: null,
    apoapsisAU: null,
    eccentricity: null,
    orbitalPeriodDays: null,
    isBound: false,
  };
}

export { add, cross, distance, dot, magnitude, normalize, scale, subtract, vec };

function cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
