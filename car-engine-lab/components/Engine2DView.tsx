"use client";

import { useState } from "react";
import type { ComponentId, EngineData } from "@/data/engineData";
import { componentLabels } from "@/data/engineData";
import { getCurrentStage, getEngineKinematics, pistonTravel } from "@/lib/EngineAnimationController";

export function Engine2DView({
  engine,
  progress,
  selectedComponent,
  onComponentSelect
}: {
  engine: EngineData;
  progress: number;
  selectedComponent: ComponentId | null;
  onComponentSelect: (id: ComponentId) => void;
}) {
  const [hovered, setHovered] = useState<ComponentId | null>(null);
  const stage = getCurrentStage(engine, progress);
  const kinematics = getEngineKinematics(engine, progress);
  const activeComponent = hovered ?? selectedComponent;

  const hotspot = (id: ComponentId) => ({
    className: activeComponent === id ? "svg-hotspot is-active" : "svg-hotspot",
    onPointerEnter: () => setHovered(id),
    onPointerLeave: () => setHovered(null),
    onClick: () => onComponentSelect(id),
    tabIndex: 0,
    role: "button",
    "aria-label": componentLabels[id]
  });

  return (
    <div className="diagram-shell">
      <div className="diagram-header">
        <div>
          <span>2D explain mode</span>
          <strong>{engine.name}</strong>
        </div>
        <div className="stage-pills">
          {engine.cycleStages.map((item) => (
            <span key={item.id} className={item.id === stage.id ? "is-active" : ""} style={{ "--stage-color": item.color } as React.CSSProperties}>
              {item.name}
            </span>
          ))}
        </div>
      </div>

      <svg className="engine-diagram" viewBox="0 0 920 560" role="img" aria-label={`${engine.name} animated 2D diagram`}>
        <defs>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8Z" fill="#2f80ed" />
          </marker>
          <marker id="arrow-gray" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8Z" fill="#8a8f98" />
          </marker>
          <filter id="spark-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="heat-gradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#eb5757" />
            <stop offset="100%" stopColor="#f2c94c" />
          </linearGradient>
        </defs>

        <rect x="18" y="18" width="884" height="524" rx="24" fill="#fffaf0" />
        <path d="M54 472H866" stroke="#d7d0c2" strokeWidth="2" strokeDasharray="8 10" />

        {engine.modelKind === "rotary" ? (
          <RotaryDiagram progress={progress} stageColor={stage.color} hotspot={hotspot} />
        ) : engine.modelKind === "electric" ? (
          <ElectricDiagram progress={progress} stageColor={stage.color} hotspot={hotspot} />
        ) : engine.modelKind === "hybrid" ? (
          <HybridDiagram engine={engine} progress={progress} stageColor={stage.color} hotspot={hotspot} />
        ) : engine.modelKind === "boxer" ? (
          <BoxerDiagram engine={engine} progress={progress} stageColor={stage.color} hotspot={hotspot} />
        ) : engine.modelKind === "v" || engine.modelKind === "supercharged" ? (
          <VDiagram engine={engine} progress={progress} stageColor={stage.color} hotspot={hotspot} />
        ) : (
          <InlineDiagram engine={engine} progress={progress} stageColor={stage.color} hotspot={hotspot} />
        )}

        {kinematics.spark > 0 ? (
          <g filter="url(#spark-glow)" opacity={kinematics.spark}>
            <circle cx="460" cy="128" r="26" fill="#eb5757" />
            <path d="M446 128H474M460 114V142M450 118L470 138M470 118L450 138" stroke="#fff7d6" strokeWidth="5" strokeLinecap="round" />
          </g>
        ) : null}

        <StageOverlay stageColor={stage.color} progress={progress} engine={engine} />
      </svg>

      <div className="diagram-legend">
        <LegendItem color="#2f80ed" label="Intake air" />
        <LegendItem color="#f2c94c" label="Compression" />
        <LegendItem color="#eb5757" label="Combustion / torque" />
        <LegendItem color="#8a8f98" label="Exhaust" />
      </div>
    </div>
  );
}

function InlineDiagram({
  engine,
  progress,
  stageColor,
  hotspot
}: {
  engine: EngineData;
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  const cylinders = Math.min(engine.cylinders, 6);
  const spacing = cylinders > 4 ? 82 : 98;
  const startX = 460 - ((cylinders - 1) * spacing) / 2;
  const crankY = 386;
  const crankAngle = progress * Math.PI * 4;

  return (
    <g>
      <FlowSystem engine={engine} stageColor={stageColor} hotspot={hotspot} />
      <g {...hotspot("block")}>
        <rect x={startX - 58} y="106" width={(cylinders - 1) * spacing + 116} height="296" rx="28" fill="#f0e8d8" stroke="#1f2328" strokeWidth="3" />
        <rect x={startX - 44} y="122" width={(cylinders - 1) * spacing + 88} height="58" rx="16" fill="#d9d0bf" opacity="0.65" />
      </g>

      {Array.from({ length: cylinders }, (_, index) => {
        const phase = (index / cylinders) * Math.PI * 2;
        return <PistonUnit key={index} x={startX + index * spacing} y={122} index={index} progress={progress} phase={phase} diesel={engine.modelKind === "diesel"} hotspot={hotspot} />;
      })}

      <g {...hotspot("crankshaft")}>
        <line x1={startX - 76} y1={crankY} x2={startX + (cylinders - 1) * spacing + 76} y2={crankY} stroke="#22252b" strokeWidth="16" strokeLinecap="round" />
        {Array.from({ length: cylinders }, (_, index) => {
          const x = startX + index * spacing;
          const phase = (index / cylinders) * Math.PI * 2;
          return (
            <g key={index} transform={`translate(${x} ${crankY}) rotate(${((crankAngle + phase) * 180) / Math.PI})`}>
              <circle r="26" fill="none" stroke="#49515c" strokeWidth="8" />
              <circle cx="24" cy="0" r="8" fill={stageColor} />
            </g>
          );
        })}
      </g>

      {engine.modelKind === "turbocharged" ? <TurboOverlay progress={progress} hotspot={hotspot} /> : null}
    </g>
  );
}

function VDiagram({
  engine,
  progress,
  stageColor,
  hotspot
}: {
  engine: EngineData;
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  const perBank = Math.ceil(engine.cylinders / 2);
  const spacing = perBank > 3 ? 70 : 84;
  const crankAngle = progress * Math.PI * 4;

  return (
    <g>
      <FlowSystem engine={engine} stageColor={stageColor} hotspot={hotspot} />
      <g transform="translate(460 112)">
        <g {...hotspot("block")}>
          <path d="M-252 42L-84 320H84L252 42C180 16 92 8 0 8C-92 8-180 16-252 42Z" fill="#eee3d0" stroke="#1f2328" strokeWidth="3" />
          <path d="M-54 328H54" stroke="#1f2328" strokeWidth="38" strokeLinecap="round" />
        </g>
        <g transform="translate(-74 28) rotate(-22)">
          {Array.from({ length: perBank }, (_, index) => (
            <PistonUnit key={`l-${index}`} x={(index - (perBank - 1) / 2) * spacing} y={0} index={index} progress={progress} phase={(index / engine.cylinders) * Math.PI * 2} hotspot={hotspot} compact />
          ))}
        </g>
        <g transform="translate(74 28) rotate(22)">
          {Array.from({ length: perBank }, (_, index) => (
            <PistonUnit
              key={`r-${index}`}
              x={(index - (perBank - 1) / 2) * spacing}
              y={0}
              index={index}
              progress={progress}
              phase={((index + perBank) / engine.cylinders) * Math.PI * 2}
              hotspot={hotspot}
              compact
            />
          ))}
        </g>
        <g {...hotspot("crankshaft")} transform="translate(0 332)">
          <line x1="-148" y1="0" x2="148" y2="0" stroke="#22252b" strokeWidth="16" strokeLinecap="round" />
          {Array.from({ length: perBank }, (_, index) => (
            <g key={index} transform={`translate(${(index - (perBank - 1) / 2) * 80} 0) rotate(${((crankAngle + index) * 180) / Math.PI})`}>
              <circle r="28" fill="none" stroke="#49515c" strokeWidth="8" />
              <circle cx="24" cy="0" r="8" fill={stageColor} />
            </g>
          ))}
        </g>
        {engine.modelKind === "supercharged" ? <SuperchargerOverlay progress={progress} hotspot={hotspot} /> : null}
      </g>
    </g>
  );
}

function BoxerDiagram({
  progress,
  stageColor,
  hotspot
}: {
  engine: EngineData;
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  const crankAngle = progress * Math.PI * 4;
  return (
    <g transform="translate(460 278)">
      <FlowSystem stageColor={stageColor} hotspot={hotspot} />
      <g {...hotspot("block")}>
        <path d="M-344-78H-74C-42-78-24-58-24-30V88H-344Z" fill="#eee3d0" stroke="#1f2328" strokeWidth="3" />
        <path d="M344-78H74C42-78 24-58 24-30V88H344Z" fill="#eee3d0" stroke="#1f2328" strokeWidth="3" />
      </g>
      <g transform="translate(-188 -42) rotate(90)">
        <PistonUnit x={-44} y={-8} index={0} progress={progress} phase={0} hotspot={hotspot} compact />
        <PistonUnit x={44} y={-8} index={1} progress={progress} phase={Math.PI} hotspot={hotspot} compact />
      </g>
      <g transform="translate(188 -42) rotate(-90)">
        <PistonUnit x={-44} y={-8} index={2} progress={progress} phase={Math.PI} hotspot={hotspot} compact />
        <PistonUnit x={44} y={-8} index={3} progress={progress} phase={0} hotspot={hotspot} compact />
      </g>
      <g {...hotspot("crankshaft")}>
        <circle r="58" fill="#23272f" opacity="0.92" />
        <circle r="34" fill="#fffaf0" opacity="0.26" />
        <g transform={`rotate(${(crankAngle * 180) / Math.PI})`}>
          <circle cx="46" r="10" fill={stageColor} />
          <line x1="-46" x2="46" stroke={stageColor} strokeWidth="8" strokeLinecap="round" opacity="0.72" />
        </g>
      </g>
    </g>
  );
}

function HybridDiagram({
  engine,
  progress,
  stageColor,
  hotspot
}: {
  engine: EngineData;
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  return (
    <g>
      <g transform="translate(-88 0)">
        <InlineDiagram engine={engine} progress={progress} stageColor={stageColor} hotspot={hotspot} />
      </g>
      <g transform="translate(654 282)">
        <g {...hotspot("battery")}>
          <rect x="-88" y="-172" width="176" height="82" rx="16" fill="#dff5e8" stroke="#1f7a4d" strokeWidth="4" />
          {Array.from({ length: 5 }, (_, index) => (
            <rect key={index} x={-68 + index * 28} y="-152" width="18" height="42" rx="5" fill="#27ae60" opacity="0.58" />
          ))}
        </g>
        <g {...hotspot("stator")}>
          <circle cx="0" cy="26" r="72" fill="none" stroke="#27ae60" strokeWidth="18" opacity="0.38" />
          <circle cx="0" cy="26" r="38" fill="#27ae60" opacity="0.28" />
          <g transform={`rotate(${progress * 720})`}>
            <path d="M0-38L12 0L0 38L-12 0Z" fill="#145d3c" />
          </g>
        </g>
        <path d="M-166 24C-112 8-92 16-72 38" stroke="#27ae60" strokeWidth="7" strokeLinecap="round" strokeDasharray="10 12" />
      </g>
    </g>
  );
}

function RotaryDiagram({
  progress,
  stageColor,
  hotspot
}: {
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  const rotorAngle = progress * 1080;
  const eccentricX = Math.cos(progress * Math.PI * 2) * 18;
  const eccentricY = Math.sin(progress * Math.PI * 2) * 12;

  return (
    <g transform="translate(460 278)">
      <g {...hotspot("block")}>
        <path
          d="M-246 0C-246-116-144-168 0-124C144-168 246-116 246 0C246 116 144 168 0 124C-144 168-246 116-246 0Z"
          fill="#eee3d0"
          stroke="#1f2328"
          strokeWidth="5"
        />
        <path d="M-222-8C-188-30-160-38-120-40" stroke="#2f80ed" strokeWidth="10" strokeLinecap="round" markerEnd="url(#arrow-blue)" />
        <path d="M118 72C158 72 188 60 222 36" stroke="#8a8f98" strokeWidth="10" strokeLinecap="round" markerEnd="url(#arrow-gray)" />
      </g>
      <g {...hotspot("rotor")} transform={`translate(${eccentricX} ${eccentricY}) rotate(${rotorAngle})`}>
        <path d="M0-102C24-56 62 34 98 74C36 66-58 66-98 74C-68 20-24-60 0-102Z" fill="#f2c94c" stroke="#1f2328" strokeWidth="5" />
        <circle r="24" fill="#fffaf0" stroke="#1f2328" strokeWidth="5" />
      </g>
      <g {...hotspot("sparkPlug")}>
        <path d="M-28-154V-110M28-154V-110" stroke="#1f2328" strokeWidth="8" strokeLinecap="round" />
        <circle cx="-28" cy="-104" r="10" fill={stageColor} opacity="0.88" />
        <circle cx="28" cy="-104" r="10" fill={stageColor} opacity="0.88" />
      </g>
      <g {...hotspot("crankshaft")}>
        <circle r="36" fill="#23272f" opacity="0.9" />
        <circle r="12" fill={stageColor} />
      </g>
    </g>
  );
}

function ElectricDiagram({
  progress,
  stageColor,
  hotspot
}: {
  progress: number;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  const magneticAngle = progress * 1440;
  return (
    <g transform="translate(460 278)">
      <g {...hotspot("battery")}>
        <rect x="-384" y="-174" width="190" height="94" rx="18" fill="#e5f8ff" stroke="#217ca3" strokeWidth="4" />
        <path d="M-352-128H-226" stroke="#56ccf2" strokeWidth="12" strokeLinecap="round" />
        <path d="M-344-158H-244M-344-98H-244" stroke="#217ca3" strokeWidth="6" strokeLinecap="round" opacity="0.42" />
      </g>
      <path d="M-194-128C-120-128-84-68-72-8" stroke="#56ccf2" strokeWidth="8" strokeLinecap="round" strokeDasharray="14 14" />
      <g {...hotspot("stator")}>
        <circle r="144" fill="#eef7f7" stroke="#1f2328" strokeWidth="5" />
        <circle r="98" fill="#fffaf0" stroke="#1f2328" strokeWidth="4" />
        {Array.from({ length: 18 }, (_, index) => {
          const angle = (index / 18) * Math.PI * 2;
          const x = Math.cos(angle) * 121;
          const y = Math.sin(angle) * 121;
          const active = Math.sin(angle * 3 + progress * Math.PI * 8) > 0.35;
          return (
            <rect
              key={index}
              x={x - 12}
              y={y - 18}
              width="24"
              height="36"
              rx="8"
              fill={active ? stageColor : "#56ccf2"}
              opacity={active ? 0.9 : 0.38}
              transform={`rotate(${(angle * 180) / Math.PI} ${x} ${y})`}
            />
          );
        })}
      </g>
      <g {...hotspot("rotor")} transform={`rotate(${magneticAngle})`}>
        <circle r="62" fill="#1d1f25" />
        <path d="M0-58L18 0L0 58L-18 0Z" fill="#56ccf2" />
        <path d="M-58 0L0-18L58 0L0 18Z" fill="#bb6bd9" opacity="0.85" />
      </g>
      <g opacity="0.5" transform={`rotate(${magneticAngle * 0.42})`}>
        <circle r="178" fill="none" stroke={stageColor} strokeWidth="3" strokeDasharray="8 14" />
        <circle r="196" fill="none" stroke={stageColor} strokeWidth="2" strokeDasharray="5 18" />
      </g>
    </g>
  );
}

function PistonUnit({
  x,
  y,
  index,
  progress,
  phase,
  hotspot,
  diesel,
  compact
}: {
  x: number;
  y: number;
  index: number;
  progress: number;
  phase: number;
  hotspot: (id: ComponentId) => Record<string, unknown>;
  diesel?: boolean;
  compact?: boolean;
}) {
  const scale = compact ? 0.82 : 1;
  const travel = pistonTravel(progress * 2, phase);
  const pistonY = 92 + travel * 66;
  const crankY = 252;
  const crankAngle = progress * Math.PI * 4 + phase;
  const crankX = Math.cos(crankAngle) * 23;
  const crankPinY = crankY + Math.sin(crankAngle) * 23;
  const intakeLift = Math.max(0, Math.sin(progress * Math.PI * 8 + phase));
  const exhaustLift = Math.max(0, Math.sin(progress * Math.PI * 8 + phase + Math.PI));

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g {...hotspot("block")}>
        <rect x="-28" y="28" width="56" height="172" rx="13" fill="#fffaf0" stroke="#1f2328" strokeWidth="4" />
        <path d="M-28 54H28" stroke="#c8bdab" strokeWidth="3" />
      </g>
      <g {...hotspot("valves")}>
        <path d={`M-20 22V${40 + intakeLift * 14}`} stroke="#2f80ed" strokeWidth="7" strokeLinecap="round" />
        <path d={`M20 22V${40 + exhaustLift * 14}`} stroke="#8a8f98" strokeWidth="7" strokeLinecap="round" />
        <path d="M-38 18H-8M8 18H38" stroke="#1f2328" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g {...hotspot(diesel ? "injector" : "sparkPlug")}>
        <path d="M0-4V42" stroke="#1f2328" strokeWidth="5" strokeLinecap="round" />
        <circle cx="0" cy="46" r={diesel ? 8 : 6} fill={diesel ? "#6f7d8c" : "#eb5757"} />
      </g>
      <g {...hotspot("piston")} transform={`translate(0 ${pistonY})`}>
        <rect x="-34" y="-13" width="68" height="34" rx="8" fill="#d7dde5" stroke="#1f2328" strokeWidth="4" />
        <path d="M-28-3H28M-28 8H28" stroke="#6c7480" strokeWidth="3" />
      </g>
      <g {...hotspot("connectingRod")}>
        <line x1="0" y1={pistonY + 18} x2={crankX} y2={crankPinY} stroke="#6c7480" strokeWidth="9" strokeLinecap="round" />
        <circle cx={crankX} cy={crankPinY} r="8" fill="#1f2328" />
      </g>
      <text x="0" y="226" textAnchor="middle" className="diagram-label">
        {index + 1}
      </text>
    </g>
  );
}

function FlowSystem({
  engine,
  stageColor,
  hotspot
}: {
  engine?: EngineData;
  stageColor: string;
  hotspot: (id: ComponentId) => Record<string, unknown>;
}) {
  return (
    <g>
      <g {...hotspot("airflow")} opacity="0.92">
        <path d="M78 176C150 116 216 104 296 132" fill="none" stroke="#2f80ed" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 16" markerEnd="url(#arrow-blue)" />
        <text x="74" y="150" className="flow-label" fill="#2f80ed">
          air
        </text>
      </g>
      <g {...hotspot("exhaust")} opacity="0.86">
        <path d="M624 146C704 104 790 118 846 176" fill="none" stroke="#8a8f98" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 16" markerEnd="url(#arrow-gray)" />
        <text x="792" y="150" className="flow-label" fill="#6f7782">
          exhaust
        </text>
      </g>
      {engine?.modelKind === "diesel" ? (
        <g {...hotspot("fuel")}>
          <path d="M454 72C462 92 470 108 482 122" stroke="#6f7d8c" strokeWidth="5" strokeLinecap="round" strokeDasharray="4 8" />
          <circle cx="454" cy="72" r="8" fill="#6f7d8c" />
          <text x="484" y="78" className="flow-label" fill="#6f7d8c">
            fuel injection
          </text>
        </g>
      ) : null}
      <path d="M290 450C360 428 524 428 632 450" fill="none" stroke={stageColor} strokeWidth="5" strokeLinecap="round" opacity="0.44" />
    </g>
  );
}

function TurboOverlay({ progress, hotspot }: { progress: number; hotspot: (id: ComponentId) => Record<string, unknown> }) {
  const spin = progress * 1440;
  return (
    <g {...hotspot("turbo")} transform="translate(704 322)">
      <circle r="58" fill="#dce8f3" stroke="#1f2328" strokeWidth="5" />
      <circle r="34" fill="#fffaf0" stroke="#1f2328" strokeWidth="4" />
      <g transform={`rotate(${spin})`}>
        {Array.from({ length: 8 }, (_, index) => (
          <path key={index} d="M0 0C14-8 28-12 42-8C30 4 18 10 0 0Z" fill="#2d9cdb" opacity="0.72" transform={`rotate(${index * 45})`} />
        ))}
      </g>
      <path d="M-58-8C-116-28-140-70-104-110" fill="none" stroke="#8a8f98" strokeWidth="12" strokeLinecap="round" />
      <path d="M42 42C88 72 110 112 92 150" fill="none" stroke="#2f80ed" strokeWidth="12" strokeLinecap="round" />
      <text x="0" y="92" textAnchor="middle" className="diagram-label">
        turbo
      </text>
    </g>
  );
}

function SuperchargerOverlay({ progress, hotspot }: { progress: number; hotspot: (id: ComponentId) => Record<string, unknown> }) {
  const spin = progress * 900;
  return (
    <g {...hotspot("supercharger")} transform="translate(0 34)">
      <rect x="-116" y="-34" width="232" height="82" rx="24" fill="#eadff8" stroke="#1f2328" strokeWidth="5" />
      <g transform={`rotate(${spin} -44 8)`}>
        <path d="M-82 8C-72-28-16-28-6 8C-16 44-72 44-82 8Z" fill="#bb6bd9" opacity="0.75" />
      </g>
      <g transform={`rotate(${-spin} 44 8)`}>
        <path d="M6 8C16-28 72-28 82 8C72 44 16 44 6 8Z" fill="#8e44ad" opacity="0.75" />
      </g>
      <path d="M-150 8H-116M116 8H150" stroke="#2f80ed" strokeWidth="10" strokeLinecap="round" />
    </g>
  );
}

function StageOverlay({ stageColor, progress, engine }: { stageColor: string; progress: number; engine: EngineData }) {
  const pulse = 0.35 + Math.sin(progress * Math.PI * 8) * 0.18;
  return (
    <g pointerEvents="none">
      <rect x="46" y="492" width="828" height="14" rx="7" fill="#e3dacb" />
      <rect x="46" y="492" width={828 * progress} height="14" rx="7" fill={stageColor} opacity="0.88" />
      <circle cx={46 + 828 * progress} cy="499" r="16" fill={stageColor} opacity={pulse + 0.55} />
      <text x="56" y="530" className="flow-label" fill="#5f5a51">
        {engine.layout}
      </text>
    </g>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span>
      <i style={{ background: color }} />
      {label}
    </span>
  );
}
