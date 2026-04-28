import type { TerrainParameters } from "@/types/terrain";

export interface ErosionOptions {
  width: number;
  height: number;
  strength: number;
  iterations: number;
  hydraulic: boolean;
  thermal: boolean;
}

const neighborOffsets = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1]
] as const;

function indexOf(x: number, z: number, width: number) {
  return z * width + x;
}

export function thermalErosion(heights: Float32Array, options: ErosionOptions): Float32Array {
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
        const receivers: Array<[number, number]> = [];

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

    for (let index = 0; index < current.length; index += 1) {
      current[index] += delta[index];
    }
  }

  return current;
}

export function hydraulicErosion(heights: Float32Array, options: ErosionOptions): Float32Array {
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

    for (let index = 0; index < water.length; index += 1) {
      water[index] += rain;
    }

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

export function applyErosion(heights: Float32Array, parameters: TerrainParameters): Float32Array {
  let result: Float32Array<ArrayBufferLike> = new Float32Array(heights);
  const options: ErosionOptions = {
    width: parameters.resolution,
    height: parameters.resolution,
    strength: parameters.erosionStrength,
    iterations: Math.max(1, parameters.erosionIterations),
    hydraulic: parameters.hydraulicErosion,
    thermal: parameters.thermalErosion
  };

  if (options.hydraulic && options.strength > 0) {
    result = hydraulicErosion(result, options);
  }

  if (options.thermal && options.strength > 0) {
    result = thermalErosion(result, {
      ...options,
      iterations: Math.max(1, Math.round(options.iterations * 0.58))
    });
  }

  return result;
}
