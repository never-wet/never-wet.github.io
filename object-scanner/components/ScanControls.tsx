"use client";

import {
  Box,
  Camera,
  Gauge,
  Maximize2,
  Minus,
  Plus,
  Radar,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  ScanLine,
} from "lucide-react";
import type { FrameQuality, ScanMode } from "@/utils/FrameProcessor";

type CameraState = "checking" | "requesting" | "ready" | "denied" | "missing" | "unsupported";
type ScannerPhase = "scanning" | "preview";
type ViewCommandType = "reset" | "zoom-in" | "zoom-out" | "rotate-left" | "rotate-right";

type ScanControlsProps = {
  phase: ScannerPhase;
  cameraState: CameraState;
  mode: ScanMode;
  progress: number;
  capturedFrames: number;
  pointCount: number;
  quality: FrameQuality;
  warning?: string;
  autoRotate: boolean;
  onModeChange: (mode: ScanMode) => void;
  onDone: () => void;
  onRetake: () => void;
  onCameraRetry: () => void;
  onViewCommand: (command: ViewCommandType) => void;
  onAutoRotateChange: (value: boolean) => void;
};

export function ScanControls({
  phase,
  cameraState,
  mode,
  progress,
  capturedFrames,
  pointCount,
  quality,
  warning,
  autoRotate,
  onModeChange,
  onDone,
  onRetake,
  onCameraRetry,
  onViewCommand,
  onAutoRotateChange,
}: ScanControlsProps) {
  const canFinish = cameraState === "ready" && capturedFrames >= 3;
  const cameraLabel = cameraState === "ready" ? "Camera live" : cameraState === "requesting" ? "Opening camera" : "Camera paused";

  return (
    <aside className="scan-panel" aria-label="Scanner controls">
      <div className="panel-section panel-section--header">
        <span className="panel-kicker">
          <Radar size={15} />
          Radar object scanner
        </span>
        <strong>{phase === "preview" ? "3D reconstruction" : "Live capture"}</strong>
      </div>

      {phase === "scanning" ? (
        <>
          <div className="mode-toggle" aria-label="Scanner mode">
            <button
              type="button"
              className={mode === "quick" ? "is-active" : ""}
              onClick={() => onModeChange("quick")}
            >
              <Gauge size={16} />
              Quick Scan
            </button>
            <button
              type="button"
              className={mode === "detail" ? "is-active" : ""}
              onClick={() => onModeChange("detail")}
            >
              <ScanLine size={16} />
              Detail Scan
            </button>
          </div>

          <div className="progress-block">
            <div className="progress-block__top">
              <span>{cameraLabel}</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
          </div>

          <div className="metrics-grid">
            <div>
              <span>Frames</span>
              <strong>{capturedFrames}</strong>
            </div>
            <div>
              <span>Mask</span>
              <strong>{Math.round(quality.maskCoverage * 100)}%</strong>
            </div>
            <div>
              <span>Edges</span>
              <strong>{Math.round(quality.edgeScore * 100)}%</strong>
            </div>
          </div>

          <div className={`quality-note${warning ? " is-warning" : ""}`}>
            {warning || "Move slowly around the object"}
          </div>

          <div className="control-row">
            <button type="button" className="secondary-action" onClick={onRetake}>
              <RefreshCcw size={17} />
              Retake
            </button>
            <button type="button" className="primary-action" onClick={onDone} disabled={!canFinish}>
              <Box size={18} />
              Done
            </button>
          </div>

          {cameraState !== "ready" && (
            <button type="button" className="wide-action" onClick={onCameraRetry}>
              <Camera size={17} />
              Enable Camera
            </button>
          )}
        </>
      ) : (
        <>
          <div className="metrics-grid metrics-grid--preview">
            <div>
              <span>Points</span>
              <strong>{pointCount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{mode}</strong>
            </div>
          </div>

          <div className="view-controls" aria-label="3D view controls">
            <button type="button" onClick={() => onViewCommand("zoom-in")} aria-label="Zoom in">
              <Plus size={18} />
            </button>
            <button type="button" onClick={() => onViewCommand("zoom-out")} aria-label="Zoom out">
              <Minus size={18} />
            </button>
            <button type="button" onClick={() => onViewCommand("rotate-left")} aria-label="Rotate left">
              <RotateCcw size={18} />
            </button>
            <button type="button" onClick={() => onViewCommand("rotate-right")} aria-label="Rotate right">
              <RotateCw size={18} />
            </button>
            <button type="button" onClick={() => onViewCommand("reset")} aria-label="Reset view">
              <Maximize2 size={18} />
            </button>
          </div>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(event) => onAutoRotateChange(event.target.checked)}
            />
            <span>Auto rotate</span>
          </label>

          <button type="button" className="wide-action" onClick={onRetake}>
            <RefreshCcw size={17} />
            Retake
          </button>
        </>
      )}
    </aside>
  );
}

export type { CameraState, ScannerPhase, ViewCommandType };
