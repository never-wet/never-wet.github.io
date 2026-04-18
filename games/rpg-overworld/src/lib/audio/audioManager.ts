import { audioManifest } from "../../memory/audioManifest";
import type { AudioNodeDefinition, SettingsState } from "../../memory/types";

type AudioChannel = "music" | "ambience";

class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private categoryGains: Partial<Record<AudioNodeDefinition["category"], GainNode>> = {};
  private loopTimers: Partial<Record<AudioChannel, number>> = {};
  private activeLoopKeys: Partial<Record<AudioChannel, string>> = {};
  private settings: SettingsState | null = null;

  private ensureContext() {
    if (this.context) {
      return;
    }

    this.context = new window.AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 0.8;

    (["music", "ambience", "sfx", "ui"] as const).forEach((category) => {
      const gain = this.context!.createGain();
      gain.connect(this.masterGain!);
      gain.gain.value = 0.7;
      this.categoryGains[category] = gain;
    });
  }

  unlock = async () => {
    if (typeof window === "undefined") {
      return;
    }
    this.ensureContext();
    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  };

  applySettings = (settings: SettingsState) => {
    this.settings = settings;
    this.ensureContext();
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = settings.muteAll ? 0 : settings.masterVolume;
    this.categoryGains.music!.gain.value = settings.musicVolume;
    this.categoryGains.ambience!.gain.value = settings.ambienceVolume;
    this.categoryGains.sfx!.gain.value = settings.sfxVolume;
    this.categoryGains.ui!.gain.value = settings.sfxVolume * 0.9;
  };

  private scheduleTone = (frequency: number, startTime: number, duration: number, volume: number, waveform: OscillatorType, category: AudioNodeDefinition["category"]) => {
    if (!this.context) {
      return;
    }
    if (frequency <= 0) {
      return;
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = waveform;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.categoryGains[category]!);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  };

  private playDefinition = (definition: AudioNodeDefinition) => {
    if (!this.context) {
      return;
    }
    const tempo = definition.tempo ?? 72;
    const beat = 60 / tempo;
    const startAt = this.context.currentTime + 0.02;

    definition.sequence?.forEach((frequency, index) => {
      this.scheduleTone(
        frequency,
        startAt + index * beat,
        definition.category === "ambience" ? beat * 1.4 : beat * 0.75,
        definition.volume,
        definition.waveform,
        definition.category,
      );
    });
  };

  private startLoop = (channel: AudioChannel, key: string) => {
    this.ensureContext();
    const definition = [...audioManifest.music, ...audioManifest.ambience].find((entry) => entry.key === key);
    if (!definition || definition.category !== channel) {
      return;
    }
    if (this.activeLoopKeys[channel] === key) {
      return;
    }

    this.stopLoop(channel);
    this.activeLoopKeys[channel] = key;
    this.playDefinition(definition);
    const beat = 60 / (definition.tempo ?? 72);
    const cycleMs = Math.max(1200, (definition.sequence?.length ?? 1) * beat * 1000);
    this.loopTimers[channel] = window.setInterval(() => this.playDefinition(definition), cycleMs);
  };

  private stopLoop = (channel: AudioChannel) => {
    const timer = this.loopTimers[channel];
    if (timer) {
      window.clearInterval(timer);
      this.loopTimers[channel] = undefined;
    }
    this.activeLoopKeys[channel] = undefined;
  };

  playMusic = (key: string) => {
    this.startLoop("music", key);
  };

  playAmbience = (key: string) => {
    this.startLoop("ambience", key);
  };

  stopAllLoops = () => {
    this.stopLoop("music");
    this.stopLoop("ambience");
  };

  playSfx = (key: string) => {
    this.ensureContext();
    const definition = [...audioManifest.sfx, ...audioManifest.ui].find((entry) => entry.key === key);
    if (!definition) {
      return;
    }
    this.playDefinition(definition);
  };
}

export const audioManager = new AudioManager();
