"use client";

import {
  BarChart3,
  GitCompareArrows,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
} from "lucide-react";
import { algorithmMetadata, algorithmOrder, type AlgorithmKey } from "@/lib/sortingAlgorithms";
import { useSortingStore } from "@/store/useSortingStore";

export function ControlPanel() {
  const store = useSortingStore();
  const isSorting = store.runStatus === "sorting";
  const isPaused = store.runStatus === "paused";
  const isLocked = isSorting || isPaused;
  const progress = store.steps.length ? Math.round((store.stepIndex / store.steps.length) * 100) : 0;

  return (
    <section className="panel grid gap-3 p-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr]">
        <label className="grid gap-1">
          <span className="control-label">Algorithm</span>
          <select
            className="field"
            value={store.algorithm}
            disabled={isLocked}
            onChange={(event) => store.setAlgorithm(event.target.value as AlgorithmKey)}
          >
            {algorithmOrder.map((key) => (
              <option key={key} value={key}>
                {algorithmMetadata[key].name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="control-label">Compare With</span>
          <select
            className="field"
            value={store.secondaryAlgorithm}
            disabled={isLocked || !store.comparisonMode}
            onChange={(event) => store.setSecondaryAlgorithm(event.target.value as AlgorithmKey)}
          >
            {algorithmOrder.map((key) => (
              <option key={key} value={key}>
                {algorithmMetadata[key].name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-black/10 bg-white px-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan"
            checked={store.comparisonMode}
            disabled={isLocked}
            onChange={(event) => store.setComparisonMode(event.target.checked)}
          />
          <GitCompareArrows size={18} className="text-cyan" />
          <span className="text-sm font-extrabold">Comparison</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="control-label">Array Size</span>
            <strong className="text-sm">{store.arraySize}</strong>
          </span>
          <input
            className="range-track"
            type="range"
            min="8"
            max="200"
            value={store.arraySize}
            disabled={isLocked}
            onChange={(event) => store.setArraySize(Number(event.target.value))}
          />
        </label>

        <label className="grid gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="control-label">Speed</span>
            <strong className="text-sm">{store.speed}%</strong>
          </span>
          <input
            className="range-track"
            type="range"
            min="1"
            max="100"
            value={store.speed}
            onChange={(event) => store.setSpeed(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-[repeat(5,minmax(48px,auto))]">
        <button
          type="button"
          className="icon-button icon-button-dark col-span-2 sm:col-span-1"
          onClick={store.startSorting}
          disabled={isSorting || isPaused}
          aria-label="Start sorting"
          title="Start"
        >
          <Play size={18} />
          <span className="sm:hidden">{store.runStatus === "completed" ? "Again" : "Start"}</span>
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={isSorting ? store.pauseSorting : store.resumeSorting}
          disabled={!isSorting && !isPaused}
          aria-label={isSorting ? "Pause sorting" : "Resume sorting"}
          title={isSorting ? "Pause" : "Resume"}
        >
          {isSorting ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={store.stepForward}
          disabled={isSorting || store.runStatus === "completed"}
          aria-label="Step forward"
          title="Step forward"
        >
          <SkipForward size={18} />
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={store.randomizeArray}
          disabled={isLocked}
          aria-label="Randomize array"
          title="Randomize"
        >
          <Shuffle size={18} />
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={store.reset}
          aria-label="Reset array"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs font-extrabold text-black/50 lg:col-span-3">
        <BarChart3 size={16} />
        <span className="capitalize">{store.runStatus}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">
          <span className="block h-full rounded-full bg-cyan transition-all" style={{ width: `${progress}%` }} />
        </span>
        <span>{progress}%</span>
      </div>
    </section>
  );
}
