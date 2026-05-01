import { create } from "zustand";
import type { BuildingInfo, CameraMode, FlightTelemetry, MapStatus, SandboxStatus } from "../types";

interface FlightStore {
  buildingInfo: BuildingInfo | null;
  cameraMode: CameraMode;
  interiorOpen: boolean;
  impactNotice: string;
  mapStatus: MapStatus;
  mapStatusMessage: string;
  searchStatus: string;
  sandboxStatus: SandboxStatus;
  telemetry: FlightTelemetry;
  setBuildingInfo: (buildingInfo: BuildingInfo | null) => void;
  setCameraMode: (cameraMode: CameraMode) => void;
  setImpactNotice: (impactNotice: string) => void;
  setInteriorOpen: (interiorOpen: boolean) => void;
  setMapStatus: (mapStatus: MapStatus, mapStatusMessage: string) => void;
  setSearchStatus: (searchStatus: string) => void;
  setSandboxStatus: (sandboxStatus: SandboxStatus) => void;
  setTelemetry: (telemetry: FlightTelemetry) => void;
}

export const useFlightStore = create<FlightStore>((set) => ({
  buildingInfo: null,
  cameraMode: "third",
  impactNotice: "",
  interiorOpen: false,
  mapStatus: "booting",
  mapStatusMessage: "Starting Cesium stream",
  searchStatus: "",
  sandboxStatus: {
    totalStructures: 0,
    intactStructures: 0,
    activeZone: "training",
    lastEvent: "Training Sandbox structures are loading.",
  },
  telemetry: {
    speedMps: 0,
    altitudeMeters: 0,
    altitudeAglMeters: 0,
    headingDegrees: 0,
    pitchDegrees: 0,
    rollDegrees: 0,
    verticalSpeedMps: 0,
    throttle: 0,
    latitude: 43.4516,
    longitude: -80.4925,
    fps: 0,
    stallWarning: false,
    terrainWarning: false,
    isLanded: false,
    impactState: "clear",
  },
  setBuildingInfo: (buildingInfo) => set({ buildingInfo }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setImpactNotice: (impactNotice) => set({ impactNotice }),
  setInteriorOpen: (interiorOpen) => set({ interiorOpen }),
  setMapStatus: (mapStatus, mapStatusMessage) => set({ mapStatus, mapStatusMessage }),
  setSearchStatus: (searchStatus) => set({ searchStatus }),
  setSandboxStatus: (sandboxStatus) => set({ sandboxStatus }),
  setTelemetry: (telemetry) => set({ telemetry }),
}));
