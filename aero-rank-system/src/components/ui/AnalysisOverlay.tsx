"use client";

import type { VehicleProfile } from "@/data/vehicles";

type AnalysisOverlayProps = {
  vehicle: VehicleProfile;
};

const labelSlots = ["slot-a", "slot-b", "slot-c"];

export function AnalysisOverlay({ vehicle }: AnalysisOverlayProps) {
  return (
    <div className="analysis-overlay" aria-label="Vehicle scan labels">
      <div className="center-scan" data-scan-ring aria-hidden="true" />
      {vehicle.labels.map((label, index) => (
        <div
          className={`analysis-label ${labelSlots[index] || "slot-a"}`}
          key={label.id}
          data-scan-in
          data-cursor="SCAN"
        >
          <span>{label.label}</span>
          <strong>{label.value}</strong>
          <i data-flow-line />
        </div>
      ))}
    </div>
  );
}
