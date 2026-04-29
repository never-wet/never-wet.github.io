"use client";

import { Bot, Drum, Sparkles } from "lucide-react";
import { generateArrangement, generateAutoDrums, generateChordRecommendation, STYLE_PRESETS } from "../lib/aiComposer";
import { CHORD_PROGRESSIONS, KEYS, SCALES } from "../lib/musicTheory";
import { useDAWStore, type StyleId } from "../store/useDAWStore";

export function AIComposerPanel() {
  const keyName = useDAWStore((state) => state.key);
  const scale = useDAWStore((state) => state.scale);
  const selectedStyle = useDAWStore((state) => state.selectedStyle);
  const selectedProgression = useDAWStore((state) => state.selectedProgression);
  const setKey = useDAWStore((state) => state.setKey);
  const setScale = useDAWStore((state) => state.setScale);
  const setStyle = useDAWStore((state) => state.setStyle);
  const setProgression = useDAWStore((state) => state.setProgression);
  const replaceArrangement = useDAWStore((state) => state.replaceArrangement);
  const setTrackNotes = useDAWStore((state) => state.setTrackNotes);
  const setDrumPattern = useDAWStore((state) => state.setDrumPattern);

  return (
    <section className="rounded-lg border border-white/10 bg-[#11151a]/80 p-3">
      <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
        <Bot size={15} />
        AI Composer
      </div>

      <div className="grid gap-2">
        <label className="grid gap-1 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Style
          <select
            className="h-9 rounded-md border border-white/10 bg-[#0b0f14] px-2 text-sm font-bold text-slate-100 outline-none"
            onChange={(event) => setStyle(event.target.value as StyleId)}
            value={selectedStyle}
          >
            {STYLE_PRESETS.map((style) => (
              <option key={style.id} value={style.id}>
                {style.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
            Key
            <select
              className="h-9 rounded-md border border-white/10 bg-[#0b0f14] px-2 text-sm font-bold text-slate-100 outline-none"
              onChange={(event) => setKey(event.target.value as typeof keyName)}
              value={keyName}
            >
              {KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
            Scale
            <select
              className="h-9 rounded-md border border-white/10 bg-[#0b0f14] px-2 text-sm font-bold text-slate-100 outline-none"
              onChange={(event) => setScale(event.target.value as typeof scale)}
              value={scale}
            >
              {SCALES.map((scaleName) => (
                <option key={scaleName} value={scaleName}>
                  {scaleName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-1">
          <span className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">Progression</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CHORD_PROGRESSIONS.map((progression) => (
              <button
                className={`min-h-8 rounded-md border px-2 text-xs font-black transition ${
                  selectedProgression === progression.name
                    ? "border-violet-300/40 bg-violet-300/15 text-violet-100"
                    : "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.07]"
                }`}
                key={progression.id}
                onClick={() => setProgression(progression.name)}
                type="button"
              >
                {progression.name}
              </button>
            ))}
          </div>
        </div>

        <button
          className="mt-1 flex h-10 items-center justify-center gap-2 rounded-md border border-violet-300/30 bg-violet-300/12 text-sm font-black text-violet-100 transition hover:bg-violet-300/20"
          onClick={() => replaceArrangement(generateArrangement(selectedStyle, keyName, scale))}
          type="button"
        >
          <Sparkles size={15} />
          Generate Style
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] text-xs font-black text-slate-300 transition hover:bg-white/[0.07]"
            onClick={() => setTrackNotes("chords", generateChordRecommendation(keyName, scale, selectedProgression))}
            type="button"
          >
            <Sparkles size={14} />
            Chords
          </button>
          <button
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] text-xs font-black text-slate-300 transition hover:bg-white/[0.07]"
            onClick={() => setDrumPattern(generateAutoDrums(selectedStyle))}
            type="button"
          >
            <Drum size={14} />
            Drums
          </button>
        </div>
      </div>
    </section>
  );
}
