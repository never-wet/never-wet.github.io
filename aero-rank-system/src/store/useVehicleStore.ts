"use client";

import { create } from "zustand";
import type { VehicleId } from "@/data/vehicles";
import { getPhaseIndex } from "@/lib/timeline";

type VehicleState = {
  activeId: VehicleId;
  previousId: VehicleId;
  progress: number;
  phaseIndex: number;
  booted: boolean;
  transitionPulse: number;
  cursorLabel: string;
  hoverTarget: "none" | "vehicle" | "ui";
  setVehicle: (id: VehicleId) => void;
  setProgress: (progress: number) => void;
  setBooted: (booted: boolean) => void;
  setCursorLabel: (label: string) => void;
  setHoverTarget: (target: VehicleState["hoverTarget"]) => void;
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  activeId: "porsche",
  previousId: "porsche",
  progress: 0,
  phaseIndex: 0,
  booted: false,
  transitionPulse: 0,
  cursorLabel: "SCAN",
  hoverTarget: "none",
  setVehicle: (id) => {
    const { activeId, transitionPulse } = get();
    if (id === activeId) return;
    set({
      previousId: activeId,
      activeId: id,
      transitionPulse: transitionPulse + 1,
      cursorLabel: "SELECT"
    });
  },
  setProgress: (progress) =>
    set({
      progress,
      phaseIndex: getPhaseIndex(progress)
    }),
  setBooted: (booted) => set({ booted }),
  setCursorLabel: (cursorLabel) => set({ cursorLabel }),
  setHoverTarget: (hoverTarget) => set({ hoverTarget })
}));
