"use client";

import { Box, Circle, Hexagon, Plus, Shapes } from "lucide-react";

import { PanelSection } from "@/components/ui/PanelSection";
import { usePlaygroundStore } from "@/physics/usePlaygroundStore";
import type { SpawnShape } from "@/physics/types";

const shapeOptions: Array<{ id: SpawnShape; label: string; icon: typeof Circle }> = [
  { id: "ball", label: "Ball", icon: Circle },
  { id: "box", label: "Box", icon: Box },
  { id: "capsule", label: "Capsule", icon: Hexagon },
  { id: "compound", label: "Compound", icon: Shapes }
];

export function ObjectSpawner() {
  const objectType = usePlaygroundStore((state) => state.objectType);
  const setObjectType = usePlaygroundStore((state) => state.setObjectType);
  const spawn = usePlaygroundStore((state) => state.spawn);

  return (
    <PanelSection title="Object Spawner">
      <div className="grid grid-cols-2 gap-2">
        {shapeOptions.map((shape) => {
          const Icon = shape.icon;
          const active = objectType === shape.id;
          return (
            <button
              key={shape.id}
              className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm transition ${
                active
                  ? "border-teal-300/70 bg-teal-300/18 text-teal-100"
                  : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
              type="button"
              onClick={() => setObjectType(shape.id)}
            >
              <Icon size={16} />
              <span>{shape.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-teal-300 px-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
        type="button"
        onClick={spawn}
      >
        <Plus size={17} />
        Spawn Body
      </button>
    </PanelSection>
  );
}
