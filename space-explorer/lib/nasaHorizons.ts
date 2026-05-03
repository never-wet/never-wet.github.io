export type HorizonsVectorRequest = {
  command: string;
  center?: string;
  startTime: string;
  stopTime: string;
  stepSize?: string;
  outUnits?: "KM-S" | "KM-D" | "AU-D";
};

export type HorizonsVector = {
  x: number;
  y: number;
  z: number;
  vx?: number;
  vy?: number;
  vz?: number;
  raw: string;
};

export const HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
export const EXOPLANET_TAP_SYNC_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

export function buildHorizonsVectorUrl(request: HorizonsVectorRequest) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${request.command}'`,
    OBJ_DATA: "YES",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "VECTORS",
    CENTER: `'${request.center ?? "500@10"}'`,
    START_TIME: `'${request.startTime}'`,
    STOP_TIME: `'${request.stopTime}'`,
    STEP_SIZE: `'${request.stepSize ?? "1 d"}'`,
    OUT_UNITS: request.outUnits ?? "KM-S",
    REF_PLANE: "ECLIPTIC",
    REF_SYSTEM: "ICRF",
    VEC_TABLE: "3",
  });

  return `${HORIZONS_API_URL}?${params.toString()}`;
}

export async function fetchHorizonsVectors(request: HorizonsVectorRequest): Promise<HorizonsVector[]> {
  const response = await fetch(buildHorizonsVectorUrl(request));
  if (!response.ok) {
    throw new Error(`Horizons request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { result?: string; error?: string };
  if (payload.error) throw new Error(payload.error);
  if (!payload.result) return [];

  return parseHorizonsVectorResult(payload.result);
}

export function parseHorizonsVectorResult(result: string): HorizonsVector[] {
  const section = result.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!section) return [];

  return section[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes(" X ="))
    .map((line) => {
      const x = readScientificValue(line, "X");
      const y = readScientificValue(line, "Y");
      const z = readScientificValue(line, "Z");
      const vx = readScientificValue(line, "VX");
      const vy = readScientificValue(line, "VY");
      const vz = readScientificValue(line, "VZ");
      return { x, y, z, vx, vy, vz, raw: line };
    });
}

export function buildExoplanetArchiveTapUrl(adql: string, format: "json" | "csv" | "tsv" = "json") {
  const params = new URLSearchParams({
    query: adql,
    format,
  });

  return `${EXOPLANET_TAP_SYNC_URL}?${params.toString()}`;
}

function readScientificValue(line: string, key: string) {
  const pattern = new RegExp(`${key}\\s*=\\s*([-+]?\\d*\\.?\\d+(?:[Ee][-+]?\\d+)?)`);
  const match = line.match(pattern);
  return match ? Number(match[1]) : Number.NaN;
}
