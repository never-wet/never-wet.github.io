import { useEffect, useRef, useState } from "react";
import { getActiveStageIndex } from "@/PropertyData";

export type ScrollTimelineSnapshot = {
  progress: number;
  activeStageIndex: number;
  ready: boolean;
};

const initialSnapshot: ScrollTimelineSnapshot = {
  progress: 0,
  activeStageIndex: 0,
  ready: false,
};

export function useScrollTimeline(): ScrollTimelineSnapshot {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const frameRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const previousProgressRef = useRef(-1);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const readTargetProgress = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      targetProgressRef.current = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };

    const tick = () => {
      readTargetProgress();

      if (reduceMotion) {
        smoothProgressRef.current = targetProgressRef.current;
      } else {
        smoothProgressRef.current += (targetProgressRef.current - smoothProgressRef.current) * 0.085;
      }

      const current = smoothProgressRef.current;
      const shouldPublish =
        Math.abs(current - previousProgressRef.current) > 0.0008 ||
        Math.abs(current - targetProgressRef.current) < 0.0008;

      if (shouldPublish) {
        previousProgressRef.current = current;
        setSnapshot({
          progress: current,
          activeStageIndex: getActiveStageIndex(current),
          ready: true,
        });
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    readTargetProgress();
    frameRef.current = window.requestAnimationFrame(tick);
    window.addEventListener("resize", readTargetProgress);
    window.addEventListener("orientationchange", readTargetProgress);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("resize", readTargetProgress);
      window.removeEventListener("orientationchange", readTargetProgress);
    };
  }, []);

  return snapshot;
}
