# Design System: The Alchemist’s Ledger

## 1. Overview & Creative North Star
### Creative North Star: "The Curated Archive"
This design system rejects the sterile, flat world of modern SaaS in favor of the "Curated Archive." The experience should feel like stepping into a dimly lit mahogany library, where every interaction is an act of discovery. We are not building "web pages"; we are crafting digital folios.

To break the "template" look, we employ **Intentional Asymmetry**. Layouts should mimic a desk covered in artifacts—overlapping containers, varied margins, and elements that break the grid. We use high-contrast typography scales (the massive, weathered serif vs. the tiny, precise mono-space) to create a sense of historical importance and technical precision.

---

## 2. Colors
Our palette is rooted in natural materials: wood, paper, gold, and ink.

*   **Primary (`#e9c176` / Tarnished Gold):** Use for focal points and active states. It represents the glimmer of a brass knob in a dark room.
*   **Secondary (`#f2baa6` / Aged Copper):** Used for supporting actions and subtle highlights.
*   **Surface Hierarchy:** We utilize `surface-container` tiers to create "nested" depth.
    *   `surface` (`#131313`): The deep, mahogany void of the shop.
    *   `surface-container-lowest`: Deepest recesses, used for background grouping.
    *   `surface-container-highest`: The top-most "paper" or "artifact" layer.

**The "No-Line" Rule:** 
Under no circumstances shall a 1px solid border be used to separate sections. Boundaries must be defined by shifts in background tone. For example, a `surface-container-low` content block should sit directly on a `surface` background. The change in depth is the divider.

**The "Glass & Gradient" Rule:**
To simulate the soft glow of candlelight, use radial gradients transitioning from `primary` to `primary-container` at 10% opacity for hero sections. For floating overlays, use **Glassmorphism**: a semi-transparent `surface-variant` with a heavy `backdrop-filter: blur(12px)` to simulate antique, clouded glass.

---

## 3. Typography
The type system is a dialogue between the poetic and the technical.

*   **Display & Headlines (Newsreader):** Elegant, slightly weathered serifs. Use `display-lg` (3.5rem) for high-impact editorial moments. These should feel like titles found on the spine of a leather-bound book.
*   **Body (Noto Serif):** Classical and highly legible. This is the "narrative" voice of the system.
*   **Labels & Technical Data (Space Grotesk):** A clean, mono-spaced font used for "ledger" data, SKU numbers, and technical specs. It provides an "analog-industrial" contrast to the organic serifs.

---

## 4. Elevation & Depth
In this system, depth is tactile, not digital.

*   **Tonal Layering:** Stack surfaces to create lift. Place a `surface-container-highest` card on a `surface-container-low` area to suggest a heavy card sitting on a wooden table.
*   **Ambient Shadows:** We avoid "drop shadows." Instead, use extra-diffused ambient light.
    *   *Shadow Spec:* `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow must feel like the absence of light beneath a physical object.
*   **The Ghost Border Fallback:** If a boundary is strictly required for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Tactile Illumination:** Replace hover "glows" with a soft `surface-bright` inner shadow or a subtle `primary` tint, mimicking a lamp being moved closer to the object.

---

## 5. Components

### Buttons (The Wax Seal & Brass Knob)
*   **Primary:** Solid `primary` (`#e9c176`) background with `on-primary` text. Use `rounded-sm` (0.125rem) to maintain a hand-cut feel.
*   **Secondary:** No background. Use a `title-sm` Newsreader font with a "Ghost Border" that becomes 40% opaque on hover.
*   **Tactile State:** On press, apply a subtle `inset` shadow to simulate the physical "click" of a brass switch.

### Cards (Heavy Paper)
Forbid the use of dividers. Use `surface-container-high` for the card body. Use `label-md` (Space Grotesk) for metadata at the top, and `headline-sm` for the title. Overlap an image or icon across the edge of the card to break the rigid container.

### Input Fields (The Ledger)
Text inputs should not be boxes. Use a simple bottom-border of `outline-variant` (20% opacity) and `spaceGrotesk` for the input text. The label should float above in `notoSerif`, resembling a clerk’s handwritten note.

### Custom Component: The Wax Seal
A decorative "Status" indicator. Instead of a pill-shaped chip, use a circular `secondary-container` shape with an embossed `on-secondary-container` icon, placed slightly off-center to mimic a hand-pressed seal.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Negative Space:** Let the `surface` color breathe; it creates the "dimly lit" atmosphere.
*   **Layer Intentionally:** Think of the UI as a desk. Some things overlap; some things are tucked away.
*   **Use Mono-space for Numbers:** Use `spaceGrotesk` for all prices, dates, and quantities to maintain the "Antique Broker" ledger feel.

### Don’t:
*   **Don't use vibrant neons:** No #00FF00. Use `tertiary` (`#becabd`) for "success" and `error` (`#ffb4ab`) for "alerts."
*   **Don't use `rounded-full`:** Except for the "Wax Seal" component, keep corners sharp (`none`) or slightly softened (`sm`). Circles feel too "modern-tech."
*   **Don't use Dividers:** Never use a horizontal rule `<hr>`. Use a `24px` or `48px` vertical gap from the spacing scale to separate ideas.