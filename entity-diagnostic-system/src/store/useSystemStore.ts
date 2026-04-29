"use client";

import { create } from "zustand";
import { entities } from "@/data/entities";
import { getStateIndex } from "@/lib/stateMachine";

type HoverZone = "none" | "core" | "identity" | "command";

type SystemStore = {
  activeEntityId: string;
  previousEntityId: string;
  previewEntityId: string | null;
  progress: number;
  stateIndex: number;
  bootComplete: boolean;
  transitionPulse: number;
  hoverZone: HoverZone;
  cursorLabel: string;
  setEntity: (id: string) => void;
  setPreviewEntity: (id: string | null) => void;
  setProgress: (progress: number) => void;
  setBootComplete: (bootComplete: boolean) => void;
  setHoverZone: (zone: HoverZone) => void;
  setCursorLabel: (cursorLabel: string) => void;
};

export const useSystemStore = create<SystemStore>((set, get) => ({
  activeEntityId: entities[0].id,
  previousEntityId: entities[0].id,
  previewEntityId: null,
  progress: 0,
  stateIndex: 0,
  bootComplete: false,
  transitionPulse: 0,
  hoverZone: "none",
  cursorLabel: "SCAN",
  setEntity: (id) => {
    const { activeEntityId, transitionPulse } = get();
    if (id === activeEntityId) return;

    set({
      activeEntityId: id,
      previousEntityId: activeEntityId,
      previewEntityId: null,
      transitionPulse: transitionPulse + 1,
      cursorLabel: "LOCK"
    });
  },
  setPreviewEntity: (previewEntityId) => set({ previewEntityId }),
  setProgress: (progress) =>
    set({
      progress,
      stateIndex: getStateIndex(progress)
    }),
  setBootComplete: (bootComplete) => set({ bootComplete }),
  setHoverZone: (hoverZone) => set({ hoverZone }),
  setCursorLabel: (cursorLabel) => set({ cursorLabel })
}));
