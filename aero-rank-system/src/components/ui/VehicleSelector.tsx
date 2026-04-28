"use client";

import type { CSSProperties } from "react";
import type { VehicleId, VehicleProfile } from "@/data/vehicles";
import { useVehicleStore } from "@/store/useVehicleStore";

type VehicleSelectorProps = {
  vehicles: VehicleProfile[];
  activeId: VehicleId;
};

export function VehicleSelector({ vehicles, activeId }: VehicleSelectorProps) {
  const setVehicle = useVehicleStore((state) => state.setVehicle);

  return (
    <nav className="vehicle-selector" aria-label="Vehicle comparison selector" data-scan-in>
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          className={vehicle.id === activeId ? "is-active" : ""}
          type="button"
          onClick={() => setVehicle(vehicle.id)}
          data-cursor="SELECT"
          style={{ "--selector-accent": vehicle.accent } as CSSProperties}
        >
          <span>{vehicle.rank}</span>
          <strong>{vehicle.shortName}</strong>
          <small>{vehicle.flowStatus}</small>
        </button>
      ))}
    </nav>
  );
}
