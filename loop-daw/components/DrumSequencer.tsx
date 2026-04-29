"use client";

import { playDrum, unlockAudioEngine } from "../lib/audioEngine";
import { DRUM_LANES, STEPS } from "../lib/musicTheory";
import { useDAWStore } from "../store/useDAWStore";

export function DrumSequencer() {
  const tracks = useDAWStore((state) => state.tracks);
  const drumTrack = useDAWStore((state) => state.tracks.find((track) => track.id === "drums") ?? state.tracks[0]);
  const drums = useDAWStore((state) => state.drums);
  const activeStep = useDAWStore((state) => state.activeStep);
  const triggeredIds = useDAWStore((state) => state.triggeredIds);
  const masterVolume = useDAWStore((state) => state.masterVolume);
  const toggleDrumHit = useDAWStore((state) => state.toggleDrumHit);

  return (
    <section className="grid min-h-0 grid-rows-[42px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#11151a]/85">
      <div className="flex items-center justify-between border-b border-white/10 px-3">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-rose-200">Drum Sequencer</p>
          <h2 className="text-sm font-black text-white">Kick / Snare / Hi-hat / Clap / Percussion</h2>
        </div>
        <p className="text-xs font-bold text-slate-400">Click pads to build rhythm</p>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="grid min-w-[840px]" style={{ gridTemplateColumns: "92px repeat(16, minmax(42px, 1fr))" }}>
          <div className="sticky left-0 top-0 z-20 border-b border-r border-white/10 bg-[#151a20] px-2 py-2 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
            Drum
          </div>
          {Array.from({ length: STEPS }, (_, step) => (
            <div
              className={`sticky top-0 z-10 border-b border-r border-white/10 bg-[#151a20] py-2 text-center text-xs font-black ${
                activeStep === step ? "text-rose-200" : "text-slate-400"
              }`}
              key={step}
            >
              {step + 1}
            </div>
          ))}

          {DRUM_LANES.map((lane) => (
            <div className="contents" key={lane.id}>
              <div className="sticky left-0 z-10 border-b border-r border-white/[0.06] bg-[#10151b] px-3 py-3 text-xs font-black text-slate-300">
                {lane.name}
                <span className="ml-2 text-[0.62rem] text-slate-600">{lane.key}</span>
              </div>
              {Array.from({ length: STEPS }, (_, step) => {
                const hit = drums.find((item) => item.step === step && item.lane === lane.id);
                const isTriggered = hit ? triggeredIds.includes(hit.id) : false;
                return (
                  <button
                    className={`min-h-14 border-b border-r border-white/[0.045] p-2 transition ${
                      activeStep === step ? "bg-rose-300/[0.06]" : step % 4 === 0 ? "bg-white/[0.025]" : "bg-transparent"
                    }`}
                    key={`${lane.id}-${step}`}
                    onClick={() => {
                      toggleDrumHit(lane.id, step);
                      void unlockAudioEngine(tracks, masterVolume).then(() => playDrum(drumTrack, lane.id, undefined, 0.88));
                    }}
                    type="button"
                  >
                    <span
                      className={`block h-full rounded-md border transition ${
                        hit
                          ? isTriggered
                            ? "scale-105 border-white/60 bg-rose-300 shadow-[0_0_22px_rgba(251,113,133,0.45)]"
                            : "border-rose-200/35 bg-rose-400/75"
                          : "border-white/[0.055] bg-white/[0.025] hover:bg-white/[0.06]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
