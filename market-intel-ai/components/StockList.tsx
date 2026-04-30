"use client";

import { ChevronsLeft, ChevronsRight, Minus } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";

const formatPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const displayNames: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "Nasdaq Composite",
  "^DJI": "Dow Jones",
  SPY: "SPDR S&P 500 ETF",
  QQQ: "Invesco QQQ ETF",
  AAPL: "Apple",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  "GC=F": "Gold Futures",
  "CL=F": "Crude Oil Futures",
  "EURUSD=X": "EUR/USD"
};

function displayName(symbol: string, quoteName?: string) {
  if (quoteName && quoteName !== symbol) return quoteName;
  return displayNames[symbol] || "Market";
}

type StockListProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export default function StockList({ collapsed = false, onToggleCollapsed }: StockListProps) {
  const watchlist = useMarketStore((state) => state.watchlist);
  const quotes = useMarketStore((state) => state.quotes);
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);
  const removeSymbol = useMarketStore((state) => state.removeSymbol);

  return (
    <section className={`panel stock-list${collapsed ? " is-collapsed" : ""}`}>
      <div className="panel-title">
        <div>
          <span className="panel-kicker">Tracked markets</span>
          <h2>Markets</h2>
        </div>
        <button
          type="button"
          className="icon-button rail-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand watchlist" : "Collapse watchlist"}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>

      <div className="stock-rows">
        {watchlist.map((symbol) => {
          const quote = quotes[symbol];
          const direction = quote ? (quote.change >= 0 ? "positive" : "negative") : "";

          return (
            <div
              key={symbol}
              className={`stock-row ${selectedSymbol === symbol ? "is-selected" : ""}`}
            >
              <button type="button" className="stock-row-main" onClick={() => void setSelectedSymbol(symbol)}>
                <span>
                  <strong>{symbol}</strong>
                  <small>{displayName(symbol, quote?.name)}</small>
                </span>
                <span>
                  <strong>{quote ? formatPrice.format(quote.price) : "--"}</strong>
                  <small className={direction}>
                    {quote ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%` : "sync"}
                  </small>
                </span>
              </button>
              <button
                type="button"
                className="stock-row-remove"
                aria-label={`Remove ${symbol}`}
                onClick={() => removeSymbol(symbol)}
              >
                <Minus size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
