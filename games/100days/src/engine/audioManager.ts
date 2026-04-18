import { contentRegistry } from "../memory/contentRegistry";
import type { MusicTrackId, SfxId, SettingsData } from "../memory/types";

const stepDuration = (bpm: number): number => 60 / bpm / 2;

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private currentTrack: MusicTrackId | null = null;
  private stepIndex = 0;
  private nextStepTime = 0;
  private settings: SettingsData | null = null;

  unlock(): void {
    if (this.context) {
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return;
    }

    const context = new AudioContext();
    const master = context.createGain();
    const music = context.createGain();
    const sfx = context.createGain();
    master.connect(context.destination);
    music.connect(master);
    sfx.connect(master);

    this.context = context;
    this.master = master;
    this.music = music;
    this.sfx = sfx;

    if (this.settings) {
      this.applySettings(this.settings);
    }
  }

  applySettings(settings: SettingsData): void {
    this.settings = settings;
    if (!this.master || !this.music || !this.sfx) {
      return;
    }
    this.master.gain.value = settings.muted ? 0 : settings.masterVolume;
    this.music.gain.value = settings.musicMuted ? 0 : settings.musicVolume;
    this.sfx.gain.value = settings.sfxMuted ? 0 : settings.sfxVolume;
  }

  setTrack(trackId: MusicTrackId | null): void {
    if (this.currentTrack === trackId) {
      return;
    }
    this.currentTrack = trackId;
    if (this.context) {
      this.stepIndex = 0;
      this.nextStepTime = this.context.currentTime + 0.04;
    }
  }

  playCue(id: SfxId): void {
    if (!this.context || !this.sfx) {
      return;
    }
    const cue = contentRegistry.audio.cues[id];
    if (!cue) {
      return;
    }

    const now = this.context.currentTime;
    const gain = this.context.createGain();
    const oscillator = this.context.createOscillator();

    oscillator.type = cue.waveform;
    oscillator.frequency.setValueAtTime(cue.baseFrequency, now);
    if (cue.glide) {
      oscillator.frequency.linearRampToValueAtTime(cue.baseFrequency + cue.glide, now + cue.attack + cue.decay + cue.release);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(cue.gain, now + cue.attack);
    gain.gain.linearRampToValueAtTime(cue.sustain, now + cue.attack + cue.decay);
    gain.gain.linearRampToValueAtTime(0.0001, now + cue.attack + cue.decay + cue.release);

    oscillator.connect(gain);
    gain.connect(this.sfx);

    oscillator.start(now);
    oscillator.stop(now + cue.attack + cue.decay + cue.release + 0.02);

    if (cue.noiseMix) {
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.2, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * cue.noiseMix;
      }
      const source = this.context.createBufferSource();
      const noiseGain = this.context.createGain();
      source.buffer = buffer;
      noiseGain.gain.setValueAtTime(cue.gain * 0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + cue.attack + cue.release);
      source.connect(noiseGain);
      noiseGain.connect(this.sfx);
      source.start(now);
      source.stop(now + cue.attack + cue.release + 0.02);
    }
  }

  tick(): void {
    if (!this.context || !this.music || !this.currentTrack) {
      return;
    }
    const track = contentRegistry.audio.tracks[this.currentTrack];
    if (!track) {
      return;
    }
    const windowAhead = this.context.currentTime + 0.2;
    const duration = stepDuration(track.bpm);
    while (this.nextStepTime < windowAhead) {
      const bassIndex = track.bass[this.stepIndex % track.bass.length];
      const melodyIndex = track.melody[this.stepIndex % track.melody.length];
      this.scheduleNote(track.scale[bassIndex % track.scale.length], this.nextStepTime, duration * 0.9, track.waveform, track.pulseGain * 0.8, -12);
      this.scheduleNote(track.scale[melodyIndex % track.scale.length] * 2, this.nextStepTime + duration * 0.12, duration * 0.65, "triangle", track.pulseGain, 12);
      this.stepIndex += 1;
      this.nextStepTime += duration;
    }
  }

  private scheduleNote(
    frequency: number,
    at: number,
    duration: number,
    waveform: OscillatorType,
    gainValue: number,
    detune = 0,
  ): void {
    if (!this.context || !this.music) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.detune.setValueAtTime(detune, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(gainValue, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.music);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }
}
