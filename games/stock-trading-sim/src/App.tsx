import { useEffect, useMemo } from "react";
import { MarketOverview } from "./components/MarketOverview";
import { NewsFeed } from "./components/NewsFeed";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { PriceChart } from "./components/PriceChart";
import { StockList } from "./components/StockList";
import { TopBar } from "./components/TopBar";
import { TradePanel } from "./components/TradePanel";
import { getPortfolioSummary } from "./engine/playerSystem";
import { SPEED_TO_MS, useTradingStore } from "./store/useTradingStore";

export function App() {
  const cash = useTradingStore((state) => state.cash);
  const initialCash = useTradingStore((state) => state.initialCash);
  const closedRealizedPnl = useTradingStore((state) => state.closedRealizedPnl);
  const stocks = useTradingStore((state) => state.stocks);
  const holdings = useTradingStore((state) => state.holdings);
  const selectedSymbol = useTradingStore((state) => state.selectedSymbol);
  const orderSide = useTradingStore((state) => state.orderSide);
  const tradeQuantity = useTradingStore((state) => state.tradeQuantity);
  const tradeMessage = useTradingStore((state) => state.tradeMessage);
  const tradeError = useTradingStore((state) => state.tradeError);
  const trades = useTradingStore((state) => state.trades);
  const news = useTradingStore((state) => state.news);
  const events = useTradingStore((state) => state.events);
  const tick = useTradingStore((state) => state.tick);
  const running = useTradingStore((state) => state.running);
  const speed = useTradingStore((state) => state.speed);
  const difficulty = useTradingStore((state) => state.difficulty);
  const milestones = useTradingStore((state) => state.milestones);
  const advanceTick = useTradingStore((state) => state.advanceTick);
  const buySelected = useTradingStore((state) => state.buySelected);
  const sellSelected = useTradingStore((state) => state.sellSelected);
  const selectStock = useTradingStore((state) => state.selectStock);
  const setOrderSide = useTradingStore((state) => state.setOrderSide);
  const setTradeQuantity = useTradingStore((state) => state.setTradeQuantity);
  const setSpeed = useTradingStore((state) => state.setSpeed);
  const toggleRunning = useTradingStore((state) => state.toggleRunning);
  const resetGame = useTradingStore((state) => state.resetGame);
  const setDifficulty = useTradingStore((state) => state.setDifficulty);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(advanceTick, SPEED_TO_MS[speed]);

    return () => window.clearInterval(interval);
  }, [advanceTick, running, speed]);

  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol) ?? stocks[0];
  const selectedHolding = selectedStock ? holdings[selectedStock.symbol] : undefined;
  const summary = useMemo(
    () => getPortfolioSummary(cash, holdings, stocks, initialCash, closedRealizedPnl),
    [cash, closedRealizedPnl, holdings, initialCash, stocks],
  );

  if (!selectedStock) {
    return null;
  }

  return (
    <main className="app-shell">
      <TopBar
        cash={summary.cash}
        netWorth={summary.netWorth}
        returnPct={summary.returnPct}
        exposurePct={summary.exposurePct}
        tick={tick}
        running={running}
        speed={speed}
        difficulty={difficulty}
        onToggleRunning={toggleRunning}
        onSpeedChange={setSpeed}
        onDifficultyChange={setDifficulty}
        onReset={() => resetGame()}
      />

      <div className="terminal-grid">
        <aside className="left-rail">
          <StockList stocks={stocks} selectedSymbol={selectedStock.symbol} onSelect={selectStock} />
        </aside>

        <section className="main-stage" aria-label="Selected stock workspace">
          <PriceChart stock={selectedStock} holding={selectedHolding} />
          <div className="bottom-dock">
            <MarketOverview stocks={stocks} events={events} tick={tick} />
            <NewsFeed news={news} trades={trades} milestones={milestones} />
          </div>
        </section>

        <aside className="right-rail">
          <TradePanel
            stock={selectedStock}
            holding={selectedHolding}
            cash={cash}
            side={orderSide}
            quantity={tradeQuantity}
            difficulty={difficulty}
            message={tradeMessage}
            error={tradeError}
            onSideChange={setOrderSide}
            onQuantityChange={setTradeQuantity}
            onBuy={buySelected}
            onSell={sellSelected}
          />
          <PortfolioPanel summary={summary} onSelect={selectStock} />
        </aside>
      </div>
    </main>
  );
}
