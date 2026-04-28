"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useVehicleStore } from "@/store/useVehicleStore";

gsap.registerPlugin(ScrollTrigger);

export function useSystemTimeline(rootRef: RefObject<HTMLElement | null>) {
  const setProgress = useVehicleStore((state) => state.setProgress);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-scan-in]",
        { autoAlpha: 0, y: reducedMotion ? 0 : 18, clipPath: "inset(0 100% 0 0)" },
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0% 0 0)",
          duration: reducedMotion ? 0.1 : 0.72,
          ease: "power3.out",
          stagger: 0.07,
          delay: 0.32
        }
      );

      ScrollTrigger.create({
        trigger: "#system-scroll",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const progress = Number(self.progress.toFixed(4));
          document.documentElement.style.setProperty("--system-progress", String(progress));
          document.documentElement.style.setProperty(
            "--scan-progress",
            `${Math.round(progress * 100)}%`
          );
          setProgress(progress);
        }
      });

      gsap.to("[data-scan-ring]", {
        rotate: 360,
        duration: reducedMotion ? 16 : 7.5,
        repeat: -1,
        ease: "none"
      });

      gsap.to("[data-flow-line]", {
        xPercent: 12,
        opacity: 0.72,
        duration: reducedMotion ? 3.8 : 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.08
      });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [rootRef, setProgress]);
}
