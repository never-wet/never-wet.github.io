# Market Pulse Trader Memory

## Market Logic

- Tick loop runs continuously while the market is unpaused.
- Price movement = random walk + stock trend + momentum + sector pulse + active event pressure.
- Trends persist differently by sector. Tech and Startup trends last longer; Finance and Healthcare mean-revert faster.
- Volatility is baseline stock volatility multiplied by difficulty and modified by active events.
- Volume rises when price moves sharply or events are active.

## Event System

- Scripted events occur at ticks 4, 13, 24, and 38 to make the opening run feel authored.
- Random events are weighted and blocked for a few ticks after fresh events so the feed stays readable.
- Events affect sectors and sometimes targeted symbols.
- Event impact decays over its duration, keeping the market strategic rather than purely random.

## Player Rules

- Starting money is difficulty-based: Normal and Volatile use $10,000; Strategic uses $12,500.
- Buying requires cash for gross order value plus fee.
- Selling requires owned shares.
- Average price updates on buys.
- Realized P/L updates when shares are sold.
- Portfolio net worth = cash + current holding value.

## UI Rules

- The first screen is the trading desk, not a landing page.
- Top bar shows cash, net worth, return, exposure, tick, speed, difficulty, pause, and reset.
- Main chart displays the selected stock with real-time price history and volume.
- Stock list and portfolio sit below the chart area for fast scanning.
- Order ticket supports buy/sell, share quantity, quick quantities, max, fees, and live order feedback.
- News feed explains event causes and keeps recent trades visible.

## Balancing Rules

- Baseline movement should be readable but not flat.
- Events should be noticeable without making every order feel hopeless.
- High-risk startup stocks can move violently and reward timing.
- Stable names should protect capital but rarely create dramatic returns.
- Volatile mode increases market swings and fees.
- Strategic mode slows the market and starts with more cash.
