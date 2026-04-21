# ARCTIS / SIGNAL Memory

This file is the design and implementation memory for the `arctis-signal/` project. Read it before changing the experience, and update it whenever a meaningful visual, motion, or technical decision changes.

## Brand Definition

- Product name: `ARCTIS / SIGNAL`
- Product category: premium creative technology studio at the intersection of climate, signal, material intelligence, and digital experience
- Product posture:
  cinematic, high-end, future-facing, controlled, mysterious, and intelligent
- Core promise:
  entering the website should feel like entering a living digital system, not browsing a standard marketing page

## Art Direction

- The site is a real-time WebGL world first and a content page second.
- The visual center is a suspended signal core that evolves through fracture, filament, environment, and final intelligence states.
- Atmosphere should feel matte-black, metallic, cold, and precise, with one restrained warm accent used sparingly for key energy moments.
- Surfaces should feel premium and technical:
  iridescent glass, dark metal, luminous filaments, particulate haze, deep fog, and controlled bloom
- No decorative filler gradients pretending to be spectacle.

## Motion Rules

- Scroll must choreograph the 3D progression directly.
- Camera movement should feel deliberate, slow, and composed rather than playful or reactive.
- Motion should emphasize transformation, reveal, and cinematic staging.
- DOM motion should support the WebGL scene, not compete with it.
- Avoid bouncy easing, pop-in UI, or generic SaaS reveal patterns.

## 3D Rules

- Keep one persistent fullscreen canvas alive through the full page.
- Use actual 3D forms rendered in real time:
  procedural geometry, particles, ribbon-like structures, and environmental meshes
- The main 3D states must be visibly distinct:
  signal core, fracture field, data filaments, environmental structure, final living form
- CSS must never fake the primary 3D effect.
- Use shader-driven or time-reactive material behavior where it adds premium depth.

## Camera Behavior

- The camera should move on a guided path tied to scroll chapters.
- Favor smooth target interpolation and damped travel over abrupt cuts.
- Camera should occasionally orbit or pass through the world enough to create scale and immersion.
- Reduced-motion mode should minimize camera travel while preserving scene legibility.

## Palette

- Background: near-black, matte black, and blue-black values only
- Primary highlight: cold metallic blue / icy silver
- Secondary support: steel gray and pale mist tones
- Controlled accent: restrained amber used as a rare energy signal
- Avoid pastel, candy, neon rainbow, or generic purple startup tones

## Typography

- Display type should be sharp, uppercase, and architectural
- Body type should be clean, modern, and restrained
- Copy should be concise, scene-based, and editorial rather than feature-card marketing
- Typography must hold its own against the 3D world without becoming bulky

## Spacing Rules

- Use full viewport width and height intentionally
- Avoid boxed-in central columns and oversized empty gutters
- Overlay copy should sit in the composition like film titles or scene captions
- Section spacing should create breathing room for scene transitions, not stacked website blocks

## UI Constraints

- UI should remain minimal and mostly transparent
- Navigation, progress, and CTA elements should feel like instrumentation, not a header-heavy SaaS shell
- Use thin dividers, small radii, and restrained blur
- No giant rounded corners
- No bubbly cards
- No cluttered control bars

## Performance Constraints

- Optimize for desktop first while staying usable on mobile
- Reduce particle counts and postprocessing on smaller or weaker devices
- Use lazy loading and client-only rendering where appropriate
- Reduced-motion mode must remove heavy choreography and tone down animation
- Keep postprocessing subtle and never let it bury readability or frame rate

## Things To Avoid

- normal hero plus feature cards plus CTA landing-page structure
- fake 3D made from layered divs or CSS transforms
- giant glass panels pretending to be premium
- default gradients as the main visual idea
- oversized navbars
- dashboard-like metrics sections that break immersion
- playful motion, pastel accents, or soft bubbly UI

## Current Implementation Decisions

- The project now lives as a dedicated Next.js app in `arctis-signal/` using the app router.
- The homepage is built around one persistent fullscreen React Three Fiber canvas fixed behind the entire scroll experience.
- Scroll progression is orchestrated with GSAP `ScrollTrigger` and drives a continuous scene progress value rather than isolated decorative reveals.
- The 3D world currently moves through five major visual states:
  crystalline core, fracture field, filament corridor, expanded environment, and final intelligent form
- The central core is procedural:
  shader-driven icosahedron geometry, transmission shell, and wireframe envelope rather than static image assets
- The fracture moment uses real instanced shard meshes and animated particles rendered in realtime.
- The filament chapter uses multiple procedural tube geometries with animated shader materials to read as flowing data ribbons.
- The environmental chapter uses a corridor of luminous ring structures to give the camera a genuine spatial path instead of orbiting one isolated object forever.
- The final scene resolves into a larger torus-knot-based structure plus a glassy internal core so the ending feels transformed rather than repeated.
- Atmosphere is built from realtime particles, volumetric-feeling fog, vignette, bloom, subtle noise, and restrained chromatic aberration.
- Postprocessing must stay tasteful:
  bloom supports highlights, vignette shapes the frame, and chromatic aberration remains barely perceptible
- Typography uses `Oxanium` for display and `Manrope` for body text.
- Overlay content is written and positioned as chapter captions and instrumentation rather than standard marketing cards.
- The information section is still scene-led:
  concise system strips appear inside the same scroll world instead of switching to a dashboard layout
- Reduced-motion and lower-power handling are implemented:
  smaller particle counts, lower DPR, lighter postprocessing, and less fluid camera behavior on weaker conditions
- The app should continue to prefer procedural assets and realtime material behavior over external 3D models unless a future asset is clearly superior and performance-safe.
