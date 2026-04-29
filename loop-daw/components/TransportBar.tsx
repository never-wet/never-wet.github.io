"use client";

import { useState } from "react";
import { Bot, Circle, Download, KeyboardMusic, Pause, Play, Repeat, Save, Square } from "lucide-react";
import { ClassicModeButton } from "./ClassicModeButton";
import { generateArrangement, generateNotationScore } from "../lib/aiComposer";
import { startSequencer, stopSequencer } from "../lib/sequencer";
import { useDAWStore } from "../store/useDAWStore";

export function TransportBar() {
  const [stopFlash, setStopFlash] = useState(false);
  const [isStartingPlayback, setIsStartingPlayback] = useState(false);
  const bpm = useDAWStore((state) => state.bpm);
  const isPlaying = useDAWStore((state) => state.isPlaying);
  const isRecording = useDAWStore((state) => state.isRecording);
  const loopEnabled = useDAWStore((state) => state.loopEnabled);
  const compositionMode = useDAWStore((state) => state.compositionMode);
  const key = useDAWStore((state) => state.key);
  const scale = useDAWStore((state) => state.scale);
  const selectedStyle = useDAWStore((state) => state.selectedStyle);
  const selectedNotationStaff = useDAWStore((state) => state.selectedNotationStaff);
  const timeSignature = useDAWStore((state) => state.timeSignature);
  const setBpm = useDAWStore((state) => state.setBpm);
  const setRecording = useDAWStore((state) => state.setRecording);
  const setLoopEnabled = useDAWStore((state) => state.setLoopEnabled);
  const replaceArrangement = useDAWStore((state) => state.replaceArrangement);
  const setNotationScore = useDAWStore((state) => state.setNotationScore);
  const snapshot = useDAWStore();

  const saveProject = () => {
    window.localStorage.setItem("loop-daw-project-v2", JSON.stringify(snapshot));
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "loop-daw-project.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const transportActive = isPlaying || isStartingPlayback;

  const handlePlayPause = async () => {
    if (transportActive) {
      stopSequencer();
      setIsStartingPlayback(false);
      return;
    }

    setIsStartingPlayback(true);
    try {
      await startSequencer();
    } finally {
      setIsStartingPlayback(false);
    }
  };

  const handleStop = () => {
    stopSequencer();
    setIsStartingPlayback(false);
    setStopFlash(true);
    window.setTimeout(() => setStopFlash(false), 240);
  };

  return (
    <header className="grid min-w-0 grid-cols-[260px_minmax(520px,1fr)_auto] items-center gap-3 border-b border-white/10 bg-[#0a0c0f]/95 px-4">
      <a className="flex min-w-0 items-center gap-3" href="../" aria-label="Back to Never Wet homepage">
        <span className="grid size-10 place-items-center rounded-lg border border-teal-300/30 bg-teal-300/10 text-sm font-black text-teal-200">
          LD
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black tracking-tight">Loop DAW</strong>
          <small className="block truncate text-xs text-slate-400">Professional browser composer</small>
        </span>
      </a>

      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 rounded-lg border border-white/10 bg-[#12161c] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <ClassicModeButton />
        <div className="mx-1 h-8 w-px bg-white/10" />
        <button
          aria-label={transportActive ? "Pause" : "Play"}
          aria-pressed={transportActive}
          className={`grid size-10 place-items-center rounded-md border transition active:scale-95 ${
            transportActive
              ? "border-teal-200/45 bg-teal-300/10 text-teal-100 opacity-75"
              : "border-teal-300/35 bg-teal-300/10 text-teal-200 hover:bg-teal-300/20"
          }`}
          onClick={() => void handlePlayPause()}
          title={transportActive ? "Pause" : "Play"}
          type="button"
        >
          {transportActive ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          aria-label={transportActive ? "Stop playback" : "Stop"}
          aria-pressed={transportActive}
          className={`flex h-10 items-center justify-center gap-2 rounded-md border font-black uppercase transition-all active:scale-95 ${
            stopFlash
              ? "w-24 border-slate-100 bg-slate-100 text-[#0a0c0f] shadow-[0_0_24px_rgba(226,232,240,0.38)]"
              : transportActive
                ? "w-24 animate-pulse border-rose-200 bg-rose-500 text-white shadow-[0_0_28px_rgba(244,63,94,0.45)] ring-2 ring-rose-300/35 hover:bg-rose-400"
                : "w-10 border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          }`}
          onClick={handleStop}
          title={transportActive ? "Stop playback" : "Stop"}
          type="button"
        >
          <Square fill={transportActive || stopFlash ? "currentColor" : "none"} size={16} />
          {(transportActive || stopFlash) && <span className="text-xs tracking-[0.14em]">Stop</span>}
        </button>
        <button
          aria-label="Record overdub"
          aria-pressed={isRecording}
          className={`grid size-10 place-items-center rounded-md border transition active:scale-95 ${
            isRecording
              ? "border-rose-200 bg-rose-500 text-white shadow-[0_0_22px_rgba(244,63,94,0.38)]"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-rose-300/35 hover:bg-rose-400/10 hover:text-rose-100"
          }`}
          onClick={() => setRecording(!isRecording)}
          title="Record overdub"
          type="button"
        >
          <Circle size={16} fill={isRecording ? "currentColor" : "none"} />
        </button>

        <div className="mx-2 h-8 w-px bg-white/10" />

        <label className="flex min-w-0 flex-1 items-center gap-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
          BPM
          <input className="min-w-0 flex-1" max="180" min="60" onChange={(event) => setBpm(Number(event.target.value))} type="range" value={bpm} />
          <input
            aria-label="Tempo BPM"
            className="h-9 w-16 rounded-md border border-white/10 bg-[#0c1015] text-center text-sm font-black text-white outline-none"
            max="180"
            min="60"
            onChange={(event) => setBpm(Number(event.target.value))}
            type="number"
            value={bpm}
          />
        </label>

        <button
          className={`flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-black transition ${
            loopEnabled ? "border-amber-300/35 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
          onClick={() => setLoopEnabled(!loopEnabled)}
          type="button"
        >
          <Repeat size={15} />
          Loop
        </button>

        <button
          className="flex h-10 items-center gap-2 rounded-md border border-violet-300/30 bg-violet-300/10 px-3 text-xs font-black text-violet-100 transition hover:bg-violet-300/20"
          onClick={() => {
            if (compositionMode === "classic") {
              setNotationScore(generateNotationScore(key, scale, timeSignature, selectedNotationStaff));
              return;
            }
            replaceArrangement(generateArrangement(selectedStyle, key, scale));
          }}
          type="button"
        >
          <Bot size={15} />
          AI
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-bold lg:flex">
          <KeyboardMusic size={14} />
          {key} {scale}
        </span>
        <button
          className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 font-black text-slate-200 hover:bg-white/[0.08] xl:flex"
          onClick={saveProject}
          type="button"
        >
          <Save size={14} />
          Save
        </button>
        <button
          className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 font-black text-slate-200 hover:bg-white/[0.08] xl:flex"
          onClick={exportProject}
          type="button"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}
