# Market Intel AI Memory

## API Used

- Default provider: Yahoo Finance chart/search endpoints through Next.js API routes.
- Provider modes: `yahoo`, `alpha`, and `compare`. Yahoo remains the fast whole-watchlist source. Alpha Vantage is requested for the selected symbol only to avoid rate-limit problems. Compare keeps the selected chart on Yahoo, overlays Alpha Vantage prices when available, and attaches price-gap/freshness metadata.
- Alpha Vantage key: users can paste a key into the top-bar field, then press Enter or leave the field to save it in browser `localStorage` as `marketIntelAlphaApiKey` and immediately reload the selected symbol; server-side fallback reads `ALPHA_VANTAGE_API_KEY`; without either, use the limited Alpha demo key and expect many non-IBM symbols to fail. Tell users to get a free key at `https://www.alphavantage.co/support/#api-key`.
- Market route: `/api/market` calls `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`.
- Displayed quote price uses Yahoo `regularMarketPrice` for regular-market close/current regular price. Pre-market and after-hours use the newest finite OHLC close as a separate `extended` quote; never blend those values into the main quote.
- Market route derives session status from Yahoo `currentTradingPeriod` and displays Regular hours, Pre-market, After hours, or Market closed.
- Search/news routes: `/api/search` and `/api/news` call Yahoo Finance search.
- Polling interval: 5 seconds for market prices, 20 seconds for watchlist quotes, 60 seconds for news.
- Keep provider logic isolated in `lib/api.ts`, `store/useMarketStore.ts`, and `app/api/*/route.ts`.
- Static HTML entry: `index.html` first tries the local `/api/market` service at `localhost:3000` for fast updates, then falls back to Yahoo Finance through allOrigins for browser-safe no-key loading. Alpha Vantage demo remains a silent fallback only. It uses Yahoo Finance RSS through allOrigins for visible live headlines.
- Market symbol validation allows Yahoo indices, crypto, futures, and FX formats such as `^GSPC`, `BTC-USD`, `GC=F`, and `EURUSD=X`.

## Prediction Logic

- Use OHLC close history from the live provider.
- Calculate SMA 20, EMA 20, RSI 14, close-to-close volatility, support, resistance, and regression slope.
- Weighted score:
  - EMA above SMA adds bullish pressure.
  - Positive regression slope adds bullish pressure.
  - Recent momentum adjusts direction.
  - RSI extremes reduce or add contrarian pressure.
  - Position inside the support/resistance range adds final bias.
- Output trend, confidence %, probability up %, risk level, volatility label, and forecast overlay.
- Calibrate predictions with a rolling backtest: replay recent candles, compare each previous prediction with the price a few candles later, show hit rate/sample count, and adjust confidence/probability from that measured accuracy.
- Persist prediction records in browser `localStorage` at `marketIntelPredictionJournal.v1`; score pending records later and combine recorded accuracy with rolling backtest calibration.
- Provide a TXT accuracy export for the selected symbol from the saved local prediction journal.

## UI Rules

- Dashboard style only. Main desktop page uses `100dvh` and `overflow: hidden`.
- Layout is chart-first: compact top bar, collapsible left watchlist, dominant center chart workspace, and one right inspector.
- The right inspector is tabbed: Quote, AI, News. Never stack those panels at full size at the same time.
- Do not include execution controls, account simulation, or gamified finance workflows. This is a market prediction website, not a brokerage or simulator product.
- Never place chart, quote context, risk context, or news below page scroll.
- Only the watchlist and active inspector tab content may scroll internally.
- Professional terminal palette with black base, green/red/amber/cyan/violet signal colors.
- No marketing hero, no scrolling desktop page, no decorative orbs.
- Cards are functional panels only, radius 8px or less.
- Chart zoom is data-window based only: maintain `visibleStartIndex` and `visibleEndIndex`, render only that slice, and recalculate the Y-axis from visible OHLC/indicator values. Mouse wheel zoom is anchored to cursor position, drag pans left/right, and no CSS transform/scale is allowed for zoom.
- Chart price domains must ignore invalid/non-positive OHLC values. Normalize each candle so high/low are finite, positive, and contain open/close; otherwise pan/zoom can flatten the visible line.
- Chart stage includes a Full/Exit full-screen control using the browser Fullscreen API. Full-screen must resize the chart container only, not distort data or fake zoom.
- Chart UX follows Apple/Yahoo/TradingView-style patterns: keep the range selector above the chart, show a compact data window for hovered time/price/OHLC/volume, use a crosshair/price marker for inspection, and keep advanced overlays optional.

## Performance Rules

- Use Zustand for shared state.
- Poll in place and merge quote records instead of rebuilding the whole app.
- Keep charts responsive through Recharts and memoized indicator calculations.
- Limit API symbols per request and news results per render.
- Keep panel overflow internal so the dashboard frame does not shift.
