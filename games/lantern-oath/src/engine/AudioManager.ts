import { contentRegistry } from "../memory/contentRegistry";
import type { SettingsState, SfxId, TrackId } from "../memory/types";

function noteToFrequency(note: string): number {
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) {
    return 440;
  }

  const [, pitch, sharp, octaveText] = match;
  const octave = Number(octaveText);
  const key = `${pitch}${sharp}`;
  const offsets: Record<string, number> = {
    C: -9,
    "C#": -8,
    D: -7,
    "D#": -6,
    E: -5,
    F: -4,
    "F#": -3,
    G: -2,
    "G#": -1,
    A: 0,
    "A#": 1,
    B: 2,
  };

  const semitone = offsets[key] + (octave - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

export class AudioManager {
  private context: AudioContext | null = null;
  private musicIntervalId: number | null = null;
  private currentTrackId: TrackId | null = null;
  private settings: SettingsState;

  constructor(initialSettings: SettingsState) {
    this.settings = initialSettings;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state !== "running") {
      await this.context.resume();
    }
  }

  applySettings(settings: SettingsState): void {
    this.settings = settings;
    if (settings.muteMusic || settings.masterVolume <= 0 || settings.musicVolume <= 0) {
      this.stopMusic();
    } else if (this.currentTrackId) {
      this.playMusic(this.currentTrackId);
    }
  }

  playMusic(trackId: TrackId): void {
    if (this.currentTrackId === trackId && this.musicIntervalId !== null) {
      return;
    }

    this.currentTrackId = trackId;
    this.stopMusic();

    if (!this.context || this.settings.muteMusic || this.settings.masterVolume <= 0 || this.settings.musicVolume <= 0) {
      return;
    }

    const track = contentRegistry.audioTracks[trackId];
    const stepDuration = 60 / track.tempo / 2;
    const barDurationMs = stepDuration * track.steps * 1000;

    const scheduleBar = () => {
      if (!this.context) {
        return;
      }

      const start = this.context.currentTime + 0.03;
      track.voices.forEach((voice) => {
        voice.notes.forEach((note, index) => {
          if (note === "-") {
            return;
          }

          const oscillator = this.context!.createOscillator();
          const gain = this.context!.createGain();
          oscillator.type = voice.wave;
          oscillator.frequency.value = noteToFrequency(note);

          const volume =
            voice.gain * this.settings.masterVolume * this.settings.musicVolume * (this.settings.muteMusic ? 0 : 1);
          gain.gain.setValueAtTime(volume, start + index * stepDuration);
          gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.01, 0.0001), start + index * stepDuration + stepDuration * 0.9);

          oscillator.connect(gain).connect(this.context!.destination);
          oscillator.start(start + index * stepDuration);
          oscillator.stop(start + index * stepDuration + stepDuration * 0.92);
        });
      });
    };

    scheduleBar();
    this.musicIntervalId = window.setInterval(scheduleBar, barDurationMs);
  }

  stopMusic(): void {
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  playSfx(id: SfxId): void {
    if (!this.context || this.settings.muteSfx || this.settings.masterVolume <= 0 || this.settings.sfxVolume <= 0) {
      return;
    }

    const now = this.context.currentTime;
    const gain = this.context.createGain();
    gain.connect(this.context.destination);
    gain.gain.value = this.settings.masterVolume * this.settings.sfxVolume * 0.15;

    const oscillator = this.context.createOscillator();
    oscillator.connect(gain);

    switch (id) {
      case "menu_move":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(520, now);
        oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.06);
        break;
      case "menu_accept":
      case "save":
      case "quest":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(420, now);
        oscillator.frequency.linearRampToValueAtTime(720, now + 0.12);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
        break;
      case "dialogue":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(680, now);
        oscillator.start(now);
        oscillator.stop(now + 0.02);
        break;
      case "swing":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.09);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
      case "hit":
      case "enemy_down":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(180, now);
        oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.12);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
        break;
      case "dodge":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(540, now + 0.08);
        oscillator.start(now);
        oscillator.stop(now + 0.09);
        break;
      case "projectile":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(610, now);
        oscillator.frequency.linearRampToValueAtTime(440, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.11);
        break;
      case "pickup":
      case "coin":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(540, now);
        oscillator.frequency.linearRampToValueAtTime(880, now + 0.08);
        oscillator.start(now);
        oscillator.stop(now + 0.09);
        break;
      case "heal":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(340, now);
        oscillator.frequency.linearRampToValueAtTime(620, now + 0.14);
        oscillator.start(now);
        oscillator.stop(now + 0.16);
        break;
    }
  }
}
