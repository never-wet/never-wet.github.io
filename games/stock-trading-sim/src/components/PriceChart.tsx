import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Holding, Stock } from "../types";
import { formatCurrency, formatPercent, formatVolume } from "./format";

interface PriceChartProps {
  stock: Stock;
  holding?: Holding;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { price: number; volume: number; tick: number } }>;
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>Tick {point.tick}</strong>
      <span>{formatCurrency(point.price)}</span>
      <small>Volume {formatVolume(point.volume)}</small>
    </div>
  );
}

export function PriceChart({ stock, holding }: PriceChartProps) {
  const changePct = stock.previousPrice > 0 ? (stock.price - stock.previousPrice) / stock.previousPrice : 0;
  const sessionPct = stock.openPrice > 0 ? (stock.price - stock.openPrice) / stock.openPrice : 0;
  const lineColor = changePct >= 0 ? "#19784d" : "#b33b46";

  return (
    <section className="chart-panel" aria-label={`${stock.symbol} price chart`}>
      <div className="chart-header">
        <div>
          <p className="eyebrow">{stock.sector} / {stock.symbol}</p>
          <h2>{stock.name}</h2>
        </div>
        <div className="price-stack">
          <strong>{formatCurrency(stock.price)}</strong>
          <span className={changePct >= 0 ? "is-positive" : "is-negative"}>
            {formatPercent(changePct)} live
          </span>
        </div>
      </div>

      <div className="chart-meta">
        <span>Session {formatPercent(sessionPct)}</span>
        <span>Trend {formatPercent(stock.trend, 3)}</span>
        <span>Volatility {(stock.volatility * 100).toFixed(1)}%</span>
        <span>Volume {formatVolume(stock.volume)}</span>
        {holding ? <span>Avg {formatCurrency(holding.averagePrice)}</span> : null}
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={stock.history} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#d9d4c7" strokeDasharray="3 7" vertical={false} />
            <XAxis dataKey="tick" tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: "#69655d", fontSize: 11 }} />
            <YAxis
              yAxisId="price"
              domain={["dataMin - 2", "dataMax + 2"]}
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fill: "#69655d", fontSize: 11 }}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
            />
            <YAxis yAxisId="volume" orientation="right" hide domain={[0, "dataMax"]} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              yAxisId="volume"
              type="stepAfter"
              dataKey="volume"
              stroke="none"
              fill="#d2b55b"
              fillOpacity={0.14}
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="none"
              fill="url(#priceFill)"
              isAnimationActive={false}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
