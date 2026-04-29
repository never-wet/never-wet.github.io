# Market Intel AI

A real-time AI-powered stock analysis dashboard built with Next.js, React, TypeScript, Recharts, Zustand, and server-side polling API routes.

## How Real-Time Data Works

- The app polls `/api/market` every 6.5 seconds.
- `/api/market` proxies Yahoo Finance chart data from `query1.finance.yahoo.com/v8/finance/chart/{symbol}`.
- Each response includes live or near-live price, volume, volatility, historical OHLC candles, day high/low, and previous close.
- Search and news use Yahoo Finance search data through `/api/search` and `/api/news`.
- The proxy keeps browser requests fast and avoids client-side CORS issues.

Yahoo Finance chart endpoints are unofficial and can change. For a production trading product, replace `lib/api.ts` and the API routes with a contracted provider such as Polygon, Finnhub, IEX Cloud, or Alpha Vantage.

## How Prediction Works

The prediction system is algorithmic and runs locally in `lib/prediction.ts`.

- SMA 20 and EMA 20 detect trend direction.
- RSI 14 identifies overbought or oversold pressure.
- Linear regression on recent closes estimates short-term slope.
- Support and resistance come from recent OHLC percentiles.
- Volatility is annualized from close-to-close returns.
- A weighted score outputs `UP TREND`, `DOWN TREND`, or `SIDEWAYS`, plus confidence, risk level, and probability.
- The chart overlays support, resistance, moving averages, and an AI forecast line.

This is research software, not financial advice and not a brokerage system.

## Run Project

### Static HTML Entry

Open `index.html` directly, or visit `/market-intel-ai/` from the main homepage. The static page loads Yahoo Finance chart data through a CORS-safe proxy, so common symbols such as MSFT, NVDA, AAPL, IBM, and TSLA can render without an API key.

The HTML interface is a fixed trading terminal: top search/status bar, left symbol list, dominant center chart, right buy/sell plus portfolio panel, and a compact horizontal news tape. The main page does not scroll vertically.

### Next.js App

```bash
npm install
npm run dev
```

Then open the local URL printed by Next.js.

## Build

```bash
npm run build
npm run start
```

This app requires the Next.js server because API routes proxy live financial data. Static GitHub Pages export is not used for this project.

The HTML dashboard exists for visible GitHub Pages-style launching. The Next app remains the richer server-backed version.
