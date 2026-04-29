"use client";

import { useEffect, useMemo } from "react";
import { playTrackNote, unlockAudioEngine } from "../lib/audioEngine";
import { PIANO_ROLL_NOTES, STEPS } from "../lib/musicTheory";
import { useDAWStore } from "../store/useDAWStore";

const keyboardMap: Record<string, string> = {
  a: "C4",
  w: "C#4",
  s: "D4",
  e: "D#4",
  d: "E4",
  f: "F4",
  t: "F#4",
  g: "G4",
  y: "G#4",
  h: "A4",
  u: "A#4",
  j: "B4",
};

export function PianoRoll() {
  const selectedTrackId = useDAWStore((state) => state.selectedTrackId);
  const selectedTrack = useDAWStore((state) => state.tracks.find((track) => track.id === state.selectedTrackId) ?? state.tracks[0]);
  const tracks = useDAWStore((state) => state.tracks);
  const allNotes = useDAWStore((state) => state.notes);
  const notes = useMemo(() => allNotes.filter((note) => note.trackId === selectedTrackId), [allNotes, selectedTrackId]);
  const activeStep = useDAWStore((state) => state.activeStep);
  const triggeredIds = useDAWStore((state) => state.triggeredIds);
  const isRecording = useDAWStore((state) => state.isRecording);
  const masterVolume = useDAWStore((state) => state.masterVolume);
  const toggleNote = useDAWStore((state) => state.toggleNote);
  const recordNote = useDAWStore((state) => state.recordNote);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      const note = keyboardMap[event.key.toLowerCase()];
      if (!note) return;
      event.preventDefault();
      void unlockAudioEngine(tracks, masterVolume).then(() => playTrackNote(selectedTrack, note, 1, undefined, 0.86));
      if (isRecording) recordNote(note);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, masterVolume, recordNote, selectedTrack, tracks]);

  return (
    <section className="grid min-h-0 grid-rows-[42px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#11151a]/85">
      <div className="flex items-center justify-between border-b border-white/10 px-3">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-teal-200">Piano Roll</p>
          <h2 className="text-sm font-black text-white">{selectedTrack.name}</h2>
        </div>
        <p className="text-xs font-bold text-slate-400">Keyboard: A W S E D F T G Y H U J</p>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="grid min-w-[840px]" style={{ gridTemplateColumns: "72px repeat(16, minmax(42px, 1fr))" }}>
          <div className="sticky left-0 top-0 z-20 border-b border-r border-white/10 bg-[#151a20] px-2 py-2 text-[0.66rem] font-black uppercase tracking-[0.14em] text-slate-500">
            Note
          </div>
          {Array.from({ length: STEPS }, (_, step) => (
            <div
              className={`sticky top-0 z-10 border-b border-r border-white/10 bg-[#151a20] py-2 text-center text-xs font-black ${
                activeStep === step ? "text-teal-200" : "text-slate-400"
              }`}
              key={step}
            >
              {step + 1}
            </div>
          ))}

          {[...PIANO_ROLL_NOTES].reverse().map((rowNote) => (
            <div className="contents" key={rowNote}>
              <div className="sticky left-0 z-10 border-b border-r border-white/[0.06] bg-[#10151b] px-2 py-2 text-right text-xs font-bold text-slate-400">
                {rowNote}
              </div>
              {Array.from({ length: STEPS }, (_, step) => {
                const note = notes.find((item) => item.step === step && item.note === rowNote);
                const isTriggered = note ? triggeredIds.includes(note.id) : false;
                return (
                  <button
                    className={`min-h-10 border-b border-r border-white/[0.045] transition ${
                      activeStep === step ? "bg-teal-300/[0.06]" : step % 4 === 0 ? "bg-white/[0.025]" : "bg-transparent"
                    }`}
                    key={`${rowNote}-${step}`}
                    onClick={() => {
                      toggleNote(selectedTrack.id, step, rowNote);
                      void unlockAudioEngine(tracks, masterVolume).then(() => playTrackNote(selectedTrack, rowNote, 1, undefined, 0.86));
                    }}
                    type="button"
                  >
                    {note && (
                      <span
                        className={`mx-auto block h-5 w-[82%] rounded-md border shadow-lg transition ${
                          isTriggered ? "scale-105 border-white/60 brightness-125" : "border-white/20"
                        }`}
                        style={{ background: selectedTrack.color, boxShadow: `0 0 ${isTriggered ? 24 : 10}px ${selectedTrack.color}55` }}
                      />
                    )}
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
