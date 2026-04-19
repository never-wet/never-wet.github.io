export type SceneId =
  | "intro"
  | "threshold"
  | "lantern-oath"
  | "midnight-pawn"
  | "reelspull"
  | "outro";

export type ProjectId = "lantern-oath" | "midnight-pawn" | "reelspull";

export type ObjectType = "lantern-monolith" | "vault-relic" | "orbital-reel";

export type PortalType = "halo" | "vault" | "prism";

export type ViewMode = "journey" | "project";

export type QualityMode = "high" | "balanced" | "low";

export type AudioCueId =
  | "hover-glass"
  | "hover-gilded"
  | "hover-plasma"
  | "landing-pulse"
  | "scene-shift"
  | "project-open"
  | "project-close";

export interface SiteFeatureFlags {
  audioEnabled: boolean;
  fullscreenProjectScenes: boolean;
  adaptiveQuality: boolean;
  reducedMotionRespect: boolean;
  postProcessing: boolean;
}

export interface SiteManifest {
  title: string;
  handle: string;
  tagline: string;
  description: string;
  visualDirection: string[];
  sceneOrder: SceneId[];
  featureFlags: SiteFeatureFlags;
}

export interface CameraAnchorDefinition {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface SceneDefinition {
  id: SceneId;
  index: number;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  overlayAlign: "left" | "right" | "center";
  scrollRange: [number, number];
  cameraAnchorId: string;
  audioProfileId: string;
  transitionLabel: string;
  projectId?: ProjectId;
}

export interface ObjectDefinition {
  id: string;
  projectId: ProjectId;
  type: ObjectType;
  portalType: PortalType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  lightColor: string;
  islandRadius: number;
  interactionHint: string;
}

export interface ProjectMediaItem {
  id: string;
  kind: "image" | "video" | "signal";
  label: string;
  caption: string;
  src?: string;
  poster?: string;
  fit?: "cover" | "contain";
}

export interface ProjectLink {
  label: string;
  href: string;
  accent?: "solid" | "ghost";
  external?: boolean;
}

export interface ProjectStat {
  label: string;
  value: string;
}

export interface ProjectLighting {
  primary: string;
  secondary: string;
  rim: string;
}

export interface ProjectIconDefinition {
  projectId: ProjectId;
  title: string;
  silhouette: string;
  motifs: string[];
  materials: string[];
  sceneUse: string;
}

export interface ProjectDefinition {
  id: ProjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  techStack: string[];
  sceneId: SceneId;
  sceneTheme: string;
  visualTags: string[];
  objectId: string;
  objectType: ObjectType;
  portalType: PortalType;
  media: ProjectMediaItem[];
  links: ProjectLink[];
  transitionBehavior: "dolly" | "portal";
  accentLighting: ProjectLighting;
  interactionText: string;
  soundCueIds: {
    hover: AudioCueId;
    open: AudioCueId;
    scene: AudioCueId;
  };
  detailCamera: CameraAnchorDefinition;
  chamberTitle: string;
  chamberDescription: string;
  stats: ProjectStat[];
}

export interface SceneAudioProfile {
  id: string;
  baseFrequencies: [number, number, number];
  filter: number;
  noise: number;
  drift: number;
}

export interface AudioCueDefinition {
  id: AudioCueId;
  waveform: OscillatorType;
  frequencies: number[];
  duration: number;
  volume: number;
  attack: number;
  release: number;
}

export interface AudioManifest {
  ambientProfiles: Record<string, SceneAudioProfile>;
  cues: Record<AudioCueId, AudioCueDefinition>;
}

export interface AudioSettings {
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface UIManifest {
  boot: {
    eyebrow: string;
    title: string;
    statusLabel: string;
    hint: string;
  };
  instructions: {
    scroll: string;
    hover: string;
    click: string;
    back: string;
  };
  navigation: {
    atlasLabel: string;
    sceneLabel: string;
    projectsLabel: string;
  };
  audio: {
    title: string;
    helper: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
  };
}

export interface PerformancePreset {
  id: QualityMode;
  label: string;
  maxDpr: number;
  particleCount: number;
  sparklesCount: number;
  enableBloom: boolean;
  bloomIntensity: number;
  floatIntensity: number;
}

export interface PerformanceConfig {
  presets: Record<QualityMode, PerformancePreset>;
}

export interface PersistedSnapshot {
  audioSettings: AudioSettings;
  viewedProjects: ProjectId[];
  qualityMode: QualityMode;
}

export interface SiteState {
  bootVisible: boolean;
  bootProgress: number;
  scrollProgress: number;
  activeSceneId: SceneId;
  activeProjectId: ProjectId | null;
  hoveredProjectId: ProjectId | null;
  viewedProjects: ProjectId[];
  audioSettings: AudioSettings;
  qualityMode: QualityMode;
  reducedMotion: boolean;
  hasInteracted: boolean;
}
