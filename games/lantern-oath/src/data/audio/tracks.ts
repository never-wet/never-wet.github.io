import type { AudioTrackDefinition } from "../../memory/types";

export const audioTracks: AudioTrackDefinition[] = [
  {
    id: "title_theme",
    label: "Lantern Overture",
    tempo: 92,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.07, notes: ["C4", "-", "G4", "-", "A4", "-", "G4", "-", "E4", "-", "D4", "-", "G4", "-", "C5", "-"] },
      { wave: "triangle", gain: 0.06, notes: ["C2", "-", "C2", "-", "A1", "-", "A1", "-", "F1", "-", "G1", "-", "C2", "-", "C2", "-"] },
    ],
  },
  {
    id: "emberwharf_theme",
    label: "Hearthroad",
    tempo: 104,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.06, notes: ["G4", "-", "A4", "-", "B4", "-", "D5", "-", "B4", "-", "A4", "-", "G4", "-", "E4", "-"] },
      { wave: "triangle", gain: 0.05, notes: ["G2", "-", "D2", "-", "E2", "-", "D2", "-", "C2", "-", "D2", "-", "G2", "-", "D2", "-"] },
    ],
  },
  {
    id: "sunglade_theme",
    label: "Bellglass Market",
    tempo: 110,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.06, notes: ["D4", "F4", "A4", "F4", "E4", "G4", "B4", "G4", "D4", "F4", "A4", "F4", "C5", "B4", "A4", "G4"] },
      { wave: "triangle", gain: 0.045, notes: ["D2", "-", "A1", "-", "B1", "-", "G1", "-", "D2", "-", "A1", "-", "C2", "-", "B1", "-"] },
    ],
  },
  {
    id: "wilds_theme",
    label: "Road of Windgrass",
    tempo: 96,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.055, notes: ["A4", "-", "C5", "-", "B4", "-", "A4", "-", "E4", "-", "G4", "-", "A4", "-", "B4", "-"] },
      { wave: "triangle", gain: 0.045, notes: ["A2", "-", "E2", "-", "F2", "-", "E2", "-", "D2", "-", "E2", "-", "A2", "-", "E2", "-"] },
    ],
  },
  {
    id: "coast_theme",
    label: "Brass Tide",
    tempo: 90,
    steps: 16,
    voices: [
      { wave: "triangle", gain: 0.055, notes: ["E4", "-", "G4", "-", "B4", "-", "A4", "-", "G4", "-", "E4", "-", "D4", "-", "B3", "-"] },
      { wave: "sine", gain: 0.045, notes: ["E2", "-", "B1", "-", "C2", "-", "B1", "-", "A1", "-", "B1", "-", "E2", "-", "B1", "-"] },
    ],
  },
  {
    id: "ruin_theme",
    label: "Glassroot Echo",
    tempo: 86,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.055, notes: ["D4", "-", "F4", "-", "A4", "-", "C5", "-", "A4", "-", "F4", "-", "E4", "-", "D4", "-"] },
      { wave: "triangle", gain: 0.042, notes: ["D2", "-", "A1", "-", "F1", "-", "A1", "-", "C2", "-", "A1", "-", "D2", "-", "A1", "-"] },
    ],
  },
  {
    id: "battle_theme",
    label: "Ash Rush",
    tempo: 126,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.065, notes: ["A4", "A4", "C5", "A4", "D5", "A4", "C5", "A4", "G4", "G4", "B4", "G4", "C5", "G4", "B4", "G4"] },
      { wave: "triangle", gain: 0.055, notes: ["A2", "-", "A2", "-", "D2", "-", "D2", "-", "G2", "-", "G2", "-", "C2", "-", "C2", "-"] },
    ],
  },
  {
    id: "boss_theme",
    label: "Rootfire Crown",
    tempo: 134,
    steps: 16,
    voices: [
      { wave: "square", gain: 0.07, notes: ["C5", "B4", "A4", "G4", "F4", "G4", "A4", "C5", "D5", "C5", "A4", "G4", "F4", "G4", "A4", "B4"] },
      { wave: "sawtooth", gain: 0.035, notes: ["C3", "-", "C3", "-", "A2", "-", "A2", "-", "F2", "-", "F2", "-", "G2", "-", "G2", "-"] },
    ],
  },
  {
    id: "menu_theme",
    label: "Quiet Ledger",
    tempo: 82,
    steps: 16,
    voices: [
      { wave: "triangle", gain: 0.045, notes: ["G4", "-", "B4", "-", "D5", "-", "B4", "-", "A4", "-", "C5", "-", "E5", "-", "C5", "-"] },
      { wave: "sine", gain: 0.035, notes: ["G2", "-", "D2", "-", "E2", "-", "D2", "-", "A1", "-", "E2", "-", "C2", "-", "G1", "-"] },
    ],
  },
];
