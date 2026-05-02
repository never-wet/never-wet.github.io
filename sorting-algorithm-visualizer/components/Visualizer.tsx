"use client";

import { useMemo } from "react";
import { algorithmMetadata, type AlgorithmKey } from "@/lib/sortingAlgorithms";
import type { HighlightState } from "@/lib/animationSteps";
import { type SortStats, useSortingStore } from "@/store/useSortingStore";

export function Visualizer() {
  const store = useSortingStore();
  const chartGridClass = store.comparisonMode
    ? "grid min-h-0 gap-3 2xl:grid-cols-2"
    : "grid min-h-0 gap-3";

  return (
    <section className="panel grid min-h-[460px] grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden p-3 xl:min-h-0">
      <div className={chartGridClass}>
        <VisualizerChart
          title={algorithmMetadata[store.algorithm].name}
          algorithm={store.algorithm}
          array={store.array}
          highlights={store.highlights}
          stats={store.stats}
          totalSteps={store.steps.length}
        />

        {store.comparisonMode && store.comparison ? (
          <VisualizerChart
            title={algorithmMetadata[store.secondaryAlgorithm].name}
            algorithm={store.secondaryAlgorithm}
            array={store.comparison.array}
            highlights={store.comparison.highlights}
            stats={store.comparison.stats}
            totalSteps={store.comparison.steps.length}
          />
        ) : null}
      </div>

      <Legend />
    </section>
  );
}

interface VisualizerChartProps {
  title: string;
  algorithm: AlgorithmKey;
  array: number[];
  highlights: HighlightState;
  stats: SortStats;
  totalSteps: number;
}

function VisualizerChart({ title, algorithm, array, highlights, stats, totalSteps }: VisualizerChartProps) {
  const max = useMemo(() => Math.max(...array, 1), [array]);
  const sorted = useMemo(() => new Set(highlights.sorted), [highlights.sorted]);
  const comparing = useMemo(() => new Set(highlights.comparing), [highlights.comparing]);
  const swapping = useMemo(() => new Set(highlights.swapping), [highlights.swapping]);
  const overwriting = useMemo(() => new Set(highlights.overwriting), [highlights.overwriting]);
  const showValues = array.length <= 54;
  const progress = totalSteps ? Math.round((stats.steps / totalSteps) * 100) : 0;
  const barMinWidth = array.length > 120 ? 1 : 2;
  const barGap = array.length > 120 ? 1 : 2;

  return (
    <article className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-lg border border-black/10 bg-white/60 p-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="control-label">{algorithmMetadata[algorithm].stable === "Yes" ? "Stable" : "Visualizer"}</p>
          <h2 className="truncate text-lg font-black">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black text-black/55">
          <span className="rounded-full bg-white px-3 py-1">{stats.comparisons} cmp</span>
          <span className="rounded-full bg-white px-3 py-1">{stats.swaps + stats.writes} moves</span>
          <span className="rounded-full bg-white px-3 py-1">{progress}%</span>
        </div>
      </div>

      <div
        className="grid h-[clamp(280px,52vh,620px)] min-h-0 min-w-0 items-end overflow-hidden rounded-lg border border-black/10 bg-[#eef0e8] px-2 pb-3 pt-6"
        style={{
          gridTemplateColumns: `repeat(${array.length}, minmax(${barMinWidth}px, 1fr))`,
          columnGap: `${barGap}px`,
        }}
        aria-label={`${title} bar visualization`}
      >
        {array.map((value, index) => {
          const state = getBarState(index, value, max, highlights, sorted, comparing, swapping, overwriting);
          return (
            <div
              key={`${index}-${array.length}`}
              className={`bar-item relative rounded-t-[5px] ${state.className}`}
              title={`Index ${index}: ${value}`}
              style={{
                height: `${Math.max(5, (value / max) * 100)}%`,
                background: state.background,
                opacity: state.opacity,
                boxShadow: state.boxShadow,
                outline: state.outline,
                filter: state.filter,
              }}
            >
              {showValues ? (
                <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[0.58rem] font-black text-black/45">
                  {value}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function getBarState(
  index: number,
  value: number,
  max: number,
  highlights: HighlightState,
  sorted: Set<number>,
  comparing: Set<number>,
  swapping: Set<number>,
  overwriting: Set<number>,
) {
  const inActiveRange =
    !highlights.activeRange || (index >= highlights.activeRange[0] && index <= highlights.activeRange[1]);
  const classNames: string[] = [];
  const hue = 205 - (value / max) * 165;
  const background = `linear-gradient(180deg, hsl(${hue} 82% 62%), hsl(${hue + 8} 72% 42%))`;
  let opacity = inActiveRange ? 1 : 0.36;
  let outline = "1px solid rgba(24, 33, 47, 0.08)";
  let boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.36)";
  let filter = "saturate(1)";

  if (sorted.has(index)) {
    opacity = 1;
    outline = "2px solid var(--sorted)";
    boxShadow = "0 0 0 3px rgba(47, 191, 159, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.38)";
    filter = "saturate(1.08) brightness(1.04)";
  }
  if (comparing.has(index)) {
    classNames.push("is-active");
    outline = "2px solid var(--compare)";
    boxShadow = "0 0 0 4px rgba(42, 159, 214, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.42)";
    opacity = 1;
  }
  if (overwriting.has(index)) {
    classNames.push("is-active", "is-overwrite");
    outline = "2px solid var(--overwrite)";
    boxShadow = "0 0 0 4px rgba(229, 140, 53, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.42)";
    opacity = 1;
  }
  if (swapping.has(index)) {
    classNames.push("is-active", "is-swap");
    outline = "2px solid var(--swap)";
    boxShadow = "0 0 0 5px rgba(242, 95, 92, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.42)";
    opacity = 1;
  }
  if (highlights.pivotIndex === index) {
    classNames.push("is-active");
    outline = "2px solid var(--pivot)";
    boxShadow = "0 0 0 5px rgba(242, 183, 5, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.44)";
    filter = "saturate(1.15) brightness(1.08)";
    opacity = 1;
  }

  return { background, opacity, outline, boxShadow, filter, className: classNames.join(" ") };
}

function Legend() {
  const items = [
    ["Value color", "linear-gradient(180deg, hsl(195 82% 62%), hsl(96 72% 42%))"],
    ["Comparing", "var(--compare)"],
    ["Swapping", "var(--swap)"],
    ["Pivot", "var(--pivot)"],
    ["Sorted", "var(--sorted)"],
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white/55 p-3 text-xs font-extrabold text-black/55">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1">
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
      <span className="ml-auto text-black/40">A bar keeps its value color as it moves; states appear as outlines.</span>
    </div>
  );
}
