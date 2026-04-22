# NOEMA / VAULT Memory

Read this file before making design changes. Update it whenever the concept, motion logic, visual system, or performance approach changes in a meaningful way.

## Concept Statement

- `NOEMA / VAULT` is a fictional premium intelligence platform.
- The experience should feel like entering a sealed archive where volatile knowledge condenses into architecture.
- The website is a directed realtime world first and an informational site second.
- The product promise is simple:
  We turn unstable information into a world you can think inside.

## Governing Metaphor

- `memory becoming architecture`
- The whole site must behave like one story:
  a sealed shard becomes filaments, then a vault, then a larger inhabitable structure.
- Every chapter should feel like a later state of the same system, not a disconnected section.

## Art Direction Rules

- Base atmosphere:
  matte-black, obsidian, smoked metal, pale ice light, restrained tungsten accent
- Materials should feel expensive and engineered:
  transmission glass, dark alloy, luminous dust, thin wire structures, cold reflective edges
- The site must never rely on CSS gradients as the primary spectacle.
- Procedural geometry is preferred over stock-looking assets.
- Editorial restraint matters:
  fewer elements, better framing, stronger objects

## Motion Rules

- Motion should feel choreographed, not reactive-for-its-own-sake.
- Chapter transitions should be triggered and completed with easing, not left hanging halfway when scroll stops.
- Ambient movement should remain subtle:
  dust drift, light pulse, slow structural breathing
- Text reveals should be decisive and fast.
- Avoid bouncy easing, springy cards, playful pop-ins, or decorative jitter.

## UI Rules

- UI is instrumentation, not a navbar-dominant shell.
- Use a minimal fixed header and a chapter progress rail.
- Overlay panels should feel like field annotations or archive readouts.
- Keep controls sparse and quiet.
- Buttons must stay compact and sharp.
- Avoid large rounded cards, soft dashboards, and generic hero CTA layouts.

## Color Rules

- Background:
  `#040609`, `#06080d`, `#090d12`
- Primary cold light:
  `#8cc4ff`, `#dfeeff`
- Metallic neutrals:
  `#6f7d92`, `#9ea8b7`
- Restrained warm accent:
  `#d9a96a`
- Accent is rare and should read like energy or ignition, never like branding filler.
- No rainbow hues, candy neons, startup purple, or loud gradients.

## Typography Rules

- Display typography should be architectural, compressed, and sharply tracked.
- Body typography should remain clean, calm, and editorial.
- Headlines should be concise and cinematic.
- Copy should feel like scene direction, not conventional marketing filler.
- Uppercase labels are useful for navigation, rails, and instrumentation.

## Spacing Rules

- The page should use viewport height and width as compositional tools.
- Overlay copy can sit left or right depending on the scene framing.
- Avoid narrow center-column layouts and oversized empty gutters.
- Visual breathing room should support scene transitions.

## Camera Behavior

- Start close to the sealed archive object.
- Move through a controlled fracture sequence into a larger spatial vault.
- Pull the camera deeper into the environment during the world chapter.
- Hold steadier framing during capability and proof readouts so the user can read without losing immersion.
- Finish with a stronger pull-back into a world-scale final structure.
- Reduced-motion mode should minimize travel and reduce oscillation while preserving the chapter logic.

## Performance Constraints

- One persistent fullscreen WebGL canvas across the whole page.
- Adaptive quality:
  reduce DPR, particles, architecture density, and postprocessing on weaker devices
- Keep the post stack subtle:
  bloom, vignette, light noise, tiny chromatic offset only on capable devices
- Use procedural geometry and lightweight materials instead of large external assets.
- Preserve a premium mobile fallback with simplified geometry and calmer motion.

## Things To Avoid

- standard hero + features + testimonials + CTA layout
- giant bubbly cards
- oversized rounded buttons
- decorative fake 3D made from CSS blur blobs
- random spinning object in the hero with no story progression
- disconnected sections with different visual languages
- loud gradients, overly glossy UI, and dashboard clutter
- scroll-scrubbed reveals that freeze awkwardly when the user pauses

## Important Design Decisions

- Brand shell for this prototype:
  `NOEMA / VAULT`
- Product framing:
  premium intelligence infrastructure / memory systems platform
- Core message:
  volatile knowledge becomes inhabitable structure
- Chapter sequence:
  sealed shard, controlled fracture, vault emergence, capability annotations, proof readouts, final archive form
- Interaction model:
  scroll updates overall journey progress, while chapter entry triggers complete cinematic scene transitions
- The 3D world should feature:
  archive shard, fragment burst, memory ribbons, vault arches, proof monoliths, and a final cathedral-like form
- Proof metrics are concept placeholders and can be replaced with real brand numbers later without changing the visual system.
