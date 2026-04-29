"use client";

import * as Tone from "tone";
import { triggerStepAudio, unlockAudioEngine } from "./audioEngine";
import { STEPS } from "./musicTheory";
import { getClassicTotalSteps } from "./notation";
import { useDAWStore, type DrumHit, type NoteEvent, type Track } from "../store/useDAWStore";
import type { CompositionMode, NotationNote, TimeSignature } from "./notation";

export type DAWRuntimeState = {
  compositionMode: CompositionMode;
  tracks: Track[];
  notes: NoteEvent[];
  drums: DrumHit[];
  notationNotes: NotationNote[];
  timeSignature: TimeSignature;
  loopEnabled: boolean;
};

let repeatId: number | null = null;
let currentStep = 0;

function clearTransport() {
  if (repeatId !== null) {
    Tone.Transport.clear(repeatId);
    repeatId = null;
  }
}

function scheduleTransport() {
  clearTransport();
  repeatId = Tone.Transport.scheduleRepeat((time) => {
    const state = useDAWStore.getState();
    const step = currentStep;
    const totalSteps = state.compositionMode === "classic" ? getClassicTotalSteps(state.timeSignature) : STEPS;
    const triggered = triggerStepAudio(state, step, time);

    requestAnimationFrame(() => {
      const latest = useDAWStore.getState();
      latest.setActiveStep(step);
      latest.flashTriggered(triggered);
    });

    currentStep += 1;
    if (currentStep >= totalSteps) {
      if (state.loopEnabled) {
        currentStep = 0;
      } else {
        requestAnimationFrame(stopSequencer);
      }
    }
  }, "16n");
}

export async function startSequencer() {
  const state = useDAWStore.getState();
  await unlockAudioEngine(state.tracks, state.masterVolume);
  Tone.Transport.bpm.value = state.bpm;
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  currentStep = state.activeStep >= 0 ? state.activeStep : 0;
  scheduleTransport();
  state.setPlaying(true);
  Tone.Transport.start("+0.03");
}

export function stopSequencer() {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  clearTransport();
  currentStep = 0;
  const state = useDAWStore.getState();
  state.setPlaying(false);
  state.setActiveStep(-1);
  state.flashTriggered([]);
}

export function updateSequencerBpm(bpm: number) {
  Tone.Transport.bpm.rampTo(bpm, 0.04);
}
