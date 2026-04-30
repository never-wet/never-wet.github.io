"use client";

import {
  Download,
  Newspaper,
  Search,
  Server,
  Wifi
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Chart from "@/components/Chart";
import StockList from "@/components/StockList";
import { applyJournalLearning, downloadPredictionJournalReport } from "@/lib/learning";
import { analyzeAdaptiveMarket } from "@/lib/prediction";
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

type InspectorTab = "quote" | "ai" | "news";

function formatTime(value: number | null) {
  if (!value) return "pending";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}

function sessionClassName(state?: string) {
  if (state === "regular") return "session-state regular";
  if (state === "pre" || state === "post") return `session-state ${state}`;
  if (state === "closed") return "session-state closed";
  return "session-state";
}

function alphaStatusLabel(warning: string | null | undefined) {
  const text = warning?.toLowerCase() || "";
  if (!text) return null;
  if (text.includes("demo")) return "Alpha key needed";
  if (text.includes("rate") || text.includes("frequency") || text.includes("limit")) return "Alpha rate limit";
  if (text.includes("yahoo-only") || text.includes("standard stock")) return "Yahoo-only symbol";
  if (text.includes("not supported") || text.includes("invalid api call")) return "Alpha unsupported";
  if (text.includes("api key") || text.includes("apikey")) return "Alpha key issue";
  if (text.includes("time-series") || text.includes("no finite")) return "Alpha no data";
  return "Alpha unavailable";
}

function alphaStatusMessage(warning: string | null | undefined) {
  const text = warning?.toLowerCase() || "";
  if (text.includes("yahoo-only") || text.includes("standard stock")) {
    return "This selected market is Yahoo-only in this dashboard. Alpha Vantage comparison works with stock/ETF tickers like AAPL, MSFT, NVDA, SPY, and QQQ.";
  }
  return warning || null;
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

function TopBar() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const provider = useMarketStore((state) => state.provider);
  const setProvider = useMarketStore((state) => state.setProvider);
  const alphaApiKey = useMarketStore((state) => state.alphaApiKey);
  const setAlphaApiKey = useMarketStore((state) => state.setAlphaApiKey);
  const applyAlphaApiKey = useMarketStore((state) => state.applyAlphaApiKey);
  const lastUpdated = useMarketStore((state) => state.lastUpdated);
  const loading = useMarketStore((state) => state.loading);
  const error = useMarketStore((state) => state.error);
  const providerWarning = useMarketStore((state) => state.providerWarning);
  const providerLabel =
    provider === "alpha"
      ? alphaStatusLabel(providerWarning) ||
        (quote?.source === "Alpha Vantage"
          ? alphaApiKey
            ? "Alpha key active"
            : "Alpha demo"
          : alphaApiKey
            ? "Checking Alpha"
            : "Alpha key needed")
      : provider === "compare"
        ? alphaStatusLabel(providerWarning) ||
          (quote?.comparison
          ? "Yahoo vs Alpha"
            : alphaApiKey
              ? "Compare pending"
              : "Alpha key needed")
        : "Yahoo Finance";

  const sessionState = useMemo(() => {
    if (error) return "DATA WARNING";
    if (quote?.session) return quote.session.label;
    if (loading) return "SYNCING";
    return "CONNECTING";
  }, [error, loading, quote]);

  return (
    <header className="top-bar">
      <div className="brand-block">
        <span>MI</span>
        <div>
          <strong>Market Intel AI</strong>
          <small>Live market terminal</small>
        </div>
      </div>
      <SearchBox />
      <div className="provider-switch" aria-label="Market data source">
        {(["yahoo", "alpha", "compare"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={provider === item ? "is-active" : ""}
            onClick={() => void setProvider(item)}
          >
            {item === "yahoo" ? "Yahoo" : item === "alpha" ? "Alpha" : "Compare"}
          </button>
        ))}
      </div>
      {provider !== "yahoo" ? (
        <input
          className="api-key-input"
          type="password"
          value={alphaApiKey}
          placeholder="Alpha Vantage API key"
          title="Get a free Alpha Vantage key at https://www.alphavantage.co/support/#api-key. Press Enter after pasting it."
          onChange={(event) => setAlphaApiKey(event.target.value)}
          onBlur={(event) => void applyAlphaApiKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      ) : null}
      <div className="top-stats">
        <div className={sessionClassName(quote?.session?.state)} title={quote?.session?.detail}>
          <Wifi size={15} />
          <span>{sessionState}</span>
        </div>
        <div>
          <Server size={15} />
          <span title={providerWarning || undefined}>{providerLabel}</span>
        </div>
        <div>
          <span>Symbol</span>
          <strong>{selectedSymbol}</strong>
        </div>
        <div>
          <span>Last tick</span>
          <strong>{formatTime(lastUpdated)}</strong>
        </div>
      </div>
    </header>
  );
}

function timeAgo(value: number) {
  const minutes = Math.max(1, Math.floor((Date.now() - value) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function InspectorPanel({
  activeTab,
  setActiveTab
}: {
  activeTab: InspectorTab;
  setActiveTab: (tab: InspectorTab) => void;
}) {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const learningStats = useMarketStore((state) => state.learningStats[selectedSymbol]);
  const news = useMarketStore((state) => state.news);
  const newsLoading = useMarketStore((state) => state.newsLoading);
  const provider = useMarketStore((state) => state.provider);
  const alphaApiKey = useMarketStore((state) => state.alphaApiKey);
  const providerWarning = useMarketStore((state) => state.providerWarning);
  const loadNews = useMarketStore((state) => state.loadNews);

  const prediction = useMemo(
    () => (quote?.points.length ? applyJournalLearning(analyzeAdaptiveMarket(quote.points), learningStats) : null),
    [learningStats, quote]
  );
  const comparison = quote?.comparison;
  const sourceStatus = useMemo(() => {
    if (provider === "yahoo") return null;
    const mappedWarning = alphaStatusMessage(providerWarning);
    if (mappedWarning) return mappedWarning;
    if (!alphaApiKey) {
      return "Using Alpha Vantage demo access. Paste a free API key from alphavantage.co/support/#api-key, then press Enter.";
    }
    if (comparison) {
      return `${comparison.primarySource} ${money.format(comparison.primaryPrice)} vs ${comparison.secondarySource} ${money.format(comparison.secondaryPrice)}. Gap ${money.format(Math.abs(comparison.priceDifference))} (${Math.abs(comparison.priceDifferencePercent).toFixed(2)}%).`;
    }
    if (quote?.source === "Alpha Vantage") {
      return "Alpha Vantage selected-symbol feed active with your saved API key.";
    }
    return "Saved Alpha Vantage key applied. Waiting for the next source response.";
  }, [alphaApiKey, comparison, provider, providerWarning, quote?.source]);

  return (
    <aside className="panel inspector-panel">
      <div className="inspector-tabs" role="tablist">
        {(["quote", "ai", "news"] as InspectorTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="inspector-content">
        {activeTab === "quote" ? (
          <section className="inspector-section">
            <div className="panel-title">
              <div>
                <span className="panel-kicker">Market quote</span>
                <h2>{selectedSymbol}</h2>
              </div>
            </div>
            {sourceStatus ? (
              <div className={`source-status${providerWarning ? " warning" : ""}`}>
                {sourceStatus}
              </div>
            ) : null}
            {provider === "compare" && comparison ? (
              <div className="comparison-panel">
                <div className="comparison-row comparison-head">
                  <span>Source</span>
                  <span>Price</span>
                  <span>Updated</span>
                  <span>Candles</span>
                </div>
                <div className="comparison-row">
                  <strong>{comparison.primarySource}</strong>
                  <strong>{money.format(comparison.primaryPrice)}</strong>
                  <span>{formatTime(comparison.primaryLastUpdated)}</span>
                  <span>{comparison.primaryPointCount}</span>
                </div>
                <div className="comparison-row">
                  <strong>{comparison.secondarySource}</strong>
                  <strong>{money.format(comparison.secondaryPrice)}</strong>
                  <span>{formatTime(comparison.secondaryLastUpdated)}</span>
                  <span>{comparison.secondaryPointCount}</span>
                </div>
                <div className="comparison-gap">
                  <span>Source gap</span>
                  <strong className={comparison.priceDifference >= 0 ? "positive" : "negative"}>
                    {comparison.priceDifference >= 0 ? "+" : ""}
                    {money.format(comparison.priceDifference)} / {comparison.priceDifferencePercent.toFixed(2)}%
                  </strong>
                </div>
              </div>
            ) : null}
            <div className="metric-grid">
              <div><span>Last</span><strong>{quote ? money.format(quote.price) : "--"}</strong></div>
              <div>
                <span>Change</span>
                <strong className={quote && quote.change >= 0 ? "positive" : "negative"}>
                  {quote ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)` : "--"}
                </strong>
              </div>
              <div><span>Open</span><strong>{quote ? money.format(quote.points.at(-1)?.open || quote.price) : "--"}</strong></div>
              <div><span>High</span><strong>{quote ? money.format(quote.dayHigh) : "--"}</strong></div>
              <div><span>Low</span><strong>{quote ? money.format(quote.dayLow) : "--"}</strong></div>
              <div><span>Volume</span><strong>{quote ? compact.format(quote.volume) : "--"}</strong></div>
              <div><span>{quote?.extended?.label || "Extended"}</span><strong>{quote?.extended ? money.format(quote.extended.price) : "--"}</strong></div>
              <div><span>Provider</span><strong>{quote?.source || "Yahoo Finance"}</strong></div>
              {comparison ? (
                <>
                  <div><span>{comparison.secondarySource}</span><strong>{money.format(comparison.secondaryPrice)}</strong></div>
                  <div>
                    <span>Source gap</span>
                    <strong className={comparison.priceDifference >= 0 ? "positive" : "negative"}>
                      {comparison.priceDifference >= 0 ? "+" : ""}
                      {money.format(comparison.priceDifference)} ({comparison.priceDifferencePercent.toFixed(2)}%)
                    </strong>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeTab === "ai" ? (
          <section className="inspector-section">
            <div className="panel-title">
              <div>
                <span className="panel-kicker">AI prediction</span>
                <h2>{prediction?.sentiment || "Analyzing"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => downloadPredictionJournalReport(selectedSymbol)}
              >
                <Download size={14} />
                TXT
              </button>
            </div>
            <div className="prediction-callout">
              <span>{prediction?.trend || "SYNCING"}</span>
              <strong>{prediction ? `${prediction.confidence}% confidence / ${prediction.probabilityUp}% up probability` : "Waiting for OHLC history"}</strong>
            </div>
            <div className="metric-grid">
              <div><span>Risk</span><strong>{prediction?.riskLevel || "--"}</strong></div>
              <div><span>RSI</span><strong>{prediction ? prediction.rsi.toFixed(1) : "--"}</strong></div>
              <div><span>SMA 20</span><strong>{prediction ? money.format(prediction.sma) : "--"}</strong></div>
              <div><span>EMA 20</span><strong>{prediction ? money.format(prediction.ema) : "--"}</strong></div>
              <div><span>Support</span><strong>{prediction ? money.format(prediction.support) : "--"}</strong></div>
              <div><span>Resistance</span><strong>{prediction ? money.format(prediction.resistance) : "--"}</strong></div>
              <div><span>Backtest</span><strong>{prediction?.calibration.samples ? `${prediction.calibration.accuracy}% / ${prediction.calibration.samples}` : "Warming"}</strong></div>
              <div><span>Saved</span><strong>{learningStats?.samples ? `${learningStats.accuracy}% / ${learningStats.samples}` : "Recording"}</strong></div>
            </div>
          </section>
        ) : null}

        {activeTab === "news" ? (
          <section className="inspector-section">
            <div className="panel-title">
              <div>
                <span className="panel-kicker">Financial news</span>
                <h2>Live Brief</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => void loadNews()}>
                <Newspaper size={15} className={newsLoading ? "spin" : ""} />
              </button>
            </div>
            <div className="news-list">
              {news.length ? news.map((item) => (
                <a key={item.id} className="news-item" href={item.link} target="_blank" rel="noreferrer">
                  <span className={`impact ${item.impact}`}>{item.impact}</span>
                  <strong>{item.title}</strong>
                  <small>{item.publisher} / {timeAgo(item.publishedAt)}</small>
                  <p>{item.description}</p>
                </a>
              )) : <div className="empty-state compact">Syncing real headlines...</div>}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

export default function Home() {
  const loadMarketData = useMarketStore((state) => state.loadMarketData);
  const loadNews = useMarketStore((state) => state.loadNews);
  const pollingMs = useMarketStore((state) => state.pollingMs);
  const range = useMarketStore((state) => state.range);
  const watchlistKey = useMarketStore((state) => state.watchlist.join(","));
  const [activeTab, setActiveTab] = useState<InspectorTab>("quote");
  const [watchCollapsed, setWatchCollapsed] = useState(false);

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
    <main className={`terminal-shell${watchCollapsed ? " watch-collapsed" : ""}`}>
      <TopBar />
      <StockList collapsed={watchCollapsed} onToggleCollapsed={() => setWatchCollapsed((value) => !value)} />
      <Chart />
      <InspectorPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </main>
  );
}
