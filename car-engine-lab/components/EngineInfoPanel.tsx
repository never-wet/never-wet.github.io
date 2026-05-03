"use client";

import { Activity, AlertTriangle, BadgeCheck, Car, Info, MousePointer2 } from "lucide-react";
import { componentLabels, type ComponentId, type EngineData } from "@/data/engineData";
import { getCurrentStage, getTorqueAtProgress } from "@/lib/EngineAnimationController";

export function EngineInfoPanel({
  engine,
  progress,
  selectedComponent,
  compareEngine
}: {
  engine: EngineData;
  progress: number;
  selectedComponent: ComponentId | null;
  compareEngine?: EngineData;
}) {
  const stage = getCurrentStage(engine, progress);
  const componentCopy =
    selectedComponent && engine.componentNotes[selectedComponent]
      ? engine.componentNotes[selectedComponent]
      : "Click or hover a highlighted component in the 2D or 3D view to focus the explanation here.";

  return (
    <aside className="info-panel" aria-label="Engine information">
      <div className="panel-title">
        <span>03</span>
        <h2>Live Notes</h2>
      </div>

      <section className="engine-summary">
        <div className="summary-heading">
          <span className="engine-chip" style={{ borderColor: engine.color, color: engine.color }}>
            {engine.family}
          </span>
          <h3>{engine.name}</h3>
          <p>{engine.overview}</p>
        </div>
      </section>

      <section className="stage-card" style={{ "--stage-color": stage.color } as React.CSSProperties}>
        <div>
          <Activity size={18} />
          <strong>{stage.name}</strong>
        </div>
        <p>{stage.description}</p>
      </section>

      <section className="component-card">
        <div>
          <MousePointer2 size={18} />
          <strong>{selectedComponent ? componentLabels[selectedComponent] : "Component focus"}</strong>
        </div>
        <p>{componentCopy}</p>
      </section>

      <section className="info-section">
        <div className="section-mini-title">
          <Info size={16} />
          <strong>How it works</strong>
        </div>
        <ol className="step-list">
          {engine.howItWorks.map((step, index) => (
            <li key={step} className={Math.floor(progress * 4) === index % 4 ? "is-current" : ""}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="info-section split-lists">
        <div>
          <div className="section-mini-title">
            <BadgeCheck size={16} />
            <strong>Advantages</strong>
          </div>
          <ul>
            {engine.advantages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="section-mini-title">
            <AlertTriangle size={16} />
            <strong>Tradeoffs</strong>
          </div>
          <ul>
            {engine.disadvantages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="info-section">
        <div className="section-mini-title">
          <Car size={16} />
          <strong>Real cars</strong>
        </div>
        <div className="usage-tags">
          {engine.usage.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="info-section">
        <div className="section-mini-title">
          <Activity size={16} />
          <strong>Torque output</strong>
        </div>
        <TorqueGraph engine={engine} progress={progress} />
      </section>

      {compareEngine ? (
        <section className="comparison-note">
          <strong>{engine.shortName} vs {compareEngine.shortName}</strong>
          <p>
            {engine.comparison.powerDelivery} Compared with {compareEngine.shortName.toLowerCase()}, the key contrast is:{" "}
            {compareEngine.comparison.powerDelivery.toLowerCase()}
          </p>
        </section>
      ) : null}
    </aside>
  );
}

function TorqueGraph({ engine, progress }: { engine: EngineData; progress: number }) {
  const width = 280;
  const height = 92;
  const samples = Array.from({ length: 56 }, (_, index) => {
    const x = index / 55;
    const torque = getTorqueAtProgress(engine, x);
    return [x * width, height - torque * (height - 14) - 7] as const;
  });
  const points = samples.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const cursorX = progress * width;
  const cursorTorque = getTorqueAtProgress(engine, progress);
  const cursorY = height - cursorTorque * (height - 14) - 7;

  return (
    <svg className="torque-graph" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Torque output graph">
      <defs>
        <linearGradient id={`torque-fill-${engine.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={engine.torqueColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={engine.torqueColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0 ${height} L ${points} L ${width} ${height} Z`} fill={`url(#torque-fill-${engine.id})`} />
      <polyline points={points} fill="none" stroke={engine.torqueColor} strokeWidth="3" strokeLinecap="round" />
      <line x1={cursorX} y1="8" x2={cursorX} y2={height - 6} stroke="#1c1c1f" strokeOpacity="0.35" strokeDasharray="3 5" />
      <circle cx={cursorX} cy={cursorY} r="5" fill={engine.torqueColor} stroke="#fffaf0" strokeWidth="2" />
    </svg>
  );
}
