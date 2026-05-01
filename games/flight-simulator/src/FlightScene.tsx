import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  ConstantPositionProperty,
  Entity,
  Math as CesiumMath,
  Quaternion,
  Viewer,
} from "cesium";
import { AircraftController } from "./AircraftController";
import { BuildingInteraction } from "./BuildingInteraction";
import { MapLoader } from "./MapLoader";
import { flightStateToOrientation, flightStateToPosition, PhysicsEngine } from "./PhysicsEngine";
import { SandboxDestruction } from "./SandboxDestruction";
import { UIOverlay } from "./UIOverlay";
import { useFlightStore } from "./store/useFlightStore";
import type { CameraMode, LocationTarget } from "./types";

interface AircraftEntities {
  fuselage: Entity;
  wing: Entity;
  tail: Entity;
  nose: Entity;
}

const CAMERA_ORDER: CameraMode[] = ["third", "cockpit", "free", "cinematic"];

const TRAINING_SANDBOX: LocationTarget = {
  label: "Training Sandbox",
  latitude: 34.1,
  longitude: -126.2,
  altitudeMeters: 1150,
};

function createAircraft(viewer: Viewer, position: Cartesian3, orientation: Quaternion): AircraftEntities {
  const shared = {
    position: new ConstantPositionProperty(position),
    orientation,
  };

  const fuselage = viewer.entities.add({
    name: "Sky Atlas aircraft fuselage",
    ...shared,
    box: {
      dimensions: new Cartesian3(18, 2.2, 2.2),
      material: Color.fromCssColorString("#e9f4ff"),
      outline: true,
      outlineColor: Color.fromCssColorString("#172230"),
    },
  });
  const wing = viewer.entities.add({
    name: "Sky Atlas aircraft wing",
    ...shared,
    box: {
      dimensions: new Cartesian3(4.2, 24, 0.45),
      material: Color.fromCssColorString("#74d7ff").withAlpha(0.88),
      outline: true,
      outlineColor: Color.fromCssColorString("#0e1c27"),
    },
  });
  const tail = viewer.entities.add({
    name: "Sky Atlas aircraft tail",
    ...shared,
    box: {
      dimensions: new Cartesian3(3.6, 9, 3.2),
      material: Color.fromCssColorString("#f6d365").withAlpha(0.9),
      outline: true,
      outlineColor: Color.fromCssColorString("#1c1809"),
    },
  });
  const nose = viewer.entities.add({
    name: "Sky Atlas aircraft nose",
    ...shared,
    ellipsoid: {
      radii: new Cartesian3(2.7, 1.1, 1.1),
      material: Color.fromCssColorString("#ff6b6b"),
      outline: true,
      outlineColor: Color.fromCssColorString("#260d0d"),
    },
  });

  return { fuselage, wing, tail, nose };
}

function updateAircraft(aircraft: AircraftEntities, position: Cartesian3, orientation: Quaternion) {
  Object.values(aircraft).forEach((entity) => {
    entity.position = new ConstantPositionProperty(position);
    entity.orientation = orientation;
  });
}

export function FlightScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AircraftController | null>(null);
  const mapLoaderRef = useRef<MapLoader | null>(null);
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const sandboxDestructionRef = useRef<SandboxDestruction | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let animationFrame = 0;
    let lastFrame = performance.now();
    let lastTelemetry = 0;
    let frameCounter = 0;
    let fpsWindowStart = performance.now();
    let currentFps = 0;
    let disposed = false;
    let buildingInteraction: BuildingInteraction | null = null;
    let sandboxDestruction: SandboxDestruction | null = null;
    let aircraft: AircraftEntities | null = null;

    const setMapStatus = useFlightStore.getState().setMapStatus;
    const setTelemetry = useFlightStore.getState().setTelemetry;
    const setBuildingInfo = useFlightStore.getState().setBuildingInfo;
    const setImpactNotice = useFlightStore.getState().setImpactNotice;
    const setSandboxStatus = useFlightStore.getState().setSandboxStatus;

    function announceNotice(message: string, durationMs = 3600) {
      setImpactNotice(message);
      window.setTimeout(() => {
        useFlightStore.getState().setImpactNotice("");
      }, durationMs);
    }

    async function init() {
      const mapLoader = new MapLoader(containerRef.current!);
      mapLoaderRef.current = mapLoader;

      try {
        const result = await mapLoader.initialize();

        if (disposed || !mapLoader.viewer) {
          return;
        }

        setMapStatus(result.status, result.message);

        const viewer = mapLoader.viewer;
        const physics = new PhysicsEngine();
        physicsRef.current = physics;
        const state = physics.getState();
        const position = flightStateToPosition(state);
        const orientation = flightStateToOrientation(state, position);
        aircraft = createAircraft(viewer, position, orientation);

        const controller = new AircraftController(viewer.scene.canvas);
        controllerRef.current = controller;
        buildingInteraction = new BuildingInteraction(viewer, (building) => {
          setBuildingInfo(building);
        });
        buildingInteraction.setBuildings(mapLoader.buildings);
        buildingInteraction.init();
        sandboxDestruction = new SandboxDestruction(
          viewer,
          (latitude, longitude) => mapLoader.getSurfaceHeightAtLocation(latitude, longitude),
          setSandboxStatus,
        );
        sandboxDestruction.init();
        sandboxDestructionRef.current = sandboxDestruction;

        const tick = (now: number) => {
          if (disposed || !physicsRef.current || !controllerRef.current || !mapLoaderRef.current?.viewer || !aircraft) {
            return;
          }

          frameCounter += 1;

          if (now - fpsWindowStart >= 500) {
            currentFps = (frameCounter * 1000) / (now - fpsWindowStart);
            frameCounter = 0;
            fpsWindowStart = now;
          }

          const dt = (now - lastFrame) / 1000;
          lastFrame = now;

          const viewer = mapLoaderRef.current.viewer;
          const currentState = physicsRef.current.getState();
          const currentCartographic = Cartographic.fromDegrees(currentState.longitude, currentState.latitude);
          const controls = controllerRef.current.getControls();

          if (controls.switchCamera) {
            cycleCameraMode();
          }

          const surfaceSample = mapLoaderRef.current.getSurfaceSample(currentCartographic);
          const step = physicsRef.current.update(dt, controls, surfaceSample);

          updateAircraft(aircraft, step.position, step.orientation);
          controllerRef.current.applyCamera(viewer, step.state, step.position, step.vectors);
          buildingInteraction?.updateProximity(step.position, step.vectors.forward);

          const sandboxBreak = sandboxDestruction?.update(step.position, step.state.speedMps);

          if (sandboxBreak) {
            announceNotice(sandboxBreak.message, 3000);
          }

          if (step.impactDetected) {
            announceNotice(step.impactMessage, 3800);
          }

          if (now - lastTelemetry > 120) {
            setTelemetry({
              speedMps: step.state.speedMps,
              altitudeMeters: step.state.altitudeMeters,
              altitudeAglMeters: step.state.altitudeAglMeters,
              headingDegrees: CesiumMath.toDegrees(step.state.heading),
              pitchDegrees: CesiumMath.toDegrees(step.state.pitch),
              rollDegrees: CesiumMath.toDegrees(step.state.roll),
              verticalSpeedMps: step.state.verticalSpeedMps,
              throttle: step.state.throttle,
              latitude: step.state.latitude,
              longitude: step.state.longitude,
              fps: currentFps,
              stallWarning: step.state.stallWarning,
              terrainWarning: step.state.terrainWarning,
              isLanded: step.state.isLanded,
              impactState: step.state.impactState,
            });
            lastTelemetry = now;
          }

          animationFrame = window.requestAnimationFrame(tick);
        };

        animationFrame = window.requestAnimationFrame(tick);
      } catch (error) {
        setMapStatus("error", error instanceof Error ? error.message : "Unable to start Cesium scene");
      }
    }

    init();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      controllerRef.current?.dispose();
      buildingInteraction?.dispose();
      sandboxDestruction?.dispose();
      mapLoaderRef.current?.destroy();
      controllerRef.current = null;
      mapLoaderRef.current = null;
      physicsRef.current = null;
      sandboxDestructionRef.current = null;
    };
  }, []);

  const setCameraMode = (mode: CameraMode) => {
    controllerRef.current?.setCameraMode(mode);
    useFlightStore.getState().setCameraMode(mode);
  };

  const cycleCameraMode = () => {
    const currentMode = useFlightStore.getState().cameraMode;
    const nextMode = CAMERA_ORDER[(CAMERA_ORDER.indexOf(currentMode) + 1) % CAMERA_ORDER.length];
    setCameraMode(nextMode);
  };

  const moveToTarget = async (target: LocationTarget) => {
    const mapLoader = mapLoaderRef.current;
    const physics = physicsRef.current;

    if (!mapLoader || !physics) {
      return;
    }

    useFlightStore.getState().setSearchStatus(`Loading ${target.label}`);
    mapLoader.flyToLocation(target);

    await new Promise((resolve) => window.setTimeout(resolve, 550));

    const surface = mapLoader.getObstacleHeightAtLocation(target.latitude, target.longitude) ?? 0;
    physics.setLocation(target.latitude, target.longitude, Math.max(target.altitudeMeters ?? 1200, surface + 720));
    useFlightStore.getState().setSearchStatus(`Exploring ${target.label}`);
  };

  const handleGoToLocation = () => {
    if (!navigator.geolocation) {
      useFlightStore.getState().setSearchStatus("Geolocation is not available in this browser");
      return;
    }

    useFlightStore.getState().setSearchStatus("Requesting location permission");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void moveToTarget({
          label: "your location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitudeMeters: 1500,
        });
      },
      () => {
        useFlightStore.getState().setSearchStatus("Location permission was not granted");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleSearch = (query: string) => {
    const mapLoader = mapLoaderRef.current;

    if (!mapLoader) {
      return;
    }

    useFlightStore.getState().setSearchStatus(`Searching ${query}`);
    mapLoader
      .resolveAddress(query)
      .then((target) => moveToTarget(target))
      .catch((error: unknown) => {
        useFlightStore
          .getState()
          .setSearchStatus(error instanceof Error ? error.message : "Could not resolve that address");
      });
  };

  const handleRecover = () => {
    const physics = physicsRef.current;
    const mapLoader = mapLoaderRef.current;

    if (!physics || !mapLoader) {
      return;
    }

    const state = physics.getState();
    const surface = mapLoader.getObstacleHeightAtLocation(state.latitude, state.longitude);
    physics.recover(surface);
    useFlightStore.getState().setImpactNotice("Recovery mode restored a safe flight envelope.");
  };

  const handleSandbox = () => {
    void moveToTarget(TRAINING_SANDBOX).then(() => {
      sandboxDestructionRef.current?.resetZone("training");
    });
  };

  const handleResetSandbox = () => {
    sandboxDestructionRef.current?.resetZone("training");
    useFlightStore.getState().setImpactNotice("Training Sandbox reset.");
    window.setTimeout(() => {
      useFlightStore.getState().setImpactNotice("");
    }, 2600);
  };

  const handleTakeoffPractice = () => {
    const physics = physicsRef.current;
    const mapLoader = mapLoaderRef.current;

    if (!physics || !mapLoader) {
      return;
    }

    useFlightStore.getState().setSearchStatus("Loading Training Sandbox runway start");
    mapLoader.flyToLocation({ ...TRAINING_SANDBOX, altitudeMeters: 650 });
    window.setTimeout(() => {
      const terrain = mapLoader.getTerrainHeightAtLocation(TRAINING_SANDBOX.latitude, TRAINING_SANDBOX.longitude) ?? 0;
      physics.setOnGround(TRAINING_SANDBOX.latitude, TRAINING_SANDBOX.longitude, terrain, CesiumMath.toRadians(70));
      sandboxDestructionRef.current?.resetZone("training");
      useFlightStore.getState().setSearchStatus("Training Sandbox runway start");
    }, 550);
  };

  return (
    <div className="flight-sim">
      <div ref={containerRef} className="flight-sim__scene" />
      <UIOverlay
        onCameraModeChange={setCameraMode}
        onGoToLocation={handleGoToLocation}
        onRecover={handleRecover}
        onResetSandbox={handleResetSandbox}
        onSearch={handleSearch}
        onSandbox={handleSandbox}
        onTakeoffPractice={handleTakeoffPractice}
      />
    </div>
  );
}
