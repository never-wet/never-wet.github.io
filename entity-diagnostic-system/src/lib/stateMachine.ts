export const systemStates = [
  {
    id: "boot",
    code: "STATE 0",
    label: "BOOT",
    shortLabel: "BOOT",
    signal: "SYSTEM WAKE",
    response: "GRID ACTIVE / CORE WIRE"
  },
  {
    id: "identification",
    code: "STATE 1",
    label: "IDENTIFICATION",
    shortLabel: "ID",
    signal: "ENTITY LOCK",
    response: "CLASSIFICATION READY"
  },
  {
    id: "analysis",
    code: "STATE 2",
    label: "ANALYSIS",
    shortLabel: "SCAN",
    signal: "SIGNATURE PASS",
    response: "VALUE CHANNELS OPEN"
  },
  {
    id: "profile",
    code: "STATE 3",
    label: "PROFILE",
    shortLabel: "PROFILE",
    signal: "PROFILE FORM",
    response: "SYSTEM DESCRIPTION SET"
  },
  {
    id: "comparison",
    code: "STATE 4",
    label: "COMPARISON",
    shortLabel: "RANK",
    signal: "RANK MATRIX",
    response: "NEAREST VALUES COMPARED"
  },
  {
    id: "output",
    code: "STATE 5",
    label: "OUTPUT",
    shortLabel: "OUTPUT",
    signal: "FINAL READ",
    response: "REPORT LOCKED"
  }
] as const;

export type SystemState = (typeof systemStates)[number];
export type SystemStateId = SystemState["id"];

const stateBands = [0, 0.14, 0.3, 0.5, 0.68, 0.86, 1];

export function getStateIndex(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));

  if (clamped < stateBands[1]) return 0;
  if (clamped < stateBands[2]) return 1;
  if (clamped < stateBands[3]) return 2;
  if (clamped < stateBands[4]) return 3;
  if (clamped < stateBands[5]) return 4;
  return 5;
}

export function getStateLocalProgress(progress: number) {
  const index = getStateIndex(progress);
  const start = stateBands[index];
  const end = stateBands[index + 1];
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

export function getScrollProgressForState(index: number) {
  const clamped = Math.min(systemStates.length - 1, Math.max(0, index));
  return stateBands[clamped] + 0.006;
}

export function formatSystemNumber(value: number) {
  return String(Math.round(value)).padStart(2, "0");
}
