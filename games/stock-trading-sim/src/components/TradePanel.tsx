import { ArrowDownToLine, ArrowUpFromLine, BadgeDollarSign, Calculator } from "lucide-react";
import { calculateFee } from "../engine/playerSystem";
import type { Difficulty, Holding, OrderSide, Stock } from "../types";
import { formatCurrency } from "./format";

interface TradePanelProps {
  stock: Stock;
  holding?: Holding;
  cash: number;
  side: OrderSide;
  quantity: number;
  difficulty: Difficulty;
  message: string;
  error: string;
  onSideChange: (side: OrderSide) => void;
  onQuantityChange: (quantity: number) => void;
  onBuy: () => void;
  onSell: () => void;
}

export function TradePanel({
  stock,
  holding,
  cash,
  side,
  quantity,
  difficulty,
  message,
  error,
  onSideChange,
  onQuantityChange,
  onBuy,
  onSell,
}: TradePanelProps) {
  const gross = stock.price * quantity;
  const fee = calculateFee(gross, difficulty);
  const buyTotal = gross + fee;
  const sellTotal = Math.max(0, gross - fee);
  const maxBuy = Math.max(1, Math.floor(cash / (stock.price + fee / Math.max(1, quantity))));
  const maxSell = Math.max(1, holding?.shares ?? 1);
  const canBuy = cash >= buyTotal;
  const canSell = Boolean(holding && holding.shares >= quantity);
  const execute = side === "buy" ? onBuy : onSell;
  const canExecute = side === "buy" ? canBuy : canSell;

  return (
    <section className="trade-panel" aria-label="Buy and sell panel">
      <div className="panel-heading">
        <BadgeDollarSign size={17} aria-hidden="true" />
        <h2>Order Ticket</h2>
      </div>

      <div className="ticket-symbol">
        <strong>{stock.symbol}</strong>
        <span>{stock.name}</span>
      </div>

      <div className="side-switch" role="group" aria-label="Order side">
        <button type="button" className={side === "buy" ? "is-active" : ""} onClick={() => onSideChange("buy")}>
          <ArrowDownToLine size={16} aria-hidden="true" />
          Buy
        </button>
        <button type="button" className={side === "sell" ? "is-active" : ""} onClick={() => onSideChange("sell")}>
          <ArrowUpFromLine size={16} aria-hidden="true" />
          Sell
        </button>
      </div>

      <label className="quantity-control">
        <span>Shares</span>
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(event) => onQuantityChange(Number(event.target.value))}
        />
      </label>

      <div className="quick-buttons" aria-label="Quick quantities">
        {[1, 5, 10, 25].map((amount) => (
          <button key={amount} type="button" onClick={() => onQuantityChange(amount)}>
            {amount}
          </button>
        ))}
        <button type="button" onClick={() => onQuantityChange(side === "buy" ? maxBuy : maxSell)}>
          Max
        </button>
      </div>

      <div className="order-math">
        <Calculator size={17} aria-hidden="true" />
        <div>
          <span>Price</span>
          <strong>{formatCurrency(stock.price)}</strong>
        </div>
        <div>
          <span>Fee</span>
          <strong>{formatCurrency(fee)}</strong>
        </div>
        <div>
          <span>{side === "buy" ? "Cost" : "Proceeds"}</span>
          <strong>{formatCurrency(side === "buy" ? buyTotal : sellTotal)}</strong>
        </div>
      </div>

      <button className="execute-button" type="button" disabled={!canExecute} onClick={execute}>
        {side === "buy" ? <ArrowDownToLine size={18} aria-hidden="true" /> : <ArrowUpFromLine size={18} aria-hidden="true" />}
        {side === "buy" ? "Place Buy Order" : "Place Sell Order"}
      </button>

      <div className={`trade-feedback ${error ? "is-error" : message ? "is-ok" : ""}`} aria-live="polite">
        {error || message || "Orders execute immediately at the displayed live price."}
      </div>
    </section>
  );
}
