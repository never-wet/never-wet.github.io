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

- Background: `#161714`
- Surface: `#26231D`
- Surface strong: `#343028`
- Primary text: `#F7F1E6`
- Secondary text: `#DDD1BF`
- Accent 1 / CTA mint: `#88DDB5`
- Accent 2 / sunlit gold: `#DCC184`
- Earth accent: `#9EA47A`
- Rose accent: `#C99B8C`
- Divider / subtle border: `#6D6757`

Rules:

- Keep the experience dark, cinematic, and premium, but tuned to the hero painting:
  mossy greens, aged stone, parchment cream, and warm sunlight instead of plum-heavy surfaces.
- `Accent 1` remains the main interactive and emphasis color, preserving the `Open studio` mint CTA feel.
- `Accent 2` is the sunlit gold note used for highlights and atmosphere.
- The earth accent supports the forested castle mood across surfaces and image treatments.
- No random extra colors.
- Gradients must stay subtle and grounded in this painterly castle palette.

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
  hero, editorial signal cloud, product overview, interconnected workspace, worldbuilding modules, writing experience, ownership/privacy/focus, why it is different, final CTA
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
- The studio UX should now be organized around three clear layers:
  a light utility top bar, a quieter outline rail, and one primary editor column, with the story guide remaining secondary and optional.
- The studio should avoid repeating the same information in multiple bars:
  scene title, stats, saved state, and context shortcuts should each appear once in the clearest place instead of being duplicated across the top bar, editor chrome, and footer.
- Scene navigation should read like an outline, not a wall of equal-weight cards:
  keep chapter, title, POV, location, and progress visible, but make the current scene easier to scan immediately.
- The editor column should include one concise inline reminder for the current scene pressure or continuity note:
  help the writer stay oriented without forcing them to keep the right guide open.
- Panel open/close behavior in the studio should animate as expansion/collapse rather than instant appearance.
- The project rail, story guide, and tab-panel content use smoother panel transitions around `420ms` with soft opacity and position changes.
- Switching between scenes in the studio should animate the main manuscript surface in, so the writing room feels continuous rather than abruptly replaced.
- The homepage should use restrained scroll-reveal animation for sections after the hero, while refresh/load behavior should lift the visible page elements into place from below.
- Homepage reveal motion should feel editorial and premium:
  content rises in with soft opacity and blur easing, not flashy parallax or loud gimmicks.
- Scroll-triggered reveal animations should now feel fast and self-completing:
  once a reveal begins, it should finish automatically even if the user stops scrolling, and reversible reveals should not snap back out before their entrance motion completes.
- On homepage refresh/load, the top bar and hero should animate upward into place in a staggered way so the page feels composed as it arrives.
- Root page scrolling is currently fully native:
  do not intercept, remap, or smooth wheel input until a later dedicated pass revisits scroll behavior.
- Homepage scrollbars are visually hidden, matching the calmer studio presentation, while page scrolling itself remains fully functional.
- Studio scrollbars are visually hidden to keep the writing environment cleaner, but scrolling behavior remains intact.
- Reading time in the studio uses a simple fiction-reading estimate around `200 words per minute` and is shown as an `X min read` label.
- The hero uses a two-column layout with an immersive product vignette showing linked story layers.
- The hero now uses a served local public asset as the first-section background:
  use `loreline/public/hero-intro.jpg` sourced from `never-wet.github.io/img/s-l400.jpg`, so the intro image works reliably in both localhost dev and the published static page.
- The hero background should be rendered through a dedicated DOM background layer, not only a pseudo-element image:
  this keeps the intro artwork reliable in localhost dev and avoids silent background failures while overlays remain separate.
- The hero background image should stay visibly present on the first screen:
  keep overlays light enough that the intro still clearly reads as image-led atmosphere rather than a mostly flat tinted panel.
- The intro image should extend behind the sticky header:
  the top bar can overlay the hero, but it should not create a separate empty band above the image.
- The hero-to-overview seam should feel blurred and atmospheric rather than cut off:
  hide the second section completely when the page is scrolled to the very top, then let the overview fade in through a softened overlap with the intro background.
- The right-side hero preview artwork should use the in-house knight/prince SVG rather than repeating the photo background:
  keep the real image as the section backdrop, and let the preview window carry the playful illustrated contrast.
- The hero preview copy should stay minimal:
  avoid faux dashboard text there and use one short project explanation so the artwork remains the focus.
- The intro should no longer force a full-viewport height:
  keep the first screen shorter and more content-driven so the background image can show with less aggressive crop and less zoomed-in pixel stretch.
- The hero should prioritize clarity over stacked marketing blocks:
  use a tighter subheadline, a compact audience strip, and a cleaner preview instead of multiple chunky signal cards or extra floating notes.
- The hero should now stay even leaner:
  avoid a long explanatory paragraph under the main headline and let the image, headline, CTA, and compact audience strip do the work.
- The top navigation should avoid duplicated actions:
  keep the primary CTA visible, but do not repeat overview/navigation behavior in separate buttons when the nav already handles it.
- The first screen should avoid a generic straight navbar:
  use distinct floating header clusters for brand, navigation, and entry actions so the page feels composed and bespoke instead of like a standard SaaS strip.
- The main landing header should center the Loreline logo:
  keep the brand lockup in the middle, with navigation on one side and language / studio entry on the other, so the intro feels ceremonial rather than left-weighted.
- The `Open studio` CTA should live in its own panel:
  keep it visually separate from the language selector rather than nesting both controls inside the same box.
- The right-side header controls should not sit inside a visible wrapper panel:
  let the locale pills and `Open studio` read as standalone translucent glass controls with the surrounding panel effectively invisible.
- The top navigation and centered brand should also avoid visible background capsules:
  keep the header line light and floating, with the glass treatment reserved for the actual interactive controls rather than large brown wrapper shapes.
- The hero should use an asymmetric lower band beneath the headline:
  keep the CTA group and the audience/worldbuilder cues in separate but coordinated panels so the intro feels editorial rather than like one long basic stack.
- Remove custom drawn knight/prince artwork from the first screen:
  the hero should present the provided image-based atmosphere instead of an in-house SVG illustration.
- The old knight/prince SVG should remain in the site inside the right-side hero preview panel:
  use it as a playful illustrated product vignette, but do not let it replace the full hero background image.
- Loreline now has a dedicated brand emblem:
  a warm heraldic badge with a sunlit story thread rising from an open book, used alongside the project name in the landing header, footer, studio header, and project favicon.
- Brand usage should stay consistent:
  pair the emblem with the `Loreline` wordmark in major identity positions rather than using bare text or unrelated placeholder dots.
- The hero copy is worldbuilding-first and explicitly aimed at universe builders rather than generic writers.
- The product-overview section is now an editorial split composition:
  strong positioning copy on the left, a light connected-world constellation on the right, and a slim three-line supporting thread list beneath the copy.
- The overview should still feel like positioning copy, not a feature-card demo:
  avoid boxed dashboards there, and use atmosphere, threads, and connected visual language instead of heavy UI panels.
- The workspace showcase uses four tabs:
  `Story Nexus`, `World Atlas`, `Chronicle Engine`, `Writing Room`
- The showcase keeps secondary depth hidden until the user opens it.
- The main workspace showcase should no longer hide the actual workspace behind a reveal gate:
  show the real workspace state immediately, and keep only the linked-detail drawer as the optional progressive-disclosure step.
- Switching between workspace showcase tabs should feel staged rather than instant:
  the current panel eases out first, then the next workspace rises in with subtle stagger across the internal rail, editor, metrics, and support surfaces.
- On wide desktop, the showcase controls cluster with the tabs and actions should travel within the same vertical span as the workspace panel:
  it starts top-aligned under the intro copy, moves downward with scroll, stops when its bottom reaches the workspace panel bottom, and clamps back to the top on reverse scroll.
- The showcase tabs/actions box now uses a shared pinned track with the right workspace panel:
  the workspace panel stays pinned, the left controls box gets guaranteed travel room, and the motion must read clearly in both scroll directions instead of collapsing to near-zero movement.
- The showcase controls must clamp against the real workspace panel height:
  never create travel room by stretching the workspace panel with empty interior space.
- The modules area now expands into a second "creative support systems" mosaic:
  characters, codex space, plot weaving, atmosphere, and custom time should still read as serious product systems inside the Loreline ecosystem.
- The upper module grid should stay curated and high-signal:
  show only the core worldbuilding pillars there, and let the broader support section carry the wider product breadth below it.
- The core modules section should now behave like a scroll chapter on desktop:
  the overview text stays pinned on the left around mid-screen while one module card at a time occupies the right stage, with the current card sliding upward and the next card rising from below as the user scrolls.
- The modules transition should feel smooth and cinematic rather than abrupt:
  treat the right column as one changing viewport, not a static grid of equal cards.
- The modules stage should avoid an outer fake-app window:
  show the transitioning cards, labels, and sequence markers directly, without wrapping them in a bordered shell or heavy frame.
- The modules cards should travel like a vertical sequence, not fade around the middle:
  each card should rise from below the visible stage and exit fully out the top as the next one takes its place.
- The modules stage should now advance discretely by card:
  as the user scrolls into each segment, switch to the next module box with one clean animated handoff instead of continuously scrubbing between in-between card states.
- The support systems section should no longer be a dense six-card grid:
  present it as one integrated panoramic "room around the manuscript" with a central writing-world visual and a few concise supporting notes instead of many repetitive boxes.
- The writing section uses a focused manuscript preview paired with a controlled context drawer to show world-aware drafting.
- The ownership section uses principle cards plus an editorial quote moment instead of fake testimonials.
- The ownership quote is now a public-domain inspirational passage rendered inside a pale manuscript-like panel:
  letters reveal one by one in ink-dark text as the user scrolls down, and they disappear again in reverse when scrolling back up.
- The quote reveal is continuous rather than binary:
  each glyph should begin blurred and hidden, sharpen as it becomes readable, and pass back through blur before disappearing on reverse scroll.
- The quote reveal should now track scroll directly:
  letters appear as the user scrolls down and disappear again as the user scrolls up, without extra inertial drift layered on top of the quote itself.
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
- The editorial signal cloud should now sit directly below the hero:
  it acts as the first brand-principles statement after the intro image, while the later "why different" section keeps the comparison framing and table without repeating the cloud.
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
- The broader visual atmosphere should now lean warm rather than blue-heavy:
  use cream, gold, earth, rose, and plum-charcoal across surfaces and image backdrops, while keeping the `Open studio` mint as the main green anchor for primary actions and key interactive emphasis.
- Global mouse-wheel smoothing should feel like native scroll with a polished settle:
  keep the wheel response immediate, avoid draggy slowdown during active input, and only add a light eased tail after the user stops so the page glides to rest instead of snapping.
- The scroll controller should use direct wheel movement plus a simple momentum decay:
  apply wheel input immediately, then let the leftover velocity count down toward zero in small steps instead of running a laggy target-follow animation.

## Responsive Rules Implemented

- Main layout changes at roughly `1100px`, `860px`, and `640px`.
- At tablet and mobile widths, hero, showcase, writing layout, CTA, modules, ownership, and differentiation sections collapse into cleaner single-column or two-column reading order.
- Buttons stack to full width on small screens to keep the page premium rather than cramped.

## Dev Entry Rule

- `dev.html` includes a non-blank loading shell and redirects to `index.html` when opened directly via `file://`.

## Latest Verification

- `npm.cmd run build` passed after adding the homepage-to-studio route, manuscript workspace, local autosave, and republished static output to `loreline/index.html` and `loreline/assets/`
