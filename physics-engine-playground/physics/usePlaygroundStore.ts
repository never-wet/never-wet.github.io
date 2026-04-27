"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { baseSettings, settingsForExperiment } from "@/experiments/presets";
import type { DebugMetric, ExperimentId, PlaygroundSettings, SavedPreset, SpawnShape } from "@/physics/types";
import { DEFAULT_METRICS } from "@/physics/constants";

type PlaygroundState = PlaygroundSettings & {
  metrics: DebugMetric;
  resetSignal: number;
  spawnSignal: number;
  stepSignal: number;
  savedPresets: SavedPreset[];
  setExperiment: (experimentId: ExperimentId) => void;
  setNumber: (key: NumberSettingKey, value: number) => void;
  setObjectType: (objectType: SpawnShape) => void;
  togglePaused: () => void;
  toggleDebug: () => void;
  toggleVectors: () => void;
  toggleTrails: () => void;
  toggleForces: () => void;
  reset: () => void;
  spawn: () => void;
  step: () => void;
  setMetrics: (metrics: Partial<DebugMetric>) => void;
  saveCurrentPreset: () => void;
  loadSavedPreset: (name: string) => void;
  deleteSavedPreset: (name: string) => void;
};

export type NumberSettingKey = {
  [K in keyof PlaygroundSettings]: PlaygroundSettings[K] extends number ? K : never;
}[keyof PlaygroundSettings];

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      ...baseSettings,
      metrics: DEFAULT_METRICS,
      resetSignal: 0,
      spawnSignal: 0,
      stepSignal: 0,
      savedPresets: [],
      setExperiment: (experimentId) =>
        set((state) => ({
          ...settingsForExperiment(experimentId),
          paused: state.paused,
          debug: state.debug,
          showVectors: state.showVectors,
          showTrails: state.showTrails,
          showForces: state.showForces,
          savedPresets: state.savedPresets,
          metrics: DEFAULT_METRICS,
          resetSignal: state.resetSignal + 1,
          spawnSignal: state.spawnSignal,
          stepSignal: state.stepSignal
        })),
      setNumber: (key, value) => set({ [key]: value } as Pick<PlaygroundState, typeof key>),
      setObjectType: (objectType) => set({ objectType }),
      togglePaused: () => set((state) => ({ paused: !state.paused })),
      toggleDebug: () => set((state) => ({ debug: !state.debug })),
      toggleVectors: () => set((state) => ({ showVectors: !state.showVectors })),
      toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),
      toggleForces: () => set((state) => ({ showForces: !state.showForces })),
      reset: () => set((state) => ({ resetSignal: state.resetSignal + 1, metrics: DEFAULT_METRICS })),
      spawn: () => set((state) => ({ spawnSignal: state.spawnSignal + 1 })),
      step: () => set((state) => ({ stepSignal: state.stepSignal + 1, paused: true })),
      setMetrics: (metrics) => set((state) => ({ metrics: { ...state.metrics, ...metrics } })),
      saveCurrentPreset: () => {
        const state = get();
        const settings: PlaygroundSettings = {
          experimentId: state.experimentId,
          paused: state.paused,
          debug: state.debug,
          showVectors: state.showVectors,
          showTrails: state.showTrails,
          showForces: state.showForces,
          objectType: state.objectType,
          gravityX: state.gravityX,
          gravityY: state.gravityY,
          gravityZ: state.gravityZ,
          mass: state.mass,
          friction: state.friction,
          restitution: state.restitution,
          windSpeed: state.windSpeed,
          damping: state.damping,
          springStiffness: state.springStiffness,
          pendulumLength: state.pendulumLength,
          fieldStrength: state.fieldStrength,
          orbitalGravity: state.orbitalGravity,
          initialVelocity: state.initialVelocity
        };
        const name = `${settings.experimentId.replaceAll("-", " ")} ${state.savedPresets.length + 1}`;
        set({
          savedPresets: [
            {
              name,
              settings,
              createdAt: new Date().toISOString()
            },
            ...state.savedPresets
          ].slice(0, 8)
        });
      },
      loadSavedPreset: (name) => {
        const preset = get().savedPresets.find((item) => item.name === name);
        if (!preset) {
          return;
        }
        set((state) => ({
          ...preset.settings,
          metrics: DEFAULT_METRICS,
          resetSignal: state.resetSignal + 1,
          spawnSignal: state.spawnSignal,
          stepSignal: state.stepSignal,
          savedPresets: state.savedPresets
        }));
      },
      deleteSavedPreset: (name) =>
        set((state) => ({
          savedPresets: state.savedPresets.filter((preset) => preset.name !== name)
        }))
    }),
    {
      name: "physics-engine-playground",
      partialize: (state) => ({
        savedPresets: state.savedPresets,
        debug: state.debug,
        showVectors: state.showVectors,
        showTrails: state.showTrails,
        showForces: state.showForces
      })
    }
  )
);
