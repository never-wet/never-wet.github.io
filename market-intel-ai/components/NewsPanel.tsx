"use client";

import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";

function timeAgo(value: number) {
  const minutes = Math.max(1, Math.floor((Date.now() - value) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NewsPanel() {
  const news = useMarketStore((state) => state.news);
  const newsLoading = useMarketStore((state) => state.newsLoading);
  const loadNews = useMarketStore((state) => state.loadNews);

  return (
    <section className="panel news-panel">
      <div className="panel-title">
        <div>
          <span className="panel-kicker">Financial news</span>
          <h2>Live Brief</h2>
        </div>
        <button type="button" className="icon-button" onClick={() => void loadNews()} aria-label="Refresh news">
          <RefreshCw size={15} className={newsLoading ? "spin" : ""} />
        </button>
      </div>

      <div className="news-list">
        {news.length ? (
          news.map((item) => (
            <a key={item.id} className="news-item" href={item.link} target="_blank" rel="noreferrer">
              <span className={`impact ${item.impact}`}>{item.impact}</span>
              <strong>{item.title}</strong>
              <small>
                {item.publisher} / {timeAgo(item.publishedAt)}
              </small>
              <p>{item.description}</p>
              <ExternalLink size={13} />
            </a>
          ))
        ) : (
          <div className="empty-state compact">
            <Newspaper size={16} />
            <span>Syncing real headlines...</span>
          </div>
        )}
      </div>
    </section>
  );
}
