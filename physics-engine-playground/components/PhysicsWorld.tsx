"use client";

import dynamic from "next/dynamic";

import MatterWorld2D from "@/experiments/matter/MatterWorld2D";
import { getExperiment } from "@/experiments/presets";
import { SceneRenderer } from "@/components/SceneRenderer";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";

const ThreeGravityWorld = dynamic(() => import("@/experiments/three/ThreeGravityWorld"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[520px] place-items-center bg-slate-950 text-sm text-slate-400">Loading 3D physics world...</div>
});

export function PhysicsWorld() {
  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const experiment = getExperiment(experimentId);

  return <SceneRenderer>{experiment.engine === "rapier3d" ? <ThreeGravityWorld /> : <MatterWorld2D />}</SceneRenderer>;
}
