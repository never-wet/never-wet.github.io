"use client";

import { useMemo } from "react";
import type { FrameQuality } from "@/utils/FrameProcessor";

type ScannerOverlayProps = {
  active: boolean;
  progress: number;
  quality: FrameQuality;
  warning?: string;
};

export function ScannerOverlay({ active, progress, quality, warning }: ScannerOverlayProps) {
  const dots = useMemo(
    () =>
      Array.from({ length: 54 }, (_, index) => {
        const angle = index * 2.399963 + 0.32;
        const radius = 18 + (index % 9) * 4.8;
        return {
          id: index,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius * 0.72,
          delay: `${(index % 12) * 70}ms`,
          opacity: 0.22 + ((index * 13) % 60) / 100,
        };
      }),
    [],
  );

  return (
    <div className={`scanner-overlay${active ? " is-active" : ""}`} aria-hidden="true">
      <div className="overlay-grid" />
      <div className="radar-sweep" />
      <div className="radar-pulse radar-pulse--one" />
      <div className="radar-pulse radar-pulse--two" />
      <div className="scan-window">
        <span className="corner corner--tl" />
        <span className="corner corner--tr" />
        <span className="corner corner--bl" />
        <span className="corner corner--br" />
        <span className="scan-line" />
        {dots.map((dot) => (
          <span
            key={dot.id}
            className="depth-dot"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              animationDelay: dot.delay,
              opacity: dot.opacity * Math.max(0.32, quality.objectScore),
            }}
          />
        ))}
      </div>
      <div className="overlay-readout overlay-readout--top">
        <span>Object lock</span>
        <strong>{Math.round(quality.objectScore * 100)}%</strong>
      </div>
      <div className="overlay-readout overlay-readout--bottom">
        <span>{warning || "Move slowly around the object"}</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
    </div>
  );
}
