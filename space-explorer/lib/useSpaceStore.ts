import { create } from "zustand";
import type { MeasurementMode, ScaleMode } from "./measurementUtils";

type SpaceStore = {
  selectedObjectId: string | null;
  focusedObjectId: string;
  scaleMode: ScaleMode;
  measurementMode: MeasurementMode;
  measurementIds: string[];
  showOrbits: boolean;
  showLabels: boolean;
  showBelts: boolean;
  timeSpeed: number;
  isPaused: boolean;
  simulatedDateIso: string;
  searchQuery: string;
  selectObject: (id: string) => void;
  focusObject: (id: string) => void;
  clearSelection: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  setMeasurementMode: (mode: MeasurementMode) => void;
  toggleMeasurementObject: (id: string) => void;
  clearMeasurement: () => void;
  setShowOrbits: (value: boolean) => void;
  setShowLabels: (value: boolean) => void;
  setShowBelts: (value: boolean) => void;
  setTimeSpeed: (speed: number) => void;
  setPaused: (value: boolean) => void;
  setSimulatedDate: (dateIso: string) => void;
  advanceSimulation: (days: number) => void;
  setSearchQuery: (value: string) => void;
};

function updateMeasurementIds(currentIds: string[], id: string) {
  const current = currentIds.filter(Boolean);
  if (current.length >= 2) return [id];
  if (current.includes(id)) return current;
  return [...current, id];
}

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  selectedObjectId: null,
  focusedObjectId: "sun",
  scaleMode: "compressed",
  measurementMode: "visual",
  measurementIds: [],
  showOrbits: true,
  showLabels: false,
  showBelts: true,
  timeSpeed: 8,
  isPaused: false,
  simulatedDateIso: new Date().toISOString(),
  searchQuery: "",
  selectObject: (id) => {
    if (get().measurementMode === "distance") {
      set({
        focusedObjectId: id,
        selectedObjectId: null,
        measurementIds: updateMeasurementIds(get().measurementIds, id),
      });
      return;
    }
    set({ selectedObjectId: id, focusedObjectId: id, measurementIds: [] });
  },
  focusObject: (id) => set({ focusedObjectId: id, selectedObjectId: id }),
  clearSelection: () => set({ selectedObjectId: null }),
  setScaleMode: (scaleMode) => set({ scaleMode }),
  setMeasurementMode: (measurementMode) =>
    set({
      measurementMode,
      selectedObjectId: measurementMode === "distance" ? null : get().selectedObjectId,
      measurementIds: [],
    }),
  toggleMeasurementObject: (id) => {
    set({ measurementIds: updateMeasurementIds(get().measurementIds, id) });
  },
  clearMeasurement: () => set({ measurementIds: [] }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowBelts: (showBelts) => set({ showBelts }),
  setTimeSpeed: (timeSpeed) => set({ timeSpeed }),
  setPaused: (isPaused) => set({ isPaused }),
  setSimulatedDate: (simulatedDateIso) => set({ simulatedDateIso }),
  advanceSimulation: (days) => {
    const current = new Date(get().simulatedDateIso);
    current.setUTCDate(current.getUTCDate() + days);
    set({ simulatedDateIso: current.toISOString() });
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
