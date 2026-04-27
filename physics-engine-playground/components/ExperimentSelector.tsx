"use client";

import { Box, Orbit, Rows3, Waves } from "lucide-react";

import { ObjectSpawner } from "@/components/ObjectSpawner";
import { PanelSection } from "@/components/ui/PanelSection";
import { experimentPresets } from "@/experiments/presets";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

const iconForExperiment = {
  "gravity-sandbox": Orbit,
  "collision-lab": Box,
  "pendulum-spring": Rows3,
  "wind-aerodynamics": Waves,
  "orbit-gravity": Orbit,
  "magnet-field": Waves,
  "chain-ragdoll": Rows3,
  "gravity-3d": Box
};

export function ExperimentSelector() {
  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const setExperiment = usePlaygroundStore((state) => state.setExperiment);

  return (
    <aside className="order-2 flex min-h-0 w-full flex-col gap-5 overflow-y-auto border-r border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl lg:order-none lg:w-[300px]">
      <PanelSection title="Experiments">
        <div className="grid gap-2">
          {experimentPresets.map((experiment) => {
            const Icon = iconForExperiment[experiment.id];
            const active = experimentId === experiment.id;
            return (
              <button
                key={experiment.id}
                className={`grid gap-1 rounded-md border p-3 text-left transition ${
                  active
                    ? "border-teal-300/65 bg-teal-300/14 shadow-[0_0_28px_rgba(79,209,197,0.14)]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.065]"
                }`}
                type="button"
                onClick={() => setExperiment(experiment.id)}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-50">
                    <Icon className="shrink-0 text-teal-200" size={16} />
                    <span className="truncate">{experiment.name}</span>
                  </span>
                  <span className="rounded-sm border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {experiment.engine === "rapier3d" ? "3D" : "2D"}
                  </span>
                </span>
                <span className="text-xs leading-5 text-slate-400">{experiment.tagline}</span>
              </button>
            );
          })}
        </div>
      </PanelSection>
      <ObjectSpawner />
    </aside>
  );
}
