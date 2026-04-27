"use client";

import { Activity, Box, Gauge, GitBranch, Zap } from "lucide-react";

import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

export function DebugOverlay() {
  const debug = usePlaygroundStore((state) => state.debug);
  const metrics = usePlaygroundStore((state) => state.metrics);

  if (!debug) {
    return null;
  }

  const items = [
    { label: "FPS", value: metrics.fps.toFixed(0), icon: Gauge },
    { label: "Bodies", value: metrics.bodyCount.toString(), icon: Box },
    { label: "Constraints", value: metrics.constraintCount.toString(), icon: GitBranch },
    { label: "Step", value: `${metrics.timestep.toFixed(2)}ms`, icon: Activity },
    { label: "Collisions", value: metrics.collisions.toString(), icon: Zap },
    { label: "Energy", value: metrics.kineticEnergy.toFixed(1), icon: Activity }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-white/[0.035] p-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-sm bg-white/[0.04] px-2 py-2">
            <Icon className="shrink-0 text-teal-200" size={15} />
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</span>
              <span className="block truncate font-mono text-xs text-slate-100">{item.value}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
