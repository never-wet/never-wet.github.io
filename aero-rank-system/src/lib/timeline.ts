export const systemStates = [
  {
    id: "boot",
    label: "ENTRY / BOOT",
    shortLabel: "BOOT"
  },
  {
    id: "identity",
    label: "IDENTITY",
    shortLabel: "ID"
  },
  {
    id: "aero",
    label: "AERODYNAMIC SCAN",
    shortLabel: "AERO"
  },
  {
    id: "performance",
    label: "PERFORMANCE ANALYSIS",
    shortLabel: "POWER"
  },
  {
    id: "comparison",
    label: "COMPARISON",
    shortLabel: "COMPARE"
  },
  {
    id: "final",
    label: "FINAL COMMAND",
    shortLabel: "ENTER"
  }
] as const;

export type SystemStateId = (typeof systemStates)[number]["id"];

export function getPhaseIndex(progress: number) {
  if (progress < 0.12) return 0;
  if (progress < 0.28) return 1;
  if (progress < 0.52) return 2;
  if (progress < 0.72) return 3;
  if (progress < 0.88) return 4;
  return 5;
}

export function getStateProgress(progress: number) {
  const bands = [0, 0.12, 0.28, 0.52, 0.72, 0.88, 1];
  const index = getPhaseIndex(progress);
  const start = bands[index];
  const end = bands[index + 1];
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

export function padScore(value: number) {
  return String(Math.round(value)).padStart(2, "0");
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}
