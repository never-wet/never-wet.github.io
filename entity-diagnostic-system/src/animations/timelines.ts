"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type TimelineOptions = {
  reducedMotion: boolean;
  onProgress: (progress: number) => void;
};

export function initSystemTimelines(root: HTMLElement, options: TimelineOptions) {
  gsap.registerPlugin(ScrollTrigger);

  const ctx = gsap.context(() => {
    gsap.set("[data-system-reveal]", {
      autoAlpha: 0,
      y: options.reducedMotion ? 0 : 18,
      clipPath: "inset(0 100% 0 0)"
    });

    gsap.to("[data-system-reveal]", {
      autoAlpha: 1,
      y: 0,
      clipPath: "inset(0 0% 0 0)",
      duration: options.reducedMotion ? 0.01 : 0.78,
      ease: "power3.out",
      stagger: 0.06,
      delay: options.reducedMotion ? 0 : 0.18
    });

    ScrollTrigger.create({
      trigger: "#system-scroll",
      start: "top top",
      end: "bottom bottom",
      scrub: options.reducedMotion ? 0.2 : 0.85,
      onUpdate: (self) => {
        const progress = Number(self.progress.toFixed(4));
        document.documentElement.style.setProperty("--system-progress", String(progress));
        document.documentElement.style.setProperty("--state-load", `${Math.round(progress * 100)}%`);
        options.onProgress(progress);
      }
    });

    gsap.to("[data-scan-bar]", {
      xPercent: 170,
      opacity: 0.62,
      duration: options.reducedMotion ? 4 : 2.1,
      repeat: -1,
      ease: "none"
    });

    gsap.to("[data-pulse-line]", {
      scaleX: 1,
      transformOrigin: "left center",
      duration: options.reducedMotion ? 2.2 : 1.16,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.08
    });
  }, root);

  return () => ctx.revert();
}
