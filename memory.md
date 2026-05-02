# RPG Homepage Memory

## World Design Rules

- The homepage is a playable navigation hub, not a normal landing page and not a full game.
- Keep the world compact with a central plaza, simple paths, and clearly separated buildings.
- Use a modern, premium, slightly futuristic style.
- Avoid clutter, childish props, forced tutorials, and dense decorative objects.
- Buildings must be readable from distance through silhouette, color, label, and minimap marker.

## Navigation Rules

- Buildings are the primary navigation.
- Entering a building opens the destination through a cinematic camera push and fade.
- Do not use hard page jumps for the main interaction.
- Prefer in-page portal loading so the user feels like they entered a space.
- Keep routes centralized in `lib/navigationRoutes.ts` and building metadata in `lib/worldData.ts`.

## Minimap Rules

- Use a circular minimap with simplified roads, player arrow, building markers, and route line.
- Allow north-up and rotating modes.
- Clicking a building marker should guide the player or select that destination.
- Keep the map clean; it should support navigation without becoming a dashboard.

## Character Customization Rules

- Keep customization lightweight: outfit color, hair style/color, accessory, avatar type.
- Save choices in `localStorage`.
- Do not build a full character creator.
- Customization must not distract from homepage navigation.

## Day / Night Rules

- Time of day should smoothly affect sky, fog, ambient light, directional light, and building glow.
- Night can add subtle stars and stronger building emissive accents.
- Include auto-cycle on/off and a manual time slider.
- Keep light counts low and performance smooth.

## NPC Guide Rules

- The NPC is a concierge, not a tutorial popup.
- NPC should idle in the hub, turn toward the player nearby, and show a small speech bubble.
- Clicking the NPC opens chat.
- Use scripted fallback responses unless a real AI API is explicitly configured.
- NPC can explain buildings, recommend where to start, and set destination intent.

## Spatial UI Rules

- Building overlays should face the camera, stay readable, and appear only when useful.
- Use glass-like panels, thin borders, clean typography, and soft glow.
- Panels should include building name, destination, description, and Enter action.
- Do not let overlays block movement or clutter the world.

## Performance Constraints

- Prefer primitive low-poly geometry over imported models.
- Cap device pixel ratio at 2.
- Avoid too many dynamic lights or heavy shadows.
- Avoid particle-heavy effects in the default homepage.
- Lazy-load destination pages through the portal iframe.

## Things To Avoid

- No large permanent menu overlay.
- No cluttered dashboard UI.
- No instant white flash or reload-feeling navigation.
- No oversized hero copy or normal website sections on the first screen.
- No decorative 3D clutter that competes with building navigation.
- No one-note color palette; each building needs a distinct accent.
