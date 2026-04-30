"use client";

import { useState } from "react";
import { Crown, Sparkles, Trophy, X } from "lucide-react";

type ResultDisplayProps = {
  result: string | null;
  resultKey: number;
  isSpinning: boolean;
};

export function ResultDisplay({ result, resultKey, isSpinning }: ResultDisplayProps) {
  const [dismissedResultKey, setDismissedResultKey] = useState<number | null>(null);
  const isPopupVisible = Boolean(result && !isSpinning && dismissedResultKey !== resultKey);

  return (
    <>
      <section className="result-panel" aria-live="polite">
        <div className="result-panel__icon" aria-hidden="true">
          <Trophy size={22} strokeWidth={2.2} />
        </div>
        <div>
          <span className="panel-kicker">Result</span>
          <strong>{isSpinning ? "Spinning..." : result ?? "Ready"}</strong>
        </div>
      </section>

      {result && isPopupVisible ? (
        <div className="winner-popup" role="dialog" aria-modal="true" aria-labelledby="winner-title">
          <button
            className="winner-popup__backdrop"
            type="button"
            aria-label="Close winner popup"
            onClick={() => setDismissedResultKey(resultKey)}
          />
          <section className="winner-popup__card">
            <button
              className="winner-popup__close"
              type="button"
              aria-label="Close winner popup"
              onClick={() => setDismissedResultKey(resultKey)}
            >
              <X size={18} />
            </button>
            <div className="winner-popup__burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="winner-popup__medal" aria-hidden="true">
              <Crown size={34} strokeWidth={2.15} />
            </div>
            <span className="panel-kicker">Winner</span>
            <h2 id="winner-title">{result}</h2>
            <p>
              <Sparkles size={17} aria-hidden="true" />
              <span>Selected under the pointer</span>
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
