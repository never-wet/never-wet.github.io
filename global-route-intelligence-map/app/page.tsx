"use client";

import {
  Anchor,
  Check,
  ChevronRight,
  Globe2,
  History,
  Landmark,
  Layers3,
  MapPin,
  Pause,
  Plane,
  Play,
  Radar,
  Search,
  Ship,
  Target,
  Waves
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ComponentType, CSSProperties, FormEvent } from "react";
import { RouteMap } from "@/components/RouteMap";
import { layerLabels, markers, routes, routeColors } from "@/lib/route-data";
import { useRouteMapStore } from "@/store/useRouteMapStore";
import type { LayerKey, RouteMarker, RouteRecord, SearchResult, SelectedItem } from "@/types";

const layerIcons: Record<LayerKey, ComponentType<{ size?: number }>> = {
  flight: Plane,
  shipping: Ship,
  historical: Landmark,
  chokepoints: Anchor
};

const tickerItems = [
  "JFK-LHR arc active across the North Atlantic",
  "Silk Road historical layer tracking Eurasian inland exchange",
  "Strait of Hormuz marker online in Gulf energy corridor",
  "Asia-Europe container lane routed through Malacca, Bab el-Mandeb, and Suez",
  "Panama Canal connector bridging Pacific and Atlantic trade",
  "DXB-SIN aviation corridor flowing between Gulf and Southeast Asia"
];

function getLayerCount(layer: LayerKey) {
  if (layer === "chokepoints") return markers.filter((marker) => marker.type === "chokepoint").length;
  return routes.filter((route) => route.layer === layer).length;
}

function getSelectedRecord(item?: SelectedItem) {
  if (!item) return undefined;
  if (item.kind === "route") return routes.find((route) => route.id === item.id);
  return markers.find((marker) => marker.id === item.id);
}

function isRouteRecord(record: RouteRecord | RouteMarker | undefined): record is RouteRecord {
  return Boolean(record && "layer" in record);
}

function buildSearchResults(query: string): SearchResult[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const routeResults = routes.map((route) => ({
    id: route.id,
    kind: "route" as const,
    label: route.name,
    meta: `${route.type} / ${route.countries.join(", ")}`,
    haystack: [
      route.id,
      route.name,
      route.type,
      route.layer,
      route.from,
      route.to,
      route.description,
      route.strategicImportance,
      route.countries.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  }));

  const markerResults = markers.map((marker) => ({
    id: marker.id,
    kind: "marker" as const,
    label: marker.code ? `${marker.code} / ${marker.name}` : marker.name,
    meta: `${marker.type} / ${marker.countries.join(", ")}`,
    haystack: [
      marker.id,
      marker.name,
      marker.code,
      marker.type,
      marker.description,
      marker.strategicImportance,
      marker.countries.join(" ")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  }));

  return [...markerResults, ...routeResults]
    .filter((result) => result.haystack.includes(term))
    .sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aExact = aLabel === term ? 0 : 1;
      const bExact = bLabel === term ? 0 : 1;
      const aStarts = aLabel.startsWith(term) ? 0 : 1;
      const bStarts = bLabel.startsWith(term) ? 0 : 1;
      return aExact - bExact || aStarts - bStarts;
    })
    .slice(0, 7)
    .map((result) => ({
      id: result.id,
      kind: result.kind,
      label: result.label,
      meta: result.meta
    }));
}

function TopBar() {
  const [resultsOpen, setResultsOpen] = useState(false);
  const searchQuery = useRouteMapStore((state) => state.searchQuery);
  const setSearchQuery = useRouteMapStore((state) => state.setSearchQuery);
  const selectItem = useRouteMapStore((state) => state.selectItem);
  const mapMode = useRouteMapStore((state) => state.mapMode);
  const setMapMode = useRouteMapStore((state) => state.setMapMode);
  const results = useMemo(() => buildSearchResults(searchQuery), [searchQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) {
      selectItem({ kind: results[0].kind, id: results[0].id });
      setResultsOpen(false);
    }
  }

  return (
    <header className="top-bar">
      <a className="brand" href="../" aria-label="Never Wet home">
        <span className="brand-mark">NW</span>
        <span>
          <strong>Global Route Intelligence Map</strong>
          <small>Air / Sea / Trade / Chokepoints</small>
        </span>
      </a>

      <form className="search-box" onSubmit={submitSearch}>
        <Search size={17} />
        <input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setResultsOpen(true);
          }}
          onFocus={() => setResultsOpen(true)}
          placeholder="Search routes, countries, airports"
          aria-label="Search routes, countries, airports, and chokepoints"
        />
        {resultsOpen && results.length ? (
          <div className="search-results">
            {results.map((result) => (
              <button
                type="button"
                key={`${result.kind}-${result.id}`}
                onClick={() => {
                  selectItem({ kind: result.kind, id: result.id });
                  setResultsOpen(false);
                }}
              >
                <span>
                  <strong>{result.label}</strong>
                  <small>{result.meta}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <button
        className="mode-toggle"
        type="button"
        onClick={() => setMapMode(mapMode === "globe" ? "mercator" : "globe")}
        aria-label="Toggle map projection"
      >
        <Globe2 size={16} />
        <span>{mapMode === "globe" ? "Globe" : "Flat"}</span>
      </button>
    </header>
  );
}

function LeftPanel() {
  const layers = useRouteMapStore((state) => state.layers);
  const toggleLayer = useRouteMapStore((state) => state.toggleLayer);
  const selectItem = useRouteMapStore((state) => state.selectItem);
  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <aside className="panel panel-left" aria-label="Route layer filters">
      <div className="panel-heading">
        <span><Layers3 size={15} /> Layers</span>
        <strong>{activeLayerCount}/4</strong>
      </div>

      <div className="layer-list">
        {(Object.keys(layerLabels) as LayerKey[]).map((layer) => {
          const Icon = layerIcons[layer];
          const enabled = layers[layer];
          return (
            <button
              type="button"
              key={layer}
              className={`layer-toggle ${enabled ? "is-on" : ""}`}
              onClick={() => toggleLayer(layer)}
              style={{ "--layer-color": `rgba(${routeColors[layer].join(",")})` } as CSSProperties}
            >
              <span className="layer-toggle__check">{enabled ? <Check size={13} /> : null}</span>
              <Icon size={17} />
              <span>
                <strong>{layerLabels[layer]}</strong>
                <small>{getLayerCount(layer)} records</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="quick-list quick-list--paths">
        <div className="panel-heading panel-heading--compact">
          <span><History size={14} /> Key Paths</span>
        </div>
        {routes
          .filter((route) => route.layer === "historical")
          .map((route) => (
            <button
              type="button"
              key={route.id}
              className="focus-row focus-row--path"
              onClick={() => selectItem({ kind: "route", id: route.id })}
            >
              <Landmark size={14} />
              <span>{route.name}</span>
            </button>
          ))}
      </div>

      <div className="quick-list">
        <div className="panel-heading panel-heading--compact">
          <span><Target size={14} /> Focus Points</span>
        </div>
        {markers
          .filter((marker) => marker.type === "chokepoint")
          .map((marker) => (
            <button
              type="button"
              key={marker.id}
              className="focus-row"
              onClick={() => selectItem({ kind: "marker", id: marker.id })}
            >
              <MapPin size={14} />
              <span>{marker.name}</span>
            </button>
          ))}
      </div>
    </aside>
  );
}

function DetailPanel() {
  const selectedItem = useRouteMapStore((state) => state.selectedItem);
  const selectItem = useRouteMapStore((state) => state.selectItem);
  const record = getSelectedRecord(selectedItem);

  if (!record) {
    return (
      <aside className="panel panel-right" aria-label="Selected route details">
        <div className="empty-state">
          <Radar size={22} />
          <strong>Global network view</strong>
          <p>All active route layers are visible with live flow particles and strategic chokepoint markers.</p>
        </div>
      </aside>
    );
  }

  const routeRecord = isRouteRecord(record) ? record : undefined;
  const markerRecord = !routeRecord && record ? (record as RouteMarker) : undefined;
  const connectedRoutes = markerRecord
    ? markerRecord.connectedRoutes
        .map((routeId) => routes.find((route) => route.id === routeId))
        .filter(Boolean) as RouteRecord[]
    : [];

  return (
    <aside className="panel panel-right" aria-label="Selected route details">
      <div className="panel-heading">
        <span><Radar size={15} /> Selected</span>
        <button type="button" className="clear-button" onClick={() => selectItem(undefined)}>
          Clear
        </button>
      </div>

      <article className="detail-card">
        <div className={`type-chip type-chip--${routeRecord?.layer ?? markerRecord?.type}`}>
          {routeRecord ? routeRecord.type : markerRecord?.type}
        </div>
        <h1>{record.name}</h1>
        <p>{record.description}</p>

        <dl className="detail-grid">
          <div>
            <dt>{routeRecord ? "Route type" : "Location type"}</dt>
            <dd>{routeRecord ? layerLabels[routeRecord.layer] : markerRecord?.type}</dd>
          </div>
          <div>
            <dt>Countries involved</dt>
            <dd>{record.countries.join(", ")}</dd>
          </div>
          {routeRecord ? (
            <>
              <div>
                <dt>Status</dt>
                <dd>{routeRecord.status}</dd>
              </div>
              <div>
                <dt>Flow class</dt>
                <dd>{routeRecord.volumeLabel}</dd>
              </div>
            </>
          ) : null}
        </dl>

        <section className="importance">
          <span>Strategic importance</span>
          <p>{record.strategicImportance}</p>
          {routeRecord ? (
            <div className="importance-meter" aria-label={`Strategic level ${routeRecord.strategicLevel} of 5`}>
              <i style={{ width: `${routeRecord.strategicLevel * 20}%` }} />
            </div>
          ) : null}
        </section>

        {routeRecord?.from && routeRecord?.to ? (
          <div className="endpoint-strip">
            <span>{routeRecord.from}</span>
            <i />
            <span>{routeRecord.to}</span>
          </div>
        ) : null}

        {connectedRoutes.length ? (
          <div className="linked-routes">
            <span>Connected routes</span>
            {connectedRoutes.map((route) => (
              <button
                type="button"
                key={route.id}
                onClick={() => selectItem({ kind: "route", id: route.id })}
              >
                {route.name}
              </button>
            ))}
          </div>
        ) : null}
      </article>
    </aside>
  );
}

function StatusTicker() {
  const tickerPaused = useRouteMapStore((state) => state.tickerPaused);
  const toggleTicker = useRouteMapStore((state) => state.toggleTicker);
  const selectedItem = useRouteMapStore((state) => state.selectedItem);
  const selectedRecord = getSelectedRecord(selectedItem);

  return (
    <footer className="status-ticker">
      <button type="button" onClick={toggleTicker} aria-label="Toggle status ticker">
        {tickerPaused ? <Play size={14} /> : <Pause size={14} />}
      </button>
      <div className={`ticker-track ${tickerPaused ? "is-paused" : ""}`}>
        <div className="ticker-line">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
      <strong>{selectedRecord ? selectedRecord.name : "Live global route mesh"}</strong>
    </footer>
  );
}

function IntelligenceStats() {
  const activeRoutes = routes.length;
  const chokepoints = markers.filter((marker) => marker.type === "chokepoint").length;

  return (
    <div className="stats-strip" aria-label="Map status">
      <span>
        <Plane size={14} />
        <strong>{routes.filter((route) => route.layer === "flight").length}</strong>
        air corridors
      </span>
      <span>
        <Waves size={14} />
        <strong>{routes.filter((route) => route.layer === "shipping").length}</strong>
        sea lanes
      </span>
      <span>
        <History size={14} />
        <strong>{routes.filter((route) => route.layer === "historical").length}</strong>
        historic/trade paths
      </span>
      <span>
        <Anchor size={14} />
        <strong>{chokepoints}</strong>
        chokepoints
      </span>
      <span>
        <Globe2 size={14} />
        <strong>{activeRoutes}</strong>
        total routes
      </span>
    </div>
  );
}

export default function RouteIntelligencePage() {
  return (
    <main className="route-app">
      <RouteMap />
      <TopBar />
      <IntelligenceStats />
      <LeftPanel />
      <DetailPanel />
      <StatusTicker />
    </main>
  );
}
