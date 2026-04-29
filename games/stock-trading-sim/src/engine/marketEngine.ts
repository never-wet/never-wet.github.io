import { SECTOR_PROFILES } from "../data/stocks";
import type { Difficulty, MarketEvent, Sector, Stock } from "../types";
import { clamp, gaussianRandom, randomBetween } from "./random";

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    startingCash: number;
    volatilityMultiplier: number;
    eventMultiplier: number;
    feeRate: number;
    description: string;
  }
> = {
  normal: {
    label: "Normal",
    startingCash: 10000,
    volatilityMultiplier: 1,
    eventMultiplier: 1,
    feeRate: 0.001,
    description: "Balanced price movement and event frequency.",
  },
  volatile: {
    label: "Volatile",
    startingCash: 10000,
    volatilityMultiplier: 1.42,
    eventMultiplier: 1.22,
    feeRate: 0.0012,
    description: "Sharper swings, bigger events, and higher fees.",
  },
  strategic: {
    label: "Strategic",
    startingCash: 12500,
    volatilityMultiplier: 0.82,
    eventMultiplier: 0.88,
    feeRate: 0.0008,
    description: "Slower market, more room for long-term positioning.",
  },
};

export interface SectorSnapshot {
  sector: Sector;
  averageChangePct: number;
  totalVolume: number;
  pressure: number;
}

interface EventPressure {
  priceImpact: number;
  trendImpact: number;
  volatilityImpact: number;
  volumeImpact: number;
}

function eventAppliesToStock(event: MarketEvent, stock: Stock): boolean {
  return event.sectors.includes(stock.sector) || Boolean(event.symbolTargets?.includes(stock.symbol));
}

function calculateEventPressure(stock: Stock, events: MarketEvent[], tick: number): EventPressure {
  return events.reduce<EventPressure>(
    (pressure, event) => {
      if (!eventAppliesToStock(event, stock)) {
        return pressure;
      }

      const age = Math.max(0, tick - event.tick);
      const life = clamp(1 - age / Math.max(1, event.duration), 0, 1);
      const focusBoost = event.symbolTargets?.includes(stock.symbol) ? 1.24 : 1;
      const sensitivity = SECTOR_PROFILES[stock.sector].eventSensitivity * focusBoost;

      pressure.priceImpact += event.priceImpact * life * sensitivity;
      pressure.trendImpact += event.trendImpact * life * sensitivity;
      pressure.volatilityImpact += event.volatilityImpact * life * sensitivity;
      pressure.volumeImpact += event.volumeImpact * life * sensitivity;

      return pressure;
    },
    { priceImpact: 0, trendImpact: 0, volatilityImpact: 0, volumeImpact: 0 },
  );
}

export function getActiveEvents(events: MarketEvent[], tick: number): MarketEvent[] {
  return events.filter((event) => tick - event.tick < event.duration);
}

export function updateMarket(
  stocks: Stock[],
  activeEvents: MarketEvent[],
  tick: number,
  difficulty: Difficulty,
): Stock[] {
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  const marketCycle = Math.sin(tick * 0.13) * 0.0018 + Math.cos(tick * 0.071) * 0.0012;

  return stocks.map((stock) => {
    const sector = SECTOR_PROFILES[stock.sector];
    const pressure = calculateEventPressure(stock, activeEvents, tick);
    const liveVolatility = Math.max(
      0.003,
      stock.volatility * difficultyConfig.volatilityMultiplier + pressure.volatilityImpact,
    );
    const randomWalk = gaussianRandom() * liveVolatility;
    const trendBias = stock.trend * 0.55 + stock.momentum * 0.22 + pressure.trendImpact;
    const sectorPulse = Math.sin((tick + stock.symbol.charCodeAt(0)) * 0.17) * stock.volatility * 0.13;
    const riskDrag = stock.risk >= 5 && Math.random() < 0.08 ? randomBetween(-0.018, 0.002) : 0;
    const rawChangePct =
      randomWalk +
      trendBias +
      sectorPulse +
      marketCycle +
      pressure.priceImpact * difficultyConfig.eventMultiplier +
      riskDrag;
    const changePct = clamp(rawChangePct, -0.22, 0.26);
    const nextPrice = Number(Math.max(0.75, stock.price * (1 + changePct)).toFixed(2));
    const nextMomentum = clamp(stock.momentum * 0.7 + changePct * 0.3, -0.09, 0.09);
    const nextTrend = clamp(
      stock.trend * sector.trendPersistence +
        nextMomentum * 0.08 +
        pressure.trendImpact * 0.65 +
        gaussianRandom() * 0.0009,
      -0.032,
      0.034,
    );
    const volumeShock = 0.7 + Math.random() * 0.55 + Math.abs(changePct) * 15 + Math.max(0, pressure.volumeImpact);
    const nextVolume = Math.max(1000, Math.round(stock.baseVolume * sector.volumeMultiplier * volumeShock));
    const nextHistory = [
      ...stock.history,
      {
        tick,
        price: nextPrice,
        volume: nextVolume,
      },
    ].slice(-90);

    return {
      ...stock,
      previousPrice: stock.price,
      price: nextPrice,
      trend: nextTrend,
      momentum: nextMomentum,
      volume: nextVolume,
      history: nextHistory,
    };
  });
}

export function summarizeSectors(stocks: Stock[], activeEvents: MarketEvent[], tick: number): SectorSnapshot[] {
  const sectors = Object.keys(SECTOR_PROFILES) as Sector[];

  return sectors.map((sector) => {
    const members = stocks.filter((stock) => stock.sector === sector);
    const totalChange = members.reduce((sum, stock) => {
      const change = stock.previousPrice > 0 ? (stock.price - stock.previousPrice) / stock.previousPrice : 0;

      return sum + change;
    }, 0);
    const pressure = activeEvents.reduce((sum, event) => {
      if (!event.sectors.includes(sector)) {
        return sum;
      }

      const age = Math.max(0, tick - event.tick);
      const life = clamp(1 - age / Math.max(1, event.duration), 0, 1);

      return sum + event.priceImpact * life;
    }, 0);

    return {
      sector,
      averageChangePct: members.length ? totalChange / members.length : 0,
      totalVolume: members.reduce((sum, stock) => sum + stock.volume, 0),
      pressure,
    };
  });
}
