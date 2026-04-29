import { RadioTower } from "lucide-react";
import type { CSSProperties } from "react";
import { SECTOR_PROFILES } from "../data/stocks";
import { summarizeSectors } from "../engine/marketEngine";
import type { MarketEvent, Stock } from "../types";
import { formatPercent, formatVolume } from "./format";

interface MarketOverviewProps {
  stocks: Stock[];
  events: MarketEvent[];
  tick: number;
}

export function MarketOverview({ stocks, events, tick }: MarketOverviewProps) {
  const sectorStats = summarizeSectors(stocks, events, tick);
  const leadingEvent = events[0];

  return (
    <aside className="market-overview" aria-label="Market overview">
      <div className="panel-heading">
        <RadioTower size={17} aria-hidden="true" />
        <h2>Market Signal</h2>
      </div>

      {leadingEvent ? (
        <div className={`event-callout severity-${leadingEvent.severity}`}>
          <span>{leadingEvent.source}</span>
          <strong>{leadingEvent.headline}</strong>
          <p>{leadingEvent.body}</p>
        </div>
      ) : (
        <div className="event-callout">
          <span>quiet tape</span>
          <strong>No dominant event</strong>
          <p>Prices are mostly following baseline trend and sector personality.</p>
        </div>
      )}

      <div className="sector-grid">
        {sectorStats.map((sector) => (
          <div
            className="sector-tile"
            key={sector.sector}
            style={{ "--sector-color": SECTOR_PROFILES[sector.sector].accent } as CSSProperties}
          >
            <div>
              <strong>{sector.sector}</strong>
              <span>{SECTOR_PROFILES[sector.sector].behavior}</span>
            </div>
            <b className={sector.averageChangePct >= 0 ? "is-positive" : "is-negative"}>
              {formatPercent(sector.averageChangePct)}
            </b>
            <small>{formatVolume(sector.totalVolume)} vol</small>
          </div>
        ))}
      </div>
    </aside>
  );
}
