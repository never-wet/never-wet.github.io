"use client";

import { ArrowUpRight, GitCompareArrows, Radar, Wind } from "lucide-react";
import type { VehicleProfile } from "@/data/vehicles";
import { padScore, systemStates } from "@/lib/timeline";
import { useVehicleStore } from "@/store/useVehicleStore";

type MetricPanelsProps = {
  vehicle: VehicleProfile;
};

export function MetricPanels({ vehicle }: MetricPanelsProps) {
  const phaseIndex = useVehicleStore((state) => state.phaseIndex);

  const jumpTo = (ratio: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * ratio, behavior: "smooth" });
  };

  return (
    <>
      <section className="identity-panel" data-scan-in aria-label="Vehicle identity">
        <span className="micro-label">VEHICLE ID / {vehicle.rank}</span>
        <h1>{vehicle.name}</h1>
        <p>{vehicle.identity}</p>
        <div className="identity-panel__classification">
          <span>CLASS</span>
          <strong>{vehicle.classCode}</strong>
        </div>
        <div className="score-lockup">
          <span>AERO RANK</span>
          <strong>{padScore(vehicle.score)}</strong>
        </div>
      </section>

      <aside className="metrics-panel" data-scan-in aria-label="Performance analysis">
        <div className="panel-heading">
          <span className="micro-label">PERFORMANCE PROFILE</span>
          <strong>{systemStates[phaseIndex].shortLabel}</strong>
        </div>
        <div className="metric-list">
          {vehicle.metrics.map((metric) => (
            <div className="metric-row" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <i style={{ transform: `scaleX(${metric.strength / 100})` }} />
            </div>
          ))}
        </div>
      </aside>

      <aside className="aero-panel" data-scan-in aria-label="Aerodynamic analysis">
        <div className="panel-heading">
          <span className="micro-label">AERODYNAMIC PROFILE</span>
          <strong>{vehicle.pressureStatus}</strong>
        </div>
        <div className="aero-panel__grid">
          {vehicle.aero.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        <div className="scan-progress">
          <span>SCAN PROGRESS</span>
          <i>
            <b />
          </i>
        </div>
      </aside>

      <section className={`command-panel ${phaseIndex >= 5 ? "is-visible" : ""}`}>
        <button type="button" data-cursor="MODEL" onClick={() => jumpTo(0.18)}>
          <ArrowUpRight size={16} />
          Explore Model
        </button>
        <button type="button" data-cursor="COMPARE" onClick={() => jumpTo(0.76)}>
          <GitCompareArrows size={16} />
          Compare Vehicles
        </button>
        <button type="button" data-cursor="TUNNEL" onClick={() => jumpTo(0.42)}>
          <Wind size={16} />
          Enter Wind Tunnel
        </button>
        <span>
          <Radar size={14} />
          {vehicle.wakeStatus}
        </span>
      </section>
    </>
  );
}
