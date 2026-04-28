"use client";

import { create } from "zustand";
import { defaultParameters, terrainPresets } from "@/lib/presets";
import { rebuildTerrainData } from "@/lib/terrain";
import type {
  BrushSettings,
  SavedTerrainPreset,
  TerrainData,
  TerrainParameters,
  TerrainType,
  GenerationStatus
} from "@/types/terrain";

const presetStorageKey = "terrain-generator-presets";

interface TerrainStore {
  parameters: TerrainParameters;
  terrain: TerrainData | null;
  status: GenerationStatus;
  error: string | null;
  erosionRunId: number;
  cameraResetId: number;
  presets: SavedTerrainPreset[];
  brush: BrushSettings;
  setParameter: <K extends keyof TerrainParameters>(key: K, value: TerrainParameters[K]) => void;
  updateParameters: (parameters: Partial<TerrainParameters>) => void;
  applyTerrainPreset: (terrainType: TerrainType) => void;
  resetParameters: () => void;
  randomizeSeed: () => void;
  requestErosion: () => void;
  requestCameraReset: () => void;
  setStatus: (status: GenerationStatus) => void;
  setError: (error: string | null) => void;
  setTerrain: (terrain: TerrainData) => void;
  setBrush: (brush: Partial<BrushSettings>) => void;
  applyBrushAt: (worldX: number, worldZ: number) => void;
  hydratePresets: () => void;
  savePreset: () => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function persistPresets(presets: SavedTerrainPreset[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(presetStorageKey, JSON.stringify(presets));
}

function createPresetName(parameters: TerrainParameters) {
  const type = parameters.terrainType.replace("-", " ");
  return `${type.charAt(0).toUpperCase()}${type.slice(1)} ${parameters.seed}`;
}

function createRandomSeed() {
  const segment = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")
    .toUpperCase();
  return `NW-${segment}`;
}

export const useTerrainStore = create<TerrainStore>((set, get) => ({
  parameters: defaultParameters,
  terrain: null,
  status: "idle",
  error: null,
  erosionRunId: 0,
  cameraResetId: 0,
  presets: [],
  brush: {
    enabled: false,
    mode: "raise",
    radius: 5,
    intensity: 0.16
  },

  setParameter: (key, value) => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        [key]: value
      },
      error: null
    }));
  },

  updateParameters: (parameters) => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        ...parameters
      },
      error: null
    }));
  },

  applyTerrainPreset: (terrainType) => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        ...terrainPresets[terrainType],
        terrainType
      },
      error: null
    }));
  },

  resetParameters: () => {
    set({
      parameters: {
        ...defaultParameters,
        seed: createRandomSeed()
      },
      error: null
    });
  },

  randomizeSeed: () => {
    set((state) => ({
      parameters: {
        ...state.parameters,
        seed: createRandomSeed()
      },
      error: null
    }));
  },

  requestErosion: () => {
    set((state) => ({
      erosionRunId: state.erosionRunId + 1,
      error: null
    }));
  },

  requestCameraReset: () => {
    set((state) => ({
      cameraResetId: state.cameraResetId + 1
    }));
  },

  setStatus: (status) => set({ status }),

  setError: (error) =>
    set({
      error,
      status: error ? "error" : get().status
    }),

  setTerrain: (terrain) =>
    set({
      terrain,
      status: "ready",
      error: null
    }),

  setBrush: (brush) => {
    set((state) => ({
      brush: {
        ...state.brush,
        ...brush
      }
    }));
  },

  applyBrushAt: (worldX, worldZ) => {
    const { terrain, brush } = get();
    if (!terrain || !brush.enabled) return;

    const heights = new Float32Array(terrain.heights);
    const gridX = ((worldX / terrain.size + 0.5) * (terrain.width - 1));
    const gridZ = ((worldZ / terrain.size + 0.5) * (terrain.height - 1));
    if (gridX < 0 || gridZ < 0 || gridX > terrain.width - 1 || gridZ > terrain.height - 1) return;

    const radiusCells = Math.max(1, (brush.radius / terrain.size) * (terrain.width - 1));
    const minX = Math.max(0, Math.floor(gridX - radiusCells));
    const maxX = Math.min(terrain.width - 1, Math.ceil(gridX + radiusCells));
    const minZ = Math.max(0, Math.floor(gridZ - radiusCells));
    const maxZ = Math.min(terrain.height - 1, Math.ceil(gridZ + radiusCells));
    const centerIndex = Math.round(gridZ) * terrain.width + Math.round(gridX);
    const flattenTarget = heights[centerIndex] ?? terrain.averageHeight;

    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - gridX;
        const dz = z - gridZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > radiusCells) continue;

        const index = z * terrain.width + x;
        const falloff = Math.pow(1 - distance / radiusCells, 2);
        const amount = brush.intensity * falloff;

        if (brush.mode === "raise") {
          heights[index] += amount;
        } else if (brush.mode === "lower") {
          heights[index] -= amount;
        } else if (brush.mode === "flatten") {
          heights[index] += (flattenTarget - heights[index]) * Math.min(0.4, amount);
        } else {
          let total = 0;
          let count = 0;
          for (let oz = -1; oz <= 1; oz += 1) {
            for (let ox = -1; ox <= 1; ox += 1) {
              const sx = Math.max(0, Math.min(terrain.width - 1, x + ox));
              const sz = Math.max(0, Math.min(terrain.height - 1, z + oz));
              total += terrain.heights[sz * terrain.width + sx];
              count += 1;
            }
          }
          const average = total / Math.max(1, count);
          heights[index] += (average - heights[index]) * Math.min(0.55, amount * 1.8);
        }
      }
    }

    set({
      terrain: rebuildTerrainData(terrain, heights),
      status: "ready"
    });
  },

  hydratePresets: () => {
    if (!canUseStorage()) return;

    try {
      const raw = window.localStorage.getItem(presetStorageKey);
      if (!raw) return;
      const presets = JSON.parse(raw) as SavedTerrainPreset[];
      if (Array.isArray(presets)) set({ presets });
    } catch {
      set({ presets: [] });
    }
  },

  savePreset: () => {
    const state = get();
    const preset: SavedTerrainPreset = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      name: createPresetName(state.parameters),
      createdAt: new Date().toISOString(),
      parameters: state.parameters
    };
    const presets = [preset, ...state.presets].slice(0, 10);
    persistPresets(presets);
    set({ presets });
  },

  loadPreset: (id) => {
    const preset = get().presets.find((item) => item.id === id);
    if (!preset) return;
    set({
      parameters: preset.parameters,
      error: null
    });
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((preset) => preset.id !== id);
    persistPresets(presets);
    set({ presets });
  }
}));
