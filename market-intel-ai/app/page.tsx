"use client";

import { Search, Server, Sparkles, Wifi } from "lucide-react";
import { useEffect, useMemo } from "react";
import Chart from "@/components/Chart";
import NewsPanel from "@/components/NewsPanel";
import Portfolio from "@/components/Portfolio";
import PredictionPanel from "@/components/PredictionPanel";
import StockList from "@/components/StockList";
import { useMarketStore } from "@/store/useMarketStore";

function formatTime(value: number | null) {
  if (!value) return "pending";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}

function SearchBox() {
  const query = useMarketStore((state) => state.searchQuery);
  const results = useMarketStore((state) => state.searchResults);
  const searchSymbols = useMarketStore((state) => state.searchSymbols);
  const addSymbol = useMarketStore((state) => state.addSymbol);
  const clearSearch = useMarketStore((state) => state.clearSearch);

  return (
    <div className="search-box">
      <Search size={16} />
      <input
        value={query}
        placeholder="Search symbol, company, ETF..."
        onChange={(event) => void searchSymbols(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && query.trim()) {
            void addSymbol(query.trim().toUpperCase());
            clearSearch();
          }
        }}
      />
      {results.length ? (
        <div className="search-results">
          {results.map((result) => (
            <button
              key={`${result.symbol}-${result.exchange}`}
              type="button"
              onClick={() => {
                void addSymbol(result.symbol);
                clearSearch();
              }}
            >
              <strong>{result.symbol}</strong>
              <span>{result.name}</span>
              <small>{result.exchange}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MarketSignals() {
  const sectorSignals = useMarketStore((state) => state.sectorSignals);

  return (
    <section className="panel signal-panel">
      <div className="panel-title">
        <div>
          <span className="panel-kicker">Market signals</span>
          <h2>Sector Tape</h2>
        </div>
        <Sparkles size={18} />
      </div>
      <div className="signal-list">
        {sectorSignals.map((signal) => (
          <div key={signal.symbol}>
            <span>
              <strong>{signal.sector}</strong>
              <small>{signal.symbol}</small>
            </span>
            <span className={signal.trend === "UP TREND" ? "positive" : signal.trend === "DOWN TREND" ? "negative" : ""}>
              {signal.trend}
            </span>
            <span>{signal.confidence}%</span>
            <span>{signal.risk}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopBar() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const lastUpdated = useMarketStore((state) => state.lastUpdated);
  const loading = useMarketStore((state) => state.loading);
  const error = useMarketStore((state) => state.error);

  const sessionState = useMemo(() => {
    if (error) return "DATA WARNING";
    if (loading) return "SYNCING";
    return "LIVE";
  }, [error, loading]);

  return (
    <header className="top-bar">
      <div className="brand-block">
        <span>MI</span>
        <div>
          <strong>Market Intel AI</strong>
          <small>Real-time stock analysis terminal</small>
        </div>
      </div>
      <SearchBox />
      <div className="top-stats">
        <div>
          <Wifi size={15} />
          <span>{sessionState}</span>
        </div>
        <div>
          <Server size={15} />
          <span>Yahoo Finance OHLC</span>
        </div>
        <div>
          <span>Last tick</span>
          <strong>{formatTime(lastUpdated)}</strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>
            {quote
              ? Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: 1
                }).format(quote.volume)
              : "--"}
          </strong>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const loadMarketData = useMarketStore((state) => state.loadMarketData);
  const loadNews = useMarketStore((state) => state.loadNews);
  const pollingMs = useMarketStore((state) => state.pollingMs);
  const range = useMarketStore((state) => state.range);
  const watchlistKey = useMarketStore((state) => state.watchlist.join(","));

  useEffect(() => {
    void loadMarketData();
    void loadNews();

    const marketInterval = window.setInterval(() => {
      void loadMarketData();
    }, pollingMs);
    const newsInterval = window.setInterval(() => {
      void loadNews();
    }, 60_000);

    return () => {
      window.clearInterval(marketInterval);
      window.clearInterval(newsInterval);
    };
  }, [loadMarketData, loadNews, pollingMs, range, watchlistKey]);

  return (
    <main className="terminal-shell">
      <TopBar />
      <StockList />
      <Chart />
      <aside className="right-rail">
        <PredictionPanel />
        <MarketSignals />
        <NewsPanel />
      </aside>
      <Portfolio />
    </main>
  );
}
