"use client";

import { Clock3, Filter, Globe2, Layers3 } from "lucide-react";
import { CATEGORIES, REGIONS, type IntelCategory, type TimeRange } from "@/types";
import { useIntelStore } from "@/store/useIntelStore";

const categoryLabels: Record<IntelCategory, string> = {
  geopolitics: "Geopolitics",
  economy: "Economy",
  conflict: "Conflict",
  infrastructure: "Infrastructure",
  energy: "Energy",
  technology: "Technology"
};

const timeRanges: Array<{ label: string; value: TimeRange }> = [
  { label: "Last hour", value: "hour" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" }
];

export function FiltersPanel() {
  const filters = useIntelStore((state) => state.filters);
  const setRegion = useIntelStore((state) => state.setRegion);
  const setTimeRange = useIntelStore((state) => state.setTimeRange);
  const toggleCategory = useIntelStore((state) => state.toggleCategory);

  return (
    <aside className="panel filters-panel" aria-label="Control filters">
      <div className="panel-heading">
        <span><Filter size={15} /> Controls</span>
        <small>instant map filters</small>
      </div>

      <section className="control-group">
        <h2><Globe2 size={14} /> Region</h2>
        <div className="segmented-list">
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              className={filters.region === region ? "is-active" : undefined}
              onClick={() => setRegion(region)}
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      <section className="control-group">
        <h2><Layers3 size={14} /> Categories</h2>
        <div className="category-list">
          {CATEGORIES.map((category) => (
            <label key={category} className={`category-toggle category-toggle--${category}`}>
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              <span>{categoryLabels[category]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="control-group">
        <h2><Clock3 size={14} /> Time</h2>
        <div className="time-switch">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              className={filters.timeRange === range.value ? "is-active" : undefined}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      <section className="source-stack" aria-label="Connected sources">
        <h2>Live sources</h2>
        <span>Guardian Content API</span>
        <span>USGS 7-day seismic GeoJSON</span>
        <span>NASA EONET events</span>
        <span>NWS active weather alerts</span>
        <span>Binance markets</span>
        <span>UK carbon intensity</span>
      </section>
    </aside>
  );
}
