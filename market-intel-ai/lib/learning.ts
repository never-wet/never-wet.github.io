import type { StockQuote } from "./api";
import type { PredictionResult, TrendDirection } from "./prediction";

const STORAGE_KEY = "marketIntelPredictionJournal.v1";
const MAX_ENTRIES = 900;
const MIN_SAMPLES_FOR_ADJUSTMENT = 5;

type Direction = -1 | 0 | 1;

type PredictionJournalEntry = {
  id: string;
  symbol: string;
  createdAt: number;
  baseTime: number;
  targetTime: number;
  basePrice: number;
  predictedTrend: TrendDirection;
  expectedDirection: Direction;
  probabilityUp: number;
  confidence: number;
  status: "pending" | "hit" | "miss";
  resolvedAt?: number;
  actualTime?: number;
  actualPrice?: number;
  actualDirection?: Direction;
};

export type PredictionJournalStats = {
  accuracy: number;
  samples: number;
  wins: number;
  losses: number;
  pending: number;
  total: number;
  confidenceAdjustment: number;
  probabilityScale: number;
  storageKey: string;
  lastRecordedAt: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJournal(): PredictionJournalEntry[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJournal(entries: PredictionJournalEntry[]) {
  if (!canUseStorage()) return;

  const compacted = entries
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
}

function directionFromTrend(trend: TrendDirection): Direction {
  if (trend === "UP TREND") return 1;
  if (trend === "DOWN TREND") return -1;
  return 0;
}

function actualDirection(from: number, to: number): Direction {
  const threshold = Math.max(Math.abs(from) * 0.0008, 0.01);
  const move = to - from;
  if (move > threshold) return 1;
  if (move < -threshold) return -1;
  return 0;
}

function pointInterval(quote: StockQuote) {
  const points = quote.points;
  if (points.length < 2) return 60_000;
  return Math.max(points.at(-1)!.time - points.at(-2)!.time, 30_000);
}

function statsFor(symbol: string, entries: PredictionJournalEntry[]): PredictionJournalStats {
  const scoped = entries.filter((entry) => entry.symbol === symbol);
  const resolved = scoped.filter((entry) => entry.status === "hit" || entry.status === "miss");
  const wins = resolved.filter((entry) => entry.status === "hit").length;
  const samples = resolved.length;
  const accuracy = samples ? Math.round((wins / samples) * 100) : 50;

  return {
    accuracy,
    samples,
    wins,
    losses: samples - wins,
    pending: scoped.filter((entry) => entry.status === "pending").length,
    total: scoped.length,
    confidenceAdjustment: samples >= MIN_SAMPLES_FOR_ADJUSTMENT ? Math.round(clamp((accuracy - 50) * 0.25, -12, 12)) : 0,
    probabilityScale: samples >= MIN_SAMPLES_FOR_ADJUSTMENT ? clamp(0.78 + (accuracy / 100) * 0.42, 0.72, 1.16) : 1,
    storageKey: STORAGE_KEY,
    lastRecordedAt: scoped.at(-1)?.createdAt ?? null
  };
}

function directionLabel(direction: Direction | undefined) {
  if (direction === 1) return "up";
  if (direction === -1) return "down";
  if (direction === 0) return "flat";
  return "--";
}

export function buildPredictionJournalReport(symbol: string): string {
  const normalized = symbol.toUpperCase();
  const entries = readJournal();
  const scoped = entries.filter((entry) => entry.symbol === normalized);
  const stats = statsFor(normalized, entries);
  const lines = [
    "Market Intel AI - Prediction Accuracy Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Symbol: ${normalized}`,
    `Storage key: ${STORAGE_KEY}`,
    "",
    "Summary",
    `Total records: ${stats.total}`,
    `Resolved records: ${stats.samples}`,
    `Hit rate: ${stats.samples ? `${stats.accuracy}%` : "not enough resolved predictions"}`,
    `Wins: ${stats.wins}`,
    `Losses: ${stats.losses}`,
    `Pending: ${stats.pending}`,
    `Confidence adjustment: ${stats.confidenceAdjustment >= 0 ? "+" : ""}${stats.confidenceAdjustment} pts`,
    "",
    "Records",
    "status | created | target | predicted | base price | actual price | actual direction | confidence | probability up"
  ];

  scoped
    .slice()
    .reverse()
    .forEach((entry) => {
      lines.push(
        [
          entry.status,
          new Date(entry.createdAt).toLocaleString(),
          new Date(entry.targetTime).toLocaleString(),
          entry.predictedTrend,
          Number.isFinite(entry.basePrice) ? entry.basePrice.toFixed(4) : "--",
          typeof entry.actualPrice === "number" && Number.isFinite(entry.actualPrice)
            ? entry.actualPrice.toFixed(4)
            : "--",
          directionLabel(entry.actualDirection),
          `${entry.confidence}%`,
          `${entry.probabilityUp}%`
        ].join(" | ")
      );
    });

  return `${lines.join("\n")}\n`;
}

export function downloadPredictionJournalReport(symbol: string) {
  if (typeof window === "undefined") return;

  const normalized = symbol.toUpperCase();
  const blob = new Blob([buildPredictionJournalReport(normalized)], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.href = url;
  link.download = `market-intel-${normalized}-accuracy-${stamp}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getPredictionJournalStats(symbol: string): PredictionJournalStats {
  return statsFor(symbol.toUpperCase(), readJournal());
}

export function recordPredictionLearning(
  symbol: string,
  quote: StockQuote,
  prediction: PredictionResult
): PredictionJournalStats {
  const normalized = symbol.toUpperCase();
  const latest = quote.points.at(-1);
  if (!latest) return getPredictionJournalStats(normalized);

  const now = Date.now();
  const interval = pointInterval(quote);
  const horizonSteps = prediction.calibration.horizonSteps || 5;
  const targetTime = latest.time + interval * horizonSteps;
  const expectedDirection = directionFromTrend(prediction.trend);
  const journal = readJournal();

  const scored = journal.map((entry) => {
    if (entry.symbol !== normalized || entry.status !== "pending" || latest.time < entry.targetTime) {
      return entry;
    }

    const actualPoint = quote.points.find((point) => point.time >= entry.targetTime) || latest;
    const observed = actualDirection(entry.basePrice, actualPoint.close);
    const hit = observed === entry.expectedDirection;

    return {
      ...entry,
      status: hit ? ("hit" as const) : ("miss" as const),
      resolvedAt: now,
      actualTime: actualPoint.time,
      actualPrice: actualPoint.close,
      actualDirection: observed
    };
  });

  const duplicate = scored.some(
    (entry) =>
      entry.symbol === normalized &&
      entry.baseTime === latest.time &&
      entry.predictedTrend === prediction.trend
  );

  if (!duplicate) {
    scored.push({
      id: `${normalized}-${latest.time}-${prediction.trend}`,
      symbol: normalized,
      createdAt: now,
      baseTime: latest.time,
      targetTime,
      basePrice: latest.close,
      predictedTrend: prediction.trend,
      expectedDirection,
      probabilityUp: prediction.probabilityUp,
      confidence: prediction.confidence,
      status: "pending"
    });
  }

  writeJournal(scored);
  return statsFor(normalized, scored);
}

export function applyJournalLearning(
  prediction: PredictionResult,
  stats: PredictionJournalStats | undefined
): PredictionResult {
  if (!stats || stats.samples < MIN_SAMPLES_FOR_ADJUSTMENT) return prediction;

  return {
    ...prediction,
    confidence: Math.round(clamp(prediction.confidence + stats.confidenceAdjustment, 35, 95)),
    probabilityUp: Math.round(clamp(50 + (prediction.probabilityUp - 50) * stats.probabilityScale, 8, 92)),
    reasons: [
      `recorded journal accuracy is ${stats.accuracy}% over ${stats.samples} scored predictions`,
      ...prediction.reasons
    ].slice(0, 4)
  };
}
