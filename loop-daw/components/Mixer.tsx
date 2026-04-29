"use client";

import { SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import type { CSSProperties } from "react";
import { useDAWStore } from "../store/useDAWStore";

export function Mixer() {
  const tracks = useDAWStore((state) => state.tracks);
  const masterVolume = useDAWStore((state) => state.masterVolume);
  const setMasterVolume = useDAWStore((state) => state.setMasterVolume);
  const updateTrack = useDAWStore((state) => state.updateTrack);
  const toggleMute = useDAWStore((state) => state.toggleMute);
  const toggleSolo = useDAWStore((state) => state.toggleSolo);

  return (
    <footer className="grid min-h-0 grid-cols-[190px_minmax(0,1fr)] gap-3 border-t border-white/10 bg-[#0a0c0f] p-3">
      <section className="grid rounded-lg border border-white/10 bg-[#11151a] p-3">
        <div className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-200">
          <SlidersHorizontal size={15} />
          Master
        </div>
        <label className="mt-4 grid gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
          Volume
          <input
            aria-label="Master volume"
            max="1"
            min="0"
            onChange={(event) => setMasterVolume(Number(event.target.value))}
            step="0.01"
            type="range"
            value={masterVolume}
          />
        </label>
      </section>

      <section className="grid min-w-0 grid-cols-4 gap-3">
        {tracks.map((track) => (
          <article
            className="grid min-w-0 grid-rows-[auto_1fr] rounded-lg border border-white/10 bg-[#11151a] p-3"
            key={track.id}
            style={{ "--track-color": track.color } as CSSProperties}
          >
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-white">{track.name}</strong>
                <span className="text-xs font-bold text-slate-500">{Math.round(track.volume * 100)}%</span>
              </div>
              <div className="flex gap-1">
                <button
                  className={`grid size-8 place-items-center rounded-md border text-xs font-black ${
                    track.muted ? "border-rose-300/40 bg-rose-400/15 text-rose-200" : "border-white/10 text-slate-400"
                  }`}
                  onClick={() => toggleMute(track.id)}
                  title="Mute"
                  type="button"
                >
                  {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  className={`grid size-8 place-items-center rounded-md border text-xs font-black ${
                    track.solo ? "border-amber-300/40 bg-amber-300/15 text-amber-200" : "border-white/10 text-slate-400"
                  }`}
                  onClick={() => toggleSolo(track.id)}
                  title="Solo"
                  type="button"
                >
                  S
                </button>
              </div>
            </div>

            <label className="mt-4 grid content-end gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
              Volume
              <input
                aria-label={`${track.name} mixer volume`}
                max="1"
                min="0"
                onChange={(event) => updateTrack(track.id, { volume: Number(event.target.value) })}
                step="0.01"
                style={{ accentColor: track.color }}
                type="range"
                value={track.volume}
              />
            </label>
          </article>
        ))}
      </section>
    </footer>
  );
}
