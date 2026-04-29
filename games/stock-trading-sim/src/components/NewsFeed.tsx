import { Newspaper } from "lucide-react";
import type { NewsItem, TradeRecord } from "../types";
import { formatCurrency } from "./format";

interface NewsFeedProps {
  news: NewsItem[];
  trades: TradeRecord[];
  milestones: string[];
}

export function NewsFeed({ news, trades, milestones }: NewsFeedProps) {
  return (
    <details className="news-panel panel" aria-label="News feed">
      <summary className="panel-heading">
        <Newspaper size={17} aria-hidden="true" />
        <h2>News & Tape</h2>
        <span>{news.length} updates</span>
      </summary>

      <div className="news-panel__body">
        {milestones.length ? (
          <div className="milestone-strip">
            {milestones.map((milestone) => (
              <span key={milestone}>{milestone}</span>
            ))}
          </div>
        ) : null}

        <div className="feed-list">
          {news.map((item) => (
            <article key={item.id} className={`feed-item tone-${item.tone}`}>
              <span>Tick {item.tick}</span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </article>
          ))}
        </div>

        {trades.length ? (
          <div className="trade-tape">
            <h3>Recent trades</h3>
            {trades.slice(0, 5).map((trade) => (
              <div key={trade.id}>
                <span>{trade.side.toUpperCase()} {trade.shares} {trade.symbol}</span>
                <strong>{formatCurrency(trade.total)}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
