import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { audioManifest } from "@/memory/audioManifest";
import { useSite } from "@/app/SiteProvider";
import type { AudioCueId, SceneAudioProfile } from "@/memory/types";

interface AmbientVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

interface AmbientRig {
  context: AudioContext;
  masterGain: GainNode;
  ambientGain: GainNode;
  sfxGain: GainNode;
  filter: BiquadFilterNode;
  noiseGain: GainNode;
  voices: AmbientVoice[];
  noiseSource: AudioBufferSourceNode;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
}

interface AudioContextValue {
  audioReady: boolean;
  requestAudioStart: () => void;
  triggerCue: (cueId: AudioCueId) => void;
}

const SceneAudioContext = createContext<AudioContextValue | null>(null);

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.4;
  }
  return buffer;
}

function getAudioContextConstructor() {
  return (
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext
  );
}

function buildAmbientRig(): AmbientRig | null {
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) {
    return null;
  }

  const context = new AudioContextConstructor();
  const masterGain = context.createGain();
  const ambientGain = context.createGain();
  const sfxGain = context.createGain();
  const filter = context.createBiquadFilter();
  const noiseGain = context.createGain();
  const noiseSource = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const lfo = context.createOscillator();
  const lfoDepth = context.createGain();

  masterGain.gain.value = 0.68;
  ambientGain.gain.value = 0.28;
  sfxGain.gain.value = 0.4;
  filter.type = "lowpass";
  filter.frequency.value = 540;
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1100;
  noiseGain.gain.value = 0.018;

  ambientGain.connect(filter);
  filter.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(context.destination);

  const voices: AmbientVoice[] = (["sine", "triangle", "sine"] as const).map((waveform) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.value = 120;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(ambientGain);
    oscillator.start();
    return { oscillator, gain };
  });

  noiseSource.buffer = createNoiseBuffer(context);
  noiseSource.loop = true;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ambientGain);
  noiseSource.start();

  lfo.type = "sine";
  lfo.frequency.value = 0.09;
  lfoDepth.gain.value = 22;
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  lfo.start();

  return {
    context,
    masterGain,
    ambientGain,
    sfxGain,
    filter,
    noiseGain,
    voices,
    noiseSource,
    lfo,
    lfoDepth,
  };
}

function applyProfile(rig: AmbientRig, profile: SceneAudioProfile) {
  const now = rig.context.currentTime;
  rig.voices.forEach((voice, index) => {
    voice.oscillator.frequency.setTargetAtTime(profile.baseFrequencies[index], now, 0.6);
    voice.gain.gain.setTargetAtTime(0.025 + index * 0.012, now, 0.7);
  });
  rig.filter.frequency.setTargetAtTime(profile.filter, now, 0.7);
  rig.noiseGain.gain.setTargetAtTime(profile.noise, now, 0.8);
  rig.lfo.frequency.setTargetAtTime(0.04 + profile.drift, now, 0.8);
  rig.lfoDepth.gain.setTargetAtTime(14 + profile.filter * 0.018, now, 0.8);
}

export function AudioProvider({ children }: PropsWithChildren) {
  const { activeScene, activeProject, audioSettings, hasInteracted, markInteracted } = useSite();
  const [audioReady, setAudioReady] = useState(false);
  const rigRef = useRef<AmbientRig | null>(null);
  const lastSceneProfileRef = useRef<string | null>(null);
  const lastProjectIdRef = useRef<string | null>(null);

  const updateVolumes = useEffectEvent(() => {
    const rig = rigRef.current;
    if (!rig) {
      return;
    }

    const now = rig.context.currentTime;
    const muteMultiplier = audioSettings.muted ? 0 : 1;
    rig.masterGain.gain.setTargetAtTime(audioSettings.masterVolume * muteMultiplier, now, 0.1);
    rig.ambientGain.gain.setTargetAtTime(audioSettings.ambientVolume * 0.45, now, 0.1);
    rig.sfxGain.gain.setTargetAtTime(audioSettings.sfxVolume * 0.5, now, 0.1);
  });

  const requestAudioStart = useEffectEvent(() => {
    markInteracted();

    if (!rigRef.current) {
      rigRef.current = buildAmbientRig();
    }

    const rig = rigRef.current;
    if (!rig) {
      return;
    }

    void rig.context.resume().then(() => {
      setAudioReady(true);
      updateVolumes();
      const initialProfile =
        activeProject?.id && audioManifest.ambientProfiles[`${activeProject.id}-chamber`]
          ? audioManifest.ambientProfiles[`${activeProject.id}-chamber`]
          : audioManifest.ambientProfiles[activeScene.audioProfileId];

      applyProfile(rig, initialProfile);
    });
  });

  const triggerCue = useEffectEvent((cueId: AudioCueId) => {
    const rig = rigRef.current;
    const cue = audioManifest.cues[cueId];
    if (!rig || !audioReady || audioSettings.muted || audioSettings.sfxVolume <= 0) {
      return;
    }

    const now = rig.context.currentTime;
    const oscillator = rig.context.createOscillator();
    const gain = rig.context.createGain();

    oscillator.type = cue.waveform;
    oscillator.connect(gain);
    gain.connect(rig.sfxGain);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(cue.volume, now + cue.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration + cue.release);

    cue.frequencies.forEach((frequency, index) => {
      const time = now + index * (cue.duration / cue.frequencies.length);
      oscillator.frequency.setValueAtTime(frequency, time);
    });

    oscillator.start(now);
    oscillator.stop(now + cue.duration + cue.release + 0.04);
  });

  useEffect(() => {
    if (!audioReady) {
      return;
    }

    updateVolumes();
  }, [audioReady, audioSettings, updateVolumes]);

  useEffect(() => {
    if (!audioReady || !rigRef.current) {
      return;
    }

    const profile =
      activeProject?.id && audioManifest.ambientProfiles[`${activeProject.id}-chamber`]
        ? audioManifest.ambientProfiles[`${activeProject.id}-chamber`]
        : audioManifest.ambientProfiles[activeScene.audioProfileId];

    if (lastSceneProfileRef.current !== profile.id) {
      applyProfile(rigRef.current, profile);
      if (lastSceneProfileRef.current) {
        triggerCue(activeProject ? "project-open" : "scene-shift");
      } else {
        triggerCue("landing-pulse");
      }
      lastSceneProfileRef.current = profile.id;
    }
  }, [activeProject, activeScene, audioReady, triggerCue]);

  useEffect(() => {
    if (!audioReady) {
      return;
    }

    if (!activeProject && lastProjectIdRef.current) {
      triggerCue("project-close");
      lastProjectIdRef.current = null;
      return;
    }

    if (activeProject && lastProjectIdRef.current !== activeProject.id) {
      lastProjectIdRef.current = activeProject.id;
    }
  }, [activeProject, audioReady, triggerCue]);

  useEffect(() => {
    if (hasInteracted) {
      requestAudioStart();
      return;
    }

    const handlePointerDown = () => requestAudioStart();
    window.addEventListener("pointerdown", handlePointerDown, { once: true, passive: true });
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [hasInteracted, requestAudioStart]);

  useEffect(() => {
    return () => {
      const rig = rigRef.current;
      if (!rig) {
        return;
      }

      rig.voices.forEach((voice) => voice.oscillator.stop());
      rig.noiseSource.stop();
      rig.lfo.stop();
      void rig.context.close();
    };
  }, []);

  return (
    <SceneAudioContext.Provider value={{ audioReady, requestAudioStart, triggerCue }}>
      {children}
    </SceneAudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(SceneAudioContext);
  if (!context) {
    throw new Error("useAudio must be used inside AudioProvider.");
  }

  return context;
}
