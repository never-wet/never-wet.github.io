import type { AIInsight, IntelCategory, IntelEvent, IntelRegion, RiskLevel, SignalItem, TrendDirection } from "@/types";

const CATEGORY_KEYWORDS: Record<IntelCategory, string[]> = {
  geopolitics: ["election", "diplomat", "sanction", "treaty", "summit", "president", "minister", "border", "alliance", "troop"],
  economy: ["market", "inflation", "bank", "trade", "tariff", "economy", "bond", "stock", "price", "growth", "currency"],
  conflict: ["war", "attack", "strike", "missile", "drone", "military", "ceasefire", "conflict", "hostage", "bombing", "frontline"],
  infrastructure: ["earthquake", "wildfire", "storm", "outage", "port", "bridge", "rail", "airport", "grid", "pipeline", "supply"],
  energy: ["energy", "oil", "gas", "power", "electricity", "fossil", "renewable", "nuclear", "fuel", "carbon"],
  technology: ["ai", "cyber", "chip", "software", "data", "satellite", "semiconductor", "robot", "tech", "platform"]
};

const RISK_WORDS = {
  critical: ["invasion", "missile", "tsunami", "emergency", "blackout", "evacuation", "shutdown", "nuclear", "collapse"],
  high: ["war", "strike", "attack", "surge", "soars", "disruption", "threat", "wildfire", "earthquake", "sanction"],
  medium: ["warn", "tension", "pressure", "volatility", "probe", "delay", "risk", "shortage"]
};

export function stripHtml(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function classifyCategory(text: string, hint?: string): IntelCategory {
  const lower = `${text} ${hint ?? ""}`.toLowerCase();
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([category, words]) => {
    const score = words.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
    return [category as IntelCategory, score] as const;
  });
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "geopolitics";
}

export function scoreSeverity(text: string, sourceSeverity = 1) {
  const lower = text.toLowerCase();
  let score = sourceSeverity;

  if (RISK_WORDS.critical.some((word) => lower.includes(word))) score += 2.2;
  if (RISK_WORDS.high.some((word) => lower.includes(word))) score += 1.2;
  if (RISK_WORDS.medium.some((word) => lower.includes(word))) score += 0.6;

  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

export function riskFromSeverity(severity: number): RiskLevel {
  if (severity >= 4.35) return "critical";
  if (severity >= 3.25) return "high";
  if (severity >= 2.1) return "medium";
  return "low";
}

export function trendFromSeverity(severity: number): TrendDirection {
  if (severity >= 3.15) return "up";
  if (severity <= 1.25) return "down";
  return "stable";
}

export function confidenceFromTimestamp(timestamp: string, base = 0.78) {
  const ageHours = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 36e5);
  const recencyBoost = ageHours < 2 ? 0.14 : ageHours < 24 ? 0.08 : 0.02;
  return Math.min(0.98, Number((base + recencyBoost).toFixed(2)));
}

export function summarizeEvent(title: string, body?: string) {
  const cleanBody = stripHtml(body);
  if (!cleanBody) return title;
  const summary = cleanBody.length > 138 ? `${cleanBody.slice(0, 138).trim()}...` : cleanBody;
  return summary;
}

function categoryLabel(category: IntelCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function riskScore(risk: RiskLevel) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[risk];
}

export function generateAIInsights(events: IntelEvent[]): AIInsight[] {
  const recent = events
    .filter((event) => Date.now() - new Date(event.timestamp).getTime() < 7 * 24 * 36e5)
    .sort((a, b) => b.severity - a.severity);

  if (!recent.length) {
    return [
      {
        id: "ai-standby",
        title: "Awaiting live signal convergence",
        summary: "The AI layer is waiting for fresh API responses before promoting a trend.",
        region: "Global",
        category: "geopolitics",
        riskLevel: "low",
        confidence: 0.58,
        trend: "stable",
        drivers: ["No high-confidence cluster yet"],
        updatedAt: new Date().toISOString()
      }
    ];
  }

  const groups = new Map<string, IntelEvent[]>();
  for (const event of recent) {
    const key = `${event.region}:${event.category}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const [region, category] = key.split(":") as [IntelRegion, IntelCategory];
      const avgSeverity = group.reduce((total, event) => total + event.severity, 0) / group.length;
      const topRisk = group.reduce<RiskLevel>((highest, event) =>
        riskScore(event.riskLevel) > riskScore(highest) ? event.riskLevel : highest, "low");
      const confidence = Math.min(0.96, 0.58 + group.length * 0.08 + avgSeverity * 0.045);
      const trend = avgSeverity >= 3 || group.length >= 4 ? "up" : avgSeverity < 1.5 ? "down" : "stable";
      const drivers = group.slice(0, 3).map((event) => event.title);

      return {
        id: `ai-${region}-${category}`,
        title: `${categoryLabel(category)} signal cluster in ${region}`,
        summary:
          group.length > 1
            ? `${group.length} related live items indicate ${trend === "up" ? "rising" : "stable"} ${category} pressure across ${region}.`
            : `${group[0].source} reports a monitored ${category} event in ${region}.`,
        region,
        category,
        riskLevel: topRisk,
        confidence: Number(confidence.toFixed(2)),
        trend,
        drivers,
        updatedAt: new Date().toISOString()
      } satisfies AIInsight;
    })
    .sort((a, b) => riskScore(b.riskLevel) - riskScore(a.riskLevel) || b.confidence - a.confidence)
    .slice(0, 5);
}

export function buildSystemLogs(events: IntelEvent[], signals: SignalItem[]): SignalItem[] {
  const highRisk = events.filter((event) => event.riskLevel === "high" || event.riskLevel === "critical");
  const latest = events[0];
  const logs: SignalItem[] = [
    {
      id: "log-ingest",
      label: "Ingest cycle",
      value: `${events.length} events`,
      detail: "Guardian, USGS, NASA EONET, NWS, market, and energy feeds merged.",
      timestamp: new Date().toISOString(),
      level: highRisk.length ? "medium" : "low",
      source: "System",
      direction: highRisk.length >= 3 ? "up" : "stable"
    }
  ];

  if (latest) {
    logs.push({
      id: "log-latest",
      label: "Latest contact",
      value: latest.region,
      detail: latest.title,
      timestamp: latest.timestamp,
      level: latest.riskLevel,
      source: latest.source,
      direction: latest.trend
    });
  }

  if (highRisk.length) {
    logs.push({
      id: "log-anomaly",
      label: "Anomaly watch",
      value: `${highRisk.length} elevated`,
      detail: "AI risk model promoted clustered high-severity events.",
      timestamp: new Date().toISOString(),
      level: highRisk.some((event) => event.riskLevel === "critical") ? "critical" : "high",
      source: "System",
      direction: "up"
    });
  }

  return [...signals, ...logs].slice(0, 14);
}
