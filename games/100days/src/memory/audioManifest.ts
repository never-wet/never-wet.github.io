import type { AudioCueDefinition, MusicTrackDefinition } from "./types";

export const musicTracks: MusicTrackDefinition[] = [
  {
    id: "menu-drift",
    bpm: 88,
    scale: [220, 261.63, 293.66, 329.63, 392, 440],
    bass: [0, 2, 4, 2],
    melody: [3, 4, 2, 1, 4, 5, 3, 2],
    pulseGain: 0.18,
    waveform: "triangle",
  },
  {
    id: "field-drive",
    bpm: 116,
    scale: [196, 220, 246.94, 293.66, 329.63, 392],
    bass: [0, 0, 2, 3],
    melody: [4, 2, 3, 4, 5, 4, 2, 1],
    pulseGain: 0.2,
    waveform: "sawtooth",
  },
  {
    id: "danger-bloom",
    bpm: 132,
    scale: [164.81, 196, 220, 246.94, 293.66, 329.63],
    bass: [0, 1, 0, 4],
    melody: [5, 4, 3, 5, 2, 4, 1, 3],
    pulseGain: 0.24,
    waveform: "square",
  },
  {
    id: "victory-rise",
    bpm: 96,
    scale: [220, 277.18, 329.63, 369.99, 440, 554.37],
    bass: [0, 2, 4, 5],
    melody: [2, 3, 4, 5, 4, 3, 5, 4],
    pulseGain: 0.18,
    waveform: "triangle",
  },
];

export const audioCues: AudioCueDefinition[] = [
  { id: "ui-select", waveform: "triangle", gain: 0.08, attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.08, baseFrequency: 540, glide: 90 },
  { id: "player-hit", waveform: "square", gain: 0.11, attack: 0.001, decay: 0.08, sustain: 0.02, release: 0.12, baseFrequency: 180, glide: -60, noiseMix: 0.25 },
  { id: "enemy-hit", waveform: "sawtooth", gain: 0.06, attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.08, baseFrequency: 240, glide: -40, noiseMix: 0.14 },
  { id: "enemy-die", waveform: "triangle", gain: 0.08, attack: 0.001, decay: 0.08, sustain: 0, release: 0.12, baseFrequency: 290, glide: -120, noiseMix: 0.12 },
  { id: "pickup", waveform: "sine", gain: 0.08, attack: 0.001, decay: 0.08, sustain: 0.02, release: 0.1, baseFrequency: 680, glide: 120 },
  { id: "level-up", waveform: "triangle", gain: 0.1, attack: 0.01, decay: 0.12, sustain: 0.02, release: 0.22, baseFrequency: 420, glide: 320 },
  { id: "boss-warning", waveform: "square", gain: 0.12, attack: 0.01, decay: 0.18, sustain: 0.04, release: 0.24, baseFrequency: 132, glide: -18, noiseMix: 0.18 },
  { id: "day-clear", waveform: "triangle", gain: 0.1, attack: 0.01, decay: 0.18, sustain: 0.05, release: 0.26, baseFrequency: 320, glide: 180 },
  { id: "game-over", waveform: "sawtooth", gain: 0.12, attack: 0.01, decay: 0.16, sustain: 0.02, release: 0.35, baseFrequency: 150, glide: -90, noiseMix: 0.16 },
  { id: "victory", waveform: "triangle", gain: 0.14, attack: 0.01, decay: 0.22, sustain: 0.08, release: 0.38, baseFrequency: 392, glide: 220 },
  { id: "weapon-fire", waveform: "square", gain: 0.04, attack: 0.001, decay: 0.04, sustain: 0, release: 0.04, baseFrequency: 460, glide: -30 },
  { id: "upgrade-lock", waveform: "triangle", gain: 0.09, attack: 0.01, decay: 0.14, sustain: 0.03, release: 0.18, baseFrequency: 600, glide: 140 },
];
