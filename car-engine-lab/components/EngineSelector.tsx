"use client";

import { BatteryCharging, Flame, Gauge, Zap } from "lucide-react";
import { engineGroups, engines, type EngineId } from "@/data/engineData";

export function EngineSelector({
  selectedId,
  onSelect
}: {
  selectedId: EngineId;
  onSelect: (id: EngineId) => void;
}) {
  return (
    <aside className="engine-selector" aria-label="Engine selector">
      <div className="panel-title">
        <span>01</span>
        <h2>Engine Types</h2>
      </div>

      {Object.entries(engineGroups).map(([groupName, ids]) => (
        <div className="selector-group" key={groupName}>
          <p>{groupName}</p>
          <div className="engine-list">
            {ids.map((id) => {
              const engine = engines[id];
              const Icon = getEngineIcon(id);
              return (
                <button
                  key={id}
                  className={selectedId === id ? "engine-option is-active" : "engine-option"}
                  onClick={() => onSelect(id)}
                  type="button"
                  style={{ "--engine-color": engine.color } as React.CSSProperties}
                >
                  <span className="engine-option__icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{engine.shortName}</strong>
                    <small>{engine.type}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function getEngineIcon(id: EngineId) {
  if (id === "electric") return Zap;
  if (id === "hybrid") return BatteryCharging;
  if (id === "turbocharged" || id === "supercharged") return Gauge;
  return Flame;
}
