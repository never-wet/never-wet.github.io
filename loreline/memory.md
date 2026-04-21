# Loreline Memory

This file is the design memory and consistency guide for the `loreline/` project. Read it before changing the design, and update it whenever a meaningful design decision changes.

## Product Definition

- Product name: `Loreline`
- Product category: premium worldbuilding and story-development platform
- Product audience:
  fantasy writers, sci-fi writers, RPG creators, story architects, and creators building entire fictional universes
- Core promise:
  give creators one connected place to build worlds, manage lore, structure narrative, track characters, organize time and place, and write stories inside that ecosystem
- Product posture:
  serious, immersive, calm, powerful, private-feeling, and writer-first
- Product framing to protect:
  this is not a generic AI novel-writing site, not a chapter-speed tool, not a notes app, and not a toy dashboard

## Reference Hierarchy

- Primary reference:
  `https://www.forgetalesstudio.com`
  Use this for product positioning, section priority, and the idea of a worldbuilding-first storytelling home.
- Secondary references:
  `Ulysses` for focused writer UX
  `Linear` for polish, restraint, spacing discipline, and premium product hierarchy
- If references ever conflict:
  prioritize the ForgeTales-style product direction over generic writer-app instincts

## Design Principles

- The site must immediately communicate:
  a home for stories, worlds, lore, maps, characters, systems, and manuscript work
- The product should feel deep, not busy.
- The manuscript must be positioned as part of the same world system, not a separate editor with side notes.
- Extra interface detail should be revealed progressively instead of dumped on screen all at once.
- UX first, UI second.

## Locked Palette

- Background: `#0F172A`
- Surface: `#1E293B`
- Primary text: `#F8FAFC`
- Secondary text: `#CBD5E1`
- Accent 1: `#14B8A6`
- Accent 2: `#F59E0B`
- Divider / subtle border: `#334155`

Rules:

- Keep the experience dark, cinematic, and premium.
- `Accent 1` is the main interactive and emphasis color.
- `Accent 2` is used sparingly for rare emphasis and trust/quote highlights.
- No random extra colors.
- Gradients must stay subtle and grounded in the locked palette.

## Typography Rules

- Display / editorial type: `Newsreader`
- UI and body type: `Plus Jakarta Sans`
- Headings should feel literary, dramatic, and composed rather than playful or corporate.
- Body copy should stay highly readable and calm.
- The type scale should feel deliberate, not inflated for fake drama.

## Layout Rules

- The hero must occupy at least one viewport height and feel immersive.
- Use the browser width intentionally; do not trap content in a tiny center column.
- Desktop sections can stretch to a broad content width around `1440px`.
- Standard horizontal padding should feel editorial:
  `24px` mobile, `32px` tablet, `40px` desktop
- Standard vertical spacing should breathe without turning empty:
  around `96px` to `136px` per section
- Prefer broad grids, layered panels, and asymmetry where it helps immersion.

## Component Rules

- Large panels: max radius `16px`
- Cards: max radius `12px`
- Buttons and inputs: max radius `10px`
- No exaggerated pills.
- Borders are preferred over heavy shadow.
- Surfaces should separate through value change, border, and subtle inner highlight before using shadow.
- Components should feel restrained, not loud or overdesigned.
- Reusable primitives in this project:
  section intro, hero signal card, value card, workspace tab, module card, writing signal, ownership card, difference card, CTA panel

## UX Rules

- The first impression should feel immersive and elegant.
- Complexity should reveal gradually through tabs, drawers, or open states.
- The site must feel focused when writing, structured when planning, and deep when worldbuilding.
- Controls should stay sparse and intentional.
- Motion should be restrained:
  usually `180ms` to `260ms`
- Hover states should clarify affordance, not perform.

## Visual Language

- Dark atmospheric background with subtle depth, not loud gradient tricks.
- Panels should feel like premium creative software, not a generic startup dashboard.
- Use clean dividers, layered surfaces, and controlled accent glow.
- No giant shadow stacks.
- No noisy glassmorphism.

## Explicit Dislikes

- huge empty left and right gutters
- narrow boxed-in layouts
- giant `40px` to `50px` radiuses
- childish bubbly cards
- generic AI SaaS dashboard energy
- random color choices
- excessive shadows
- noisy glassmorphism
- cluttered always-visible controls
- template-looking section stacking
- messaging that reduces the product to "write your novel faster"

## Section Purposes

- Hero:
  establish this as a serious worldbuilding and story-development platform
- Product overview:
  explain the product as a connected creative system, not isolated feature marketing
- Interconnected workspace:
  prove that characters, places, lore, timelines, systems, and manuscript work are linked
- Worldbuilding modules:
  show the serious scope of the product across worldbuilding and story architecture
- Writing experience:
  present writing as manuscript-inside-the-world, not just a plain editor
- Creator ownership / privacy / focus:
  make the product feel trustworthy, calm, and creator-owned
- Why it is different:
  contrast against shallow tools and generic AI positioning
- Final CTA:
  close with premium, confident, ecosystem-level messaging

## Current Implementation Decisions

- The site structure is:
  hero, product overview, interconnected workspace, worldbuilding modules, writing experience, ownership/privacy/focus, why it is different, final CTA
- `loreline/index.html` is the homepage and should remain the public landing page/front door for the product.
- If deeper product views, demos, or app-like screens are added later, they should live on separate routes instead of replacing the homepage.
- The homepage now includes explicit entry points into the actual writing workspace through `?view=studio`.
- The studio route is a focused manuscript environment with a left scene navigator, a central draft editor, and a right story-guide drawer that stays hideable.
- The studio uses local browser autosave for manuscript text and notebook notes so the "actual writing part" feels usable immediately.
- The studio has been refined into an editor-first workspace:
  the manuscript must dominate the screen, while project navigation and story context stay quieter and secondary.
- Story context is hidden by default and opened on demand through compact chips and a dedicated guide toggle.
- Focus mode hides project and guide chrome completely so the page can behave like a calm dedicated writing room.
- Project navigation should feel dimmer and more restrained than the manuscript surface, following the principle that secondary structure should help orientation without competing with the page.
- The writing room now includes a scene target progress bar, readable manuscript measure, concise breadcrumbs, and practical context panels instead of marketing-style explanatory content.
- Panel open/close behavior in the studio should animate as expansion/collapse rather than instant appearance.
- The project rail, story guide, and tab-panel content use smoother panel transitions around `420ms` with soft opacity and position changes.
- Switching between scenes in the studio should animate the main manuscript surface in, so the writing room feels continuous rather than abruptly replaced.
- The homepage should use restrained scroll-reveal animation for sections after the hero, while refresh/load behavior should lift the visible page elements into place from below.
- Homepage reveal motion should feel editorial and premium:
  content rises in with soft opacity and blur easing, not flashy parallax or loud gimmicks.
- On homepage refresh/load, the top bar and hero should animate upward into place in a staggered way so the page feels composed as it arrives.
- Root page scrolling now has a light inertial/slippery feel across the site:
  wheel-driven page scroll should glide a little farther after input stops, but it must animate the real window scroll position so sticky sections and scroll-driven scenes still behave correctly.
- Global scroll smoothing must not hijack inner scroll contexts:
  preserve native behavior for editable fields and nested scrollable panels.
- Homepage scrollbars are visually hidden, matching the calmer studio presentation, while page scrolling itself remains fully functional.
- Studio scrollbars are visually hidden to keep the writing environment cleaner, but scrolling behavior remains intact.
- Reading time in the studio uses a simple fiction-reading estimate around `200 words per minute` and is shown as an `X min read` label.
- The hero uses a two-column layout with an immersive product vignette showing linked story layers.
- The hero now combines product UI with explicit story imagery:
  the right-side hero panel includes an illustrated fantasy tableau near the top so the page immediately signals novels, worlds, characters, and dramatic fiction rather than abstract software alone.
- The hero copy is worldbuilding-first and explicitly aimed at universe builders rather than generic writers.
- The product-overview section now behaves like a scroll narrative on desktop:
  the explanation cards live on the left side, activate one at a time as the user scrolls, and reverse cleanly when scrolling upward.
- The product-overview visuals use a sticky right-side pseudo-3D stage with scene-specific motion tied to the active card's scroll progress.
- The product-overview imagery should live on the sticky right side of the screen, not inside each left-hand card.
- The right-side stage should drift and react with scroll progress so the visual feels scrubbed by scrolling, and it should reverse naturally when scrolling upward.
- Every product-overview box should map to its own clearly distinct right-side scene, with different internal structures and ambient treatment so the stage never reads like only the first box has artwork.
- On wide desktop, every overview box should be paired with its own right-hand sticky stage inside the same chapter row.
- On wide desktop, the left overview card should travel within the same pinned window as the right-side stage:
  it starts aligned to the stage top, moves downward with scroll, stops when its bottom reaches the stage bottom, and clamps back to the stage top when scrolling upward.
- The overview left cards should share a consistent desktop height:
  normalize them to the tallest card so the left-side boxes keep the same Y rhythm and do not feel jumpy from chapter to chapter.
- On narrower layouts, each box should still keep its own companion stage, stacked above or below as needed without losing the one-box-to-one-visual relationship.
- The overview stage scroll animation should be clearly recognizable:
  movement needs to be strong enough to read immediately rather than barely perceptible drift.
- The overview stage should render as pure artwork:
  no frame border, no progress or scroll indicators, no labels, and no explanatory copy inside the visual itself.
- The workspace showcase uses four tabs:
  `Story Nexus`, `World Atlas`, `Chronicle Engine`, `Writing Room`
- The showcase keeps secondary depth hidden until the user opens it.
- Switching between workspace showcase tabs should feel staged rather than instant:
  the current panel eases out first, then the next workspace rises in with subtle stagger across the internal rail, editor, metrics, and support surfaces.
- On wide desktop, the showcase controls cluster with the tabs and actions should travel within the same vertical span as the workspace panel:
  it starts top-aligned under the intro copy, moves downward with scroll, stops when its bottom reaches the workspace panel bottom, and clamps back to the top on reverse scroll.
- The showcase tabs/actions box now uses a shared pinned track with the right workspace panel:
  the workspace panel stays pinned, the left controls box gets guaranteed travel room, and the motion must read clearly in both scroll directions instead of collapsing to near-zero movement.
- The showcase controls must clamp against the real workspace panel height:
  never create travel room by stretching the workspace panel with empty interior space.
- The modules area now expands into a second "creative support systems" mosaic:
  characters, aesthetic boards, personal codex/wiki, studio ambience, plot weaving, and custom calendars should read as serious product systems inside the Loreline ecosystem.
- These support systems should be shown in a broad editorial mosaic with recognizably different internal previews, but always in the locked dark palette rather than copied light-theme reference styling.
- The writing section uses a focused manuscript preview paired with a controlled context drawer to show world-aware drafting.
- The ownership section uses principle cards plus an editorial quote moment instead of fake testimonials.
- The ownership quote is now a public-domain inspirational passage rendered inside a pale manuscript-like panel:
  letters reveal one by one in ink-dark text as the user scrolls down, and they disappear again in reverse when scrolling back up.
- The quote reveal is continuous rather than binary:
  each glyph should begin blurred and hidden, sharpen as it becomes readable, and pass back through blur before disappearing on reverse scroll.
- The quote reveal now has slight inertial trailing:
  when scrolling stops, the reveal should glide a little farther before settling so the motion feels slippery rather than mechanically locked to the wheel.
- The quote section should hold the page on a dedicated pinned scroll track until the full sentence has resolved:
  the next section should not start moving in before the final glyphs have revealed and settled.
- The quote text should wrap by whole words, not isolated letters:
  preserve word groupings while keeping the per-letter reveal effect inside each word.
- The quote release hold should scale with the reveal distance:
  keep the section pinned long enough that the springy reveal can actually finish before the page moves on.
- The "why different" section now uses a comparison table instead of abstract contrast cards:
  compare Loreline against broad product categories, not named competitors, and use product-relevant capability terms rather than copied pricing-table language.
- The comparison table should highlight Loreline's column, keep the terminology worldbuilding-specific, and include a note that the categories are representative rather than vendor-by-vendor claims.
- The "why different" area now opens with an editorial signal cloud:
  centered positioning copy with floating non-interactive lozenges around it, revealed in stagger on scroll, using restrained accent-tinted capsules rather than bright promotional stickers.
- The footer should use an editorial three-part layout rather than a generic multi-column SaaS block:
  left brand/signature, centered compact link rows, and a restrained right-side utility icon cluster inside the locked dark palette.
- Multilingual support should feel native to the product chrome:
  use a compact top-bar locale switcher, persist the selected language, and translate the landing-page interface and product messaging instead of relying on browser auto-translation.
- The dark base now carries a brighter accent layer across the homepage:
  use mint green, soft gold, light earth-brown, and restrained rose highlights in glows, capsules, comparison states, and major panels while keeping the core background dark and premium.
- Brighter colors should read as editorial illumination, not a palette swap:
  the site should still avoid rainbow UI, loud gradients, or candy-colored cards.
- The brighter palette must extend into world visuals and illustrated backdrops too:
  hero artwork, sticky scene stages, system mosaics, and studio shells should all carry the warmer mint, gold, earth, and rose atmosphere instead of falling back to cold flat navy backgrounds.

## Responsive Rules Implemented

- Main layout changes at roughly `1100px`, `860px`, and `640px`.
- At tablet and mobile widths, hero, showcase, writing layout, CTA, modules, ownership, and differentiation sections collapse into cleaner single-column or two-column reading order.
- Buttons stack to full width on small screens to keep the page premium rather than cramped.

## Dev Entry Rule

- `dev.html` includes a non-blank loading shell and redirects to `index.html` when opened directly via `file://`.

## Latest Verification

- `npm.cmd run build` passed after adding the homepage-to-studio route, manuscript workspace, local autosave, and republished static output to `loreline/index.html` and `loreline/assets/`
