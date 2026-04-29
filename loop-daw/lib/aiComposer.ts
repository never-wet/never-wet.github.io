import type { ArrangementPayload, DrumHit, NoteEvent, StyleId, TrackType } from "../store/useDAWStore";
import type { KeyName, ScaleName } from "./musicTheory";
import {
  NOTE_NAMES,
  SCALE_INTERVALS,
  buildTriad,
  CHORD_PROGRESSIONS,
  constrainToRoll,
  getDegreeRoot,
  getScaleNotes,
  midiToNote,
  noteToMidi,
  STEPS,
} from "./musicTheory";
import {
  NOTATION_MEASURES,
  createNotationId,
  durationToSignatureBeats,
  getTimeSignatureInfo,
  type NotationDuration,
  type NotationNote,
  type NotationStaff,
  type TimeSignature,
} from "./notation";

type StylePreset = {
  id: StyleId;
  label: string;
  progression: number[];
  melodyRhythm: number[];
  bassRhythm: number[];
  drumTemplate: Partial<Record<DrumHit["lane"], number[]>>;
  density: number;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "lofi",
    label: "Lofi",
    progression: [1, 6, 4, 5],
    melodyRhythm: [0, 3, 6, 8, 11, 14],
    bassRhythm: [0, 7, 8, 15],
    drumTemplate: { kick: [0, 7, 10], snare: [4, 12], hat: [2, 6, 10, 14], clap: [12] },
    density: 0.62,
  },
  {
    id: "trap",
    label: "Trap",
    progression: [6, 4, 1, 5],
    melodyRhythm: [0, 2, 6, 7, 10, 14],
    bassRhythm: [0, 3, 8, 11, 14],
    drumTemplate: { kick: [0, 3, 8, 11, 14], snare: [4, 12], hat: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], clap: [12] },
    density: 0.74,
  },
  {
    id: "edm",
    label: "EDM",
    progression: [1, 5, 6, 4],
    melodyRhythm: [0, 2, 4, 6, 8, 10, 12, 14],
    bassRhythm: [0, 4, 8, 12],
    drumTemplate: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], clap: [4, 12] },
    density: 0.82,
  },
  {
    id: "pop",
    label: "Pop",
    progression: [1, 5, 6, 4],
    melodyRhythm: [0, 2, 5, 8, 10, 13],
    bassRhythm: [0, 4, 8, 12],
    drumTemplate: { kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], clap: [12] },
    density: 0.7,
  },
  {
    id: "ambient",
    label: "Ambient",
    progression: [1, 3, 6, 4],
    melodyRhythm: [0, 5, 9, 14],
    bassRhythm: [0, 8],
    drumTemplate: { kick: [0], hat: [10], perc: [6, 14] },
    density: 0.42,
  },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function noteEvent(trackId: TrackType, step: number, note: string, length: number, velocity: number): NoteEvent {
  return {
    id: createId(`${trackId}-${step}-${note}`),
    trackId,
    step,
    note: constrainToRoll(note),
    length,
    velocity,
  };
}

function drumHit(lane: DrumHit["lane"], step: number, velocity: number): DrumHit {
  return {
    id: createId(`drum-${lane}-${step}`),
    trackId: "drums",
    lane,
    step,
    velocity,
  };
}

function choose<T>(items: T[], index: number) {
  return items[index % items.length];
}

export function getStylePreset(style: StyleId) {
  return STYLE_PRESETS.find((preset) => preset.id === style) ?? STYLE_PRESETS[0];
}

export function generateArrangement(style: StyleId, key: KeyName, scale: ScaleName): ArrangementPayload {
  const preset = getStylePreset(style);
  const scaleNotes = getScaleNotes(key, scale, 4);
  const notes: NoteEvent[] = [];
  const drums: DrumHit[] = [];
  const motif = preset.progression.flatMap((degree, index) => {
    const chord = buildTriad(key, scale, degree, 4);
    return [choose(chord, index), choose(scaleNotes, degree + index), choose(chord, index + 1)];
  });

  preset.progression.forEach((degree, bar) => {
    const step = bar * 4;
    const chord = buildTriad(key, scale, degree, 4);
    chord.forEach((note, noteIndex) => {
      notes.push(noteEvent("chords", step, note, 4, 0.52 + noteIndex * 0.04));
    });

  });

  preset.bassRhythm.forEach((step, index) => {
    const degree = preset.progression[Math.floor(step / 4)] ?? 1;
    const root = getDegreeRoot(key, scale, degree, 4);
    notes.push(noteEvent("bass", step, root, style === "edm" ? 1 : 2, 0.78 + (index % 2) * 0.08));
  });

  preset.melodyRhythm.forEach((step, index) => {
    const anchor = choose(motif, index + Math.floor(step / 4));
    const phraseNote = index % 4 === 3 ? choose(scaleNotes, index + 2) : anchor;
    const shouldRest = style === "ambient" ? index % 3 === 1 : index % 7 === 5 && preset.density < 0.75;
    if (!shouldRest && step < STEPS) {
      notes.push(noteEvent("melody", step, phraseNote, index % 3 === 0 ? 2 : 1, 0.68 + (index % 3) * 0.08));
    }
  });

  Object.entries(preset.drumTemplate).forEach(([lane, steps]) => {
    steps?.forEach((step, index) => {
      const velocity = lane === "kick" ? 0.92 : lane === "hat" ? 0.34 + (index % 2) * 0.2 : 0.72;
      drums.push(drumHit(lane as DrumHit["lane"], step, velocity));
    });
  });

  return { notes, drums };
}

export function generateAutoDrums(style: StyleId): DrumHit[] {
  const preset = getStylePreset(style);
  const drums: DrumHit[] = [];
  Object.entries(preset.drumTemplate).forEach(([lane, steps]) => {
    steps?.forEach((step, index) => {
      drums.push(drumHit(lane as DrumHit["lane"], step, lane === "hat" ? 0.38 + (index % 2) * 0.16 : 0.82));
    });
  });
  return drums;
}

export function generateChordRecommendation(key: KeyName, scale: ScaleName, progressionName: string): NoteEvent[] {
  const progression = CHORD_PROGRESSIONS.find((item) => item.name === progressionName) ?? CHORD_PROGRESSIONS[0];
  return progression.degrees.flatMap((degree, bar) =>
    buildTriad(key, scale, degree, 4).map((note, noteIndex) => noteEvent("chords", bar * 4, note, 4, 0.52 + noteIndex * 0.04)),
  );
}

function getScaleRange(key: KeyName, scale: ScaleName, low: string, high: string) {
  const root = NOTE_NAMES.indexOf(key);
  const scalePitchClasses = new Set(SCALE_INTERVALS[scale].map((interval) => (root + interval) % 12));
  const notes: string[] = [];
  for (let midi = noteToMidi(low); midi <= noteToMidi(high); midi += 1) {
    if (scalePitchClasses.has(((midi % 12) + 12) % 12)) notes.push(midiToNote(midi));
  }
  return notes.length ? notes : [low];
}

function notationNote(staff: NotationStaff, measure: number, beat: number, duration: NotationDuration, pitch: string): NotationNote {
  return {
    id: createNotationId(`ai-${staff}-${measure}-${beat}-${pitch}`),
    type: "note",
    pitch,
    duration,
    measure,
    beat,
    staff,
  };
}

export function generateNotationScore(key: KeyName, scale: ScaleName, timeSignature: TimeSignature, staff: NotationStaff = "treble"): NotationNote[] {
  const info = getTimeSignatureInfo(timeSignature);
  const primaryRange = staff === "bass" ? getScaleRange(key, scale, "C2", "C4") : getScaleRange(key, scale, "C4", "C6");
  const bassRange = getScaleRange(key, scale, "C2", "C3");
  const motif = staff === "bass" ? [0, 2, 4, 2, 5, 4, 1, 0] : [0, 2, 4, 5, 4, 2, 1, 0];
  const notes: NotationNote[] = [];
  const quarterBeats = durationToSignatureBeats("q", timeSignature);
  const eighthBeats = durationToSignatureBeats("8", timeSignature);

  for (let measure = 0; measure < NOTATION_MEASURES; measure += 1) {
    let beat = 0;
    let phraseIndex = 0;

    while (beat < info.numerator - 0.001) {
      const remaining = info.numerator - beat;
      const useEighth = measure % 2 === 1 && phraseIndex % 3 !== 1;
      const duration: NotationDuration = useEighth && remaining >= eighthBeats ? "8" : "q";
      const durationBeats = durationToSignatureBeats(duration, timeSignature);
      if (durationBeats > remaining + 0.001) break;

      const shouldRest = phraseIndex % 5 === 4 || (measure === 3 && remaining <= durationBeats + 0.001);
      if (!shouldRest) {
        const motifIndex = motif[(measure * 2 + phraseIndex) % motif.length];
        const pitch = primaryRange[(motifIndex + measure) % primaryRange.length];
        notes.push(notationNote(staff, measure, beat, duration, pitch));
      }

      beat += durationBeats;
      phraseIndex += 1;
    }

    if (staff === "treble" && quarterBeats <= info.numerator) {
      const root = bassRange[measure % bassRange.length] ?? "C2";
      const bassDuration: NotationDuration = info.numerator >= durationToSignatureBeats("h", timeSignature) ? "h" : "q";
      notes.push(notationNote("bass", measure, 0, bassDuration, root));
    }
  }

  return notes;
}
