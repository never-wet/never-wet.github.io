"use client";

import { LayoutGrid, Sheet } from "lucide-react";
import { stopSequencer } from "../lib/sequencer";
import { useDAWStore } from "../store/useDAWStore";
import type { CompositionMode } from "../lib/notation";

export function ClassicModeButton() {
  const mode = useDAWStore((state) => state.compositionMode);
  const setCompositionMode = useDAWStore((state) => state.setCompositionMode);

  const changeMode = (nextMode: CompositionMode) => {
    stopSequencer();
    setCompositionMode(nextMode);
  };

  return (
    <div className="flex h-10 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
      <button
        className={`flex items-center gap-2 px-3 text-xs font-black transition ${
          mode === "modern" ? "bg-teal-300/15 text-teal-100" : "text-slate-400 hover:bg-white/[0.06]"
        }`}
        onClick={() => changeMode("modern")}
        type="button"
      >
        <LayoutGrid size={14} />
        Modern
      </button>
      <button
        className={`flex items-center gap-2 border-l border-white/10 px-3 text-xs font-black transition ${
          mode === "classic" ? "bg-violet-300/15 text-violet-100" : "text-slate-400 hover:bg-white/[0.06]"
        }`}
        onClick={() => changeMode("classic")}
        type="button"
      >
        <Sheet size={14} />
        Classic Mode
      </button>
    </div>
  );
}
