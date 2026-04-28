"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { VehicleScene } from "@/components/scene/VehicleScene";
import { AnalysisOverlay } from "@/components/ui/AnalysisOverlay";
import { BootLoader } from "@/components/ui/BootLoader";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { MetricPanels } from "@/components/ui/MetricPanels";
import { SystemChrome } from "@/components/ui/SystemChrome";
import { VehicleSelector } from "@/components/ui/VehicleSelector";
import { vehicles, vehicleById } from "@/data/vehicles";
import { useSystemTimeline } from "@/hooks/useSystemTimeline";
import { systemStates } from "@/lib/timeline";
import { useVehicleStore } from "@/store/useVehicleStore";

export function AeroSystem() {
  const rootRef = useRef<HTMLElement | null>(null);
  const activeId = useVehicleStore((state) => state.activeId);
  const phaseIndex = useVehicleStore((state) => state.phaseIndex);
  const booted = useVehicleStore((state) => state.booted);
  const setBooted = useVehicleStore((state) => state.setBooted);
  const vehicle = vehicleById[activeId];
  const phase = systemStates[phaseIndex];

  useSystemTimeline(rootRef);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", vehicle.accent);
    document.documentElement.style.setProperty("--accent-2", vehicle.accent2);
    document.documentElement.style.setProperty("--body-tint", vehicle.bodyTint);
  }, [vehicle]);

  const rootStyle = useMemo(
    () =>
      ({
        "--accent": vehicle.accent,
        "--accent-2": vehicle.accent2,
        "--body-tint": vehicle.bodyTint
      }) as CSSProperties,
    [vehicle]
  );

  return (
    <main
      ref={rootRef}
      className="aero-system"
      data-phase={phase.id}
      style={rootStyle}
      aria-label="AeroRank Vehicle Analysis System"
    >
      <CustomCursor />
      {!booted ? <BootLoader vehicle={vehicle} onComplete={() => setBooted(true)} /> : null}

      <div className="system-viewport">
        <VehicleScene />
        <div className="noise-layer" aria-hidden="true" />
        <div className="grid-overlay" aria-hidden="true" />
        <div className="scan-sweep" aria-hidden="true" />
        <SystemChrome vehicle={vehicle} phase={phase} />
        <AnalysisOverlay vehicle={vehicle} />
        <MetricPanels vehicle={vehicle} />
        <VehicleSelector vehicles={vehicles} activeId={activeId} />
      </div>

      <div id="system-scroll" className="scroll-sequence" aria-hidden="true">
        {systemStates.map((state) => (
          <section key={state.id} />
        ))}
      </div>
    </main>
  );
}
