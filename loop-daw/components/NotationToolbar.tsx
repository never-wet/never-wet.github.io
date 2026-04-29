"use client";

import { Eraser, Music, Pause, Trash2 } from "lucide-react";
import { NOTATION_DURATIONS, TIME_SIGNATURES, type TimeSignature } from "../lib/notation";
import { useDAWStore } from "../store/useDAWStore";

export function NotationToolbar() {
  const selectedDuration = useDAWStore((state) => state.selectedNotationDuration);
  const notationTool = useDAWStore((state) => state.notationTool);
  const selectedStaff = useDAWStore((state) => state.selectedNotationStaff);
  const timeSignature = useDAWStore((state) => state.timeSignature);
  const setNotationDuration = useDAWStore((state) => state.setNotationDuration);
  const setNotationTool = useDAWStore((state) => state.setNotationTool);
  const setNotationStaff = useDAWStore((state) => state.setNotationStaff);
  const setTimeSignature = useDAWStore((state) => state.setTimeSignature);
  const clearNotation = useDAWStore((state) => state.clearNotation);

  return (
    <section className="min-h-0 overflow-auto rounded-lg border border-white/10 bg-[#11151a]/85 p-3">
      <div className="mb-4">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-violet-200">Classic Tools</p>
        <h2 className="text-sm font-black text-white">Notation editor</h2>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <span className="text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">Duration</span>
          <div className="grid grid-cols-2 gap-2">
            {NOTATION_DURATIONS.map((duration) => (
              <button
                className={`h-10 rounded-md border text-xs font-black transition ${
                  selectedDuration === duration.value
                    ? "border-violet-300/40 bg-violet-300/15 text-violet-100"
                    : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.07]"
                }`}
                key={duration.value}
                onClick={() => setNotationDuration(duration.value)}
                type="button"
              >
                {duration.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-black ${
              notationTool === "note" ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.035] text-slate-300"
            }`}
            onClick={() => setNotationTool("note")}
            type="button"
          >
            <Music size={14} />
            Note
          </button>
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-black ${
              notationTool === "rest" ? "border-amber-300/40 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/[0.035] text-slate-300"
            }`}
            onClick={() => setNotationTool("rest")}
            type="button"
          >
            <Pause size={14} />
            Rest
          </button>
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-black ${
              notationTool === "erase" ? "border-rose-300/40 bg-rose-300/15 text-rose-100" : "border-white/10 bg-white/[0.035] text-slate-300"
            }`}
            onClick={() => setNotationTool("erase")}
            type="button"
          >
            <Eraser size={14} />
            Erase
          </button>
        </div>

        <label className="grid gap-1 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Clef Target
          <select
            className="h-10 rounded-md border border-white/10 bg-[#0b0f14] px-2 text-sm font-bold text-slate-100 outline-none"
            onChange={(event) => setNotationStaff(event.target.value === "bass" ? "bass" : "treble")}
            value={selectedStaff}
          >
            <option value="treble">Treble staff</option>
            <option value="bass">Bass staff</option>
          </select>
        </label>

        <label className="grid gap-1 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Time Signature
          <select
            className="h-10 rounded-md border border-white/10 bg-[#0b0f14] px-2 text-sm font-bold text-slate-100 outline-none"
            onChange={(event) => setTimeSignature(event.target.value as TimeSignature)}
            value={timeSignature}
          >
            {TIME_SIGNATURES.map((signature) => (
              <option key={signature.value} value={signature.value}>
                {signature.value}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-400">
          Select a duration, click the staff, and the note appears. Click an existing beat to select and hear it.
        </div>

        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] text-xs font-black text-slate-300 transition hover:bg-white/[0.07]"
          onClick={clearNotation}
          type="button"
        >
          <Trash2 size={14} />
          Clear Sheet
        </button>
      </div>
    </section>
  );
}
