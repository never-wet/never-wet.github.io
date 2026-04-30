"use client";

import type { CoverageCell, TrackedFeaturePoint } from "@/utils/MotionTracker";

type ScanUIOverlayProps = {
  active: boolean;
  progress: number;
  features: TrackedFeaturePoint[];
  coverage: CoverageCell[];
  motionLabel: string;
  warning?: string;
};

export function ScanUIOverlay({ active, progress, features, coverage, motionLabel, warning }: ScanUIOverlayProps) {
  return (
    <div className={`room-overlay${active ? " is-active" : ""}`} aria-hidden="true">
      <div className="room-alignment-grid" />
      <div className="room-bounding-box">
        <span className="room-corner room-corner--tl" />
        <span className="room-corner room-corner--tr" />
        <span className="room-corner room-corner--bl" />
        <span className="room-corner room-corner--br" />
        <span className="room-scan-line" />
      </div>

      <div className="coverage-heatmap">
        {coverage.map((cell) => (
          <span
            key={cell.id}
            style={{
              gridColumn: cell.x + 1,
              gridRow: cell.y + 1,
              opacity: Math.max(0.04, cell.intensity * 0.74),
            }}
          />
        ))}
      </div>

      <div className="feature-layer">
        {features.slice(0, 90).map((feature) => (
          <span
            key={feature.id}
            className="surface-feature"
            style={{
              left: `${feature.x}%`,
              top: `${feature.y}%`,
              opacity: Math.max(0.26, feature.strength),
              transform: `translate(-50%, -50%) translate(${feature.dx * 0.12}px, ${feature.dy * 0.12}px)`,
            }}
          />
        ))}
      </div>

      <div className="tracking-indicator tracking-indicator--left">
        <span />
        <span />
        <span />
      </div>
      <div className="tracking-indicator tracking-indicator--right">
        <span />
        <span />
        <span />
      </div>

      <div className="room-readout room-readout--top">
        <span>Spatial coverage</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="room-readout room-readout--bottom">
        <span>{warning || "Move device slowly"}</span>
        <strong>{motionLabel}</strong>
      </div>
    </div>
  );
}
