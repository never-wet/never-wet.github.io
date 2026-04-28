export type NoiseAlgorithm = "perlin" | "simplex" | "fbm" | "ridged";

export type TerrainType = "mountains" | "hills" | "desert" | "island" | "plateau";

export type MaterialPreset = "alpine" | "arid" | "temperate" | "volcanic";

export type RenderQuality = "performance" | "balanced" | "quality";

export type BrushMode = "raise" | "lower" | "smooth" | "flatten";

export type GenerationStatus = "idle" | "generating" | "eroding" | "ready" | "error";

export interface TerrainParameters {
  terrainType: TerrainType;
  noiseAlgorithm: NoiseAlgorithm;
  resolution: number;
  size: number;
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: string;
  heightMultiplier: number;
  erosionStrength: number;
  erosionIterations: number;
  hydraulicErosion: boolean;
  thermalErosion: boolean;
  materialPreset: MaterialPreset;
  renderQuality: RenderQuality;
  waterEnabled: boolean;
  fogEnabled: boolean;
  shadowsEnabled: boolean;
}

export interface BrushSettings {
  enabled: boolean;
  mode: BrushMode;
  radius: number;
  intensity: number;
}

export interface TerrainData {
  id: string;
  width: number;
  height: number;
  size: number;
  heights: Float32Array;
  slopes: Float32Array;
  minHeight: number;
  maxHeight: number;
  averageHeight: number;
  generationTimeMs: number;
  erosionApplied: boolean;
  seed: string;
}

export interface SavedTerrainPreset {
  id: string;
  name: string;
  createdAt: string;
  parameters: TerrainParameters;
}

export interface TerrainWorkerRequest {
  requestId: number;
  parameters: TerrainParameters;
  applyErosion: boolean;
}

export interface TerrainWorkerResponse {
  requestId: number;
  terrain: TerrainData;
}

export interface TerrainWorkerError {
  requestId: number;
  error: string;
}
