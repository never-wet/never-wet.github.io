import type { KeyName, ScaleName } from "./musicTheory";
import { midiToNote, noteToMidi } from "./musicTheory";

export type CompositionMode = "modern" | "classic";
export type NotationDuration = "w" | "h" | "q" | "8";
export type NotationTool = "note" | "rest" | "erase";
export type NotationStaff = "treble" | "bass";
export type TimeSignature = "2/4" | "3/4" | "4/4" | "6/8" | "9/8" | "12/8" | "2/2" | "3/8" | "5/4" | "7/8";
export type NotationItemType = "note" | "rest";

export type NotationNote = {
  id: string;
  type: NotationItemType;
  pitch?: string;
  duration: NotationDuration;
  measure: number;
  beat: number;
  staff: NotationStaff;
};

export type NotationClickResult = {
  measure: number;
  beat: number;
  staff: NotationStaff;
  pitch: string;
};

export const NOTATION_MEASURES = 4;
export const CLASSIC_STEPS_PER_QUARTER = 4;

export const SHEET_WIDTH = 980;
export const SHEET_HEIGHT = 344;
export const SHEET_MARGIN_X = 30;
export const MEASURE_WIDTH = 226;
export const TREBLE_Y = 58;
export const BASS_Y = 190;
export const STAFF_LINE_GAP = 10;
export const STAFF_HEIGHT = STAFF_LINE_GAP * 4;
const VEXFLOW_STAFF_TOP_OFFSET = 40;
const STAFF_LEDGER_HIT_PADDING = 26;
const FIRST_MEASURE_NOTE_START_X = 88;
const FIRST_MEASURE_NOTE_END_X = 211;
const MEASURE_NOTE_START_X = 28;
const MEASURE_NOTE_END_X = 192;

export const TIME_SIGNATURES: Array<{ value: TimeSignature; numerator: number; denominator: 2 | 4 | 8 }> = [
  { value: "2/4", numerator: 2, denominator: 4 },
  { value: "3/4", numerator: 3, denominator: 4 },
  { value: "4/4", numerator: 4, denominator: 4 },
  { value: "6/8", numerator: 6, denominator: 8 },
  { value: "9/8", numerator: 9, denominator: 8 },
  { value: "12/8", numerator: 12, denominator: 8 },
  { value: "2/2", numerator: 2, denominator: 2 },
  { value: "3/8", numerator: 3, denominator: 8 },
  { value: "5/4", numerator: 5, denominator: 4 },
  { value: "7/8", numerator: 7, denominator: 8 },
];

export const NOTATION_DURATIONS: Array<{ value: NotationDuration; label: string; quarterBeats: number }> = [
  { value: "w", label: "Whole", quarterBeats: 4 },
  { value: "h", label: "Half", quarterBeats: 2 },
  { value: "q", label: "Quarter", quarterBeats: 1 },
  { value: "8", label: "Eighth", quarterBeats: 0.5 },
];

const TREBLE_PITCH_ROWS = buildDiatonicRows("C4", "C6");
const BASS_PITCH_ROWS = buildDiatonicRows("C2", "C4");

function buildDiatonicRows(low: string, high: string) {
  const naturalPitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
  const lowMidi = noteToMidi(low);
  const highMidi = noteToMidi(high);
  const notes: string[] = [];
  for (let midi = highMidi; midi >= lowMidi; midi -= 1) {
    if (naturalPitchClasses.has(((midi % 12) + 12) % 12)) {
      notes.push(midiToNote(midi));
    }
  }
  return notes;
}

export function getTimeSignatureInfo(timeSignature: TimeSignature) {
  return TIME_SIGNATURES.find((item) => item.value === timeSignature) ?? TIME_SIGNATURES[2];
}

export function beatUnitQuarterBeats(timeSignature: TimeSignature) {
  const info = getTimeSignatureInfo(timeSignature);
  return 4 / info.denominator;
}

export function measureQuarterBeats(timeSignature: TimeSignature) {
  const info = getTimeSignatureInfo(timeSignature);
  return info.numerator * beatUnitQuarterBeats(timeSignature);
}

export function durationToQuarterBeats(duration: NotationDuration) {
  return NOTATION_DURATIONS.find((item) => item.value === duration)?.quarterBeats ?? 1;
}

export function durationToSignatureBeats(duration: NotationDuration, timeSignature: TimeSignature) {
  return durationToQuarterBeats(duration) / beatUnitQuarterBeats(timeSignature);
}

export function durationToSixteenthSteps(duration: NotationDuration) {
  return durationToQuarterBeats(duration) * CLASSIC_STEPS_PER_QUARTER;
}

export function getClassicTotalSteps(timeSignature: TimeSignature) {
  return Math.round(NOTATION_MEASURES * measureQuarterBeats(timeSignature) * CLASSIC_STEPS_PER_QUARTER);
}

export function notationStep(note: Pick<NotationNote, "measure" | "beat">, timeSignature: TimeSignature) {
  const measureOffset = note.measure * measureQuarterBeats(timeSignature);
  const beatOffset = note.beat * beatUnitQuarterBeats(timeSignature);
  return Math.round((measureOffset + beatOffset) * CLASSIC_STEPS_PER_QUARTER);
}

export function stepToMeasure(step: number, timeSignature: TimeSignature) {
  const stepsPerMeasure = measureQuarterBeats(timeSignature) * CLASSIC_STEPS_PER_QUARTER;
  return Math.max(0, Math.min(NOTATION_MEASURES - 1, Math.floor(step / stepsPerMeasure)));
}

export function pitchToVexKey(pitch: string) {
  const match = /^([A-G])(#?)(-?\d)$/.exec(pitch);
  if (!match) return "c/4";
  const [, name, accidental, octave] = match;
  return `${name.toLowerCase()}${accidental}/${octave}`;
}

export function pitchAccidental(pitch?: string) {
  return pitch?.includes("#") ? "#" : null;
}

export function pitchToDisplay(pitch: string | undefined, key: KeyName, scale: ScaleName) {
  return `${pitch ?? "Rest"} in ${key} ${scale}`;
}

export function restKeyForStaff(staff: NotationStaff) {
  return staff === "treble" ? "b/4" : "d/3";
}

export function restDuration(duration: NotationDuration) {
  return `${duration}r`;
}

function quantizeBeat(rawBeat: number, duration: NotationDuration, timeSignature: TimeSignature) {
  const grid = durationToSignatureBeats(duration, timeSignature);
  const maxBeat = Math.max(0, getTimeSignatureInfo(timeSignature).numerator - durationToSignatureBeats(duration, timeSignature));
  return Math.max(0, Math.min(maxBeat, Math.round(rawBeat / grid) * grid));
}

function beatFromX(x: number, measure: number, duration: NotationDuration, timeSignature: TimeSignature) {
  const measureX = SHEET_MARGIN_X + measure * MEASURE_WIDTH;
  const start = measureX + (measure === 0 ? FIRST_MEASURE_NOTE_START_X : MEASURE_NOTE_START_X);
  const end = measureX + (measure === 0 ? FIRST_MEASURE_NOTE_END_X : MEASURE_NOTE_END_X);
  const maxBeat = Math.max(0, getTimeSignatureInfo(timeSignature).numerator - durationToSignatureBeats(duration, timeSignature));

  if (maxBeat <= 0) return 0;
  const clampedX = Math.max(start, Math.min(end, x));
  const rawBeat = ((clampedX - start) / (end - start)) * maxBeat;
  return quantizeBeat(rawBeat, duration, timeSignature);
}

function staffLineBounds(staff: NotationStaff) {
  const y = staff === "treble" ? TREBLE_Y : BASS_Y;
  const top = y + VEXFLOW_STAFF_TOP_OFFSET;
  return { top, bottom: top + STAFF_HEIGHT, center: top + STAFF_HEIGHT / 2 };
}

function staffHitBounds(staff: NotationStaff) {
  const bounds = staffLineBounds(staff);
  return {
    top: bounds.top - STAFF_LEDGER_HIT_PADDING,
    bottom: bounds.bottom + STAFF_LEDGER_HIT_PADDING,
    center: bounds.center,
  };
}

function pickStaff(y: number, selectedStaff: NotationStaff) {
  const treble = staffHitBounds("treble");
  const bass = staffHitBounds("bass");
  const inTreble = y >= treble.top && y <= treble.bottom;
  const inBass = y >= bass.top && y <= bass.bottom;

  if (inTreble || inBass) {
    if (inTreble && !inBass) return "treble";
    if (inBass && !inTreble) return "bass";
    return Math.abs(y - treble.center) <= Math.abs(y - bass.center) ? "treble" : "bass";
  }

  return selectedStaff;
}

function pitchFromY(staff: NotationStaff, y: number) {
  const rows = staff === "treble" ? TREBLE_PITCH_ROWS : BASS_PITCH_ROWS;
  const bounds = staffLineBounds(staff);
  const anchorPitch = staff === "treble" ? "F5" : "A3";
  const anchorRow = Math.max(0, rows.indexOf(anchorPitch));
  const row = Math.max(0, Math.min(rows.length - 1, Math.round(anchorRow + (y - bounds.top) / (STAFF_LINE_GAP / 2))));
  return rows[row];
}

export function getNotationPositionFromPoint(
  x: number,
  y: number,
  duration: NotationDuration,
  timeSignature: TimeSignature,
  selectedStaff: NotationStaff,
): NotationClickResult | null {
  const measure = Math.floor((x - SHEET_MARGIN_X) / MEASURE_WIDTH);
  if (measure < 0 || measure >= NOTATION_MEASURES) return null;

  const staff = pickStaff(y, selectedStaff);
  const bounds = staffHitBounds(staff);
  if (y < bounds.top || y > bounds.bottom) return null;

  return {
    measure,
    beat: beatFromX(x, measure, duration, timeSignature),
    staff,
    pitch: pitchFromY(staff, y),
  };
}

export function sortNotation(notes: NotationNote[]) {
  return [...notes].sort((a, b) => a.measure - b.measure || a.beat - b.beat || (a.pitch ?? "").localeCompare(b.pitch ?? ""));
}

export function createNotationId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
