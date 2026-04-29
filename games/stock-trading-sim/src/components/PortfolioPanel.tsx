import { BriefcaseBusiness } from "lucide-react";
import type { PortfolioSummary } from "../types";
import { formatCurrency, formatPercent } from "./format";

interface PortfolioPanelProps {
  summary: PortfolioSummary;
  onSelect: (symbol: string) => void;
}

export function PortfolioPanel({ summary, onSelect }: PortfolioPanelProps) {
  return (
    <section className="portfolio-panel panel" aria-label="Portfolio">
      <div className="panel-heading">
        <BriefcaseBusiness size={17} aria-hidden="true" />
        <h2>Portfolio</h2>
      </div>

      <div className="portfolio-summary-grid">
        <div>
          <span>Net Worth</span>
          <strong>{formatCurrency(summary.netWorth)}</strong>
        </div>
        <div>
          <span>Invested</span>
          <strong>{formatCurrency(summary.investedValue)}</strong>
        </div>
        <div className={summary.unrealizedPnl >= 0 ? "is-positive" : "is-negative"}>
          <span>Unrealized</span>
          <strong>{formatCurrency(summary.unrealizedPnl)}</strong>
        </div>
        <div>
          <span>Realized</span>
          <strong>{formatCurrency(summary.realizedPnl)}</strong>
        </div>
      </div>

      {summary.lines.length ? (
        <div className="holding-list">
          {summary.lines.map((line) => (
            <button key={line.symbol} type="button" className="holding-row" onClick={() => onSelect(line.symbol)}>
              <span>
                <strong>{line.symbol}</strong>
                <small>{line.shares} shares at avg {formatCurrency(line.averagePrice)}</small>
              </span>
              <span>
                <strong>{formatCurrency(line.currentValue)}</strong>
                <small className={line.unrealizedPnl >= 0 ? "is-positive" : "is-negative"}>
                  {formatCurrency(line.unrealizedPnl)} {formatPercent(line.unrealizedPnlPct)}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No holdings yet</strong>
          <span>Pick a stock and place an order to build your book.</span>
        </div>
      )}
    </section>
  );
}
