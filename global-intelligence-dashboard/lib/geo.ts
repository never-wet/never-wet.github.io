import type { IntelRegion } from "@/types";

export const REGION_CENTERS: Record<IntelRegion, { lat: number; lon: number; label: string }> = {
  Global: { lat: 18, lon: 12, label: "Global operating picture" },
  Asia: { lat: 31, lon: 101, label: "Asia" },
  Europe: { lat: 51, lon: 13, label: "Europe" },
  "United States": { lat: 39, lon: -98, label: "United States" },
  "Middle East": { lat: 29, lon: 43, label: "Middle East" },
  Africa: { lat: 2, lon: 20, label: "Africa" },
  Americas: { lat: -12, lon: -62, label: "Americas" },
  Oceania: { lat: -25, lon: 133, label: "Oceania" }
};

export const REGION_BOUNDS: Partial<Record<IntelRegion, [[number, number], [number, number]]>> = {
  Asia: [[-10, 57], [54, 150]],
  Europe: [[35, -12], [72, 42]],
  "United States": [[24, -125], [50, -66]],
  "Middle East": [[12, 25], [42, 64]],
  Africa: [[-35, -20], [37, 55]],
  Americas: [[-56, -170], [72, -30]],
  Oceania: [[-50, 110], [-5, 180]]
};

const KNOWN_LOCATIONS: Array<{
  region: IntelRegion;
  lat: number;
  lon: number;
  aliases: string[];
}> = [
  { region: "United States", lat: 38.9, lon: -77.03, aliases: ["united states", "u.s.", "usa", "washington", "trump", "white house", "congress"] },
  { region: "United States", lat: 40.71, lon: -74.0, aliases: ["new york", "wall street", "federal reserve"] },
  { region: "United States", lat: 34.05, lon: -118.24, aliases: ["california", "los angeles"] },
  { region: "Europe", lat: 50.45, lon: 30.52, aliases: ["ukraine", "kyiv", "kiev"] },
  { region: "Europe", lat: 55.75, lon: 37.61, aliases: ["russia", "moscow", "kremlin"] },
  { region: "Europe", lat: 52.52, lon: 13.4, aliases: ["germany", "berlin", "merz"] },
  { region: "Europe", lat: 48.85, lon: 2.35, aliases: ["france", "paris"] },
  { region: "Europe", lat: 51.5, lon: -0.12, aliases: ["britain", "uk ", "u.k.", "london", "downing street"] },
  { region: "Europe", lat: 50.85, lon: 4.35, aliases: ["european union", "eu ", "brussels", "eurozone", "ecb"] },
  { region: "Middle East", lat: 32.08, lon: 34.78, aliases: ["israel", "tel aviv", "jerusalem"] },
  { region: "Middle East", lat: 31.5, lon: 34.46, aliases: ["gaza", "rafah", "hamas"] },
  { region: "Middle East", lat: 35.69, lon: 51.39, aliases: ["iran", "tehran", "hormuz"] },
  { region: "Middle East", lat: 33.31, lon: 44.36, aliases: ["iraq", "baghdad"] },
  { region: "Middle East", lat: 24.71, lon: 46.67, aliases: ["saudi", "riyadh"] },
  { region: "Middle East", lat: 25.28, lon: 51.52, aliases: ["qatar", "doha"] },
  { region: "Asia", lat: 39.9, lon: 116.4, aliases: ["china", "beijing", "xi jinping"] },
  { region: "Asia", lat: 25.03, lon: 121.56, aliases: ["taiwan", "taipei"] },
  { region: "Asia", lat: 35.68, lon: 139.76, aliases: ["japan", "tokyo"] },
  { region: "Asia", lat: 37.56, lon: 126.97, aliases: ["south korea", "seoul"] },
  { region: "Asia", lat: 39.03, lon: 125.75, aliases: ["north korea", "pyongyang"] },
  { region: "Asia", lat: 28.61, lon: 77.2, aliases: ["india", "new delhi"] },
  { region: "Asia", lat: 33.69, lon: 73.05, aliases: ["pakistan", "islamabad"] },
  { region: "Asia", lat: 34.55, lon: 69.2, aliases: ["afghanistan", "kabul"] },
  { region: "Asia", lat: -6.2, lon: 106.84, aliases: ["indonesia", "jakarta"] },
  { region: "Asia", lat: 14.59, lon: 120.98, aliases: ["philippines", "manila"] },
  { region: "Africa", lat: 30.04, lon: 31.24, aliases: ["egypt", "cairo"] },
  { region: "Africa", lat: 15.5, lon: 32.56, aliases: ["sudan", "khartoum"] },
  { region: "Africa", lat: 9.03, lon: 38.74, aliases: ["ethiopia", "addis ababa"] },
  { region: "Africa", lat: -1.28, lon: 36.82, aliases: ["kenya", "nairobi"] },
  { region: "Africa", lat: -25.75, lon: 28.22, aliases: ["south africa", "pretoria", "johannesburg"] },
  { region: "Americas", lat: 45.42, lon: -75.69, aliases: ["canada", "ottawa", "toronto"] },
  { region: "Americas", lat: 19.43, lon: -99.13, aliases: ["mexico", "mexico city"] },
  { region: "Americas", lat: -15.79, lon: -47.88, aliases: ["brazil", "brasilia", "sao paulo"] },
  { region: "Americas", lat: -34.6, lon: -58.38, aliases: ["argentina", "buenos aires"] },
  { region: "Americas", lat: 10.48, lon: -66.9, aliases: ["venezuela", "caracas"] },
  { region: "Oceania", lat: -35.28, lon: 149.13, aliases: ["australia", "canberra", "albanese"] },
  { region: "Oceania", lat: -41.28, lon: 174.77, aliases: ["new zealand", "wellington"] }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

function jitter(lat: number, lon: number, key: string, scaleLat = 1.2, scaleLon = 1.8) {
  const seed = hash(key);
  const latOffset = (((seed % 1000) / 1000) - 0.5) * scaleLat;
  const lonOffset = ((((seed / 1000) % 1000) / 1000) - 0.5) * scaleLon;
  return {
    lat: Number((lat + latOffset).toFixed(4)),
    lon: Number((lon + lonOffset).toFixed(4))
  };
}

export function resolveLocation(text: string, fallbackRegion: IntelRegion = "Global") {
  const normalized = normalize(text);
  const match = KNOWN_LOCATIONS.find((location) =>
    location.aliases.some((alias) => normalized.includes(alias))
  );

  if (match) {
    return {
      ...jitter(match.lat, match.lon, text),
      region: match.region
    };
  }

  const fallback = REGION_CENTERS[fallbackRegion] ?? REGION_CENTERS.Global;
  return {
    ...jitter(fallback.lat, fallback.lon, text, fallbackRegion === "Global" ? 15 : 5, fallbackRegion === "Global" ? 26 : 8),
    region: fallbackRegion
  };
}

export function inferRegionFromCoordinates(lat: number, lon: number): IntelRegion {
  if (lon >= -125 && lon <= -66 && lat >= 24 && lat <= 50) return "United States";
  if ((lon >= -170 && lon <= -30) || lon <= -150) return "Americas";
  if (lon >= -12 && lon <= 42 && lat >= 35 && lat <= 72) return "Europe";
  if (lon >= 25 && lon <= 64 && lat >= 12 && lat <= 42) return "Middle East";
  if (lon >= -20 && lon <= 55 && lat >= -35 && lat <= 37) return "Africa";
  if (lon >= 110 && lon <= 180 && lat >= -50 && lat <= -5) return "Oceania";
  if (lon >= 54 && lon <= 150 && lat >= -10 && lat <= 57) return "Asia";
  return "Global";
}

export function fallbackRegionFromSection(sectionId?: string): IntelRegion {
  if (!sectionId) return "Global";
  if (sectionId.includes("us")) return "United States";
  if (sectionId.includes("australia")) return "Oceania";
  if (sectionId.includes("world")) return "Global";
  if (sectionId.includes("business")) return "Europe";
  if (sectionId.includes("technology")) return "United States";
  return "Global";
}
