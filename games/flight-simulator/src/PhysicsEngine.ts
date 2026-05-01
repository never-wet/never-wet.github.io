import {
  Cartesian3,
  Cartesian4,
  HeadingPitchRoll,
  Math as CesiumMath,
  Matrix4,
  Quaternion,
  Transforms,
} from "cesium";
import type { FlightControls, FlightState, SurfaceSample } from "./types";

const EARTH_RADIUS_METERS = 6_378_137;
const MAX_AIRSPEED = 285;
const STALL_SPEED_MPS = 42;
const TAKEOFF_SPEED_MPS = 50;
const GEAR_CLEARANCE_METERS = 3.2;
const RECOVERY_CLEARANCE_METERS = 340;
const BUILDING_COLLISION_MARGIN_METERS = 6;

export interface FlightVectors {
  east: Cartesian3;
  north: Cartesian3;
  up: Cartesian3;
  forward: Cartesian3;
  right: Cartesian3;
  aircraftUp: Cartesian3;
}

export interface PhysicsStepResult {
  state: FlightState;
  position: Cartesian3;
  orientation: Quaternion;
  vectors: FlightVectors;
  impactDetected: boolean;
  impactMessage: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function finiteOr(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function wrapRadians(value: number) {
  const twoPi = Math.PI * 2;
  return ((value % twoPi) + twoPi) % twoPi;
}

function normalizeSurface(surface?: SurfaceSample | number): Required<SurfaceSample> {
  if (typeof surface === "number") {
    return {
      terrainHeightMeters: finiteOr(surface, 0),
      obstacleHeightMeters: finiteOr(surface, 0),
    };
  }

  const terrainHeightMeters = finiteOr(surface?.terrainHeightMeters, 0);
  return {
    terrainHeightMeters,
    obstacleHeightMeters: Math.max(terrainHeightMeters, finiteOr(surface?.obstacleHeightMeters, terrainHeightMeters)),
  };
}

export function flightStateToPosition(state: FlightState) {
  return Cartesian3.fromDegrees(state.longitude, state.latitude, state.altitudeMeters);
}

export function flightStateToOrientation(state: FlightState, position = flightStateToPosition(state)) {
  return Transforms.headingPitchRollQuaternion(
    position,
    new HeadingPitchRoll(state.heading, state.pitch, state.roll),
  );
}

export function computeFlightVectors(position: Cartesian3, state: FlightState): FlightVectors {
  const enu = Transforms.eastNorthUpToFixedFrame(position);
  const eastColumn = Matrix4.getColumn(enu, 0, new Cartesian4());
  const northColumn = Matrix4.getColumn(enu, 1, new Cartesian4());
  const upColumn = Matrix4.getColumn(enu, 2, new Cartesian4());
  const east = Cartesian3.normalize(new Cartesian3(eastColumn.x, eastColumn.y, eastColumn.z), new Cartesian3());
  const north = Cartesian3.normalize(new Cartesian3(northColumn.x, northColumn.y, northColumn.z), new Cartesian3());
  const up = Cartesian3.normalize(new Cartesian3(upColumn.x, upColumn.y, upColumn.z), new Cartesian3());

  const horizontalForward = Cartesian3.normalize(
    Cartesian3.add(
      Cartesian3.multiplyByScalar(north, Math.cos(state.heading), new Cartesian3()),
      Cartesian3.multiplyByScalar(east, Math.sin(state.heading), new Cartesian3()),
      new Cartesian3(),
    ),
    new Cartesian3(),
  );
  const horizontalRight = Cartesian3.normalize(
    Cartesian3.add(
      Cartesian3.multiplyByScalar(east, Math.cos(state.heading), new Cartesian3()),
      Cartesian3.multiplyByScalar(north, -Math.sin(state.heading), new Cartesian3()),
      new Cartesian3(),
    ),
    new Cartesian3(),
  );

  const forward = Cartesian3.normalize(
    Cartesian3.add(
      Cartesian3.multiplyByScalar(horizontalForward, Math.cos(state.pitch), new Cartesian3()),
      Cartesian3.multiplyByScalar(up, Math.sin(state.pitch), new Cartesian3()),
      new Cartesian3(),
    ),
    new Cartesian3(),
  );
  const right = Cartesian3.normalize(
    Cartesian3.add(
      Cartesian3.multiplyByScalar(horizontalRight, Math.cos(state.roll), new Cartesian3()),
      Cartesian3.multiplyByScalar(up, Math.sin(state.roll), new Cartesian3()),
      new Cartesian3(),
    ),
    new Cartesian3(),
  );
  const aircraftUp = Cartesian3.normalize(Cartesian3.cross(right, forward, new Cartesian3()), new Cartesian3());

  return { east, north, up, forward, right, aircraftUp };
}

export class PhysicsEngine {
  private state: FlightState;
  private recoveryTimerSeconds = 0;

  constructor(initial?: Partial<FlightState>) {
    this.state = {
      latitude: initial?.latitude ?? 43.4516,
      longitude: initial?.longitude ?? -80.4925,
      altitudeMeters: initial?.altitudeMeters ?? 1450,
      altitudeAglMeters: initial?.altitudeAglMeters ?? 1450,
      heading: initial?.heading ?? CesiumMath.toRadians(35),
      pitch: initial?.pitch ?? CesiumMath.toRadians(2),
      roll: initial?.roll ?? 0,
      speedMps: initial?.speedMps ?? 92,
      verticalSpeedMps: initial?.verticalSpeedMps ?? 0,
      throttle: initial?.throttle ?? 0.62,
      stallWarning: initial?.stallWarning ?? false,
      terrainWarning: initial?.terrainWarning ?? false,
      isLanded: initial?.isLanded ?? false,
      impactState: initial?.impactState ?? "clear",
    };
  }

  getState() {
    return { ...this.state };
  }

  setLocation(latitude: number, longitude: number, altitudeMeters: number, heading = this.state.heading) {
    this.state = {
      ...this.state,
      latitude,
      longitude,
      altitudeMeters,
      altitudeAglMeters: Math.max(0, altitudeMeters),
      heading,
      pitch: CesiumMath.toRadians(3),
      roll: 0,
      speedMps: Math.max(this.state.speedMps, 84),
      verticalSpeedMps: 0,
      throttle: Math.max(this.state.throttle, 0.58),
      stallWarning: false,
      terrainWarning: false,
      isLanded: false,
      impactState: "clear",
    };
    this.recoveryTimerSeconds = 0;
  }

  setOnGround(latitude: number, longitude: number, terrainHeightMeters: number, heading = this.state.heading) {
    const altitudeMeters = terrainHeightMeters + GEAR_CLEARANCE_METERS;
    this.state = {
      ...this.state,
      latitude,
      longitude,
      altitudeMeters,
      altitudeAglMeters: GEAR_CLEARANCE_METERS,
      heading,
      pitch: CesiumMath.toRadians(1),
      roll: 0,
      speedMps: 0,
      verticalSpeedMps: 0,
      throttle: 0,
      stallWarning: false,
      terrainWarning: false,
      isLanded: true,
      impactState: "clear",
    };
    this.recoveryTimerSeconds = 0;
  }

  recover(surfaceHeightMeters?: number) {
    const surfaceHeight = finiteOr(surfaceHeightMeters, 0);
    const safeAltitude = Math.max(surfaceHeight + RECOVERY_CLEARANCE_METERS, this.state.altitudeMeters + 80);
    this.state = {
      ...this.state,
      altitudeMeters: safeAltitude,
      altitudeAglMeters: safeAltitude - surfaceHeight,
      pitch: CesiumMath.toRadians(4),
      roll: 0,
      speedMps: 78,
      verticalSpeedMps: 1.5,
      throttle: Math.max(this.state.throttle, 0.56),
      stallWarning: false,
      terrainWarning: false,
      isLanded: false,
      impactState: "recovering",
    };
    this.recoveryTimerSeconds = 2.2;
  }

  update(deltaSeconds: number, controls: FlightControls, surfaceSample?: SurfaceSample | number): PhysicsStepResult {
    const dt = clamp(deltaSeconds, 0.001, 0.05);
    const surface = normalizeSurface(surfaceSample);
    const terrainHeight = surface.terrainHeightMeters;
    const obstacleHeight = surface.obstacleHeightMeters;
    let impactDetected = false;
    let impactMessage = "";

    if (controls.reset) {
      this.recover(Math.max(terrainHeight, obstacleHeight));
    }

    this.state.throttle = clamp(
      this.state.throttle + controls.throttle * dt * (controls.throttle > 0 ? 0.32 : 0.46),
      0,
      1,
    );

    if (this.state.isLanded) {
      this.updateGroundRoll(dt, controls, terrainHeight);
    } else {
      this.updateAirborne(dt, controls);
    }

    this.advancePosition(dt);
    this.updateTerrainState(terrainHeight);

    const safeGroundAltitude = terrainHeight + GEAR_CLEARANCE_METERS;
    const buildingIsPresent = obstacleHeight > terrainHeight + 8;
    const buildingCollisionAltitude = obstacleHeight + BUILDING_COLLISION_MARGIN_METERS;

    if (buildingIsPresent && !this.state.isLanded && this.state.altitudeMeters <= buildingCollisionAltitude) {
      impactDetected = true;
      impactMessage = "Impact detected near a real 3D building. Recovery mode restored a safe flight path.";
      this.recover(obstacleHeight);
    } else if (this.state.altitudeMeters <= safeGroundAltitude) {
      if (this.canSettleOntoTerrain()) {
        this.state.altitudeMeters = safeGroundAltitude;
        this.state.altitudeAglMeters = GEAR_CLEARANCE_METERS;
        this.state.verticalSpeedMps = 0;
        this.state.isLanded = true;
        this.state.terrainWarning = false;
      } else {
        impactDetected = true;
        impactMessage = "Impact detected. Recovery mode moved the aircraft back to a safe altitude.";
        this.recover(terrainHeight);
      }
    }

    if (this.recoveryTimerSeconds > 0) {
      this.recoveryTimerSeconds = Math.max(0, this.recoveryTimerSeconds - dt);
      if (this.recoveryTimerSeconds === 0) {
        this.state.impactState = "clear";
      }
    }

    const position = flightStateToPosition(this.state);
    const orientation = flightStateToOrientation(this.state, position);
    const vectors = computeFlightVectors(position, this.state);

    return {
      state: this.getState(),
      position,
      orientation,
      vectors,
      impactDetected,
      impactMessage,
    };
  }

  private updateGroundRoll(dt: number, controls: FlightControls, terrainHeight: number) {
    const thrustAcceleration = this.state.throttle * 7.4;
    const rollingDrag = 1.9 + (controls.brake ? 12 : 0);
    this.state.speedMps = clamp(this.state.speedMps + (thrustAcceleration - rollingDrag) * dt, 0, 95);
    this.state.pitch = clamp(
      this.state.pitch + controls.pitch * CesiumMath.toRadians(16) * dt,
      CesiumMath.toRadians(-3),
      CesiumMath.toRadians(10),
    );
    this.state.roll *= 1 - Math.min(1, dt * 2.2);
    this.state.heading = wrapRadians(
      this.state.heading + (controls.yaw + controls.roll * 0.35) * CesiumMath.toRadians(14) * dt,
    );
    this.state.altitudeMeters = terrainHeight + GEAR_CLEARANCE_METERS;
    this.state.verticalSpeedMps = 0;
    this.state.stallWarning = false;

    if (this.state.speedMps >= TAKEOFF_SPEED_MPS && (this.state.pitch > CesiumMath.toRadians(4) || controls.pitch > 0.35)) {
      this.state.isLanded = false;
      this.state.pitch = Math.max(this.state.pitch, CesiumMath.toRadians(6));
      this.state.verticalSpeedMps = 2.4;
    }
  }

  private updateAirborne(dt: number, controls: FlightControls) {
    const speed01 = clamp((this.state.speedMps - 20) / 130, 0.18, 1);
    const rollRate = CesiumMath.toRadians(66) * speed01;
    const pitchRate = CesiumMath.toRadians(34) * speed01;
    const yawRate = CesiumMath.toRadians(18) * speed01;

    this.state.roll = clamp(
      this.state.roll + controls.roll * rollRate * dt,
      CesiumMath.toRadians(-72),
      CesiumMath.toRadians(72),
    );
    this.state.pitch = clamp(
      this.state.pitch + controls.pitch * pitchRate * dt,
      CesiumMath.toRadians(-30),
      CesiumMath.toRadians(32),
    );

    if (Math.abs(controls.roll) < 0.01) {
      this.state.roll *= 1 - Math.min(1, dt * 0.78);
    }

    if (Math.abs(controls.pitch) < 0.01) {
      const trimPitch = CesiumMath.toRadians(1.8);
      this.state.pitch += (trimPitch - this.state.pitch) * Math.min(1, dt * 0.18);
    }

    const bankingTurnRate = (9.81 * Math.tan(this.state.roll)) / Math.max(this.state.speedMps, 35);
    this.state.heading = wrapRadians(this.state.heading + (bankingTurnRate + controls.yaw * yawRate) * dt);

    const stallBySpeed = this.state.speedMps < STALL_SPEED_MPS;
    const stallByAngle = this.state.pitch > CesiumMath.toRadians(17) && this.state.speedMps < 74;
    this.state.stallWarning = stallBySpeed || stallByAngle;

    const thrustAcceleration = this.state.throttle * 13.8;
    const parasiteDrag = 0.00082 * this.state.speedMps * this.state.speedMps;
    const inducedDrag = Math.abs(this.state.pitch) * 3.6 + Math.abs(this.state.roll) * 0.9;
    const airbrakeDrag = controls.brake ? 17 : 0;
    const climbPenalty = Math.sin(this.state.pitch) * 9.81;
    const stallDrag = this.state.stallWarning ? 5.5 : 0;
    this.state.speedMps = clamp(
      this.state.speedMps + (thrustAcceleration - parasiteDrag - inducedDrag - airbrakeDrag - climbPenalty - stallDrag) * dt,
      24,
      MAX_AIRSPEED,
    );

    const liftAoA = clamp(1 + this.state.pitch * 1.85, 0.25, 1.72);
    let liftAcceleration = this.state.speedMps * this.state.speedMps * 0.0011 * liftAoA * Math.cos(this.state.roll);

    if (this.state.stallWarning) {
      const stallLiftRatio = clamp((this.state.speedMps - 24) / (STALL_SPEED_MPS - 24), 0.18, 0.72);
      liftAcceleration *= stallLiftRatio;
      this.state.pitch -= CesiumMath.toRadians(9) * dt;
    }

    const verticalAcceleration = liftAcceleration - 9.81 + Math.sin(this.state.pitch) * thrustAcceleration * 0.36;
    this.state.verticalSpeedMps = clamp(this.state.verticalSpeedMps + verticalAcceleration * dt, -68, 54);
    this.state.altitudeMeters += this.state.verticalSpeedMps * dt;
  }

  private advancePosition(dt: number) {
    const climbAngle = Math.atan2(this.state.verticalSpeedMps, Math.max(this.state.speedMps, 1));
    const horizontalSpeed = this.state.isLanded
      ? this.state.speedMps
      : Math.max(0, this.state.speedMps * Math.cos(clamp(climbAngle, -0.95, 0.95)));
    const horizontalDistance = horizontalSpeed * dt;
    const deltaNorth = Math.cos(this.state.heading) * horizontalDistance;
    const deltaEast = Math.sin(this.state.heading) * horizontalDistance;
    const latRad = CesiumMath.toRadians(this.state.latitude);
    const safeCosLat = Math.max(0.08, Math.cos(latRad));

    this.state.latitude += CesiumMath.toDegrees(deltaNorth / EARTH_RADIUS_METERS);
    this.state.longitude += CesiumMath.toDegrees(deltaEast / (EARTH_RADIUS_METERS * safeCosLat));
  }

  private updateTerrainState(terrainHeight: number) {
    this.state.altitudeAglMeters = Math.max(0, this.state.altitudeMeters - terrainHeight);
    this.state.terrainWarning =
      !this.state.isLanded &&
      this.state.altitudeAglMeters < 85 &&
      (this.state.verticalSpeedMps < -1.2 || this.state.pitch < CesiumMath.toRadians(-4));
  }

  private canSettleOntoTerrain() {
    return (
      this.state.verticalSpeedMps > -5.8 &&
      this.state.speedMps < 86 &&
      Math.abs(this.state.roll) < CesiumMath.toRadians(12) &&
      this.state.pitch > CesiumMath.toRadians(-8) &&
      this.state.pitch < CesiumMath.toRadians(12)
    );
  }
}
