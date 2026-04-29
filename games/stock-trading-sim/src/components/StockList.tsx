import { Activity } from "lucide-react";
import type { Stock } from "../types";
import { formatCurrency, formatPercent, formatVolume } from "./format";

interface StockListProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export function StockList({ stocks, selectedSymbol, onSelect }: StockListProps) {
  return (
    <section className="stock-list panel" aria-label="Stocks">
      <div className="panel-heading">
        <Activity size={17} aria-hidden="true" />
        <h2>Stocks</h2>
      </div>
      <div className="stock-table">
        {stocks.map((stock) => {
          const liveChange = stock.previousPrice > 0 ? (stock.price - stock.previousPrice) / stock.previousPrice : 0;

          return (
            <button
              key={stock.symbol}
              type="button"
              className={`stock-row ${selectedSymbol === stock.symbol ? "is-selected" : ""}`}
              onClick={() => onSelect(stock.symbol)}
            >
              <span className="stock-id">
                <strong>{stock.symbol}</strong>
                <small>{stock.sector}</small>
              </span>
              <span>{formatCurrency(stock.price)}</span>
              <span className={liveChange >= 0 ? "is-positive" : "is-negative"}>{formatPercent(liveChange)}</span>
              <span>{formatVolume(stock.volume)}</span>
              <span className={`risk-badge risk-${stock.risk}`}>R{stock.risk}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
