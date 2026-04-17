import { useState } from "react";
import type { EscapeRoomDefinition } from "../../memory/types";

export function InventoryPanel({
  room,
  collectedItemIds,
  onCombine,
}: {
  room: EscapeRoomDefinition;
  collectedItemIds: string[];
  onCombine: (first: string, second: string) => boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const items = room.inventory.filter((item) => collectedItemIds.includes(item.id));

  function toggle(itemId: string) {
    setSelected((current) =>
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId].slice(-2),
    );
  }

  return (
    <aside className="panel inventory-panel">
      <div className="section-heading">
        <h2>Inventory</h2>
        <span>{items.length} items</span>
      </div>
      <div className="inventory-panel__items">
        {items.length === 0 ? <p className="muted">No items collected in this room yet.</p> : null}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`inventory-item ${selected.includes(item.id) ? "inventory-item--selected" : ""}`}
            onClick={() => toggle(item.id)}
          >
            <span className="inventory-item__icon">{item.icon}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="button button--ghost"
        disabled={selected.length !== 2}
        onClick={() => {
          if (selected.length === 2 && onCombine(selected[0], selected[1])) {
            setSelected([]);
          }
        }}
      >
        Combine Selected
      </button>
    </aside>
  );
}
