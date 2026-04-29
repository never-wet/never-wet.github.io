import { NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type YahooSearchResponse = {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    exchDisp?: string;
    quoteType?: string;
    typeDisp?: string;
    sector?: string;
  }>;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ results: [] });

  const params = new URLSearchParams({
    q: query,
    quotesCount: "9",
    newsCount: "0",
    listsCount: "0",
    enableFuzzyQuery: "true",
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

  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const payload = (await response.json()) as YahooSearchResponse;
  const results: SearchResult[] = (payload.quotes || [])
    .filter((quote) => quote.symbol && ["EQUITY", "ETF", "INDEX"].includes(quote.quoteType || ""))
    .slice(0, 8)
    .map((quote) => ({
      symbol: quote.symbol!.toUpperCase(),
      name: quote.longname || quote.shortname || quote.symbol!,
      exchange: quote.exchDisp || "Market",
      quoteType: quote.typeDisp || quote.quoteType || "equity",
      sector: quote.sector
    }));

  return NextResponse.json({ results });
}
