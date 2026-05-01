"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Info, Newspaper, PanelLeftClose, PanelRightClose, ShieldAlert, Sparkles } from "lucide-react";
import { AIInsights } from "@/components/AIInsights";
import { FiltersPanel } from "@/components/FiltersPanel";
import { GlobePanel } from "@/components/GlobePanel";
import { NewsFeed } from "@/components/NewsFeed";
import { SignalPanel } from "@/components/SignalPanel";
import { TopBar } from "@/components/TopBar";
import { fetchGlobalIntel } from "@/lib/api";
import { filterEvents, useIntelStore } from "@/store/useIntelStore";
import type { IntelEvent } from "@/types";

const REFRESH_MS = 18000;
type RightTab = "details" | "news" | "insights";

function formatEventTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function EventDetails({ event }: { event?: IntelEvent }) {
  if (!event) {
    return (
      <section className="event-detail-empty">
        <Info size={18} />
        <h2>No event selected</h2>
        <p>Select a glowing point on the globe or choose a headline to open its intelligence record.</p>
      </section>
    );
  }

  return (
    <article className="event-detail">
      <div className="event-detail__status">
        <span className={`risk-chip risk-chip--${event.riskLevel}`}>{event.riskLevel} risk</span>
        <span>{Math.round(event.confidence * 100)}% confidence</span>
      </div>
      <h2>{event.title}</h2>
      <p>{event.summary}</p>
      <dl>
        <div>
          <dt>Region</dt>
          <dd>{event.region}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{event.category}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{event.source}</dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>{formatEventTime(event.timestamp)}</dd>
        </div>
      </dl>
      {event.sourceUrl ? (
        <a className="source-link" href={event.sourceUrl} target="_blank" rel="noreferrer">
          Open source <ExternalLink size={14} />
        </a>
      ) : null}
    </article>
  );
}

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("details");
  const [logsOpen, setLogsOpen] = useState(false);
  const events = useIntelStore((state) => state.events);
  const filters = useIntelStore((state) => state.filters);
  const selectedEvent = useIntelStore((state) => state.selectedEvent);
  const setSelectedEvent = useIntelStore((state) => state.setSelectedEvent);
  const ingestPayload = useIntelStore((state) => state.ingestPayload);
  const setStatus = useIntelStore((state) => state.setStatus);

  const visibleEvents = useMemo(() => filterEvents(events, filters), [events, filters]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const payload = await fetchGlobalIntel();
      ingestPayload(payload);
    } catch (error) {
      setStatus({
        mode: "offline",
        lastUpdated: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Live ingest failed"
      });
    } finally {
      setRefreshing(false);
    }
  }, [ingestPayload, setStatus]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    if (!visibleEvents.length) {
      setSelectedEvent(undefined);
      return;
    }

    if (selectedEvent && !visibleEvents.some((event) => event.id === selectedEvent.id)) {
      setSelectedEvent(undefined);
    }
  }, [selectedEvent, setSelectedEvent, visibleEvents]);

  const openEvent = useCallback((event: IntelEvent) => {
    setSelectedEvent(event);
    setRightTab("details");
    setRightOpen(true);
  }, [setSelectedEvent]);

  const openRightTab = useCallback((tab: RightTab) => {
    setRightTab(tab);
    setRightOpen(true);
  }, []);

  return (
    <main className="dashboard-shell">
      <TopBar
        visibleCount={visibleEvents.length}
        onRefresh={refresh}
        refreshing={refreshing}
        onOpenFilters={() => setFiltersOpen(true)}
        onOpenNews={() => openRightTab("news")}
        onOpenInsights={() => openRightTab("insights")}
        onToggleLogs={() => setLogsOpen((open) => !open)}
        logsOpen={logsOpen}
      />

      <div className="globe-stage">
        <GlobePanel events={visibleEvents} onEventSelect={openEvent} />

        <aside className={`overlay-drawer overlay-drawer--left ${filtersOpen ? "is-open" : ""}`} aria-label="Filters drawer">
          <button className="drawer-close" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <PanelLeftClose size={16} />
          </button>
          <FiltersPanel />
        </aside>

        <aside className={`overlay-drawer overlay-drawer--right ${rightOpen ? "is-open" : ""}`} aria-label="Intelligence drawer">
          <div className="drawer-tabs">
            <button type="button" className={rightTab === "details" ? "is-active" : undefined} onClick={() => setRightTab("details")}>
              <ShieldAlert size={14} /> Details
            </button>
            <button type="button" className={rightTab === "news" ? "is-active" : undefined} onClick={() => setRightTab("news")}>
              <Newspaper size={14} /> News
            </button>
            <button type="button" className={rightTab === "insights" ? "is-active" : undefined} onClick={() => setRightTab("insights")}>
              <Sparkles size={14} /> AI
            </button>
            <button className="drawer-close drawer-close--inline" type="button" onClick={() => setRightOpen(false)} aria-label="Close intelligence drawer">
              <PanelRightClose size={16} />
            </button>
          </div>

          <div className="drawer-content">
            {rightTab === "details" ? <EventDetails event={selectedEvent} /> : null}
            {rightTab === "news" ? <NewsFeed onPickEvent={openEvent} /> : null}
            {rightTab === "insights" ? <AIInsights /> : null}
          </div>
        </aside>

        <SignalPanel expanded={logsOpen} onToggle={() => setLogsOpen((open) => !open)} />
      </div>
    </main>
  );
}
