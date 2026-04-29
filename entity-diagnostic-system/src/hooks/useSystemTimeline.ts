"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { initSystemTimelines } from "@/animations/timelines";
import { useSystemStore } from "@/store/useSystemStore";

export function useSystemTimeline(rootRef: RefObject<HTMLElement | null>) {
  const setProgress = useSystemStore((state) => state.setProgress);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    return initSystemTimelines(rootRef.current, {
      reducedMotion: media.matches,
      onProgress: setProgress
    });
  }, [rootRef, setProgress]);
}
