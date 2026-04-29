"use client";

import { Minus, Plus, RadioTower } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";

const formatPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const quickAdds = ["META", "AMD", "NFLX", "BA", "COST", "DIS"];

export default function StockList() {
  const watchlist = useMarketStore((state) => state.watchlist);
  const quotes = useMarketStore((state) => state.quotes);
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);
  const addSymbol = useMarketStore((state) => state.addSymbol);
  const removeSymbol = useMarketStore((state) => state.removeSymbol);

  return (
    <section className="panel stock-list">
      <div className="panel-title">
        <div>
          <span className="panel-kicker">Tracked stocks</span>
          <h2>Watchlist</h2>
        </div>
        <RadioTower size={18} />
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
                  <small>{quote?.exchange || "Loading"}</small>
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

      <div className="quick-adds" aria-label="Quick add symbols">
        {quickAdds
          .filter((symbol) => !watchlist.includes(symbol))
          .slice(0, 4)
          .map((symbol) => (
            <button key={symbol} type="button" onClick={() => void addSymbol(symbol)}>
              <Plus size={13} />
              {symbol}
            </button>
          ))}
      </div>
    </section>
  );
}
