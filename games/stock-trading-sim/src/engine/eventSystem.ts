import type { Difficulty, MarketEvent, NewsItem, NewsTone, Sector, Stock } from "../types";
import { id, pickOne, randomBetween } from "./random";

interface EventTemplate {
  headline: string;
  body: string;
  sectors: Sector[];
  symbolTargets?: string[];
  priceImpact: [number, number];
  trendImpact: [number, number];
  volatilityImpact: [number, number];
  volumeImpact: [number, number];
  duration: [number, number];
  severity: MarketEvent["severity"];
  tone: NewsItem["tone"];
  weight: number;
}

const SCRIPTED_EVENTS: Record<number, EventTemplate> = {
  4: {
    headline: "Tech company releases new product",
    body: "Analysts raise demand forecasts after a major AI hardware launch. Growth traders pile into tech.",
    sectors: ["Tech", "Startup"],
    symbolTargets: ["NOVA", "ROBO"],
    priceImpact: [0.013, 0.028],
    trendImpact: [0.002, 0.005],
    volatilityImpact: [0.004, 0.01],
    volumeImpact: [0.55, 1.1],
    duration: [7, 11],
    severity: "medium",
    tone: "positive",
    weight: 1,
  },
  13: {
    headline: "Oil prices crash",
    body: "Unexpected supply data shakes commodity desks. Energy names face a sharp repricing.",
    sectors: ["Energy"],
    symbolTargets: ["PETR", "HLX"],
    priceImpact: [-0.036, -0.019],
    trendImpact: [-0.006, -0.002],
    volatilityImpact: [0.008, 0.017],
    volumeImpact: [0.8, 1.35],
    duration: [8, 13],
    severity: "high",
    tone: "negative",
    weight: 1,
  },
  24: {
    headline: "Interest rates increase",
    body: "The central bank signals tighter policy. Banks steady themselves while speculative shares wobble.",
    sectors: ["Finance", "Startup"],
    priceImpact: [-0.018, -0.007],
    trendImpact: [-0.004, -0.001],
    volatilityImpact: [0.004, 0.012],
    volumeImpact: [0.35, 0.95],
    duration: [10, 15],
    severity: "medium",
    tone: "warning",
    weight: 1,
  },
  38: {
    headline: "Healthcare breakthrough trial",
    body: "A late-stage trial reports unusually strong results. Defensive capital rotates into healthcare.",
    sectors: ["Healthcare"],
    symbolTargets: ["VITA"],
    priceImpact: [0.018, 0.042],
    trendImpact: [0.002, 0.006],
    volatilityImpact: [0.004, 0.012],
    volumeImpact: [0.6, 1.2],
    duration: [8, 12],
    severity: "high",
    tone: "positive",
    weight: 1,
  },
};

const RANDOM_EVENTS: EventTemplate[] = [
  {
    headline: "Market panic",
    body: "A wave of sell orders hits every risk desk. Stable stocks hold up better than speculative names.",
    sectors: ["Tech", "Energy", "Finance", "Healthcare", "Startup"],
    priceImpact: [-0.026, -0.011],
    trendImpact: [-0.005, -0.0015],
    volatilityImpact: [0.007, 0.018],
    volumeImpact: [0.75, 1.4],
    duration: [6, 11],
    severity: "high",
    tone: "negative",
    weight: 0.7,
  },
  {
    headline: "Retail trading surge",
    body: "Social feeds light up around small caps. Startup tickers see a sudden rush of speculative volume.",
    sectors: ["Startup"],
    symbolTargets: ["ROBO", "FLYR"],
    priceImpact: [0.012, 0.045],
    trendImpact: [0.002, 0.009],
    volatilityImpact: [0.015, 0.032],
    volumeImpact: [1, 2.4],
    duration: [5, 9],
    severity: "extreme",
    tone: "positive",
    weight: 1,
  },
  {
    headline: "Cloud outage hits enterprise tools",
    body: "A major infrastructure outage pressures software names and tests market patience.",
    sectors: ["Tech"],
    symbolTargets: ["CLDW"],
    priceImpact: [-0.033, -0.014],
    trendImpact: [-0.006, -0.002],
    volatilityImpact: [0.01, 0.02],
    volumeImpact: [0.7, 1.35],
    duration: [6, 10],
    severity: "high",
    tone: "negative",
    weight: 0.9,
  },
  {
    headline: "Refinery disruption squeezes supply",
    body: "Energy traders price in short supply. Oil-linked shares catch a bid while volume accelerates.",
    sectors: ["Energy"],
    symbolTargets: ["PETR"],
    priceImpact: [0.014, 0.033],
    trendImpact: [0.002, 0.006],
    volatilityImpact: [0.006, 0.014],
    volumeImpact: [0.45, 1.25],
    duration: [7, 12],
    severity: "medium",
    tone: "positive",
    weight: 1,
  },
  {
    headline: "Credit stress rumor spreads",
    body: "Banks trade lower as desks wait for confirmation. Finance names see uneven pressure.",
    sectors: ["Finance"],
    symbolTargets: ["FORT", "PAYX"],
    priceImpact: [-0.025, -0.009],
    trendImpact: [-0.005, -0.001],
    volatilityImpact: [0.006, 0.014],
    volumeImpact: [0.55, 1.1],
    duration: [6, 10],
    severity: "medium",
    tone: "warning",
    weight: 0.8,
  },
  {
    headline: "Patent win boosts medical devices",
    body: "A broad patent ruling helps healthcare equipment suppliers and calms defensive investors.",
    sectors: ["Healthcare"],
    symbolTargets: ["MEDI"],
    priceImpact: [0.008, 0.023],
    trendImpact: [0.001, 0.004],
    volatilityImpact: [0.002, 0.008],
    volumeImpact: [0.35, 0.9],
    duration: [6, 10],
    severity: "low",
    tone: "positive",
    weight: 1.1,
  },
  {
    headline: "Broad market relief rally",
    body: "Bargain hunters step in after a soft open. Momentum improves across most sectors.",
    sectors: ["Tech", "Energy", "Finance", "Healthcare", "Startup"],
    priceImpact: [0.006, 0.019],
    trendImpact: [0.001, 0.004],
    volatilityImpact: [-0.004, 0.002],
    volumeImpact: [0.25, 0.8],
    duration: [7, 13],
    severity: "medium",
    tone: "positive",
    weight: 0.9,
  },
];

const EVENT_CHANCE_BY_DIFFICULTY: Record<Difficulty, number> = {
  normal: 0.105,
  volatile: 0.16,
  strategic: 0.082,
};

function pickWeightedEvent(): EventTemplate {
  const total = RANDOM_EVENTS.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * total;

  for (const event of RANDOM_EVENTS) {
    roll -= event.weight;
    if (roll <= 0) {
      return event;
    }
  }

  return RANDOM_EVENTS[RANDOM_EVENTS.length - 1];
}

function instantiateEvent(template: EventTemplate, tick: number, source: MarketEvent["source"]): MarketEvent {
  return {
    id: id("event", tick),
    tick,
    headline: template.headline,
    body: template.body,
    sectors: template.sectors,
    symbolTargets: template.symbolTargets,
    priceImpact: randomBetween(template.priceImpact[0], template.priceImpact[1]),
    trendImpact: randomBetween(template.trendImpact[0], template.trendImpact[1]),
    volatilityImpact: randomBetween(template.volatilityImpact[0], template.volatilityImpact[1]),
    volumeImpact: randomBetween(template.volumeImpact[0], template.volumeImpact[1]),
    duration: Math.round(randomBetween(template.duration[0], template.duration[1])),
    severity: template.severity,
    source,
  };
}

export function maybeCreateEvent(
  tick: number,
  difficulty: Difficulty,
  activeEvents: MarketEvent[],
): MarketEvent | null {
  const scripted = SCRIPTED_EVENTS[tick];

  if (scripted) {
    return instantiateEvent(scripted, tick, "scripted");
  }

  const hasFreshEvent = activeEvents.some((event) => tick - event.tick < 3);

  if (tick < 7 || hasFreshEvent || Math.random() > EVENT_CHANCE_BY_DIFFICULTY[difficulty]) {
    return null;
  }

  return instantiateEvent(pickWeightedEvent(), tick, "random");
}

export function createOpeningNews(stocks: Stock[]): NewsItem[] {
  const leader = pickOne(stocks);

  return [
    {
      id: "news-open-1",
      tick: 0,
      title: "Opening bell",
      message: "Cash is live, prices are moving, and sector news will begin shaping momentum within seconds.",
      tone: "neutral",
      sectors: ["Tech", "Energy", "Finance", "Healthcare", "Startup"],
    },
    {
      id: "news-open-2",
      tick: 0,
      title: `${leader.symbol} draws early attention`,
      message: `${leader.name} opens with above-average volume. It may be worth watching before the first event lands.`,
      tone: leader.trend >= 0 ? "positive" : "warning",
      sectors: [leader.sector],
    },
  ];
}

export function eventToNews(event: MarketEvent): NewsItem {
  const tone: NewsTone =
    event.priceImpact > 0.006
      ? "positive"
      : event.priceImpact < -0.006
        ? "negative"
        : "warning";

  return {
    id: id("news", event.tick),
    tick: event.tick,
    title: event.headline,
    message: event.body,
    tone,
    sectors: event.sectors,
  };
}
