"use client";

import { STEPS } from "../lib/musicTheory";
import { useDAWStore } from "../store/useDAWStore";

export function ClipGrid() {
  const tracks = useDAWStore((state) => state.tracks);
  const notes = useDAWStore((state) => state.notes);
  const drums = useDAWStore((state) => state.drums);
  const activeStep = useDAWStore((state) => state.activeStep);
  const selectedTrackId = useDAWStore((state) => state.selectedTrackId);
  const setSelectedTrack = useDAWStore((state) => state.setSelectedTrack);

  return (
    <section className="min-h-0 overflow-hidden rounded-lg border border-white/10 bg-[#11151a]/85">
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-3">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-teal-200">Session Grid</p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }, (_, bar) => (
            <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[0.66rem] font-black text-slate-400" key={bar}>
              Bar {bar + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="grid h-[calc(100%-40px)] grid-rows-4">
        {tracks.map((track) => (
          <div className="grid grid-cols-[96px_repeat(16,minmax(24px,1fr))] border-b border-white/[0.055] last:border-b-0" key={track.id}>
            <button
              className={`border-r border-white/10 px-3 text-left text-xs font-black ${
                selectedTrackId === track.id ? "text-white" : "text-slate-400"
              }`}
              onClick={() => setSelectedTrack(track.id)}
              type="button"
            >
              {track.name}
            </button>
            {Array.from({ length: STEPS }, (_, step) => {
              const items =
                track.type === "drums"
                  ? drums.filter((hit) => hit.step === step).length
                  : notes.filter((note) => note.trackId === track.id && note.step === step).length;
              return (
                <button
                  className={`relative border-r border-white/[0.045] transition hover:bg-white/[0.04] ${
                    activeStep === step ? "bg-teal-300/10" : step % 4 === 0 ? "bg-white/[0.025]" : ""
                  }`}
                  key={step}
                  onClick={() => setSelectedTrack(track.id)}
                  type="button"
                >
                  {items > 0 && (
                    <span
                      className="absolute inset-x-1 bottom-1 rounded-sm"
                      style={{
                        height: `${Math.min(18, 4 + items * 5)}px`,
                        background: track.color,
                        opacity: selectedTrackId === track.id ? 0.9 : 0.46,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
