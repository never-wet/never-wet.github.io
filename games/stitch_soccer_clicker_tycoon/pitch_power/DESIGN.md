```markdown
# Design System Strategy: The Stadium Kinetic

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Pitch"**
This design system moves away from the flat, static nature of traditional clicker games. Instead, it treats the interface as a living, breathing sports broadcast. We reject the "standard grid" in favor of **Kinetic Layering**. By using aggressive typography scales, overlapping card layouts, and light-emitting components, we create an environment that feels like a night match under stadium floodlights. 

The goal is high-velocity energy. We break the template look by using "Scoreboard Brutalism"—large, high-contrast display type paired with technical, functional secondary data. Elements should feel like they are floating above a deep, infinite pitch, utilizing tonal depth rather than rigid containment.

---

## 2. Colors: The Floodlight Palette
Our palette is rooted in the high-contrast environment of a nighttime stadium. 

### Core Palette
*   **Primary (`#91f78e`):** "Stadium Grass." Use for success states, active progress, and primary actions. It should feel electric, not organic.
*   **Secondary (`#f9e534`):** "Energy Yellow." Reserved for "Epic" upgrades, multipliers, and critical "Click" feedback.
*   **Tertiary (`#a2aaff`):** "Athletic Blue." Use this for technical UI, inactive states, and navigation to provide a cool counterbalance to the heat of the green and yellow.
*   **Neutral/Surface (`#0e0e0e`):** "The Midnight Pitch." Our canvas is deep black to make the vibrant tokens vibrate with energy.

### Rules of Engagement
*   **The "No-Line" Rule:** Never use 1px solid borders to separate sections. Distinguish the "Field" from the "Sidelines" using background shifts. A `surface-container-low` upgrade card sits directly on a `surface` background. The shift in tone is the boundary.
*   **Surface Hierarchy:** 
    *   **Level 0 (Background):** `surface` (`#0e0e0e`) for the main game area.
    *   **Level 1 (Sections):** `surface-container-low` (`#131313`) for sidebars or menus.
    *   **Level 2 (Cards):** `surface-container` (`#1a1a1a`) for individual player or stadium upgrades.
*   **The "Glass & Gradient" Rule:** Use the `primary-container` (`#52b555`) as a semi-transparent fill with a `backdrop-blur` (12px-20px) for HUD elements. Main action buttons must use a linear gradient from `primary` to `primary-dim` to simulate the curve of a soccer ball or the glow of a scoreboard.

---

## 3. Typography: Scoreboard Brutalism
Typography isn't just for reading; it’s a visual anchor. We use a tri-font system to balance sportiness with legibility.

*   **Display & Headlines (Space Grotesk):** This is our "Jersey" font. It is wide, technical, and aggressive. Use `display-lg` for the main "Score/Clicks" counter. It should feel authoritative.
*   **Titles & Body (Plus Jakarta Sans):** Our "Commentary" font. High legibility with a modern, geometric touch. Use `title-md` for upgrade names.
*   **Labels (Lexend):** Our "Technical" font. Used for micro-stats (e.g., "CPS: 1,200"). It feels engineered and precise.

**Design Note:** Use all-caps for `label-md` and `headline-sm` to lean into the collegiate sports aesthetic.

---

## 4. Elevation & Depth
In this system, depth is created by light emission, not just physical height.

*   **Tonal Layering:** Instead of shadows, use `surface-container-highest` (`#262626`) to "lift" an element. An active upgrade card should not have a shadow; it should have a subtle background shift.
*   **The Kinetic Glow:** For the main clicker or primary buttons, replace traditional shadows with a "Stadium Glow." Use the `primary` color at 15% opacity with a 30px blur. This makes the component look like it’s emitting light onto the pitch.
*   **The "Ghost Border" Fallback:** If a layout feels too muddy, use the `outline-variant` (`#484847`) at 15% opacity. This creates a "hairline" definition that is felt rather than seen.
*   **Glassmorphism:** Navigation bars and floating HUDs must use a `surface-variant` fill at 60% opacity with a heavy backdrop blur to keep the focus on the game action happening behind the UI.

---

## 5. Components

### The Kinetic Button (Primary)
*   **Base:** Gradient from `primary` to `primary-container`.
*   **Shape:** `md` (0.375rem) for a rugged, athletic feel.
*   **State:** On hover, increase the "Stadium Glow" (outer glow) and scale to 105%.
*   **Text:** `title-sm` in `on-primary` (`#005e17`), bold.

### Upgrade Cards
*   **Structure:** No borders. Use `surface-container-low`. 
*   **Asymmetry:** Use a `0.25rem` left-accent bar in `secondary` for "Featured" or "Affordable" upgrades to break the symmetry of the list.
*   **Content:** Avoid dividers. Use `1.5rem` of vertical padding between the Title and the Description to create a visual break.

### Progress Bars (The "Stamina" Bar)
*   **Track:** `surface-container-highest`.
*   **Fill:** `primary` with a 20% width "light sweep" gradient that moves across the bar to indicate active energy.
*   **Shape:** `full` (pill shape) for a modern, high-speed look.

### Selection Chips
*   **Unselected:** `surface-container-high` background with `on-surface-variant` text.
*   **Selected:** `tertiary` background with `on-tertiary` text. No border.

---

## 6. Do's and Don'ts

### Do:
*   **Do** lean into overlapping elements. Allow a player's card to slightly overlap the edge of a menu to create a sense of three-dimensional space.
*   **Do** use `secondary` (`#f9e534`) sparingly. It is a high-energy "alert" or "reward" color. Overusing it will fatigue the user.
*   **Do** use extreme type scales. If the score is the most important thing, make it `display-lg`. Don't be afraid of "wasting" space on a massive number.

### Don't:
*   **Don't** use 100% white text on a black background for long body copy. Use `on-surface-variant` (`#adaaaa`) to reduce eye strain.
*   **Don't** use standard 4px shadows. Our "shadows" are glows (using the brand colors) or tonal shifts.
*   **Don't** use dividers. If you feel the need for a line, try adding `16px` of extra whitespace or a subtle background color shift first.
*   **Don't** use soft, rounded corners (like `xl`). Stick to `md` (0.375rem) or `none` to maintain a sharp, aggressive, and "pro-league" aesthetic.