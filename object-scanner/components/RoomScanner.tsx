"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  Camera,
  Gauge,
  Home,
  Map,
  Maximize2,
  Minus,
  Plus,
  Radar,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  ScanLine,
} from "lucide-react";
import { ScanUIOverlay } from "@/components/ScanUIOverlay";
import { RoomPreview3D, type RoomViewCommand } from "@/components/RoomPreview3D";
import { type CameraState, type ScannerPhase, type ViewCommandType } from "@/components/ScanControls";
import { RoomFrameProcessor, type RoomFrameQuality, type RoomProcessedFrame, type RoomScanMode } from "@/utils/RoomFrameProcessor";
import { buildRoomPointCloud, type RoomPointCloud } from "@/utils/RoomPointCloudBuilder";
import type { CoverageCell, TrackedFeaturePoint } from "@/utils/MotionTracker";

type RoomScannerProps = {
  onObjectScanSelect: () => void;
};

const DEFAULT_ROOM_QUALITY: RoomFrameQuality = {
  trackingScore: 0,
  coverageScore: 0,
  motionMagnitude: 0,
  brightness: 0,
};

const EMPTY_COVERAGE: CoverageCell[] = Array.from({ length: 48 }, (_, id) => ({
  id,
  x: id % 8,
  y: Math.floor(id / 8),
  intensity: 0,
}));

const MODE_TARGET_FRAMES: Record<RoomScanMode, number> = {
  quick: 30,
  full: 66,
};

const MODE_CAPTURE_INTERVAL: Record<RoomScanMode, number> = {
  quick: 180,
  full: 230,
};

function getCameraMessage(cameraState: CameraState) {
  if (cameraState === "denied") {
    return "Camera permission was denied. Allow camera access in the browser and try again.";
  }
  if (cameraState === "missing") {
    return "No camera was found on this device.";
  }
  if (cameraState === "unsupported") {
    return "This browser does not support getUserMedia camera access.";
  }
  return "Opening the rear camera for room scanning.";
}

function normalizeFeatures(features: TrackedFeaturePoint[], width: number, height: number) {
  return features.map((feature) => ({
    ...feature,
    x: (feature.x / width) * 100,
    y: (feature.y / height) * 100,
    previousX: (feature.previousX / width) * 100,
    previousY: (feature.previousY / height) * 100,
    dx: (feature.dx / width) * 100,
    dy: (feature.dy / height) * 100,
  }));
}

function buildRoomPointCloudInWorker(frames: RoomProcessedFrame[], mode: RoomScanMode) {
  if (!window.Worker) {
    return Promise.resolve(buildRoomPointCloud(frames, mode));
  }

  return new Promise<RoomPointCloud>((resolve) => {
    const worker = new Worker(new URL("../workers/roomReconstructionWorker.ts", import.meta.url), { type: "module" });
    const fallback = () => {
      worker.terminate();
      resolve(buildRoomPointCloud(frames, mode));
    };
    const timeout = window.setTimeout(fallback, 5000);

    worker.onmessage = (event: MessageEvent<{ cloud: RoomPointCloud }>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(event.data.cloud);
    };

    worker.onerror = fallback;
    worker.postMessage({ frames, mode });
  });
}

export function RoomScanner({ onObjectScanSelect }: RoomScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<RoomFrameProcessor | null>(null);
  const framesRef = useRef<RoomProcessedFrame[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastCaptureRef = useRef(0);
  const frameIndexRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("checking");
  const [phase, setPhase] = useState<ScannerPhase>("scanning");
  const [mode, setMode] = useState<RoomScanMode>("quick");
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [featureCount, setFeatureCount] = useState(0);
  const [quality, setQuality] = useState<RoomFrameQuality>(DEFAULT_ROOM_QUALITY);
  const [features, setFeatures] = useState<TrackedFeaturePoint[]>([]);
  const [coverage, setCoverage] = useState<CoverageCell[]>(EMPTY_COVERAGE);
  const [motionLabel, setMotionLabel] = useState("Hold steady");
  const [roomCloud, setRoomCloud] = useState<RoomPointCloud | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewCommand, setViewCommand] = useState<RoomViewCommand | null>(null);

  const targetFrames = MODE_TARGET_FRAMES[mode];
  const warning = quality.warning;
  const pointCount = roomCloud?.count ?? 0;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }

    setCameraState("requesting");

    const rearCamera: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(rearCamera);
      stopCamera();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
    } catch (primaryError) {
      const error = primaryError as DOMException;
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        setCameraState("denied");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 960 },
            height: { ideal: 540 },
          },
        });
        stopCamera();
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState("ready");
      } catch (fallbackError) {
        const fallback = fallbackError as DOMException;
        setCameraState(fallback.name === "NotFoundError" || fallback.name === "DevicesNotFoundError" ? "missing" : "denied");
      }
    }
  }, [stopCamera]);

  const resetCapture = useCallback(() => {
    framesRef.current = [];
    frameIndexRef.current = 0;
    lastCaptureRef.current = 0;
    processorRef.current?.reset();
    setProgress(0);
    setCapturedFrames(0);
    setFeatureCount(0);
    setQuality(DEFAULT_ROOM_QUALITY);
    setFeatures([]);
    setCoverage(EMPTY_COVERAGE);
    setMotionLabel("Hold steady");
    setRoomCloud(null);
  }, []);

  const handleRetake = useCallback(() => {
    resetCapture();
    setPhase("scanning");
    setAutoRotate(false);
    void requestCamera();
  }, [requestCamera, resetCapture]);

  const handleDone = useCallback(async () => {
    if (framesRef.current.length === 0) return;

    const cloud = await buildRoomPointCloudInWorker(framesRef.current, mode);
    setRoomCloud(cloud);
    setPhase("preview");
    setProgress(100);
    stopCamera();
  }, [mode, stopCamera]);

  const handleModeChange = useCallback(
    (nextMode: RoomScanMode) => {
      setMode(nextMode);
      resetCapture();
    },
    [resetCapture],
  );

  const sendViewCommand = useCallback((type: ViewCommandType) => {
    setViewCommand({ id: performance.now(), type });
  }, []);

  useEffect(() => {
    processorRef.current = new RoomFrameProcessor();
    const cameraTimer = window.setTimeout(() => {
      void requestCamera();
    }, 0);

    return () => {
      window.clearTimeout(cameraTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stopCamera();
    };
  }, [requestCamera, stopCamera]);

  useEffect(() => {
    if (cameraState !== "ready" || phase !== "scanning") return;

    const captureInterval = MODE_CAPTURE_INTERVAL[mode];

    const scan = (time: number) => {
      const video = videoRef.current;
      const processor = processorRef.current;

      if (video && processor && (lastCaptureRef.current === 0 || time - lastCaptureRef.current >= captureInterval)) {
        lastCaptureRef.current = time;
        const frame = processor.processFrame(video, mode, frameIndexRef.current);
        frameIndexRef.current += 1;

        if (frame.points.length > 0) {
          framesRef.current = [...framesRef.current, frame].slice(-96);
          const nextFrameCount = framesRef.current.length;
          const frameProgress = (nextFrameCount / targetFrames) * 58;
          const coverageProgress = frame.quality.coverageScore * 42;
          setCapturedFrames(nextFrameCount);
          setProgress(Math.min(99, Math.max(frameProgress + coverageProgress, (nextFrameCount / targetFrames) * 100)));
        }

        setQuality(frame.quality);
        setFeatureCount(frame.trackedFeatureCount);
        setFeatures(normalizeFeatures(frame.features, mode === "full" ? 216 : 160, mode === "full" ? 162 : 120));
        setCoverage(frame.coverage.length ? frame.coverage : EMPTY_COVERAGE);
        setMotionLabel(frame.motion.directionLabel);
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [cameraState, mode, phase, targetFrames]);

  const statusLabel = useMemo(() => {
    if (phase === "preview") return "Room Preview";
    if (cameraState === "ready") return "Mapping";
    if (cameraState === "requesting") return "Camera";
    return "Standby";
  }, [cameraState, phase]);

  const showCameraProblem = cameraState === "denied" || cameraState === "missing" || cameraState === "unsupported";
  const canFinish = cameraState === "ready" && capturedFrames >= 5;

  return (
    <main className="scanner-shell">
      <header className="scanner-topbar">
        <a className="home-link" href="../" aria-label="Back to Never Wet homepage">
          <Home size={17} />
          <span>NW</span>
        </a>
        <div className="scanner-title">
          <span>
            <Map size={16} />
            Spatial Mapping Mode
          </span>
          <h1>Room Scanner</h1>
          <div className="scan-kind-toggle" aria-label="Scan target">
            <button type="button" onClick={onObjectScanSelect}>
              <Box size={15} />
              Object Scan
            </button>
            <button type="button" className="is-active">
              <Radar size={15} />
              Room Scan
            </button>
          </div>
        </div>
        <div className="status-chip">{statusLabel}</div>
      </header>

      {phase === "preview" && roomCloud ? (
        <section className="scanner-workspace scanner-workspace--preview">
          <RoomPreview3D cloud={roomCloud} autoRotate={autoRotate} command={viewCommand} />
          <aside className="scan-panel" aria-label="Room preview controls">
            <div className="panel-section panel-section--header">
              <span className="panel-kicker">
                <Map size={15} />
                3D room map
              </span>
              <strong>Spatial reconstruction</strong>
            </div>
            <div className="metrics-grid metrics-grid--preview">
              <div>
                <span>Points</span>
                <strong>{pointCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Coverage</span>
                <strong>{Math.round(roomCloud.coverage * 100)}%</strong>
              </div>
            </div>
            <div className="view-controls" aria-label="3D room view controls">
              <button type="button" onClick={() => sendViewCommand("zoom-in")} aria-label="Zoom in">
                <Plus size={18} />
              </button>
              <button type="button" onClick={() => sendViewCommand("zoom-out")} aria-label="Zoom out">
                <Minus size={18} />
              </button>
              <button type="button" onClick={() => sendViewCommand("rotate-left")} aria-label="Rotate left">
                <RotateCcw size={18} />
              </button>
              <button type="button" onClick={() => sendViewCommand("rotate-right")} aria-label="Rotate right">
                <RotateCw size={18} />
              </button>
              <button type="button" onClick={() => sendViewCommand("reset")} aria-label="Reset view">
                <Maximize2 size={18} />
              </button>
            </div>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(event) => setAutoRotate(event.target.checked)}
              />
              <span>Auto rotate</span>
            </label>
            <div className="quality-note">Drag to orbit or pan. Pinch or wheel to zoom.</div>
            <button type="button" className="wide-action" onClick={handleRetake}>
              <RefreshCcw size={17} />
              Retake
            </button>
          </aside>
        </section>
      ) : (
        <section className="scanner-workspace">
          <div className="camera-stage">
            <video ref={videoRef} className="camera-feed camera-feed--room" muted playsInline autoPlay />
            <ScanUIOverlay
              active={cameraState === "ready"}
              progress={progress}
              features={features}
              coverage={coverage}
              motionLabel={motionLabel}
              warning={warning}
            />

            <div className="room-floating-actions" aria-label="Room scan quick actions">
              <button type="button" className="secondary-action" onClick={handleRetake}>
                <RefreshCcw size={17} />
                Retake
              </button>
              <button type="button" className="primary-action" onClick={handleDone} disabled={!canFinish}>
                <Map size={18} />
                Done
              </button>
            </div>

            {showCameraProblem && (
              <div className="camera-message" role="status">
                <AlertTriangle size={28} />
                <strong>Camera unavailable</strong>
                <p>{getCameraMessage(cameraState)}</p>
                <button type="button" onClick={requestCamera}>
                  <Camera size={17} />
                  Try Camera Again
                </button>
              </div>
            )}

            {cameraState === "requesting" && (
              <div className="camera-message camera-message--soft" role="status">
                <Camera size={28} />
                <strong>Requesting camera</strong>
                <p>{getCameraMessage(cameraState)}</p>
              </div>
            )}
          </div>

          <aside className="scan-panel" aria-label="Room scanner controls">
            <div className="panel-section panel-section--header">
              <span className="panel-kicker">
                <Radar size={15} />
                Room scan
              </span>
              <strong>Live spatial mapping</strong>
            </div>
            <div className="mode-toggle" aria-label="Room scan detail mode">
              <button
                type="button"
                className={mode === "quick" ? "is-active" : ""}
                onClick={() => handleModeChange("quick")}
              >
                <Gauge size={16} />
                Quick Scan
              </button>
              <button
                type="button"
                className={mode === "full" ? "is-active" : ""}
                onClick={() => handleModeChange("full")}
              >
                <ScanLine size={16} />
                Full Room Scan
              </button>
            </div>
            <div className="room-instructions">
              <span>Move slowly around the room</span>
              <span>Keep the camera steady</span>
              <span>Scan walls, floor, and objects</span>
            </div>
            <div className="progress-block">
              <div className="progress-block__top">
                <span>{cameraState === "ready" ? "Mapping coverage" : "Camera paused"}</span>
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
                <span>Features</span>
                <strong>{featureCount}</strong>
              </div>
              <div>
                <span>Track</span>
                <strong>{Math.round(quality.trackingScore * 100)}%</strong>
              </div>
            </div>
            <div className={`quality-note${warning ? " is-warning" : ""}`}>{warning || "Move device slowly"}</div>
            <div className="boundary-note">Stay inside the virtual scan volume and sweep across every wall.</div>
            <div className="control-row">
              <button type="button" className="secondary-action" onClick={handleRetake}>
                <RefreshCcw size={17} />
                Retake
              </button>
              <button type="button" className="primary-action" onClick={handleDone} disabled={!canFinish}>
                <Map size={18} />
                Done
              </button>
            </div>
            {cameraState !== "ready" && (
              <button type="button" className="wide-action" onClick={requestCamera}>
                <Camera size={17} />
                Enable Camera
              </button>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
