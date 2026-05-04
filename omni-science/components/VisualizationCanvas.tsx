import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { Concept } from "../data/scienceDatabase";
import GravitySimulation from "./visuals/GravitySimulation";
import EntropyLab from "./visuals/EntropyLab";

interface VisualizationCanvasProps {
  concept: Concept;
}

export default function VisualizationCanvas({ concept }: VisualizationCanvasProps) {
  const renderVisual = () => {
    switch (concept.slug) {
      case "gravity":
        return <GravitySimulation />;
      case "entropy":
        return <EntropyLab />;
      default:
        return (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#3b82f6" wireframe />
          </mesh>
        );
    }
  };

  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[5, 5, 10]} />
          <OrbitControls enablePan={false} maxDistance={20} minDistance={5} />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {renderVisual()}
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
        Interactive 3D Engine
      </div>
    </div>
  );
}
