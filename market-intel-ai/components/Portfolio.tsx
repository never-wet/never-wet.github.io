"use client";

import { Database, Gauge, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { analyzeMarket } from "@/lib/prediction";
import { useMarketStore } from "@/store/useMarketStore";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

export default function Portfolio() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const lastUpdated = useMarketStore((state) => state.lastUpdated);

  const prediction = useMemo(
    () => (quote?.points.length ? analyzeMarket(quote.points) : null),
    [quote]
  );

  return (
    <section className="portfolio-dock">
      <div className="panel portfolio-summary">
        <div className="panel-title">
          <div>
            <span className="panel-kicker">Market quote</span>
            <h2>{selectedSymbol}</h2>
          </div>
          <Gauge size={18} />
        </div>
        <div className="portfolio-stats">
          <div>
            <span>Last</span>
            <strong>{quote ? money.format(quote.price) : "--"}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong className={quote && quote.change >= 0 ? "positive" : "negative"}>
              {quote ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)` : "--"}
            </strong>
          </div>
          <div>
            <span>Volume</span>
            <strong>{quote ? compact.format(quote.volume) : "--"}</strong>
          </div>
          <div>
            <span>Session Range</span>
            <strong>{quote ? `${money.format(quote.dayLow)} - ${money.format(quote.dayHigh)}` : "--"}</strong>
          </div>
        </div>
      </div>

      <div className="panel order-ticket">
        <div className="panel-title">
          <div>
            <span className="panel-kicker">Risk context</span>
            <h2>Model Snapshot</h2>
          </div>
          <ShieldCheck size={18} />
        </div>
        <div className="ticket-meta">
          <span>Trend</span>
          <strong>{prediction ? prediction.trend : "--"}</strong>
        </div>
        <div className="ticket-meta">
          <span>Confidence</span>
          <strong>{prediction ? `${prediction.confidence}%` : "--"}</strong>
        </div>
        <div className="ticket-meta">
          <span>Volatility</span>
          <strong>{prediction ? `${prediction.volatility.toFixed(1)}% / ${prediction.riskLevel}` : "--"}</strong>
        </div>
      </div>

      <div className="panel order-book">
        <div className="panel-title">
          <div>
            <span className="panel-kicker">Data feed</span>
            <h2>Provider</h2>
          </div>
          <Database size={18} />
        </div>
        <div className="order-list">
          <div>
            <span>Source</span>
            <strong>Yahoo Finance chart endpoint</strong>
            <span>Last sync</span>
            <span>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
