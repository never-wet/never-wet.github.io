"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getRouteCenter, interpolateGreatCircle, interpolatePolyline } from "@/lib/geo";
import { markers, routeColors, routes } from "@/lib/route-data";
import { useRouteMapStore } from "@/store/useRouteMapStore";
import type { Coordinate, LayerKey, RouteMarker, RouteRecord } from "@/types";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const EMPTY_LINES: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };
const EMPTY_POINTS: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };

type RouteFeatureProperties = {
  id: string;
  name: string;
  layer: Exclude<LayerKey, "chokepoints">;
  type: string;
  selected: boolean;
  color: string;
};

type MarkerFeatureProperties = {
  id: string;
  name: string;
  type: RouteMarker["type"];
  code: string;
  label: string;
  selected: boolean;
  color: string;
};

type ParticleFeatureProperties = {
  id: string;
  routeId: string;
  color: string;
  radius: number;
};

type RouteLabelFeatureProperties = {
  id: string;
  name: string;
  layer: Exclude<LayerKey, "chokepoints">;
  selected: boolean;
  color: string;
};

interface FlowParticle {
  id: string;
  routeId: string;
  position: Coordinate;
  color: string;
  radius: number;
}

const clickableLayerIds = [
  "flight-routes",
  "shipping-routes",
  "historical-routes",
  "path-labels",
  "airport-markers",
  "port-markers",
  "chokepoint-markers"
];

type MapLayer = Parameters<MapLibreMap["addLayer"]>[0];

function cssColor(color: [number, number, number, number]) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255).toFixed(3)})`;
}

function getMarkerLayer(marker: RouteMarker): LayerKey {
  if (marker.type === "airport") return "flight";
  if (marker.type === "port") return "shipping";
  return "chokepoints";
}

function getMarkerColor(marker: RouteMarker) {
  if (marker.type === "airport") return "rgba(84, 205, 255, 0.94)";
  if (marker.type === "port") return "rgba(38, 239, 163, 0.94)";
  return "rgba(255, 83, 122, 0.96)";
}

function getRouteCoordinates(route: RouteRecord): Coordinate[] {
  if (route.layer !== "flight") return unwrapCoordinates(route.coordinates);

  const start = route.coordinates[0];
  const end = route.coordinates[route.coordinates.length - 1];
  const coordinates = Array.from({ length: 72 }, (_, index) =>
    interpolateGreatCircle(start, end, index / 71)
  );
  return unwrapCoordinates(coordinates);
}

function unwrapCoordinates(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length < 2) return coordinates;

  const unwrapped: Coordinate[] = [coordinates[0]];
  for (const coordinate of coordinates.slice(1)) {
    const previous = unwrapped[unwrapped.length - 1];
    let lng = coordinate[0];
    while (lng - previous[0] > 180) lng -= 360;
    while (lng - previous[0] < -180) lng += 360;
    unwrapped.push([lng, coordinate[1]]);
  }
  return unwrapped;
}

function buildRoutesGeoJson(activeRoutes: RouteRecord[], selectedId?: string): FeatureCollection<LineString, RouteFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: activeRoutes.map((route): Feature<LineString, RouteFeatureProperties> => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: getRouteCoordinates(route)
      },
      properties: {
        id: route.id,
        name: route.name,
        layer: route.layer,
        type: route.type,
        selected: selectedId === route.id,
        color: selectedId === route.id ? "rgba(255, 255, 255, 0.98)" : cssColor(routeColors[route.layer])
      }
    }))
  };
}

function buildMarkersGeoJson(visibleMarkers: RouteMarker[], selectedId?: string): FeatureCollection<Point, MarkerFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: visibleMarkers.map((marker): Feature<Point, MarkerFeatureProperties> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: marker.coordinates
      },
      properties: {
        id: marker.id,
        name: marker.name,
        type: marker.type,
        code: marker.code ?? "",
        label: marker.code ?? marker.name,
        selected: selectedId === marker.id,
        color: selectedId === marker.id ? "rgba(255, 255, 255, 0.98)" : getMarkerColor(marker)
      }
    }))
  };
}

function buildSelectionGeoJson(visibleMarkers: RouteMarker[], selectedId?: string): FeatureCollection<Point, MarkerFeatureProperties> {
  const selected = visibleMarkers.find((marker) => marker.id === selectedId);
  if (!selected) return EMPTY_POINTS as FeatureCollection<Point, MarkerFeatureProperties>;
  return buildMarkersGeoJson([selected], selectedId);
}

function buildPathLabelsGeoJson(activeRoutes: RouteRecord[], selectedId?: string): FeatureCollection<Point, RouteLabelFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: activeRoutes.map((route): Feature<Point, RouteLabelFeatureProperties> => {
      const coordinates = getRouteCoordinates(route);
      const position =
        route.layer === "flight"
          ? getRouteCenter(route)
          : interpolatePolyline(coordinates, 0.5);

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: position
        },
        properties: {
          id: route.id,
          name: route.name,
          layer: route.layer,
          selected: selectedId === route.id,
          color: selectedId === route.id ? "rgba(255, 255, 255, 0.98)" : cssColor(routeColors[route.layer])
        }
      };
    })
  };
}

function buildFlowParticles(activeRoutes: RouteRecord[], time: number): FlowParticle[] {
  return activeRoutes.flatMap((route, routeIndex) => {
    const color = cssColor(routeColors[route.layer]);
    const count = route.layer === "shipping" ? 4 : route.layer === "flight" ? 3 : 2;
    const speed = route.layer === "flight" ? 0.18 : route.layer === "shipping" ? 0.105 : 0.055;
    const radius = route.layer === "flight" ? 4.5 : route.layer === "shipping" ? 5.2 : 4;

    return Array.from({ length: count }, (_, index) => {
      const t = (time * speed + index / count + routeIndex * 0.041) % 1;
      const position =
        route.layer === "flight"
          ? interpolateGreatCircle(route.coordinates[0], route.coordinates[route.coordinates.length - 1], t)
          : interpolatePolyline(route.coordinates, t);

      return {
        id: `${route.id}-${index}`,
        routeId: route.id,
        position,
        color,
        radius
      };
    });
  });
}

function buildParticlesGeoJson(particles: FlowParticle[]): FeatureCollection<Point, ParticleFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: particles.map((particle): Feature<Point, ParticleFeatureProperties> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: particle.position
      },
      properties: {
        id: particle.id,
        routeId: particle.routeId,
        color: particle.color,
        radius: particle.radius
      }
    }))
  };
}

function getGeoJsonSource(map: MapLibreMap, id: string) {
  const source = map.getSource(id);
  return source && "setData" in source ? (source as GeoJSONSource) : undefined;
}

function addSourceIfMissing(map: MapLibreMap, id: string, data: FeatureCollection) {
  if (map.getSource(id)) return;
  map.addSource(id, {
    type: "geojson",
    data,
    lineMetrics: true
  });
}

function selectedExpression(selectedValue: number, defaultValue: number) {
  return ["case", ["boolean", ["get", "selected"], false], selectedValue, defaultValue];
}

function routeFilter(layer: Exclude<LayerKey, "chokepoints">) {
  return ["==", ["get", "layer"], layer];
}

function addLineLayer(map: MapLibreMap, layer: MapLayer) {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer);
}

function addMapSourcesAndLayers(map: MapLibreMap, selectItem: (kind: "route" | "marker", id: string) => void) {
  addSourceIfMissing(map, "surface-routes", EMPTY_LINES);
  addSourceIfMissing(map, "surface-markers", EMPTY_POINTS);
  addSourceIfMissing(map, "path-labels", EMPTY_POINTS);
  addSourceIfMissing(map, "route-particles", EMPTY_POINTS);
  addSourceIfMissing(map, "selection-ring", EMPTY_POINTS);

  addLineLayer(map, {
    id: "flight-routes-glow",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("flight"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(7, 4),
      "line-opacity": 0.22,
      "line-blur": 3.2
    }
  } as unknown as MapLayer);

  addLineLayer(map, {
    id: "flight-routes",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("flight"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(3.2, 1.7),
      "line-opacity": 0.93
    }
  } as unknown as MapLayer);

  addLineLayer(map, {
    id: "shipping-routes-glow",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("shipping"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(8, 4.5),
      "line-opacity": 0.21,
      "line-blur": 3
    }
  } as unknown as MapLayer);

  addLineLayer(map, {
    id: "shipping-routes",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("shipping"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(4.2, 2.2),
      "line-opacity": 0.9
    }
  } as unknown as MapLayer);

  addLineLayer(map, {
    id: "historical-routes-glow",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("historical"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(7, 4),
      "line-opacity": 0.2,
      "line-blur": 2.8,
      "line-dasharray": [1.8, 1.15]
    }
  } as unknown as MapLayer);

  addLineLayer(map, {
    id: "historical-routes",
    type: "line",
    source: "surface-routes",
    filter: routeFilter("historical"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": selectedExpression(4, 2),
      "line-opacity": 0.9,
      "line-dasharray": [1.8, 1.15]
    }
  } as unknown as MapLayer);

  if (!map.getLayer("route-particles")) {
    map.addLayer({
      id: "route-particles",
      type: "circle",
      source: "route-particles",
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["get", "radius"],
        "circle-opacity": 0.94,
        "circle-blur": 0.2,
        "circle-stroke-color": "rgba(255, 255, 255, 0.75)",
        "circle-stroke-width": 0.7,
        "circle-pitch-alignment": "map",
        "circle-pitch-scale": "map"
      }
    } as unknown as MapLayer);
  }

  if (!map.getLayer("path-labels")) {
    map.addLayer({
      id: "path-labels",
      type: "symbol",
      source: "path-labels",
      layout: {
        "text-field": ["get", "name"],
        "text-size": [
          "case",
          ["boolean", ["get", "selected"], false],
          14,
          ["==", ["get", "layer"], "historical"],
          12.5,
          10.5
        ],
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": ["get", "color"],
        "text-halo-color": "rgba(3, 7, 10, 0.96)",
        "text-halo-width": 1.8,
        "text-opacity": [
          "case",
          ["boolean", ["get", "selected"], false],
          1,
          ["==", ["get", "layer"], "historical"],
          0.95,
          0.68
        ]
      }
    } as unknown as MapLayer);
  }

  addMarkerLayer(map, "airport-markers", "airport", 5.2, 8.8);
  addMarkerLayer(map, "port-markers", "port", 5.6, 9.2);
  addMarkerLayer(map, "chokepoint-markers", "chokepoint", 7.2, 11);

  if (!map.getLayer("selection-ring")) {
    map.addLayer({
      id: "selection-ring",
      type: "circle",
      source: "selection-ring",
      paint: {
        "circle-radius": 18,
        "circle-color": "rgba(255, 255, 255, 0)",
        "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
        "circle-stroke-width": 2,
        "circle-pitch-alignment": "map",
        "circle-pitch-scale": "map"
      }
    } as unknown as MapLayer);
  }

  if (!map.getLayer("route-labels")) {
    map.addLayer({
      id: "route-labels",
      type: "symbol",
      source: "surface-markers",
      filter: ["!=", ["get", "type"], "chokepoint"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-offset": [0, -1.45],
        "text-anchor": "bottom",
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": ["case", ["boolean", ["get", "selected"], false], "#ffffff", "#b9ccca"],
        "text-halo-color": "rgba(3, 7, 10, 0.92)",
        "text-halo-width": 1.6,
        "text-opacity": 0.92
      }
    } as unknown as MapLayer);
  }

  if (!map.getLayer("chokepoint-labels")) {
    map.addLayer({
      id: "chokepoint-labels",
      type: "symbol",
      source: "surface-markers",
      filter: ["==", ["get", "type"], "chokepoint"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-offset": [0, -1.55],
        "text-anchor": "bottom",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": ["case", ["boolean", ["get", "selected"], false], "#ffffff", "#ffc3d0"],
        "text-halo-color": "rgba(3, 7, 10, 0.96)",
        "text-halo-width": 1.8,
        "text-opacity": 0.98
      }
    } as unknown as MapLayer);
  }

  clickableLayerIds.forEach((layerId) => {
    map.on("click", layerId, (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (typeof id !== "string") return;
      selectItem(layerId.includes("routes") || layerId === "path-labels" ? "route" : "marker", id);
    });
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  });
}

function addMarkerLayer(map: MapLibreMap, id: string, markerType: RouteMarker["type"], radius: number, selectedRadius: number) {
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: "circle",
    source: "surface-markers",
    filter: ["==", ["get", "type"], markerType],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": selectedExpression(selectedRadius, radius),
      "circle-opacity": 0.96,
      "circle-stroke-color": markerType === "chokepoint" ? "rgba(255, 194, 208, 0.92)" : "rgba(4, 10, 12, 0.96)",
      "circle-stroke-width": markerType === "chokepoint" ? 1.5 : 1.1,
      "circle-pitch-alignment": "map",
      "circle-pitch-scale": "map"
    }
  } as unknown as MapLayer);
}

function updateMapData(
  map: MapLibreMap,
  activeRoutes: RouteRecord[],
  visibleMarkers: RouteMarker[],
  selectedId?: string
) {
  getGeoJsonSource(map, "surface-routes")?.setData(buildRoutesGeoJson(activeRoutes, selectedId));
  getGeoJsonSource(map, "surface-markers")?.setData(buildMarkersGeoJson(visibleMarkers, selectedId));
  getGeoJsonSource(map, "path-labels")?.setData(buildPathLabelsGeoJson(activeRoutes, selectedId));
  getGeoJsonSource(map, "selection-ring")?.setData(buildSelectionGeoJson(visibleMarkers, selectedId));
}

function flyToItem(map: MapLibreMap, itemId?: string) {
  if (!itemId) return;

  const route = routes.find((candidate) => candidate.id === itemId);
  if (route) {
    map.easeTo({
      center: getRouteCenter(route),
      zoom: route.layer === "flight" ? 2.5 : 3.15,
      pitch: route.layer === "flight" ? 18 : 14,
      bearing: route.layer === "flight" ? -12 : 0,
      duration: 850
    });
    return;
  }

  const marker = markers.find((candidate) => candidate.id === itemId);
  if (marker) {
    map.easeTo({
      center: marker.coordinates,
      zoom: marker.type === "chokepoint" ? 5.3 : 4.25,
      pitch: 18,
      bearing: marker.type === "chokepoint" ? 18 : 0,
      duration: 850
    });
  }
}

function fitOverview(map: MapLibreMap, mode: "globe" | "mercator") {
  if (mode === "mercator") {
    map.easeTo({
      center: [12, 18],
      zoom: window.innerWidth < 900 ? 0.88 : 1.12,
      pitch: 0,
      bearing: 0,
      duration: 700
    });
    return;
  }

  map.easeTo({
    center: [18, 22],
    zoom: window.innerWidth < 900 ? 1 : 1.35,
    pitch: 14,
    bearing: 0,
    duration: 700
  });
}

function applyProjection(map: MapLibreMap, mode: "globe" | "mercator") {
  const projectionTarget = map as unknown as {
    setProjection?: (projection: { type: "globe" | "mercator" }) => void;
  };

  try {
    projectionTarget.setProjection?.({ type: mode });
  } catch {
    // Older MapLibre builds can ignore globe projection without breaking the map.
  }
}

export function RouteMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const layers = useRouteMapStore((state) => state.layers);
  const selectedItem = useRouteMapStore((state) => state.selectedItem);
  const selectItem = useRouteMapStore((state) => state.selectItem);
  const mapMode = useRouteMapStore((state) => state.mapMode);

  const activeRoutes = useMemo(
    () => routes.filter((route) => layers[route.layer]),
    [layers]
  );

  const visibleMarkers = useMemo(
    () => markers.filter((marker) => layers[getMarkerLayer(marker)]),
    [layers]
  );

  const activeRoutesRef = useRef(activeRoutes);
  const selectItemRef = useRef(selectItem);
  const mapModeRef = useRef(mapMode);
  const selectedId = selectedItem?.id;

  useEffect(() => {
    activeRoutesRef.current = activeRoutes;
  }, [activeRoutes]);

  useEffect(() => {
    selectItemRef.current = selectItem;
  }, [selectItem]);

  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);

  useEffect(() => {
    let disposed = false;
    let readyTimer = 0;

    async function bootMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const { default: maplibregl } = await import("maplibre-gl");

      if (disposed || !mapContainerRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: DARK_STYLE,
        center: mapModeRef.current === "mercator" ? [12, 18] : [18, 22],
        zoom: window.innerWidth < 900 ? 0.88 : 1.12,
        minZoom: 0.65,
        maxZoom: 11,
        pitch: mapModeRef.current === "mercator" ? 0 : 16,
        bearing: 0,
        renderWorldCopies: true,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      let layersAdded = false;
      const markMapReady = () => {
        if (disposed) return;
        if (!map.isStyleLoaded()) {
          readyTimer = window.setTimeout(markMapReady, 180);
          return;
        }

        applyProjection(map, mapModeRef.current);
        if (!layersAdded) {
          addMapSourcesAndLayers(map, (kind, id) => selectItemRef.current({ kind, id }));
          layersAdded = true;
        }
        setReady(true);
        fitOverview(map, mapModeRef.current);
      };

      map.once("load", markMapReady);
      map.once("styledata", markMapReady);
      readyTimer = window.setTimeout(markMapReady, 650);

      mapRef.current = map;
    }

    void bootMap();

    return () => {
      disposed = true;
      window.clearTimeout(readyTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    updateMapData(map, activeRoutes, visibleMarkers, selectedId);
  }, [activeRoutes, ready, selectedId, visibleMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    let animationFrame = 0;
    const animate = (frameTime: number) => {
      const particles = buildFlowParticles(activeRoutesRef.current, frameTime / 1000);
      getGeoJsonSource(map, "route-particles")?.setData(buildParticlesGeoJson(particles));
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyProjection(map, mapMode);
    if (!selectedItem) fitOverview(map, mapMode);
  }, [mapMode, ready, selectedItem]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (selectedItem) flyToItem(map, selectedItem.id);
    else fitOverview(map, mapMode);
  }, [mapMode, ready, selectedItem]);

  return (
    <section className="map-stage" aria-label="Interactive global route intelligence map">
      <div ref={mapContainerRef} className="map-canvas" />
      <div className="map-vignette" aria-hidden="true" />
      {!ready ? (
        <div className="map-loading" aria-live="polite">
          <span />
          <strong>Loading real-world map</strong>
        </div>
      ) : null}
    </section>
  );
}
