import type { NoiseAlgorithm, TerrainData, TerrainParameters } from "@/types/terrain";
import {
  clamp01,
  createNoiseContext,
  fractalBrownianMotion,
  ridgedNoise,
  sampleBaseNoise,
  seedToNumber,
  smoothstep
} from "./noise";

function signedToUnit(value: number): number {
  return value * 0.5 + 0.5;
}

function terraced(value: number, steps: number, blend: number): number {
  const stepped = Math.floor(value * steps) / steps;
  return stepped * (1 - blend) + value * blend;
}

function baseSampler(
  algorithm: NoiseAlgorithm,
  context: ReturnType<typeof createNoiseContext>,
  options: Pick<TerrainParameters, "octaves" | "persistence" | "lacunarity">
) {
  const source = algorithm === "perlin" ? context.perlin : context.simplex;

  if (algorithm === "fbm") {
    return (x: number, y: number) => fractalBrownianMotion(context.simplex, x, y, options);
  }

  if (algorithm === "ridged") {
    return (x: number, y: number) => ridgedNoise(context.simplex, x, y, options) * 2 - 1;
  }

  return (x: number, y: number) => sampleBaseNoise(context, algorithm, x, y);
}

function terrainValue(
  normalizedX: number,
  normalizedZ: number,
  params: TerrainParameters,
  sampler: (x: number, y: number) => number,
  context: ReturnType<typeof createNoiseContext>
) {
  const featureScale = Math.max(0.08, params.scale);
  const x = (normalizedX - 0.5) / featureScale;
  const z = (normalizedZ - 0.5) / featureScale;
  const broad = fractalBrownianMotion(context.simplex, x * 1.3, z * 1.3, {
    octaves: Math.max(2, params.octaves - 1),
    persistence: params.persistence,
    lacunarity: params.lacunarity
  });
  const detail = fractalBrownianMotion(context.perlin, x * 6.2, z * 6.2, {
    octaves: Math.max(1, Math.min(4, params.octaves)),
    persistence: 0.44,
    lacunarity: 2.45
  });
  const raw = sampler(x * 4.8, z * 4.8);

  switch (params.terrainType) {
    case "mountains": {
      const ridges = ridgedNoise(context.simplex, x * 5.4, z * 5.4, {
        octaves: params.octaves,
        persistence: params.persistence,
        lacunarity: params.lacunarity
      });
      const valleys = 1 - smoothstep(0.18, 0.82, signedToUnit(broad));
      return ridges * 1.18 + signedToUnit(detail) * 0.26 - valleys * 0.1;
    }
    case "hills":
      return smoothstep(0.12, 0.92, signedToUnit(broad * 0.78 + raw * 0.22));
    case "desert": {
      const duneDirection = normalizedX * 11.5 + normalizedZ * 3.2 + broad * 1.1;
      const dunes = Math.sin(duneDirection * Math.PI) * 0.5 + 0.5;
      return 0.28 + dunes * 0.36 + signedToUnit(detail) * 0.16 + signedToUnit(raw) * 0.1;
    }
    case "island": {
      const dx = normalizedX - 0.5;
      const dz = normalizedZ - 0.5;
      const distance = Math.sqrt(dx * dx + dz * dz) / 0.707;
      const falloff = clamp01(1 - Math.pow(distance, 2.25));
      const coast = smoothstep(0.02, 0.84, falloff);
      const crown = signedToUnit(broad * 0.72 + detail * 0.28);
      return crown * coast - smoothstep(0.78, 1, distance) * 0.12;
    }
    case "plateau": {
      const plateau = terraced(signedToUnit(broad * 0.7 + raw * 0.3), 6, 0.22);
      const canyon = ridgedNoise(context.perlin, x * 4.5 + 14.2, z * 4.5 - 9.6, {
        octaves: Math.max(3, params.octaves - 1),
        persistence: 0.58,
        lacunarity: 2.4
      });
      const carved = smoothstep(0.46, 0.82, canyon);
      return plateau * 0.95 - carved * 0.42 + signedToUnit(detail) * 0.08;
    }
    default:
      return signedToUnit(raw);
  }
}

export function calculateSlopes(heights: Float32Array, width: number, depth: number, size: number): Float32Array {
  const slopes = new Float32Array(heights.length);
  const cellSize = size / Math.max(1, width - 1);

  for (let z = 0; z < depth; z += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = z * width + x;
      const left = heights[z * width + Math.max(0, x - 1)];
      const right = heights[z * width + Math.min(width - 1, x + 1)];
      const down = heights[Math.max(0, z - 1) * width + x];
      const up = heights[Math.min(depth - 1, z + 1) * width + x];
      const dx = (right - left) / (cellSize * 2);
      const dz = (up - down) / (cellSize * 2);
      slopes[index] = clamp01(Math.sqrt(dx * dx + dz * dz) * 0.18);
    }
  }

  return slopes;
}

export function summarizeHeights(heights: Float32Array) {
  let minHeight = Number.POSITIVE_INFINITY;
  let maxHeight = Number.NEGATIVE_INFINITY;
  let total = 0;

  for (const height of heights) {
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
    total += height;
  }

  return {
    minHeight,
    maxHeight,
    averageHeight: heights.length ? total / heights.length : 0
  };
}

export function rebuildTerrainData(
  current: TerrainData,
  heights: Float32Array,
  generationTimeMs = current.generationTimeMs
): TerrainData {
  const slopes = calculateSlopes(heights, current.width, current.height, current.size);
  const summary = summarizeHeights(heights);

  return {
    ...current,
    id: `${current.seed}-${Date.now().toString(36)}`,
    heights,
    slopes,
    generationTimeMs,
    ...summary
  };
}

export function generateTerrain(parameters: TerrainParameters, generationTimeMs = 0, erosionApplied = false): TerrainData {
  const width = parameters.resolution;
  const depth = parameters.resolution;
  const heights = new Float32Array(width * depth);
  const context = createNoiseContext(parameters.seed);
  const sampler = baseSampler(parameters.noiseAlgorithm, context, parameters);
  let minRaw = Number.POSITIVE_INFINITY;
  let maxRaw = Number.NEGATIVE_INFINITY;

  for (let z = 0; z < depth; z += 1) {
    const nz = z / (depth - 1);
    for (let x = 0; x < width; x += 1) {
      const nx = x / (width - 1);
      const index = z * width + x;
      const value = terrainValue(nx, nz, parameters, sampler, context);
      heights[index] = value;
      minRaw = Math.min(minRaw, value);
      maxRaw = Math.max(maxRaw, value);
    }
  }

  const range = Math.max(0.0001, maxRaw - minRaw);
  const seedOffset = (seedToNumber(parameters.seed) % 997) / 997000;

  for (let index = 0; index < heights.length; index += 1) {
    const normalized = clamp01((heights[index] - minRaw) / range + seedOffset);
    const contrast =
      parameters.terrainType === "mountains"
        ? Math.pow(normalized, 1.34)
        : parameters.terrainType === "desert"
          ? normalized * 0.76 + 0.12
          : parameters.terrainType === "plateau"
            ? normalized
            : smoothstep(0.02, 0.98, normalized);
    heights[index] = contrast * parameters.heightMultiplier;
  }

  const slopes = calculateSlopes(heights, width, depth, parameters.size);
  const summary = summarizeHeights(heights);

  return {
    id: `${parameters.seed}-${Date.now().toString(36)}`,
    width,
    height: depth,
    size: parameters.size,
    heights,
    slopes,
    ...summary,
    generationTimeMs,
    erosionApplied,
    seed: parameters.seed
  };
}
