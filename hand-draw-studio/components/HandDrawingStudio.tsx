"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  Brush,
  Camera,
  CameraOff,
  Circle,
  Eraser,
  Home,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

type BrushSize = "small" | "medium" | "large";

type UiState = {
  cameraOn: boolean;
  handDetected: boolean;
  isDrawing: boolean;
  message: string;
};

const COLORS = [
  { name: "Black", value: "#111111" },
  { name: "Red", value: "#e03131" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#138a55" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Yellow", value: "#f6c945" },
];

const BRUSH_SIZES: Record<BrushSize, { label: string; value: number }> = {
  small: { label: "Small", value: 5 },
  medium: { label: "Medium", value: 11 },
  large: { label: "Large", value: 22 },
};

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const PINCH_START_THRESHOLD = 0.052;
const PINCH_STOP_THRESHOLD = 0.078;
const PINCH_RELEASE_CONFIRM_FRAMES = 5;
const HAND_LOST_RELEASE_FRAMES = 8;
const REFERENCE_PALM_SPAN = 0.18;
const CURSOR_JITTER_FLOOR = 0.55;
const MAX_HISTORY = 18;

const INITIAL_MESSAGE = "Camera access needed";

export function HandDrawingStudio() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const autoRequestRef = useRef(false);

  const canvasSizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const cursorRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    visible: false,
    drawing: false,
  });
  const trackingRef = useRef({
    smoothedPinch: 0.1,
    noHandFrames: 0,
    pinchOpenFrames: 0,
    filteredX: 0,
    filteredY: 0,
    hasFilteredTarget: false,
  });
  const strokeRef = useRef<{
    active: boolean;
    lastPoint: Point | null;
    lastMidpoint: Point | null;
    history: string[];
  }>({
    active: false,
    lastPoint: null,
    lastMidpoint: null,
    history: [],
  });

  const initialUi = useMemo<UiState>(
    () => ({
      cameraOn: false,
      handDetected: false,
      isDrawing: false,
      message: INITIAL_MESSAGE,
    }),
    [],
  );
  const uiRef = useRef<UiState>(initialUi);

  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState<BrushSize>("medium");
  const [eraserOn, setEraserOn] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ui, setUi] = useState<UiState>(initialUi);

  const settingsRef = useRef({
    color: COLORS[0].value,
    brushWidth: BRUSH_SIZES.medium.value,
    eraserOn: false,
  });

  const updateDrawingAndCursor = useCallback(() => {
    const { width, height } = canvasSizeRef.current;
    const cursor = cursorRef.current;
    const cursorDistance = Math.hypot(cursor.targetX - cursor.x, cursor.targetY - cursor.y);
    const cursorAlpha = getCursorFollowAlpha(cursorDistance, cursor.drawing);

    cursor.x += (cursor.targetX - cursor.x) * cursorAlpha;
    cursor.y += (cursor.targetY - cursor.y) * cursorAlpha;
    cursor.x = clamp(cursor.x, 0, width);
    cursor.y = clamp(cursor.y, 0, height);

    if (strokeRef.current.active && cursor.visible) {
      drawSegment(
        drawingCanvasRef.current,
        canvasSizeRef.current,
        strokeRef.current,
        settingsRef.current,
        { x: cursor.x, y: cursor.y },
      );
    } else {
      strokeRef.current.lastPoint = null;
      strokeRef.current.lastMidpoint = null;
    }

    drawCursor(cursorCanvasRef.current, canvasSizeRef.current, cursor, settingsRef.current);
  }, []);

  useEffect(() => {
    settingsRef.current = {
      color: selectedColor,
      brushWidth: BRUSH_SIZES[brushSize].value,
      eraserOn,
    };
  }, [brushSize, eraserOn, selectedColor]);

  const selectedColorName = useMemo(
    () => COLORS.find((color) => color.value === selectedColor)?.name ?? "Black",
    [selectedColor],
  );

  const commitUi = useCallback((patch: Partial<UiState>) => {
    const current = uiRef.current;
    const next = { ...current, ...patch };
    if (
      next.cameraOn === current.cameraOn &&
      next.handDetected === current.handDetected &&
      next.isDrawing === current.isDrawing &&
      next.message === current.message
    ) {
      return;
    }

    uiRef.current = next;
    setUi(next);
  }, []);

  const configureCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number, dpr: number) => {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      return context;
    },
    [],
  );

  const resizeCanvases = useCallback(() => {
    const stage = stageRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;
    if (!stage || !drawingCanvas || !cursorCanvas) return;

    const rect = stage.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(320, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const previous = document.createElement("canvas");
    previous.width = drawingCanvas.width;
    previous.height = drawingCanvas.height;
    const previousContext = previous.getContext("2d");
    if (previousContext && drawingCanvas.width && drawingCanvas.height) {
      previousContext.drawImage(drawingCanvas, 0, 0);
    }

    const drawingContext = configureCanvas(drawingCanvas, width, height, dpr);
    configureCanvas(cursorCanvas, width, height, dpr);
    canvasSizeRef.current = { width, height, dpr };

    if (drawingContext && previous.width && previous.height) {
      drawingContext.clearRect(0, 0, width, height);
      drawingContext.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, width, height);
    }

    const cursor = cursorRef.current;
    if (!cursor.x && !cursor.y) {
      cursor.x = width / 2;
      cursor.y = height / 2;
      cursor.targetX = cursor.x;
      cursor.targetY = cursor.y;
    }
  }, [configureCanvas]);

  const saveHistory = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const history = strokeRef.current.history;
    history.push(canvas.toDataURL("image/png"));
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    setCanUndo(history.length > 0);
  }, []);

  const releaseStroke = useCallback(() => {
    strokeRef.current.active = false;
    strokeRef.current.lastPoint = null;
    strokeRef.current.lastMidpoint = null;
    cursorRef.current.drawing = false;
  }, []);

  const beginStroke = useCallback(() => {
    if (strokeRef.current.active) return;
    saveHistory();
    strokeRef.current.active = true;
    strokeRef.current.lastPoint = null;
    strokeRef.current.lastMidpoint = null;
    cursorRef.current.drawing = true;
  }, [saveHistory]);

  const clearCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const { width, height } = canvasSizeRef.current;
    if (!canvas || !width || !height) return;
    saveHistory();
    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, width, height);
    releaseStroke();
    commitUi({ isDrawing: false });
  }, [commitUi, releaseStroke, saveHistory]);

  const undo = useCallback(() => {
    const snapshot = strokeRef.current.history.pop();
    setCanUndo(strokeRef.current.history.length > 0);
    if (!snapshot) return;

    const canvas = drawingCanvasRef.current;
    const { width, height, dpr } = canvasSizeRef.current;
    if (!canvas || !width || !height) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
    };
    image.src = snapshot;
    releaseStroke();
    commitUi({ isDrawing: false });
  }, [commitUi, releaseStroke]);

  const stopCamera = useCallback(() => {
    releaseStroke();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    trackingRef.current.noHandFrames = 0;
    trackingRef.current.pinchOpenFrames = 0;
    trackingRef.current.hasFilteredTarget = false;
    cursorRef.current.visible = false;

    const video = videoRef.current;
    if (video) {
      setLastVideoTimeFor(video, -1);
      video.pause();
      video.srcObject = null;
    }

    setLoading(false);
    commitUi({
      cameraOn: false,
      handDetected: false,
      isDrawing: false,
      message: INITIAL_MESSAGE,
    });
  }, [commitUi, releaseStroke]);

  const startCamera = useCallback(async () => {
    if (loading || ui.cameraOn) return;

    setError("");
    setLoading(true);
    commitUi({
      cameraOn: false,
      handDetected: false,
      isDrawing: false,
      message: "Requesting camera access",
    });

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("No camera found");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      await video.play();

      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.56,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.52,
      });

      if (!isMountedRef.current) {
        landmarker.close();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      landmarkerRef.current = landmarker;
      setLoading(false);
      commitUi({
        cameraOn: true,
        handDetected: false,
        isDrawing: false,
        message: "No hand detected",
      });
    } catch (caught) {
      stopCamera();
      const message = getFriendlyError(caught);
      setError(message);
      commitUi({
        cameraOn: false,
        handDetected: false,
        isDrawing: false,
        message,
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [commitUi, loading, stopCamera, ui.cameraOn]);

  const toggleCamera = useCallback(() => {
    if (ui.cameraOn) {
      stopCamera();
      return;
    }
    void startCamera();
  }, [startCamera, stopCamera, ui.cameraOn]);

  useEffect(() => {
    if (autoRequestRef.current || ui.cameraOn || loading) return;
    autoRequestRef.current = true;
    void startCamera();
  }, [loading, startCamera, ui.cameraOn]);

  useEffect(() => {
    const stage = stageRef.current;
    resizeCanvases();
    if (!stage) return;

    const observer = new ResizeObserver(resizeCanvases);
    observer.observe(stage);
    window.addEventListener("resize", resizeCanvases);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvases);
    };
  }, [resizeCanvases]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    const tick = (now: number) => {
      readHandFrame(now, {
        video: videoRef.current,
        landmarker: landmarkerRef.current,
        cursor: cursorRef.current,
        tracking: trackingRef.current,
        canvasSize: canvasSizeRef.current,
        beginStroke,
        releaseStroke,
        commitUi,
      });
      updateDrawingAndCursor();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [beginStroke, commitUi, releaseStroke, updateDrawingAndCursor]);

  const modeLabel = ui.isDrawing ? (eraserOn ? "Erasing" : "Drawing") : ui.handDetected ? "Ready" : "Idle";
  const statusMessage = error || ui.message;

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <a className="home-link" href="../" aria-label="Back to Never Wet homepage" data-tooltip="Home">
          <Home size={18} aria-hidden="true" />
        </a>
        <div className="title-block">
          <p>Webcam Canvas</p>
          <h1>Hand Draw Studio</h1>
        </div>
        <div className={`status-pill ${error ? "status-pill--error" : ui.isDrawing ? "status-pill--active" : ""}`}>
          <span aria-hidden="true" />
          <strong>{modeLabel}</strong>
        </div>
      </header>

      <section className="workspace" aria-label="Hand tracking drawing workspace">
        <aside className="toolbar" aria-label="Drawing tools">
          <div className="tool-group">
            <span className="tool-label">Color</span>
            <div className="swatch-grid">
              {COLORS.map((color) => (
                <button
                  aria-label={`${color.name} brush`}
                  className={`swatch-button ${selectedColor === color.value && !eraserOn ? "is-selected" : ""}`}
                  data-tooltip={color.name}
                  key={color.value}
                  onClick={() => {
                    setSelectedColor(color.value);
                    setEraserOn(false);
                  }}
                  style={{ "--swatch": color.value } as React.CSSProperties}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="tool-group">
            <span className="tool-label">Size</span>
            <div className="segmented-control">
              {(Object.keys(BRUSH_SIZES) as BrushSize[]).map((size) => (
                <button
                  className={brushSize === size ? "is-selected" : ""}
                  key={size}
                  onClick={() => setBrushSize(size)}
                  type="button"
                >
                  {BRUSH_SIZES[size].label}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-row">
            <button
              aria-pressed={eraserOn}
              className={`icon-button ${eraserOn ? "is-selected" : ""}`}
              data-tooltip="Eraser"
              onClick={() => setEraserOn((current) => !current)}
              type="button"
            >
              <Eraser size={19} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              data-tooltip="Undo"
              disabled={!canUndo}
              onClick={undo}
              type="button"
            >
              <Undo2 size={19} aria-hidden="true" />
            </button>
            <button className="icon-button" data-tooltip="Clear" onClick={clearCanvas} type="button">
              <Trash2 size={19} aria-hidden="true" />
            </button>
            <button
              className={`icon-button camera-button ${ui.cameraOn ? "is-live" : ""}`}
              data-tooltip={ui.cameraOn ? "Camera off" : "Camera on"}
              disabled={loading}
              onClick={toggleCamera}
              type="button"
            >
              {ui.cameraOn ? <CameraOff size={19} aria-hidden="true" /> : <Camera size={19} aria-hidden="true" />}
            </button>
          </div>
        </aside>

        <section className="canvas-shell">
          <div className="canvas-stage" ref={stageRef}>
            <canvas className="drawing-canvas" ref={drawingCanvasRef} />
            <canvas className="cursor-canvas" ref={cursorCanvasRef} />
            <video aria-hidden="true" className={`camera-preview ${ui.cameraOn ? "is-visible" : ""}`} muted playsInline ref={videoRef} />
            <div className={`canvas-message ${ui.cameraOn && ui.handDetected ? "is-quiet" : ""}`} aria-live="polite">
              <Circle size={10} aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          </div>
        </section>

        <aside className="info-panel" aria-label="Current drawing state">
          <div className="info-card">
            <span>Gesture</span>
            <strong>{ui.isDrawing ? "Pinch held" : ui.handDetected ? "Hand found" : "Waiting"}</strong>
            <p>{ui.handDetected ? "Pinch index + thumb to draw" : statusMessage}</p>
          </div>
          <div className="info-grid">
            <div>
              <Brush size={17} aria-hidden="true" />
              <span>{eraserOn ? "Eraser" : selectedColorName}</span>
            </div>
            <div>
              <RotateCcw size={17} aria-hidden="true" />
              <span>{BRUSH_SIZES[brushSize].label}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function readHandFrame(
  now: number,
  refs: {
    video: HTMLVideoElement | null;
    landmarker: HandLandmarker | null;
    cursor: {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      visible: boolean;
      drawing: boolean;
    };
    tracking: {
      smoothedPinch: number;
      noHandFrames: number;
      pinchOpenFrames: number;
      filteredX: number;
      filteredY: number;
      hasFilteredTarget: boolean;
    };
    canvasSize: {
      width: number;
      height: number;
    };
    beginStroke: () => void;
    releaseStroke: () => void;
    commitUi: (patch: Partial<UiState>) => void;
  },
) {
  const video = refs.video;
  const landmarker = refs.landmarker;
  if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }

  if (video.currentTime === lastVideoTimeFor(video)) {
    return;
  }
  setLastVideoTimeFor(video, video.currentTime);

  let landmarks: NormalizedLandmark[] | undefined;
  try {
    const result = landmarker.detectForVideo(video, now);
    landmarks = result.landmarks[0];
  } catch {
    refs.releaseStroke();
    refs.tracking.hasFilteredTarget = false;
    refs.cursor.visible = false;
    refs.commitUi({
      handDetected: false,
      isDrawing: false,
      message: "MediaPipe loading error",
    });
    return;
  }

  if (!landmarks) {
    refs.tracking.noHandFrames += 1;
    refs.tracking.hasFilteredTarget = false;
    if (refs.cursor.drawing && refs.tracking.noHandFrames <= HAND_LOST_RELEASE_FRAMES) {
      refs.commitUi({
        handDetected: true,
        isDrawing: true,
        message: "Drawing",
      });
      return;
    }

    refs.cursor.visible = false;
    refs.tracking.pinchOpenFrames = 0;
    refs.releaseStroke();
    if (refs.tracking.noHandFrames > HAND_LOST_RELEASE_FRAMES) {
      refs.commitUi({
        handDetected: false,
        isDrawing: false,
        message: "No hand detected",
      });
    }
    return;
  }

  refs.tracking.noHandFrames = 0;
  const indexTip = landmarks[8];
  const thumbTip = landmarks[4];
  if (!indexTip || !thumbTip) return;

  const target = stabilizeCursorTarget(
    mapLandmarkToCanvas(indexTip, refs.canvasSize.width, refs.canvasSize.height),
    refs.tracking,
    refs.canvasSize,
  );
  if (!refs.cursor.visible) {
    refs.cursor.x = target.x;
    refs.cursor.y = target.y;
  }
  refs.cursor.targetX = target.x;
  refs.cursor.targetY = target.y;
  refs.cursor.visible = true;

  const pinchDistance = getNormalizedPinchDistance(indexTip, thumbTip, landmarks);
  refs.tracking.smoothedPinch = refs.tracking.smoothedPinch * 0.52 + pinchDistance * 0.48;

  const shouldStart =
    refs.tracking.smoothedPinch < PINCH_START_THRESHOLD ||
    pinchDistance < PINCH_START_THRESHOLD * 0.9;
  const shouldStop = refs.tracking.smoothedPinch > PINCH_STOP_THRESHOLD;

  if (!refs.cursor.drawing && shouldStart) {
    refs.tracking.pinchOpenFrames = 0;
    refs.beginStroke();
    refs.commitUi({
      handDetected: true,
      isDrawing: true,
      message: "Drawing",
    });
    return;
  }

  if (refs.cursor.drawing && shouldStop) {
    refs.tracking.pinchOpenFrames += 1;
  } else {
    refs.tracking.pinchOpenFrames = 0;
  }

  if (refs.cursor.drawing && refs.tracking.pinchOpenFrames >= PINCH_RELEASE_CONFIRM_FRAMES) {
    refs.tracking.pinchOpenFrames = 0;
    refs.releaseStroke();
    refs.commitUi({
      handDetected: true,
      isDrawing: false,
      message: "Pinch index + thumb to draw",
    });
    return;
  }

  refs.commitUi({
    handDetected: true,
    isDrawing: refs.cursor.drawing,
    message: refs.cursor.drawing ? "Drawing" : "Pinch index + thumb to draw",
  });
}

function drawSegment(
  canvas: HTMLCanvasElement | null,
  canvasSize: { width: number; height: number; dpr: number },
  stroke: {
    lastPoint: Point | null;
    lastMidpoint: Point | null;
  },
  settings: {
    color: string;
    brushWidth: number;
    eraserOn: boolean;
  },
  point: Point,
) {
  if (!canvas || !canvasSize.width || !canvasSize.height) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const current = {
    x: clamp(point.x, 0, canvasSize.width),
    y: clamp(point.y, 0, canvasSize.height),
  };

  if (!stroke.lastPoint || !stroke.lastMidpoint) {
    stroke.lastPoint = current;
    stroke.lastMidpoint = current;
    return;
  }

  const distance = Math.hypot(current.x - stroke.lastPoint.x, current.y - stroke.lastPoint.y);
  if (distance < 0.15) return;

  const midpoint = {
    x: (stroke.lastPoint.x + current.x) / 2,
    y: (stroke.lastPoint.y + current.y) / 2,
  };

  context.save();
  context.setTransform(canvasSize.dpr, 0, 0, canvasSize.dpr, 0, 0);
  context.globalCompositeOperation = settings.eraserOn ? "destination-out" : "source-over";
  context.globalAlpha = settings.eraserOn ? 1 : 0.96;
  context.strokeStyle = settings.color;
  context.lineWidth = settings.eraserOn ? settings.brushWidth * 1.9 : settings.brushWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(stroke.lastMidpoint.x, stroke.lastMidpoint.y);
  context.quadraticCurveTo(stroke.lastPoint.x, stroke.lastPoint.y, midpoint.x, midpoint.y);
  context.stroke();
  context.restore();

  stroke.lastPoint = current;
  stroke.lastMidpoint = midpoint;
}

function drawCursor(
  canvas: HTMLCanvasElement | null,
  canvasSize: { width: number; height: number; dpr: number },
  cursor: {
    x: number;
    y: number;
    visible: boolean;
    drawing: boolean;
  },
  settings: {
    color: string;
    brushWidth: number;
    eraserOn: boolean;
  },
) {
  if (!canvas || !canvasSize.width || !canvasSize.height) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.save();
  context.setTransform(canvasSize.dpr, 0, 0, canvasSize.dpr, 0, 0);
  context.clearRect(0, 0, canvasSize.width, canvasSize.height);

  if (!cursor.visible) {
    context.restore();
    return;
  }

  const radius = Math.max(11, settings.brushWidth * 0.7 + 8);
  const outerRadius = radius + (cursor.drawing ? 9 : 3);
  const color = settings.eraserOn ? "#111111" : settings.color;

  context.beginPath();
  context.arc(cursor.x, cursor.y, outerRadius, 0, Math.PI * 2);
  context.strokeStyle = cursor.drawing ? color : "rgba(17, 17, 17, 0.42)";
  context.lineWidth = cursor.drawing ? 2 : 1.5;
  context.setLineDash(cursor.drawing ? [] : [6, 6]);
  context.stroke();
  context.setLineDash([]);

  context.beginPath();
  context.arc(cursor.x, cursor.y, radius, 0, Math.PI * 2);
  if (cursor.drawing) {
    context.shadowColor = settings.eraserOn ? "rgba(17, 17, 17, 0.28)" : `${settings.color}88`;
    context.shadowBlur = 18;
    context.fillStyle = settings.eraserOn ? "rgba(255, 255, 255, 0.95)" : settings.color;
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = settings.eraserOn ? "#111111" : "rgba(255, 255, 255, 0.88)";
    context.lineWidth = 2;
    context.stroke();
  } else {
    context.fillStyle = "rgba(255, 255, 255, 0.84)";
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
  }

  context.restore();
}

function mapLandmarkToCanvas(landmark: NormalizedLandmark, width: number, height: number): Point {
  return {
    x: clamp((1 - landmark.x) * width, 0, width),
    y: clamp(landmark.y * height, 0, height),
  };
}

function stabilizeCursorTarget(
  target: Point,
  tracking: {
    filteredX: number;
    filteredY: number;
    hasFilteredTarget: boolean;
  },
  canvasSize: {
    width: number;
    height: number;
  },
) {
  if (!tracking.hasFilteredTarget) {
    tracking.filteredX = target.x;
    tracking.filteredY = target.y;
    tracking.hasFilteredTarget = true;
    return target;
  }

  const distance = Math.hypot(target.x - tracking.filteredX, target.y - tracking.filteredY);
  const jitterFloor = Math.max(CURSOR_JITTER_FLOOR, Math.min(canvasSize.width, canvasSize.height) * 0.0012);

  if (distance < jitterFloor) {
    return {
      x: tracking.filteredX,
      y: tracking.filteredY,
    };
  }

  const alpha = distance > 42 ? 0.9 : distance > 18 ? 0.76 : 0.58;
  tracking.filteredX += (target.x - tracking.filteredX) * alpha;
  tracking.filteredY += (target.y - tracking.filteredY) * alpha;

  return {
    x: tracking.filteredX,
    y: tracking.filteredY,
  };
}

function getCursorFollowAlpha(distance: number, drawing: boolean) {
  if (drawing) {
    if (distance > 28) return 0.94;
    if (distance > 10) return 0.84;
    return 0.68;
  }

  if (distance > 36) return 0.86;
  if (distance > 12) return 0.72;
  return 0.56;
}

function getNormalizedPinchDistance(
  indexTip: NormalizedLandmark,
  thumbTip: NormalizedLandmark,
  landmarks: NormalizedLandmark[],
) {
  const rawDistance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
  const palmSpan = getPalmSpan(landmarks);
  return rawDistance * (REFERENCE_PALM_SPAN / palmSpan);
}

function getPalmSpan(landmarks: NormalizedLandmark[]) {
  const wrist = landmarks[0];
  const indexBase = landmarks[5];
  const middleBase = landmarks[9];
  const ringBase = landmarks[13];
  const pinkyBase = landmarks[17];

  if (!wrist || !indexBase || !middleBase || !ringBase || !pinkyBase) {
    return REFERENCE_PALM_SPAN;
  }

  const palmWidth = Math.hypot(indexBase.x - pinkyBase.x, indexBase.y - pinkyBase.y);
  const palmLength = Math.hypot(wrist.x - middleBase.x, wrist.y - middleBase.y);
  const knuckleSpan = Math.hypot(indexBase.x - ringBase.x, indexBase.y - ringBase.y);

  return Math.max(0.12, palmWidth * 0.58 + palmLength * 0.32 + knuckleSpan * 0.1);
}

function getFriendlyError(caught: unknown) {
  if (caught instanceof DOMException) {
    if (caught.name === "NotAllowedError" || caught.name === "SecurityError") {
      return "Camera access needed";
    }
    if (caught.name === "NotFoundError" || caught.name === "DevicesNotFoundError") {
      return "No camera found";
    }
  }

  if (caught instanceof Error && /camera|device|found/i.test(caught.message)) {
    return caught.message;
  }

  return "MediaPipe loading error";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const videoTimes = new WeakMap<HTMLVideoElement, number>();

function lastVideoTimeFor(video: HTMLVideoElement) {
  return videoTimes.get(video) ?? -1;
}

function setLastVideoTimeFor(video: HTMLVideoElement, time: number) {
  videoTimes.set(video, time);
}
