import type { EngineData, EngineStage, SpeedMode } from "@/data/engineData";

const TAU = Math.PI * 2;

export const speedMultipliers: Record<SpeedMode, number> = {
  slow: 0.18,
  normal: 0.48,
  fast: 1.12
};

export interface PistonKinematics {
  phase: number;
  travel: number;
  velocity: number;
}

export interface EngineKinematics {
  crankAngle: number;
  pistons: PistonKinematics[];
  intakeValve: number;
  exhaustValve: number;
  spark: number;
  injectorPulse: number;
  rotorAngle: number;
  magneticAngle: number;
  torque: number;
}

export function wrapProgress(value: number) {
  return ((value % 1) + 1) % 1;
}

export function getCurrentStage(engine: EngineData, progress: number): EngineStage {
  const wrapped = wrapProgress(progress);
  const index = Math.min(engine.cycleStages.length - 1, Math.floor(wrapped * engine.cycleStages.length));
  return engine.cycleStages[index];
}

export function getStageProgress(progress: number, stageCount = 4) {
  const wrapped = wrapProgress(progress);
  return (wrapped * stageCount) % 1;
}

export function getCylinderPhase(index: number, cylinders: number) {
  if (cylinders <= 1) return 0;
  return (index / cylinders) * TAU;
}

export function pistonTravel(progress: number, phase = 0) {
  const angle = wrapProgress(progress) * TAU + phase;
  return (1 - Math.cos(angle)) / 2;
}

export function pistonVelocity(progress: number, phase = 0) {
  const angle = wrapProgress(progress) * TAU + phase;
  return Math.sin(angle);
}

export function getValveLift(progress: number, valve: "intake" | "exhaust") {
  const wrapped = wrapProgress(progress);
  const stage = Math.floor(wrapped * 4);
  const local = getStageProgress(wrapped);

  if (valve === "intake" && stage === 0) {
    return Math.sin(local * Math.PI);
  }

  if (valve === "exhaust" && stage === 3) {
    return Math.sin(local * Math.PI);
  }

  return 0;
}

export function getSparkIntensity(engine: EngineData, progress: number) {
  if (engine.modelKind === "diesel" || engine.modelKind === "electric") return 0;
  const wrapped = wrapProgress(progress);
  const local = getStageProgress(wrapped);
  const stage = Math.floor(wrapped * 4);
  if (stage !== 2) return 0;
  return Math.max(0, 1 - Math.abs(local - 0.12) * 9);
}

export function getInjectorPulse(engine: EngineData, progress: number) {
  const wrapped = wrapProgress(progress);
  const local = getStageProgress(wrapped);
  const stage = Math.floor(wrapped * 4);
  if (engine.modelKind === "diesel") {
    return stage === 2 ? Math.max(0, 1 - Math.abs(local - 0.08) * 8) : 0;
  }
  return stage === 0 ? Math.sin(local * Math.PI) * 0.7 : 0;
}

export function getTorqueAtProgress(engine: EngineData, progress: number) {
  const wrapped = wrapProgress(progress);
  const stage = Math.floor(wrapped * 4);
  const pulse = Math.max(0, Math.sin(getStageProgress(wrapped) * Math.PI));
  const profile =
    wrapped < 0.34 ? engine.torqueProfile.low : wrapped < 0.68 ? engine.torqueProfile.mid : engine.torqueProfile.high;

  if (engine.modelKind === "electric") {
    return 0.72 + Math.sin(wrapped * TAU * 3) * 0.04;
  }

  if (engine.modelKind === "rotary") {
    return 0.38 + pulse * 0.42 + engine.torqueProfile.high / 300;
  }

  return Math.min(1, (stage === 2 ? 0.52 + pulse * 0.42 : 0.16 + pulse * 0.12) * (profile / 75));
}

export function getEngineKinematics(engine: EngineData, progress: number): EngineKinematics {
  const wrapped = wrapProgress(progress);
  const crankAngle = wrapped * TAU * 2;
  const pistonCount = Math.max(engine.cylinders || 1, engine.modelKind === "electric" ? 1 : 1);
  const pistons = Array.from({ length: pistonCount }, (_, index) => {
    const phase = getCylinderPhase(index, pistonCount);
    return {
      phase,
      travel: pistonTravel(wrapped * 2, phase),
      velocity: pistonVelocity(wrapped * 2, phase)
    };
  });

  return {
    crankAngle,
    pistons,
    intakeValve: getValveLift(wrapped, "intake"),
    exhaustValve: getValveLift(wrapped, "exhaust"),
    spark: getSparkIntensity(engine, wrapped),
    injectorPulse: getInjectorPulse(engine, wrapped),
    rotorAngle: wrapped * TAU * 3,
    magneticAngle: wrapped * TAU * 4,
    torque: getTorqueAtProgress(engine, wrapped)
  };
}
