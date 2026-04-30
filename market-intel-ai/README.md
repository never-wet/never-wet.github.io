# Market Intel AI

A real-time AI-powered stock analysis dashboard built with Next.js, React, TypeScript, Recharts, Zustand, and server-side polling API routes.

## How Real-Time Data Works

- The app polls `/api/market` every 5 seconds.
- `/api/market` proxies Yahoo Finance chart data from `query1.finance.yahoo.com/v8/finance/chart/{symbol}`.
- The provider switch can use `Yahoo`, `Alpha`, or `Compare`. Yahoo remains the fast default; Alpha Vantage is used for the selected symbol; Compare keeps Yahoo primary, overlays Alpha Vantage on the chart when available, and shows price gap/freshness metadata for the selected symbol.
- Users can paste an Alpha Vantage API key into the top-bar key field, then press Enter or leave the field to save it and immediately reload the selected symbol. Get a free key at `https://www.alphavantage.co/support/#api-key`.
- You can also set `ALPHA_VANTAGE_API_KEY` in your environment for reliable server-side Alpha Vantage data. Without a user key or environment key, the app falls back to Alpha Vantage's limited demo key.
- The main quote uses Yahoo's regular-market price/close, while pre-market or after-hours ticks are shown as a separate extended-hours quote.
- Each response includes live or near-live price, volume, volatility, historical OHLC candles, day high/low, and previous close.
- Each quote includes a market-session status such as `Regular hours`, `Pre-market`, `After hours`, or `Market closed`.
- Default tracked markets now include US indices, stock ETFs, large-cap equities, crypto pairs, gold, crude oil, and EUR/USD.
- Search and news use Yahoo Finance search data through `/api/search` and `/api/news`.
- The proxy keeps browser requests fast and avoids client-side CORS issues.

Yahoo Finance chart endpoints are unofficial and can change. Alpha Vantage requires an API key and has rate limits, so this app only requests Alpha Vantage for the selected chart symbol instead of the entire watchlist.

## How Prediction Works

The prediction system is algorithmic and runs locally in `lib/prediction.ts`.

- SMA 20 and EMA 20 detect trend direction.
- RSI 14 identifies overbought or oversold pressure.
- Linear regression on recent closes estimates short-term slope.
- Support and resistance come from recent OHLC percentiles.
- Volatility is annualized from close-to-close returns.
- A weighted score outputs `UP TREND`, `DOWN TREND`, or `SIDEWAYS`, plus confidence, risk level, and probability.
- Recent candles are replayed as a rolling backtest: the model compares prior predictions with what actually happened a few candles later, then calibrates confidence and probability from that hit rate.
- New predictions are also saved in browser `localStorage` under `marketIntelPredictionJournal.v1`; later price updates score those saved predictions as hit/miss and use the recorded accuracy as an additional confidence adjustment.
- The AI prediction panel can download the recorded accuracy journal as a plain `.txt` report for the selected symbol.
- The chart overlays support, resistance, moving averages, and an AI forecast line.

This is research software, not financial advice and not a brokerage system.

## Run Project

### Static HTML Entry

Open `index.html` directly, or visit `/market-intel-ai/` from the main homepage. The static page first tries the local Next.js market API at `localhost:3000` for faster updates, then falls back to a browser-safe Yahoo Finance proxy and finally Alpha Vantage demo data. Common symbols, market indices, ETFs, crypto, futures, and FX pairs can render without an API key.

The HTML interface is a fixed market prediction terminal: compact top search/status bar, collapsible left watchlist, dominant center chart workspace, and a right inspector with Quote, AI, and News tabs. Only the active inspector tab is visible, so quote context, predictions, and news do not compete with the chart.

There is no execution simulator. The main page does not scroll vertically; only the watchlist and active inspector content scroll internally.

The chart stage uses true data-window navigation: mouse-wheel zoom changes `visibleStartIndex` / `visibleEndIndex`, drag pans the visible slice left or right, and the Y-axis is recalculated from the visible OHLC/indicator values. No CSS scale or transform is used to fake zoom.

Incoming OHLC candles are normalized so invalid or non-positive high/low values cannot crush the chart into a flat line during pan or zoom.

The chart also has a full-screen control that expands only the chart stage through the browser Fullscreen API.

### Next.js App

```bash
npm install
npm run dev
```

Then open the local URL printed by Next.js.

Optional server-side Alpha Vantage key. Users can also paste a key into the dashboard field, then press Enter or leave the field to apply it. Get one at `https://www.alphavantage.co/support/#api-key`.

```bash
$env:ALPHA_VANTAGE_API_KEY="your_key_here"
npm run dev
```

## Build

```bash
npm run build
npm run start
```

This app requires the Next.js server because API routes proxy live financial data. Static GitHub Pages export is not used for this project.

The HTML dashboard exists for visible GitHub Pages-style launching. The Next app remains the richer server-backed version.
