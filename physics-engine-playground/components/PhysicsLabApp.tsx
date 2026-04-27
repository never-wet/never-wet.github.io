"use client";

import { ControlPanel } from "@/components/ControlPanel";
import { ExperimentSelector } from "@/components/ExperimentSelector";
import { PhysicsWorld } from "@/components/PhysicsWorld";
import { TopBar } from "@/components/TopBar";

export function PhysicsLabApp() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto bg-slate-950 text-slate-100 lg:h-screen lg:overflow-hidden">
      <TopBar />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_330px]">
        <ExperimentSelector />
        <PhysicsWorld />
        <ControlPanel />
      </div>
    </div>
  );
}
