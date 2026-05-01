import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  Credit,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  UrlTemplateImageryProvider,
  Viewer,
} from "cesium";
import type { LocationTarget, MapStatus, SurfaceSample } from "./types";

export interface MapLoadResult {
  status: MapStatus;
  message: string;
}

export class MapLoader {
  viewer: Viewer | null = null;
  buildings: Cesium3DTileset | null = null;
  private readonly container: HTMLDivElement;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  async initialize(): Promise<MapLoadResult> {
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim();

    if (token) {
      Ion.defaultAccessToken = token;
    }

    this.viewer = new Viewer(this.container, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new EllipsoidTerrainProvider(),
      baseLayer: new ImageryLayer(
        new UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: new Credit("OpenStreetMap contributors"),
          maximumLevel: 19,
        }),
      ),
    });

    const scene = this.viewer.scene;
    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.enableLighting = true;
    scene.fog.enabled = true;
    scene.highDynamicRange = true;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
    }

    if (scene.sun) {
      scene.sun.show = true;
    }

    if (scene.moon) {
      scene.moon.show = true;
    }

    const controller = scene.screenSpaceCameraController;
    controller.enableRotate = false;
    controller.enableTranslate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;

    let status: MapStatus = "ready";
    let message = "OpenStreetMap imagery ready";

    if (token) {
      try {
        this.viewer.terrainProvider = await createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        });
        message = "Cesium World Terrain ready";
      } catch {
        status = "limited";
        message = "Terrain token request failed; using street imagery with ellipsoid fallback";
      }

      try {
        this.buildings = await createOsmBuildingsAsync();
        this.buildings.style = undefined;
        this.viewer.scene.primitives.add(this.buildings);
        message = `${message}; OSM 3D buildings streaming`;
      } catch {
        status = "limited";
        message = `${message}; OSM 3D buildings unavailable`;
      }
    } else {
      status = "limited";
      message = "Add VITE_CESIUM_ION_TOKEN for real terrain elevation and OSM 3D buildings";
    }

    this.addSandboxMarkers();
    this.flyToLocation({
      label: "Kitchener / Waterloo",
      latitude: 43.4516,
      longitude: -80.4925,
      altitudeMeters: 2300,
    });

    return { status, message };
  }

  destroy() {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }

  flyToLocation(target: LocationTarget, duration = 1.8) {
    if (!this.viewer) {
      return;
    }

    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(target.longitude, target.latitude, target.altitudeMeters ?? 1800),
      orientation: {
        heading: CesiumMath.toRadians(18),
        pitch: CesiumMath.toRadians(-24),
        roll: 0,
      },
      duration,
    });
  }

  async resolveAddress(query: string): Promise<LocationTarget> {
    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      q: query,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Address lookup failed.");
    }

    const [result] = (await response.json()) as Array<{
      display_name?: string;
      lat: string;
      lon: string;
    }>;

    if (!result) {
      throw new Error("No matching location found.");
    }

    return {
      label: result.display_name ?? query,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      altitudeMeters: 1600,
    };
  }

  getTerrainHeight(cartographic: Cartographic): number | undefined {
    if (!this.viewer) {
      return undefined;
    }

    const globeHeight = this.viewer.scene.globe.getHeight(cartographic);
    return globeHeight !== undefined && Number.isFinite(globeHeight) ? globeHeight : undefined;
  }

  getObstacleHeight(cartographic: Cartographic): number | undefined {
    if (!this.viewer) {
      return undefined;
    }

    try {
      const sampledHeight = this.viewer.scene.sampleHeight(cartographic, this.buildings ? [this.buildings] : undefined);

      if (sampledHeight !== undefined && Number.isFinite(sampledHeight)) {
        return sampledHeight;
      }
    } catch {
      // sampleHeight can be unavailable while new tiles are still loading.
    }

    return this.getTerrainHeight(cartographic);
  }

  getSurfaceSample(cartographic: Cartographic): SurfaceSample {
    const terrainHeightMeters = this.getTerrainHeight(cartographic);
    const obstacleHeightMeters = this.getObstacleHeight(cartographic);

    return {
      terrainHeightMeters,
      obstacleHeightMeters,
    };
  }

  getSurfaceHeight(cartographic: Cartographic): number | undefined {
    return this.getObstacleHeight(cartographic);
  }

  getSurfaceHeightAtLocation(latitude: number, longitude: number) {
    return this.getSurfaceHeight(Cartographic.fromDegrees(longitude, latitude));
  }

  getTerrainHeightAtLocation(latitude: number, longitude: number) {
    return this.getTerrainHeight(Cartographic.fromDegrees(longitude, latitude));
  }

  getObstacleHeightAtLocation(latitude: number, longitude: number) {
    return this.getObstacleHeight(Cartographic.fromDegrees(longitude, latitude));
  }

  private addSandboxMarkers() {
    if (!this.viewer) {
      return;
    }

    const zones = [
      {
        name: "Training Sandbox",
        latitude: 34.1,
        longitude: -126.2,
        color: Color.fromCssColorString("#ffcf5a"),
      },
    ];

    zones.forEach((zone) => {
      this.viewer?.entities.add({
        name: zone.name,
        position: Cartesian3.fromDegrees(zone.longitude, zone.latitude, 120),
        point: {
          pixelSize: 11,
          color: zone.color,
          outlineColor: Color.BLACK.withAlpha(0.75),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: zone.name,
          font: "13px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          pixelOffset: new Cartesian2(0, -24),
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.42),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });
  }
}
