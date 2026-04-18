import { useState } from "react";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { contentRegistry } from "../memory/contentRegistry";

export const InventoryPage = () => {
  const { state, dispatch } = useGame();
  const [filter, setFilter] = useState<"all" | "consumable" | "equipment" | "quest">("all");

  const filtered = state.inventory.filter((entry) => {
    const item = contentRegistry.itemsById[entry.itemId];
    if (filter === "all") return true;
    if (filter === "consumable") return item.type === "consumable";
    if (filter === "equipment") return item.type === "weapon" || item.type === "armor" || item.type === "accessory";
    if (filter === "quest") return item.type === "quest" || item.type === "material";
    return true;
  });

  return (
    <div className="page-grid">
      <Panel eyebrow="Inventory" title="Pack & Equipment" actions={
        <div className="chip-row">
          {(["all", "consumable", "equipment", "quest"] as const).map((value) => (
            <button key={value} className={`chip ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)} type="button">
              {value}
            </button>
          ))}
        </div>
      }>
        <div className="card-grid three-up">
          {filtered.map((entry) => {
            const item = contentRegistry.itemsById[entry.itemId];
            const equipable = item.type === "weapon" || item.type === "armor" || item.type === "accessory";
            return (
              <article key={item.id} className="feature-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <small>
                  {item.type} • {entry.quantity}
                </small>
                <div className="stack-actions">
                  {item.type === "consumable" ? (
                    <button className="secondary-button" onClick={() => dispatch({ type: "USE_ITEM", itemId: item.id })} type="button">
                      Use
                    </button>
                  ) : null}
                  {equipable ? (
                    <button className="secondary-button" onClick={() => dispatch({ type: "EQUIP_ITEM", itemId: item.id })} type="button">
                      Equip
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};
