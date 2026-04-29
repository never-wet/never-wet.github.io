import { create } from "zustand";
import { createInitialStocks } from "../data/stocks";
import { createOpeningNews, eventToNews, maybeCreateEvent } from "../engine/eventSystem";
import { DIFFICULTY_CONFIG, getActiveEvents, updateMarket } from "../engine/marketEngine";
import { buyStock, getPortfolioSummary, sellStock } from "../engine/playerSystem";
import type { Difficulty, Holding, MarketEvent, NewsItem, OrderSide, Stock, TradeRecord } from "../types";

type Speed = "slow" | "live" | "fast";

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
  ...buildInitialState(),

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
