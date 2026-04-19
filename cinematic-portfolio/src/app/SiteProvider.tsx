import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PropsWithChildren,
} from "react";
import gsap from "gsap";
import { defaultAudioSettings, defaultQualityMode, defaultSiteState } from "@/memory/defaultState";
import { contentRegistry, projectById, sceneById } from "@/memory/contentRegistry";
import { sceneIndex } from "@/memory/sceneIndex";
import { storageKeys } from "@/memory/storageKeys";
import { resolveQualityMode } from "@/memory/performanceConfig";
import type {
  AudioSettings,
  PersistedSnapshot,
  ProjectId,
  QualityMode,
  SceneId,
  ViewMode,
} from "@/memory/types";
import { clamp } from "@/utils/math";

interface SiteContextValue {
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
  viewMode: ViewMode;
  activeScene: (typeof sceneIndex)[number];
  activeProject: (typeof contentRegistry)[number]["project"] | null;
  hoveredProject: (typeof contentRegistry)[number]["project"] | null;
  projectBlendRef: MutableRefObject<{ value: number }>;
  setHoveredProjectId: (projectId: ProjectId | null) => void;
  openProject: (projectId: ProjectId) => void;
  closeProject: () => void;
  jumpToScene: (sceneId: SceneId) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  markInteracted: () => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function readPersistedSnapshot(): PersistedSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKeys.siteSnapshot);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PersistedSnapshot;
  } catch {
    return null;
  }
}

export function SiteProvider({ children }: PropsWithChildren) {
  const persisted = readPersistedSnapshot();
  const [bootVisible, setBootVisible] = useState(defaultSiteState.bootVisible);
  const [bootProgress, setBootProgress] = useState(defaultSiteState.bootProgress);
  const [scrollProgress, setScrollProgress] = useState(defaultSiteState.scrollProgress);
  const [activeSceneId, setActiveSceneId] = useState<SceneId>(defaultSiteState.activeSceneId);
  const [activeProjectId, setActiveProjectId] = useState<ProjectId | null>(defaultSiteState.activeProjectId);
  const [hoveredProjectId, setHoveredProjectId] = useState<ProjectId | null>(defaultSiteState.hoveredProjectId);
  const [viewedProjects, setViewedProjects] = useState<ProjectId[]>(
    persisted?.viewedProjects ?? defaultSiteState.viewedProjects,
  );
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    persisted?.audioSettings ?? defaultAudioSettings,
  );
  const [qualityMode, setQualityMode] = useState<QualityMode>(
    persisted?.qualityMode ?? defaultQualityMode,
  );
  const [reducedMotion, setReducedMotion] = useState(defaultSiteState.reducedMotion);
  const [hasInteracted, setHasInteracted] = useState(defaultSiteState.hasInteracted);
  const projectBlendRef = useRef({ value: 0 });

  useEffect(() => {
    const progressState = { value: 0 };
    const tween = gsap.to(progressState, {
      value: 100,
      duration: 2.2,
      ease: "power2.out",
      onUpdate() {
        setBootProgress(Math.round(progressState.value));
      },
      onComplete() {
        window.setTimeout(() => setBootVisible(false), 260);
      },
    });

    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const tween = gsap.to(projectBlendRef.current, {
      value: activeProjectId ? 1 : 0,
      duration: activeProjectId ? 1.15 : 0.8,
      ease: "power3.inOut",
    });

    return () => {
      tween.kill();
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreferences = () => {
      const nextReducedMotion = mediaQuery.matches;
      setReducedMotion(nextReducedMotion);
      setQualityMode((current) =>
        current === persisted?.qualityMode
          ? current
          : resolveQualityMode({
              width: window.innerWidth,
              reducedMotion: nextReducedMotion,
              devicePixelRatio: window.devicePixelRatio,
            }),
      );
    };

    applyPreferences();
    mediaQuery.addEventListener("change", applyPreferences);
    window.addEventListener("resize", applyPreferences);

    return () => {
      mediaQuery.removeEventListener("change", applyPreferences);
      window.removeEventListener("resize", applyPreferences);
    };
  }, [persisted?.qualityMode]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.siteSnapshot,
      JSON.stringify({
        audioSettings,
        viewedProjects,
        qualityMode,
      } satisfies PersistedSnapshot),
    );
  }, [audioSettings, viewedProjects, qualityMode]);

  useEffect(() => {
    document.body.dataset.mode = activeProjectId ? "project" : "journey";
    document.body.style.overflow = activeProjectId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mode;
    };
  }, [activeProjectId]);

  const syncScrollState = useEffectEvent(() => {
    if (activeProjectId) {
      return;
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const nextProgress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
    setScrollProgress(nextProgress);

    const nextScene =
      sceneIndex.find(
        (scene) =>
          nextProgress >= scene.scrollRange[0] &&
          (scene.id === "outro" ? nextProgress <= 1 : nextProgress < scene.scrollRange[1]),
      ) ?? sceneIndex[sceneIndex.length - 1];

    setActiveSceneId(nextScene.id);
  });

  useEffect(() => {
    const handleScroll = () => syncScrollState();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [syncScrollState]);

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setActiveProjectId(null);
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleEscape(event);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleEscape]);

  const openProject = (projectId: ProjectId) => {
    setHasInteracted(true);
    startTransition(() => {
      setActiveProjectId(projectId);
      setViewedProjects((current) =>
        current.includes(projectId) ? current : [...current, projectId],
      );
    });
  };

  const closeProject = () => {
    startTransition(() => {
      setActiveProjectId(null);
      setHoveredProjectId(null);
    });
  };

  const jumpToScene = (sceneId: SceneId) => {
    const scene = sceneById[sceneId];
    if (!scene) {
      return;
    }

    closeProject();

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = scene.scrollRange[0] * maxScroll;
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    setAudioSettings((current) => ({ ...current, ...settings }));
  };

  const markInteracted = () => {
    setHasInteracted(true);
  };

  const activeProject = activeProjectId ? projectById[activeProjectId] : null;
  const hoveredProject = hoveredProjectId ? projectById[hoveredProjectId] : null;
  const activeScene = activeProject ? sceneById[activeProject.sceneId] : sceneById[activeSceneId];

  const value = useMemo<SiteContextValue>(
    () => ({
      bootVisible,
      bootProgress,
      scrollProgress,
      activeSceneId,
      activeProjectId,
      hoveredProjectId,
      viewedProjects,
      audioSettings,
      qualityMode,
      reducedMotion,
      hasInteracted,
      viewMode: activeProjectId ? "project" : "journey",
      activeScene,
      activeProject,
      hoveredProject,
      projectBlendRef,
      setHoveredProjectId,
      openProject,
      closeProject,
      jumpToScene,
      updateAudioSettings,
      markInteracted,
    }),
    [
      activeProject,
      activeProjectId,
      activeScene,
      activeSceneId,
      audioSettings,
      bootProgress,
      bootVisible,
      hasInteracted,
      hoveredProject,
      hoveredProjectId,
      qualityMode,
      reducedMotion,
      scrollProgress,
      viewedProjects,
    ],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used inside SiteProvider.");
  }

  return context;
}
