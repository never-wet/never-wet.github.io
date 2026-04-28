"use strict";

const perlinGradients = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

const simplexGradients = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [-0.707, 0.707],
  [0.707, -0.707],
  [-0.707, -0.707]
];

const neighborOffsets = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1]
];

function seedToNumber(seed) {
  let hash = 2166136261;
  const value = String(seed || "terrain").trim() || "terrain";
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPermutation(seed) {
  const random = mulberry32(seedToNumber(seed));
  const source = new Uint8Array(256);
  const permutation = new Uint8Array(512);
  for (let index = 0; index < 256; index += 1) source[index] = index;
  for (let index = 255; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const temp = source[index];
    source[index] = source[swapIndex];
    source[swapIndex] = temp;
  }
  for (let index = 0; index < 512; index += 1) permutation[index] = source[index & 255];
  return permutation;
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function perlinGrad(hash, x, y) {
  const gradient = perlinGradients[hash & 7];
  return gradient[0] * x + gradient[1] * y;
}

function simplexCorner(perm, ii, jj, x, y) {
  let t = 0.5 - x * x - y * y;
  if (t < 0) return 0;
  const gradient = simplexGradients[perm[ii + perm[jj]] % simplexGradients.length];
  t *= t;
  return t * t * (gradient[0] * x + gradient[1] * y);
}

function createNoiseContext(seed) {
  const perm = buildPermutation(seed);

  const perlin = (x, y) => {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const xi = floorX & 255;
    const yi = floorY & 255;
    const xf = x - floorX;
    const yf = y - floorY;
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const x1 = lerp(perlinGrad(aa, xf, yf), perlinGrad(ba, xf - 1, yf), u);
    const x2 = lerp(perlinGrad(ab, xf, yf - 1), perlinGrad(bb, xf - 1, yf - 1), u);
    return Math.max(-1, Math.min(1, lerp(x1, x2, v) * 0.98));
  };

  const simplex = (xin, yin) => {
    const f2 = 0.5 * (Math.sqrt(3) - 1);
    const g2 = (3 - Math.sqrt(3)) / 6;
    const s = (xin + yin) * f2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * g2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + g2;
    const y1 = y0 - j1 + g2;
    const x2 = x0 - 1 + 2 * g2;
    const y2 = y0 - 1 + 2 * g2;
    const ii = i & 255;
    const jj = j & 255;
    const n0 = simplexCorner(perm, ii, jj, x0, y0);
    const n1 = simplexCorner(perm, ii + i1, jj + j1, x1, y1);
    const n2 = simplexCorner(perm, ii + 1, jj + 1, x2, y2);
    return Math.max(-1, Math.min(1, 70 * (n0 + n1 + n2)));
  };

  return { perlin, simplex };
}

function fractalBrownianMotion(sampler, x, y, options) {
  let frequency = 1;
  let amplitude = 1;
  let total = 0;
  let amplitudeSum = 0;
  for (let octave = 0; octave < options.octaves; octave += 1) {
    total += sampler(x * frequency, y * frequency) * amplitude;
    amplitudeSum += amplitude;
    amplitude *= options.persistence;
    frequency *= options.lacunarity;
  }
  return amplitudeSum === 0 ? 0 : total / amplitudeSum;
}

function ridgedNoise(sampler, x, y, options) {
  let frequency = 1;
  let amplitude = 0.62;
  let total = 0;
  let amplitudeSum = 0;
  let previous = 1;
  for (let octave = 0; octave < options.octaves; octave += 1) {
    const signal = 1 - Math.abs(sampler(x * frequency, y * frequency));
    const shaped = signal * signal * previous;
    total += shaped * amplitude;
    amplitudeSum += amplitude;
    previous = Math.max(0.15, Math.min(1, shaped * 1.55));
    amplitude *= options.persistence;
    frequency *= options.lacunarity;
  }
  return amplitudeSum === 0 ? 0 : total / amplitudeSum;
}

function signedToUnit(value) {
  return value * 0.5 + 0.5;
}

function terraced(value, steps, blend) {
  const stepped = Math.floor(value * steps) / steps;
  return stepped * (1 - blend) + value * blend;
}

function baseSampler(algorithm, context, options) {
  if (algorithm === "fbm") return (x, y) => fractalBrownianMotion(context.simplex, x, y, options);
  if (algorithm === "ridged") return (x, y) => ridgedNoise(context.simplex, x, y, options) * 2 - 1;
  if (algorithm === "perlin") return context.perlin;
  return context.simplex;
}

function terrainValue(normalizedX, normalizedZ, params, sampler, context) {
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

  if (params.terrainType === "mountains") {
    const ridges = ridgedNoise(context.simplex, x * 5.4, z * 5.4, {
      octaves: params.octaves,
      persistence: params.persistence,
      lacunarity: params.lacunarity
    });
    const valleys = 1 - smoothstep(0.18, 0.82, signedToUnit(broad));
    return ridges * 1.18 + signedToUnit(detail) * 0.26 - valleys * 0.1;
  }

  if (params.terrainType === "hills") {
    return smoothstep(0.12, 0.92, signedToUnit(broad * 0.78 + raw * 0.22));
  }

  if (params.terrainType === "desert") {
    const duneDirection = normalizedX * 11.5 + normalizedZ * 3.2 + broad * 1.1;
    const dunes = Math.sin(duneDirection * Math.PI) * 0.5 + 0.5;
    return 0.28 + dunes * 0.36 + signedToUnit(detail) * 0.16 + signedToUnit(raw) * 0.1;
  }

  if (params.terrainType === "island") {
    const dx = normalizedX - 0.5;
    const dz = normalizedZ - 0.5;
    const distance = Math.sqrt(dx * dx + dz * dz) / 0.707;
    const falloff = clamp01(1 - Math.pow(distance, 2.25));
    const coast = smoothstep(0.02, 0.84, falloff);
    const crown = signedToUnit(broad * 0.72 + detail * 0.28);
    return crown * coast - smoothstep(0.78, 1, distance) * 0.12;
  }

  if (params.terrainType === "plateau") {
    const plateau = terraced(signedToUnit(broad * 0.7 + raw * 0.3), 6, 0.22);
    const canyon = ridgedNoise(context.perlin, x * 4.5 + 14.2, z * 4.5 - 9.6, {
      octaves: Math.max(3, params.octaves - 1),
      persistence: 0.58,
      lacunarity: 2.4
    });
    const carved = smoothstep(0.46, 0.82, canyon);
    return plateau * 0.95 - carved * 0.42 + signedToUnit(detail) * 0.08;
  }

  return signedToUnit(raw);
}

function calculateSlopes(heights, width, depth, size) {
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

function summarizeHeights(heights) {
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

function generateTerrain(parameters, generationTimeMs = 0, erosionApplied = false) {
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

function indexOf(x, z, width) {
  return z * width + x;
}

function thermalErosion(heights, options) {
  const { width, height, iterations } = options;
  const strength = Math.max(0, Math.min(1, options.strength));
  const talus = 0.018 + (1 - strength) * 0.05;
  const current = new Float32Array(heights);
  const delta = new Float32Array(heights.length);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    delta.fill(0);
    for (let z = 1; z < height - 1; z += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = indexOf(x, z, width);
        const sourceHeight = current[index];
        let totalDifference = 0;
        const receivers = [];
        for (const [dx, dz] of neighborOffsets) {
          const neighborIndex = indexOf(x + dx, z + dz, width);
          const difference = sourceHeight - current[neighborIndex];
          if (difference > talus) {
            receivers.push([neighborIndex, difference]);
            totalDifference += difference;
          }
        }
        if (!receivers.length || totalDifference <= 0) continue;
        const material = Math.min(sourceHeight, totalDifference * 0.22 * strength);
        delta[index] -= material;
        for (const [neighborIndex, difference] of receivers) {
          delta[neighborIndex] += material * (difference / totalDifference);
        }
      }
    }
    for (let index = 0; index < current.length; index += 1) current[index] += delta[index];
  }

  return current;
}

function hydraulicErosion(heights, options) {
  const { width, height, iterations } = options;
  const strength = Math.max(0, Math.min(1, options.strength));
  const current = new Float32Array(heights);
  const water = new Float32Array(heights.length);
  const sediment = new Float32Array(heights.length);
  const waterDelta = new Float32Array(heights.length);
  const sedimentDelta = new Float32Array(heights.length);
  const rain = 0.018 * strength;
  const capacity = 0.84 + strength * 1.65;
  const erosionRate = 0.045 * strength;
  const depositionRate = 0.032 + strength * 0.028;
  const evaporation = 0.13 + (1 - strength) * 0.08;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    waterDelta.fill(0);
    sedimentDelta.fill(0);
    for (let index = 0; index < water.length; index += 1) water[index] += rain;
    for (let z = 1; z < height - 1; z += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = indexOf(x, z, width);
        const surface = current[index] + water[index];
        let targetIndex = index;
        let targetDrop = 0;
        for (const [dx, dz] of neighborOffsets) {
          const neighborIndex = indexOf(x + dx, z + dz, width);
          const neighborSurface = current[neighborIndex] + water[neighborIndex];
          const drop = surface - neighborSurface;
          if (drop > targetDrop) {
            targetDrop = drop;
            targetIndex = neighborIndex;
          }
        }

        if (targetIndex === index || targetDrop <= 0.0001) {
          const deposit = sediment[index] * depositionRate;
          current[index] += deposit;
          sediment[index] -= deposit;
          continue;
        }

        const flow = Math.min(water[index] * 0.68, targetDrop * 0.5);
        const carryingCapacity = Math.max(0.001, flow * targetDrop * capacity);
        const excess = sediment[index] - carryingCapacity;

        if (excess > 0) {
          const deposit = excess * depositionRate;
          current[index] += deposit;
          sediment[index] -= deposit;
        } else {
          const erosion = Math.min(current[index], (carryingCapacity - sediment[index]) * erosionRate);
          current[index] -= erosion;
          sediment[index] += erosion;
        }

        const carriedSediment = sediment[index] * Math.min(0.88, flow / Math.max(0.001, water[index]));
        waterDelta[index] -= flow;
        waterDelta[targetIndex] += flow;
        sedimentDelta[index] -= carriedSediment;
        sedimentDelta[targetIndex] += carriedSediment;
      }
    }

    for (let index = 0; index < current.length; index += 1) {
      water[index] = Math.max(0, (water[index] + waterDelta[index]) * (1 - evaporation));
      sediment[index] = Math.max(0, sediment[index] + sedimentDelta[index]);
    }
  }

  return current;
}

function applyErosion(heights, parameters) {
  let result = new Float32Array(heights);
  const options = {
    width: parameters.resolution,
    height: parameters.resolution,
    strength: parameters.erosionStrength,
    iterations: Math.max(1, parameters.erosionIterations),
    hydraulic: parameters.hydraulicErosion,
    thermal: parameters.thermalErosion
  };
  if (options.hydraulic && options.strength > 0) result = hydraulicErosion(result, options);
  if (options.thermal && options.strength > 0) {
    result = thermalErosion(result, {
      ...options,
      iterations: Math.max(1, Math.round(options.iterations * 0.58))
    });
  }
  return result;
}

self.onmessage = (event) => {
  const { requestId, parameters, applyErosion: shouldErode } = event.data;
  const startedAt = performance.now();

  try {
    let terrain = generateTerrain(parameters, 0, false);
    if (shouldErode) {
      const heights = applyErosion(terrain.heights, parameters);
      const slopes = calculateSlopes(heights, terrain.width, terrain.height, terrain.size);
      const summary = summarizeHeights(heights);
      terrain = {
        ...terrain,
        id: `${parameters.seed}-eroded-${Date.now().toString(36)}`,
        heights,
        slopes,
        ...summary,
        erosionApplied: true
      };
    }
    terrain.generationTimeMs = performance.now() - startedAt;
    self.postMessage({ requestId, terrain }, [terrain.heights.buffer, terrain.slopes.buffer]);
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : "Unknown terrain generation failure"
    });
  }
};
