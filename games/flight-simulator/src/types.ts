export type CameraMode = "third" | "cockpit" | "free" | "cinematic";

export type MapStatus = "booting" | "ready" | "limited" | "error";

export type SandboxZone = "training";

export interface FlightTelemetry {
  speedMps: number;
  altitudeMeters: number;
  altitudeAglMeters: number;
  headingDegrees: number;
  pitchDegrees: number;
  rollDegrees: number;
  verticalSpeedMps: number;
  throttle: number;
  latitude: number;
  longitude: number;
  fps: number;
  stallWarning: boolean;
  terrainWarning: boolean;
  isLanded: boolean;
  impactState: "clear" | "recovering";
}

export interface BuildingInfo {
  id: string;
  name: string;
  address: string;
  type: string;
  source: "click" | "proximity";
  coordinates?: {
    latitude: number;
    longitude: number;
    heightMeters: number;
  };
  properties: Record<string, string>;
}

export interface SandboxStatus {
  totalStructures: number;
  intactStructures: number;
  activeZone: SandboxZone;
  lastEvent: string;
}

export interface LocationTarget {
  label: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export interface FlightControls {
  throttle: number;
  roll: number;
  pitch: number;
  yaw: number;
  brake: boolean;
  reset: boolean;
  switchCamera: boolean;
}

export interface FlightState {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  heading: number;
  pitch: number;
  roll: number;
  speedMps: number;
  verticalSpeedMps: number;
  throttle: number;
  altitudeAglMeters: number;
  stallWarning: boolean;
  terrainWarning: boolean;
  isLanded: boolean;
  impactState: "clear" | "recovering";
}

export interface SurfaceSample {
  terrainHeightMeters?: number;
  obstacleHeightMeters?: number;
}
