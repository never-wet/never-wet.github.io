export type Sector = "Tech" | "Energy" | "Finance" | "Healthcare" | "Startup";

export type Difficulty = "normal" | "volatile" | "strategic";

export type OrderSide = "buy" | "sell";

export type NewsTone = "positive" | "negative" | "neutral" | "warning";

export interface PricePoint {
  tick: number;
  price: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: Sector;
  price: number;
  previousPrice: number;
  openPrice: number;
  volatility: number;
  trend: number;
  momentum: number;
  volume: number;
  baseVolume: number;
  risk: number;
  stability: number;
  history: PricePoint[];
}

export interface Holding {
  symbol: string;
  shares: number;
  averagePrice: number;
  realizedPnl: number;
}

export interface MarketEvent {
  id: string;
  tick: number;
  headline: string;
  body: string;
  sectors: Sector[];
  symbolTargets?: string[];
  priceImpact: number;
  trendImpact: number;
  volatilityImpact: number;
  volumeImpact: number;
  duration: number;
  severity: "low" | "medium" | "high" | "extreme";
  source: "scripted" | "random";
}

export interface NewsItem {
  id: string;
  tick: number;
  title: string;
  message: string;
  tone: NewsTone;
  sectors: Sector[];
}

export interface TradeRecord {
  id: string;
  tick: number;
  side: OrderSide;
  symbol: string;
  shares: number;
  price: number;
  fee: number;
  total: number;
}

export interface PortfolioLine {
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
}

export interface PortfolioSummary {
  cash: number;
  investedValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  netWorth: number;
  returnPct: number;
  exposurePct: number;
  lines: PortfolioLine[];
}
