"use client";

import { Crosshair, Gauge, Ruler, Scale3D, Search } from "lucide-react";
import { useMemo } from "react";
import { allExplorableObjects, getKindLabel, type MeasurementMode } from "../lib/measurementUtils";
import { useSpaceStore } from "../lib/useSpaceStore";

const measurementModes: Array<{ id: MeasurementMode; label: string }> = [
  { id: "visual", label: "Visual" },
  { id: "real", label: "Real" },
  { id: "distance", label: "Distance" },
];

export function SearchPanel() {
  const searchQuery = useSpaceStore((state) => state.searchQuery);
  const scaleMode = useSpaceStore((state) => state.scaleMode);
  const measurementMode = useSpaceStore((state) => state.measurementMode);
  const setSearchQuery = useSpaceStore((state) => state.setSearchQuery);
  const setScaleMode = useSpaceStore((state) => state.setScaleMode);
  const setMeasurementMode = useSpaceStore((state) => state.setMeasurementMode);
  const selectObject = useSpaceStore((state) => state.selectObject);

  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allExplorableObjects
      .filter((object) => `${object.name} ${getKindLabel(object)} ${object.classification}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  return (
    <header className="top-panel" aria-label="Space explorer search and scale controls">
      <div className="search-box">
        <Search size={17} />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder="Search planets, moons, belts, stars"
          aria-label="Search objects"
        />
        {results.length ? (
          <div className="search-results">
            {results.map((object) => (
              <button
                type="button"
                key={object.id}
                onClick={() => {
                  selectObject(object.id);
                  setSearchQuery("");
                }}
              >
                <span>{object.name}</span>
                <small>{getKindLabel(object)}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="segmented-control" aria-label="Scale mode">
        <button
          type="button"
          className={scaleMode === "real" ? "is-active" : ""}
          onClick={() => setScaleMode("real")}
        >
          <Scale3D size={16} />
          Real Scale
        </button>
        <button
          type="button"
          className={scaleMode === "compressed" ? "is-active" : ""}
          onClick={() => setScaleMode("compressed")}
        >
          <Gauge size={16} />
          Compressed View
        </button>
      </div>

      <div className="segmented-control segmented-control--compact" aria-label="Measurement mode">
        {measurementModes.map((mode) => (
          <button
            type="button"
            key={mode.id}
            className={measurementMode === mode.id ? "is-active" : ""}
            onClick={() => setMeasurementMode(mode.id)}
          >
            {mode.id === "distance" ? <Ruler size={15} /> : <Crosshair size={15} />}
            {mode.label}
          </button>
        ))}
      </div>
    </header>
  );
}
