"use client";

import type { ReactNode } from "react";

import { getExperiment } from "@/experiments/presets";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

export function SceneRenderer({ children }: { children: ReactNode }) {
  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const paused = usePlaygroundStore((state) => state.paused);
  const experiment = getExperiment(experimentId);

  return (
    <main className="relative order-1 min-h-[560px] min-w-0 flex-1 overflow-hidden bg-slate-950 lg:order-none">
      <div className="pointer-events-none absolute left-4 top-4 z-10 grid gap-1 rounded-md border border-white/10 bg-slate-950/68 px-3 py-2 backdrop-blur-xl">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{experiment.engine === "rapier3d" ? "3D physics world" : "2D physics world"}</span>
        <span className="text-sm font-semibold text-slate-50">{experiment.name}</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-md border border-white/10 bg-slate-950/68 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 backdrop-blur-xl">
        {paused ? "Paused" : "Running"}
      </div>
      {children}
    </main>
  );
}
