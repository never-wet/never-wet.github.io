"use client";

import { ExternalLink, Newspaper, SignalHigh } from "lucide-react";
import { useMemo } from "react";
import { filterEvents, useIntelStore } from "@/store/useIntelStore";
import type { IntelEvent } from "@/types";

function formatAge(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface NewsFeedProps {
  onPickEvent?: (event: IntelEvent) => void;
}

function eventMatchesNews(event: IntelEvent) {
  return event.type === "news" || event.source === "Guardian";
}

export function NewsFeed({ onPickEvent }: NewsFeedProps) {
  const news = useIntelStore((state) => state.news);
  const events = useIntelStore((state) => state.events);
  const filters = useIntelStore((state) => state.filters);
  const selectedEvent = useIntelStore((state) => state.selectedEvent);
  const setSelectedEvent = useIntelStore((state) => state.setSelectedEvent);

  const visibleNews = useMemo(() => {
    const source = news.length ? news : events.filter(eventMatchesNews);
    return filterEvents(source, filters).slice(0, 7);
  }, [events, filters, news]);

  return (
    <section className="feed-block" aria-label="Live news feed">
      <div className="panel-heading">
        <span><Newspaper size={15} /> Live News Feed</span>
        <small>{visibleNews.length} headlines</small>
      </div>

      <div className="feed-list">
        {visibleNews.map((item) => (
          <article
            key={item.id}
            className={`feed-item ${selectedEvent?.id === item.id ? "is-active" : ""}`}
            onClick={() => {
              setSelectedEvent(item);
              onPickEvent?.(item);
            }}
          >
            <button type="button" aria-label={`Open ${item.title}`}>
              <span className={`category-dot category-dot--${item.category}`} />
              <strong>{item.title}</strong>
            </button>
            <p>{item.summary}</p>
            <div className="feed-item__meta">
              <span>{item.category}</span>
              <span>{item.region}</span>
              <span>{formatAge(item.timestamp)}</span>
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} title="Open source">
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!visibleNews.length ? (
        <div className="empty-state">
          <SignalHigh size={16} />
          <span>No news matches the current filter set.</span>
        </div>
      ) : null}
    </section>
  );
}
