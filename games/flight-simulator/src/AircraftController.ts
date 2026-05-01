import { Cartesian3, Cartographic, Camera, Math as CesiumMath, Viewer } from "cesium";
import type { CameraMode, FlightControls, FlightState } from "./types";
import type { FlightVectors } from "./PhysicsEngine";

const CAMERA_LIMITS = {
  third: { minDistance: 62, maxDistance: 420, defaultDistance: 170 },
  free: { minDistance: 180, maxDistance: 1300, defaultDistance: 580 },
  cinematic: { minDistance: 90, maxDistance: 620, defaultDistance: 260 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizedAdd(base: Cartesian3, a: Cartesian3, aScale: number, b: Cartesian3, bScale: number) {
  const result = Cartesian3.clone(base, new Cartesian3());
  Cartesian3.add(result, Cartesian3.multiplyByScalar(a, aScale, new Cartesian3()), result);
  Cartesian3.add(result, Cartesian3.multiplyByScalar(b, bScale, new Cartesian3()), result);
  return Cartesian3.normalize(result, result);
}

export class AircraftController {
  private readonly canvas: HTMLCanvasElement;
  private readonly keys = new Set<string>();
  private cameraMode: CameraMode = "third";
  private isPointerActive = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lookYaw = 0;
  private lookPitch = 0;
  private thirdPersonDistance = CAMERA_LIMITS.third.defaultDistance;
  private freeCameraDistance = CAMERA_LIMITS.free.defaultDistance;
  private cinematicDistance = CAMERA_LIMITS.cinematic.defaultDistance;
  private smoothedCameraPosition: Cartesian3 | null = null;
  private resetRequested = false;
  private cameraCycleRequested = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bind();
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }

  setCameraMode(cameraMode: CameraMode) {
    this.cameraMode = cameraMode;
    this.lookYaw = clamp(this.lookYaw, -0.9, 0.9);
    this.lookPitch = clamp(this.lookPitch, -0.65, 0.65);
  }

  getControls(): FlightControls {
    const throttle = (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0);
    const roll = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    const pitch = (this.keys.has("ArrowUp") ? 1 : 0) - (this.keys.has("ArrowDown") ? 1 : 0);
    const yaw = (this.keys.has("KeyE") ? 1 : 0) - (this.keys.has("KeyQ") ? 1 : 0);
    const reset = this.resetRequested;
    const switchCamera = this.cameraCycleRequested;
    this.resetRequested = false;
    this.cameraCycleRequested = false;

    return {
      throttle,
      roll,
      pitch,
      yaw,
      brake: this.keys.has("Space"),
      reset,
      switchCamera,
    };
  }

  applyCamera(viewer: Viewer, state: FlightState, position: Cartesian3, vectors: FlightVectors) {
    const camera = viewer.camera;

    if (this.cameraMode === "cockpit") {
      this.applyCockpitCamera(camera, position, vectors);
      return;
    }

    if (this.cameraMode === "free") {
      this.applyFreeCamera(viewer, position, vectors);
      return;
    }

    if (this.cameraMode === "cinematic") {
      this.applyCinematicCamera(viewer, state, position, vectors);
      return;
    }

    this.applyThirdPersonCamera(viewer, state, position, vectors);
  }

  private bind() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.code === "KeyR") {
      this.resetRequested = true;
    }

    if (event.code === "KeyC" && !this.keys.has("KeyC")) {
      this.cameraCycleRequested = true;
    }

    if (
      event.code.startsWith("Arrow") ||
      event.code === "Space" ||
      event.code === "KeyW" ||
      event.code === "KeyA" ||
      event.code === "KeyS" ||
      event.code === "KeyD" ||
      event.code === "KeyE" ||
      event.code === "KeyQ" ||
      event.code === "KeyR" ||
      event.code === "KeyC"
    ) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private handlePointerDown = (event: PointerEvent) => {
    this.isPointerActive = true;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.isPointerActive) {
      return;
    }

    const deltaX = event.clientX - this.lastPointerX;
    const deltaY = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.lookYaw = clamp(this.lookYaw + deltaX * 0.0032, -1.35, 1.35);
    this.lookPitch = clamp(this.lookPitch - deltaY * 0.0028, -0.95, 0.82);
  };

  private handlePointerUp = () => {
    this.isPointerActive = false;
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const scale = event.deltaY > 0 ? 1.08 : 0.92;

    if (this.cameraMode === "free") {
      this.freeCameraDistance = clamp(
        this.freeCameraDistance * scale,
        CAMERA_LIMITS.free.minDistance,
        CAMERA_LIMITS.free.maxDistance,
      );
      return;
    }

    if (this.cameraMode === "cinematic") {
      this.cinematicDistance = clamp(
        this.cinematicDistance * scale,
        CAMERA_LIMITS.cinematic.minDistance,
        CAMERA_LIMITS.cinematic.maxDistance,
      );
      return;
    }

    this.thirdPersonDistance = clamp(
      this.thirdPersonDistance * scale,
      CAMERA_LIMITS.third.minDistance,
      CAMERA_LIMITS.third.maxDistance,
    );
  };

  private applyCockpitCamera(camera: Camera, position: Cartesian3, vectors: FlightVectors) {
    const eye = Cartesian3.add(
      position,
      Cartesian3.add(
        Cartesian3.multiplyByScalar(vectors.forward, 8, new Cartesian3()),
        Cartesian3.multiplyByScalar(vectors.aircraftUp, 2.5, new Cartesian3()),
        new Cartesian3(),
      ),
      new Cartesian3(),
    );
    const direction = normalizedAdd(vectors.forward, vectors.right, this.lookYaw * 0.42, vectors.aircraftUp, this.lookPitch * 0.34);

    camera.setView({
      destination: eye,
      orientation: {
        direction,
        up: vectors.aircraftUp,
      },
    });
    this.smoothedCameraPosition = Cartesian3.clone(eye, this.smoothedCameraPosition ?? new Cartesian3());
  }

  private applyThirdPersonCamera(viewer: Viewer, _state: FlightState, position: Cartesian3, vectors: FlightVectors) {
    const camera = viewer.camera;
    const chaseDirection = normalizedAdd(
      vectors.forward,
      vectors.right,
      this.lookYaw * 0.58,
      vectors.aircraftUp,
      this.lookPitch * 0.22,
    );
    const cameraPosition = this.clampCameraAboveTerrain(viewer, Cartesian3.add(
      position,
      Cartesian3.add(
        Cartesian3.multiplyByScalar(chaseDirection, -this.thirdPersonDistance, new Cartesian3()),
        Cartesian3.multiplyByScalar(vectors.up, 42 + this.lookPitch * 56, new Cartesian3()),
        new Cartesian3(),
      ),
      new Cartesian3(),
    ));
    const lookAt = Cartesian3.add(
      position,
      Cartesian3.add(
        Cartesian3.multiplyByScalar(vectors.forward, 95, new Cartesian3()),
        Cartesian3.multiplyByScalar(vectors.aircraftUp, 18, new Cartesian3()),
        new Cartesian3(),
      ),
      new Cartesian3(),
    );
    this.setSmoothCamera(camera, cameraPosition, lookAt, vectors.up, 0.18);
  }

  private applyCinematicCamera(viewer: Viewer, state: FlightState, position: Cartesian3, vectors: FlightVectors) {
    const camera = viewer.camera;
    const orbitSide = Math.sin(performance.now() * 0.00022) * 220;
    const bankLead = Math.sin(state.roll) * 90;
    const cameraPosition = this.clampCameraAboveTerrain(viewer, Cartesian3.add(
      position,
      Cartesian3.add(
        Cartesian3.add(
          Cartesian3.multiplyByScalar(vectors.forward, -this.cinematicDistance, new Cartesian3()),
          Cartesian3.multiplyByScalar(vectors.right, orbitSide + bankLead, new Cartesian3()),
          new Cartesian3(),
        ),
        Cartesian3.multiplyByScalar(vectors.up, 80 + Math.max(0, this.lookPitch) * 90, new Cartesian3()),
        new Cartesian3(),
      ),
      new Cartesian3(),
    ));
    const lookAt = Cartesian3.add(position, Cartesian3.multiplyByScalar(vectors.forward, 130, new Cartesian3()), new Cartesian3());

    this.setSmoothCamera(camera, cameraPosition, lookAt, vectors.up, 0.08);
  }

  private applyFreeCamera(viewer: Viewer, position: Cartesian3, vectors: FlightVectors) {
    const camera = viewer.camera;
    const sideOffset = this.lookYaw * 420;
    const heightOffset = 240 + this.lookPitch * 320;
    const cameraPosition = this.clampCameraAboveTerrain(viewer, Cartesian3.add(
      position,
      Cartesian3.add(
        Cartesian3.add(
          Cartesian3.multiplyByScalar(vectors.forward, -this.freeCameraDistance, new Cartesian3()),
          Cartesian3.multiplyByScalar(vectors.right, sideOffset, new Cartesian3()),
          new Cartesian3(),
        ),
        Cartesian3.multiplyByScalar(vectors.up, heightOffset, new Cartesian3()),
        new Cartesian3(),
      ),
      new Cartesian3(),
    ));
    const lookAt = Cartesian3.add(position, Cartesian3.multiplyByScalar(vectors.forward, 150, new Cartesian3()), new Cartesian3());
    this.setSmoothCamera(camera, cameraPosition, lookAt, vectors.up, 0.12);
  }

  private setSmoothCamera(camera: Camera, desiredPosition: Cartesian3, lookAt: Cartesian3, up: Cartesian3, blend: number) {
    const current = this.smoothedCameraPosition ?? Cartesian3.clone(desiredPosition, new Cartesian3());
    this.smoothedCameraPosition = Cartesian3.lerp(current, desiredPosition, blend, current);
    const direction = Cartesian3.normalize(Cartesian3.subtract(lookAt, this.smoothedCameraPosition, new Cartesian3()), new Cartesian3());
    camera.setView({
      destination: this.smoothedCameraPosition,
      orientation: {
        direction,
        up,
      },
    });
  }

  private clampCameraAboveTerrain(viewer: Viewer, position: Cartesian3) {
    const cartographic = Cartographic.fromCartesian(position);
    const sampledHeight = viewer.scene.globe.getHeight(cartographic);
    const minHeight = (sampledHeight ?? 0) + 8;

    if (cartographic.height >= minHeight) {
      return position;
    }

    return Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      minHeight + CesiumMath.clamp(minHeight - cartographic.height, 0, 24),
    );
  }
}
