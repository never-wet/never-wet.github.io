# Design System Strategy: The Digital Alchemist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Alchemist."** 

This system rejects the safety of modern "soft" UI. Instead, it embraces the tension between the cold, hyper-technical precision of a retro-future terminal and the ornate, heavy atmosphere of a hidden reliquary. We move beyond the "template" look by utilizing a 0px border-radius across the entire system, creating a sharp, unapologetic silhouette. 

The experience is defined by **Intentional Asymmetry**. Rather than a balanced grid, we use "weighted" layouts where heavy gold ornamental accents are countered by ethereal neon glows. This creates an editorial flow that feels less like a mobile app and more like a high-end, interactive manuscript from a dystopian future.

## 2. Colors & Tonal Depth
The palette is built on a foundation of **Deep Obsidian (#131314)**, serving as a void that allows our neon and gold tokens to "vibrate."

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
*   **Tonal Shifts:** Placing a `surface-container-low` component against a `surface` background.
*   **Light Leaks:** Using the `secondary` (electric cyan) or `primary` (neon violet) tokens as a subtle 2px top-edge glow to define the start of a new module.

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of rare materials. 
*   **Base Layer:** `surface` (#131314) - The deep void.
*   **Primary Containers:** `surface-container` (#201f20) - Used for main content areas.
*   **Interactive Cards:** `surface-container-highest` (#353436) - Used for items the merchant can interact with, creating a "lifted" feel through brightness rather than shadows.

### The Glass & Gradient Rule
To prevent the dark UI from feeling flat, utilize the **"Neon Bleed"**:
*   Apply a `backdrop-blur` (12px-20px) to floating overlays using a semi-transparent version of `surface-container-lowest`.
*   **Signature Texture:** Main CTAs should use a linear gradient from `primary` (#d0bcff) to `primary-container` (#a078ff) at a 45-degree angle, mimicking the flicker of a high-end plasma display.

## 3. Typography
The typography strategy creates a dialogue between the technical and the functional.

*   **Display & Headlines (Space Grotesk):** This is our "Cyber" voice. It is blocky, wide, and aggressive. Use `display-lg` for shop names and `headline-md` for item categories. The sharp apertures of Space Grotesk mirror the 0px roundedness of the UI.
*   **Body & Titles (Manrope):** This is our "Merchant" voice. It provides the clarity needed for complex trade logs and item descriptions. Manrope’s geometric but humanist touch ensures that long-form lore remains readable against high-contrast backgrounds.
*   **Label Styling:** Always use `label-md` in Space Grotesk, all-caps, with a 0.05em letter spacing to evoke the feeling of a vintage arcade motherboard's serial numbers.

## 4. Elevation & Depth
In this design system, depth is a product of light and layering, not physical shadows.

*   **Tonal Layering:** To create a nested inventory, place a `surface-container-lowest` (#0e0e0f) slot inside a `surface-container-high` (#2a2a2b) panel. This "inset" look suggests the item is physically protected within a merchant's chest.
*   **Ambient Glows:** Replace traditional drop shadows with "Neon Halos." When an object is active, apply a diffused outer glow (20px-40px blur) using the `primary` token at 15% opacity.
*   **The Ghost Border Fallback:** If a container requires a boundary (e.g., in high-density data tables), use the `outline-variant` (#494454) at 20% opacity. It should feel like a faint "etching" on glass rather than a stroke.
*   **The Golden Filigree:** For the most "Antique" elements, use a `tertiary` (#e9c349) 2px border, but only on two corners (e.g., top-left and bottom-right) to maintain the signature asymmetry.

## 5. Components

### Buttons
*   **Primary:** Sharp 0px edges. Background: `tertiary` (Aged Gold). Text: `on-tertiary`. On hover, the button should gain a `secondary` (Cyan) "glitch" shadow offset by 2px.
*   **Secondary:** No background. 1px `ghost border`. Text: `secondary`.
*   **Tertiary:** All-caps `label-md` text with a 1px `secondary` underline that animates from center-out on hover.

### The "Relic" Card
For merchant items, cards must not use dividers. 
*   **Structure:** Use `surface-container-low`. The header area is defined by a subtle `primary-container` gradient wash (5% opacity).
*   **Accents:** A single "Occult Symbol" icon in the corner using the `tertiary` color to denote rarity.

### Input Fields
*   **State:** Default state is a `surface-container-highest` block.
*   **Focus State:** The bottom edge transforms into a 2px `secondary` (Cyan) neon line. The label shifts to `primary` (Violet).
*   **Error:** Instead of a simple red box, use `error` (#ffb4ab) text and a subtle "scan-line" pattern overlay across the input background.

### Merchant-Specific Components
*   **The Ledger List:** Avoid dividers. Use alternating background tiers: `surface-container-low` and `surface-container-lowest`. 
*   **Price Tags:** Use `label-md` Space Grotesk. The currency symbol (Gold) should always be 200% the weight of the numerical value to emphasize profit.

## 6. Do's and Don'ts

### Do
*   **Do** use 0px border-radius for everything. Sharpness is the core identity.
*   **Do** mix "pixel" icons with "ornate gold" frames to lean into the Cyber-Antique aesthetic.
*   **Do** use wide margins (vertical white space) to separate content sections instead of lines.
*   **Do** use `tertiary` (Aged Gold) sparingly as a "Legendary" highlight.

### Don't
*   **Don't** use standard grey shadows. If it doesn't glow, it doesn't have depth.
*   **Don't** use rounded corners, even for checkboxes or radio buttons. Everything is a square or a rectangle.
*   **Don't** use 100% opaque white for body text. Use `on-surface-variant` (#cbc3d7) to keep the "low-light" atmosphere of a merchant's shop.
*   **Don't** center-align everything. Use intentional left-heavy layouts to mimic modern editorial design.