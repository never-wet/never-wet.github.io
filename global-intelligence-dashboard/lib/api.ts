import type { FeedSource, IntelEvent, IntelPayload, SignalItem } from "@/types";
import {
  classifyCategory,
  confidenceFromTimestamp,
  riskFromSeverity,
  scoreSeverity,
  stripHtml,
  summarizeEvent,
  trendFromSeverity
} from "@/lib/ai";
import { fallbackRegionFromSection, inferRegionFromCoordinates, resolveLocation } from "@/lib/geo";

interface GuardianResult {
  id: string;
  type?: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  fields?: {
    trailText?: string;
    shortUrl?: string;
  };
}

interface GuardianResponse {
  response?: {
    results?: GuardianResult[];
  };
}

interface UsgsFeature {
  id: string;
  properties: {
    mag?: number;
    place?: string;
    time?: number;
    url?: string;
    title?: string;
    status?: string;
    tsunami?: number;
  };
  geometry?: {
    coordinates?: [number, number, number?];
  };
}

interface UsgsResponse {
  features?: UsgsFeature[];
}

interface EonetEvent {
  id: string;
  title: string;
  description?: string | null;
  link?: string;
  categories?: Array<{ id: string; title: string }>;
  sources?: Array<{ id: string; url: string }>;
  geometry?: Array<{
    date: string;
    type: string;
    coordinates: [number, number] | [number, number, number];
    magnitudeValue?: number;
    magnitudeUnit?: string;
  }>;
}

interface EonetResponse {
  events?: EonetEvent[];
}

interface NwsFeature {
  id: string;
  properties?: {
    id?: string;
    areaDesc?: string;
    event?: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity?: string;
    urgency?: string;
    certainty?: string;
    effective?: string;
    onset?: string;
    sent?: string;
    expires?: string;
    senderName?: string;
  };
  geometry?: GeoJsonGeometry | null;
}

interface NwsResponse {
  features?: NwsFeature[];
}

type GeoJsonGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "MultiPoint" | "LineString"; coordinates: Array<[number, number]> }
  | { type: "Polygon" | "MultiLineString"; coordinates: Array<Array<[number, number]>> }
  | { type: "MultiPolygon"; coordinates: Array<Array<Array<[number, number]>>> };

interface BinanceTicker {
  symbol: string;
  lastPrice?: string;
  priceChangePercent?: string;
}

interface CarbonResponse {
  data?: Array<{
    from: string;
    to: string;
    intensity: {
      forecast?: number;
      actual?: number;
      index?: string;
    };
  }>;
}

const GUARDIAN_URL =
  "https://content.guardianapis.com/search?api-key=test&page-size=48&order-by=newest&show-fields=trailText,shortUrl&q=geopolitics%20OR%20energy%20OR%20conflict%20OR%20economy%20OR%20technology%20OR%20infrastructure%20OR%20market";
const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
const EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20&limit=80";
const NWS_ALERTS_URL = "https://api.weather.gov/alerts/active?status=actual&message_type=alert";
const BINANCE_URL = "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D";
const CARBON_URL = "https://api.carbonintensity.org.uk/intensity";

async function fetchJson<T>(url: string, timeoutMs = 9000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function makeEvent(input: Omit<IntelEvent, "riskLevel" | "trend">): IntelEvent {
  return {
    ...input,
    riskLevel: riskFromSeverity(input.severity),
    trend: trendFromSeverity(input.severity)
  };
}

function sourceBaseConfidence(source: FeedSource) {
  if (source === "USGS") return 0.88;
  if (source === "NASA EONET") return 0.86;
  if (source === "NWS") return 0.84;
  if (source === "Guardian") return 0.78;
  return 0.72;
}

function nwsSeverityLevel(severity?: string, urgency?: string, eventName?: string) {
  const raw = `${severity ?? ""} ${urgency ?? ""} ${eventName ?? ""}`.toLowerCase();
  let base = raw.includes("extreme") ? 4.8 : raw.includes("severe") ? 3.8 : raw.includes("moderate") ? 2.7 : raw.includes("minor") ? 1.8 : 1.5;
  if (raw.includes("tornado") || raw.includes("hurricane") || raw.includes("flash flood")) base += 0.65;
  if (raw.includes("immediate") || raw.includes("expected")) base += 0.25;
  return Math.min(5, Number(base.toFixed(2)));
}

function collectPositions(geometry?: GeoJsonGeometry | null): Array<[number, number]> {
  if (!geometry) return [];
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "MultiPoint" || geometry.type === "LineString") return geometry.coordinates;
  if (geometry.type === "Polygon" || geometry.type === "MultiLineString") return geometry.coordinates.flat();
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

function centroidFromGeometry(geometry?: GeoJsonGeometry | null) {
  const positions = collectPositions(geometry).filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  if (!positions.length) return undefined;
  const lon = positions.reduce((total, position) => total + position[0], 0) / positions.length;
  const lat = positions.reduce((total, position) => total + position[1], 0) / positions.length;
  return { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) };
}

function representativeGeometryPoints(geometry?: GeoJsonGeometry | null, maxPoints = 2) {
  const positions = collectPositions(geometry).filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  const centroid = centroidFromGeometry(geometry);
  if (!centroid) return [];

  const points = [centroid];
  if (positions.length > 8) {
    for (const ratio of [0.22, 0.5, 0.78]) {
      const [lon, lat] = positions[Math.min(positions.length - 1, Math.floor(positions.length * ratio))];
      points.push({ lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) });
    }
  }

  const seen = new Set<string>();
  return points
    .filter((point) => {
      const key = `${point.lat.toFixed(2)}:${point.lon.toFixed(2)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxPoints);
}

async function fetchGuardianNews(): Promise<IntelEvent[]> {
  const data = await fetchJson<GuardianResponse>(GUARDIAN_URL);
  const results = data.response?.results ?? [];

  return results.map((item) => {
    const body = stripHtml(item.fields?.trailText);
    const text = `${item.webTitle} ${body} ${item.sectionName}`;
    const category = classifyCategory(text, item.sectionId);
    const location = resolveLocation(text, fallbackRegionFromSection(item.sectionId));
    const severity = scoreSeverity(text, item.type === "liveblog" ? 1.8 : 1.3);

    return makeEvent({
      id: `guardian-${item.id}`,
      title: item.webTitle,
      summary: summarizeEvent(item.webTitle, body),
      category,
      region: location.region,
      lat: location.lat,
      lon: location.lon,
      timestamp: item.webPublicationDate,
      source: "Guardian",
      sourceUrl: item.webUrl,
      severity,
      confidence: confidenceFromTimestamp(item.webPublicationDate, sourceBaseConfidence("Guardian")),
      type: "news"
    });
  });
}

async function fetchUsgsEvents(): Promise<IntelEvent[]> {
  const data = await fetchJson<UsgsResponse>(USGS_URL);
  const features = data.features ?? [];

  return features
    .filter((feature) => feature.geometry?.coordinates?.length)
    .slice(0, 430)
    .map((feature) => {
      const [lon, lat] = feature.geometry?.coordinates ?? [0, 0];
      const mag = feature.properties.mag ?? 0;
      const timestamp = new Date(feature.properties.time ?? Date.now()).toISOString();
      const baseSeverity = mag >= 6.5 ? 4.8 : mag >= 5.5 ? 4 : mag >= 4.5 ? 3.1 : mag >= 3.5 ? 2.2 : 1.4;
      const text = `${feature.properties.title ?? "Earthquake"} ${feature.properties.place ?? ""}`;
      const severity = scoreSeverity(text, baseSeverity + (feature.properties.tsunami ? 0.9 : 0));

      return makeEvent({
        id: `usgs-${feature.id}`,
        title: feature.properties.title ?? `M ${mag.toFixed(1)} seismic event`,
        summary: `${feature.properties.place ?? "Detected seismic activity"}; magnitude ${mag.toFixed(1)}. Status: ${feature.properties.status ?? "reported"}.`,
        category: "infrastructure",
        region: inferRegionFromCoordinates(lat, lon),
        lat,
        lon,
        timestamp,
        source: "USGS",
        sourceUrl: feature.properties.url,
        severity,
        confidence: confidenceFromTimestamp(timestamp, sourceBaseConfidence("USGS")),
        type: "seismic"
      });
    });
}

async function fetchEonetEvents(): Promise<IntelEvent[]> {
  const data = await fetchJson<EonetResponse>(EONET_URL);
  const events = data.events ?? [];

  return events.flatMap((event) => {
    const categoryTitle = event.categories?.[0]?.title ?? "Natural event";
    const text = `${event.title} ${event.description ?? ""} ${categoryTitle}`;
    const geometries = [...(event.geometry ?? [])]
      .reverse()
      .filter((geometry) => geometry.type === "Point")
      .slice(0, 3);

    return geometries.flatMap((geometry, index) => {
      const [lon, lat] = geometry.coordinates;
      const magnitude = Number(geometry.magnitudeValue ?? 0);
      const severitySeed = magnitude > 10000 ? 4.1 : magnitude > 1500 ? 3.2 : magnitude > 250 ? 2.4 : 1.7;

      return makeEvent({
        id: `eonet-${event.id}-${index}`,
        title: event.title,
        summary: `${categoryTitle}${event.description ? `: ${event.description}` : ""}${magnitude ? `; observed ${magnitude} ${geometry.magnitudeUnit ?? "units"}.` : "."}`,
        category: categoryTitle.toLowerCase().includes("wildfire") ? "infrastructure" : classifyCategory(text, "infrastructure"),
        region: inferRegionFromCoordinates(lat, lon),
        lat,
        lon,
        timestamp: geometry.date,
        source: "NASA EONET",
        sourceUrl: event.sources?.[0]?.url ?? event.link,
        severity: scoreSeverity(text, severitySeed),
        confidence: confidenceFromTimestamp(geometry.date, sourceBaseConfidence("NASA EONET")),
        type: "hazard"
      });
    });
  });
}

async function fetchNwsAlerts(): Promise<IntelEvent[]> {
  const data = await fetchJson<NwsResponse>(NWS_ALERTS_URL, 12000);
  const features = data.features ?? [];
  const now = new Date().toISOString();

  return features.flatMap((feature) => {
    const properties = feature.properties;
    if (!properties) return [];

    const title = properties.headline || properties.event || "Active NWS alert";
    const text = `${title} ${properties.description ?? ""} ${properties.areaDesc ?? ""}`;
    const severity = scoreSeverity(text, nwsSeverityLevel(properties.severity, properties.urgency, properties.event));
    const coveragePoints = representativeGeometryPoints(feature.geometry, severity >= 3.4 ? 3 : 2);

    return coveragePoints.map((point, index) =>
      makeEvent({
        id: `nws-${properties.id ?? feature.id}-${index}`,
        title,
        summary: summarizeEvent(title, `${properties.event ?? "Weather alert"} for ${properties.areaDesc ?? "affected area"}. ${properties.instruction ?? properties.description ?? ""}`),
        category: classifyCategory(text, "infrastructure"),
        region: inferRegionFromCoordinates(point.lat, point.lon),
        lat: point.lat,
        lon: point.lon,
        timestamp: now,
        source: "NWS",
        sourceUrl: feature.id,
        severity,
        confidence: sourceBaseConfidence("NWS"),
        type: "weather"
      })
    );
  }).slice(0, 260);
}

async function fetchMarketSignals(): Promise<{ signals: SignalItem[]; events: IntelEvent[] }> {
  const data = await fetchJson<BinanceTicker[]>(BINANCE_URL);
  const timestamp = new Date().toISOString();
  const assets = [
    { symbol: "BTCUSDT", label: "BTC", lat: 40.71, lon: -74.0, region: "United States" },
    { symbol: "ETHUSDT", label: "ETH", lat: 51.5, lon: -0.12, region: "Europe" },
    { symbol: "SOLUSDT", label: "SOL", lat: 1.35, lon: 103.82, region: "Asia" }
  ] as const;

  const signals: SignalItem[] = [];
  const events: IntelEvent[] = [];

  for (const asset of assets) {
    const record = data.find((item) => item.symbol === asset.symbol);
    const usd = Number(record?.lastPrice ?? 0);
    if (!usd) continue;

    const change = Number(record?.priceChangePercent ?? 0);
    const level = Math.abs(change) > 4 ? "high" : Math.abs(change) > 1.5 ? "medium" : "low";

    signals.push({
      id: `market-${asset.symbol.toLowerCase()}`,
      label: `${asset.label} spot`,
      value: `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
      detail: `${change >= 0 ? "+" : ""}${change.toFixed(2)}% over 24h`,
      timestamp,
      level,
      source: "Binance",
      direction: change > 0.4 ? "up" : change < -0.4 ? "down" : "stable"
    });

    if (Math.abs(change) >= 1.4) {
      const severity = Math.min(4.2, 1.5 + Math.abs(change) / 1.35);
      events.push(
        makeEvent({
          id: `market-event-${asset.symbol.toLowerCase()}`,
          title: `${asset.label} market movement ${change >= 0 ? "rising" : "falling"}`,
          summary: `${asset.label} trades at $${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}, ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(2)}% in 24h.`,
          category: "economy",
          region: asset.region,
          lat: asset.lat,
          lon: asset.lon,
          timestamp,
          source: "Binance",
          sourceUrl: "https://www.binance.com/",
          severity,
          confidence: 0.82,
          type: "market"
        })
      );
    }
  }

  return { signals, events };
}

async function fetchEnergySignals(): Promise<{ signals: SignalItem[]; events: IntelEvent[] }> {
  const data = await fetchJson<CarbonResponse>(CARBON_URL);
  const current = data.data?.[0];
  if (!current) return { signals: [], events: [] };

  const actual = current.intensity.actual ?? current.intensity.forecast ?? 0;
  const index = current.intensity.index ?? "unknown";
  const level = index === "very high" ? "critical" : index === "high" ? "high" : index === "moderate" ? "medium" : "low";
  const timestamp = current.to;
  const signals: SignalItem[] = [
    {
      id: "energy-uk-carbon",
      label: "UK grid carbon",
      value: `${actual} gCO2/kWh`,
      detail: `Carbon intensity index: ${index}`,
      timestamp,
      level,
      source: "Carbon Intensity",
      direction: level === "high" || level === "critical" ? "up" : "stable"
    }
  ];

  const events: IntelEvent[] =
    level === "high" || level === "critical"
      ? [
          makeEvent({
            id: "energy-uk-carbon-event",
            title: "UK grid carbon intensity elevated",
            summary: `Carbon intensity is ${index} at ${actual} gCO2/kWh for the latest settlement period.`,
            category: "energy",
            region: "Europe",
            lat: 52.48,
            lon: -1.89,
            timestamp,
            source: "Carbon Intensity",
            sourceUrl: "https://carbonintensity.org.uk/",
            severity: level === "critical" ? 4.4 : 3.4,
            confidence: 0.82,
            type: "energy"
          })
        ]
      : [];

  return { signals, events };
}

function dedupeEvents(events: IntelEvent[]) {
  const seen = new Set<string>();
  return events
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 720);
}

export async function fetchGlobalIntel(): Promise<IntelPayload> {
  const [guardian, usgs, eonet, nws, market, energy] = await Promise.allSettled([
    fetchGuardianNews(),
    fetchUsgsEvents(),
    fetchEonetEvents(),
    fetchNwsAlerts(),
    fetchMarketSignals(),
    fetchEnergySignals()
  ]);

  const guardianEvents = guardian.status === "fulfilled" ? guardian.value : [];
  const usgsEvents = usgs.status === "fulfilled" ? usgs.value : [];
  const eonetEvents = eonet.status === "fulfilled" ? eonet.value : [];
  const nwsEvents = nws.status === "fulfilled" ? nws.value : [];
  const marketPayload = market.status === "fulfilled" ? market.value : { signals: [], events: [] };
  const energyPayload = energy.status === "fulfilled" ? energy.value : { signals: [], events: [] };

  const events = dedupeEvents([
    ...guardianEvents,
    ...usgsEvents,
    ...eonetEvents,
    ...nwsEvents,
    ...marketPayload.events,
    ...energyPayload.events
  ]);

  return {
    events,
    news: guardianEvents.length
      ? dedupeEvents(guardianEvents).slice(0, 70)
      : events.filter((event) => event.type !== "market").slice(0, 40),
    signals: [...marketPayload.signals, ...energyPayload.signals]
  };
}
