"use client";

import { Drum, Music2, Piano, Radio, Volume2, Waves } from "lucide-react";
import type { CSSProperties } from "react";
import type { Instrument, Track } from "../store/useDAWStore";
import { useDAWStore } from "../store/useDAWStore";

const instrumentLabels: Record<Instrument, string> = {
  piano: "Piano",
  synth: "Synth",
  pluck: "Pluck",
  bass: "Bass",
  drumKit: "Drums",
};

function TrackIcon({ track }: { track: Track }) {
  if (track.type === "drums") return <Drum size={17} />;
  if (track.type === "bass") return <Radio size={17} />;
  if (track.instrument === "pluck") return <Waves size={17} />;
  return <Piano size={17} />;
}

export function TrackList() {
  const tracks = useDAWStore((state) => state.tracks);
  const selectedTrackId = useDAWStore((state) => state.selectedTrackId);
  const setSelectedTrack = useDAWStore((state) => state.setSelectedTrack);
  const toggleMute = useDAWStore((state) => state.toggleMute);
  const toggleSolo = useDAWStore((state) => state.toggleSolo);
  const updateTrack = useDAWStore((state) => state.updateTrack);

  return (
    <section className="min-h-0 overflow-auto rounded-lg border border-white/10 bg-[#11151a]/80 p-3">
      <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
        <Music2 size={15} />
        Tracks
      </div>

      <div className="grid gap-2">
        {tracks.map((track) => (
          <article
            className={`rounded-lg border p-2.5 transition ${
              selectedTrackId === track.id ? "border-[color:var(--track-color)] bg-white/[0.055]" : "border-white/10 bg-white/[0.025]"
            }`}
            key={track.id}
            style={{ "--track-color": track.color } as CSSProperties}
          >
            <button className="flex w-full items-center gap-3 text-left" onClick={() => setSelectedTrack(track.id)} type="button">
              <span className="grid size-9 place-items-center rounded-md bg-[color:var(--track-color)]/15 text-[color:var(--track-color)]">
                <TrackIcon track={track} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-white">{track.name}</strong>
                <small className="block truncate text-xs text-slate-400">{instrumentLabels[track.instrument]}</small>
              </span>
            </button>

            <div className="mt-2 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
              <button
                className={`h-7 rounded-md border px-2 text-[0.65rem] font-black ${track.muted ? "border-rose-300/40 bg-rose-400/15 text-rose-200" : "border-white/10 text-slate-400"}`}
                onClick={() => toggleMute(track.id)}
                type="button"
              >
                M
              </button>
              <button
                className={`h-7 rounded-md border px-2 text-[0.65rem] font-black ${track.solo ? "border-amber-300/40 bg-amber-300/15 text-amber-200" : "border-white/10 text-slate-400"}`}
                onClick={() => toggleSolo(track.id)}
                type="button"
              >
                S
              </button>
              <label className="flex min-w-0 items-center gap-2 text-slate-500">
                <Volume2 size={13} />
                <input
                  aria-label={`${track.name} volume`}
                  max="1"
                  min="0"
                  onChange={(event) => updateTrack(track.id, { volume: Number(event.target.value) })}
                  step="0.01"
                  type="range"
                  value={track.volume}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
