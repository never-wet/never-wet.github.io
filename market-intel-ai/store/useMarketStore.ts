"use client";

import { create } from "zustand";
import {
  fetchMarketData,
  fetchMarketNews,
  searchMarketSymbols,
  type NewsItem,
  type MarketProvider,
  type SearchResult,
  type StockQuote,
  type TimeRange
} from "@/lib/api";
import {
  applyJournalLearning,
  recordPredictionLearning,
  type PredictionJournalStats
} from "@/lib/learning";
import { analyzeAdaptiveMarket, type RiskLevel, type TrendDirection } from "@/lib/prediction";

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
  provider: MarketProvider;
  alphaApiKey: string;
  quotes: Record<string, StockQuote>;
  news: NewsItem[];
  searchResults: SearchResult[];
  searchQuery: string;
  sectorSignals: SectorSignal[];
  learningStats: Record<string, PredictionJournalStats>;
  indicators: IndicatorState;
  loading: boolean;
  newsLoading: boolean;
  error: string | null;
  providerWarning: string | null;
  lastUpdated: number | null;
  pollingMs: number;
  setRange: (range: TimeRange) => void;
  setProvider: (provider: MarketProvider) => Promise<void>;
  setAlphaApiKey: (apiKey: string) => void;
  applyAlphaApiKey: (apiKey: string) => Promise<void>;
  setSelectedSymbol: (symbol: string) => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => void;
  toggleIndicator: (key: keyof IndicatorState) => void;
  loadMarketData: () => Promise<void>;
  searchSymbols: (query: string) => Promise<void>;
  clearSearch: () => void;
  loadNews: () => Promise<void>;
};

const DEFAULT_WATCHLIST = [
  "^GSPC",
  "^IXIC",
  "^DJI",
  "SPY",
  "QQQ",
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "BTC-USD",
  "ETH-USD",
  "GC=F",
  "CL=F",
  "EURUSD=X"
];

const SECTOR_ETFS = [
  { sector: "Technology", symbol: "XLK" },
  { sector: "Energy", symbol: "XLE" },
  { sector: "Finance", symbol: "XLF" },
  { sector: "US 500", symbol: "^GSPC" },
  { sector: "Nasdaq", symbol: "^IXIC" },
  { sector: "Crypto", symbol: "BTC-USD" },
  { sector: "Gold", symbol: "GC=F" },
  { sector: "Crude Oil", symbol: "CL=F" }
];

const unique = (symbols: string[]) => [...new Set(symbols.map((symbol) => symbol.toUpperCase()))];

function savedAlphaApiKey() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("marketIntelAlphaApiKey") || "";
}

function buildSectorSignals(
  quotes: Record<string, StockQuote>,
  learningStats: Record<string, PredictionJournalStats>
): SectorSignal[] {
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

    const prediction = applyJournalLearning(analyzeAdaptiveMarket(quote.points), learningStats[symbol]);
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
  provider: "yahoo",
  alphaApiKey: savedAlphaApiKey(),
  quotes: {},
  news: [],
  searchResults: [],
  searchQuery: "",
  sectorSignals: [],
  learningStats: {},
  indicators: {
    sma: true,
    ema: true,
    rsi: false,
    forecast: true
  },
  loading: false,
  newsLoading: false,
  error: null,
  providerWarning: null,
  lastUpdated: null,
  pollingMs: 5000,

  setRange: (range) => {
    set({ range });
  },

  setProvider: async (provider) => {
    set({ provider, providerWarning: null });
    await get().loadMarketData();
  },

  setAlphaApiKey: (apiKey) => {
    const normalized = apiKey.trim();
    if (typeof window !== "undefined") {
      if (normalized) window.localStorage.setItem("marketIntelAlphaApiKey", normalized);
      else window.localStorage.removeItem("marketIntelAlphaApiKey");
    }
    set({ alphaApiKey: normalized, providerWarning: null });
  },

  applyAlphaApiKey: async (apiKey) => {
    get().setAlphaApiKey(apiKey);
    if (get().provider !== "yahoo") {
      await get().loadMarketData();
    }
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
    const { watchlist, selectedSymbol, range, provider, alphaApiKey } = get();
    const symbols = unique([
      selectedSymbol,
      ...watchlist,
      ...SECTOR_ETFS.map((item) => item.symbol)
    ]);

    set({ loading: true, error: null });

    try {
      const response = await fetchMarketData(symbols, range, provider, selectedSymbol, alphaApiKey);
      const nextQuotes = response.quotes.reduce<Record<string, StockQuote>>((accumulator, quote) => {
        accumulator[quote.symbol] = quote;
        return accumulator;
      }, {});

      set((state) => {
        const quotes = { ...state.quotes, ...nextQuotes };
        const learningStats = { ...state.learningStats };
        response.quotes.forEach((quote) => {
          const prediction = analyzeAdaptiveMarket(quote.points);
          learningStats[quote.symbol] = recordPredictionLearning(quote.symbol, quote, prediction);
        });

        const selectedQuote = quotes[selectedSymbol];
        const providerError = response.errors.find((item) => item.symbol === selectedSymbol && /alpha vantage/i.test(item.message));
        const providerWarning =
          provider === "alpha" && selectedQuote?.source !== "Alpha Vantage"
            ? providerError?.message || "Alpha Vantage unavailable. Add a key from https://www.alphavantage.co/support/#api-key."
            : provider === "compare" && selectedQuote && !selectedQuote.comparison
              ? providerError?.message || "Alpha Vantage comparison unavailable. Add a key from https://www.alphavantage.co/support/#api-key."
              : null;

        return {
          quotes,
          learningStats,
          sectorSignals: buildSectorSignals(quotes, learningStats),
          lastUpdated: response.updatedAt,
          loading: false,
          providerWarning,
          error: response.quotes.length ? null : response.errors[0]?.message || "No market data returned"
        };
      });
    } catch (error) {
      set({
        loading: false,
        providerWarning: null,
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
