"use client";

import { Trash2, Upload } from "lucide-react";

import { PanelSection } from "@/components/ui/PanelSection";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

export function PresetManager() {
  const savedPresets = usePlaygroundStore((state) => state.savedPresets);
  const loadSavedPreset = usePlaygroundStore((state) => state.loadSavedPreset);
  const deleteSavedPreset = usePlaygroundStore((state) => state.deleteSavedPreset);

  return (
    <PanelSection title="Saved Presets">
      {savedPresets.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-400">Saved parameter sets will appear here.</p>
      ) : (
        <div className="grid gap-2">
          {savedPresets.map((preset) => (
            <div key={preset.name} className="grid gap-2 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{preset.name}</p>
                <p className="text-xs text-slate-500">{new Date(preset.createdAt).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] text-xs font-semibold text-slate-200 hover:bg-white/[0.09]"
                  type="button"
                  onClick={() => loadSavedPreset(preset.name)}
                >
                  <Upload size={14} />
                  Load
                </button>
                <button
                  className="flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] text-xs font-semibold text-slate-200 hover:bg-white/[0.09]"
                  type="button"
                  onClick={() => deleteSavedPreset(preset.name)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelSection>
  );
}
