"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CirclePause,
  CirclePlay,
  Cpu,
  Eye,
  Gauge,
  GitCompare,
  Layers3,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
  SplitSquareHorizontal
} from "lucide-react";
import { Engine2DView } from "@/components/Engine2DView";
import { EngineInfoPanel } from "@/components/EngineInfoPanel";
import { EngineSelector } from "@/components/EngineSelector";
import { ComparisonView } from "@/components/ComparisonView";
import { engines, type ComponentId, type EngineId, type SpeedMode } from "@/data/engineData";
import { getCurrentStage, speedMultipliers, wrapProgress } from "@/lib/EngineAnimationController";

const Engine3DView = dynamic(() => import("@/components/Engine3DView").then((module) => module.Engine3DView), {
  ssr: false,
  loading: () => (
    <div className="three-loading">
      <div className="loader-ring" />
      <span>Loading interactive model</span>
    </div>
  )
});

type LabMode = "2d" | "3d" | "compare";

export interface ViewSettings {
  transparent: boolean;
  exploded: boolean;
  xray: boolean;
  cutaway: boolean;
  showFlow: boolean;
  isolate: boolean;
}

const defaultSettings: ViewSettings = {
  transparent: false,
  exploded: false,
  xray: false,
  cutaway: true,
  showFlow: true,
  isolate: false
};

const modeItems: Array<{ id: LabMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "2d", label: "2D explain", icon: ScanLine },
  { id: "3d", label: "3D interactive", icon: Layers3 },
  { id: "compare", label: "Compare", icon: GitCompare }
];

export function EngineLab() {
  const [selectedId, setSelectedId] = useState<EngineId>("inline-i4");
  const [compareId, setCompareId] = useState<EngineId>("electric");
  const [mode, setMode] = useState<LabMode>("2d");
  const [progress, setProgress] = useState(0.03);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [settings, setSettings] = useState<ViewSettings>(defaultSettings);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>("piston");
  const [weakDevice, setWeakDevice] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const engine = engines[selectedId];
  const compareEngine = engines[compareId];
  const currentStage = useMemo(() => getCurrentStage(engine, progress), [engine, progress]);
  const focusedComponent = useMemo(
    () => (selectedComponent && engine.components.includes(selectedComponent) ? selectedComponent : engine.components[0] ?? null),
    [engine, selectedComponent]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const memory = "deviceMemory" in navigator ? Number(navigator.deviceMemory) : 8;
      const cores = navigator.hardwareConcurrency || 8;
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWeakDevice(!gl || memory <= 4 || cores <= 4);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = timestamp;
      }

      const delta = Math.min(0.05, (timestamp - lastFrameRef.current) / 1000);
      lastFrameRef.current = timestamp;
      setProgress((value) => wrapProgress(value + delta * speedMultipliers[speed]));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
    };
  }, [playing, speed]);

  function updateSetting(key: keyof ViewSettings) {
    setSettings((value) => ({ ...value, [key]: !value[key] }));
  }

  return (
    <main className="engine-lab-shell">
      <div className="lab-backdrop" aria-hidden="true" />

      <header className="lab-header">
        <a className="home-link" href="../">
          NW
        </a>
        <div>
          <p className="eyebrow">Interactive engine lab</p>
          <h1>Car Engine Lab</h1>
        </div>
        <div className="header-readouts" aria-label="Current engine status">
          <span>
            <Gauge size={16} />
            {currentStage.name}
          </span>
          <span>
            <Cpu size={16} />
            {engine.shortName}
          </span>
          {weakDevice ? <span className="device-note">2D fallback ready</span> : null}
        </div>
      </header>

      <section className="lab-grid" aria-label="Engine learning workspace">
        <EngineSelector selectedId={selectedId} onSelect={setSelectedId} />

        <section className="visual-workbench">
          <div className="mode-bar" role="tablist" aria-label="Learning mode">
            {modeItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={mode === item.id ? "is-active" : ""}
                  onClick={() => setMode(item.id)}
                  type="button"
                  role="tab"
                  aria-selected={mode === item.id}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${selectedId}`}
              className="visual-surface"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {mode === "2d" ? (
                <Engine2DView
                  engine={engine}
                  progress={progress}
                  selectedComponent={focusedComponent}
                  onComponentSelect={setSelectedComponent}
                />
              ) : null}

              {mode === "3d" ? (
                <Engine3DView
                  engine={engine}
                  progress={progress}
                  playing={playing}
                  settings={settings}
                  selectedComponent={focusedComponent}
                  onComponentSelect={setSelectedComponent}
                />
              ) : null}

              {mode === "compare" ? (
                <ComparisonView
                  leftEngine={engine}
                  rightEngine={compareEngine}
                  rightEngineId={compareId}
                  onRightEngineChange={setCompareId}
                  progress={progress}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>

        <EngineInfoPanel
          engine={engine}
          progress={progress}
          selectedComponent={focusedComponent}
          compareEngine={mode === "compare" ? compareEngine : undefined}
        />
      </section>

      <footer className="control-deck" aria-label="Animation controls">
        <div className="transport-cluster">
          <button className="icon-button" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause animation" : "Play animation"}>
            {playing ? <CirclePause size={22} /> : <CirclePlay size={22} />}
          </button>
          <button className="icon-button" type="button" onClick={() => setProgress(0)} aria-label="Reset timeline">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="timeline-control">
          <div className="timeline-label">
            <strong>{currentStage.name}</strong>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            value={Math.round(progress * 1000)}
            onChange={(event) => {
              setPlaying(false);
              setProgress(Number(event.target.value) / 1000);
            }}
            aria-label="Scrub engine cycle timeline"
          />
          <div className="stage-track" aria-hidden="true">
            {engine.cycleStages.map((stage) => (
              <span key={stage.id} style={{ background: stage.color }} />
            ))}
          </div>
        </div>

        <div className="speed-control" aria-label="Speed control">
          {(["slow", "normal", "fast"] as SpeedMode[]).map((item) => (
            <button key={item} className={speed === item ? "is-active" : ""} onClick={() => setSpeed(item)} type="button">
              {item}
            </button>
          ))}
        </div>

        <div className="view-toggles" aria-label="Visualization toggles">
          <ToggleButton icon={Eye} label="Transparent" active={settings.transparent} onClick={() => updateSetting("transparent")} />
          <ToggleButton icon={Boxes} label="Explode" active={settings.exploded} onClick={() => updateSetting("exploded")} />
          <ToggleButton icon={SplitSquareHorizontal} label="Cutaway" active={settings.cutaway} onClick={() => updateSetting("cutaway")} />
          <ToggleButton icon={SlidersHorizontal} label="Flow" active={settings.showFlow} onClick={() => updateSetting("showFlow")} />
          <ToggleButton icon={ScanLine} label="X-ray" active={settings.xray} onClick={() => updateSetting("xray")} />
          <ToggleButton
            icon={Layers3}
            label="Isolate"
            active={settings.isolate}
            disabled={!focusedComponent}
            onClick={() => updateSetting("isolate")}
          />
        </div>
      </footer>
    </main>
  );
}

function ToggleButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "is-active" : ""} disabled={disabled} onClick={onClick} type="button" title={label}>
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}
