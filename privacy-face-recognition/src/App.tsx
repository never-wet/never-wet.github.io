import * as faceapi from "face-api.js";
import {
  Activity,
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Database,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "privacy-face-recognition:descriptor:v1";
const MODEL_URL = `${import.meta.env.BASE_URL}models`;
const DETECTION_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.45,
});

const thresholdConfig = {
  strict: {
    label: "Strict",
    distance: 0.42,
    helper: "Lowest false-match tolerance.",
  },
  normal: {
    label: "Normal",
    distance: 0.5,
    helper: "Balanced demo setting.",
  },
  relaxed: {
    label: "Relaxed",
    distance: 0.58,
    helper: "More forgiving in uneven lighting.",
  },
} as const;

type ThresholdMode = keyof typeof thresholdConfig;
type CameraState = "idle" | "starting" | "active" | "denied" | "error";
type ModelState = "loading" | "ready" | "error";
type MessageKind = "idle" | "good" | "warn" | "error";
type ResultLabel = "Match" | "No Match";

type FaceBoxResult = {
  detection: faceapi.FaceDetection;
};

type FaceDescriptorResult = FaceBoxResult & {
  descriptor: Float32Array;
  landmarks: faceapi.FaceLandmarks68;
};

type SavedDescriptorPayload = {
  version: 1;
  createdAt: string;
  descriptor: number[];
};

type AppMessage = {
  kind: MessageKind;
  title: string;
  detail: string;
};

type DetectionInfo = {
  faceCount: number;
  confidence: number | null;
  brightness: number | null;
  faceArea: number | null;
  status: string;
  issues: string[];
};

type RecognitionResult = {
  label: ResultLabel;
  confidence: number;
  distance: number;
  threshold: number;
};

const emptyDetectionInfo: DetectionInfo = {
  faceCount: 0,
  confidence: null,
  brightness: null,
  faceArea: null,
  status: "Camera is off",
  issues: [],
};

const initialMessage: AppMessage = {
  kind: "idle",
  title: "Consent-first demo",
  detail: "Face data is processed locally and can be deleted anytime.",
};

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const detectionRunningRef = useRef(false);
  const cameraActiveRef = useRef(false);
  const descriptorRef = useRef<Float32Array | null>(null);
  const mountedRef = useRef(true);

  const [modelState, setModelState] = useState<ModelState>("loading");
  const [modelError, setModelError] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [message, setMessage] = useState<AppMessage>(initialMessage);
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo>(emptyDetectionInfo);
  const [thresholdMode, setThresholdMode] = useState<ThresholdMode>("normal");
  const [consentGiven, setConsentGiven] = useState(false);
  const [hasDescriptor, setHasDescriptor] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [storageMode, setStorageMode] = useState<"none" | "local" | "memory">("none");
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [actionPending, setActionPending] = useState<"register" | "recognize" | null>(null);
  const [videoRatio, setVideoRatio] = useState("16 / 9");

  const selectedThreshold = thresholdConfig[thresholdMode];
  const cameraIsActive = cameraState === "active";
  const modelsReady = modelState === "ready";
  const canRegister = cameraIsActive && modelsReady && !actionPending;
  const canRecognize = canRegister && hasDescriptor;

  const modelStatus = useMemo(() => {
    if (modelState === "ready") return "Models ready";
    if (modelState === "error") return "Model loading failed";
    return "Loading face models";
  }, [modelState]);

  const stopCamera = useCallback((announce = true) => {
    cameraActiveRef.current = false;
    detectionRunningRef.current = false;

    if (detectionFrameRef.current !== null) {
      window.cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    clearOverlay(overlayRef.current);
    setCameraState("idle");
    setDetectionInfo(emptyDetectionInfo);

    if (announce) {
      setMessage({
        kind: "idle",
        title: "Camera stopped",
        detail: "The camera stream has been turned off.",
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopCamera(false);
    };
  }, [stopCamera]);

  useEffect(() => {
    const stored = loadStoredDescriptor();

    if (!stored) return;

    descriptorRef.current = stored.descriptor;
    setHasDescriptor(true);
    setSavedAt(formatSavedAt(stored.createdAt));
    setStorageMode("local");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setModelState("loading");
        setModelError("");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (cancelled || !mountedRef.current) return;

        setModelState("ready");
        setMessage((current) =>
          current.kind === "idle"
            ? {
                kind: "good",
                title: "Local models ready",
                detail: "Detection and descriptor extraction will run in this browser.",
              }
            : current,
        );
      } catch (error) {
        if (cancelled || !mountedRef.current) return;

        const detail = error instanceof Error ? error.message : "Unknown model loading error.";
        setModelState("error");
        setModelError(detail);
        setMessage({
          kind: "error",
          title: "Model loading failure",
          detail: "The local face models could not be loaded. Check that the models folder is present.",
        });
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const startDetectionLoop = useCallback(() => {
    if (detectionRunningRef.current) return;

    detectionRunningRef.current = true;

    const step = async () => {
      const video = videoRef.current;
      const canvas = overlayRef.current;

      if (!cameraActiveRef.current || !video || !canvas || modelState !== "ready") {
        detectionRunningRef.current = false;
        return;
      }

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
        detectionFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      try {
        const detections = await detectFaceBoxes(video);
        const info = summarizeDetection(video, detections);
        drawDetections(canvas, video, detections, info);

        if (mountedRef.current) {
          setDetectionInfo(info);
        }
      } catch (error) {
        clearOverlay(canvas);

        if (mountedRef.current) {
          setDetectionInfo({
            ...emptyDetectionInfo,
            status: "Detection paused",
            issues: [error instanceof Error ? error.message : "Face detection failed."],
          });
        }
      }

      if (cameraActiveRef.current) {
        detectionFrameRef.current = window.requestAnimationFrame(step);
      } else {
        detectionRunningRef.current = false;
      }
    };

    detectionFrameRef.current = window.requestAnimationFrame(step);
  }, [modelState]);

  const startCamera = useCallback(async () => {
    if (!modelsReady) {
      setMessage({
        kind: "warn",
        title: "Models still loading",
        detail: "Start the camera after the local face models are ready.",
      });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setMessage({
        kind: "error",
        title: "Camera unavailable",
        detail: "This browser needs HTTPS or localhost camera support for getUserMedia.",
      });
      return;
    }

    try {
      setCameraState("starting");
      setRecognitionResult(null);
      setMessage({
        kind: "idle",
        title: "Requesting camera consent",
        detail: "Your browser will ask before opening the webcam.",
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Video element is not available.");
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await waitForVideo(video);
      await video.play();

      setVideoRatio(`${video.videoWidth} / ${video.videoHeight}`);
      cameraActiveRef.current = true;
      setCameraState("active");
      setMessage({
        kind: "good",
        title: "Camera active",
        detail: "Live detection is running locally. Recognition only runs when you press Recognize.",
      });
      startDetectionLoop();
    } catch (error) {
      cameraActiveRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const isDenied = error instanceof DOMException && error.name === "NotAllowedError";

      setCameraState(isDenied ? "denied" : "error");
      setMessage({
        kind: "error",
        title: isDenied ? "Camera permission denied" : "Camera failed",
        detail: isDenied
          ? "Camera access was blocked. Allow camera permission to use this local demo."
          : error instanceof Error
            ? error.message
            : "The webcam could not be started.",
      });
    }
  }, [modelsReady, startDetectionLoop]);

  const handleRegister = useCallback(async () => {
    if (!consentGiven) {
      setMessage({
        kind: "warn",
        title: "Consent required",
        detail: "Confirm consent before registering the face currently in view.",
      });
      return;
    }

    setActionPending("register");

    try {
      const face = await getSingleFaceForAction(videoRef.current, overlayRef.current, "register");
      const descriptor = new Float32Array(face.descriptor);
      const createdAt = new Date().toISOString();
      const savedLocally = saveDescriptor(descriptor, createdAt);

      descriptorRef.current = descriptor;
      setHasDescriptor(true);
      setSavedAt(formatSavedAt(createdAt));
      setStorageMode(savedLocally ? "local" : "memory");
      setRecognitionResult(null);
      setMessage({
        kind: savedLocally ? "good" : "warn",
        title: savedLocally ? "Face registered locally" : "Face registered for this session",
        detail: savedLocally
          ? "Only the numeric descriptor was saved in this browser. No raw face image was stored."
          : "Browser storage was unavailable, so the descriptor will be kept only until this page closes.",
      });
    } catch (error) {
      setMessage(toActionMessage(error));
    } finally {
      setActionPending(null);
    }
  }, [consentGiven]);

  const handleRecognize = useCallback(async () => {
    const savedDescriptor = descriptorRef.current;

    if (!savedDescriptor) {
      setMessage({
        kind: "warn",
        title: "No registered face",
        detail: "Register a consenting face before running a comparison.",
      });
      return;
    }

    setActionPending("recognize");

    try {
      const face = await getSingleFaceForAction(videoRef.current, overlayRef.current, "recognize");
      const threshold = thresholdConfig[thresholdMode].distance;
      const distance = faceapi.euclideanDistance(savedDescriptor, face.descriptor);
      const confidence = distanceToConfidence(distance);
      const isMatch = distance <= threshold;

      setRecognitionResult({
        label: isMatch ? "Match" : "No Match",
        confidence,
        distance,
        threshold,
      });
      setMessage({
        kind: isMatch ? "good" : "warn",
        title: isMatch ? "Match" : "No match",
        detail: `Distance ${distance.toFixed(3)} against ${thresholdMode} threshold ${threshold.toFixed(2)}.`,
      });
    } catch (error) {
      setMessage(toActionMessage(error));
    } finally {
      setActionPending(null);
    }
  }, [thresholdMode]);

  const deleteFaceData = useCallback(() => {
    deleteStoredDescriptor();
    descriptorRef.current = null;
    setHasDescriptor(false);
    setSavedAt("");
    setStorageMode("none");
    setRecognitionResult(null);
    setConsentGiven(false);
    setMessage({
      kind: "good",
      title: "Face data deleted",
      detail: "The saved descriptor was removed from this browser.",
    });
  }, []);

  const resetApp = useCallback(() => {
    stopCamera(false);
    setRecognitionResult(null);
    setConsentGiven(false);
    setActionPending(null);
    setMessage({
      kind: "idle",
      title: "Session reset",
      detail: hasDescriptor
        ? "Camera and live results were cleared. Saved face data is still available until deleted."
        : "Camera, live results, and temporary session state were cleared.",
    });
  }, [hasDescriptor, stopCamera]);

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <div className="hero-copy">
          <span className="eyebrow">Local face recognition demo</span>
          <h1 id="app-title">Consent-based face login lab</h1>
          <p className="notice">
            <ShieldCheck aria-hidden="true" />
            <span>Face data is processed locally and can be deleted anytime.</span>
          </p>
        </div>
        <div className="privacy-strip" aria-label="Privacy guarantees">
          <span>
            <LockKeyhole aria-hidden="true" />
            No hidden capture
          </span>
          <span>
            <Database aria-hidden="true" />
            Descriptor only
          </span>
          <span>
            <Activity aria-hidden="true" />
            One-person check
          </span>
        </div>
      </section>

      <section className="workspace" aria-label="Face recognition workspace">
        <div className="camera-column">
          <div className="camera-stage" style={{ aspectRatio: videoRatio }}>
            <video ref={videoRef} className="camera-video" muted playsInline autoPlay />
            <canvas ref={overlayRef} className="camera-overlay" aria-hidden="true" />

            {!cameraIsActive && (
              <div className="camera-placeholder">
                <Camera aria-hidden="true" />
                <strong>{cameraState === "starting" ? "Starting camera" : "Camera off"}</strong>
                <span>{cameraState === "denied" ? "Permission denied" : "Start camera to begin local detection"}</span>
              </div>
            )}
          </div>

          <div className="readout-grid" aria-label="Live detection readouts">
            <Readout label="Faces" value={String(detectionInfo.faceCount)} />
            <Readout
              label="Detection"
              value={detectionInfo.confidence === null ? "Waiting" : `${Math.round(detectionInfo.confidence * 100)}%`}
            />
            <Readout
              label="Lighting"
              value={detectionInfo.brightness === null ? "Unknown" : `${Math.round(detectionInfo.brightness)}/255`}
            />
            <Readout
              label="Face size"
              value={detectionInfo.faceArea === null ? "Unknown" : `${Math.round(detectionInfo.faceArea * 100)}%`}
            />
          </div>
        </div>

        <aside className="control-panel" aria-label="Controls">
          <StatusCard
            icon={modelState === "loading" ? Loader2 : modelState === "ready" ? CheckCircle2 : AlertTriangle}
            title={modelStatus}
            detail={modelState === "error" ? modelError || "Could not load models." : "Tiny face detector, landmarks, and descriptor models."}
            tone={modelState === "error" ? "error" : modelState === "ready" ? "good" : "idle"}
            spinning={modelState === "loading"}
          />

          <StatusCard
            icon={message.kind === "good" ? CheckCircle2 : message.kind === "error" ? AlertTriangle : ShieldCheck}
            title={message.title}
            detail={message.detail}
            tone={message.kind}
          />

          <div className="result-panel" data-state={recognitionResult?.label.toLowerCase().replace(" ", "-") || "idle"}>
            <span className="panel-label">Recognition</span>
            <strong>{recognitionResult?.label || "Not run"}</strong>
            <div className="result-meter" aria-hidden="true">
              <span style={{ width: `${recognitionResult?.confidence ?? 0}%` }} />
            </div>
            <p>
              {recognitionResult
                ? `${recognitionResult.confidence}% confidence, distance ${recognitionResult.distance.toFixed(3)}`
                : "Press Recognize to compare the current face to the saved descriptor."}
            </p>
          </div>

          <div className="threshold-panel">
            <div className="panel-heading">
              <SlidersHorizontal aria-hidden="true" />
              <span>Threshold</span>
            </div>
            <div className="segmented" role="radiogroup" aria-label="Recognition threshold">
              {(Object.keys(thresholdConfig) as ThresholdMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={thresholdMode === mode}
                  className={thresholdMode === mode ? "is-selected" : ""}
                  onClick={() => setThresholdMode(mode)}
                >
                  {thresholdConfig[mode].label}
                </button>
              ))}
            </div>
            <p>
              {selectedThreshold.helper} Distance limit: {selectedThreshold.distance.toFixed(2)}.
            </p>
          </div>

          <label className="consent-check">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(event) => setConsentGiven(event.target.checked)}
            />
            <span>I consent to register the face currently in view.</span>
          </label>

          <div className="button-grid">
            <button type="button" className="primary" onClick={startCamera} disabled={cameraState === "starting" || !modelsReady}>
              {cameraState === "starting" ? <Loader2 className="spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
              Start Camera
            </button>
            <button type="button" onClick={handleRegister} disabled={!canRegister || !consentGiven}>
              {actionPending === "register" ? <Loader2 className="spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
              Register Face
            </button>
            <button type="button" onClick={handleRecognize} disabled={!canRecognize}>
              {actionPending === "recognize" ? <Loader2 className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
              Recognize
            </button>
            <button type="button" onClick={deleteFaceData} disabled={!hasDescriptor}>
              <Trash2 aria-hidden="true" />
              Delete Face Data
            </button>
            <button type="button" onClick={() => stopCamera()} disabled={!cameraIsActive}>
              <CameraOff aria-hidden="true" />
              Stop Camera
            </button>
            <button type="button" onClick={resetApp}>
              <RotateCcw aria-hidden="true" />
              Reset App
            </button>
          </div>

          <div className="descriptor-state">
            <span className={hasDescriptor ? "dot dot-good" : "dot"} aria-hidden="true" />
            <p>
              {hasDescriptor
                ? `Registered descriptor: ${storageMode === "local" ? "saved locally" : "session only"}${savedAt ? `, ${savedAt}` : ""}.`
                : "No face descriptor registered."}
            </p>
          </div>

          <div className="detection-notes" aria-live="polite">
            <strong>{detectionInfo.status}</strong>
            {detectionInfo.issues.length > 0 && (
              <ul>
                {detectionInfo.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="readout">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  detail,
  tone,
  spinning = false,
}: {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
  tone: MessageKind;
  spinning?: boolean;
}) {
  return (
    <div className="status-card" data-tone={tone}>
      <Icon className={spinning ? "spin" : ""} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

async function detectFaceBoxes(video: HTMLVideoElement): Promise<FaceBoxResult[]> {
  const detections = await faceapi.detectAllFaces(video, DETECTION_OPTIONS);

  return detections.map((detection) => ({ detection }));
}

async function detectFacesWithDescriptors(video: HTMLVideoElement): Promise<FaceDescriptorResult[]> {
  const detections = await faceapi
    .detectAllFaces(video, DETECTION_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections as FaceDescriptorResult[];
}

async function getSingleFaceForAction(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null,
  action: "register" | "recognize",
): Promise<FaceDescriptorResult> {
  if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
    throw new UserActionError("Camera not ready", "Start the camera and wait for the live preview before continuing.");
  }

  const detections = await detectFacesWithDescriptors(video);
  const info = summarizeDetection(video, detections);
  drawDetections(canvas, video, detections, info);

  if (detections.length === 0) {
    throw new UserActionError("No face detected", "Move into view and keep your face centered in the frame.");
  }

  if (detections.length > 1) {
    throw new UserActionError("Multiple faces detected", "Only one consenting face can be registered or compared at a time.");
  }

  if (info.faceArea !== null && info.faceArea < 0.045) {
    throw new UserActionError("Face too far", "Move closer to the camera before registering or recognizing.");
  }

  if (action === "register" && info.brightness !== null && info.brightness < 52) {
    throw new UserActionError("Poor lighting", "Improve the lighting before saving a face descriptor.");
  }

  return detections[0];
}

function summarizeDetection(video: HTMLVideoElement, detections: FaceBoxResult[]): DetectionInfo {
  const brightness = estimateBrightness(video);
  const issues: string[] = [];
  const confidence = detections[0]?.detection.score ?? null;
  const faceArea = detections[0] ? getFaceAreaRatio(video, detections[0]) : null;

  if (detections.length === 0) {
    issues.push("No face detected.");
  }

  if (detections.length > 1) {
    issues.push("Multiple faces detected. Register and recognize one consenting person at a time.");
  }

  if (brightness !== null && brightness < 52) {
    issues.push("Poor lighting detected.");
  }

  if (faceArea !== null && faceArea < 0.045) {
    issues.push("Face appears too far from the camera.");
  }

  return {
    faceCount: detections.length,
    confidence,
    brightness,
    faceArea,
    issues,
    status: getDetectionStatus(detections.length, issues),
  };
}

function getDetectionStatus(faceCount: number, issues: string[]) {
  if (faceCount === 1 && issues.length === 0) return "One face detected";
  if (faceCount === 1) return "Face detected with quality warning";
  if (faceCount > 1) return "Multiple faces detected";
  return "Waiting for one face";
}

function drawDetections(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detections: FaceBoxResult[],
  info: DetectionInfo,
) {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, width, height);

  detections.forEach((face, index) => {
    const box = face.detection.box;
    const isWarn = detections.length > 1 || info.issues.length > 0;
    const color = isWarn ? "#d98623" : "#1c9c68";
    const label = `Face ${index + 1} ${Math.round(face.detection.score * 100)}%`;
    const lineWidth = Math.max(3, width * 0.004);
    const fontSize = Math.max(15, width * 0.018);

    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowColor = "rgba(0, 0, 0, 0.28)";
    context.shadowBlur = 14;
    context.strokeRect(box.x, box.y, box.width, box.height);
    context.restore();

    context.save();
    context.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    const metrics = context.measureText(label);
    const labelWidth = metrics.width + 20;
    const labelHeight = fontSize + 12;
    const labelX = Math.max(8, Math.min(box.x, width - labelWidth - 8));
    const labelY = Math.max(8, box.y - labelHeight - 8);

    context.fillStyle = "rgba(16, 22, 20, 0.86)";
    roundRect(context, labelX, labelY, labelWidth, labelHeight, 8);
    context.fill();
    context.fillStyle = "#f7fbf6";
    context.fillText(label, labelX + 10, labelY + fontSize + 2);
    context.restore();
  });
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function clearOverlay(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function getFaceAreaRatio(video: HTMLVideoElement, face: FaceBoxResult) {
  const frameArea = video.videoWidth * video.videoHeight;
  const box = face.detection.box;

  if (!frameArea) return null;
  return (box.width * box.height) / frameArea;
}

function estimateBrightness(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return null;

  try {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let luminance = 0;

    for (let index = 0; index < data.length; index += 4) {
      luminance += data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
    }

    return luminance / (data.length / 4);
  } catch {
    return null;
  }
}

function waitForVideo(video: HTMLVideoElement) {
  if (video.videoWidth && video.videoHeight) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Camera video did not become ready."));
    }, 8000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("error", handleError);
    };

    const handleLoaded = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Camera video failed to load."));
    };

    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function distanceToConfidence(distance: number) {
  const normalized = Math.max(0, Math.min(1, 1 - distance / 0.78));
  return Math.round(normalized * 100);
}

function saveDescriptor(descriptor: Float32Array, createdAt: string) {
  const payload: SavedDescriptorPayload = {
    version: 1,
    createdAt,
    descriptor: Array.from(descriptor),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function loadStoredDescriptor() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as Partial<SavedDescriptorPayload>;

    if (
      payload.version !== 1 ||
      typeof payload.createdAt !== "string" ||
      !Array.isArray(payload.descriptor) ||
      payload.descriptor.length !== 128 ||
      payload.descriptor.some((value) => typeof value !== "number")
    ) {
      return null;
    }

    return {
      createdAt: payload.createdAt,
      descriptor: new Float32Array(payload.descriptor),
    };
  } catch {
    return null;
  }
}

function deleteStoredDescriptor() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toActionMessage(error: unknown): AppMessage {
  if (error instanceof UserActionError) {
    return {
      kind: "warn",
      title: error.title,
      detail: error.detail,
    };
  }

  return {
    kind: "error",
    title: "Action failed",
    detail: error instanceof Error ? error.message : "The requested face action could not be completed.",
  };
}

class UserActionError extends Error {
  title: string;
  detail: string;

  constructor(title: string, detail: string) {
    super(`${title}: ${detail}`);
    this.title = title;
    this.detail = detail;
  }
}

export default App;
