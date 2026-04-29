import { NextRequest, NextResponse } from "next/server";
import type { MarketPoint, StockQuote, TimeRange } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const YAHOO_RANGE: Record<TimeRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "1m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" }
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        symbol?: string;
        exchangeName?: string;
        fullExchangeName?: string;
        regularMarketPrice?: number;
        regularMarketVolume?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
        longName?: string;
        shortName?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string };
  };
};

type YahooQuote = {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function sanitizeSymbols(value: string | null) {
  const symbols = (value || "AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.^-]{1,12}$/.test(symbol));

  return [...new Set(symbols)].slice(0, 14);
}

function getRange(value: string | null): TimeRange {
  return value === "1W" || value === "1M" || value === "1Y" ? value : "1D";
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculateVolatility(points: MarketPoint[]) {
  if (points.length < 3) return 0;
  const returns = points.slice(1).map((point, index) => {
    const previous = points[index].close;
    return previous ? (point.close - previous) / previous : 0;
  });
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100, 2);
}

function toPoint(time: number, index: number, quote: YahooQuote): MarketPoint | null {
  const close = quote.close?.[index];
  if (!isFiniteNumber(close)) return null;

  const open = quote.open?.[index];
  const high = quote.high?.[index];
  const low = quote.low?.[index];
  const volume = quote.volume?.[index];
  const timestamp = time * 1000;

  return {
    time: timestamp,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(timestamp),
    open: isFiniteNumber(open) ? round(open) : round(close),
    high: isFiniteNumber(high) ? round(high) : round(close),
    low: isFiniteNumber(low) ? round(low) : round(close),
    close: round(close),
    volume: isFiniteNumber(volume) ? volume : 0
  };
}

async function fetchChart(symbol: string, range: TimeRange): Promise<StockQuote> {
  const config = YAHOO_RANGE[range];
  const params = new URLSearchParams({
    range: config.range,
    interval: config.interval,
    includePrePost: "false",
    events: "div|split|capitalGain",
    lang: "en-US",
    region: "US"
  });

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?${params.toString()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 MarketIntelAI/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned ${response.status}`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const error = payload.chart?.error?.description;
  if (!result || error) throw new Error(error || "No chart data returned");

  const quote = result.indicators?.quote?.[0];
  if (!quote || !result.timestamp?.length) throw new Error("Missing OHLC payload");

  const points = result.timestamp
    .map((time, index) => toPoint(time, index, quote))
    .filter((point): point is MarketPoint => Boolean(point));

  if (!points.length) throw new Error("No finite price points returned");

  const meta = result.meta || {};
  const latest = points.at(-1)!;
  const price = round(meta.regularMarketPrice ?? latest.close);
  const previousClose = round(meta.chartPreviousClose ?? meta.previousClose ?? points[0].close);
  const change = round(price - previousClose);
  const changePercent = previousClose ? round((change / previousClose) * 100) : 0;

  return {
    symbol: (meta.symbol || symbol).toUpperCase(),
    name: meta.longName || meta.shortName || symbol.toUpperCase(),
    exchange: meta.fullExchangeName || meta.exchangeName || "Market",
    currency: meta.currency || "USD",
    price,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? latest.volume,
    dayHigh: round(meta.regularMarketDayHigh ?? Math.max(...points.map((point) => point.high))),
    dayLow: round(meta.regularMarketDayLow ?? Math.min(...points.map((point) => point.low))),
    previousClose,
    volatility: calculateVolatility(points),
    lastUpdated: (meta.regularMarketTime || Math.floor(Date.now() / 1000)) * 1000,
    points
  };
}

export async function GET(request: NextRequest) {
  const range = getRange(request.nextUrl.searchParams.get("range"));
  const symbols = sanitizeSymbols(request.nextUrl.searchParams.get("symbols"));

  const settled = await Promise.allSettled(symbols.map((symbol) => fetchChart(symbol, range)));
  const quotes: StockQuote[] = [];
  const errors: { symbol: string; message: string }[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") quotes.push(result.value);
    else errors.push({ symbol: symbols[index], message: result.reason?.message || "Fetch failed" });
  });

  return NextResponse.json(
    {
      source: "Yahoo Finance chart endpoint",
      updatedAt: Date.now(),
      range,
      quotes,
      errors
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
