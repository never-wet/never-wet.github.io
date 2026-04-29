# Entity Diagnostic System Memory

## System Rules

- The experience is a state machine, not a page.
- State order is fixed: `BOOT`, `IDENTIFICATION`, `ANALYSIS`, `PROFILE`, `COMPARISON`, `OUTPUT`.
- Scroll drives progression through system state. The viewport remains fixed while modules update inside the interface.
- Clicks request state movement or identity changes; they do not navigate to pages.
- Hovering an identity enters preview mode and temporarily updates the readout data without replacing the locked entity.

## Motion Rules

- Nothing should appear instantly.
- Boot motion means system activation: grid sync, line drawing, readout initialization, wire core, then full render.
- Identity switching must pulse the 3D core and update color, metrics, rank, trust score, labels, and panels.
- Scroll motion must represent system progression. Avoid decorative bouncing, overshoot, or random animation.
- Reveals use fade, translate, and clipping. Scan movement is linear and purposeful.

## Color Logic

- Base palette is black, charcoal, white, and gray.
- Each entity owns one accent color plus one secondary highlight.
- Accent color is used only for identity, state confirmation, score emphasis, scan lines, and 3D core signal.
- Avoid mixing multiple unrelated colors in the same state.

## Identity System

Each entity requires:

- `name`
- `systemId`
- `classification`
- `rank`
- `trustScore`
- `valueScore`
- `volatility`
- `color`
- `secondaryColor`
- `core`
- `profile`
- `metrics`
- `comparison`

## Interaction Patterns

- `click -> setEntity(id)` locks a new identity and increments the transition pulse.
- `hover -> setPreviewEntity(id)` temporarily updates diagnostic readouts.
- `scroll -> setProgress(progress)` advances the state machine.
- state rail button click scrolls to the requested system band.

## Things To Avoid

- Marketing sections, friendly copy, large paragraphs, and conventional page storytelling.
- Rounded card-heavy UI.
- Random color accents or decorative gradients.
- Instant hard cuts between identities.
- Scroll that feels like normal document browsing.
