"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { advanceSpin, createSpinPlan, getIndexAtPointer, POINTER_ANGLE, TAU, type SpinPlan } from "@/lib/spinLogic";

export type WheelOption = {
  id: string;
  label: string;
  color: string;
};

type WheelProps = {
  options: WheelOption[];
  rotation: number;
  selectedIndex: number | null;
  isSpinning: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onSpinStart: () => void;
  onSpinComplete: (selectedIndex: number, finalRotation: number) => void;
};

type AudioFeedback = {
  tick: () => void;
  finish: () => void;
};

type WheelCache = {
  key: string;
  canvas: HTMLCanvasElement;
};

function createAudioFeedback(): AudioFeedback | null {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();

  function playTone(frequency: number, duration: number, gainValue: number, type: OscillatorType) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  return {
    tick: () => {
      if (context.state === "suspended") void context.resume();
      playTone(920, 0.035, 0.018, "square");
    },
    finish: () => {
      if (context.state === "suspended") void context.resume();
      playTone(420, 0.16, 0.055, "sine");
      window.setTimeout(() => playTone(640, 0.14, 0.038, "sine"), 85);
    },
  };
}

function getReadableTextColor(hex: string) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#171717" : "#ffffff";
}

function createWheelCacheKey(
  width: number,
  height: number,
  pixelRatio: number,
  options: WheelOption[],
  selectedIndex: number | null,
) {
  const optionKey = options.map((option) => `${option.id}:${option.label}:${option.color}`).join("|");
  return `${width}x${height}@${pixelRatio}:${selectedIndex ?? "none"}:${optionKey}`;
}

function renderWheelBitmap(
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
  options: WheelOption[],
  selectedIndex: number | null,
): HTMLCanvasElement {
  const bitmap = document.createElement("canvas");
  bitmap.width = Math.max(1, Math.round(cssWidth * pixelRatio));
  bitmap.height = Math.max(1, Math.round(cssHeight * pixelRatio));

  const context = bitmap.getContext("2d");
  if (!context) return bitmap;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const size = Math.min(cssWidth, cssHeight);
  const radius = size * 0.47;
  const centerX = cssWidth / 2;
  const centerY = cssHeight / 2;
  const segmentAngle = TAU / options.length;

  context.save();
  context.translate(centerX, centerY);

  context.shadowColor = "rgba(21, 26, 36, 0.22)";
  context.shadowBlur = 26;
  context.shadowOffsetY = 18;
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.fillStyle = "#ffffff";
  context.fill();
  context.shadowColor = "transparent";

  options.forEach((option, index) => {
    const startAngle = POINTER_ANGLE + index * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    const isSelected = selectedIndex === index;

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = option.color;
    context.fill();

    const gradient = context.createRadialGradient(0, 0, radius * 0.18, 0, 0, radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    gradient.addColorStop(0.58, "rgba(255, 255, 255, 0.03)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.16)");
    context.fillStyle = gradient;
    context.fill();

    context.strokeStyle = "rgba(255, 255, 255, 0.62)";
    context.lineWidth = 2;
    context.stroke();

    if (isSelected) {
      context.save();
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, radius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = "rgba(255, 255, 255, 0.2)";
      context.fill();
      context.strokeStyle = "#171717";
      context.lineWidth = 5;
      context.stroke();
      context.restore();
    }

    context.save();
    context.rotate(startAngle + segmentAngle / 2);
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = getReadableTextColor(option.color);
    context.font = `700 ${Math.max(13, Math.min(18, radius * 0.045))}px Inter, ui-sans-serif, system-ui`;
    context.shadowColor = "rgba(0, 0, 0, 0.22)";
    context.shadowBlur = 5;

    const cleanLabel = option.label.trim() || `Option ${index + 1}`;
    const maxWidth = radius * 0.58;
    let label = cleanLabel;
    while (context.measureText(label).width > maxWidth && label.length > 6) {
      label = `${label.slice(0, -2).trim()}...`;
    }

    context.fillText(label, radius * 0.9, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(0, 0, radius * 0.16, 0, TAU);
  context.fillStyle = "#f8fafc";
  context.fill();
  context.lineWidth = 7;
  context.strokeStyle = "rgba(23, 23, 23, 0.16)";
  context.stroke();

  context.beginPath();
  context.arc(0, 0, radius * 0.07, 0, TAU);
  context.fillStyle = "#171717";
  context.fill();

  context.restore();

  return bitmap;
}

function drawWheel(
  canvas: HTMLCanvasElement,
  options: WheelOption[],
  rotation: number,
  selectedIndex: number | null,
  isSpinning: boolean,
  cacheRef: { current: WheelCache | null },
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const rect = {
    width: canvas.offsetWidth || canvas.getBoundingClientRect().width,
    height: canvas.offsetHeight || canvas.getBoundingClientRect().height,
  };
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));
  const activeSelectedIndex = isSpinning ? null : selectedIndex;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const cacheKey = createWheelCacheKey(width, height, pixelRatio, options, activeSelectedIndex);
  if (cacheRef.current?.key !== cacheKey) {
    cacheRef.current = {
      key: cacheKey,
      canvas: renderWheelBitmap(rect.width, rect.height, pixelRatio, options, activeSelectedIndex),
    };
  }

  const size = Math.min(rect.width, rect.height);
  const radius = size * 0.47;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  context.drawImage(cacheRef.current.canvas, 0, 0, rect.width, rect.height);

  context.save();
  context.translate(centerX, centerY);
  context.beginPath();
  context.arc(0, 0, radius + 4, 0, TAU);
  context.lineWidth = 8;
  context.strokeStyle = "rgba(255, 255, 255, 0.92)";
  context.stroke();
  context.beginPath();
  context.arc(0, 0, radius + 10, 0, TAU);
  context.lineWidth = 2;
  context.strokeStyle = "rgba(23, 23, 23, 0.18)";
  context.stroke();
  context.restore();
  setWheelRotation(canvas, rotation);
}

function setWheelRotation(canvas: HTMLCanvasElement, rotation: number) {
  canvas.style.setProperty("--wheel-rotation", `${rotation}rad`);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function Wheel({
  options,
  rotation,
  selectedIndex,
  isSpinning,
  soundEnabled,
  onSoundToggle,
  onSpinStart,
  onSpinComplete,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planRef = useRef<SpinPlan | null>(null);
  const velocityRef = useRef(0);
  const rotationRef = useRef(rotation);
  const frameRef = useRef<number | null>(null);
  const animateRef = useRef<(time: number) => void>(() => undefined);
  const wheelCacheRef = useRef<WheelCache | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const lastTickIndexRef = useRef<number | null>(null);
  const audioRef = useRef<AudioFeedback | null>(null);

  const canSpin = options.length >= 2 && !isSpinning;
  const optionCountLabel = useMemo(() => `${options.length} entries`, [options.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    rotationRef.current = rotation;
    if (canvas) drawWheel(canvas, options, rotation, selectedIndex, isSpinning, wheelCacheRef);
  }, [isSpinning, options, rotation, selectedIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      drawWheel(canvas, options, rotationRef.current, selectedIndex, isSpinning, wheelCacheRef);
    });

    observer.observe(canvas);
    drawWheel(canvas, options, rotationRef.current, selectedIndex, isSpinning, wheelCacheRef);

    return () => observer.disconnect();
  }, [isSpinning, options, selectedIndex]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const animate = useCallback(
    (time: number) => {
      const plan = planRef.current;
      if (!plan) return;

      const previousTime = previousTimeRef.current ?? time;
      previousTimeRef.current = time;
      const frame = advanceSpin(rotationRef.current, velocityRef.current, plan, time - previousTime, time);
      const canvas = canvasRef.current;

      rotationRef.current = frame.rotation;
      velocityRef.current = frame.velocity;
      if (canvas) setWheelRotation(canvas, frame.rotation);

      if (soundEnabled) {
        const pointerIndex = getIndexAtPointer(frame.rotation, options.length);
        if (pointerIndex !== lastTickIndexRef.current && frame.velocity > 0.012) {
          lastTickIndexRef.current = pointerIndex;
          audioRef.current?.tick();
        }
      }

      if (frame.complete) {
        planRef.current = null;
        previousTimeRef.current = null;
        lastTickIndexRef.current = null;
        if (soundEnabled) audioRef.current?.finish();
        onSpinComplete(plan.selectedIndex, plan.targetRotation);
        return;
      }

      frameRef.current = requestAnimationFrame(animateRef.current);
    },
    [onSpinComplete, options, soundEnabled],
  );

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const spin = useCallback(() => {
    if (!canSpin) return;

    if (soundEnabled && !audioRef.current) {
      audioRef.current = createAudioFeedback();
    }

    const plan = createSpinPlan(options.length, rotationRef.current);
    planRef.current = plan;
    velocityRef.current = plan.initialVelocity;
    previousTimeRef.current = null;
    lastTickIndexRef.current = getIndexAtPointer(rotationRef.current, options.length);
    onSpinStart();
    frameRef.current = requestAnimationFrame(animateRef.current);
  }, [canSpin, onSpinStart, options.length, soundEnabled]);

  return (
    <section className="wheel-card" aria-label="Spinning wheel">
      <div className="wheel-stage">
        <div className="wheel-frame">
          <div className="wheel-pointer" aria-hidden="true" />
          <canvas ref={canvasRef} className="wheel-canvas" width={720} height={720} />
          <div className="wheel-shine" aria-hidden="true" />
        </div>
      </div>

      <div className="wheel-controls">
        <div>
          <span className="panel-kicker">Live wheel</span>
          <strong>{optionCountLabel}</strong>
        </div>
        <div className="wheel-controls__buttons">
          <button
            className="icon-button icon-button--sound"
            type="button"
            onClick={onSoundToggle}
            aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button className="spin-button" type="button" onClick={spin} disabled={!canSpin}>
            SPIN
          </button>
        </div>
      </div>
    </section>
  );
}
