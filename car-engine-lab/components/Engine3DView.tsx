"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ComponentId, EngineData } from "@/data/engineData";
import type { ViewSettings } from "@/components/EngineLab";
import { getCylinderPhase, pistonTravel } from "@/lib/EngineAnimationController";

type Vec3 = [number, number, number];

export function Engine3DView({
  engine,
  progress,
  playing,
  settings,
  selectedComponent,
  onComponentSelect
}: {
  engine: EngineData;
  progress: number;
  playing: boolean;
  settings: ViewSettings;
  selectedComponent: ComponentId | null;
  onComponentSelect: (id: ComponentId) => void;
}) {
  return (
    <div className="three-shell">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [5.4, 3.4, 6.2], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#fffaf0"]} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.72} />
          <directionalLight position={[6, 7, 4]} intensity={2.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <pointLight position={[-4, 2, -3]} intensity={2.2} color="#56ccf2" />
          <pointLight position={[3, 1, 4]} intensity={1.8} color={engine.color} />
          <ProceduralEngineModel
            engine={engine}
            progress={progress}
            playing={playing}
            settings={settings}
            selectedComponent={selectedComponent}
            onComponentSelect={onComponentSelect}
          />
          <GroundGrid />
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.08} minDistance={3.2} maxDistance={10.5} target={[0, 0.15, 0]} />
      </Canvas>

      <div className="three-hud">
        <span>{settings.cutaway ? "Cutaway" : "Closed block"}</span>
        <span>{settings.exploded ? "Exploded" : "Assembled"}</span>
        <span>{playing ? "Animating" : "Paused"}</span>
      </div>
    </div>
  );
}

function ProceduralEngineModel({
  engine,
  progress,
  settings,
  selectedComponent,
  onComponentSelect
}: {
  engine: EngineData;
  progress: number;
  playing: boolean;
  settings: ViewSettings;
  selectedComponent: ComponentId | null;
  onComponentSelect: (id: ComponentId) => void;
}) {
  if (engine.modelKind === "electric") {
    return <ElectricMotorModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
  }

  if (engine.modelKind === "rotary") {
    return <RotaryModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
  }

  if (engine.modelKind === "boxer") {
    return <BoxerModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
  }

  if (engine.modelKind === "hybrid") {
    return <HybridModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
  }

  if (engine.modelKind === "v" || engine.modelKind === "supercharged") {
    return <VEngineModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
  }

  return <InlineEngineModel engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />;
}

function InlineEngineModel({
  engine,
  progress,
  settings,
  selectedComponent,
  onComponentSelect
}: ModelProps) {
  const count = Math.min(engine.cylinders, 6);
  return (
    <group rotation={[0, -0.35, 0]}>
      <CylinderBank
        engine={engine}
        count={count}
        progress={progress}
        settings={settings}
        selectedComponent={selectedComponent}
        onComponentSelect={onComponentSelect}
        position={[0, 0, 0]}
      />
      {engine.modelKind === "turbocharged" ? (
        <TurboAssembly progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[2.3, 0.45, 0.72]} />
      ) : null}
      {settings.showFlow ? <FlowDots color={engine.color} points={[[-3, 1.15, 0.9], [-1.4, 1.04, 0.58], [0.4, 1.0, 0.54], [2.8, 0.6, 0.9]]} progress={progress} /> : null}
    </group>
  );
}

function VEngineModel({ engine, progress, settings, selectedComponent, onComponentSelect }: ModelProps) {
  const perBank = Math.ceil(engine.cylinders / 2);
  const explode = settings.exploded ? 0.55 : 0;
  return (
    <group rotation={[0, -0.45, 0]}>
      <CylinderBank
        engine={engine}
        count={perBank}
        progress={progress}
        settings={settings}
        selectedComponent={selectedComponent}
        onComponentSelect={onComponentSelect}
        rotation={[0, 0, -0.38]}
        position={[-0.62 - explode, 0.12, 0]}
        phaseOffset={0}
      />
      <CylinderBank
        engine={engine}
        count={perBank}
        progress={progress}
        settings={settings}
        selectedComponent={selectedComponent}
        onComponentSelect={onComponentSelect}
        rotation={[0, 0, 0.38]}
        position={[0.62 + explode, 0.12, 0]}
        phaseOffset={perBank}
      />
      <Crankshaft length={Math.max(2.4, perBank * 0.64 + 0.8)} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[0, -0.9, 0]} />
      {engine.modelKind === "supercharged" ? (
        <SuperchargerAssembly progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[0, 1.45 + explode, 0]} />
      ) : null}
      {settings.showFlow ? <FlowDots color={engine.color} points={[[-2.8, 1.35, 0.9], [-0.8, 1.1, 0.42], [0.8, 1.1, 0.42], [2.8, 0.7, 0.9]]} progress={progress} /> : null}
    </group>
  );
}

function BoxerModel({ engine, progress, settings, selectedComponent, onComponentSelect }: ModelProps) {
  const explode = settings.exploded ? 0.7 : 0;
  return (
    <group rotation={[0.08, -0.35, 0]}>
      <CylinderBank
        engine={engine}
        count={2}
        progress={progress}
        settings={settings}
        selectedComponent={selectedComponent}
        onComponentSelect={onComponentSelect}
        rotation={[0, 0, Math.PI / 2]}
        position={[-1.05 - explode, 0, 0]}
        phaseOffset={0}
      />
      <CylinderBank
        engine={engine}
        count={2}
        progress={progress}
        settings={settings}
        selectedComponent={selectedComponent}
        onComponentSelect={onComponentSelect}
        rotation={[0, 0, -Math.PI / 2]}
        position={[1.05 + explode, 0, 0]}
        phaseOffset={2}
      />
      <Crankshaft length={1.8} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[0, -0.88, 0]} />
      {settings.showFlow ? <FlowDots color={engine.color} points={[[-3, 0.62, 0.6], [-1.1, 0.52, 0.45], [1.1, 0.52, 0.45], [3, 0.62, 0.6]]} progress={progress} /> : null}
    </group>
  );
}

function HybridModel({ engine, progress, settings, selectedComponent, onComponentSelect }: ModelProps) {
  const explode = settings.exploded ? 0.72 : 0;
  return (
    <group rotation={[0, -0.42, 0]}>
      <group position={[-1.4 - explode, 0, 0]}>
        <CylinderBank engine={engine} count={4} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />
      </group>
      <group position={[1.45 + explode, 0.06, 0]}>
        <ElectricMotorCore engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} compact />
      </group>
      <BatteryPack settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[0, -1.28 - explode * 0.4, 1.15 + explode]} />
      {settings.showFlow ? <FlowDots color="#27ae60" points={[[-2.8, 0.9, 0.8], [-1.1, 0.72, 0.52], [0.4, 0.4, 0.72], [1.8, 0.38, 0.7]]} progress={progress} /> : null}
    </group>
  );
}

function RotaryModel({ engine, progress, settings, selectedComponent, onComponentSelect }: ModelProps) {
  const chamberShape = useMemo(() => createRotaryHousingShape(), []);
  const rotorShape = useMemo(() => createRotorShape(), []);
  const material = materialFactory(settings, selectedComponent);
  const rotorAngle = progress * Math.PI * 6;
  const offset: Vec3 = [Math.cos(progress * Math.PI * 2) * 0.16, Math.sin(progress * Math.PI * 2) * 0.11, settings.exploded ? 0.34 : 0];

  return (
    <group rotation={[0.15, -0.45, 0]}>
      <PartGroup id="block" onComponentSelect={onComponentSelect}>
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[chamberShape, { depth: 0.72, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05, steps: 1 }]} />
          <meshStandardMaterial {...material("block", "#d8ccb9", 0.28)} />
        </mesh>
      </PartGroup>
      <PartGroup id="rotor" onComponentSelect={onComponentSelect} position={offset} rotation={[0, 0, rotorAngle]}>
        <mesh castShadow>
          <extrudeGeometry args={[rotorShape, { depth: 0.82, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, steps: 1 }]} />
          <meshStandardMaterial {...material("rotor", engine.color, 0.68)} />
        </mesh>
        <mesh position={[0, 0, 0.46]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 48]} />
          <meshStandardMaterial {...material("crankshaft", "#2a2d34", 0.88)} />
        </mesh>
      </PartGroup>
      <PartGroup id="sparkPlug" onComponentSelect={onComponentSelect} position={[0, 1.26, 0.48]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 18]} />
          <meshStandardMaterial {...material("sparkPlug", "#eb5757", 0.4)} />
        </mesh>
        <mesh position={[0, -0.34, 0]}>
          <sphereGeometry args={[0.1, 24, 16]} />
          <meshStandardMaterial color="#fff0a8" emissive={engine.color} emissiveIntensity={1.2} />
        </mesh>
      </PartGroup>
      <PartGroup id="crankshaft" onComponentSelect={onComponentSelect} position={[0, 0, 0.86]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 1.1, 40]} />
          <meshStandardMaterial {...material("crankshaft", "#20242a", 0.86)} />
        </mesh>
      </PartGroup>
      {settings.showFlow ? <FlowDots color={engine.color} points={[[-1.9, 0.24, 0.74], [-0.92, 0.74, 0.82], [0.86, -0.62, 0.82], [1.9, -0.28, 0.74]]} progress={progress} /> : null}
    </group>
  );
}

function ElectricMotorModel({ engine, progress, settings, selectedComponent, onComponentSelect }: ModelProps) {
  return (
    <group rotation={[0.18, -0.45, 0]}>
      <ElectricMotorCore engine={engine} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} />
      <BatteryPack settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[-2.4, -0.98, 0.9]} />
      {settings.showFlow ? <FlowDots color={engine.color} points={[[-2.3, -0.55, 0.9], [-1.3, 0.1, 0.62], [-0.32, 0.18, 0.56], [1.7, 0.16, 0.62]]} progress={progress} /> : null}
    </group>
  );
}

function ElectricMotorCore({ engine, progress, settings, selectedComponent, onComponentSelect, compact }: ModelProps & { compact?: boolean }) {
  const material = materialFactory(settings, selectedComponent);
  const radius = compact ? 0.86 : 1.26;
  const rotorAngle = progress * Math.PI * 8;
  const explode = settings.exploded ? 0.38 : 0;

  return (
    <group scale={compact ? 0.86 : 1}>
      <PartGroup id="stator" onComponentSelect={onComponentSelect} position={[0, 0, -explode]}>
        <mesh castShadow receiveShadow>
          <torusGeometry args={[radius, 0.13, 24, 96]} />
          <meshStandardMaterial {...material("stator", "#56ccf2", 0.45)} />
        </mesh>
        {Array.from({ length: 18 }, (_, index) => {
          const angle = (index / 18) * Math.PI * 2;
          const active = Math.sin(angle * 3 + progress * Math.PI * 8) > 0.32;
          return (
            <mesh key={index} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle]} castShadow>
              <boxGeometry args={[0.14, 0.34, 0.22]} />
              <meshStandardMaterial {...material("stator", active ? engine.color : "#4ca8c5", active ? 0.5 : 0.35)} emissive={active ? engine.color : "#000000"} emissiveIntensity={active ? 0.7 : 0} />
            </mesh>
          );
        })}
      </PartGroup>
      <PartGroup id="rotor" onComponentSelect={onComponentSelect} position={[0, 0, explode]} rotation={[0, 0, rotorAngle]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.72, 64]} />
          <meshStandardMaterial {...material("rotor", "#22262d", 0.86)} />
        </mesh>
        {Array.from({ length: 6 }, (_, index) => (
          <RoundedBox key={index} args={[0.16, 0.48, 0.12]} radius={0.035} position={[Math.cos((index / 6) * Math.PI * 2) * 0.38, Math.sin((index / 6) * Math.PI * 2) * 0.38, 0.42]} rotation={[0, 0, (index / 6) * Math.PI * 2]}>
            <meshStandardMaterial {...material("rotor", index % 2 ? "#bb6bd9" : engine.color, 0.5)} />
          </RoundedBox>
        ))}
      </PartGroup>
      <PartGroup id="crankshaft" onComponentSelect={onComponentSelect} position={[0, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 3.1, 48]} />
          <meshStandardMaterial {...material("crankshaft", "#252932", 0.88)} />
        </mesh>
      </PartGroup>
    </group>
  );
}

function CylinderBank({
  engine,
  count,
  progress,
  settings,
  selectedComponent,
  onComponentSelect,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  phaseOffset = 0
}: ModelProps & { count: number; position?: Vec3; rotation?: Vec3; phaseOffset?: number }) {
  const material = materialFactory(settings, selectedComponent);
  const length = Math.max(2.35, count * 0.58 + 0.72);
  const spacing = count > 1 ? Math.min(0.72, length / count) : 0;
  const firstX = -((count - 1) * spacing) / 2;
  const explode = settings.exploded ? 0.28 : 0;

  return (
    <group position={position} rotation={rotation}>
      <PartGroup id="block" onComponentSelect={onComponentSelect} position={[0, explode * 0.35, 0]}>
        <RoundedBox args={[length + 0.38, 1.86, 1.12]} radius={0.16} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial {...material("block", "#d7ccba", settings.cutaway ? 0.18 : 0.32)} />
        </RoundedBox>
        {settings.cutaway ? (
          <mesh position={[0, 0.04, 0.59]} receiveShadow>
            <planeGeometry args={[length + 0.1, 1.54]} />
            <meshStandardMaterial color="#fff3d9" transparent opacity={0.22} side={THREE.DoubleSide} />
          </mesh>
        ) : null}
      </PartGroup>

      <Crankshaft length={length + 0.24} progress={progress} settings={settings} selectedComponent={selectedComponent} onComponentSelect={onComponentSelect} position={[0, -0.78 - explode, 0]} />

      {Array.from({ length: count }, (_, index) => {
        const cylinderIndex = index + phaseOffset;
        const phase = getCylinderPhase(cylinderIndex, Math.max(engine.cylinders, count));
        const travel = pistonTravel(progress * 2, phase);
        const pistonY = 0.58 - travel * 0.7 + explode;
        const x = firstX + index * spacing;
        const pinY = -0.78 + Math.sin(progress * Math.PI * 4 + phase) * 0.15;
        const pinZ = Math.cos(progress * Math.PI * 4 + phase) * 0.15;

        return (
          <group key={index}>
            <PartGroup id="block" onComponentSelect={onComponentSelect} position={[x, 0.28, 0]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.24, 0.24, 1.25, 42, 1, true]} />
                <meshStandardMaterial {...material("block", "#efe5d2", settings.cutaway ? 0.2 : 0.46)} side={THREE.DoubleSide} />
              </mesh>
            </PartGroup>
            <PartGroup id="piston" onComponentSelect={onComponentSelect} position={[x, pistonY, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.24, 48]} />
                <meshStandardMaterial {...material("piston", "#cdd5df", 0.66)} />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <torusGeometry args={[0.22, 0.012, 8, 42]} />
                <meshStandardMaterial {...material("piston", "#6f7782", 0.6)} />
              </mesh>
            </PartGroup>
            <PartGroup id="connectingRod" onComponentSelect={onComponentSelect}>
              <Rod start={[x, pistonY - 0.18, 0]} end={[x, pinY, pinZ]} materialProps={material("connectingRod", "#7b838d", 0.74)} />
            </PartGroup>
            <ValvePair
              x={x}
              progress={progress}
              phase={phase}
              settings={settings}
              onComponentSelect={onComponentSelect}
              material={material}
              diesel={engine.modelKind === "diesel"}
            />
          </group>
        );
      })}
    </group>
  );
}

function ValvePair({
  x,
  progress,
  phase,
  settings,
  onComponentSelect,
  material,
  diesel
}: {
  x: number;
  progress: number;
  phase: number;
  settings: ViewSettings;
  onComponentSelect: (id: ComponentId) => void;
  material: ReturnType<typeof materialFactory>;
  diesel?: boolean;
}) {
  const intakeLift = Math.max(0, Math.sin(progress * Math.PI * 8 + phase)) * 0.14;
  const exhaustLift = Math.max(0, Math.sin(progress * Math.PI * 8 + phase + Math.PI)) * 0.14;
  const ignite = Math.max(0, Math.sin(progress * Math.PI * 8 + phase + Math.PI * 0.25));

  return (
    <group>
      <PartGroup id="valves" onComponentSelect={onComponentSelect}>
        <mesh position={[x - 0.11, 1.17 - intakeLift, 0.12]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.42, 18]} />
          <meshStandardMaterial {...material("valves", "#2f80ed", 0.5)} />
        </mesh>
        <mesh position={[x + 0.11, 1.17 - exhaustLift, 0.12]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.42, 18]} />
          <meshStandardMaterial {...material("valves", "#8a8f98", 0.5)} />
        </mesh>
      </PartGroup>
      <PartGroup id={diesel ? "injector" : "sparkPlug"} onComponentSelect={onComponentSelect} position={[x, 1.28, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.36, 18]} />
          <meshStandardMaterial {...material(diesel ? "injector" : "sparkPlug", diesel ? "#6f7d8c" : "#eb5757", 0.48)} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.06, 20, 12]} />
          <meshStandardMaterial color={diesel ? "#d7dde5" : "#fff0a8"} emissive={diesel ? "#6f7d8c" : "#eb5757"} emissiveIntensity={ignite * 1.4} transparent opacity={settings.xray ? 0.72 : 1} />
        </mesh>
      </PartGroup>
    </group>
  );
}

function Crankshaft({ length, progress, settings, selectedComponent, onComponentSelect, position }: Omit<ModelProps, "engine"> & { length: number; position: Vec3 }) {
  const material = materialFactory(settings, selectedComponent);
  const throwCount = Math.max(3, Math.floor(length / 0.5));

  return (
    <PartGroup id="crankshaft" onComponentSelect={onComponentSelect} position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, length, 48]} />
        <meshStandardMaterial {...material("crankshaft", "#252932", 0.88)} />
      </mesh>
      <group rotation={[progress * Math.PI * 4, 0, 0]}>
        {Array.from({ length: throwCount }, (_, index) => {
          const x = -length / 2 + (index / Math.max(1, throwCount - 1)) * length;
          return (
            <mesh key={index} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.025, 10, 32]} />
              <meshStandardMaterial {...material("crankshaft", index % 2 ? "#454c57" : "#2d333d", 0.9)} />
            </mesh>
          );
        })}
      </group>
    </PartGroup>
  );
}

function TurboAssembly({ progress, settings, selectedComponent, onComponentSelect, position }: Omit<ModelProps, "engine"> & { position: Vec3 }) {
  const material = materialFactory(settings, selectedComponent);
  const spin = progress * Math.PI * 18;
  return (
    <PartGroup id="turbo" onComponentSelect={onComponentSelect} position={position}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.38, 0.09, 20, 64]} />
        <meshStandardMaterial {...material("turbo", "#9eb4c7", 0.72)} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, spin]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 48]} />
        <meshStandardMaterial {...material("turbo", "#2d9cdb", 0.64)} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} rotation={[0, Math.PI / 2, spin + index * 0.785]} position={[0, 0, 0.02]}>
          <boxGeometry args={[0.04, 0.42, 0.08]} />
          <meshStandardMaterial {...material("turbo", "#2d9cdb", 0.48)} />
        </mesh>
      ))}
      <mesh position={[-0.54, -0.26, 0]} rotation={[0.64, 0, 0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 1.1, 24]} />
        <meshStandardMaterial {...material("exhaust", "#8a8f98", 0.5)} />
      </mesh>
    </PartGroup>
  );
}

function SuperchargerAssembly({ progress, settings, selectedComponent, onComponentSelect, position }: Omit<ModelProps, "engine"> & { position: Vec3 }) {
  const material = materialFactory(settings, selectedComponent);
  const spin = progress * Math.PI * 10;
  return (
    <PartGroup id="supercharger" onComponentSelect={onComponentSelect} position={position}>
      <RoundedBox args={[1.82, 0.58, 0.72]} radius={0.16} smoothness={8} castShadow>
        <meshStandardMaterial {...material("supercharger", "#d9c4ec", 0.46)} />
      </RoundedBox>
      {[-0.34, 0.34].map((x, index) => (
        <group key={x} rotation={[spin * (index ? -1 : 1), 0, 0]} position={[x, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 1.0, 32]} />
            <meshStandardMaterial {...material("supercharger", index ? "#8e44ad" : "#bb6bd9", 0.58)} />
          </mesh>
          {Array.from({ length: 5 }, (_, blade) => (
            <mesh key={blade} rotation={[0, 0, blade * 1.256]} position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.34, 0.88]} />
              <meshStandardMaterial {...material("supercharger", index ? "#8e44ad" : "#bb6bd9", 0.48)} />
            </mesh>
          ))}
        </group>
      ))}
    </PartGroup>
  );
}

function BatteryPack({ settings, selectedComponent, onComponentSelect, position }: { settings: ViewSettings; selectedComponent: ComponentId | null; onComponentSelect: (id: ComponentId) => void; position: Vec3 }) {
  const material = materialFactory(settings, selectedComponent);
  return (
    <PartGroup id="battery" onComponentSelect={onComponentSelect} position={position}>
      <RoundedBox args={[1.7, 0.32, 0.9]} radius={0.12} smoothness={8} castShadow receiveShadow>
        <meshStandardMaterial {...material("battery", "#dff5e8", 0.32)} />
      </RoundedBox>
      {Array.from({ length: 5 }, (_, index) => (
        <RoundedBox key={index} args={[0.22, 0.18, 0.64]} radius={0.04} position={[-0.58 + index * 0.29, 0.22, 0]} castShadow>
          <meshStandardMaterial {...material("battery", "#27ae60", 0.44)} emissive="#0c4f31" emissiveIntensity={0.2} />
        </RoundedBox>
      ))}
    </PartGroup>
  );
}

function Rod({ start, end, materialProps }: { start: Vec3; end: Vec3; materialProps: THREE.MeshStandardMaterialParameters }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);
    const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return { position: midpoint, quaternion: quat, length: direction.length() };
  }, [start, end]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[0.045, 0.045, length, 18]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

function FlowDots({ color, points, progress }: { color: string; points: Vec3[]; progress: number }) {
  return (
    <group>
      {points.map((point, index) => (
        <mesh key={`${point.join("-")}-${index}`} position={point}>
          <sphereGeometry args={[0.055 + ((index + progress * 10) % 1) * 0.035, 16, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.42 + Math.sin(progress * Math.PI * 6 + index) * 0.24} />
        </mesh>
      ))}
      <LineTube points={points} color={color} />
    </group>
  );
}

function LineTube({ points, color }: { points: Vec3[]; color: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.018, 8, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={0.28} />
    </mesh>
  );
}

function PartGroup({
  id,
  onComponentSelect,
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}: {
  id: ComponentId;
  onComponentSelect: (id: ComponentId) => void;
  children: React.ReactNode;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
}) {
  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        onComponentSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.classList.add("is-hovering-part");
      }}
      onPointerOut={() => document.body.classList.remove("is-hovering-part")}
    >
      {children}
    </group>
  );
}

function GroundGrid() {
  return (
    <group position={[0, -1.55, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <gridHelper args={[8, 16, "#d0c7b7", "#e7dece"]} />
    </group>
  );
}

function materialFactory(settings: ViewSettings, selectedComponent: ComponentId | null) {
  return (id: ComponentId, color: string, opacity = 1): THREE.MeshStandardMaterialParameters => {
    const faded = settings.isolate && selectedComponent && selectedComponent !== id;
    const active = selectedComponent === id;
    const transparent = settings.transparent || settings.xray || faded || opacity < 1;

    return {
      color: settings.xray ? "#8fdcff" : active ? "#fff1a6" : color,
      roughness: settings.xray ? 0.18 : 0.42,
      metalness: settings.xray ? 0.15 : 0.48,
      transparent,
      opacity: faded ? 0.08 : settings.xray ? 0.3 : settings.transparent ? Math.min(opacity, 0.52) : opacity,
      emissive: active ? "#f2c94c" : settings.xray ? "#1d6f95" : "#000000",
      emissiveIntensity: active ? 0.35 : settings.xray ? 0.18 : 0
    };
  };
}

function createRotaryHousingShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.82, 0);
  shape.bezierCurveTo(-1.82, -0.9, -0.96, -1.22, 0, -0.9);
  shape.bezierCurveTo(0.96, -1.22, 1.82, -0.9, 1.82, 0);
  shape.bezierCurveTo(1.82, 0.9, 0.96, 1.22, 0, 0.9);
  shape.bezierCurveTo(-0.96, 1.22, -1.82, 0.9, -1.82, 0);
  return shape;
}

function createRotorShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.82);
  shape.quadraticCurveTo(0.52, 0.2, 0.92, -0.6);
  shape.quadraticCurveTo(0, -0.38, -0.92, -0.6);
  shape.quadraticCurveTo(-0.52, 0.2, 0, 0.82);
  return shape;
}

interface ModelProps {
  engine: EngineData;
  progress: number;
  playing?: boolean;
  settings: ViewSettings;
  selectedComponent: ComponentId | null;
  onComponentSelect: (id: ComponentId) => void;
}
