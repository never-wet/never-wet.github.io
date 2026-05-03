"use client";

import { engineList, type EngineData, type EngineId } from "@/data/engineData";
import { getCurrentStage, getTorqueAtProgress } from "@/lib/EngineAnimationController";

export function ComparisonView({
  leftEngine,
  rightEngine,
  rightEngineId,
  onRightEngineChange,
  progress
}: {
  leftEngine: EngineData;
  rightEngine: EngineData;
  rightEngineId: EngineId;
  onRightEngineChange: (id: EngineId) => void;
  progress: number;
}) {
  return (
    <div className="comparison-view">
      <div className="comparison-toolbar">
        <div>
          <span>Comparison mode</span>
          <strong>{leftEngine.shortName} against</strong>
        </div>
        <select value={rightEngineId} onChange={(event) => onRightEngineChange(event.target.value as EngineId)} aria-label="Select comparison engine">
          {engineList
            .filter((engine) => engine.id !== leftEngine.id)
            .map((engine) => (
              <option value={engine.id} key={engine.id}>
                {engine.name}
              </option>
            ))}
        </select>
      </div>

      <div className="comparison-columns">
        <ComparisonCard engine={leftEngine} progress={progress} />
        <ComparisonCard engine={rightEngine} progress={progress} />
      </div>

      <div className="difference-board">
        <DifferenceRow label="Structure" left={leftEngine.comparison.structure} right={rightEngine.comparison.structure} />
        <DifferenceRow label="Efficiency" left={leftEngine.comparison.efficiency} right={rightEngine.comparison.efficiency} />
        <DifferenceRow label="Power delivery" left={leftEngine.comparison.powerDelivery} right={rightEngine.comparison.powerDelivery} />
      </div>
    </div>
  );
}

function ComparisonCard({ engine, progress }: { engine: EngineData; progress: number }) {
  const stage = getCurrentStage(engine, progress);
  const torque = Math.round(getTorqueAtProgress(engine, progress) * 100);

  return (
    <article className="comparison-card" style={{ "--engine-color": engine.color } as React.CSSProperties}>
      <div className="comparison-card__top">
        <span>{engine.family}</span>
        <strong>{engine.shortName}</strong>
      </div>
      <MiniLayout engine={engine} />
      <div className="metric-stack">
        <Metric label="Efficiency" value={engine.metrics.efficiency} />
        <Metric label="Power density" value={engine.metrics.powerDensity} />
        <Metric label="Smoothness" value={engine.metrics.smoothness} />
        <Metric label="Complexity" value={engine.metrics.complexity} invert />
      </div>
      <div className="live-cycle-pill">
        <span style={{ background: stage.color }} />
        {stage.name}
        <strong>{torque}% torque</strong>
      </div>
    </article>
  );
}

function Metric({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <div className="metric-bar" aria-label={`${label}: ${value}`}>
        <i style={{ width: `${value}%`, opacity: invert ? 0.72 : 1 }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function MiniLayout({ engine }: { engine: EngineData }) {
  const cylinders = Math.max(engine.cylinders, engine.modelKind === "electric" || engine.modelKind === "rotary" ? 6 : 1);

  if (engine.modelKind === "electric") {
    return (
      <svg className="mini-layout" viewBox="0 0 320 160" aria-hidden="true">
        <circle cx="160" cy="80" r="58" fill="none" stroke="var(--engine-color)" strokeWidth="16" opacity="0.28" />
        <circle cx="160" cy="80" r="28" fill="var(--engine-color)" opacity="0.38" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          return <rect key={index} x={154 + Math.cos(angle) * 58} y={74 + Math.sin(angle) * 58} width="12" height="12" rx="4" fill="var(--engine-color)" />;
        })}
      </svg>
    );
  }

  if (engine.modelKind === "rotary") {
    return (
      <svg className="mini-layout" viewBox="0 0 320 160" aria-hidden="true">
        <path d="M92 82C92 42 126 26 160 36C194 26 228 42 228 82C228 118 196 136 160 124C124 136 92 118 92 82Z" fill="none" stroke="var(--engine-color)" strokeWidth="12" />
        <path d="M160 42L204 114H116Z" fill="var(--engine-color)" opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg className="mini-layout" viewBox="0 0 320 160" aria-hidden="true">
      <line x1="52" y1="126" x2="268" y2="126" stroke="#1d1d1f" strokeWidth="10" strokeLinecap="round" opacity="0.42" />
      {Array.from({ length: Math.min(cylinders, 8) }, (_, index) => {
        const bankOffset = engine.banks === 2 && index >= cylinders / 2 ? 34 : -8;
        const bankShift = engine.banks === 2 && index >= cylinders / 2 ? -cylinders / 2 : 0;
        const x = 72 + (index + bankShift) * (engine.banks === 2 ? 44 : 34);
        return (
          <g key={index} transform={`translate(${x} ${bankOffset}) rotate(${engine.modelKind === "boxer" ? 90 : engine.banks === 2 ? (bankOffset > 0 ? 18 : -18) : 0})`}>
            <rect x="-12" y="28" width="24" height="64" rx="8" fill="none" stroke="var(--engine-color)" strokeWidth="8" opacity="0.7" />
            <rect x="-15" y="66" width="30" height="18" rx="5" fill="var(--engine-color)" opacity="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

function DifferenceRow({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <article className="difference-row">
      <strong>{label}</strong>
      <p>{left}</p>
      <p>{right}</p>
    </article>
  );
}
