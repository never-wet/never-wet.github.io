"use client";

import { create } from "zustand";
import {
  fetchMarketData,
  fetchMarketNews,
  searchMarketSymbols,
  type NewsItem,
  type SearchResult,
  type StockQuote,
  type TimeRange
} from "@/lib/api";
import { analyzeMarket, type RiskLevel, type TrendDirection } from "@/lib/prediction";

export type SectorSignal = {
  sector: string;
  symbol: string;
  trend: TrendDirection;
  confidence: number;
  risk: RiskLevel;
  changePercent: number;
};

type IndicatorState = {
  sma: boolean;
  ema: boolean;
  rsi: boolean;
  forecast: boolean;
};

type MarketState = {
  watchlist: string[];
  selectedSymbol: string;
  range: TimeRange;
  quotes: Record<string, StockQuote>;
  news: NewsItem[];
  searchResults: SearchResult[];
  searchQuery: string;
  sectorSignals: SectorSignal[];
  indicators: IndicatorState;
  loading: boolean;
  newsLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  pollingMs: number;
  setRange: (range: TimeRange) => void;
  setSelectedSymbol: (symbol: string) => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => void;
  toggleIndicator: (key: keyof IndicatorState) => void;
  loadMarketData: () => Promise<void>;
  searchSymbols: (query: string) => Promise<void>;
  clearSearch: () => void;
  loadNews: () => Promise<void>;
};

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "JPM", "XOM"];

const SECTOR_ETFS = [
  { sector: "Technology", symbol: "XLK" },
  { sector: "Energy", symbol: "XLE" },
  { sector: "Finance", symbol: "XLF" },
  { sector: "Market Sentiment", symbol: "SPY" }
];

const unique = (symbols: string[]) => [...new Set(symbols.map((symbol) => symbol.toUpperCase()))];

function buildSectorSignals(quotes: Record<string, StockQuote>): SectorSignal[] {
  return SECTOR_ETFS.map(({ sector, symbol }) => {
    const quote = quotes[symbol];
    if (!quote) {
      return {
        sector,
        symbol,
        trend: "SIDEWAYS",
        confidence: 50,
        risk: "MEDIUM",
        changePercent: 0
      };
    }

    const prediction = analyzeMarket(quote.points);
    return {
      sector,
      symbol,
      trend: prediction.trend,
      confidence: prediction.confidence,
      risk: prediction.riskLevel,
      changePercent: quote.changePercent
    };
  });
}

export const useMarketStore = create<MarketState>((set, get) => ({
  watchlist: DEFAULT_WATCHLIST,
  selectedSymbol: "AAPL",
  range: "1D",
  quotes: {},
  news: [],
  searchResults: [],
  searchQuery: "",
  sectorSignals: [],
  indicators: {
    sma: true,
    ema: true,
    rsi: false,
    forecast: true
  },
  loading: false,
  newsLoading: false,
  error: null,
  lastUpdated: null,
  pollingMs: 6500,

  setRange: (range) => {
    set({ range });
  },

  setSelectedSymbol: async (symbol) => {
    const normalized = symbol.toUpperCase();
    set((state) => ({
      selectedSymbol: normalized,
      watchlist: state.watchlist.includes(normalized)
        ? state.watchlist
        : [normalized, ...state.watchlist].slice(0, 12)
    }));
    await get().loadMarketData();
    await get().loadNews();
  },

  addSymbol: async (symbol) => {
    const normalized = symbol.toUpperCase();
    set((state) => ({
      watchlist: state.watchlist.includes(normalized)
        ? state.watchlist
        : [normalized, ...state.watchlist].slice(0, 12),
      selectedSymbol: normalized
    }));
    await get().loadMarketData();
    await get().loadNews();
  },

  removeSymbol: (symbol) => {
    set((state) => {
      const nextWatchlist = state.watchlist.filter((item) => item !== symbol);
      return {
        watchlist: nextWatchlist.length ? nextWatchlist : DEFAULT_WATCHLIST,
        selectedSymbol:
          state.selectedSymbol === symbol ? nextWatchlist[0] || DEFAULT_WATCHLIST[0] : state.selectedSymbol
      };
    });
  },

  toggleIndicator: (key) => {
    set((state) => ({
      indicators: {
        ...state.indicators,
        [key]: !state.indicators[key]
      }
    }));
  },

  loadMarketData: async () => {
    const { watchlist, selectedSymbol, range } = get();
    const symbols = unique([
      selectedSymbol,
      ...watchlist,
      ...SECTOR_ETFS.map((item) => item.symbol)
    ]);

    set({ loading: true, error: null });

    try {
      const response = await fetchMarketData(symbols, range);
      const nextQuotes = response.quotes.reduce<Record<string, StockQuote>>((accumulator, quote) => {
        accumulator[quote.symbol] = quote;
        return accumulator;
      }, {});

      set((state) => {
        const quotes = { ...state.quotes, ...nextQuotes };
        return {
          quotes,
          sectorSignals: buildSectorSignals(quotes),
          lastUpdated: response.updatedAt,
          loading: false,
          error: response.quotes.length ? null : response.errors[0]?.message || "No market data returned"
        };
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load market data"
      });
    }
  },

  searchSymbols: async (query) => {
    set({ searchQuery: query });
    if (query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }

    try {
      const results = await searchMarketSymbols(query);
      set({ searchResults: results });
    } catch {
      set({ searchResults: [] });
    }
  },

  clearSearch: () => set({ searchQuery: "", searchResults: [] }),

  loadNews: async () => {
    const { selectedSymbol, watchlist } = get();
    set({ newsLoading: true });

    try {
      const news = await fetchMarketNews(unique([selectedSymbol, ...watchlist.slice(0, 5)]));
      set({ news, newsLoading: false });
    } catch {
      set({ newsLoading: false });
    }
  }
}));
