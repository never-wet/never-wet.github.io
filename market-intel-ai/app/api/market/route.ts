import { NextRequest, NextResponse } from "next/server";
import type { ExtendedQuote, MarketPoint, MarketProvider, MarketSession, SourceComparison, StockQuote, TimeRange } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0"
};

const YAHOO_RANGE: Record<TimeRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "1m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" }
};

const ALPHA_RANGE: Record<TimeRange, { functionName: "TIME_SERIES_INTRADAY" | "TIME_SERIES_DAILY"; interval?: string; outputsize: "compact" | "full"; key: string }> = {
  "1D": { functionName: "TIME_SERIES_INTRADAY", interval: "1min", outputsize: "compact", key: "Time Series (1min)" },
  "1W": { functionName: "TIME_SERIES_INTRADAY", interval: "15min", outputsize: "compact", key: "Time Series (15min)" },
  "1M": { functionName: "TIME_SERIES_DAILY", outputsize: "compact", key: "Time Series (Daily)" },
  "1Y": { functionName: "TIME_SERIES_DAILY", outputsize: "full", key: "Time Series (Daily)" }
};

type YahooTradingPeriod = {
  start?: number;
  end?: number;
  timezone?: string;
  gmtoffset?: number;
};

type YahooMeta = {
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
  timezone?: string;
  exchangeTimezoneName?: string;
  currentTradingPeriod?: Partial<Record<"pre" | "regular" | "post", YahooTradingPeriod>>;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: YahooMeta;
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

type AlphaPayload = Record<string, unknown> & {
  "Meta Data"?: Record<string, string>;
  "Error Message"?: string;
  "Information"?: string;
  Note?: string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidPrice = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

function normalizeOhlc(open: unknown, high: unknown, low: unknown, close: number) {
  const openPrice = isValidPrice(open) ? open : close;
  const highPrice = isValidPrice(high) ? high : Math.max(openPrice, close);
  const lowPrice = isValidPrice(low) ? low : Math.min(openPrice, close);

  return {
    open: round(openPrice),
    high: round(Math.max(highPrice, openPrice, close)),
    low: round(Math.min(lowPrice, openPrice, close)),
    close: round(close)
  };
}

function sanitizeSymbols(value: string | null) {
  const symbols = (value || "^GSPC,^IXIC,^DJI,SPY,QQQ,AAPL,MSFT,NVDA,TSLA,BTC-USD,ETH-USD,GC=F,CL=F,EURUSD=X")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.^=-]{1,18}$/.test(symbol));

  return [...new Set(symbols)].slice(0, 24);
}

function getRange(value: string | null): TimeRange {
  return value === "1W" || value === "1M" || value === "1Y" ? value : "1D";
}

function getProvider(value: string | null): MarketProvider {
  return value === "alpha" || value === "compare" ? value : "yahoo";
}

function alphaSymbol(symbol: string) {
  if (/[\^=]/.test(symbol) || /-USD$/.test(symbol) || /=X$/.test(symbol)) {
    throw new Error("Yahoo-only symbol for Alpha comparison. Alpha Vantage compare supports standard stock and ETF tickers such as AAPL, MSFT, NVDA, SPY, and QQQ.");
  }
  return symbol;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatSessionTime(timestamp: number | undefined, timeZone: string | undefined) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone
    }).format(timestamp * 1000);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(timestamp * 1000);
  }
}

function buildSession(meta: YahooMeta | undefined): MarketSession {
  const periods = meta?.currentTradingPeriod || {};
  const now = Math.floor(Date.now() / 1000);
  const timeZone = meta?.exchangeTimezoneName;

  const inPeriod = (period?: YahooTradingPeriod) =>
    Boolean(period?.start && period?.end && now >= period.start && now < period.end);

  if (inPeriod(periods.regular)) {
    return {
      state: "regular",
      label: "Regular hours",
      detail: `Open until ${formatSessionTime(periods.regular?.end, timeZone)}`,
      isOpen: true
    };
  }

  if (inPeriod(periods.pre)) {
    return {
      state: "pre",
      label: "Pre-market",
      detail: `Regular market closed; opens ${formatSessionTime(periods.regular?.start, timeZone)}`,
      isOpen: true
    };
  }

  if (inPeriod(periods.post)) {
    return {
      state: "post",
      label: "After hours",
      detail: `Regular market closed; post-market until ${formatSessionTime(periods.post?.end, timeZone)}`,
      isOpen: true
    };
  }

  const nextPeriod = [periods.pre, periods.regular, periods.post]
    .filter((period): period is YahooTradingPeriod => Boolean(period?.start && period.start > now))
    .sort((a, b) => (a.start || 0) - (b.start || 0))[0];

  return {
    state: "closed",
    label: "Market closed",
    detail: nextPeriod ? `Next session ${formatSessionTime(nextPeriod.start, timeZone)}` : "Regular session not active",
    isOpen: false
  };
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
  if (!isValidPrice(close)) return null;

  const open = quote.open?.[index];
  const high = quote.high?.[index];
  const low = quote.low?.[index];
  const volume = quote.volume?.[index];
  const timestamp = time * 1000;
  const ohlc = normalizeOhlc(open, high, low, close);

  return {
    time: timestamp,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(timestamp),
    ...ohlc,
    volume: isFiniteNumber(volume) ? volume : 0
  };
}

async function fetchYahooChart(symbol: string, range: TimeRange): Promise<StockQuote> {
  const config = YAHOO_RANGE[range];
  const params = new URLSearchParams({
    range: config.range,
    interval: config.interval,
    includePrePost: "true",
    events: "div|split|capitalGain",
    lang: "en-US",
    region: "US",
    _: Date.now().toString()
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
  const session = buildSession(meta);
  const price = round(isValidPrice(meta.regularMarketPrice) ? meta.regularMarketPrice : latest.close);
  const previousClose = round(
    isValidPrice(meta.chartPreviousClose)
      ? meta.chartPreviousClose
      : isValidPrice(meta.previousClose)
        ? meta.previousClose
        : points[0].close
  );
  const change = round(price - previousClose);
  const changePercent = previousClose ? round((change / previousClose) * 100) : 0;
  const extendedPrice = round(latest.close);
  const extended: ExtendedQuote | null =
    session.state === "pre" || session.state === "post"
      ? {
          label: session.state === "pre" ? "Pre-market" : "After hours",
          price: extendedPrice,
          change: round(extendedPrice - price),
          changePercent: price ? round(((extendedPrice - price) / price) * 100) : 0,
          time: latest.time
        }
      : null;
  const officialHigh = isValidPrice(meta.regularMarketDayHigh)
    ? meta.regularMarketDayHigh
    : Math.max(...points.map((point) => point.high));
  const officialLow = isValidPrice(meta.regularMarketDayLow)
    ? meta.regularMarketDayLow
    : Math.min(...points.map((point) => point.low));
  const dayHigh = Math.max(officialHigh, officialLow, price);
  const dayLow = Math.min(officialHigh, officialLow, price);

  return {
    symbol: (meta.symbol || symbol).toUpperCase(),
    name: meta.longName || meta.shortName || symbol.toUpperCase(),
    exchange: meta.fullExchangeName || meta.exchangeName || "Market",
    source: "Yahoo Finance",
    currency: meta.currency || "USD",
    price,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? latest.volume,
    dayHigh: round(dayHigh),
    dayLow: round(dayLow),
    previousClose,
    volatility: calculateVolatility(points),
    lastUpdated: extended?.time ?? (meta.regularMarketTime || Math.floor(Date.now() / 1000)) * 1000,
    session,
    extended,
    points
  };
}

function alphaPoint(timestamp: string, row: Record<string, string>): MarketPoint | null {
  const close = Number(row["4. close"]);
  if (!isValidPrice(close)) return null;
  const time = new Date(`${timestamp.replace(" ", "T")}${timestamp.includes(" ") ? "-05:00" : "T00:00:00-05:00"}`).getTime();
  const safeTime = Number.isFinite(time) ? time : Date.now();
  return {
    time: safeTime,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(safeTime),
    ...normalizeOhlc(Number(row["1. open"]), Number(row["2. high"]), Number(row["3. low"]), close),
    volume: Number(row["5. volume"]) || 0
  };
}

function parseAlphaSeries(payload: AlphaPayload, symbol: string, range: TimeRange): StockQuote {
  if (payload["Error Message"]) throw new Error(payload["Error Message"]);
  if (payload.Information) throw new Error(payload.Information);
  if (payload.Note) throw new Error(payload.Note);

  const config = ALPHA_RANGE[range];
  const series = payload[config.key] as Record<string, Record<string, string>> | undefined;
  if (!series) throw new Error("Alpha Vantage did not return time-series data");

  const limit = range === "1D" ? 120 : range === "1W" ? 160 : range === "1M" ? 32 : 260;
  const points = Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([timestamp, row]) => alphaPoint(timestamp, row))
    .filter((point): point is MarketPoint => Boolean(point));

  if (!points.length) throw new Error("No finite Alpha Vantage points returned");

  const latest = points.at(-1)!;
  const previous = points.length > 1 ? points.at(-2)! : points[0];
  const previousClose = previous.close || latest.close;
  const change = round(latest.close - previousClose);
  const dayHigh = Math.max(...points.slice(-Math.min(points.length, 96)).map((point) => point.high));
  const dayLow = Math.min(...points.slice(-Math.min(points.length, 96)).map((point) => point.low));

  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    exchange: "Alpha Vantage",
    source: "Alpha Vantage",
    currency: "USD",
    price: latest.close,
    change,
    changePercent: previousClose ? round((change / previousClose) * 100) : 0,
    volume: latest.volume,
    dayHigh: round(dayHigh),
    dayLow: round(dayLow),
    previousClose: round(previousClose),
    volatility: calculateVolatility(points),
    lastUpdated: latest.time,
    session: {
      state: "unknown",
      label: "Alpha feed",
      detail: "Alpha Vantage time-series data",
      isOpen: false
    },
    extended: null,
    points
  };
}

async function fetchAlphaChart(symbol: string, range: TimeRange, apiKey?: string): Promise<StockQuote> {
  const normalized = alphaSymbol(symbol.toUpperCase());
  const config = ALPHA_RANGE[range];
  const resolvedApiKey = apiKey?.trim() || process.env.ALPHA_VANTAGE_API_KEY || "demo";
  const params = new URLSearchParams({
    function: config.functionName,
    symbol: normalized,
    outputsize: config.outputsize,
    apikey: resolvedApiKey
  });
  if (config.interval) {
    params.set("interval", config.interval);
    params.set("adjusted", "true");
    params.set("extended_hours", "true");
  }

  const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Alpha Vantage returned ${response.status}`);
  return parseAlphaSeries((await response.json()) as AlphaPayload, normalized, range);
}

function attachComparison(primary: StockQuote, secondary: StockQuote): StockQuote {
  const comparison: SourceComparison = {
    primarySource: primary.source,
    secondarySource: secondary.source,
    primaryPrice: primary.price,
    secondaryPrice: secondary.price,
    priceDifference: round(primary.price - secondary.price),
    priceDifferencePercent: secondary.price ? round(((primary.price - secondary.price) / secondary.price) * 100) : 0,
    primaryLastUpdated: primary.lastUpdated,
    secondaryLastUpdated: secondary.lastUpdated,
    primaryPointCount: primary.points.length,
    secondaryPointCount: secondary.points.length,
    secondaryPoints: secondary.points
  };
  return { ...primary, comparison };
}

export async function GET(request: NextRequest) {
  const range = getRange(request.nextUrl.searchParams.get("range"));
  const symbols = sanitizeSymbols(request.nextUrl.searchParams.get("symbols"));
  const provider = getProvider(request.nextUrl.searchParams.get("provider"));
  const primarySymbol = (request.nextUrl.searchParams.get("primary") || symbols[0] || "").toUpperCase();
  const alphaApiKey = request.nextUrl.searchParams.get("alphaKey") || undefined;

  const settled = await Promise.allSettled(symbols.map((symbol) => fetchYahooChart(symbol, range)));
  const quotes: StockQuote[] = [];
  const errors: { symbol: string; message: string }[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") quotes.push(result.value);
    else errors.push({ symbol: symbols[index], message: result.reason?.message || "Fetch failed" });
  });

  if ((provider === "alpha" || provider === "compare") && primarySymbol) {
    const primaryIndex = quotes.findIndex((quote) => quote.symbol === primarySymbol);
    const yahooQuote = primaryIndex >= 0 ? quotes[primaryIndex] : null;
    try {
      const rawAlphaQuote = await fetchAlphaChart(primarySymbol, range, alphaApiKey);
      const alphaQuote = yahooQuote
        ? {
            ...rawAlphaQuote,
            name: yahooQuote.name,
            exchange: "Alpha Vantage"
          }
        : rawAlphaQuote;
      if (provider === "alpha") {
        quotes[primaryIndex >= 0 ? primaryIndex : quotes.length] = yahooQuote
          ? attachComparison(alphaQuote, yahooQuote)
          : alphaQuote;
      } else if (yahooQuote) {
        quotes[primaryIndex] = attachComparison(yahooQuote, alphaQuote);
      } else {
        quotes.push(alphaQuote);
      }
    } catch (error) {
      errors.push({
        symbol: primarySymbol,
        message: `Alpha Vantage: ${error instanceof Error ? error.message : "Fetch failed"}`
      });
    }
  }

  return NextResponse.json(
    {
      source:
        provider === "alpha"
          ? "Alpha Vantage selected-symbol feed + Yahoo Finance watchlist"
          : provider === "compare"
            ? "Yahoo Finance with Alpha Vantage selected-symbol comparison"
            : "Yahoo Finance chart endpoint",
      provider,
      updatedAt: Date.now(),
      range,
      quotes,
      errors
    },
    {
      headers: RESPONSE_HEADERS
    }
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: RESPONSE_HEADERS
  });
}
