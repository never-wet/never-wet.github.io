"use client";

import { Activity, BrainCircuit, ListFilter, Newspaper, Radio, RefreshCw, Search, ShieldAlert, TerminalSquare } from "lucide-react";
import { useIntelStore } from "@/store/useIntelStore";

interface TopBarProps {
  visibleCount: number;
  onRefresh: () => void;
  refreshing: boolean;
  onOpenFilters: () => void;
  onOpenNews: () => void;
  onOpenInsights: () => void;
  onToggleLogs: () => void;
  logsOpen: boolean;
}

function formatTime(timestamp?: string) {
  if (!timestamp) return "not synced";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

export function TopBar({
  visibleCount,
  onRefresh,
  refreshing,
  onOpenFilters,
  onOpenNews,
  onOpenInsights,
  onToggleLogs,
  logsOpen
}: TopBarProps) {
  const filters = useIntelStore((state) => state.filters);
  const setQuery = useIntelStore((state) => state.setQuery);
  const status = useIntelStore((state) => state.status);
  const events = useIntelStore((state) => state.events);
  const highRiskCount = events.filter((event) => event.riskLevel === "high" || event.riskLevel === "critical").length;

  return (
    <header className="top-bar">
      <div className="brand-block">
        <span className="brand-mark"><Radio size={17} /></span>
        <span>
          <strong>Global Intelligence Dashboard</strong>
          <small>situational awareness platform</small>
        </span>
      </div>

      <label className="search-box">
        <Search size={15} />
        <input
          value={filters.query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search region, source, event..."
          aria-label="Search intelligence stream"
        />
      </label>

      <div className="global-status" aria-live="polite">
        <button className="toolbar-button" type="button" onClick={onOpenFilters} title="Open filters">
          <ListFilter size={14} />
          Filters
        </button>
        <button className="toolbar-button" type="button" onClick={onOpenNews} title="Open news drawer">
          <Newspaper size={14} />
          News
        </button>
        <button className="toolbar-button" type="button" onClick={onOpenInsights} title="Open AI insights">
          <BrainCircuit size={14} />
          AI
        </button>
        <button className={`toolbar-button ${logsOpen ? "is-active" : ""}`} type="button" onClick={onToggleLogs} title="Toggle signals and logs">
          <TerminalSquare size={14} />
          Logs
        </button>
        <span className={`status-pill status-pill--${status.mode}`}>
          <Activity size={14} />
          {status.mode}
        </span>
        <span className="metric-pill">
          <ShieldAlert size={14} />
          {highRiskCount} elevated
        </span>
        <span className="metric-pill">{visibleCount} visible</span>
        <span className="metric-pill">sync {formatTime(status.lastUpdated)}</span>
        <button className="icon-button" type="button" onClick={onRefresh} disabled={refreshing} title="Refresh live feeds">
          <RefreshCw size={15} className={refreshing ? "spin" : undefined} />
        </button>
      </div>
    </header>
  );
}
