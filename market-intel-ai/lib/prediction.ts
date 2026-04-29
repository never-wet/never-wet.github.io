import type { MarketPoint } from "./api";

export type TrendDirection = "UP TREND" | "DOWN TREND" | "SIDEWAYS";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type PredictionResult = {
  trend: TrendDirection;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  probabilityUp: number;
  riskLevel: RiskLevel;
  volatilityLabel: "NORMAL" | "HIGH VOLATILITY";
  sma: number;
  ema: number;
  rsi: number;
  support: number;
  resistance: number;
  momentum: number;
  volatility: number;
  forecast: { time: number; predicted: number }[];
  reasons: string[];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function lastFinite(values: number[]) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) return values[index];
  }

  return 0;
}

export function calculateSMA(values: number[], period = 20): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - period + 1);
    const sample = values.slice(start, index + 1).filter(Number.isFinite);
    if (!sample.length) return 0;
    return sample.reduce((sum, value) => sum + value, 0) / sample.length;
  });
}

export function calculateEMA(values: number[], period = 20): number[] {
  const multiplier = 2 / (period + 1);
  const output: number[] = [];

  values.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      output.push(index ? output[index - 1] : 0);
      return;
    }

    if (index === 0) {
      output.push(value);
      return;
    }

    output.push(value * multiplier + output[index - 1] * (1 - multiplier));
  });

  return output;
}

export function calculateRSI(values: number[], period = 14) {
  if (values.length < 2) return 50;

  const start = Math.max(1, values.length - period);
  let gains = 0;
  let losses = 0;

  for (let index = start; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;
  if (averageLoss === 0) return 100;

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

export function calculateVolatility(values: number[]) {
  if (values.length < 3) return 0;

  const returns: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (previous > 0 && Number.isFinite(current)) {
      returns.push((current - previous) / previous);
    }
  }

  if (!returns.length) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function calculateSupportResistance(points: MarketPoint[]) {
  const window = points.slice(-Math.min(points.length, 80));
  const lows = window.map((point) => point.low).filter(Number.isFinite).sort((a, b) => a - b);
  const highs = window.map((point) => point.high).filter(Number.isFinite).sort((a, b) => a - b);

  if (!lows.length || !highs.length) {
    const close = points.at(-1)?.close ?? 0;
    return { support: close, resistance: close };
  }

  const supportIndex = Math.max(0, Math.floor(lows.length * 0.12));
  const resistanceIndex = Math.min(highs.length - 1, Math.floor(highs.length * 0.88));

  return {
    support: lows[supportIndex],
    resistance: highs[resistanceIndex]
  };
}

function regressionSlope(values: number[]) {
  if (values.length < 2) return 0;

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });

  return denominator === 0 ? 0 : numerator / denominator;
}

function buildForecast(points: MarketPoint[], slope: number, confidence: number) {
  const latest = points.at(-1);
  if (!latest) return [];

  const interval = points.length > 1 ? latest.time - points[points.length - 2].time : 60_000;
  const dampening = clamp(confidence / 100, 0.28, 0.82);

  return Array.from({ length: 8 }, (_, index) => ({
    time: latest.time + interval * (index + 1),
    predicted: latest.close + slope * (index + 1) * dampening
  }));
}

export function analyzeMarket(points: MarketPoint[]): PredictionResult {
  const closes = points.map((point) => point.close).filter(Number.isFinite);
  const latest = lastFinite(closes);
  const smaSeries = calculateSMA(closes, 20);
  const emaSeries = calculateEMA(closes, 20);
  const sma = lastFinite(smaSeries);
  const ema = lastFinite(emaSeries);
  const rsi = calculateRSI(closes, 14);
  const volatility = calculateVolatility(closes);
  const recent = closes.slice(-Math.min(48, closes.length));
  const slope = regressionSlope(recent);
  const earlier = closes.at(-Math.min(30, closes.length)) ?? closes[0] ?? latest;
  const momentum = earlier ? ((latest - earlier) / earlier) * 100 : 0;
  const { support, resistance } = calculateSupportResistance(points);

  let score = 0;
  const reasons: string[] = [];

  if (ema > sma) {
    score += 1.2;
    reasons.push("EMA is above SMA");
  } else if (ema < sma) {
    score -= 1.2;
    reasons.push("EMA is below SMA");
  }

  if (slope > 0) {
    score += 1;
    reasons.push("short-term regression slope is rising");
  } else if (slope < 0) {
    score -= 1;
    reasons.push("short-term regression slope is falling");
  }

  if (momentum > 0.35) {
    score += 0.8;
    reasons.push("recent momentum is positive");
  } else if (momentum < -0.35) {
    score -= 0.8;
    reasons.push("recent momentum is negative");
  }

  if (rsi > 68) {
    score -= 0.45;
    reasons.push("RSI is near overbought territory");
  } else if (rsi < 32) {
    score += 0.45;
    reasons.push("RSI is near oversold territory");
  }

  const rangeWidth = resistance - support;
  if (rangeWidth > 0) {
    const rangePosition = (latest - support) / rangeWidth;
    if (rangePosition > 0.72) score += 0.35;
    if (rangePosition < 0.28) score -= 0.35;
  }

  const confidence = Math.round(clamp(52 + Math.abs(score) * 14 - volatility * 0.18, 42, 92));
  const probabilityUp = Math.round(clamp(50 + score * 12, 8, 92));
  const trend: TrendDirection = score > 0.65 ? "UP TREND" : score < -0.65 ? "DOWN TREND" : "SIDEWAYS";
  const riskLevel: RiskLevel = volatility > 36 ? "HIGH" : volatility > 20 ? "MEDIUM" : "LOW";

  return {
    trend,
    sentiment: trend === "UP TREND" ? "Bullish" : trend === "DOWN TREND" ? "Bearish" : "Neutral",
    confidence,
    probabilityUp,
    riskLevel,
    volatilityLabel: volatility > 28 ? "HIGH VOLATILITY" : "NORMAL",
    sma,
    ema,
    rsi,
    support,
    resistance,
    momentum,
    volatility,
    forecast: buildForecast(points, slope, confidence),
    reasons: reasons.slice(0, 4)
  };
}
