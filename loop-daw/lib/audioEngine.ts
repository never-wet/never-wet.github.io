"use client";

import * as Tone from "tone";
import type { DAWRuntimeState } from "./sequencer";
import type { DrumHit, Track } from "../store/useDAWStore";
import { noteToMidi, transposeNote } from "./musicTheory";
import { durationToSixteenthSteps, notationStep } from "./notation";

type TrackSynth = Tone.PolySynth<Tone.Synth> | Tone.PolySynth<Tone.FMSynth> | Tone.MonoSynth;

let initialized = false;
let analyser: Tone.Analyser | null = null;
let masterVolume = 0.82;
let unlockPromise: Promise<void> | null = null;
const trackChannels = new Map<string, Tone.Volume>();
const synths = new Map<string, TrackSynth>();

function volumeToDb(volume: number) {
  return volume <= 0.001 ? -60 : Tone.gainToDb(volume);
}

function ensureAnalyser() {
  if (!analyser) {
    analyser = new Tone.Analyser("fft", 32);
  }
  return analyser;
}

function createChannel(track: Track) {
  const channel = new Tone.Volume(volumeToDb(track.volume));
  channel.connect(Tone.Destination);
  channel.connect(ensureAnalyser());
  trackChannels.set(track.id, channel);
  return channel;
}

function createSynth(track: Track) {
  if (track.instrument === "bass") {
    return new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { Q: 1, type: "lowpass", rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.16, sustain: 0.55, release: 0.22 },
      filterEnvelope: { attack: 0.01, decay: 0.12, sustain: 0.35, release: 0.12, baseFrequency: 80, octaves: 3 },
    });
  }

  if (track.instrument === "pluck") {
    return new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 4,
      envelope: { attack: 0.004, decay: 0.2, sustain: 0.22, release: 0.8 },
      modulationEnvelope: { attack: 0.01, decay: 0.14, sustain: 0.1, release: 0.4 },
    });
  }

  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: track.instrument === "synth" ? "fatsawtooth" : "triangle" },
    envelope: { attack: 0.008, decay: 0.2, sustain: 0.34, release: 0.42 },
  });
}

function ensureTrack(track: Track) {
  const channel = trackChannels.get(track.id) ?? createChannel(track);
  channel.volume.value = volumeToDb(track.volume);

  if (track.type === "drums") return { channel, synth: null };

  let synth = synths.get(track.id);
  if (!synth) {
    synth = createSynth(track);
    synth.connect(channel);
    synths.set(track.id, synth);
  }

  return { channel, synth };
}

function ensureDrums(track: Track) {
  const channel = trackChannels.get(track.id) ?? createChannel(track);
  channel.volume.value = volumeToDb(track.volume);
  return channel;
}

export async function startAudioEngine(tracks: Track[]) {
  const context = Tone.getContext();
  if (Tone.context.state !== "running" || context.state !== "running") {
    unlockPromise ??= (async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
      }

      if (context.state !== "running") {
        await context.resume();
      }
    })();

    try {
      await unlockPromise;
    } finally {
      unlockPromise = null;
    }
  }

  if (!initialized) {
    Tone.Transport.PPQ = 96;
    initialized = true;
  }

  tracks.forEach((track) => {
    ensureTrack(track);
    if (track.type === "drums") ensureDrums(track);
  });

  Tone.Destination.volume.value = volumeToDb(masterVolume);
}

export async function unlockAudioEngine(tracks: Track[], nextMasterVolume = masterVolume) {
  await startAudioEngine(tracks);
  syncAudioSettings(tracks, nextMasterVolume);
}

export function audioEngineState() {
  return Tone.context.state;
}

export function syncAudioSettings(tracks: Track[], nextMasterVolume = masterVolume) {
  masterVolume = nextMasterVolume;
  Tone.Destination.volume.value = volumeToDb(masterVolume);
  tracks.forEach((track) => {
    const channel = trackChannels.get(track.id);
    if (channel) channel.volume.value = volumeToDb(track.volume);
  });
}

export function playTrackNote(track: Track, note: string, lengthSteps = 1, time?: Tone.Unit.Time, velocity = 0.82) {
  const { synth } = ensureTrack(track);
  if (!synth) return;
  const playbackNote = track.type === "bass" ? transposeNote(note, -12) : note;
  const duration = Tone.Time("16n").toSeconds() * Math.max(1, lengthSteps) * 0.96;
  synth.triggerAttackRelease(playbackNote, duration, time, velocity);
}

export function playDrum(track: Track, lane: DrumHit["lane"], time?: Tone.Unit.Time, velocity = 0.8) {
  const channel = ensureDrums(track);
  const triggerTime = time ?? Tone.now();
  let synth: Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth;

  if (lane === "kick" || lane === "perc") {
    synth = new Tone.MembraneSynth({
      pitchDecay: lane === "kick" ? 0.03 : 0.01,
      octaves: lane === "kick" ? 7 : 3,
      envelope: { attack: 0.001, decay: lane === "kick" ? 0.32 : 0.12, sustain: 0, release: 0.12 },
    }).connect(channel);
    synth.triggerAttackRelease(lane === "kick" ? "C1" : "G2", "16n", triggerTime, velocity);
    window.setTimeout(() => synth.dispose(), 1600);
    return;
  }

  if (lane === "hat") {
    synth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, release: 0.03 },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4200,
      octaves: 1.4,
    }).connect(channel);
    synth.triggerAttackRelease("32n", triggerTime, velocity);
    window.setTimeout(() => synth.dispose(), 1200);
    return;
  }

  synth = new Tone.NoiseSynth({
    noise: { type: lane === "clap" ? "pink" : "white" },
    envelope: { attack: 0.001, decay: lane === "clap" ? 0.12 : 0.16, sustain: 0.02, release: 0.08 },
  }).connect(channel);
  synth.triggerAttackRelease("16n", triggerTime, velocity);
  window.setTimeout(() => synth.dispose(), 1400);
}

export function triggerStepAudio(state: DAWRuntimeState, step: number, time: Tone.Unit.Time) {
  const soloActive = state.tracks.some((track) => track.solo);
  const audibleTracks = state.tracks.filter((track) => (soloActive ? track.solo : !track.muted));
  const triggeredIds: string[] = [];

  if (state.compositionMode === "classic") {
    state.notationNotes
      .filter((note) => note.type === "note" && note.pitch && notationStep(note, state.timeSignature) === step)
      .forEach((note) => {
        const track = audibleTracks.find((item) => item.id === (note.staff === "bass" ? "bass" : "melody"));
        if (!track) return;
        playTrackNote(track, note.pitch ?? "C4", durationToSixteenthSteps(note.duration), time, 0.82);
        triggeredIds.push(note.id);
      });

    return triggeredIds;
  }

  audibleTracks.forEach((track) => {
    if (track.type === "drums") {
      state.drums
        .filter((hit) => hit.step === step)
        .forEach((hit) => {
          playDrum(track, hit.lane, time, hit.velocity);
          triggeredIds.push(hit.id);
        });
      return;
    }

    const stepNotes = state.notes.filter((note) => note.trackId === track.id && note.step === step);
    const playableNotes = track.type === "bass" ? stepNotes.slice(0, 1) : stepNotes;

    playableNotes
      .forEach((note) => {
        playTrackNote(track, note.note, note.length, time, note.velocity);
        triggeredIds.push(note.id);
      });
  });

  return triggeredIds;
}

export function getAnalyserLevels() {
  if (!analyser) return Array.from({ length: 32 }, () => 0);
  const values = analyser.getValue() as Float32Array;
  return Array.from(values).map((value) => {
    if (typeof value !== "number") return 0;
    return Math.max(0, Math.min(1, (value + 90) / 70));
  });
}

export function notePreviewLevel(note: string) {
  return Math.max(0.25, Math.min(1, (noteToMidi(note) - 48) / 36));
}
