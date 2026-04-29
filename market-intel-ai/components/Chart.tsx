"use client";

import {
  Area,
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, CandlestickChart, LineChart, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { type TimeRange } from "@/lib/api";
import { analyzeMarket, calculateEMA, calculateSMA } from "@/lib/prediction";
import { useMarketStore } from "@/store/useMarketStore";

const ranges: TimeRange[] = ["1D", "1W", "1M", "1Y"];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function formatCompact(value: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export default function Chart() {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const range = useMarketStore((state) => state.range);
  const setRange = useMarketStore((state) => state.setRange);
  const indicators = useMarketStore((state) => state.indicators);
  const toggleIndicator = useMarketStore((state) => state.toggleIndicator);
  const loadMarketData = useMarketStore((state) => state.loadMarketData);
  const loading = useMarketStore((state) => state.loading);

  const prediction = useMemo(
    () => (quote?.points.length ? analyzeMarket(quote.points) : null),
    [quote]
  );

  const chartData = useMemo(() => {
    if (!quote) return [];

    const closes = quote.points.map((point) => point.close);
    const sma = calculateSMA(closes, 20);
    const ema = calculateEMA(closes, 20);
    const historical = quote.points.map((point, index) => ({
      ...point,
      price: point.close,
      sma: sma[index],
      ema: ema[index],
      volumeK: point.volume / 1000
    }));

    if (!prediction || !indicators.forecast) return historical;

    return [
      ...historical,
      ...prediction.forecast.map((point) => ({
        time: point.time,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }).format(point.time),
        open: point.predicted,
        high: point.predicted,
        low: point.predicted,
        close: point.predicted,
        price: undefined,
        predicted: point.predicted,
        sma: undefined,
        ema: undefined,
        volumeK: 0
      }))
    ];
  }, [indicators.forecast, prediction, quote]);

  const priceColor = quote && quote.change >= 0 ? "var(--green)" : "var(--red)";

  if (!quote) {
    return (
      <section className="panel chart-panel">
        <div className="empty-state">
          <Activity size={22} />
          <span>Loading live market feed...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="panel chart-panel">
      <div className="chart-header">
        <div>
          <span className="panel-kicker">Live price chart</span>
          <div className="symbol-line">
            <h1>{quote.symbol}</h1>
            <span>{quote.name}</span>
          </div>
        </div>
        <div className="quote-stack">
          <strong style={{ color: priceColor }}>{currency.format(quote.price)}</strong>
          <span style={{ color: priceColor }}>
            {quote.change >= 0 ? "+" : ""}
            {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="chart-actions" aria-label="Chart controls">
          {ranges.map((item) => (
            <button
              key={item}
              className={range === item ? "is-active" : ""}
              type="button"
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
          <button type="button" onClick={() => void loadMarketData()} aria-label="Refresh market data">
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      <div className="indicator-row">
        <button
          type="button"
          className={indicators.sma ? "is-active" : ""}
          onClick={() => toggleIndicator("sma")}
        >
          <LineChart size={14} />
          SMA
        </button>
        <button
          type="button"
          className={indicators.ema ? "is-active" : ""}
          onClick={() => toggleIndicator("ema")}
        >
          <LineChart size={14} />
          EMA
        </button>
        <button
          type="button"
          className={indicators.forecast ? "is-active" : ""}
          onClick={() => toggleIndicator("forecast")}
        >
          <Activity size={14} />
          AI Forecast
        </button>
        <button type="button" className="is-active" aria-label="OHLC feed enabled">
          <CandlestickChart size={14} />
          OHLC
        </button>
      </div>

      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.34} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(235,241,235,0.56)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={38}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              tick={{ fill: "rgba(235,241,235,0.56)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <YAxis yAxisId="volume" hide domain={[0, "dataMax * 5"]} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.22)" }}
              contentStyle={{
                background: "rgba(12,14,13,0.96)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "var(--text)"
              }}
              formatter={(value, name) => {
                if (name === "volumeK") return [formatCompact(Number(value) * 1000), "Volume"];
                return [currency.format(Number(value)), String(name).toUpperCase()];
              }}
            />
            <Bar
              yAxisId="volume"
              dataKey="volumeK"
              fill="rgba(141, 214, 177, 0.16)"
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="var(--green)"
              strokeWidth={2.4}
              fill="url(#priceGradient)"
              isAnimationActive
              animationDuration={450}
              connectNulls
            />
            {indicators.sma ? (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma"
                dot={false}
                stroke="var(--amber)"
                strokeWidth={1.4}
                isAnimationActive={false}
              />
            ) : null}
            {indicators.ema ? (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ema"
                dot={false}
                stroke="var(--cyan)"
                strokeWidth={1.4}
                isAnimationActive={false}
              />
            ) : null}
            {indicators.forecast ? (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="predicted"
                dot={false}
                stroke="var(--violet)"
                strokeDasharray="6 6"
                strokeWidth={2}
                connectNulls
                isAnimationActive
              />
            ) : null}
            {prediction ? (
              <>
                <ReferenceLine
                  yAxisId="price"
                  y={prediction.support}
                  stroke="rgba(141,214,177,0.42)"
                  strokeDasharray="5 5"
                />
                <ReferenceLine
                  yAxisId="price"
                  y={prediction.resistance}
                  stroke="rgba(255,183,92,0.4)"
                  strokeDasharray="5 5"
                />
              </>
            ) : null}
            <Brush
              dataKey="label"
              height={22}
              travellerWidth={8}
              stroke="rgba(141,214,177,0.54)"
              fill="rgba(255,255,255,0.04)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
