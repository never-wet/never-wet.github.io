"use client";

import { Dice5, FileJson, Home, ImageDown, RotateCcw, Save, ShipWheel, Workflow } from "lucide-react";
import { exportHeightmapPNG, exportParametersJSON } from "@/lib/exporters";
import { useTerrainStore } from "@/store/useTerrainStore";

export function TopBar() {
  const parameters = useTerrainStore((state) => state.parameters);
  const terrain = useTerrainStore((state) => state.terrain);
  const status = useTerrainStore((state) => state.status);
  const randomizeSeed = useTerrainStore((state) => state.randomizeSeed);
  const resetParameters = useTerrainStore((state) => state.resetParameters);
  const savePreset = useTerrainStore((state) => state.savePreset);
  const requestCameraReset = useTerrainStore((state) => state.requestCameraReset);

  const statusLabel =
    status === "eroding" ? "Eroding" : status === "generating" ? "Generating" : status === "error" ? "Error" : "Ready";

  return (
    <header className="topbar">
      <div className="brand-block">
        <a className="icon-button" href="../../" title="Homepage" aria-label="Homepage">
          <Home size={17} />
        </a>
        <div className="brand-mark">TG</div>
        <div className="brand-copy">
          <div className="eyebrow">Procedural Terrain Tool</div>
          <h1>Terrain Generator</h1>
        </div>
      </div>

      <div className="toolbar" aria-label="Terrain actions">
        <span className="text-button" aria-live="polite">
          <Workflow size={15} />
          {statusLabel}
        </span>
        <button className="icon-button" type="button" title="Randomize seed" onClick={randomizeSeed}>
          <Dice5 size={17} />
        </button>
        <button className="icon-button" type="button" title="Reset terrain" onClick={resetParameters}>
          <RotateCcw size={17} />
        </button>
        <button className="icon-button" type="button" title="Save preset" onClick={savePreset}>
          <Save size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Export heightmap"
          disabled={!terrain}
          onClick={() => terrain && exportHeightmapPNG(terrain)}
        >
          <ImageDown size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Export parameters"
          onClick={() => exportParametersJSON(parameters, terrain)}
        >
          <FileJson size={17} />
        </button>
        <button className="text-button primary" type="button" title="Reset orbit camera" onClick={requestCameraReset}>
          <ShipWheel size={15} />
          Orbit
        </button>
      </div>
    </header>
  );
}
