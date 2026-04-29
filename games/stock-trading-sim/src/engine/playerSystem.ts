import { DIFFICULTY_CONFIG } from "./marketEngine";
import type { Difficulty, Holding, PortfolioLine, PortfolioSummary, Stock, TradeRecord } from "../types";
import { id } from "./random";

const MIN_TRADE_FEE = 1;

export interface TradeResult {
  cash: number;
  holdings: Record<string, Holding>;
  trade: TradeRecord;
  message: string;
  closedRealizedPnlDelta: number;
}

export function calculateFee(grossValue: number, difficulty: Difficulty): number {
  return Number(Math.max(MIN_TRADE_FEE, grossValue * DIFFICULTY_CONFIG[difficulty].feeRate).toFixed(2));
}

export function buyStock(
  cash: number,
  holdings: Record<string, Holding>,
  stock: Stock,
  shares: number,
  tick: number,
  difficulty: Difficulty,
): TradeResult {
  const cleanShares = Math.floor(shares);
  const grossValue = Number((stock.price * cleanShares).toFixed(2));
  const fee = calculateFee(grossValue, difficulty);
  const total = Number((grossValue + fee).toFixed(2));

  if (cleanShares <= 0) {
    throw new Error("Choose at least 1 share.");
  }

  if (total > cash) {
    throw new Error("Not enough cash for that order.");
  }

  const existing = holdings[stock.symbol];
  const nextShares = (existing?.shares ?? 0) + cleanShares;
  const averagePrice = existing
    ? (existing.averagePrice * existing.shares + grossValue) / nextShares
    : stock.price;

  return {
    cash: Number((cash - total).toFixed(2)),
    holdings: {
      ...holdings,
      [stock.symbol]: {
        symbol: stock.symbol,
        shares: nextShares,
        averagePrice: Number(averagePrice.toFixed(2)),
        realizedPnl: existing?.realizedPnl ?? 0,
      },
    },
    trade: {
      id: id("trade", tick),
      tick,
      side: "buy",
      symbol: stock.symbol,
      shares: cleanShares,
      price: stock.price,
      fee,
      total,
    },
    message: `Bought ${cleanShares} ${stock.symbol} at $${stock.price.toFixed(2)}.`,
    closedRealizedPnlDelta: 0,
  };
}

export function sellStock(
  cash: number,
  holdings: Record<string, Holding>,
  stock: Stock,
  shares: number,
  tick: number,
  difficulty: Difficulty,
): TradeResult {
  const cleanShares = Math.floor(shares);
  const existing = holdings[stock.symbol];

  if (cleanShares <= 0) {
    throw new Error("Choose at least 1 share.");
  }

  if (!existing || existing.shares < cleanShares) {
    throw new Error("You do not own enough shares to sell.");
  }

  const grossValue = Number((stock.price * cleanShares).toFixed(2));
  const fee = calculateFee(grossValue, difficulty);
  const total = Number((grossValue - fee).toFixed(2));
  const realizedPnl = Number(((stock.price - existing.averagePrice) * cleanShares - fee).toFixed(2));
  const remainingShares = existing.shares - cleanShares;
  const nextHoldings = { ...holdings };

  if (remainingShares <= 0) {
    delete nextHoldings[stock.symbol];
  } else {
    nextHoldings[stock.symbol] = {
      ...existing,
      shares: remainingShares,
      realizedPnl: Number((existing.realizedPnl + realizedPnl).toFixed(2)),
    };
  }

  return {
    cash: Number((cash + total).toFixed(2)),
    holdings: nextHoldings,
    trade: {
      id: id("trade", tick),
      tick,
      side: "sell",
      symbol: stock.symbol,
      shares: cleanShares,
      price: stock.price,
      fee,
      total,
    },
    message: `Sold ${cleanShares} ${stock.symbol} at $${stock.price.toFixed(2)}.`,
    closedRealizedPnlDelta: remainingShares <= 0 ? Number((existing.realizedPnl + realizedPnl).toFixed(2)) : 0,
  };
}

export function getPortfolioSummary(
  cash: number,
  holdings: Record<string, Holding>,
  stocks: Stock[],
  initialCash: number,
  closedRealizedPnl = 0,
): PortfolioSummary {
  const stockMap = new Map(stocks.map((stock) => [stock.symbol, stock]));
  const lines: PortfolioLine[] = Object.values(holdings)
    .map((holding) => {
      const stock = stockMap.get(holding.symbol);
      const currentPrice = stock?.price ?? holding.averagePrice;
      const currentValue = Number((currentPrice * holding.shares).toFixed(2));
      const costBasis = holding.averagePrice * holding.shares;
      const unrealizedPnl = Number((currentValue - costBasis).toFixed(2));
      const unrealizedPnlPct = costBasis > 0 ? unrealizedPnl / costBasis : 0;

      return {
        symbol: holding.symbol,
        shares: holding.shares,
        averagePrice: holding.averagePrice,
        currentPrice,
        currentValue,
        unrealizedPnl,
        unrealizedPnlPct,
        realizedPnl: holding.realizedPnl,
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  const investedValue = Number(lines.reduce((sum, line) => sum + line.currentValue, 0).toFixed(2));
  const unrealizedPnl = Number(lines.reduce((sum, line) => sum + line.unrealizedPnl, 0).toFixed(2));
  const realizedPnl = Number((closedRealizedPnl + lines.reduce((sum, line) => sum + line.realizedPnl, 0)).toFixed(2));
  const netWorth = Number((cash + investedValue).toFixed(2));

  return {
    cash,
    investedValue,
    unrealizedPnl,
    realizedPnl,
    netWorth,
    returnPct: initialCash > 0 ? (netWorth - initialCash) / initialCash : 0,
    exposurePct: netWorth > 0 ? investedValue / netWorth : 0,
    lines,
  };
}
