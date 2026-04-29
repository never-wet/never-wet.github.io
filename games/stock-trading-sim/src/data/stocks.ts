import type { Sector, Stock } from "../types";

export interface SectorProfile {
  label: string;
  description: string;
  behavior: string;
  accent: string;
  eventSensitivity: number;
  volumeMultiplier: number;
  trendPersistence: number;
}

export const SECTOR_PROFILES: Record<Sector, SectorProfile> = {
  Tech: {
    label: "Tech",
    description: "Growth names with strong trend follow-through.",
    behavior: "Momentum driven",
    accent: "#3178c6",
    eventSensitivity: 1.12,
    volumeMultiplier: 1.14,
    trendPersistence: 0.78,
  },
  Energy: {
    label: "Energy",
    description: "Commodity-linked names that swing on supply news.",
    behavior: "Cyclical",
    accent: "#b66b1f",
    eventSensitivity: 1.22,
    volumeMultiplier: 1.02,
    trendPersistence: 0.7,
  },
  Finance: {
    label: "Finance",
    description: "Rate-sensitive firms with lower baseline volatility.",
    behavior: "Macro sensitive",
    accent: "#5a6f2f",
    eventSensitivity: 0.92,
    volumeMultiplier: 0.92,
    trendPersistence: 0.66,
  },
  Healthcare: {
    label: "Healthcare",
    description: "Defensive names plus occasional breakthrough jumps.",
    behavior: "Defensive",
    accent: "#1d8f7a",
    eventSensitivity: 0.95,
    volumeMultiplier: 0.86,
    trendPersistence: 0.62,
  },
  Startup: {
    label: "Startup",
    description: "Tiny floats, high beta, and violent news reactions.",
    behavior: "Speculative",
    accent: "#a33d6b",
    eventSensitivity: 1.55,
    volumeMultiplier: 1.34,
    trendPersistence: 0.86,
  },
};

const STARTING_STOCKS: Array<Omit<Stock, "previousPrice" | "openPrice" | "momentum" | "history">> = [
  {
    symbol: "NOVA",
    name: "NovaCircuit AI",
    sector: "Tech",
    price: 122.4,
    volatility: 0.017,
    trend: 0.0026,
    volume: 1460000,
    baseVolume: 1460000,
    risk: 3,
    stability: 0.62,
  },
  {
    symbol: "CLDW",
    name: "Cloudware Grid",
    sector: "Tech",
    price: 84.15,
    volatility: 0.012,
    trend: 0.0011,
    volume: 1120000,
    baseVolume: 1120000,
    risk: 2,
    stability: 0.74,
  },
  {
    symbol: "HLX",
    name: "HelioGrid Energy",
    sector: "Energy",
    price: 56.3,
    volatility: 0.014,
    trend: 0.0007,
    volume: 910000,
    baseVolume: 910000,
    risk: 3,
    stability: 0.58,
  },
  {
    symbol: "PETR",
    name: "Northstar Oil",
    sector: "Energy",
    price: 42.85,
    volatility: 0.018,
    trend: -0.0004,
    volume: 1320000,
    baseVolume: 1320000,
    risk: 4,
    stability: 0.48,
  },
  {
    symbol: "FORT",
    name: "Fortress Bancorp",
    sector: "Finance",
    price: 67.2,
    volatility: 0.008,
    trend: 0.0005,
    volume: 770000,
    baseVolume: 770000,
    risk: 1,
    stability: 0.86,
  },
  {
    symbol: "PAYX",
    name: "PayLynx Network",
    sector: "Finance",
    price: 31.6,
    volatility: 0.021,
    trend: 0.0021,
    volume: 1510000,
    baseVolume: 1510000,
    risk: 4,
    stability: 0.42,
  },
  {
    symbol: "VITA",
    name: "Vitasyn Labs",
    sector: "Healthcare",
    price: 94.8,
    volatility: 0.013,
    trend: 0.001,
    volume: 640000,
    baseVolume: 640000,
    risk: 2,
    stability: 0.71,
  },
  {
    symbol: "MEDI",
    name: "MediCore Systems",
    sector: "Healthcare",
    price: 48.35,
    volatility: 0.007,
    trend: 0.0004,
    volume: 580000,
    baseVolume: 580000,
    risk: 1,
    stability: 0.88,
  },
  {
    symbol: "ROBO",
    name: "Neon Robotics",
    sector: "Startup",
    price: 18.22,
    volatility: 0.036,
    trend: 0.0036,
    volume: 2340000,
    baseVolume: 2340000,
    risk: 5,
    stability: 0.24,
  },
  {
    symbol: "FLYR",
    name: "FlyRail Aero",
    sector: "Startup",
    price: 12.75,
    volatility: 0.045,
    trend: 0.002,
    volume: 1880000,
    baseVolume: 1880000,
    risk: 5,
    stability: 0.2,
  },
];

export function createInitialStocks(): Stock[] {
  return STARTING_STOCKS.map((stock) => {
    const history = Array.from({ length: 34 }, (_, index) => {
      const wobble = Math.sin(index * 0.55 + stock.symbol.length) * stock.volatility * 2.2;
      const drift = (index - 33) * stock.trend * 0.28;
      const price = stock.price * (1 + wobble + drift);

      return {
        tick: index - 33,
        price: Number(Math.max(0.5, price).toFixed(2)),
        volume: Math.round(stock.baseVolume * (0.82 + (index % 7) * 0.045)),
      };
    });

    return {
      ...stock,
      previousPrice: history[history.length - 2]?.price ?? stock.price,
      openPrice: history[0]?.price ?? stock.price,
      momentum: stock.trend,
      history,
    };
  });
}
