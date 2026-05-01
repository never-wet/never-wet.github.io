"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";
import { Crosshair, RadioTower, Satellite } from "lucide-react";
import type { IntelCategory, IntelEvent, RiskLevel } from "@/types";

const TILE_ENDPOINTS = {
  imagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  reference: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  transportation: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  detailMap: [
    "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
  ]
};

const GLYPHS_URL = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

const categoryColors: Record<IntelCategory, string> = {
  geopolitics: "#8fb7ff",
  economy: "#66d9a8",
  conflict: "#ff6b63",
  infrastructure: "#f4b24f",
  energy: "#ffd166",
  technology: "#9ad7ff"
};

const riskRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

type DetailPlaceKind = "city" | "lake" | "river";

interface DetailPlace {
  kind: DetailPlaceKind;
  name: string;
  lat: number;
  lon: number;
  priority: number;
}

interface EventProperties {
  id: string;
  title: string;
  category: IntelCategory;
  riskLevel: RiskLevel;
  riskRank: number;
  severity: number;
}

interface DetailPlaceProperties {
  kind: DetailPlaceKind;
  name: string;
  priority: number;
}

interface GlobePanelProps {
  events: IntelEvent[];
  onEventSelect: (event: IntelEvent) => void;
}

const DETAIL_PLACES: DetailPlace[] = [
  { kind: "city", name: "New York", lat: 40.7128, lon: -74.006, priority: 1 },
  { kind: "city", name: "Seattle", lat: 47.6062, lon: -122.3321, priority: 2 },
  { kind: "city", name: "San Francisco", lat: 37.7749, lon: -122.4194, priority: 2 },
  { kind: "city", name: "Los Angeles", lat: 34.0522, lon: -118.2437, priority: 1 },
  { kind: "city", name: "Sacramento", lat: 38.5816, lon: -121.4944, priority: 3 },
  { kind: "city", name: "San Jose", lat: 37.3382, lon: -121.8863, priority: 3 },
  { kind: "city", name: "Las Vegas", lat: 36.1716, lon: -115.1391, priority: 2 },
  { kind: "city", name: "Phoenix", lat: 33.4484, lon: -112.074, priority: 2 },
  { kind: "city", name: "Salt Lake City", lat: 40.7608, lon: -111.891, priority: 3 },
  { kind: "city", name: "Denver", lat: 39.7392, lon: -104.9903, priority: 2 },
  { kind: "city", name: "Chicago", lat: 41.8781, lon: -87.6298, priority: 1 },
  { kind: "city", name: "Dallas", lat: 32.7767, lon: -96.797, priority: 2 },
  { kind: "city", name: "Houston", lat: 29.7604, lon: -95.3698, priority: 2 },
  { kind: "city", name: "Toronto", lat: 43.6532, lon: -79.3832, priority: 2 },
  { kind: "city", name: "Mexico City", lat: 19.4326, lon: -99.1332, priority: 1 },
  { kind: "city", name: "Sao Paulo", lat: -23.5558, lon: -46.6396, priority: 1 },
  { kind: "city", name: "London", lat: 51.5072, lon: -0.1276, priority: 1 },
  { kind: "city", name: "Paris", lat: 48.8566, lon: 2.3522, priority: 1 },
  { kind: "city", name: "Berlin", lat: 52.52, lon: 13.405, priority: 2 },
  { kind: "city", name: "Moscow", lat: 55.7558, lon: 37.6173, priority: 1 },
  { kind: "city", name: "Cairo", lat: 30.0444, lon: 31.2357, priority: 1 },
  { kind: "city", name: "Lagos", lat: 6.5244, lon: 3.3792, priority: 1 },
  { kind: "city", name: "Johannesburg", lat: -26.2041, lon: 28.0473, priority: 2 },
  { kind: "city", name: "Dubai", lat: 25.2048, lon: 55.2708, priority: 2 },
  { kind: "city", name: "Delhi", lat: 28.6139, lon: 77.209, priority: 1 },
  { kind: "city", name: "Beijing", lat: 39.9042, lon: 116.4074, priority: 1 },
  { kind: "city", name: "Tokyo", lat: 35.6762, lon: 139.6503, priority: 1 },
  { kind: "city", name: "Seoul", lat: 37.5665, lon: 126.978, priority: 2 },
  { kind: "city", name: "Sydney", lat: -33.8688, lon: 151.2093, priority: 1 },
  { kind: "lake", name: "Lake Superior", lat: 47.7, lon: -87.5, priority: 2 },
  { kind: "lake", name: "Lake Michigan", lat: 44.0, lon: -87.0, priority: 2 },
  { kind: "lake", name: "Lake Huron", lat: 44.8, lon: -82.4, priority: 3 },
  { kind: "lake", name: "Lake Erie", lat: 42.2, lon: -81.2, priority: 3 },
  { kind: "lake", name: "Lake Ontario", lat: 43.7, lon: -77.9, priority: 3 },
  { kind: "lake", name: "Lake Tahoe", lat: 39.0968, lon: -120.0324, priority: 4 },
  { kind: "lake", name: "Lake Mead", lat: 36.25, lon: -114.39, priority: 4 },
  { kind: "lake", name: "Lake Victoria", lat: -1.0, lon: 33.0, priority: 2 },
  { kind: "lake", name: "Lake Tanganyika", lat: -6.1, lon: 29.5, priority: 3 },
  { kind: "lake", name: "Lake Baikal", lat: 53.5, lon: 108.0, priority: 3 },
  { kind: "lake", name: "Caspian Sea", lat: 41.4, lon: 51.0, priority: 2 },
  { kind: "lake", name: "Great Salt Lake", lat: 41.2, lon: -112.6, priority: 4 },
  { kind: "river", name: "Mississippi River", lat: 35.1, lon: -90.1, priority: 4 },
  { kind: "river", name: "Colorado River", lat: 36.1, lon: -112.1, priority: 4 },
  { kind: "river", name: "Columbia River", lat: 45.8, lon: -121.0, priority: 4 },
  { kind: "river", name: "Nile River", lat: 26.0, lon: 31.0, priority: 3 },
  { kind: "river", name: "Amazon River", lat: -3.1, lon: -60.0, priority: 3 },
  { kind: "river", name: "Yangtze River", lat: 31.2, lon: 121.0, priority: 3 },
  { kind: "river", name: "Danube River", lat: 45.3, lon: 18.8, priority: 4 },
  { kind: "river", name: "Rhine River", lat: 50.0, lon: 7.6, priority: 4 }
];

const categoryColorExpression = [
  "match",
  ["get", "category"],
  "geopolitics",
  categoryColors.geopolitics,
  "economy",
  categoryColors.economy,
  "conflict",
  categoryColors.conflict,
  "infrastructure",
  categoryColors.infrastructure,
  "energy",
  categoryColors.energy,
  "technology",
  categoryColors.technology,
  categoryColors.technology
];

const clusterRiskExpression = ["coalesce", ["get", "maxRisk"], 1];

const emptyEvents: FeatureCollection<Point, EventProperties> = {
  type: "FeatureCollection",
  features: []
};

const detailPlaces: FeatureCollection<Point, DetailPlaceProperties> = {
  type: "FeatureCollection",
  features: DETAIL_PLACES.map((place) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [place.lon, place.lat]
    },
    properties: {
      kind: place.kind,
      name: place.name,
      priority: place.priority
    }
  }))
};

function toEventFeatureCollection(events: IntelEvent[]): FeatureCollection<Point, EventProperties> {
  return {
    type: "FeatureCollection",
    features: events.map<Feature<Point, EventProperties>>((event) => ({
      type: "Feature",
      id: event.id,
      geometry: {
        type: "Point",
        coordinates: [event.lon, event.lat]
      },
      properties: {
        id: event.id,
        title: event.title,
        category: event.category,
        riskLevel: event.riskLevel,
        riskRank: riskRank[event.riskLevel],
        severity: event.severity
      }
    }))
  };
}

function riskMax(a: RiskLevel, b: RiskLevel) {
  return riskRank[b] > riskRank[a] ? b : a;
}

function zoomStageFor(zoom: number) {
  if (zoom < 2.3) return { level: 1, label: "Global", detail: "continents and oceans" };
  if (zoom < 4.6) return { level: 2, label: "Country", detail: "borders and capitals" };
  if (zoom < 7.3) return { level: 3, label: "Region", detail: "states, lakes, rivers" };
  if (zoom < 10.8) return { level: 4, label: "City", detail: "roads and local labels" };
  return { level: 5, label: "Satellite", detail: "high-detail imagery" };
}

function createGlobeStyle(): StyleSpecification {
  const style = {
    version: 8,
    name: "Global Intelligence Tiled Globe",
    glyphs: GLYPHS_URL,
    projection: { type: "globe" },
    sources: {
      "satellite-imagery": {
        type: "raster",
        tiles: [TILE_ENDPOINTS.imagery],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "Source: Esri, Maxar, Earthstar Geographics, GIS User Community"
      },
      "reference-overlay": {
        type: "raster",
        tiles: [TILE_ENDPOINTS.reference],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "Source: Esri"
      },
      "transportation-overlay": {
        type: "raster",
        tiles: [TILE_ENDPOINTS.transportation],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "Source: Esri"
      },
      "detail-map-overlay": {
        type: "raster",
        tiles: TILE_ENDPOINTS.detailMap,
        tileSize: 256,
        minzoom: 0,
        maxzoom: 20,
        attribution: "CARTO, OpenStreetMap contributors"
      },
      events: {
        type: "geojson",
        data: emptyEvents,
        cluster: true,
        clusterRadius: 24,
        clusterMaxZoom: 3,
        clusterMinPoints: 4,
        promoteId: "id",
        clusterProperties: {
          maxRisk: ["max", ["get", "riskRank"]],
          maxSeverity: ["max", ["get", "severity"]]
        }
      },
      "event-density": {
        type: "geojson",
        data: emptyEvents,
        promoteId: "id"
      },
      "detail-places": {
        type: "geojson",
        data: detailPlaces
      }
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#05070b"
        }
      },
      {
        id: "satellite-base",
        type: "raster",
        source: "satellite-imagery",
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-brightness-min": 0.02,
          "raster-brightness-max": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.62,
            3,
            0.72,
            8,
            0.86,
            12,
            0.95
          ],
          "raster-contrast": 0.1,
          "raster-saturation": -0.1,
          "raster-fade-duration": 240,
          "raster-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            10,
            1,
            12.5,
            0.7,
            15,
            0.42
          ]
        }
      },
      {
        id: "deep-detail-map",
        type: "raster",
        source: "detail-map-overlay",
        minzoom: 9.2,
        maxzoom: 20,
        paint: {
          "raster-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0,
            10.4,
            0.68,
            12.5,
            0.92,
            15,
            1
          ],
          "raster-brightness-min": 0.13,
          "raster-brightness-max": 1,
          "raster-contrast": 0.16,
          "raster-saturation": -0.05,
          "raster-fade-duration": 180
        }
      },
      {
        id: "reference-labels-boundaries",
        type: "raster",
        source: "reference-overlay",
        minzoom: 1.9,
        maxzoom: 19,
        paint: {
          "raster-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1.7,
            0,
            2.4,
            0.54,
            5,
            0.78,
            10,
            0.9
          ],
          "raster-brightness-min": 0,
          "raster-brightness-max": 0.92,
          "raster-contrast": 0.16,
          "raster-saturation": -0.22,
          "raster-fade-duration": 180
        }
      },
      {
        id: "transportation-roads",
        type: "raster",
        source: "transportation-overlay",
        minzoom: 7.2,
        maxzoom: 19,
        paint: {
          "raster-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            0,
            8.5,
            0.48,
            11,
            0.78,
            14,
            0.92
          ],
          "raster-brightness-max": 0.88,
          "raster-saturation": -0.26,
          "raster-fade-duration": 180
        }
      },
      {
        id: "detail-city-dots",
        type: "circle",
        source: "detail-places",
        minzoom: 4.7,
        filter: ["==", ["get", "kind"], "city"],
        paint: {
          "circle-color": "#eef3fb",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4.7, 2.2, 9, 3.8, 13, 4.8],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 4.7, 0, 5.2, 0.72, 12, 0.9],
          "circle-stroke-color": "rgba(5, 7, 11, 0.9)",
          "circle-stroke-width": 1
        }
      },
      {
        id: "detail-water-dots",
        type: "circle",
        source: "detail-places",
        minzoom: 5.5,
        filter: ["in", ["get", "kind"], ["literal", ["lake", "river"]]],
        paint: {
          "circle-color": "#9ad7ff",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5.5, 2.4, 10, 4.2, 14, 5.2],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 5.5, 0, 6.2, 0.68, 12, 0.86],
          "circle-stroke-color": "rgba(5, 7, 11, 0.88)",
          "circle-stroke-width": 1
        }
      },
      {
        id: "detail-city-labels",
        type: "symbol",
        source: "detail-places",
        minzoom: 4.9,
        filter: ["==", ["get", "kind"], "city"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4.9, 10, 8, 12, 12, 14],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.7,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-sort-key": ["get", "priority"]
        },
        paint: {
          "text-color": "#eef3fb",
          "text-halo-color": "rgba(4, 7, 12, 0.92)",
          "text-halo-width": 1.5,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 4.8, 0, 5.4, 1]
        }
      },
      {
        id: "detail-water-labels",
        type: "symbol",
        source: "detail-places",
        minzoom: 5.8,
        filter: ["in", ["get", "kind"], ["literal", ["lake", "river"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5.8, 10, 9, 12, 13, 13],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.8,
          "text-justify": "auto",
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-sort-key": ["get", "priority"]
        },
        paint: {
          "text-color": "#9ad7ff",
          "text-halo-color": "rgba(4, 7, 12, 0.94)",
          "text-halo-width": 1.6,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 5.7, 0, 6.3, 1]
        }
      },
      {
        id: "event-density-dots",
        type: "circle",
        source: "event-density",
        minzoom: 0,
        paint: {
          "circle-color": categoryColorExpression,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0.6, 1.35, 3, 2.1, 7, 2.7, 12, 2.2],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 0.6, 0.52, 4, 0.62, 9, 0.42],
          "circle-stroke-color": "rgba(5, 7, 11, 0.65)",
          "circle-stroke-width": 0.55
        }
      },
      {
        id: "event-cluster-glow",
        type: "circle",
        source: "events",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            clusterRiskExpression,
            "rgba(102, 217, 168, 0.62)",
            2,
            "rgba(255, 209, 102, 0.66)",
            3,
            "rgba(255, 155, 84, 0.72)",
            4,
            "rgba(255, 77, 87, 0.76)"
          ],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 24, 5, 42, 8, 50],
          "circle-blur": 0.82,
          "circle-opacity": 0.42
        }
      },
      {
        id: "event-clusters",
        type: "circle",
        source: "events",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            clusterRiskExpression,
            "rgba(102, 217, 168, 0.88)",
            2,
            "rgba(255, 209, 102, 0.9)",
            3,
            "rgba(255, 155, 84, 0.92)",
            4,
            "rgba(255, 77, 87, 0.94)"
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0.5,
            ["step", ["get", "point_count"], 12, 5, 16, 12, 20, 24, 25],
            5,
            ["step", ["get", "point_count"], 18, 5, 23, 12, 29, 24, 36],
            8,
            ["step", ["get", "point_count"], 23, 5, 30, 12, 38, 24, 46]
          ],
          "circle-stroke-color": "rgba(238, 243, 251, 0.72)",
          "circle-stroke-width": 1.15
        }
      },
      {
        id: "event-cluster-count",
        type: "symbol",
        source: "events",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 6, 12, 10, 13],
          "text-allow-overlap": false
        },
        paint: {
          "text-color": "#05070b",
          "text-halo-color": "rgba(238, 243, 251, 0.32)",
          "text-halo-width": 0.8
        }
      },
      {
        id: "event-point-glow",
        type: "circle",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": categoryColorExpression,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3,
            ["+", 11, ["*", ["get", "severity"], 2.4]],
            8,
            ["+", 17, ["*", ["get", "severity"], 2.6]],
            13,
            ["+", 13, ["*", ["get", "severity"], 1.8]]
          ],
          "circle-blur": 0.86,
          "circle-opacity": [
            "step",
            ["get", "riskRank"],
            0.34,
            2,
            0.42,
            3,
            0.54,
            4,
            0.68
          ]
        }
      },
      {
        id: "event-points",
        type: "circle",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": categoryColorExpression,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            ["+", 3.2, ["*", ["get", "severity"], 0.9]],
            7,
            ["+", 4.5, ["*", ["get", "severity"], 1.05]],
            12,
            ["+", 3.8, ["*", ["get", "severity"], 0.82]]
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ffffff",
            "rgba(5, 7, 11, 0.9)"
          ],
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            1.2
          ],
          "circle-opacity": 0.96
        }
      }
    ]
  };

  return style as StyleSpecification;
}

export function GlobePanel({ events, onEventSelect }: GlobePanelProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const eventsRef = useRef(events);
  const previousSelectedIdRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1.35);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const eventData = useMemo(() => toEventFeatureCollection(events), [events]);
  const zoomStage = zoomStageFor(zoom);
  const highestRisk = events.reduce<RiskLevel>((highest, event) => riskMax(highest, event.riskLevel), "low");
  const elevatedCount = events.filter((event) => event.riskLevel === "high" || event.riskLevel === "critical").length;

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const node = mapNodeRef.current;
    if (!node) return;

    const map = new maplibregl.Map({
      container: node,
      style: createGlobeStyle(),
      center: [-87.7, 41.9],
      zoom: 1.35,
      minZoom: 0.65,
      maxZoom: 18,
      bearing: -16,
      pitch: 0,
      renderWorldCopies: false,
      maplibreLogo: false,
      attributionControl: {
        compact: true,
        customAttribution: "MapLibre"
      },
      fadeDuration: 180,
      maxTileCacheZoomLevels: 6,
      cancelPendingTileRequestsWhileZooming: false,
      refreshExpiredTiles: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      aroundCenter: true
    });

    mapRef.current = map;
    map.touchZoomRotate.enableRotation();
    map.dragRotate.enable();
    map.doubleClickZoom.enable();

    let raf = 0;
    const syncZoom = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        setZoom(Number(map.getZoom().toFixed(2)));
      });
    };

    const pickEvent = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id as string | undefined;
      const picked = id ? eventsRef.current.find((item) => item.id === id) : undefined;
      if (!picked) return;

      setSelectedId(id);
      onEventSelect(picked);
    };

    const expandCluster = async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = Number(feature?.properties?.cluster_id);
      const coordinates = (feature?.geometry as Point | undefined)?.coordinates;
      const source = map.getSource("events") as GeoJSONSource | undefined;

      if (!source || !Number.isFinite(clusterId) || !coordinates) return;

      const expansionZoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: coordinates as [number, number],
        zoom: Math.min(expansionZoom + 0.6, 11),
        duration: 520
      });
    };

    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("load", () => {
      const source = map.getSource("events") as GeoJSONSource | undefined;
      const densitySource = map.getSource("event-density") as GeoJSONSource | undefined;
      source?.setData(toEventFeatureCollection(eventsRef.current));
      densitySource?.setData(toEventFeatureCollection(eventsRef.current));
      setReady(true);
      syncZoom();
    });
    map.on("move", syncZoom);
    map.on("click", "event-points", pickEvent);
    map.on("click", "event-clusters", expandCluster);
    map.on("mouseenter", "event-points", setPointer);
    map.on("mouseleave", "event-points", clearPointer);
    map.on("mouseenter", "event-clusters", setPointer);
    map.on("mouseleave", "event-clusters", clearPointer);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (shellRef.current) resizeObserver.observe(shellRef.current);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onEventSelect]);

  useEffect(() => {
    const source = mapRef.current?.getSource("events") as GeoJSONSource | undefined;
    const densitySource = mapRef.current?.getSource("event-density") as GeoJSONSource | undefined;
    source?.setData(eventData);
    densitySource?.setData(eventData);
  }, [eventData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const previousId = previousSelectedIdRef.current;
    if (previousId) {
      map.setFeatureState({ source: "events", id: previousId }, { selected: false });
    }

    if (selectedId) {
      map.setFeatureState({ source: "events", id: selectedId }, { selected: true });
    }

    previousSelectedIdRef.current = selectedId;
  }, [ready, selectedId]);

  return (
    <section ref={shellRef} className="globe-panel" aria-label="Interactive global intelligence globe">
      <div ref={mapNodeRef} className="globe-map" />

      <div className="globe-hud globe-hud--top">
        <span><Satellite size={14} /> Tile zoom L{zoomStage.level}</span>
        <strong>{zoomStage.label}</strong>
        <small>{zoomStage.detail}</small>
      </div>

      <div className="globe-hud globe-hud--risk">
        <span><Crosshair size={14} /> Risk</span>
        <strong className={`risk-text risk-text--${highestRisk}`}>{highestRisk}</strong>
        <small>{elevatedCount} elevated signals</small>
      </div>

      {!ready ? <div className="globe-loading">Loading tiled globe</div> : null}

      <div className="globe-legend" aria-label="Category legend">
        <span><RadioTower size={13} /> {events.length} live points</span>
        {Object.entries(categoryColors).map(([category, color]) => (
          <span key={category}>
            <i style={{ background: color }} />
            {category}
          </span>
        ))}
      </div>
    </section>
  );
}
