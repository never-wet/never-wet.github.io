import { contentRegistry } from "../memory/contentRegistry";
import { useGame } from "../hooks/useGame";

export const ShopOverlay = () => {
  const { state, dispatch } = useGame();
  const location = contentRegistry.locationsById[state.currentLocationId];
  const listings = location.shopListings ?? [];

  if (!state.activeShopId || !listings.length) {
    return null;
  }

  return (
    <div className="scene-overlay shop-overlay">
      <div className="shop-panel">
        <p className="hud-label">Field Shop</p>
        <h2>{state.activeShopId === "thornwake-market" ? "Thornwake Market Stalls" : "Supply Counter"}</h2>
        <p>Silver on hand: {state.player.silver}</p>
        <div className="shop-grid">
          {listings.map((listing) => {
            const item = contentRegistry.itemsById[listing.itemId];
            return (
              <article key={item.id} className="shop-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong>{listing.price} silver</strong>
                <button className="secondary-button" onClick={() => dispatch({ type: "BUY_ITEM", itemId: item.id })} type="button">
                  Buy
                </button>
              </article>
            );
          })}
        </div>
        <button className="ghost-button" onClick={() => dispatch({ type: "SET_ACTIVE_SHOP", shopId: null })} type="button">
          Close Shop
        </button>
      </div>
    </div>
  );
};
