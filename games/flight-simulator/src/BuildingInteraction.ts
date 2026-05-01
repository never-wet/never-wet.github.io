import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  Ray,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
} from "cesium";
import type { BuildingInfo } from "./types";

type PickFeature = {
  color?: Color;
  getProperty?: (name: string) => unknown;
  getPropertyNames?: () => string[];
};

function isFeature(value: unknown): value is PickFeature {
  return Boolean(
    value &&
      typeof value === "object" &&
      "getProperty" in value &&
      typeof (value as PickFeature).getProperty === "function",
  );
}

function stringifyProperty(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return String(value);
}

function property(feature: PickFeature, name: string) {
  return stringifyProperty(feature.getProperty?.(name));
}

export class BuildingInteraction {
  private readonly viewer: Viewer;
  private readonly onBuilding: (building: BuildingInfo) => void;
  private handler: ScreenSpaceEventHandler | null = null;
  private highlightedFeature: PickFeature | null = null;
  private highlightedColor: Color | null = null;
  private lastProximityCheck = 0;
  private buildings: Cesium3DTileset | null = null;

  constructor(viewer: Viewer, onBuilding: (building: BuildingInfo) => void) {
    this.viewer = viewer;
    this.onBuilding = onBuilding;
  }

  setBuildings(buildings: Cesium3DTileset | null) {
    this.buildings = buildings;
  }

  init() {
    this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement: { position: Cartesian2 }) => {
      this.pickFromScreen(movement.position);
    }, ScreenSpaceEventType.LEFT_CLICK);
  }

  dispose() {
    this.clearHighlight();

    if (this.handler && !this.handler.isDestroyed()) {
      this.handler.destroy();
    }
  }

  updateProximity(position: Cartesian3, forward: Cartesian3) {
    const now = performance.now();

    if (now - this.lastProximityCheck < 450 || !this.buildings) {
      return;
    }

    this.lastProximityCheck = now;

    try {
      const scene = this.viewer.scene as typeof this.viewer.scene & {
        pickFromRay?: (ray: Ray, objectsToExclude?: unknown[], width?: number) => { object?: unknown; position?: Cartesian3 };
      };
      const hit = scene.pickFromRay?.(new Ray(position, forward), [], 2);

      if (hit?.object && isFeature(hit.object)) {
        this.selectFeature(hit.object, "proximity", hit.position);
      }
    } catch {
      // Ray picking is best-effort; streamed 3D tiles may not be ready every frame.
    }
  }

  private pickFromScreen(position: Cartesian2) {
    const picked = this.viewer.scene.pick(position) as unknown;
    const feature = isFeature(picked) ? picked : null;

    if (!feature) {
      return;
    }

    const pickedPosition = this.pickWorldPosition(position);
    this.selectFeature(feature, "click", pickedPosition);
  }

  private pickWorldPosition(position: Cartesian2) {
    if (this.viewer.scene.pickPositionSupported) {
      try {
        const pickedPosition = this.viewer.scene.pickPosition(position);

        if (pickedPosition) {
          return pickedPosition;
        }
      } catch {
        // Fall through to ellipsoid picking.
      }
    }

    return this.viewer.camera.pickEllipsoid(position, this.viewer.scene.globe.ellipsoid);
  }

  private selectFeature(feature: PickFeature, source: "click" | "proximity", position?: Cartesian3) {
    this.highlight(feature);
    this.onBuilding(this.featureToInfo(feature, source, position));
  }

  private highlight(feature: PickFeature) {
    if (this.highlightedFeature === feature) {
      return;
    }

    this.clearHighlight();
    this.highlightedFeature = feature;
    this.highlightedColor = Color.clone(feature.color ?? Color.WHITE, new Color());

    try {
      feature.color = Color.fromCssColorString("#7df9ff").withAlpha(0.72);
    } catch {
      // Some feature types expose metadata but not color overrides.
    }
  }

  private clearHighlight() {
    if (this.highlightedFeature && this.highlightedColor) {
      try {
        this.highlightedFeature.color = this.highlightedColor;
      } catch {
        // Nothing to restore for non-colorable features.
      }
    }

    this.highlightedFeature = null;
    this.highlightedColor = null;
  }

  private featureToInfo(feature: PickFeature, source: "click" | "proximity", position?: Cartesian3): BuildingInfo {
    const propertyNames = feature.getPropertyNames?.() ?? [];
    const properties: Record<string, string> = {};

    propertyNames.forEach((name) => {
      const value = stringifyProperty(feature.getProperty?.(name));

      if (value) {
        properties[name] = value;
      }
    });

    const street = [property(feature, "addr:housenumber"), property(feature, "addr:street")]
      .filter(Boolean)
      .join(" ");
    const city = property(feature, "addr:city");
    const address = [street, city].filter(Boolean).join(", ") || "Address metadata unavailable";
    const name = property(feature, "name") || property(feature, "addr:housename") || "OSM Building";
    const type = property(feature, "building") || property(feature, "amenity") || property(feature, "shop") || "building";
    const cartographic = position ? Cartographic.fromCartesian(position) : null;

    return {
      id: property(feature, "id") || `${source}-${Date.now()}`,
      name,
      address,
      type,
      source,
      coordinates: cartographic
        ? {
            latitude: Number((cartographic.latitude * 180 / Math.PI).toFixed(6)),
            longitude: Number((cartographic.longitude * 180 / Math.PI).toFixed(6)),
            heightMeters: Number(cartographic.height.toFixed(1)),
          }
        : undefined,
      properties,
    };
  }
}

