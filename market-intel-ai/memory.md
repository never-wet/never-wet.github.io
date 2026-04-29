# Market Intel AI Memory

## API Used

- Default provider: Yahoo Finance chart/search endpoints through Next.js API routes.
- Market route: `/api/market` calls `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`.
- Search/news routes: `/api/search` and `/api/news` call Yahoo Finance search.
- Polling interval: 6.5 seconds for market prices, 60 seconds for news.
- Keep provider logic isolated in `lib/api.ts` and `app/api/*/route.ts`.
- Static HTML entry: `index.html` uses Yahoo Finance chart data through allOrigins for browser-safe no-key loading. Alpha Vantage demo remains a silent fallback only. It uses Yahoo Finance RSS through rss2json/allOrigins for visible live headlines.

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

## UI Rules

- Dashboard style only. Main desktop page uses `100dvh` and `overflow: hidden`.
- Static HTML layout: top bar, left watchlist, dominant center chart, right order ticket with account summary, bottom compact horizontal news tape.
- Never place order controls, portfolio, or chart below page scroll.
- Only the stock list and bottom news tape may scroll internally.
- Professional terminal palette with black base, green/red/amber/cyan/violet signal colors.
- No marketing hero, no scrolling desktop page, no decorative orbs.
- Cards are functional panels only, radius 8px or less.

## Performance Rules

- Use Zustand for shared state.
- Poll in place and merge quote records instead of rebuilding the whole app.
- Keep charts responsive through Recharts and memoized indicator calculations.
- Limit API symbols per request and news results per render.
- Keep panel overflow internal so the dashboard frame does not shift.
