"use client";

import { useEffect } from "react";
import { AIComposerPanel } from "./AIComposerPanel";
import { ClipGrid } from "./ClipGrid";
import { DrumSequencer } from "./DrumSequencer";
import { Mixer } from "./Mixer";
import { NotationEditor } from "./NotationEditor";
import { NotationToolbar } from "./NotationToolbar";
import { PianoRoll } from "./PianoRoll";
import { TrackList } from "./TrackList";
import { TransportBar } from "./TransportBar";
import { Visualizer3D } from "./Visualizer3D";
import { syncAudioSettings, unlockAudioEngine } from "../lib/audioEngine";
import { updateSequencerBpm } from "../lib/sequencer";
import { useDAWStore } from "../store/useDAWStore";

export function DawWorkspace() {
  const selectedTrack = useDAWStore((state) => state.tracks.find((track) => track.id === state.selectedTrackId) ?? state.tracks[0]);
  const tracks = useDAWStore((state) => state.tracks);
  const masterVolume = useDAWStore((state) => state.masterVolume);
  const bpm = useDAWStore((state) => state.bpm);
  const compositionMode = useDAWStore((state) => state.compositionMode);

  useEffect(() => {
    syncAudioSettings(tracks, masterVolume);
  }, [masterVolume, tracks]);

  useEffect(() => {
    let didUnlock = false;
    const unlockFromGesture = () => {
      if (didUnlock) return;
      didUnlock = true;
      const state = useDAWStore.getState();
      void unlockAudioEngine(state.tracks, state.masterVolume);
    };

    window.addEventListener("pointerdown", unlockFromGesture, { capture: true });
    window.addEventListener("keydown", unlockFromGesture, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlockFromGesture, { capture: true });
      window.removeEventListener("keydown", unlockFromGesture, { capture: true });
    };
  }, []);

  useEffect(() => {
    updateSequencerBpm(bpm);
  }, [bpm]);

  return (
    <div className="daw-grid-bg grid h-dvh grid-rows-[64px_minmax(0,1fr)_156px] overflow-hidden text-slate-100">
      <TransportBar />

      <div className="grid min-h-0 grid-cols-[264px_minmax(0,1fr)] overflow-hidden border-t border-white/5">
        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden border-r border-white/10 bg-[#0b0d10]/80 p-3">
          {compositionMode === "classic" ? (
            <NotationToolbar />
          ) : (
            <>
              <TrackList />
              <AIComposerPanel />
            </>
          )}
        </aside>

        <main className={`${compositionMode === "classic" ? "grid-rows-[minmax(0,1fr)]" : "grid-rows-[164px_minmax(0,1fr)]"} grid min-h-0 gap-3 overflow-hidden p-3`}>
          {compositionMode === "classic" ? (
            <NotationEditor />
          ) : (
            <>
              <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_280px] gap-3">
                <ClipGrid />
                <Visualizer3D />
              </section>

              {selectedTrack.type === "drums" ? <DrumSequencer /> : <PianoRoll />}
            </>
          )}
        </main>
      </div>

      <Mixer />
    </div>
  );
}
