"use client";

import { useEffect } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { TerrainViewport } from "@/components/TerrainViewport";
import { TopBar } from "@/components/TopBar";
import { useTerrainStore } from "@/store/useTerrainStore";
import { useTerrainWorker } from "./useTerrainWorker";

export function TerrainApp() {
  const hydratePresets = useTerrainStore((state) => state.hydratePresets);
  useTerrainWorker();

  useEffect(() => {
    hydratePresets();
  }, [hydratePresets]);

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace">
        <ControlPanel />
        <TerrainViewport />
      </div>
    </div>
  );
}
