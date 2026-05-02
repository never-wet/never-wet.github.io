# Market Pulse Trader

An interactive browser stock trading simulation built with React, TypeScript, Zustand, and Recharts.

## How The Market Works

- Every stock has a price, sector, trend, volatility, momentum, volume, risk score, and rolling price history.
- Each market tick combines random walk movement, trend bias, sector behavior, momentum, and active event pressure.
- Sectors behave differently:
  - Tech follows momentum and product news.
  - Energy reacts hard to commodity shocks.
  - Finance is steadier but rate-sensitive.
  - Healthcare is defensive with breakthrough spikes.
  - Startup names have the highest volatility and event sensitivity.
- Events decay over several ticks instead of applying once, so players can react to a developing story.

## How Trading Works

- The player starts with cash based on difficulty. Normal starts at $10,000.
- Buy orders require enough cash for shares plus trading fee.
- Sell orders require owned shares.
- Holdings track shares, average entry price, current value, unrealized profit/loss, and realized profit/loss after sells.
- Net worth is cash plus current market value of holdings.
- The current run auto-saves in browser `localStorage` and restores when the page reopens.

## How Events Affect Stocks

- Scripted events teach the player the system early in a run.
- Random events can hit one sector, several sectors, or the full market.
- Events adjust price impact, trend, volatility, and volume while active.
- Targeted symbols receive a stronger effect than the rest of their sector.

## Run Locally

```bash
npm install
npm run dev
```

## Build Static Site

```bash
npm run build
```

The build copies the generated `dist/dev.html` to `index.html` and publishes Vite assets into `assets/`, matching the existing games site pattern.

## Local Save

Market Pulse Trader saves the serializable game state under `marketPulseTrader.save.v1`, including the current tick, stocks, holdings, trades, news, selected stock, speed, and difficulty. Pressing reset starts a fresh run and overwrites the saved run.
