import { create } from "zustand";
import type { LayerKey, MapMode, SelectedItem } from "@/types";

type LayerVisibility = Record<LayerKey, boolean>;

interface RouteMapStore {
  layers: LayerVisibility;
  selectedItem?: SelectedItem;
  searchQuery: string;
  mapMode: MapMode;
  tickerPaused: boolean;
  toggleLayer: (layer: LayerKey) => void;
  setLayer: (layer: LayerKey, value: boolean) => void;
  selectItem: (item?: SelectedItem) => void;
  setSearchQuery: (query: string) => void;
  setMapMode: (mode: MapMode) => void;
  toggleTicker: () => void;
}

export const useRouteMapStore = create<RouteMapStore>((set) => ({
  layers: {
    flight: true,
    shipping: true,
    historical: true,
    chokepoints: true
  },
  selectedItem: undefined,
  searchQuery: "",
  mapMode: "mercator",
  tickerPaused: false,
  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer]
      }
    })),
  setLayer: (layer, value) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: value
      }
    })),
  selectItem: (item) => set({ selectedItem: item }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleTicker: () => set((state) => ({ tickerPaused: !state.tickerPaused }))
}));
