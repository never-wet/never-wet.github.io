import { create } from "zustand";
import { createInitialStocks } from "../data/stocks";
import { createOpeningNews, eventToNews, maybeCreateEvent } from "../engine/eventSystem";
import { DIFFICULTY_CONFIG, getActiveEvents, updateMarket } from "../engine/marketEngine";
import { buyStock, getPortfolioSummary, sellStock } from "../engine/playerSystem";
import type { Difficulty, Holding, MarketEvent, NewsItem, OrderSide, Stock, TradeRecord } from "../types";

type Speed = "slow" | "live" | "fast";

const STORAGE_KEY = "marketPulseTrader.save.v1";
const STORAGE_VERSION = 1;

interface TradingState {
  initialCash: number;
  cash: number;
  closedRealizedPnl: number;
  stocks: Stock[];
  holdings: Record<string, Holding>;
  selectedSymbol: string;
  orderSide: OrderSide;
  tradeQuantity: number;
  tradeMessage: string;
  tradeError: string;
  trades: TradeRecord[];
  news: NewsItem[];
  events: MarketEvent[];
  tick: number;
  running: boolean;
  speed: Speed;
  difficulty: Difficulty;
  milestones: string[];
}

interface TradingActions {
  advanceTick: () => void;
  buySelected: () => void;
  sellSelected: () => void;
  selectStock: (symbol: string) => void;
  setOrderSide: (side: OrderSide) => void;
  setTradeQuantity: (quantity: number) => void;
  setSpeed: (speed: Speed) => void;
  toggleRunning: () => void;
  resetGame: (difficulty?: Difficulty) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

export type TradingStore = TradingState & TradingActions;

export const SPEED_TO_MS: Record<Speed, number> = {
  slow: 2200,
  live: 1300,
  fast: 650,
};

interface SavedTradingState {
  version: typeof STORAGE_VERSION;
  savedAt: number;
  state: TradingState;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === "normal" || value === "volatile" || value === "strategic";
}

function isSpeed(value: unknown): value is Speed {
  return value === "slow" || value === "live" || value === "fast";
}

function isOrderSide(value: unknown): value is OrderSide {
  return value === "buy" || value === "sell";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildInitialState(difficulty: Difficulty = "normal"): TradingState {
  const stocks = createInitialStocks();
  const initialCash = DIFFICULTY_CONFIG[difficulty].startingCash;

  return {
    initialCash,
    cash: initialCash,
    closedRealizedPnl: 0,
    stocks,
    holdings: {},
    selectedSymbol: stocks[0]?.symbol ?? "",
    orderSide: "buy",
    tradeQuantity: 5,
    tradeMessage: "",
    tradeError: "",
    trades: [],
    news: createOpeningNews(stocks),
    events: [],
    tick: 0,
    running: true,
    speed: "live",
    difficulty,
    milestones: [],
  };
}

function pickState(state: TradingStore): TradingState {
  return {
    initialCash: state.initialCash,
    cash: state.cash,
    closedRealizedPnl: state.closedRealizedPnl,
    stocks: state.stocks,
    holdings: state.holdings,
    selectedSymbol: state.selectedSymbol,
    orderSide: state.orderSide,
    tradeQuantity: state.tradeQuantity,
    tradeMessage: state.tradeMessage,
    tradeError: state.tradeError,
    trades: state.trades,
    news: state.news,
    events: state.events,
    tick: state.tick,
    running: state.running,
    speed: state.speed,
    difficulty: state.difficulty,
    milestones: state.milestones,
  };
}

function sanitizeSavedState(candidate: unknown): TradingState | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const difficulty = isDifficulty(candidate.difficulty) ? candidate.difficulty : "normal";
  const fallback = buildInitialState(difficulty);
  const stocks = Array.isArray(candidate.stocks) && candidate.stocks.length ? candidate.stocks as Stock[] : fallback.stocks;
  const selectedSymbol =
    typeof candidate.selectedSymbol === "string" && stocks.some((stock) => stock.symbol === candidate.selectedSymbol)
      ? candidate.selectedSymbol
      : stocks[0]?.symbol ?? fallback.selectedSymbol;

  return {
    initialCash: typeof candidate.initialCash === "number" ? candidate.initialCash : fallback.initialCash,
    cash: typeof candidate.cash === "number" ? candidate.cash : fallback.cash,
    closedRealizedPnl:
      typeof candidate.closedRealizedPnl === "number" ? candidate.closedRealizedPnl : fallback.closedRealizedPnl,
    stocks,
    holdings: isRecord(candidate.holdings) ? candidate.holdings as Record<string, Holding> : fallback.holdings,
    selectedSymbol,
    orderSide: isOrderSide(candidate.orderSide) ? candidate.orderSide : fallback.orderSide,
    tradeQuantity: typeof candidate.tradeQuantity === "number" ? Math.max(1, Math.floor(candidate.tradeQuantity)) : fallback.tradeQuantity,
    tradeMessage: typeof candidate.tradeMessage === "string" ? candidate.tradeMessage : "",
    tradeError: typeof candidate.tradeError === "string" ? candidate.tradeError : "",
    trades: Array.isArray(candidate.trades) ? candidate.trades.slice(0, 18) as TradeRecord[] : fallback.trades,
    news: Array.isArray(candidate.news) ? candidate.news.slice(0, 12) as NewsItem[] : fallback.news,
    events: Array.isArray(candidate.events) ? candidate.events as MarketEvent[] : fallback.events,
    tick: typeof candidate.tick === "number" ? Math.max(0, Math.floor(candidate.tick)) : fallback.tick,
    running: typeof candidate.running === "boolean" ? candidate.running : fallback.running,
    speed: isSpeed(candidate.speed) ? candidate.speed : fallback.speed,
    difficulty,
    milestones: Array.isArray(candidate.milestones) ? candidate.milestones.filter((item) => typeof item === "string") as string[] : fallback.milestones,
  };
}

function readSavedState(): TradingState | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedTradingState>;
    if (parsed.version !== STORAGE_VERSION) {
      return null;
    }

    return sanitizeSavedState(parsed.state);
  } catch {
    return null;
  }
}

function saveState(state: TradingStore): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const payload: SavedTradingState = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      state: pickState(state),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/private-mode failures; the simulator should keep running.
  }
}

function findStock(stocks: Stock[], symbol: string): Stock {
  const stock = stocks.find((entry) => entry.symbol === symbol);

  if (!stock) {
    throw new Error("Select a stock first.");
  }

  return stock;
}

function updateMilestones(state: TradingState): string[] {
  const summary = getPortfolioSummary(
    state.cash,
    state.holdings,
    state.stocks,
    state.initialCash,
    state.closedRealizedPnl,
  );
  const next = new Set(state.milestones);

  if (state.trades.length >= 1) {
    next.add("First Trade");
  }

  if (summary.returnPct >= 0.08) {
    next.add("8% Portfolio Return");
  }

  if (summary.exposurePct >= 0.7) {
    next.add("High Conviction");
  }

  if (state.tick >= 30) {
    next.add("Survived 30 Ticks");
  }

  return [...next];
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  ...(readSavedState() ?? buildInitialState()),

  advanceTick: () => {
    set((state) => {
      const nextTick = state.tick + 1;
      const activeBeforeEvent = getActiveEvents(state.events, nextTick);
      const newEvent = maybeCreateEvent(nextTick, state.difficulty, activeBeforeEvent);
      const events = newEvent ? [newEvent, ...activeBeforeEvent] : activeBeforeEvent;
      const stocks = updateMarket(state.stocks, events, nextTick, state.difficulty);
      const eventNews = newEvent ? [eventToNews(newEvent)] : [];
      const updatedState: TradingState = {
        ...state,
        tick: nextTick,
        stocks,
        events,
        news: [...eventNews, ...state.news].slice(0, 12),
        tradeError: "",
      };

      return {
        ...updatedState,
        milestones: updateMilestones(updatedState),
      };
    });
  },

  buySelected: () => {
    const state = get();

    try {
      const stock = findStock(state.stocks, state.selectedSymbol);
      const result = buyStock(
        state.cash,
        state.holdings,
        stock,
        state.tradeQuantity,
        state.tick,
        state.difficulty,
      );
      const updatedState: TradingState = {
        ...state,
        cash: result.cash,
        holdings: result.holdings,
        trades: [result.trade, ...state.trades].slice(0, 18),
        tradeMessage: result.message,
        tradeError: "",
      };

      set({
        cash: result.cash,
        holdings: result.holdings,
        trades: updatedState.trades,
        tradeMessage: result.message,
        tradeError: "",
        milestones: updateMilestones(updatedState),
      });
    } catch (error) {
      set({ tradeError: error instanceof Error ? error.message : "Order failed." });
    }
  },

  sellSelected: () => {
    const state = get();

    try {
      const stock = findStock(state.stocks, state.selectedSymbol);
      const result = sellStock(
        state.cash,
        state.holdings,
        stock,
        state.tradeQuantity,
        state.tick,
        state.difficulty,
      );
      const updatedState: TradingState = {
        ...state,
        cash: result.cash,
        closedRealizedPnl: Number((state.closedRealizedPnl + result.closedRealizedPnlDelta).toFixed(2)),
        holdings: result.holdings,
        trades: [result.trade, ...state.trades].slice(0, 18),
        tradeMessage: result.message,
        tradeError: "",
      };

      set({
        cash: result.cash,
        closedRealizedPnl: updatedState.closedRealizedPnl,
        holdings: result.holdings,
        trades: updatedState.trades,
        tradeMessage: result.message,
        tradeError: "",
        milestones: updateMilestones(updatedState),
      });
    } catch (error) {
      set({ tradeError: error instanceof Error ? error.message : "Order failed." });
    }
  },

  selectStock: (symbol) => set({ selectedSymbol: symbol, tradeError: "", tradeMessage: "" }),

  setOrderSide: (side) => set({ orderSide: side, tradeError: "", tradeMessage: "" }),

  setTradeQuantity: (quantity) => set({ tradeQuantity: Math.max(1, Math.floor(quantity || 1)) }),

  setSpeed: (speed) => set({ speed }),

  toggleRunning: () => set((state) => ({ running: !state.running })),

  resetGame: (difficulty) => {
    set(buildInitialState(difficulty ?? get().difficulty));
  },

  setDifficulty: (difficulty) => {
    set((state) => ({ difficulty, tradeError: "", tradeMessage: DIFFICULTY_CONFIG[difficulty].description }));
  },
}));

useTradingStore.subscribe(saveState);
