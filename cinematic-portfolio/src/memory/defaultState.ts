import type { AudioSettings, QualityMode, SiteState } from "@/memory/types";

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 0.78,
  ambientVolume: 0.46,
  sfxVolume: 0.58,
  muted: false,
};

export const defaultQualityMode: QualityMode = "balanced";

export const defaultSiteState: SiteState = {
  bootVisible: true,
  bootProgress: 0,
  scrollProgress: 0,
  activeSceneId: "intro",
  activeProjectId: null,
  hoveredProjectId: null,
  viewedProjects: [],
  audioSettings: defaultAudioSettings,
  qualityMode: defaultQualityMode,
  reducedMotion: false,
  hasInteracted: false,
};
