export const STEPS = 16;

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const KEYS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const SCALES = ["major", "minor"] as const;
export const PIANO_ROLL_NOTES = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"] as const;

export const DRUM_LANES = [
  { id: "kick", name: "Kick", key: "Z" },
  { id: "snare", name: "Snare", key: "X" },
  { id: "hat", name: "Hi-hat", key: "C" },
  { id: "clap", name: "Clap", key: "V" },
  { id: "perc", name: "Perc", key: "B" },
] as const;

export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
} as const;

export const CHORD_PROGRESSIONS = [
  { id: "pop", name: "I-V-vi-IV", degrees: [1, 5, 6, 4], label: "Pop lift" },
  { id: "jazz", name: "ii-V-I", degrees: [2, 5, 1, 1], label: "ii-V-I" },
  { id: "cinematic", name: "vi-IV-I-V", degrees: [6, 4, 1, 5], label: "Cinematic" },
  { id: "ambient", name: "I-iii-vi-IV", degrees: [1, 3, 6, 4], label: "Ambient" },
] as const;

export type KeyName = (typeof KEYS)[number];
export type ScaleName = (typeof SCALES)[number];
export type DrumLaneId = (typeof DRUM_LANES)[number]["id"];

export function noteToMidi(note: string) {
  const match = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!match) return 60;
  const [, name, octave] = match;
  return (Number(octave) + 1) * 12 + NOTE_NAMES.indexOf(name as (typeof NOTE_NAMES)[number]);
}

export function midiToNote(midi: number) {
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${name}${octave}`;
}

export function transposeNote(note: string, semitones: number) {
  return midiToNote(noteToMidi(note) + semitones);
}

export function getScaleNotes(key: KeyName, scale: ScaleName, octave = 4) {
  const root = NOTE_NAMES.indexOf(key);
  return SCALE_INTERVALS[scale].map((interval) => `${NOTE_NAMES[(root + interval) % 12]}${octave}`);
}

export function constrainToRoll(note: string) {
  const pitch = note.replace(/\d$/, "4");
  return PIANO_ROLL_NOTES.includes(pitch as (typeof PIANO_ROLL_NOTES)[number]) ? pitch : "C4";
}

export function getDegreeRoot(key: KeyName, scale: ScaleName, degree: number, octave = 4) {
  const scaleNotes = getScaleNotes(key, scale, octave);
  return scaleNotes[(degree - 1 + scaleNotes.length) % scaleNotes.length];
}

export function buildTriad(key: KeyName, scale: ScaleName, degree: number, octave = 4) {
  const scaleNotes = getScaleNotes(key, scale, octave);
  const rootIndex = degree - 1;
  const root = noteToMidi(scaleNotes[rootIndex % scaleNotes.length]);
  const third = noteToMidi(scaleNotes[(rootIndex + 2) % scaleNotes.length]);
  const fifth = noteToMidi(scaleNotes[(rootIndex + 4) % scaleNotes.length]);
  return [root, third < root ? third + 12 : third, fifth < root ? fifth + 12 : fifth]
    .map(midiToNote)
    .map(constrainToRoll);
}

export function quantizeStep(value: number) {
  return Math.max(0, Math.min(STEPS - 1, Math.round(value)));
}

export function getRecommendedProgressions() {
  return CHORD_PROGRESSIONS;
}
