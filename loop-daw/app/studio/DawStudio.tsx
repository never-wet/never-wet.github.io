"use client";

import {
  Download,
  Drum,
  Music2,
  Piano,
  Play,
  Repeat,
  Save,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Instrument = "piano" | "synth" | "drums";
type DrumVoice = "kick" | "snare" | "hat" | "clap";

type Track = {
  id: string;
  name: string;
  instrument: Instrument;
  color: string;
  volume: number;
  tone: number;
  space: number;
  muted: boolean;
};

type DawNote = {
  id: string;
  trackId: string;
  step: number;
  pitchIndex: number;
  length: number;
  velocity: number;
  drum?: DrumVoice;
};

type NoteRow = {
  name: string;
  midi: number;
  inScale: boolean;
  root: boolean;
};

type StoredProject = {
  bpm: number;
  loopSteps: number;
  selectedTrackId: string;
  tracks: Track[];
  notes: DawNote[];
};

const STEP_COUNT = 32;
const STEP_WIDTH = 46;
const ROW_HEIGHT = 28;
const TIMELINE_HEIGHT = 34;
const KEY_WIDTH = 76;
const STORAGE_KEY = "loop-daw-project";
const SCHEDULE_AHEAD = 0.14;

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scalePitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);

const noteRows: NoteRow[] = Array.from({ length: 25 }, (_, index) => {
  const midi = 72 - index;
  const pitchClass = midi % 12;
  return {
    name: `${noteNames[pitchClass]}${Math.floor(midi / 12) - 1}`,
    midi,
    inScale: scalePitchClasses.has(pitchClass),
    root: pitchClass === 0,
  };
});

const initialTracks: Track[] = [
  {
    id: "piano",
    name: "Piano",
    instrument: "piano",
    color: "#e2b861",
    volume: 0.72,
    tone: 0.58,
    space: 0.18,
    muted: false,
  },
  {
    id: "synth",
    name: "Synth",
    instrument: "synth",
    color: "#55c7a8",
    volume: 0.52,
    tone: 0.5,
    space: 0.32,
    muted: false,
  },
  {
    id: "drums",
    name: "Drums",
    instrument: "drums",
    color: "#e86f68",
    volume: 0.68,
    tone: 0.62,
    space: 0.08,
    muted: false,
  },
];

const starterNotes: DawNote[] = [
  { id: "n-1", trackId: "piano", step: 0, pitchIndex: indexForMidi(60), length: 2, velocity: 0.82 },
  { id: "n-2", trackId: "piano", step: 2, pitchIndex: indexForMidi(64), length: 2, velocity: 0.78 },
  { id: "n-3", trackId: "piano", step: 4, pitchIndex: indexForMidi(67), length: 3, velocity: 0.84 },
  { id: "n-4", trackId: "piano", step: 8, pitchIndex: indexForMidi(69), length: 2, velocity: 0.78 },
  { id: "n-5", trackId: "piano", step: 10, pitchIndex: indexForMidi(67), length: 2, velocity: 0.74 },
  { id: "n-6", trackId: "piano", step: 12, pitchIndex: indexForMidi(64), length: 3, velocity: 0.82 },
  { id: "n-7", trackId: "synth", step: 0, pitchIndex: indexForMidi(48), length: 8, velocity: 0.5 },
  { id: "n-8", trackId: "synth", step: 8, pitchIndex: indexForMidi(53), length: 8, velocity: 0.46 },
  { id: "n-9", trackId: "drums", step: 0, pitchIndex: indexForMidi(48), length: 1, velocity: 0.95, drum: "kick" },
  { id: "n-10", trackId: "drums", step: 4, pitchIndex: indexForMidi(50), length: 1, velocity: 0.8, drum: "snare" },
  { id: "n-11", trackId: "drums", step: 8, pitchIndex: indexForMidi(48), length: 1, velocity: 0.95, drum: "kick" },
  { id: "n-12", trackId: "drums", step: 12, pitchIndex: indexForMidi(50), length: 1, velocity: 0.84, drum: "snare" },
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((step, index) => ({
    id: `h-${index}`,
    trackId: "drums",
    step,
    pitchIndex: indexForMidi(55),
    length: 1,
    velocity: 0.42,
    drum: "hat" as DrumVoice,
  })),
];

const soundPresets = [
  { name: "Clean", tone: 0.52, space: 0.12 },
  { name: "Wide", tone: 0.62, space: 0.42 },
  { name: "Soft", tone: 0.28, space: 0.26 },
];

const chordSuggestions = [
  { name: "C", root: 60, notes: [0, 4, 7] },
  { name: "F", root: 65, notes: [0, 4, 7] },
  { name: "G", root: 67, notes: [0, 4, 7] },
  { name: "Am", root: 57, notes: [0, 3, 7] },
];

function indexForMidi(midi: number) {
  const index = noteRows.findIndex((row) => row.midi === midi);
  return index === -1 ? noteRows.length - 1 : index;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createId(prefix = "note") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function inferDrumVoice(pitchIndex: number): DrumVoice {
  const midi = noteRows[pitchIndex]?.midi ?? 48;
  const pitchClass = midi % 12;
  if (pitchClass === 0 || pitchClass === 1) return "kick";
  if (pitchClass === 2 || pitchClass === 3) return "snare";
  if (pitchClass === 4 || pitchClass === 5) return "clap";
  return "hat";
}

function noteLabel(note: DawNote, track?: Track) {
  if (track?.instrument === "drums") return (note.drum ?? inferDrumVoice(note.pitchIndex)).toUpperCase();
  return noteRows[note.pitchIndex]?.name ?? "N";
}

export function DawStudio() {
  const [bpm, setBpm] = useState(118);
  const [loopSteps, setLoopSteps] = useState(16);
  const [tracks, setTracks] = useState(initialTracks);
  const [notes, setNotes] = useState(starterNotes);
  const [selectedTrackId, setSelectedTrackId] = useState("piano");
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scaleHighlight, setScaleHighlight] = useState(true);
  const [cursorStep, setCursorStep] = useState(0);
  const [status, setStatus] = useState("Ready");

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const nextStepRef = useRef(0);
  const nextStepTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const rollRef = useRef<HTMLDivElement | null>(null);
  const previewGateRef = useRef("");
  const notesRef = useRef(notes);
  const tracksRef = useRef(tracks);
  const bpmRef = useRef(bpm);
  const loopStepsRef = useRef(loopSteps);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? tracks[0],
    [selectedTrackId, tracks],
  );

  const activeTrackNotes = useMemo(
    () => notes.filter((note) => note.trackId === selectedTrackId).length,
    [notes, selectedTrackId],
  );

  const visibleNotes = useMemo(
    () => notes.filter((note) => note.trackId === selectedTrackId),
    [notes, selectedTrackId],
  );

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    loopStepsRef.current = loopSteps;
  }, [loopSteps]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const project = JSON.parse(stored) as StoredProject;
        if (!Array.isArray(project.tracks) || !Array.isArray(project.notes)) return;
        setBpm(clamp(project.bpm || 118, 60, 180));
        setLoopSteps(clamp(project.loopSteps || 16, 4, STEP_COUNT));
        setTracks(project.tracks);
        setNotes(project.notes);
        setSelectedTrackId(project.selectedTrackId || project.tracks[0]?.id || "piano");
        setStatus("Recovered");
      } catch {
        setStatus("Ready");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const context = new AudioCtor({ latencyHint: "interactive" });
    audioContextRef.current = context;
    noiseBufferRef.current = createNoiseBuffer(context);
    return context;
  }, []);

  const stepSeconds = useCallback(() => {
    return 60 / bpmRef.current / 4;
  }, []);

  const triggerPreview = useCallback(
    (track: Track, pitchIndex: number, length = 1, drum?: DrumVoice) => {
      const context = getAudioContext();
      void context.resume();
      scheduleSound(
        context,
        track,
        {
          id: "preview",
          trackId: track.id,
          step: 0,
          pitchIndex,
          length,
          velocity: 0.88,
          drum,
        },
        context.currentTime + 0.012,
        Math.max(0.08, Math.min(length * stepSeconds(), 0.7)),
        noiseBufferRef.current,
      );
    },
    [getAudioContext, stepSeconds],
  );

  const scheduleStep = useCallback(
    (step: number, time: number) => {
      const durationPerStep = stepSeconds();
      const currentTracks = tracksRef.current;
      notesRef.current.forEach((note) => {
        if (note.step !== step || note.step >= loopStepsRef.current) return;
        const track = currentTracks.find((item) => item.id === note.trackId);
        if (!track || track.muted) return;
        scheduleSound(
          getAudioContext(),
          track,
          note,
          time,
          Math.max(0.05, note.length * durationPerStep * 0.94),
          noiseBufferRef.current,
        );
      });
    },
    [getAudioContext, stepSeconds],
  );

  const stopPlayback = useCallback(() => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    schedulerRef.current = null;
    animationRef.current = null;
    setIsPlaying(false);
    setPlayhead(null);
  }, []);

  const startPlayback = useCallback(() => {
    const context = getAudioContext();
    void context.resume();
    nextStepRef.current = 0;
    nextStepTimeRef.current = context.currentTime + 0.055;
    startTimeRef.current = nextStepTimeRef.current;
    setIsPlaying(true);

    const scheduler = () => {
      const now = context.currentTime;
      while (nextStepTimeRef.current < now + SCHEDULE_AHEAD) {
        scheduleStep(nextStepRef.current, nextStepTimeRef.current);
        nextStepRef.current = (nextStepRef.current + 1) % loopStepsRef.current;
        nextStepTimeRef.current += stepSeconds();
      }
    };

    const animatePlayhead = () => {
      const elapsed = Math.max(0, context.currentTime - startTimeRef.current);
      const loopDuration = stepSeconds() * loopStepsRef.current;
      const step = Math.floor((elapsed % loopDuration) / stepSeconds());
      setPlayhead(step);
      animationRef.current = window.requestAnimationFrame(animatePlayhead);
    };

    scheduler();
    schedulerRef.current = window.setInterval(scheduler, 24);
    animationRef.current = window.requestAnimationFrame(animatePlayhead);
  }, [getAudioContext, scheduleStep, stepSeconds]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    startPlayback();
  }, [isPlaying, startPlayback, stopPlayback]);

  const addNoteAt = useCallback(
    (step: number, pitchIndex: number, length = 2) => {
      const track = selectedTrack;
      const finalLength = clamp(length, 1, STEP_COUNT - step);
      const drum = track.instrument === "drums" ? inferDrumVoice(pitchIndex) : undefined;
      const note: DawNote = {
        id: createId(),
        trackId: track.id,
        step,
        pitchIndex,
        length: finalLength,
        velocity: track.instrument === "drums" ? 0.9 : 0.82,
        drum,
      };
      setCursorStep(step);
      setNotes((current) => [...current, note]);
      triggerPreview(track, pitchIndex, finalLength, drum);
      setStatus("Note added");
    },
    [selectedTrack, triggerPreview],
  );

  const removeNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
    setStatus("Note removed");
  }, []);

  const updateTrack = useCallback((trackId: string, patch: Partial<Track>) => {
    setTracks((current) => current.map((track) => (track.id === trackId ? { ...track, ...patch } : track)));
  }, []);

  const handleGridPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!rollRef.current || (event.target as HTMLElement).closest(".note-chip, .loop-handle")) return;
      const rect = rollRef.current.getBoundingClientRect();
      const step = clamp(Math.floor((event.clientX - rect.left) / STEP_WIDTH), 0, STEP_COUNT - 1);
      const pitchIndex = clamp(Math.floor((event.clientY - rect.top) / ROW_HEIGHT), 0, noteRows.length - 1);
      addNoteAt(step, pitchIndex);
    },
    [addNoteAt],
  );

  const handleNotePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>, note: DawNote, mode: "move" | "resize") => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const original = { ...note };
      const track = tracksRef.current.find((item) => item.id === note.trackId);
      if (track) triggerPreview(track, note.pitchIndex, note.length, note.drum);

      const handleMove = (moveEvent: globalThis.PointerEvent) => {
        const deltaStep = Math.round((moveEvent.clientX - startX) / STEP_WIDTH);
        const deltaPitch = Math.round((moveEvent.clientY - startY) / ROW_HEIGHT);
        let previewKey = "";

        setNotes((current) =>
          current.map((item) => {
            if (item.id !== original.id) return item;
            if (mode === "resize") {
              const length = clamp(original.length + deltaStep, 1, STEP_COUNT - original.step);
              previewKey = `${item.id}-resize-${length}`;
              return { ...item, length };
            }

            const step = clamp(original.step + deltaStep, 0, STEP_COUNT - original.length);
            const pitchIndex = clamp(original.pitchIndex + deltaPitch, 0, noteRows.length - 1);
            const drum = track?.instrument === "drums" ? inferDrumVoice(pitchIndex) : item.drum;
            previewKey = `${item.id}-${step}-${pitchIndex}`;
            return { ...item, step, pitchIndex, drum };
          }),
        );

        if (track && previewKey && previewGateRef.current !== previewKey) {
          previewGateRef.current = previewKey;
          const nextPitch = clamp(original.pitchIndex + deltaPitch, 0, noteRows.length - 1);
          const nextDrum = track.instrument === "drums" ? inferDrumVoice(nextPitch) : original.drum;
          triggerPreview(track, nextPitch, 1, nextDrum);
        }
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        previewGateRef.current = "";
        setStatus(mode === "resize" ? "Length updated" : "Note moved");
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });
    },
    [triggerPreview],
  );

  const handleLoopDrag = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = rollRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      const steps = clamp(Math.round((moveEvent.clientX - rect.left) / STEP_WIDTH), 4, STEP_COUNT);
      setLoopSteps(steps);
      setStatus(`${steps} step loop`);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }, []);

  const saveProject = useCallback(() => {
    const project: StoredProject = { bpm, loopSteps, selectedTrackId, tracks, notes };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    setStatus("Saved locally");
  }, [bpm, loopSteps, notes, selectedTrackId, tracks]);

  const exportProject = useCallback(() => {
    const project: StoredProject = { bpm, loopSteps, selectedTrackId, tracks, notes };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "loop-daw-project.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported JSON");
  }, [bpm, loopSteps, notes, selectedTrackId, tracks]);

  const applySoundPreset = useCallback(
    (tone: number, space: number) => {
      updateTrack(selectedTrackId, { tone, space });
      triggerPreview(selectedTrack, indexForMidi(selectedTrack.instrument === "drums" ? 48 : 60), 2);
      setStatus("Sound changed");
    },
    [selectedTrack, selectedTrackId, triggerPreview, updateTrack],
  );

  const addChord = useCallback(
    (root: number, intervals: number[]) => {
      const targetTrack = selectedTrack.instrument === "drums" ? tracks.find((track) => track.instrument !== "drums") ?? selectedTrack : selectedTrack;
      const chordNotes = intervals
        .map((interval, index) => {
          const midi = root + interval;
          const pitchIndex = indexForMidi(midi);
          return {
            id: createId("chord"),
            trackId: targetTrack.id,
            step: clamp(cursorStep + index, 0, STEP_COUNT - 1),
            pitchIndex,
            length: 4,
            velocity: 0.72,
          } satisfies DawNote;
        })
        .filter((note) => note.pitchIndex >= 0);
      setNotes((current) => [...current, ...chordNotes]);
      triggerPreview(targetTrack, chordNotes[0]?.pitchIndex ?? indexForMidi(root), 4);
      setStatus("Chord added");
    },
    [cursorStep, selectedTrack, tracks, triggerPreview],
  );

  const generateMelody = useCallback(() => {
    const targetTrack = selectedTrack.instrument === "drums" ? tracks.find((track) => track.instrument !== "drums") ?? selectedTrack : selectedTrack;
    const melody = [60, 64, 67, 69, 72, 69, 67, 64];
    const generated = melody.map((midi, index) => ({
      id: createId("melody"),
      trackId: targetTrack.id,
      step: (index * 2) % loopSteps,
      pitchIndex: indexForMidi(midi),
      length: index % 3 === 0 ? 2 : 1,
      velocity: 0.72 + (index % 2) * 0.08,
    }));
    setNotes((current) => [
      ...current.filter((note) => !(note.trackId === targetTrack.id && note.step < loopSteps)),
      ...generated,
    ]);
    triggerPreview(targetTrack, generated[0].pitchIndex, 2);
    setStatus("Melody generated");
  }, [loopSteps, selectedTrack, tracks, triggerPreview]);

  const generateRhythm = useCallback(() => {
    const drumTrack = tracks.find((track) => track.instrument === "drums") ?? tracks[2];
    const kick = indexForMidi(48);
    const snare = indexForMidi(50);
    const hat = indexForMidi(55);
    const pattern: DawNote[] = [];

    for (let step = 0; step < loopSteps; step += 2) {
      pattern.push({
        id: createId("hat"),
        trackId: drumTrack.id,
        step,
        pitchIndex: hat,
        length: 1,
        velocity: step % 4 === 0 ? 0.52 : 0.38,
        drum: "hat",
      });
    }

    [0, 6, 8, 14].forEach((step) => {
      if (step < loopSteps) {
        pattern.push({ id: createId("kick"), trackId: drumTrack.id, step, pitchIndex: kick, length: 1, velocity: 0.94, drum: "kick" });
      }
    });

    [4, 12].forEach((step) => {
      if (step < loopSteps) {
        pattern.push({ id: createId("snare"), trackId: drumTrack.id, step, pitchIndex: snare, length: 1, velocity: 0.82, drum: "snare" });
      }
    });

    setNotes((current) => [
      ...current.filter((note) => !(note.trackId === drumTrack.id && note.step < loopSteps)),
      ...pattern,
    ]);
    triggerPreview(drumTrack, kick, 1, "kick");
    setStatus("Rhythm generated");
  }, [loopSteps, tracks, triggerPreview]);

  const clearSelectedTrack = useCallback(() => {
    setNotes((current) => current.filter((note) => note.trackId !== selectedTrackId));
    setStatus("Track cleared");
  }, [selectedTrackId]);

  const loadStarterLoop = useCallback(() => {
    setBpm(118);
    setLoopSteps(16);
    setTracks(initialTracks);
    setNotes(starterNotes);
    setSelectedTrackId("piano");
    setStatus("Starter loaded");
  }, []);

  const emptyGrid = useCallback(() => {
    setNotes([]);
    setStatus("Grid cleared");
  }, []);

  const totalGridWidth = STEP_COUNT * STEP_WIDTH;
  const totalGridHeight = noteRows.length * ROW_HEIGHT;

  return (
    <div className="studio-shell">
      <header className="top-bar">
        <a className="brand" href="../" aria-label="Back to Never Wet homepage">
          <span className="brand-mark">LD</span>
          <span>
            <strong>Loop DAW</strong>
            <small>Music Composition</small>
          </span>
        </a>

        <div className="transport" aria-label="Transport controls">
          <button className="icon-button play-button" onClick={togglePlayback} title={isPlaying ? "Stop" : "Play"} type="button">
            {isPlaying ? <Square size={18} /> : <Play size={18} />}
          </button>
          <div className="tempo-control">
            <label htmlFor="tempo">Tempo</label>
            <input id="tempo" min="60" max="180" type="range" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
            <input aria-label="BPM" className="tempo-number" min="60" max="180" type="number" value={bpm} onChange={(event) => setBpm(clamp(Number(event.target.value), 60, 180))} />
          </div>
          <div className="loop-control" title="Loop length">
            <Repeat size={16} />
            <input min="4" max={STEP_COUNT} type="range" value={loopSteps} onChange={(event) => setLoopSteps(Number(event.target.value))} />
            <span>{loopSteps}</span>
          </div>
        </div>

        <div className="top-actions">
          <span className="status-pill">{status}</span>
          <button className="toolbar-button" onClick={saveProject} type="button">
            <Save size={16} />
            <span>Save</span>
          </button>
          <button className="toolbar-button" onClick={exportProject} type="button">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Instruments and presets">
          <section className="panel">
            <div className="panel-heading">
              <Music2 size={16} />
              <h2>Tracks</h2>
            </div>
            <div className="track-list">
              {tracks.map((track) => (
                <button
                  className={`track-button ${track.id === selectedTrackId ? "is-active" : ""}`}
                  key={track.id}
                  onClick={() => {
                    setSelectedTrackId(track.id);
                    triggerPreview(track, indexForMidi(track.instrument === "drums" ? 48 : 60), 1);
                  }}
                  style={{ "--track-color": track.color } as React.CSSProperties}
                  type="button"
                >
                  <span className="track-icon" aria-hidden="true">
                    {track.instrument === "piano" && <Piano size={18} />}
                    {track.instrument === "synth" && <Waves size={18} />}
                    {track.instrument === "drums" && <Drum size={18} />}
                  </span>
                  <span>
                    <strong>{track.name}</strong>
                    <small>{track.instrument}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <SlidersHorizontal size={16} />
              <h2>Sound</h2>
            </div>
            <div className="preset-grid">
              {soundPresets.map((preset) => (
                <button key={preset.name} onClick={() => applySoundPreset(preset.tone, preset.space)} type="button">
                  {preset.name}
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <Sparkles size={16} />
              <h2>Create</h2>
            </div>
            <div className="smart-actions">
              <button onClick={generateMelody} type="button">
                <Sparkles size={15} />
                Melody
              </button>
              <button onClick={generateRhythm} type="button">
                <Drum size={15} />
                Rhythm
              </button>
              <button onClick={clearSelectedTrack} type="button">
                <Trash2 size={15} />
                Track
              </button>
              <button onClick={emptyGrid} type="button">
                <Trash2 size={15} />
                All
              </button>
            </div>
            <button className="wide-action" onClick={loadStarterLoop} type="button">
              Load Starter Loop
            </button>
          </section>
        </aside>

        <main className="editor" aria-label="Piano roll editor">
          <div className="editor-head">
            <div>
              <p className="eyebrow">Piano Roll</p>
              <h1>{selectedTrack.name}</h1>
            </div>
            <div className="editor-tools">
              <span>{activeTrackNotes} notes</span>
              <label className="toggle">
                <input checked={scaleHighlight} onChange={(event) => setScaleHighlight(event.target.checked)} type="checkbox" />
                <span>Scale</span>
              </label>
              <div className="chord-row" aria-label="Chord suggestions">
                {chordSuggestions.map((chord) => (
                  <button key={chord.name} onClick={() => addChord(chord.root, chord.notes)} type="button">
                    {chord.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="roll-viewport" aria-label="Note grid">
            <div
              className="roll-content"
              style={{
                width: KEY_WIDTH + totalGridWidth,
                height: TIMELINE_HEIGHT + totalGridHeight,
              }}
            >
              <div className="timeline-corner">Pitch</div>
              <div className="timeline" style={{ left: KEY_WIDTH, width: totalGridWidth }}>
                {Array.from({ length: STEP_COUNT }, (_, step) => (
                  <span className={step % 4 === 0 ? "is-bar" : ""} key={step} style={{ width: STEP_WIDTH }}>
                    {step % 4 === 0 ? step / 4 + 1 : ""}
                  </span>
                ))}
              </div>
              <div className="key-column" style={{ top: TIMELINE_HEIGHT, width: KEY_WIDTH, height: totalGridHeight }}>
                {noteRows.map((row) => (
                  <span className={row.root ? "is-root" : ""} key={row.midi} style={{ height: ROW_HEIGHT }}>
                    {selectedTrack.instrument === "drums" ? drumLaneLabel(row.midi) : row.name}
                  </span>
                ))}
              </div>
              <div
                className={`roll-grid ${scaleHighlight ? "show-scale" : ""}`}
                onPointerDown={handleGridPointerDown}
                ref={rollRef}
                style={
                  {
                    left: KEY_WIDTH,
                    top: TIMELINE_HEIGHT,
                    width: totalGridWidth,
                    height: totalGridHeight,
                    "--step-width": `${STEP_WIDTH}px`,
                    "--row-height": `${ROW_HEIGHT}px`,
                    "--loop-width": `${loopSteps * STEP_WIDTH}px`,
                  } as React.CSSProperties
                }
              >
                <div className="loop-region" aria-hidden="true" />
                <button
                  aria-label="Drag loop end"
                  className="loop-handle"
                  onPointerDown={handleLoopDrag}
                  style={{ left: loopSteps * STEP_WIDTH - 6 }}
                  type="button"
                />
                {scaleHighlight &&
                  noteRows.map((row, index) => (
                    <span
                      aria-hidden="true"
                      className={`scale-row ${row.root ? "is-root" : ""}`}
                      key={row.midi}
                      style={{
                        top: index * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                        opacity: row.inScale ? 1 : 0,
                      }}
                    />
                  ))}
                {playhead !== null && (
                  <span
                    aria-hidden="true"
                    className="playhead"
                    style={{
                      transform: `translateX(${playhead * STEP_WIDTH}px)`,
                    }}
                  />
                )}
                {visibleNotes.map((note) => {
                  const track = tracks.find((item) => item.id === note.trackId);
                  if (!track) return null;
                  return (
                    <button
                      className={`note-chip ${note.trackId === selectedTrackId ? "is-selected" : ""} ${note.length <= 1 ? "is-short" : ""}`}
                      key={note.id}
                      onDoubleClick={() => removeNote(note.id)}
                      onPointerDown={(event) => handleNotePointerDown(event, note, "move")}
                      style={
                        {
                          left: note.step * STEP_WIDTH + 4,
                          top: note.pitchIndex * ROW_HEIGHT + 4,
                          width: Math.max(28, note.length * STEP_WIDTH - 8),
                          height: ROW_HEIGHT - 8,
                          "--note-color": track.color,
                        } as React.CSSProperties
                      }
                      title="Drag to move. Double click to remove."
                      type="button"
                    >
                      <span>{noteLabel(note, track)}</span>
                      <i
                        aria-hidden="true"
                        className="note-resize"
                        onPointerDown={(event) => handleNotePointerDown(event as unknown as PointerEvent<HTMLButtonElement>, note, "resize")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="bottom-panel" aria-label="Mixer and effects">
        <div className="mixer-title">
          <SlidersHorizontal size={18} />
          <span>Mixer</span>
        </div>
        <div className="mixer-strips">
          {tracks.map((track) => (
            <section className="mixer-strip" key={track.id} style={{ "--track-color": track.color } as React.CSSProperties}>
              <div className="strip-head">
                <button
                  className={`mute-button ${track.muted ? "is-muted" : ""}`}
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  title={track.muted ? "Unmute" : "Mute"}
                  type="button"
                >
                  {track.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <strong>{track.name}</strong>
              </div>
              <label>
                <span>Volume</span>
                <input
                  max="1"
                  min="0"
                  step="0.01"
                  type="range"
                  value={track.volume}
                  onChange={(event) => updateTrack(track.id, { volume: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>Tone</span>
                <input
                  max="1"
                  min="0"
                  step="0.01"
                  type="range"
                  value={track.tone}
                  onChange={(event) => updateTrack(track.id, { tone: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>Space</span>
                <input
                  max="1"
                  min="0"
                  step="0.01"
                  type="range"
                  value={track.space}
                  onChange={(event) => updateTrack(track.id, { space: Number(event.target.value) })}
                />
              </label>
            </section>
          ))}
        </div>
      </footer>
    </div>
  );
}

function drumLaneLabel(midi: number) {
  const pitchClass = midi % 12;
  if (pitchClass === 0 || pitchClass === 1) return "Kick";
  if (pitchClass === 2 || pitchClass === 3) return "Snare";
  if (pitchClass === 4 || pitchClass === 5) return "Clap";
  return "Hat";
}

function createNoiseBuffer(context: AudioContext) {
  const length = Math.floor(context.sampleRate * 1.25);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function scheduleSound(
  context: AudioContext,
  track: Track,
  note: DawNote,
  time: number,
  duration: number,
  noiseBuffer: AudioBuffer | null,
) {
  if (track.instrument === "drums") {
    scheduleDrum(context, track, note.drum ?? inferDrumVoice(note.pitchIndex), time, note.velocity, noiseBuffer);
    return;
  }

  const frequency = midiToFrequency(noteRows[note.pitchIndex]?.midi ?? 60);
  const output = context.createGain();
  const dry = context.createGain();
  const delay = context.createDelay(0.7);
  const delayGain = context.createGain();
  const feedback = context.createGain();
  const filter = context.createBiquadFilter();
  const pan = context.createStereoPanner();
  const amp = context.createGain();

  const wet = track.space * 0.24;
  const tone = track.instrument === "piano" ? 900 + track.tone * 5200 : 600 + track.tone * 7600;
  const attack = track.instrument === "piano" ? 0.006 : 0.018;
  const release = track.instrument === "piano" ? 0.32 : 0.2;
  const sustain = track.instrument === "piano" ? 0.18 : 0.34;
  const level = track.volume * note.velocity * 0.28;

  filter.type = track.instrument === "piano" ? "lowpass" : "lowpass";
  filter.frequency.setValueAtTime(tone, time);
  filter.Q.setValueAtTime(track.instrument === "synth" ? 6 + track.tone * 5 : 0.8, time);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(Math.max(level, 0.0002), time + attack);
  amp.gain.exponentialRampToValueAtTime(Math.max(level * sustain, 0.0002), time + Math.max(duration * 0.55, attack + 0.04));
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

  dry.gain.setValueAtTime(1 - wet, time);
  delay.delayTime.setValueAtTime(0.18 + track.space * 0.2, time);
  delayGain.gain.setValueAtTime(wet, time);
  feedback.gain.setValueAtTime(0.18 + track.space * 0.28, time);
  output.gain.setValueAtTime(0.9, time);
  pan.pan.setValueAtTime(track.instrument === "synth" ? -0.12 : 0.04, time);

  const oscOne = context.createOscillator();
  const oscTwo = context.createOscillator();
  oscOne.type = track.instrument === "piano" ? "triangle" : "sawtooth";
  oscTwo.type = track.instrument === "piano" ? "sine" : "square";
  oscOne.frequency.setValueAtTime(frequency, time);
  oscTwo.frequency.setValueAtTime(frequency * (track.instrument === "piano" ? 2 : 0.997), time);
  oscTwo.detune.setValueAtTime(track.instrument === "synth" ? 8 : -4, time);

  oscOne.connect(filter);
  oscTwo.connect(filter);
  filter.connect(amp);
  amp.connect(pan);
  pan.connect(dry);
  pan.connect(delay);
  delay.connect(delayGain);
  delay.connect(feedback);
  feedback.connect(delay);
  dry.connect(output);
  delayGain.connect(output);
  output.connect(context.destination);

  oscOne.start(time);
  oscTwo.start(time);
  const stopAt = time + duration + release + 0.18 + track.space * 0.45;
  oscOne.stop(stopAt);
  oscTwo.stop(stopAt);
}

function scheduleDrum(
  context: AudioContext,
  track: Track,
  voice: DrumVoice,
  time: number,
  velocity: number,
  noiseBuffer: AudioBuffer | null,
) {
  const output = context.createGain();
  output.gain.setValueAtTime(track.volume * velocity, time);
  output.connect(context.destination);

  if (voice === "kick") {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);
    gain.gain.setValueAtTime(0.95, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
    osc.connect(gain);
    gain.connect(output);
    osc.start(time);
    osc.stop(time + 0.26);
    return;
  }

  if (!noiseBuffer) return;
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = noiseBuffer;

  if (voice === "snare") {
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600 + track.tone * 1200, time);
    filter.Q.setValueAtTime(1.2, time);
    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "triangle";
    body.frequency.setValueAtTime(185, time);
    bodyGain.gain.setValueAtTime(0.16, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    body.connect(bodyGain);
    bodyGain.connect(output);
    body.start(time);
    body.stop(time + 0.14);
    noise.start(time);
    noise.stop(time + 0.2);
    return;
  }

  filter.type = voice === "clap" ? "bandpass" : "highpass";
  filter.frequency.setValueAtTime(voice === "clap" ? 1900 : 6500 + track.tone * 4000, time);
  gain.gain.setValueAtTime(voice === "clap" ? 0.28 : 0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (voice === "clap" ? 0.16 : 0.055));
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  noise.start(time);
  noise.stop(time + (voice === "clap" ? 0.18 : 0.07));
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
