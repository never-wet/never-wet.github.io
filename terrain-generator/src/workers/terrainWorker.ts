/// <reference lib="webworker" />

import { applyErosion } from "../lib/erosion";
import { calculateSlopes, generateTerrain, summarizeHeights } from "../lib/terrain";
import type { TerrainWorkerRequest, TerrainWorkerResponse } from "../types/terrain";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<TerrainWorkerRequest>) => {
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

    const response: TerrainWorkerResponse = {
      requestId,
      terrain
    };

    ctx.postMessage(response, [terrain.heights.buffer, terrain.slopes.buffer]);
  } catch (error) {
    ctx.postMessage({
      requestId,
      error: error instanceof Error ? error.message : "Unknown terrain generation failure"
    });
  }
};
