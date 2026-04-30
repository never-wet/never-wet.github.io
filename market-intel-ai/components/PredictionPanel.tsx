"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Download, Gauge, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { applyJournalLearning, downloadPredictionJournalReport } from "@/lib/learning";
import { analyzeAdaptiveMarket } from "@/lib/prediction";
import { useMarketStore } from "@/store/useMarketStore";

const formatPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export default function PredictionPanel() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const learningStats = useMarketStore((state) => state.learningStats[selectedSymbol]);

  const prediction = useMemo(
    () => (quote?.points.length ? applyJournalLearning(analyzeAdaptiveMarket(quote.points), learningStats) : null),
    [learningStats, quote]
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
        <div className="prediction-actions">
          <div className={`trend-badge ${positive ? "positive" : negative ? "negative" : ""}`}>
            {positive ? <ArrowUpRight size={18} /> : negative ? <ArrowDownRight size={18} /> : <Gauge size={18} />}
            {prediction.confidence}%
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Download prediction accuracy report"
            title="Download prediction accuracy report"
            onClick={() => downloadPredictionJournalReport(selectedSymbol)}
          >
            <Download size={14} />
            TXT
          </button>
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
          <span>Backtest Hit Rate</span>
          <strong>
            {prediction.calibration.samples
              ? `${prediction.calibration.accuracy}% / ${prediction.calibration.samples}`
              : "Warming up"}
          </strong>
        </div>
        <div>
          <span>Recorded Hit Rate</span>
          <strong>{learningStats?.samples ? `${learningStats.accuracy}% / ${learningStats.samples}` : "Recording"}</strong>
        </div>
        <div>
          <span>Saved Pending</span>
          <strong>{learningStats ? `${learningStats.pending} open` : "--"}</strong>
        </div>
        <div>
          <span>Calibration</span>
          <strong>
            {prediction.calibration.samples
              ? `${prediction.calibration.confidenceAdjustment >= 0 ? "+" : ""}${prediction.calibration.confidenceAdjustment} pts`
              : "--"}
          </strong>
        </div>
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
