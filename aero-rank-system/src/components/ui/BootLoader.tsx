"use client";

import { useEffect, useState } from "react";
import type { VehicleProfile } from "@/data/vehicles";

type BootLoaderProps = {
  vehicle: VehicleProfile;
  onComplete: () => void;
};

export function BootLoader({ vehicle, onComplete }: BootLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let value = 0;
    const interval = window.setInterval(() => {
      value = Math.min(100, value + Math.random() * 12 + 5);
      setProgress(Math.round(value));
      if (value >= 100) {
        window.clearInterval(interval);
        setComplete(true);
        window.setTimeout(onComplete, 620);
      }
    }, 90);

    return () => window.clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`boot-loader ${complete ? "is-complete" : ""}`} aria-live="polite">
      <div className="boot-loader__grid" aria-hidden="true" />
      <div className="boot-loader__wire" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="boot-loader__panel">
        <span className="micro-label">AERORANK OS / BOOT</span>
        <strong>{vehicle.name}</strong>
        <p>Initializing wind tunnel interface</p>
        <div className="boot-loader__track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="boot-loader__readout">
          <span>GRID ONLINE</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
