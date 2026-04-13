import type { CanvasElement, HistoryEntry, RoomMeta, RoomSettings } from "./types.js";

export const SEED_VERSION = "v1";

export function buildSeedElements(): CanvasElement[] {
  return [
    {
      id: "seed-note",
      kind: "sticky",
      title: "Project Brainstorm",
      text: "Add ideas for the new ethereal workshop interface here...",
      x: 360,
      y: 220,
      rotation: -2,
      order: 1,
      seed: true
    },
    {
      id: "seed-circle",
      kind: "shape-circle",
      title: "Orbit Circle",
      x: 760,
      y: 180,
      order: 2,
      seed: true
    },
    {
      id: "seed-blob",
      kind: "shape-blob",
      title: "Glass Blob",
      x: 850,
      y: 310,
      order: 3,
      seed: true
    },
    {
      id: "seed-media",
      kind: "media",
      title: "Creative Reference #42",
      text: "Inspired by ethereal workshop concept",
      image: "../img/code2.png",
      x: 470,
      y: 560,
      rotation: 3,
      order: 4,
      seed: true
    },
    {
      id: "seed-type",
      kind: "text",
      title: "ETHEREAL WORKSPACE",
      x: 1010,
      y: 470,
      order: 5,
      seed: true
    },
    {
      id: "seed-sprint",
      kind: "sprint",
      title: "Design Sprint",
      text: "Due in 2 days",
      x: 1130,
      y: 170,
      order: 6,
      seed: true
    }
  ];
}

export function buildSeedSettings(): RoomSettings {
  return {
    grid: true,
    glow: false
  };
}

export function buildSeedMeta(): RoomMeta {
  return {
    seedVersion: SEED_VERSION,
    nextOrder: 6
  };
}

export function buildSeedHistory(now = Date.now()): HistoryEntry[] {
  return [
    {
      text: "Canvas ready",
      at: now
    }
  ];
}
