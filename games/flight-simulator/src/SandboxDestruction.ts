import {
  Cartesian3,
  Color,
  ConstantPositionProperty,
  Entity,
  NearFarScalar,
  Viewer,
} from "cesium";
import type { SandboxStatus, SandboxZone } from "./types";

interface SandboxStructure {
  zone: SandboxZone;
  id: string;
  entity: Entity;
  position: Cartesian3;
  radiusMeters: number;
  intact: boolean;
}

interface SandboxZoneDefinition {
  id: SandboxZone;
  name: string;
  latitude: number;
  longitude: number;
  color: Color;
}

interface StructureSpec {
  name: string;
  eastMeters: number;
  northMeters: number;
  width: number;
  depth: number;
  height: number;
  color: Color;
}

const TRAINING_ZONE: SandboxZoneDefinition = {
  id: "training",
  name: "Training Sandbox",
  latitude: 34.1,
  longitude: -126.2,
  color: Color.fromCssColorString("#ffcf5a"),
};

const STRUCTURES: StructureSpec[] = [
  {
    name: "generic block building",
    eastMeters: -720,
    northMeters: -360,
    width: 94,
    depth: 78,
    height: 150,
    color: Color.fromCssColorString("#74d7ff"),
  },
  {
    name: "training hangar",
    eastMeters: -360,
    northMeters: 160,
    width: 170,
    depth: 74,
    height: 36,
    color: Color.fromCssColorString("#9ee493"),
  },
  {
    name: "test tower",
    eastMeters: 40,
    northMeters: -180,
    width: 48,
    depth: 48,
    height: 220,
    color: Color.fromCssColorString("#f6d365"),
  },
  {
    name: "crate stack",
    eastMeters: 340,
    northMeters: 320,
    width: 72,
    depth: 92,
    height: 72,
    color: Color.fromCssColorString("#ff9f7a"),
  },
  {
    name: "destructible wall",
    eastMeters: 690,
    northMeters: -90,
    width: 28,
    depth: 210,
    height: 82,
    color: Color.fromCssColorString("#c2d8ff"),
  },
  {
    name: "generic block building",
    eastMeters: 970,
    northMeters: 500,
    width: 86,
    depth: 104,
    height: 185,
    color: Color.fromCssColorString("#d7b7ff"),
  },
];

function offsetLatLon(latitude: number, longitude: number, eastMeters: number, northMeters: number) {
  const metersPerDegreeLatitude = 111_320;
  const metersPerDegreeLongitude = Math.max(12_000, metersPerDegreeLatitude * Math.cos((latitude * Math.PI) / 180));

  return {
    latitude: latitude + northMeters / metersPerDegreeLatitude,
    longitude: longitude + eastMeters / metersPerDegreeLongitude,
  };
}

export class SandboxDestruction {
  private readonly viewer: Viewer;
  private readonly getSurfaceHeight: (latitude: number, longitude: number) => number | undefined;
  private readonly onStatus: (status: SandboxStatus) => void;
  private readonly structures: SandboxStructure[] = [];
  private readonly fragments: Entity[] = [];

  constructor(
    viewer: Viewer,
    getSurfaceHeight: (latitude: number, longitude: number) => number | undefined,
    onStatus: (status: SandboxStatus) => void,
  ) {
    this.viewer = viewer;
    this.getSurfaceHeight = getSurfaceHeight;
    this.onStatus = onStatus;
  }

  init() {
    this.createZone(TRAINING_ZONE);
    this.emitStatus("Training Sandbox structures are ready.");
  }

  dispose() {
    [...this.structures.map((structure) => structure.entity), ...this.fragments].forEach((entity) => {
      this.viewer.entities.remove(entity);
    });
    this.structures.length = 0;
    this.fragments.length = 0;
  }

  resetZone(zone: SandboxZone = "training") {
    if (zone !== "training") {
      return;
    }

    this.clearFragments();

    this.structures.forEach((structure) => {
      structure.intact = true;
      structure.entity.show = true;
    });

    this.emitStatus("Training Sandbox reset.");
  }

  update(aircraftPosition: Cartesian3, speedMps: number) {
    const hit = this.structures.find((structure) => {
      if (!structure.intact) {
        return false;
      }

      return Cartesian3.distance(aircraftPosition, structure.position) <= structure.radiusMeters;
    });

    if (!hit) {
      return null;
    }

    hit.intact = false;
    hit.entity.show = false;
    this.spawnFragments(hit);

    const message = `Training Sandbox object safely broke apart at ${Math.round(speedMps * 3.6)} km/h.`;
    this.emitStatus(message);

    return { zone: hit.zone, message };
  }

  private createZone(zone: SandboxZoneDefinition) {
    STRUCTURES.forEach((spec, index) => {
      const location = offsetLatLon(zone.latitude, zone.longitude, spec.eastMeters, spec.northMeters);
      const surfaceHeight = this.getSurfaceHeight(location.latitude, location.longitude) ?? 0;
      const position = Cartesian3.fromDegrees(location.longitude, location.latitude, surfaceHeight + spec.height / 2);
      const entity = this.viewer.entities.add({
        name: `${zone.name} ${spec.name} ${index + 1}`,
        position: new ConstantPositionProperty(position),
        box: {
          dimensions: new Cartesian3(spec.width, spec.depth, spec.height),
          material: spec.color.withAlpha(0.58),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.72),
        },
        label: {
          text: "Training Sandbox",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          font: "12px sans-serif",
          scaleByDistance: new NearFarScalar(800, 1, 4500, 0.22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      this.structures.push({
        zone: zone.id,
        id: `${zone.id}-${index}`,
        entity,
        position,
        radiusMeters: Math.max(spec.width, spec.depth, spec.height) * 0.56,
        intact: true,
      });
    });
  }

  private spawnFragments(structure: SandboxStructure) {
    const fragmentOffsets = [
      new Cartesian3(34, 20, 16),
      new Cartesian3(-42, -24, 24),
      new Cartesian3(26, -38, -12),
      new Cartesian3(-18, 42, 8),
      new Cartesian3(0, 0, -28),
      new Cartesian3(56, -8, 34),
    ];

    fragmentOffsets.forEach((offset, index) => {
      const position = Cartesian3.add(structure.position, offset, new Cartesian3());
      const fragment = this.viewer.entities.add({
        name: `${structure.id}-fragment-${index + 1}`,
        position: new ConstantPositionProperty(position),
        box: {
          dimensions: new Cartesian3(24 + index * 5, 18 + index * 3, 14 + index * 2),
          material: TRAINING_ZONE.color.withAlpha(0.34),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.38),
        },
      });

      this.fragments.push(fragment);
    });

    const smoke = this.viewer.entities.add({
      name: `${structure.id}-smoke`,
      position: new ConstantPositionProperty(Cartesian3.add(structure.position, new Cartesian3(0, 0, 46), new Cartesian3())),
      ellipsoid: {
        radii: new Cartesian3(58, 48, 34),
        material: Color.LIGHTGRAY.withAlpha(0.22),
        outline: true,
        outlineColor: Color.WHITE.withAlpha(0.16),
      },
    });
    this.fragments.push(smoke);

    if (this.fragments.length > 96) {
      const stale = this.fragments.splice(0, this.fragments.length - 96);
      stale.forEach((entity) => this.viewer.entities.remove(entity));
    }
  }

  private clearFragments() {
    this.fragments.forEach((fragment) => this.viewer.entities.remove(fragment));
    this.fragments.length = 0;
  }

  private emitStatus(lastEvent: string) {
    this.onStatus({
      totalStructures: this.structures.length,
      intactStructures: this.structures.filter((structure) => structure.intact).length,
      activeZone: "training",
      lastEvent,
    });
  }
}
