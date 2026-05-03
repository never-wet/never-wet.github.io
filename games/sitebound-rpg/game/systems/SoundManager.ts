import type { GameSettings } from "./SaveSystem";
import type { WeatherKind } from "../../store/useWorldStore";

export class SoundManager {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private weatherGain: GainNode | null = null;
  private musicTimer = 0;
  private stepTimer = 0;
  private settings: GameSettings;
  private weather: WeatherKind = "clear";

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  unlock() {
    if (this.context) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.weatherGain = this.context.createGain();
    this.musicGain.connect(this.context.destination);
    this.sfxGain.connect(this.context.destination);
    this.weatherGain.connect(this.context.destination);
    this.applySettings(this.settings);
  }

  applySettings(settings: GameSettings) {
    this.settings = settings;

    if (!this.context || !this.musicGain || !this.sfxGain || !this.weatherGain) {
      return;
    }

    const muted = settings.muted ? 0 : 1;
    this.musicGain.gain.value = settings.musicVolume * muted * 0.32;
    this.sfxGain.gain.value = settings.sfxVolume * muted * 0.4;
    this.weatherGain.gain.value = settings.sfxVolume * muted * 0.18;
  }

  update(deltaSeconds: number, moving: boolean) {
    if (!this.context || !this.musicGain || !this.sfxGain || !this.weatherGain) {
      return;
    }

    this.musicTimer -= deltaSeconds;
    this.stepTimer -= deltaSeconds;

    if (this.musicTimer <= 0) {
      this.musicTimer = 0.52;
      const sequence = [220, 277, 330, 392, 330, 277];
      const note = sequence[Math.floor(performance.now() / 520) % sequence.length];
      this.playTone(note, 0.08, "sine", this.musicGain);
    }

    if (moving && this.stepTimer <= 0) {
      this.stepTimer = 0.28;
      this.playTone(95, 0.035, "triangle", this.sfxGain);
    }

    if (this.weather !== "clear" && Math.random() < deltaSeconds * 2.2) {
      this.playTone(this.weather === "rain" ? 180 : this.weather === "wind" ? 120 : 260, 0.04, "sine", this.weatherGain);
    }
  }

  setWeather(weather: WeatherKind) {
    this.weather = weather;
  }

  playInteract() {
    if (this.sfxGain) {
      this.playTone(520, 0.07, "square", this.sfxGain);
    }
  }

  playPortal() {
    if (this.sfxGain) {
      this.playTone(330, 0.08, "sine", this.sfxGain);
      window.setTimeout(() => this.sfxGain && this.playTone(660, 0.08, "sine", this.sfxGain), 90);
    }
  }

  playUi() {
    if (this.sfxGain) {
      this.playTone(760, 0.045, "square", this.sfxGain);
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, gain: GainNode) {
    if (!this.context) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    envelope.gain.value = 0.001;
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start();
    envelope.gain.exponentialRampToValueAtTime(0.8, this.context.currentTime + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.stop(this.context.currentTime + duration + 0.01);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
