export type TimeRange = "1D" | "1W" | "1M" | "1Y";

export type MarketPoint = {
  time: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockQuote = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  volatility: number;
  lastUpdated: number;
  points: MarketPoint[];
};

export type MarketApiResponse = {
  source: string;
  updatedAt: number;
  range: TimeRange;
  quotes: StockQuote[];
  errors: { symbol: string; message: string }[];
};

export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
  sector?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  relatedTickers: string[];
  impact: "bullish" | "bearish" | "neutral";
  description: string;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchMarketData(
  symbols: string[],
  range: TimeRange
): Promise<MarketApiResponse> {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
    range
  });

  return getJson<MarketApiResponse>(`/api/market?${params.toString()}`);
}

export async function searchMarketSymbols(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({ q: query.trim() });
  const payload = await getJson<{ results: SearchResult[] }>(`/api/search?${params.toString()}`);
  return payload.results;
}

export async function fetchMarketNews(symbols: string[]): Promise<NewsItem[]> {
  const params = new URLSearchParams({
    symbols: symbols.join(",")
  });
  const payload = await getJson<{ news: NewsItem[] }>(`/api/news?${params.toString()}`);
  return payload.news;
}
