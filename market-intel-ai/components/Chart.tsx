"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, CandlestickChart, LineChart, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { type PointerEvent, type WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type MarketPoint, type TimeRange } from "@/lib/api";
import { applyJournalLearning } from "@/lib/learning";
import { analyzeAdaptiveMarket, calculateEMA, calculateSMA } from "@/lib/prediction";
import { useMarketStore } from "@/store/useMarketStore";

const ranges: TimeRange[] = ["1D", "1W", "1M", "1Y"];
const minVisiblePoints = 24;
const defaultViewSpan = 0.8;
const wheelZoomIn = 0.82;
const wheelZoomOut = 1.22;
const chartHorizontalPadding = 68;

type VisibleWindow = {
  visibleStartIndex: number;
  visibleEndIndex: number;
};

type ChartView = VisibleWindow & {
  key: string;
};

type PanState = VisibleWindow & {
  pointerId: number;
  startX: number;
};

type ChartDatum = {
  time: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  price?: number;
  comparisonPrice?: number;
  predicted?: number;
  sma?: number;
  ema?: number;
  volumeK: number;
};

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

function formatSignedMoney(value: number) {
  return `${value >= 0 ? "+" : ""}${currency.format(value)}`;
}

function formatChartTime(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

function sourceShortName(source?: string) {
  if (!source) return "Compare";
  if (/yahoo/i.test(source)) return "Yahoo";
  if (/alpha/i.test(source)) return "Alpha";
  return source;
}

function ChartTooltip({
  active,
  payload,
  primarySource = "Yahoo",
  comparisonSource = "Compare"
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  primarySource?: string;
  comparisonSource?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const price = point.price ?? point.predicted ?? point.close;
  const hasComparison = isValidPrice(point.comparisonPrice);

  return (
    <div className="chart-tooltip">
      <strong>{formatChartTime(point.time)}</strong>
      {hasComparison ? (
        <>
          <span className="tooltip-source source-yahoo">
            {sourceShortName(primarySource)} {currency.format(price)}
          </span>
          <span className="tooltip-source source-alpha">
            {sourceShortName(comparisonSource)} {currency.format(point.comparisonPrice!)}
          </span>
        </>
      ) : (
        <span>Close {currency.format(price)}</span>
      )}
      <small>O {currency.format(point.open)} / H {currency.format(point.high)} / L {currency.format(point.low)}</small>
      <small>Volume {formatCompact(point.volume)}</small>
    </div>
  );
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validPrices(values: Array<number | undefined>) {
  return values.filter(isValidPrice);
}

function comparisonTolerance(range: TimeRange) {
  if (range === "1D") return 7 * 60 * 1000;
  if (range === "1W") return 35 * 60 * 1000;
  if (range === "1M") return 36 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

function nearestComparisonPrice(points: MarketPoint[] | undefined, time: number, range: TimeRange) {
  if (!points?.length) return undefined;

  const tolerance = comparisonTolerance(range);
  let bestPrice: number | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const delta = Math.abs(point.time - time);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestPrice = point.close;
    }
    if (point.time > time && delta > bestDelta) break;
  }

  return bestDelta <= tolerance && isValidPrice(bestPrice) ? bestPrice : undefined;
}

function safePrice(value: number | undefined, fallback: number) {
  return isValidPrice(value) ? value : fallback;
}

function minVisibleCount(total: number) {
  return Math.min(total, minVisiblePoints);
}

function defaultVisibleCount(total: number) {
  return Math.min(total, Math.max(minVisibleCount(total), Math.ceil(total * defaultViewSpan)));
}

function normalizeVisibleWindow(startIndex: number, endIndex: number, total: number): VisibleWindow {
  if (!total) return { visibleStartIndex: 0, visibleEndIndex: 0 };

  const minimum = minVisibleCount(total);
  const span = clampValue(Math.round(endIndex - startIndex), minimum, total);
  const start = clampValue(Math.round(startIndex), 0, Math.max(0, total - span));

  return {
    visibleStartIndex: start,
    visibleEndIndex: start + span
  };
}

function defaultVisibleWindow(total: number): VisibleWindow {
  const count = defaultVisibleCount(total);
  return normalizeVisibleWindow(total - count, total, total);
}

function activeVisibleWindow(view: ChartView, key: string, total: number): VisibleWindow {
  if (view.key !== key || !view.visibleEndIndex) return defaultVisibleWindow(total);
  return normalizeVisibleWindow(view.visibleStartIndex, view.visibleEndIndex, total);
}

export default function Chart() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const quote = useMarketStore((state) => state.quotes[selectedSymbol]);
  const range = useMarketStore((state) => state.range);
  const setRange = useMarketStore((state) => state.setRange);
  const provider = useMarketStore((state) => state.provider);
  const indicators = useMarketStore((state) => state.indicators);
  const toggleIndicator = useMarketStore((state) => state.toggleIndicator);
  const loadMarketData = useMarketStore((state) => state.loadMarketData);
  const loading = useMarketStore((state) => state.loading);
  const learningStats = useMarketStore((state) => state.learningStats[selectedSymbol]);
  const viewKey = `${selectedSymbol}:${range}`;
  const comparison = quote?.comparison;
  const showComparison = provider === "compare" && Boolean(comparison?.secondaryPoints?.length);
  const [chartView, setChartView] = useState<ChartView>({
    key: "",
    visibleStartIndex: 0,
    visibleEndIndex: 0
  });
  const [panState, setPanState] = useState<PanState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverDatum, setHoverDatum] = useState<ChartDatum | null>(null);

  const prediction = useMemo(
    () => (quote?.points.length ? applyJournalLearning(analyzeAdaptiveMarket(quote.points), learningStats) : null),
    [learningStats, quote]
  );

  const chartWindow = useMemo(() => {
    if (!quote?.points.length) {
      return { points: [], visibleStartIndex: 0, visibleEndIndex: 0 };
    }

    const points = quote.points;
    const window = activeVisibleWindow(chartView, viewKey, points.length);
    return {
      points: points.slice(window.visibleStartIndex, window.visibleEndIndex),
      ...window
    };
  }, [chartView, quote, viewKey]);

  const visiblePoints = chartWindow.points;

  const handleChartWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const total = quote?.points.length ?? 0;
      if (total <= minVisiblePoints) return;

      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const plotWidth = Math.max(rect.width - chartHorizontalPadding, 1);
      const focus = clampValue((event.clientX - rect.left - chartHorizontalPadding / 2) / plotWidth, 0, 1);
      const factor = event.deltaY > 0 ? wheelZoomOut : wheelZoomIn;

      setChartView((current) => {
        const currentWindow = activeVisibleWindow(current, viewKey, total);
        const span = currentWindow.visibleEndIndex - currentWindow.visibleStartIndex;
        const nextSpan = clampValue(Math.round(span * factor), minVisibleCount(total), total);
        const anchor = currentWindow.visibleStartIndex + span * focus;
        const next = normalizeVisibleWindow(anchor - nextSpan * focus, anchor + nextSpan * (1 - focus), total);

        return {
          key: viewKey,
          ...next
        };
      });
    },
    [quote?.points.length, viewKey]
  );

  const handleChartPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const total = quote?.points.length ?? 0;
      if (event.button !== 0 || total <= minVisiblePoints) return;

      const window = activeVisibleWindow(chartView, viewKey, total);
      event.currentTarget.setPointerCapture(event.pointerId);
      setPanState({
        pointerId: event.pointerId,
        startX: event.clientX,
        visibleStartIndex: window.visibleStartIndex,
        visibleEndIndex: window.visibleEndIndex
      });
    },
    [chartView, quote?.points.length, viewKey]
  );

  const handleChartPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const total = quote?.points.length ?? 0;
      if (!panState || panState.pointerId !== event.pointerId || total <= minVisiblePoints) return;

      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const plotWidth = Math.max(rect.width - chartHorizontalPadding, 1);
      const span = panState.visibleEndIndex - panState.visibleStartIndex;
      const deltaPoints = Math.round(((panState.startX - event.clientX) / plotWidth) * span);
      const next = normalizeVisibleWindow(
        panState.visibleStartIndex + deltaPoints,
        panState.visibleEndIndex + deltaPoints,
        total
      );

      setChartView({
        key: viewKey,
        ...next
      });
    },
    [panState, quote?.points.length, viewKey]
  );

  const handleChartPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    setPanState((current) => {
      if (!current || current.pointerId !== event.pointerId) return current;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      return null;
    });
  }, []);

  const toggleChartFullscreen = useCallback(async () => {
    const node = chartRef.current;
    if (!node) return;

    if (document.fullscreenElement === node) {
      await document.exitFullscreen();
      return;
    }

    await node.requestFullscreen();
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === chartRef.current);
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const chartData = useMemo<ChartDatum[]>(() => {
    if (!quote) return [];

    const closes = quote.points.map((point) => safePrice(point.close, quote.price));
    const sma = calculateSMA(closes, 20).slice(chartWindow.visibleStartIndex, chartWindow.visibleEndIndex);
    const ema = calculateEMA(closes, 20).slice(chartWindow.visibleStartIndex, chartWindow.visibleEndIndex);
    const comparisonPoints = provider === "compare" ? quote.comparison?.secondaryPoints : undefined;
    const historical = visiblePoints.map((point, index) => ({
      ...point,
      price: safePrice(point.close, quote.price),
      comparisonPrice: nearestComparisonPrice(comparisonPoints, point.time, range),
      high: Math.max(
        safePrice(point.high, safePrice(point.close, quote.price)),
        safePrice(point.close, quote.price),
        safePrice(point.open, safePrice(point.close, quote.price))
      ),
      low: Math.min(
        safePrice(point.low, safePrice(point.close, quote.price)),
        safePrice(point.close, quote.price),
        safePrice(point.open, safePrice(point.close, quote.price))
      ),
      sma: sma[index],
      ema: ema[index],
      volumeK: point.volume / 1000
    }));

    if (!prediction || !indicators.forecast || chartWindow.visibleEndIndex < quote.points.length) return historical;

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
        volume: 0,
        price: undefined,
        predicted: point.predicted,
        sma: undefined,
        ema: undefined,
        volumeK: 0
      }))
    ];
  }, [chartWindow.visibleEndIndex, chartWindow.visibleStartIndex, indicators.forecast, prediction, provider, quote, range, visiblePoints]);

  const visibleLevels = useMemo(() => {
    const lows = validPrices(visiblePoints.map((point) => safePrice(point.low, point.close)));
    const highs = validPrices(visiblePoints.map((point) => safePrice(point.high, point.close)));

    return {
      support: lows.length ? Math.min(...lows) : quote?.price ?? 0,
      resistance: highs.length ? Math.max(...highs) : quote?.price ?? 0
    };
  }, [quote?.price, visiblePoints]);

  const priceDomain = useMemo<[number, number]>(() => {
    const values = validPrices(
      chartData.flatMap((point) => [
        point.low,
        point.high,
        point.price,
        point.comparisonPrice,
        "predicted" in point ? point.predicted : undefined,
        point.sma,
        point.ema
      ])
    );

    if (!values.length) return [0, 1];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.08, Math.abs(max) * 0.002, 0.01);
    return [min - padding, max + padding];
  }, [chartData]);

  const priceColor = quote && quote.change >= 0 ? "var(--green)" : "var(--red)";
  const primarySeriesColor = provider === "compare" ? "var(--violet)" : "var(--green)";
  const comparisonSeriesColor = "var(--red)";
  const forecastSeriesColor = provider === "compare" ? "var(--cyan)" : "var(--violet)";
  const extendedColor = quote?.extended
    ? quote.extended.change >= 0
      ? "var(--green)"
      : "var(--red)"
    : "var(--muted)";
  const readoutPoint = hoverDatum || chartData.filter((point) => point.price).at(-1) || visiblePoints.at(-1) || null;
  const readoutComparisonPrice =
    readoutPoint && "comparisonPrice" in readoutPoint && isValidPrice(readoutPoint.comparisonPrice)
      ? readoutPoint.comparisonPrice
      : null;
  const readoutPrimaryPrice =
    readoutPoint && "price" in readoutPoint && isValidPrice(readoutPoint.price)
      ? readoutPoint.price
      : readoutPoint?.close ?? 0;
  const windowLabel = visiblePoints.length
    ? `${formatChartTime(visiblePoints[0].time)} - ${formatChartTime(visiblePoints.at(-1)!.time)} / ${visiblePoints.length} candles`
    : "Move over chart for time, price, and OHLC";
  const readoutText = readoutPoint
    ? `${formatChartTime(readoutPoint.time)}  ${
        readoutComparisonPrice
          ? `${sourceShortName(comparison?.primarySource)} ${currency.format(readoutPrimaryPrice)}  ${sourceShortName(comparison?.secondarySource)} ${currency.format(readoutComparisonPrice)}`
          : `Close ${currency.format(readoutPoint.close)}`
      }  O ${currency.format(readoutPoint.open)}  H ${currency.format(readoutPoint.high)}  L ${currency.format(readoutPoint.low)}  Vol ${formatCompact(readoutPoint.volume)}`
    : windowLabel;

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
          {quote.extended ? (
            <span className="extended-quote" style={{ color: extendedColor }}>
              {quote.extended.label} {currency.format(quote.extended.price)}{" "}
              {formatSignedMoney(quote.extended.change)} ({quote.extended.changePercent.toFixed(2)}%)
            </span>
          ) : null}
          {provider === "compare" && comparison ? (
            <span className="compare-spread">
              Gap {formatSignedMoney(comparison.priceDifference)} ({comparison.priceDifferencePercent.toFixed(2)}%)
            </span>
          ) : null}
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
        {provider === "compare" ? (
          <div
            className={`compare-legend${showComparison ? "" : " is-waiting"}`}
            title={showComparison ? "Compare legend: Yahoo is purple, Alpha is red" : "Waiting for Alpha comparison data"}
            aria-label={showComparison ? "Yahoo purple line and Alpha red line" : "Waiting for Alpha comparison data"}
          >
            {showComparison && comparison ? (
              <>
                <span className="source-legend source-yahoo">Yahoo</span>
                <span className="source-legend source-alpha">Alpha</span>
              </>
            ) : (
              <span className="source-legend source-waiting">Alpha pending</span>
            )}
          </div>
        ) : null}
        <div className="chart-readout" title={readoutText}>
          {readoutText}
        </div>
      </div>

      <div
        ref={chartRef}
        className={`chart-canvas${panState ? " is-panning" : ""}`}
        onWheel={handleChartWheel}
        onPointerDown={handleChartPointerDown}
        onPointerMove={handleChartPointerMove}
        onPointerUp={handleChartPointerUp}
        onPointerCancel={handleChartPointerUp}
      >
        <button
          className="chart-fullscreen-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void toggleChartFullscreen();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={isFullscreen ? "Exit full screen chart" : "Full screen chart"}
          title={isFullscreen ? "Exit full screen chart" : "Full screen chart"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 0, bottom: 2 }}
            onMouseMove={(nextState) => {
              const activePayload = (nextState as { activePayload?: Array<{ payload: ChartDatum }> }).activePayload;
              setHoverDatum(activePayload?.[0]?.payload ?? null);
            }}
            onMouseLeave={() => setHoverDatum(null)}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={primarySeriesColor} stopOpacity={0.34} />
                <stop offset="100%" stopColor={primarySeriesColor} stopOpacity={0.02} />
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
              domain={priceDomain}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              tick={{ fill: "rgba(235,241,235,0.56)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <YAxis yAxisId="volume" hide domain={[0, "dataMax * 5"]} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.22)" }}
              content={
                <ChartTooltip
                  primarySource={comparison?.primarySource}
                  comparisonSource={comparison?.secondarySource}
                />
              }
            />
            <Bar
              yAxisId="volume"
              dataKey="volumeK"
              fill={provider === "compare" ? "rgba(199, 164, 255, 0.14)" : "rgba(141, 214, 177, 0.16)"}
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={primarySeriesColor}
              strokeWidth={2.4}
              fill="url(#priceGradient)"
              isAnimationActive={false}
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
            {showComparison ? (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="comparisonPrice"
                dot={false}
                stroke={comparisonSeriesColor}
                strokeDasharray="4 4"
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            {indicators.forecast ? (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="predicted"
                dot={false}
                stroke={forecastSeriesColor}
                strokeDasharray="6 6"
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            {prediction ? (
              <>
                <ReferenceLine
                  yAxisId="price"
                  y={visibleLevels.support}
                  stroke="rgba(141,214,177,0.42)"
                  strokeDasharray="5 5"
                />
                <ReferenceLine
                  yAxisId="price"
                  y={visibleLevels.resistance}
                  stroke="rgba(255,183,92,0.4)"
                  strokeDasharray="5 5"
                />
              </>
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
