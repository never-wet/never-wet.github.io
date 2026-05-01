export const CATEGORIES = [
  "geopolitics",
  "economy",
  "conflict",
  "infrastructure",
  "energy",
  "technology"
] as const;

export type IntelCategory = (typeof CATEGORIES)[number];

export const REGIONS = [
  "Global",
  "Asia",
  "Europe",
  "United States",
  "Middle East",
  "Africa",
  "Americas",
  "Oceania"
] as const;

export type IntelRegion = (typeof REGIONS)[number];
export type TimeRange = "hour" | "today" | "week";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type TrendDirection = "up" | "stable" | "down";
export type FeedSource =
  | "Guardian"
  | "USGS"
  | "NASA EONET"
  | "NWS"
  | "Binance"
  | "Carbon Intensity"
  | "System";

export interface FilterState {
  region: IntelRegion;
  categories: IntelCategory[];
  timeRange: TimeRange;
  query: string;
}

export interface IntelEvent {
  id: string;
  title: string;
  summary: string;
  category: IntelCategory;
  region: IntelRegion;
  lat: number;
  lon: number;
  timestamp: string;
  source: FeedSource;
  sourceUrl?: string;
  severity: number;
  riskLevel: RiskLevel;
  confidence: number;
  trend: TrendDirection;
  type: "news" | "hazard" | "seismic" | "market" | "energy" | "weather" | "system";
}

export interface AIInsight {
  id: string;
  title: string;
  summary: string;
  region: IntelRegion;
  category: IntelCategory;
  riskLevel: RiskLevel;
  confidence: number;
  trend: TrendDirection;
  drivers: string[];
  updatedAt: string;
}

export interface SignalItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  timestamp: string;
  level: RiskLevel;
  source: FeedSource;
  direction?: TrendDirection;
}

export interface IntelPayload {
  events: IntelEvent[];
  news: IntelEvent[];
  signals: SignalItem[];
}

export interface ConnectionStatus {
  mode: "live" | "degraded" | "offline";
  lastUpdated?: string;
  message: string;
}
