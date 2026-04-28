import type { TerrainParameters, TerrainType } from "@/types/terrain";

export const terrainTypeLabels: Record<TerrainType, string> = {
  mountains: "Mountains",
  hills: "Hills",
  desert: "Desert",
  island: "Island",
  plateau: "Plateau / Canyon"
};

export const defaultParameters: TerrainParameters = {
  terrainType: "mountains",
  noiseAlgorithm: "ridged",
  resolution: 257,
  size: 128,
  scale: 2.8,
  octaves: 6,
  persistence: 0.52,
  lacunarity: 2.12,
  seed: "NW-2026",
  heightMultiplier: 24,
  erosionStrength: 0.36,
  erosionIterations: 26,
  hydraulicErosion: true,
  thermalErosion: true,
  materialPreset: "alpine",
  renderQuality: "quality",
  waterEnabled: true,
  fogEnabled: true,
  shadowsEnabled: true
};

export const terrainPresets: Record<TerrainType, Partial<TerrainParameters>> = {
  mountains: {
    terrainType: "mountains",
    noiseAlgorithm: "ridged",
    scale: 2.35,
    octaves: 7,
    persistence: 0.5,
    lacunarity: 2.22,
    heightMultiplier: 30,
    materialPreset: "alpine",
    waterEnabled: true
  },
  hills: {
    terrainType: "hills",
    noiseAlgorithm: "fbm",
    scale: 4.25,
    octaves: 5,
    persistence: 0.48,
    lacunarity: 2,
    heightMultiplier: 14,
    materialPreset: "temperate",
    waterEnabled: false
  },
  desert: {
    terrainType: "desert",
    noiseAlgorithm: "simplex",
    scale: 5.2,
    octaves: 4,
    persistence: 0.42,
    lacunarity: 2.35,
    heightMultiplier: 10,
    materialPreset: "arid",
    waterEnabled: false
  },
  island: {
    terrainType: "island",
    noiseAlgorithm: "fbm",
    scale: 3.45,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.05,
    heightMultiplier: 22,
    materialPreset: "temperate",
    waterEnabled: true
  },
  plateau: {
    terrainType: "plateau",
    noiseAlgorithm: "ridged",
    scale: 3.05,
    octaves: 5,
    persistence: 0.58,
    lacunarity: 2.35,
    heightMultiplier: 20,
    materialPreset: "volcanic",
    waterEnabled: false
  }
};

export const resolutionOptions = [65, 129, 257, 385];
