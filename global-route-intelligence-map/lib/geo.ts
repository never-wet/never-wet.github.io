import type { Coordinate, RouteRecord } from "@/types";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function haversineDistance(a: Coordinate, b: Coordinate) {
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const dLat = toRadians(b[1] - a[1]);
  const dLng = toRadians(b[0] - a[0]);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

export function getRouteCenter(route: RouteRecord): Coordinate {
  if (route.type === "flight" || route.type === "aviation") {
    return interpolateGreatCircle(route.coordinates[0], route.coordinates[route.coordinates.length - 1], 0.5);
  }

  const lng = route.coordinates.reduce((sum, point) => sum + point[0], 0) / route.coordinates.length;
  const lat = route.coordinates.reduce((sum, point) => sum + point[1], 0) / route.coordinates.length;
  return [lng, lat];
}

export function interpolateGreatCircle(start: Coordinate, end: Coordinate, t: number): Coordinate {
  const lng1 = toRadians(start[0]);
  const lat1 = toRadians(start[1]);
  const lng2 = toRadians(end[0]);
  const lat2 = toRadians(end[1]);

  const delta = 2 * Math.asin(
    Math.sqrt(
      Math.sin((lat2 - lat1) / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
    )
  );

  if (delta === 0) return start;

  const a = Math.sin((1 - t) * delta) / Math.sin(delta);
  const b = Math.sin(t * delta) / Math.sin(delta);
  const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
  const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = Math.atan2(y, x);

  return [toDegrees(lng), toDegrees(lat)];
}

export function interpolatePolyline(points: Coordinate[], t: number): Coordinate {
  if (points.length <= 1) return points[0] ?? [0, 0];

  const segments = points.slice(1).map((point, index) => ({
    start: points[index],
    end: point,
    distance: haversineDistance(points[index], point)
  }));
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
  let target = totalDistance * t;

  for (const segment of segments) {
    if (target <= segment.distance) {
      const localT = segment.distance === 0 ? 0 : target / segment.distance;
      let lngDelta = segment.end[0] - segment.start[0];
      if (Math.abs(lngDelta) > 180) {
        lngDelta -= Math.sign(lngDelta) * 360;
      }
      let lng = segment.start[0] + lngDelta * localT;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
      return [
        lng,
        segment.start[1] + (segment.end[1] - segment.start[1]) * localT
      ];
    }
    target -= segment.distance;
  }

  return points[points.length - 1];
}
