"use client";

import { Gauge, Radar, ScanLine } from "lucide-react";
import type { VehicleProfile } from "@/data/vehicles";
import { systemStates } from "@/lib/timeline";
import { useVehicleStore } from "@/store/useVehicleStore";

type SystemChromeProps = {
  vehicle: VehicleProfile;
  phase: (typeof systemStates)[number];
};

export function SystemChrome({ vehicle, phase }: SystemChromeProps) {
  const progress = useVehicleStore((state) => state.progress);
  const phaseIndex = useVehicleStore((state) => state.phaseIndex);

  return (
    <header className="system-chrome" data-scan-in>
      <a className="system-brand" href="../" data-cursor="HOME" aria-label="Never Wet home">
        <span className="system-brand__mark">AR</span>
        <span>
          <strong>AeroRank</strong>
          <small>Vehicle Analysis System</small>
        </span>
      </a>

      <div className="state-rail" aria-label="System state">
        {systemStates.map((state, index) => (
          <span key={state.id} className={index <= phaseIndex ? "is-active" : ""}>
            {state.shortLabel}
          </span>
        ))}
      </div>

      <div className="top-readouts">
        <span>
          <ScanLine size={14} />
          {phase.label}
        </span>
        <span>
          <Radar size={14} />
          {vehicle.flowStatus}
        </span>
        <span>
          <Gauge size={14} />
          {Math.round(progress * 100)}%
        </span>
      </div>
    </header>
  );
}
