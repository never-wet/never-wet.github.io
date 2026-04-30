"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Home, Radar } from "lucide-react";
import { ScannerOverlay } from "@/components/ScannerOverlay";
import { ScanControls, type CameraState, type ScannerPhase, type ViewCommandType } from "@/components/ScanControls";
import { ScanPreview3D, type ViewCommand } from "@/components/ScanPreview3D";
import { FrameProcessor, type FrameQuality, type ProcessedFrame, type ScanMode } from "@/utils/FrameProcessor";
import { buildPointCloud, type ScanPointCloud } from "@/utils/PointCloudBuilder";

const DEFAULT_QUALITY: FrameQuality = {
  objectScore: 0,
  maskCoverage: 0,
  edgeScore: 0,
  brightness: 0,
};

const MODE_TARGET_FRAMES: Record<ScanMode, number> = {
  quick: 18,
  detail: 34,
};

const MODE_CAPTURE_INTERVAL: Record<ScanMode, number> = {
  quick: 220,
  detail: 260,
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
  return "Opening the front camera.";
}

export function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<FrameProcessor | null>(null);
  const framesRef = useRef<ProcessedFrame[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastCaptureRef = useRef(0);
  const frameIndexRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("checking");
  const [phase, setPhase] = useState<ScannerPhase>("scanning");
  const [mode, setMode] = useState<ScanMode>("quick");
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [quality, setQuality] = useState<FrameQuality>(DEFAULT_QUALITY);
  const [pointCloud, setPointCloud] = useState<ScanPointCloud | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewCommand, setViewCommand] = useState<ViewCommand | null>(null);

  const warning = quality.warning;
  const pointCount = pointCloud?.count ?? 0;
  const targetFrames = MODE_TARGET_FRAMES[mode];

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

    const frontCamera: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(frontCamera);
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
    setQuality(DEFAULT_QUALITY);
    setPointCloud(null);
  }, []);

  const handleRetake = useCallback(() => {
    resetCapture();
    setPhase("scanning");
    setAutoRotate(true);
    void requestCamera();
  }, [requestCamera, resetCapture]);

  const handleDone = useCallback(() => {
    if (framesRef.current.length === 0) return;

    const cloud = buildPointCloud(framesRef.current, mode);
    setPointCloud(cloud);
    setPhase("preview");
    setProgress(100);
    stopCamera();
  }, [mode, stopCamera]);

  const handleModeChange = useCallback(
    (nextMode: ScanMode) => {
      setMode(nextMode);
      resetCapture();
    },
    [resetCapture],
  );

  const sendViewCommand = useCallback((type: ViewCommandType) => {
    setViewCommand({ id: performance.now(), type });
  }, []);

  useEffect(() => {
    processorRef.current = new FrameProcessor();
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
          framesRef.current = [...framesRef.current, frame].slice(-58);
          const nextFrameCount = framesRef.current.length;
          setCapturedFrames(nextFrameCount);
          setProgress(Math.min(99, (nextFrameCount / targetFrames) * 100));
        }

        setQuality(frame.quality);
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
    if (phase === "preview") return "Preview";
    if (cameraState === "ready") return "Scanning";
    if (cameraState === "requesting") return "Camera";
    return "Standby";
  }, [cameraState, phase]);

  const showCameraProblem = cameraState === "denied" || cameraState === "missing" || cameraState === "unsupported";

  return (
    <main className="scanner-shell">
      <header className="scanner-topbar">
        <a className="home-link" href="../" aria-label="Back to Never Wet homepage">
          <Home size={17} />
          <span>NW</span>
        </a>
        <div className="scanner-title">
          <span>
            <Radar size={16} />
            Live Camera Reconstruction
          </span>
          <h1>Object Scanner</h1>
        </div>
        <div className="status-chip">{statusLabel}</div>
      </header>

      {phase === "preview" && pointCloud ? (
        <section className="scanner-workspace scanner-workspace--preview">
          <ScanPreview3D cloud={pointCloud} autoRotate={autoRotate} command={viewCommand} />
          <ScanControls
            phase={phase}
            cameraState={cameraState}
            mode={mode}
            progress={progress}
            capturedFrames={capturedFrames}
            pointCount={pointCount}
            quality={quality}
            warning={warning}
            autoRotate={autoRotate}
            onModeChange={handleModeChange}
            onDone={handleDone}
            onRetake={handleRetake}
            onCameraRetry={requestCamera}
            onViewCommand={sendViewCommand}
            onAutoRotateChange={setAutoRotate}
          />
        </section>
      ) : (
        <section className="scanner-workspace">
          <div className="camera-stage">
            <video ref={videoRef} className="camera-feed" muted playsInline autoPlay />
            <ScannerOverlay active={cameraState === "ready"} progress={progress} quality={quality} warning={warning} />

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

          <ScanControls
            phase={phase}
            cameraState={cameraState}
            mode={mode}
            progress={progress}
            capturedFrames={capturedFrames}
            pointCount={pointCount}
            quality={quality}
            warning={warning}
            autoRotate={autoRotate}
            onModeChange={handleModeChange}
            onDone={handleDone}
            onRetake={handleRetake}
            onCameraRetry={requestCamera}
            onViewCommand={sendViewCommand}
            onAutoRotateChange={setAutoRotate}
          />
        </section>
      )}
    </main>
  );
}
