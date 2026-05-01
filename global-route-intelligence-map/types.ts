export type Coordinate = [number, number];

export type RouteType = "flight" | "shipping" | "historical" | "trade" | "aviation";
export type LayerKey = "flight" | "shipping" | "historical" | "chokepoints";
export type MarkerType = "airport" | "port" | "chokepoint";
export type SelectedKind = "route" | "marker";
export type MapMode = "globe" | "mercator";

export interface RouteRecord {
  id: string;
  name: string;
  type: RouteType;
  layer: Exclude<LayerKey, "chokepoints">;
  coordinates: Coordinate[];
  from?: string;
  to?: string;
  countries: string[];
  description: string;
  strategicImportance: string;
  strategicLevel: number;
  status: string;
  volumeLabel: string;
}

export interface RouteMarker {
  id: string;
  name: string;
  type: MarkerType;
  code?: string;
  coordinates: Coordinate;
  countries: string[];
  description: string;
  strategicImportance: string;
  connectedRoutes: string[];
}

export interface SelectedItem {
  kind: SelectedKind;
  id: string;
}

export interface SearchResult {
  id: string;
  kind: SelectedKind;
  label: string;
  meta: string;
}
