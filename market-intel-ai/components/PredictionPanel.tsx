"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Gauge, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { analyzeMarket } from "@/lib/prediction";
import { useMarketStore } from "@/store/useMarketStore";

const formatPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export default function PredictionPanel() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);

  const prediction = useMemo(
    () => (quote?.points.length ? analyzeMarket(quote.points) : null),
    [quote]
  );

  if (!prediction) {
    return (
      <section className="panel prediction-panel">
        <div className="empty-state compact">AI model waiting for OHLC history...</div>
      </section>
    );
  }

  const positive = prediction.trend === "UP TREND";
  const negative = prediction.trend === "DOWN TREND";

  return (
    <section className="panel prediction-panel">
      <div className="panel-title">
        <div>
          <span className="panel-kicker">AI prediction</span>
          <h2>{prediction.sentiment}</h2>
        </div>
        <div className={`trend-badge ${positive ? "positive" : negative ? "negative" : ""}`}>
          {positive ? <ArrowUpRight size={18} /> : negative ? <ArrowDownRight size={18} /> : <Gauge size={18} />}
          {prediction.confidence}%
        </div>
      </div>

      <div className="prediction-callout">
        <span>{prediction.trend}</span>
        <strong>
          Prediction: {prediction.sentiment} ({prediction.probabilityUp}% up probability)
        </strong>
      </div>

      <div className="metric-grid">
        <div>
          <span>Risk</span>
          <strong>{prediction.riskLevel}</strong>
        </div>
        <div>
          <span>RSI</span>
          <strong>{prediction.rsi.toFixed(1)}</strong>
        </div>
        <div>
          <span>SMA 20</span>
          <strong>{formatPrice.format(prediction.sma)}</strong>
        </div>
        <div>
          <span>EMA 20</span>
          <strong>{formatPrice.format(prediction.ema)}</strong>
        </div>
        <div>
          <span>Support</span>
          <strong>{formatPrice.format(prediction.support)}</strong>
        </div>
        <div>
          <span>Resistance</span>
          <strong>{formatPrice.format(prediction.resistance)}</strong>
        </div>
      </div>

      <div className="risk-strip">
        {prediction.volatilityLabel === "HIGH VOLATILITY" ? (
          <AlertTriangle size={15} />
        ) : (
          <ShieldCheck size={15} />
        )}
        <span>
          {prediction.volatilityLabel} / annualized volatility {prediction.volatility.toFixed(1)}%
        </span>
      </div>

      <ul className="reason-list">
        {prediction.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}
