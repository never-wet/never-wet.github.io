"use client";

import { getExperiment } from "@/experiments/presets";
import { DebugOverlay } from "@/components/DebugOverlay";
import { ParameterSliders } from "@/components/ParameterSliders";
import { PresetManager } from "@/components/PresetManager";
import { PanelSection } from "@/components/ui/PanelSection";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

export function ControlPanel() {
  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const experiment = getExperiment(experimentId);

  return (
    <aside className="order-3 flex min-h-0 w-full flex-col gap-5 overflow-y-auto border-l border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl lg:order-none lg:w-[330px]">
      <section className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-50">{experiment.name}</h2>
          <span className="rounded-sm border border-teal-200/25 bg-teal-200/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100">
            {experiment.engine === "rapier3d" ? "Rapier 3D" : "Matter 2D"}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-400">{experiment.description}</p>
      </section>
      <PanelSection title="Debug Telemetry">
        <DebugOverlay />
      </PanelSection>
      <ParameterSliders />
      <PresetManager />
    </aside>
  );
}
