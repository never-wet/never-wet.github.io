import { famousStars, type FamousStar } from "../data/famousStarsData";
import {
  solarSystemObjects,
  solarSystemObjectsById,
  type SpaceObject,
} from "../data/solarSystemData";

export const AU_KM = 149_597_870.7;
export const LIGHT_YEAR_KM = 9_460_730_472_580.8;
export const EARTH_RADIUS_KM = 6371;
export const SUN_RADIUS_KM = 695700;
export const TEXTURE_BASE_PATH = "./textures/";

export type ScaleMode = "compressed" | "real";
export type MeasurementMode = "real" | "visual" | "distance";
export type ExplorableObject = SpaceObject | FamousStar;

export const allExplorableObjects: ExplorableObject[] = [...solarSystemObjects, ...famousStars];

const famousStarsById = new Map(famousStars.map((star) => [star.id, star]));
const J2000_UTC = Date.UTC(2000, 0, 1, 12, 0, 0);

export function getObjectById(id?: string | null): ExplorableObject | undefined {
  if (!id) return undefined;
  return solarSystemObjectsById.get(id) ?? famousStarsById.get(id);
}

export function isSolarObject(object: ExplorableObject | undefined): object is SpaceObject {
  return !!object && object.kind !== "famous-star";
}

export function isFamousStar(object: ExplorableObject | undefined): object is FamousStar {
  return !!object && object.kind === "famous-star";
}

export function getTexturePath(fileName?: string) {
  return fileName ? `${TEXTURE_BASE_PATH}${fileName}` : undefined;
}

export function getSimulationDays(dateIso: string) {
  return (new Date(dateIso).getTime() - J2000_UTC) / 86_400_000;
}

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function getOrbitSceneRadiusAU(au = 0, scaleMode: ScaleMode) {
  if (scaleMode === "real") return au * 26;
  if (au <= 0) return 0;

  return Math.log1p(au) * 33 + au * 1.05 + 2;
}

export function getObjectSceneRadius(object: ExplorableObject, scaleMode: ScaleMode) {
  if (isFamousStar(object)) {
    return clamp(Math.pow(object.radiusSolar, 0.28) * 0.72, 0.34, 6.4);
  }

  if (object.kind === "belt") return 0;

  const earthRatio = object.radiusKm / EARTH_RADIUS_KM;
  if (scaleMode === "real") {
    return Math.max(earthRatio * 0.055, object.kind === "moon" ? 0.018 : 0.028);
  }

  const base = Math.pow(Math.max(earthRatio, 0.02), 0.45) * 0.48;
  if (object.kind === "star") return Math.max(base, 4.8);
  if (object.kind === "moon") return clamp(base, 0.12, 0.42);
  if (object.kind === "dwarf-planet") return clamp(base, 0.18, 0.52);
  return clamp(base, 0.24, 1.95);
}

export function getMoonOrbitSceneRadius(object: SpaceObject, scaleMode: ScaleMode) {
  if (!object.orbitalRadiusKm) return 0;
  const parent = solarSystemObjectsById.get(object.parentId ?? "");
  const parentRadius = parent ? getObjectSceneRadius(parent, scaleMode) : 0;

  if (scaleMode === "real") {
    return object.orbitalRadiusKm * 0.0000086;
  }

  const compactDistance = Math.log1p(object.orbitalRadiusKm / 120_000) * 1.7 + 1.2;
  return parentRadius + compactDistance;
}

export function getSolarObjectScenePosition(
  object: SpaceObject,
  dateIso: string,
  scaleMode: ScaleMode
): [number, number, number] {
  if (object.parentId) {
    const parent = solarSystemObjectsById.get(object.parentId);
    const parentPosition = parent
      ? getSolarObjectScenePosition(parent, dateIso, scaleMode)
      : ([0, 0, 0] as [number, number, number]);
    const radius = getMoonOrbitSceneRadius(object, scaleMode);
    const angle = getOrbitalAngle(object, dateIso);
    const tilt = degreesToRadians(object.orbitalTiltDeg ?? 0);
    return [
      parentPosition[0] + Math.cos(angle) * radius,
      parentPosition[1] + Math.sin(angle) * Math.sin(tilt) * radius,
      parentPosition[2] + Math.sin(angle) * Math.cos(tilt) * radius,
    ];
  }

  if (object.kind === "star") return [0, 0, 0];

  const a = getOrbitSceneRadiusAU(object.semiMajorAxisAU ?? 0, scaleMode);
  if (object.kind === "belt") return [a, 0, 0];

  const e = object.eccentricity ?? 0;
  const b = a * Math.sqrt(Math.max(1 - e * e, 0.02));
  const angle = getOrbitalAngle(object, dateIso);
  const tilt = degreesToRadians(object.orbitalTiltDeg ?? 0);

  return [
    a * (Math.cos(angle) - e),
    Math.sin(angle) * Math.sin(tilt) * b,
    b * Math.sin(angle) * Math.cos(tilt),
  ];
}

export function getObjectScenePosition(
  object: ExplorableObject,
  dateIso: string,
  scaleMode: ScaleMode
): [number, number, number] {
  if (isFamousStar(object)) return getFamousStarScenePosition(object, scaleMode);
  return getSolarObjectScenePosition(object, dateIso, scaleMode);
}

export function getOrbitalAngle(object: SpaceObject, dateIso: string) {
  const days = getSimulationDays(dateIso);
  const period = object.orbitalPeriodDays || 1;
  const direction = period < 0 ? -1 : 1;
  const cycle = (days / Math.abs(period)) * 360 * direction;
  return degreesToRadians((object.initialAngleDeg + cycle) % 360);
}

export function getFamousStarScenePosition(star: FamousStar, scaleMode: ScaleMode): [number, number, number] {
  const angle = degreesToRadians(star.initialAngleDeg);
  const distance = scaleMode === "real" ? 260 + Math.log10(star.distanceLy + 1) * 86 : 220;
  const galleryDepth = scaleMode === "real" ? -700 : -390;
  const y = 56 + Math.sin(angle * 2.7) * 22;
  return [Math.cos(angle) * distance, y, galleryDepth + Math.sin(angle) * distance * 0.36];
}

export function getSolarObjectPhysicalPositionKm(object: SpaceObject, dateIso: string): [number, number, number] {
  if (object.parentId) {
    const parent = solarSystemObjectsById.get(object.parentId);
    const parentPosition = parent
      ? getSolarObjectPhysicalPositionKm(parent, dateIso)
      : ([0, 0, 0] as [number, number, number]);
    const angle = getOrbitalAngle(object, dateIso);
    const radius = object.orbitalRadiusKm ?? 0;
    return [
      parentPosition[0] + Math.cos(angle) * radius,
      parentPosition[1],
      parentPosition[2] + Math.sin(angle) * radius,
    ];
  }

  if (object.kind === "star") return [0, 0, 0];

  const a = (object.semiMajorAxisAU ?? 0) * AU_KM;
  const e = object.eccentricity ?? 0;
  const b = a * Math.sqrt(Math.max(1 - e * e, 0.02));
  const angle = getOrbitalAngle(object, dateIso);
  return [a * (Math.cos(angle) - e), 0, b * Math.sin(angle)];
}

export function getDistanceBetweenObjectsKm(idA: string, idB: string, dateIso: string) {
  const objectA = getObjectById(idA);
  const objectB = getObjectById(idB);
  if (!objectA || !objectB) return undefined;

  if (isFamousStar(objectA) || isFamousStar(objectB)) {
    const starA = isFamousStar(objectA) ? objectA : undefined;
    const starB = isFamousStar(objectB) ? objectB : undefined;

    if (starA && starB) {
      return {
        km: Math.abs(starA.distanceLy - starB.distanceLy) * LIGHT_YEAR_KM,
        basis: "Line-of-sight distance difference from Earth",
      };
    }

    const star = starA ?? starB;
    return {
      km: (star?.distanceLy ?? 0) * LIGHT_YEAR_KM,
      basis: "Distance from Earth to star; solar-system offset is negligible at this scale",
    };
  }

  const pointA = getSolarObjectPhysicalPositionKm(objectA, dateIso);
  const pointB = getSolarObjectPhysicalPositionKm(objectB, dateIso);
  return {
    km: distance3(pointA, pointB),
    basis: "Heliocentric orbital-element approximation",
  };
}

export function getDistanceFromSunKm(object: ExplorableObject, dateIso: string) {
  if (isFamousStar(object)) return object.distanceLy * LIGHT_YEAR_KM;
  if (object.kind === "star") return 0;

  const sunPosition: [number, number, number] = [0, 0, 0];
  return distance3(getSolarObjectPhysicalPositionKm(object, dateIso), sunPosition);
}

export function formatDistance(km?: number) {
  if (km === undefined || Number.isNaN(km)) return "Unknown";
  if (km === 0) return "0 km";
  const ly = km / LIGHT_YEAR_KM;
  if (ly >= 0.1) return `${formatCompact(ly, 3)} ly`;
  const au = km / AU_KM;
  if (au >= 0.08) return `${formatCompact(au, 3)} AU`;
  return `${formatCompact(km, 3)} km`;
}

export function formatRadius(km?: number) {
  if (!km) return "Region";
  return `${formatCompact(km, 4)} km`;
}

export function formatMass(kg?: number) {
  if (!kg) return "Unknown";
  const exponent = Math.floor(Math.log10(Math.abs(kg)));
  const coefficient = kg / 10 ** exponent;
  return `${coefficient.toFixed(2)} x 10^${exponent} kg`;
}

export function formatPeriod(days?: number) {
  if (!days) return "Unknown";
  const absDays = Math.abs(days);
  const sign = days < 0 ? "retrograde " : "";
  if (absDays > 730) return `${sign}${formatCompact(absDays / 365.25, 3)} Earth years`;
  return `${sign}${formatCompact(absDays, 3)} Earth days`;
}

export function formatRotation(hours?: number) {
  if (!hours) return "Unknown";
  const absHours = Math.abs(hours);
  const sign = hours < 0 ? "retrograde " : "";
  if (absHours >= 48) return `${sign}${formatCompact(absHours / 24, 3)} Earth days`;
  return `${sign}${formatCompact(absHours, 3)} hours`;
}

export function formatTemperature(celsius?: number) {
  return celsius === undefined ? "Unknown" : `${formatCompact(celsius, 3)} deg C`;
}

export function formatGravity(gravity?: number) {
  return gravity === undefined ? "Unknown" : `${formatCompact(gravity, 3)} m/s^2`;
}

export function formatCompact(value: number, significantDigits = 3) {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: significantDigits,
  }).format(value);
}

export function getSizeComparison(object: ExplorableObject) {
  if (isFamousStar(object)) {
    return {
      earth: object.radiusSolar * (SUN_RADIUS_KM / EARTH_RADIUS_KM),
      sun: object.radiusSolar,
    };
  }

  if (object.kind === "belt") return undefined;

  return {
    earth: object.radiusKm / EARTH_RADIUS_KM,
    sun: object.radiusKm / SUN_RADIUS_KM,
  };
}

export function getKindLabel(object: ExplorableObject) {
  if (isFamousStar(object)) return "Famous star";
  if (object.kind === "dwarf-planet") return "Dwarf planet";
  return object.kind[0].toUpperCase() + object.kind.slice(1);
}

function distance3(a: [number, number, number], b: [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
