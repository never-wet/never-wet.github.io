import { create } from "zustand";
import type { CompositionMode, NotationDuration, NotationNote, NotationStaff, NotationTool, TimeSignature } from "../lib/notation";
import type { DrumLaneId, KeyName, ScaleName } from "../lib/musicTheory";
import { STEPS } from "../lib/musicTheory";

export type TrackType = "melody" | "chords" | "bass" | "drums";
export type Instrument = "piano" | "synth" | "pluck" | "bass" | "drumKit";
export type StyleId = "lofi" | "trap" | "edm" | "pop" | "ambient";

export type Track = {
  id: TrackType;
  name: string;
  type: TrackType;
  instrument: Instrument;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
};

export type NoteEvent = {
  id: string;
  trackId: TrackType;
  step: number;
  note: string;
  length: number;
  velocity: number;
};

export type DrumHit = {
  id: string;
  trackId: "drums";
  step: number;
  lane: DrumLaneId;
  velocity: number;
};

export type ArrangementPayload = {
  notes: NoteEvent[];
  drums: DrumHit[];
};

type DAWState = {
  compositionMode: CompositionMode;
  tracks: Track[];
  notes: NoteEvent[];
  drums: DrumHit[];
  notationNotes: NotationNote[];
  selectedNotationDuration: NotationDuration;
  notationTool: NotationTool;
  selectedNotationStaff: NotationStaff;
  selectedNotationId: string | null;
  timeSignature: TimeSignature;
  selectedTrackId: TrackType;
  bpm: number;
  key: KeyName;
  scale: ScaleName;
  selectedStyle: StyleId;
  selectedProgression: string;
  isPlaying: boolean;
  isRecording: boolean;
  loopEnabled: boolean;
  activeStep: number;
  masterVolume: number;
  triggeredIds: string[];
  setCompositionMode: (compositionMode: CompositionMode) => void;
  setBpm: (bpm: number) => void;
  setKey: (key: KeyName) => void;
  setScale: (scale: ScaleName) => void;
  setStyle: (style: StyleId) => void;
  setProgression: (progression: string) => void;
  setSelectedTrack: (trackId: TrackType) => void;
  setPlaying: (isPlaying: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  setLoopEnabled: (loopEnabled: boolean) => void;
  setActiveStep: (activeStep: number) => void;
  setMasterVolume: (masterVolume: number) => void;
  updateTrack: (trackId: TrackType, patch: Partial<Track>) => void;
  toggleMute: (trackId: TrackType) => void;
  toggleSolo: (trackId: TrackType) => void;
  toggleNote: (trackId: TrackType, step: number, note: string) => void;
  addNote: (note: Omit<NoteEvent, "id">) => void;
  recordNote: (note: string) => void;
  setTrackNotes: (trackId: TrackType, notes: NoteEvent[]) => void;
  clearTrack: (trackId: TrackType) => void;
  toggleDrumHit: (lane: DrumLaneId, step: number) => void;
  setDrumPattern: (hits: DrumHit[]) => void;
  replaceArrangement: (payload: ArrangementPayload) => void;
  setNotationDuration: (duration: NotationDuration) => void;
  setNotationTool: (tool: NotationTool) => void;
  setNotationStaff: (staff: NotationStaff) => void;
  setTimeSignature: (timeSignature: TimeSignature) => void;
  addNotationNote: (note: Omit<NotationNote, "id">) => void;
  setNotationScore: (notes: NotationNote[]) => void;
  removeNotationNote: (id: string) => void;
  selectNotationNote: (id: string | null) => void;
  clearNotation: () => void;
  flashTriggered: (ids: string[]) => void;
};

const initialTracks: Track[] = [
  { id: "melody", name: "Melody", type: "melody", instrument: "piano", color: "#5eead4", volume: 0.78, muted: false, solo: false },
  { id: "chords", name: "Chords", type: "chords", instrument: "pluck", color: "#a78bfa", volume: 0.62, muted: false, solo: false },
  { id: "bass", name: "Bass", type: "bass", instrument: "bass", color: "#fbbf24", volume: 0.68, muted: false, solo: false },
  { id: "drums", name: "Drums", type: "drums", instrument: "drumKit", color: "#fb7185", volume: 0.72, muted: false, solo: false },
];

const starterNotes: NoteEvent[] = [
  { id: "melody-0-c4", trackId: "melody", step: 0, note: "C4", length: 1, velocity: 0.82 },
  { id: "melody-2-e4", trackId: "melody", step: 2, note: "E4", length: 1, velocity: 0.78 },
  { id: "melody-4-g4", trackId: "melody", step: 4, note: "G4", length: 2, velocity: 0.82 },
  { id: "melody-8-a4", trackId: "melody", step: 8, note: "A4", length: 1, velocity: 0.76 },
  { id: "melody-10-g4", trackId: "melody", step: 10, note: "G4", length: 1, velocity: 0.78 },
  { id: "melody-12-e4", trackId: "melody", step: 12, note: "E4", length: 2, velocity: 0.82 },
  { id: "chords-0-c4", trackId: "chords", step: 0, note: "C4", length: 4, velocity: 0.62 },
  { id: "chords-0-e4", trackId: "chords", step: 0, note: "E4", length: 4, velocity: 0.58 },
  { id: "chords-0-g4", trackId: "chords", step: 0, note: "G4", length: 4, velocity: 0.58 },
  { id: "bass-0-c4", trackId: "bass", step: 0, note: "C4", length: 2, velocity: 0.88 },
  { id: "bass-8-g4", trackId: "bass", step: 8, note: "G4", length: 2, velocity: 0.8 },
];

const starterDrums: DrumHit[] = [
  { id: "kick-0", trackId: "drums", step: 0, lane: "kick", velocity: 0.96 },
  { id: "kick-8", trackId: "drums", step: 8, lane: "kick", velocity: 0.92 },
  { id: "snare-4", trackId: "drums", step: 4, lane: "snare", velocity: 0.82 },
  { id: "snare-12", trackId: "drums", step: 12, lane: "snare", velocity: 0.84 },
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((step) => ({
    id: `hat-${step}`,
    trackId: "drums" as const,
    step,
    lane: "hat" as const,
    velocity: step % 4 === 0 ? 0.52 : 0.4,
  })),
];

const starterNotationNotes: NotationNote[] = [
  { id: "classic-c4", type: "note", pitch: "C4", duration: "q", beat: 0, measure: 0, staff: "treble" },
  { id: "classic-e4", type: "note", pitch: "E4", duration: "q", beat: 1, measure: 0, staff: "treble" },
  { id: "classic-g4", type: "note", pitch: "G4", duration: "h", beat: 2, measure: 0, staff: "treble" },
  { id: "classic-c3", type: "note", pitch: "C3", duration: "h", beat: 0, measure: 0, staff: "bass" },
  { id: "classic-g2", type: "note", pitch: "G2", duration: "h", beat: 2, measure: 0, staff: "bass" },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clampVolume(value: number) {
  return Math.max(0, Math.min(1, value));
}

export const useDAWStore = create<DAWState>((set, get) => ({
  compositionMode: "modern",
  tracks: initialTracks,
  notes: starterNotes,
  drums: starterDrums,
  notationNotes: starterNotationNotes,
  selectedNotationDuration: "q",
  notationTool: "note",
  selectedNotationStaff: "treble",
  selectedNotationId: null,
  timeSignature: "4/4",
  selectedTrackId: "melody",
  bpm: 118,
  key: "C",
  scale: "major",
  selectedStyle: "lofi",
  selectedProgression: "I-V-vi-IV",
  isPlaying: false,
  isRecording: false,
  loopEnabled: true,
  activeStep: -1,
  masterVolume: 0.82,
  triggeredIds: [],
  setCompositionMode: (compositionMode) => set({ compositionMode, activeStep: -1, triggeredIds: [] }),
  setBpm: (bpm) => set({ bpm: Math.max(60, Math.min(180, Math.round(bpm))) }),
  setKey: (key) => set({ key }),
  setScale: (scale) => set({ scale }),
  setStyle: (selectedStyle) => set({ selectedStyle }),
  setProgression: (selectedProgression) => set({ selectedProgression }),
  setSelectedTrack: (selectedTrackId) => set({ selectedTrackId }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setRecording: (isRecording) => set({ isRecording }),
  setLoopEnabled: (loopEnabled) => set({ loopEnabled }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setMasterVolume: (masterVolume) => set({ masterVolume: clampVolume(masterVolume) }),
  updateTrack: (trackId, patch) =>
    set((state) => ({
      tracks: state.tracks.map((track) => (track.id === trackId ? { ...track, ...patch, volume: patch.volume ?? track.volume } : track)),
    })),
  toggleMute: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => (track.id === trackId ? { ...track, muted: !track.muted } : track)),
    })),
  toggleSolo: (trackId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => (track.id === trackId ? { ...track, solo: !track.solo } : track)),
    })),
  toggleNote: (trackId, step, note) =>
    set((state) => {
      const existing = state.notes.find((item) => item.trackId === trackId && item.step === step && item.note === note);
      if (existing) {
        return { notes: state.notes.filter((item) => item.id !== existing.id) };
      }
      return {
        notes: [
          ...state.notes,
          {
            id: createId(`${trackId}-${step}-${note}`),
            trackId,
            step: Math.max(0, Math.min(STEPS - 1, step)),
            note,
            length: trackId === "chords" ? 4 : 1,
            velocity: trackId === "bass" ? 0.9 : 0.78,
          },
        ],
      };
    }),
  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, { ...note, id: createId(`${note.trackId}-${note.step}-${note.note}`) }],
    })),
  recordNote: (note) => {
    const state = get();
    const selected = state.selectedTrackId === "drums" ? "melody" : state.selectedTrackId;
    const step = state.activeStep >= 0 ? state.activeStep : 0;
    const exists = state.notes.some((item) => item.trackId === selected && item.step === step && item.note === note);
    if (exists) return;
    get().addNote({ trackId: selected, step, note, length: 1, velocity: 0.88 });
  },
  setTrackNotes: (trackId, notes) =>
    set((state) => ({
      notes: [...state.notes.filter((note) => note.trackId !== trackId), ...notes],
    })),
  clearTrack: (trackId) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.trackId !== trackId),
      drums: trackId === "drums" ? [] : state.drums,
    })),
  toggleDrumHit: (lane, step) =>
    set((state) => {
      const existing = state.drums.find((hit) => hit.lane === lane && hit.step === step);
      if (existing) {
        return { drums: state.drums.filter((hit) => hit.id !== existing.id) };
      }
      return {
        drums: [
          ...state.drums,
          { id: createId(`drum-${lane}-${step}`), trackId: "drums", step, lane, velocity: lane === "kick" ? 0.96 : 0.74 },
        ],
      };
    }),
  setDrumPattern: (hits) => set({ drums: hits }),
  replaceArrangement: (payload) => set({ notes: payload.notes, drums: payload.drums }),
  setNotationDuration: (selectedNotationDuration) => set({ selectedNotationDuration }),
  setNotationTool: (notationTool) => set({ notationTool }),
  setNotationStaff: (selectedNotationStaff) => set({ selectedNotationStaff }),
  setTimeSignature: (timeSignature) => set({ timeSignature }),
  addNotationNote: (note) =>
    set((state) => ({
      notationNotes: [
        ...state.notationNotes.filter(
          (item) => !(item.measure === note.measure && item.staff === note.staff && item.beat === note.beat),
        ),
        { ...note, id: createId(`notation-${note.measure}-${note.beat}-${note.pitch ?? note.type}`) },
      ],
      selectedNotationId: null,
    })),
  setNotationScore: (notationNotes) => set({ notationNotes, selectedNotationId: null }),
  removeNotationNote: (id) =>
    set((state) => ({
      notationNotes: state.notationNotes.filter((note) => note.id !== id),
      selectedNotationId: state.selectedNotationId === id ? null : state.selectedNotationId,
    })),
  selectNotationNote: (selectedNotationId) => set({ selectedNotationId }),
  clearNotation: () => set({ notationNotes: [], selectedNotationId: null }),
  flashTriggered: (triggeredIds) => set({ triggeredIds }),
}));
