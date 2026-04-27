"use client";

import { Bug, Gauge, Pause, Play, RotateCcw, Route, Save, SkipForward, Sparkles } from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

export function TopBar() {
  const paused = usePlaygroundStore((state) => state.paused);
  const debug = usePlaygroundStore((state) => state.debug);
  const showVectors = usePlaygroundStore((state) => state.showVectors);
  const showTrails = usePlaygroundStore((state) => state.showTrails);
  const showForces = usePlaygroundStore((state) => state.showForces);
  const togglePaused = usePlaygroundStore((state) => state.togglePaused);
  const toggleDebug = usePlaygroundStore((state) => state.toggleDebug);
  const toggleVectors = usePlaygroundStore((state) => state.toggleVectors);
  const toggleTrails = usePlaygroundStore((state) => state.toggleTrails);
  const toggleForces = usePlaygroundStore((state) => state.toggleForces);
  const reset = usePlaygroundStore((state) => state.reset);
  const step = usePlaygroundStore((state) => state.step);
  const saveCurrentPreset = usePlaygroundStore((state) => state.saveCurrentPreset);

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-teal-200">Physics Engine Playground</p>
        <h1 className="truncate text-lg font-semibold text-slate-50">Interactive Simulation Laboratory</h1>
      </div>
      <div className="flex max-w-full shrink-0 items-center gap-2 overflow-x-auto">
        <IconButton active={!paused} label={paused ? "Play simulation" : "Pause simulation"} onClick={togglePaused}>
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </IconButton>
        <IconButton label="Step one physics frame" onClick={step}>
          <SkipForward size={18} />
        </IconButton>
        <IconButton label="Reset simulation" onClick={reset}>
          <RotateCcw size={18} />
        </IconButton>
        <IconButton label="Save current preset" onClick={saveCurrentPreset}>
          <Save size={18} />
        </IconButton>
        <div className="mx-1 h-7 w-px bg-white/10" />
        <IconButton active={showVectors} label="Toggle velocity vectors" onClick={toggleVectors}>
          <Gauge size={18} />
        </IconButton>
        <IconButton active={showForces} label="Toggle force arrows" onClick={toggleForces}>
          <Sparkles size={18} />
        </IconButton>
        <IconButton active={showTrails} label="Toggle trails" onClick={toggleTrails}>
          <Route size={18} />
        </IconButton>
        <IconButton active={debug} label="Toggle debug overlay" onClick={toggleDebug}>
          <Bug size={18} />
        </IconButton>
      </div>
    </header>
  );
}
