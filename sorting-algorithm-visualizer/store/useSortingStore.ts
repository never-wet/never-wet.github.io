"use client";

import { useSyncExternalStore } from "react";
import {
  type HighlightState,
  applyAnimationStep,
  emptyHighlights,
} from "@/lib/animationSteps";
import {
  type AlgorithmKey,
  algorithmMetadata,
  getAnimationSteps,
} from "@/lib/sortingAlgorithms";

export type RunStatus = "idle" | "sorting" | "paused" | "completed";

export interface SortStats {
  comparisons: number;
  swaps: number;
  writes: number;
  steps: number;
  elapsedMs: number;
}

export interface ComparisonRunState {
  array: number[];
  steps: ReturnType<typeof getAnimationSteps>;
  stepIndex: number;
  highlights: HighlightState;
  stats: SortStats;
}

export interface SortingState {
  algorithm: AlgorithmKey;
  secondaryAlgorithm: AlgorithmKey;
  comparisonMode: boolean;
  array: number[];
  initialArray: number[];
  arraySize: number;
  speed: number;
  runStatus: RunStatus;
  steps: ReturnType<typeof getAnimationSteps>;
  stepIndex: number;
  highlights: HighlightState;
  stats: SortStats;
  comparison: ComparisonRunState | null;
}

export interface SortingActions {
  setAlgorithm: (algorithm: AlgorithmKey) => void;
  setSecondaryAlgorithm: (algorithm: AlgorithmKey) => void;
  setArraySize: (size: number) => void;
  setSpeed: (speed: number) => void;
  setComparisonMode: (enabled: boolean) => void;
  randomizeArray: () => void;
  startSorting: () => void;
  pauseSorting: () => void;
  resumeSorting: () => void;
  stepForward: () => void;
  reset: () => void;
}

export type SortingStore = SortingState & SortingActions;

const DEFAULT_SIZE = 52;
const DEFAULT_SPEED = 56;

let animationFrame = 0;
let lastFrameTime = 0;
let runStartedAt = 0;
let elapsedBeforeRun = 0;

const subscribers = new Set<() => void>();

function createStats(): SortStats {
  return {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    steps: 0,
    elapsedMs: 0,
  };
}

function createRandomArray(size: number) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 94) + 6);
}

function createSeededArray(size: number, seed = 13579) {
  let value = seed;
  return Array.from({ length: size }, () => {
    value = (value * 48271) % 2147483647;
    return (value % 94) + 6;
  });
}

function cloneHighlights(highlights: HighlightState = emptyHighlights): HighlightState {
  return {
    comparing: [...highlights.comparing],
    swapping: [...highlights.swapping],
    overwriting: [...highlights.overwriting],
    sorted: [...highlights.sorted],
    pivotIndex: highlights.pivotIndex,
    activeRange: highlights.activeRange ? [highlights.activeRange[0], highlights.activeRange[1]] : null,
    pseudocodeLine: highlights.pseudocodeLine,
  };
}

const initialArray = createSeededArray(DEFAULT_SIZE);

let state: SortingState = {
  algorithm: "quick",
  secondaryAlgorithm: "merge",
  comparisonMode: false,
  array: initialArray,
  initialArray,
  arraySize: DEFAULT_SIZE,
  speed: DEFAULT_SPEED,
  runStatus: "idle",
  steps: [],
  stepIndex: 0,
  highlights: cloneHighlights(),
  stats: createStats(),
  comparison: null,
};

const actions: SortingActions = {
  setAlgorithm(algorithm) {
    if (isLocked()) return;
    setState({ algorithm, highlights: cloneHighlights(), steps: [], stepIndex: 0, stats: createStats() });
  },
  setSecondaryAlgorithm(algorithm) {
    if (isLocked()) return;
    setState((current) => ({
      secondaryAlgorithm: algorithm,
      comparison: current.comparisonMode ? createComparisonRun(current.initialArray, algorithm, false) : null,
    }));
  },
  setArraySize(size) {
    if (isLocked()) return;
    stopLoop();
    const nextSize = clamp(Math.round(size), 8, 200);
    const nextArray = createRandomArray(nextSize);
    setState((current) => ({
      arraySize: nextSize,
      array: nextArray,
      initialArray: nextArray,
      runStatus: "idle",
      steps: [],
      stepIndex: 0,
      highlights: cloneHighlights(),
      stats: createStats(),
      comparison: current.comparisonMode ? createComparisonRun(nextArray, current.secondaryAlgorithm, false) : null,
    }));
  },
  setSpeed(speed) {
    setState({ speed: clamp(Math.round(speed), 1, 100) });
  },
  setComparisonMode(enabled) {
    if (isLocked()) return;
    setState((current) => ({
      comparisonMode: enabled,
      comparison: enabled ? createComparisonRun(current.initialArray, current.secondaryAlgorithm, false) : null,
    }));
  },
  randomizeArray() {
    if (isLocked()) return;
    stopLoop();
    const nextArray = createRandomArray(state.arraySize);
    setState((current) => ({
      array: nextArray,
      initialArray: nextArray,
      runStatus: "idle",
      steps: [],
      stepIndex: 0,
      highlights: cloneHighlights(),
      stats: createStats(),
      comparison: current.comparisonMode ? createComparisonRun(nextArray, current.secondaryAlgorithm, false) : null,
    }));
  },
  startSorting() {
    if (state.runStatus === "sorting") return;
    stopLoop();
    const sourceArray = state.runStatus === "completed" ? state.initialArray : state.array;
    const primarySteps = getAnimationSteps(state.algorithm, sourceArray);
    const comparison = state.comparisonMode ? createComparisonRun(sourceArray, state.secondaryAlgorithm, true) : null;

    elapsedBeforeRun = 0;
    runStartedAt = performance.now();
    lastFrameTime = runStartedAt;

    setState({
      array: [...sourceArray],
      initialArray: [...sourceArray],
      runStatus: primarySteps.length || comparison?.steps.length ? "sorting" : "completed",
      steps: primarySteps,
      stepIndex: 0,
      highlights: cloneHighlights(),
      stats: createStats(),
      comparison,
    });
    startLoop();
  },
  pauseSorting() {
    if (state.runStatus !== "sorting") return;
    elapsedBeforeRun = currentElapsed();
    stopLoop();
    setState((current) => ({
      runStatus: "paused",
      stats: { ...current.stats, elapsedMs: elapsedBeforeRun },
      comparison: current.comparison
        ? { ...current.comparison, stats: { ...current.comparison.stats, elapsedMs: elapsedBeforeRun } }
        : null,
    }));
  },
  resumeSorting() {
    if (state.runStatus !== "paused") return;
    runStartedAt = performance.now();
    lastFrameTime = runStartedAt;
    setState({ runStatus: "sorting" });
    startLoop();
  },
  stepForward() {
    if (state.runStatus === "sorting" || state.runStatus === "completed") return;

    if (state.steps.length === 0) {
      const sourceArray = state.runStatus === "idle" ? state.array : state.initialArray;
      setState((current) => ({
        array: [...sourceArray],
        initialArray: [...sourceArray],
        runStatus: "paused",
        steps: getAnimationSteps(current.algorithm, sourceArray),
        stepIndex: 0,
        highlights: cloneHighlights(),
        stats: createStats(),
        comparison: current.comparisonMode ? createComparisonRun(sourceArray, current.secondaryAlgorithm, true) : null,
      }));
    }

    applyNextTick();
  },
  reset() {
    stopLoop();
    elapsedBeforeRun = 0;
    setState((current) => ({
      array: [...current.initialArray],
      runStatus: "idle",
      steps: [],
      stepIndex: 0,
      highlights: cloneHighlights(),
      stats: createStats(),
      comparison: current.comparisonMode ? createComparisonRun(current.initialArray, current.secondaryAlgorithm, false) : null,
    }));
  },
};

let snapshot: SortingStore = { ...state, ...actions };

export function useSortingStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return snapshot;
}

function setState(update: Partial<SortingState> | ((current: SortingState) => Partial<SortingState>)) {
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  snapshot = { ...state, ...actions };
  subscribers.forEach((callback) => callback());
}

function isLocked() {
  return state.runStatus === "sorting" || state.runStatus === "paused";
}

function createComparisonRun(array: number[], algorithm: AlgorithmKey, withSteps: boolean): ComparisonRunState {
  return {
    array: [...array],
    steps: withSteps ? getAnimationSteps(algorithm, array) : [],
    stepIndex: 0,
    highlights: cloneHighlights(),
    stats: createStats(),
  };
}

function startLoop() {
  stopLoop();
  const tick = (time: number) => {
    if (state.runStatus !== "sorting") return;
    const delay = delayForSpeed(state.speed);
    if (time - lastFrameTime >= delay) {
      const iterations = stepsPerFrame(state.speed);
      for (let count = 0; count < iterations; count += 1) {
        if (!applyNextTick()) break;
      }
      lastFrameTime = time;
    }
    animationFrame = requestAnimationFrame(tick);
  };

  animationFrame = requestAnimationFrame(tick);
}

function stopLoop() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

function applyNextTick() {
  const hasPrimary = state.stepIndex < state.steps.length;
  const hasSecondary = Boolean(state.comparison && state.comparison.stepIndex < state.comparison.steps.length);

  if (!hasPrimary && !hasSecondary) {
    completeRun();
    return false;
  }

  const elapsedMs = state.runStatus === "sorting" ? currentElapsed() : state.stats.elapsedMs;
  let nextArray = state.array;
  let nextStepIndex = state.stepIndex;
  let nextHighlights = state.highlights;
  let nextStats = { ...state.stats, elapsedMs };

  if (hasPrimary) {
    const result = applyAnimationStep(state.array, state.highlights, state.steps[state.stepIndex]);
    nextArray = result.array;
    nextHighlights = result.highlights;
    nextStepIndex += 1;
    nextStats = {
      comparisons: nextStats.comparisons + result.delta.comparisons,
      swaps: nextStats.swaps + result.delta.swaps,
      writes: nextStats.writes + result.delta.writes,
      steps: nextStepIndex,
      elapsedMs,
    };
  }

  let nextComparison = state.comparison;
  if (state.comparison && hasSecondary) {
    const result = applyAnimationStep(
      state.comparison.array,
      state.comparison.highlights,
      state.comparison.steps[state.comparison.stepIndex],
    );
    nextComparison = {
      ...state.comparison,
      array: result.array,
      highlights: result.highlights,
      stepIndex: state.comparison.stepIndex + 1,
      stats: {
        comparisons: state.comparison.stats.comparisons + result.delta.comparisons,
        swaps: state.comparison.stats.swaps + result.delta.swaps,
        writes: state.comparison.stats.writes + result.delta.writes,
        steps: state.comparison.stepIndex + 1,
        elapsedMs,
      },
    };
  } else if (state.comparison) {
    nextComparison = {
      ...state.comparison,
      stats: {
        ...state.comparison.stats,
        elapsedMs,
      },
    };
  }

  setState({
    array: nextArray,
    stepIndex: nextStepIndex,
    highlights: nextHighlights,
    stats: nextStats,
    comparison: nextComparison,
  });

  const primaryDone = nextStepIndex >= state.steps.length;
  const secondaryDone = !nextComparison || nextComparison.stepIndex >= nextComparison.steps.length;
  if (primaryDone && secondaryDone) {
    completeRun();
    return false;
  }

  return true;
}

function completeRun() {
  stopLoop();
  const elapsedMs = state.runStatus === "sorting" ? currentElapsed() : state.stats.elapsedMs;
  const allIndices = Array.from({ length: state.array.length }, (_, index) => index);
  setState((current) => ({
    runStatus: "completed",
    highlights: {
      ...current.highlights,
      comparing: [],
      swapping: [],
      overwriting: [],
      sorted: allIndices,
      pivotIndex: null,
      activeRange: null,
    },
    stats: {
      ...current.stats,
      elapsedMs,
    },
    comparison: current.comparison
      ? {
          ...current.comparison,
          highlights: {
            ...current.comparison.highlights,
            comparing: [],
            swapping: [],
            overwriting: [],
            sorted: allIndices,
            pivotIndex: null,
            activeRange: null,
          },
          stats: {
            ...current.comparison.stats,
            elapsedMs,
          },
        }
      : null,
  }));
}

function currentElapsed() {
  if (!runStartedAt) return elapsedBeforeRun;
  return elapsedBeforeRun + performance.now() - runStartedAt;
}

function delayForSpeed(speed: number) {
  const eased = speed / 100;
  return Math.max(8, 330 - eased * 318);
}

function stepsPerFrame(speed: number) {
  if (speed > 92) return 5;
  if (speed > 82) return 3;
  if (speed > 68) return 2;
  return 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getSelectedAlgorithmName(key: AlgorithmKey) {
  return algorithmMetadata[key].name;
}
