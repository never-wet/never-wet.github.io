"use client";

import { Activity, Timer } from "lucide-react";
import { algorithmMetadata } from "@/lib/sortingAlgorithms";
import { type SortStats, useSortingStore } from "@/store/useSortingStore";

export function StatsPanel() {
  const store = useSortingStore();

  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e8f4fb] text-cyan">
            <Activity size={20} />
          </span>
          <div>
            <p className="control-label">Live Stats</p>
            <h2 className="text-xl font-black capitalize">{store.runStatus}</h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-black/55">
          <Timer size={16} />
          {formatMs(store.stats.elapsedMs)}
        </span>
      </div>

      <div className={`grid gap-3 ${store.comparisonMode ? "md:grid-cols-2 xl:grid-cols-1" : ""}`}>
        <StatGroup
          title={algorithmMetadata[store.algorithm].name}
          stats={store.stats}
          stepIndex={store.stepIndex}
          totalSteps={store.steps.length}
        />

        {store.comparisonMode && store.comparison ? (
          <StatGroup
            title={algorithmMetadata[store.secondaryAlgorithm].name}
            stats={store.comparison.stats}
            stepIndex={store.comparison.stepIndex}
            totalSteps={store.comparison.steps.length}
          />
        ) : null}
      </div>
    </section>
  );
}

function StatGroup({
  title,
  stats,
  stepIndex,
  totalSteps,
}: {
  title: string;
  stats: SortStats;
  stepIndex: number;
  totalSteps: number;
}) {
  const progress = totalSteps ? Math.round((stepIndex / totalSteps) * 100) : 0;

  return (
    <article className="rounded-lg border border-black/10 bg-white/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-black">{title}</h3>
        <span className="rounded-full bg-[#e9f7f2] px-2 py-1 text-xs font-black text-[#166d5b]">{progress}%</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Comparisons" value={stats.comparisons} />
        <Metric label="Swaps" value={stats.swaps} />
        <Metric label="Writes" value={stats.writes} />
        <Metric label="Steps" value={stats.steps} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-cell">
      <span className="block text-[0.65rem] font-black uppercase tracking-[0.14em] text-black/40">{label}</span>
      <strong className="mt-1 block text-lg font-black">{value.toLocaleString()}</strong>
    </div>
  );
}

function formatMs(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
