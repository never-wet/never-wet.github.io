export type AnimationStepType = "compare" | "swap" | "overwrite" | "markSorted";

export interface AnimationStep {
  type: AnimationStepType;
  indices: number[];
  values?: number[];
  pseudocodeLine?: number;
  pivotIndex?: number;
  activeRange?: [number, number];
}

export interface HighlightState {
  comparing: number[];
  swapping: number[];
  overwriting: number[];
  sorted: number[];
  pivotIndex: number | null;
  activeRange: [number, number] | null;
  pseudocodeLine: number | null;
}

export interface StepStatsDelta {
  comparisons: number;
  swaps: number;
  writes: number;
}

export const emptyHighlights: HighlightState = {
  comparing: [],
  swapping: [],
  overwriting: [],
  sorted: [],
  pivotIndex: null,
  activeRange: null,
  pseudocodeLine: null,
};

export function compareStep(
  indices: number[],
  pseudocodeLine: number,
  extra: Partial<Pick<AnimationStep, "pivotIndex" | "activeRange">> = {},
): AnimationStep {
  return { type: "compare", indices, pseudocodeLine, ...extra };
}

export function swapStep(
  indices: [number, number],
  pseudocodeLine: number,
  extra: Partial<Pick<AnimationStep, "pivotIndex" | "activeRange">> = {},
): AnimationStep {
  return { type: "swap", indices, pseudocodeLine, ...extra };
}

export function overwriteStep(
  indices: number[],
  values: number[],
  pseudocodeLine: number,
  extra: Partial<Pick<AnimationStep, "pivotIndex" | "activeRange">> = {},
): AnimationStep {
  return { type: "overwrite", indices, values, pseudocodeLine, ...extra };
}

export function markSortedStep(
  indices: number[],
  pseudocodeLine: number,
  extra: Partial<Pick<AnimationStep, "pivotIndex" | "activeRange">> = {},
): AnimationStep {
  return { type: "markSorted", indices, pseudocodeLine, ...extra };
}

export function applyAnimationStep(
  array: number[],
  highlights: HighlightState,
  step: AnimationStep,
): { array: number[]; highlights: HighlightState; delta: StepStatsDelta } {
  const nextArray = [...array];
  const sorted = new Set(highlights.sorted);
  const nextHighlights: HighlightState = {
    comparing: [],
    swapping: [],
    overwriting: [],
    sorted: highlights.sorted,
    pivotIndex: step.pivotIndex ?? null,
    activeRange: step.activeRange ?? null,
    pseudocodeLine: step.pseudocodeLine ?? null,
  };
  const delta: StepStatsDelta = { comparisons: 0, swaps: 0, writes: 0 };

  if (step.type === "compare") {
    nextHighlights.comparing = step.indices;
    delta.comparisons = step.indices.length >= 2 ? 1 : 0;
  }

  if (step.type === "swap") {
    const [first, second] = step.indices;
    if (first !== undefined && second !== undefined && first !== second) {
      [nextArray[first], nextArray[second]] = [nextArray[second], nextArray[first]];
      delta.swaps = 1;
    }
    nextHighlights.swapping = step.indices;
  }

  if (step.type === "overwrite") {
    step.indices.forEach((index, offset) => {
      const value = step.values?.[offset] ?? step.values?.[0];
      if (value !== undefined) {
        nextArray[index] = value;
        delta.writes += 1;
      }
    });
    nextHighlights.overwriting = step.indices;
  }

  if (step.type === "markSorted") {
    step.indices.forEach((index) => sorted.add(index));
  }

  nextHighlights.sorted = Array.from(sorted).sort((a, b) => a - b);

  return { array: nextArray, highlights: nextHighlights, delta };
}

export function markEveryIndex(length: number, pseudocodeLine = 0): AnimationStep {
  return markSortedStep(
    Array.from({ length }, (_, index) => index),
    pseudocodeLine,
  );
}
