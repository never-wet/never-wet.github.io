# ARCTIS / SIGNAL Memory

## Art direction
- Build a premium immersive WebGL world, not a conventional landing page.
- Emotional tone: cinematic, severe, futuristic, atmospheric, intelligent, polished.
- The experience opens in near-black space with a suspended crystalline signal core, then expands into a larger data-material environment.
- Typography and negative space should feel editorial and controlled while the live 3D world carries the emotional weight.
- Use procedural matter, glass-metal surfaces, particulate atmosphere, and restrained interface layers.

## Motion rules
- The main motion system is scroll-linked narrative choreography with six chapters: intro, reveal, fracture, environment, systems, climax.
- Camera travel must feel stabilized and intentional, with interpolation rather than abrupt jumps.
- Animate only a small number of dominant elements per chapter.
- Motion hierarchy:
  1. Camera path
  2. Core evolution
  3. Shards / particles / ribbons
  4. Overlay transitions
- Reduced motion keeps the live 3D scene but lowers particle counts, dampens camera travel, and disables heavier post-processing.

## 3D rules
- Keep one persistent fullscreen WebGL canvas active through the whole page.
- Required live elements:
  - crystalline signal core
  - fracture shards
  - animated particles / atmospheric dust
  - flowing data filaments
  - larger environmental ring structures
- Use realtime procedural geometry only. No static screenshots, fake CSS depth, or decorative div-based pseudo-3D.
- Use shader materials for the signal core, particles, and ribbons.
- Fog and post-processing should add depth, not spectacle for spectacle's sake.

## Camera behavior
- Intro starts close to the core with slight forward drift.
- Chapter 1 orbits to reveal internal geometry.
- Chapter 2 pulls back while fracture motion and particles expand.
- Chapter 3 moves through a larger environmental field.
- Final chapter settles on a composed intelligent form with the environment fully activated.
- Pointer response is subtle parallax only.

## Palette
- Background: `#050607`
- Fog / deep field: `#0b1117`
- Metallic surface: `#293544`
- Bright metallic highlight: `#c7d9eb`
- Primary accent: `#74d9ff`
- Accent shadow: `#173744`
- Text: `#edf4ff`
- Muted text: `#93a3b7`

## Typography
- Display: `Sora`
- Body: `Manrope`
- Headlines are large, tight, and sharp.
- Supporting copy is sparse, editorial, and never marketing-fluffy.
- Labels use uppercase tracking for navigational clarity.

## Spacing rules
- Use full viewport compositions and wide gutters.
- Chapters are tall and scroll-driven with sticky copy anchors around 14vh-18vh from the top.
- Avoid centered narrow marketing columns.
- Let the canvas breathe behind overlay text.

## UI constraints
- Minimal HUD only:
  - brand marker
  - chapter progress dots
  - current chapter label
  - restrained CTA links
- No large rounded cards, SaaS navbars, or feature-grid layout.
- Information content can sit in translucent ledger panels with thin rules, never as generic product cards.

## Performance constraints
- Lazy-load the WebGL canvas via dynamic import.
- Use a weaker-device profile to reduce DPR, particle count, and post-processing.
- Post-processing is desktop/high-power only and remains subtle:
  - bloom
  - vignette
  - very slight chromatic aberration
- Keep geometry counts procedural but bounded.
- Respect `prefers-reduced-motion`.

## Things to avoid
- Fake 3D from layered divs, blobs, screenshots, or CSS-only tricks.
- Generic dark landing page structure.
- Neon rainbow sci-fi color explosions.
- Overbloomed or over-distorted post-processing.
- Dense paragraphs, boxed marketing modules, and cluttered interface chrome.
