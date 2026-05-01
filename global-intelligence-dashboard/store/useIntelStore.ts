"use client";

import { create } from "zustand";
import { buildSystemLogs, generateAIInsights } from "@/lib/ai";
import { CATEGORIES, type AIInsight, type ConnectionStatus, type FilterState, type IntelCategory, type IntelEvent, type IntelRegion, type SignalItem, type TimeRange } from "@/types";

interface IntelState {
  events: IntelEvent[];
  news: IntelEvent[];
  insights: AIInsight[];
  signals: SignalItem[];
  logs: SignalItem[];
  selectedEvent?: IntelEvent;
  filters: FilterState;
  status: ConnectionStatus;
  refreshCount: number;
  setQuery: (query: string) => void;
  setRegion: (region: IntelRegion) => void;
  setTimeRange: (range: TimeRange) => void;
  toggleCategory: (category: IntelCategory) => void;
  setSelectedEvent: (event?: IntelEvent) => void;
  ingestPayload: (payload: { events: IntelEvent[]; news: IntelEvent[]; signals: SignalItem[] }) => void;
  setStatus: (status: ConnectionStatus) => void;
}

export const defaultFilters: FilterState = {
  region: "Global",
  categories: [...CATEGORIES],
  timeRange: "week",
  query: ""
};

export const useIntelStore = create<IntelState>((set, get) => ({
  events: [],
  news: [],
  insights: [],
  signals: [],
  logs: [],
  selectedEvent: undefined,
  filters: defaultFilters,
  status: {
    mode: "degraded",
    message: "Starting live ingest"
  },
  refreshCount: 0,
  setQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, query }
    })),
  setRegion: (region) =>
    set((state) => ({
      filters: { ...state.filters, region }
    })),
  setTimeRange: (timeRange) =>
    set((state) => ({
      filters: { ...state.filters, timeRange }
    })),
  toggleCategory: (category) =>
    set((state) => {
      const active = state.filters.categories.includes(category);
      const nextCategories = active
        ? state.filters.categories.filter((item) => item !== category)
        : [...state.filters.categories, category];

      return {
        filters: {
          ...state.filters,
          categories: nextCategories.length ? nextCategories : [...CATEGORIES]
        }
      };
    }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  ingestPayload: (payload) => {
    const events = payload.events;
    const selected = get().selectedEvent;
    const selectedStillExists = selected ? events.find((event) => event.id === selected.id) : undefined;
    const signals = payload.signals;

    set({
      events,
      news: payload.news,
      insights: generateAIInsights(events),
      signals,
      logs: buildSystemLogs(events, signals),
      selectedEvent: selectedStillExists,
      refreshCount: get().refreshCount + 1,
      status: {
        mode: events.length ? "live" : "degraded",
        lastUpdated: new Date().toISOString(),
        message: events.length ? "Live feeds synchronized" : "Waiting for API data"
      }
    });
  },
  setStatus: (status) => set({ status })
}));

export function filterEvents(events: IntelEvent[], filters: FilterState) {
  const now = Date.now();
  const maxAge =
    filters.timeRange === "hour"
      ? 60 * 60 * 1000
      : filters.timeRange === "today"
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;
  const query = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    const ageOk = now - new Date(event.timestamp).getTime() <= maxAge;
    const regionOk = filters.region === "Global" || event.region === filters.region;
    const categoryOk = filters.categories.includes(event.category);
    const queryOk =
      !query ||
      event.title.toLowerCase().includes(query) ||
      event.summary.toLowerCase().includes(query) ||
      event.region.toLowerCase().includes(query) ||
      event.source.toLowerCase().includes(query);

    return ageOk && regionOk && categoryOk && queryOk;
  });
}
