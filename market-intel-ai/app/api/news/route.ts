import { NextRequest, NextResponse } from "next/server";
import type { NewsItem } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type YahooNewsResponse = {
  news?: Array<{
    uuid?: string;
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    relatedTickers?: string[];
    type?: string;
  }>;
};

const bullishWords = [
  "gain",
  "gains",
  "beats",
  "beat",
  "upgrade",
  "surge",
  "rally",
  "growth",
  "record",
  "profit"
];

const bearishWords = [
  "fall",
  "falls",
  "miss",
  "cuts",
  "cut",
  "downgrade",
  "drop",
  "crash",
  "loss",
  "probe"
];

function impactForTitle(title: string): NewsItem["impact"] {
  const lower = title.toLowerCase();
  const bullish = bullishWords.some((word) => lower.includes(word));
  const bearish = bearishWords.some((word) => lower.includes(word));

  if (bullish && !bearish) return "bullish";
  if (bearish && !bullish) return "bearish";
  return "neutral";
}

function sanitizeSymbols(value: string | null) {
  const symbols = (value || "^GSPC,SPY,NVDA,BTC-USD,GC=F")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.^=-]{1,18}$/.test(symbol));

  return [...new Set(symbols)].slice(0, 8);
}

export async function GET(request: NextRequest) {
  const symbols = sanitizeSymbols(request.nextUrl.searchParams.get("symbols"));
  const settled = await Promise.allSettled(
    symbols.slice(0, 5).map(async (symbol) => {
      const params = new URLSearchParams({
        q: symbol,
        quotesCount: "0",
        newsCount: "4",
        listsCount: "0",
        lang: "en-US",
        region: "US"
      });

      const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?${params}`, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 MarketIntelAI/0.1"
        }
      });

      if (!response.ok) return [];
      const payload = (await response.json()) as YahooNewsResponse;
      return payload.news || [];
    })
  );

  const seen = new Set<string>();
  const rawNews = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => {
      const key = item.uuid || item.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));

  const news: NewsItem[] = rawNews.slice(0, 10).map((item, index) => {
    const title = item.title || "Market update";
    const relatedTickers = item.relatedTickers?.length ? item.relatedTickers : symbols;
    const impact = impactForTitle(title);

    return {
      id: item.uuid || `${title}-${index}`,
      title,
      publisher: item.publisher || "Yahoo Finance",
      link: item.link || "https://finance.yahoo.com/",
      publishedAt: (item.providerPublishTime || Math.floor(Date.now() / 1000)) * 1000,
      relatedTickers,
      impact,
      description: `${item.publisher || "Market"} coverage linked to ${
        relatedTickers.slice(0, 3).join(", ") || "major indexes"
      }.`
    };
  });

  return NextResponse.json({ news });
}
