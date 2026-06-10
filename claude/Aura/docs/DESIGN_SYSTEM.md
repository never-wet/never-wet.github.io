# Aura — Design System

**Theme:** Luxury Clinical Dark Mode.
Everything should feel *engineered* — precise, restrained, premium.

---

## 1. Color tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#09090A` | App canvas |
| Surface | `#16161A` | Cards |
| Secondary Surface | `#09090B` | Nested / inset surfaces |
| Border | `#24242B` | Hairline strokes on every card |
| Accent Purple | `#8B5CF6` | Primary accent, scores, key progress |
| Accent Blue | `#60A5FA` | Secondary accent, supporting data |
| Accent White | `#FFFFFF` | Primary text |

Text hierarchy uses white at descending opacity: 100% (primary), 70% (secondary),
45% (tertiary / labels).

Defined in code: [`AuraColor.swift`](../Aura/DesignSystem/AuraColor.swift).

---

## 2. The corner rule

> **Every UI element uses `cornerRadius(5)`.**

- No pills. No capsules. No large rounded cards. No circular progress bars.
- Progress is always a **linear** indicator.
- The radius token is `AuraSpacing.corner = 5`. Use it everywhere — never a literal.

---

## 3. Typography

Typeface: **SF Pro** (system). Express hierarchy through **weight and spacing**, not
oversized text.

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Hero Score | 56 | Semibold | -1.0 |
| Section Title | 17 | Semibold | 0 |
| Card Title | 13 | Medium | 0.3 |
| Metric Value | 28 | Semibold | -0.5 |
| Metric Label | 11 | Medium | 0.6 (uppercased) |
| Body / Insight | 14 | Regular | 0 |
| Caption | 11 | Regular | 0.2 |

Defined in code: [`AuraTypography.swift`](../Aura/DesignSystem/AuraTypography.swift).

---

## 4. Spacing & layout

8-pt soft grid. Tokens in [`AuraSpacing.swift`](../Aura/DesignSystem/AuraSpacing.swift):

| Token | Value |
|-------|-------|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `xxl` | 32 |
| `corner` | 5 |
| `hairline` | 1 |

**Bento grid:** two equal columns, `md` gutter. Hero card spans full width. The Eye Area
Harmony card spans two rows (double height); the remaining four metric cards are square.

---

## 5. Motion

Luxury micro-interactions only. Duration **0.2–0.4s**. Spring, never bouncy.

| Interaction | Spec |
|-------------|------|
| Content appear | `.spring(response: 0.35, dampingFraction: 0.85)` |
| Press / scale | scale to 0.98, `response: 0.25` |
| Opacity transition | `.easeInOut(duration: 0.25)` |
| Progress fill | `.spring(response: 0.4, dampingFraction: 0.9)` |

Avoid flashy effects, bouncing, exaggerated movement. **Honor Reduced Motion** — fall back
to opacity-only transitions. Tokens in [`AuraMotion.swift`](../Aura/DesignSystem/AuraMotion.swift).

---

## 6. Components

| Component | Role |
|-----------|------|
| `AuraCard` | Base surface: `Surface` fill, `Border` hairline stroke, `cornerRadius(5)` |
| `LinearProgressIndicator` | The only progress primitive (linear, accent fill) |
| `HeroScoreCard` | Full-width hero: score · tier · confidence · summary |
| `MetricCard` | Generic bento cell driven by a `MetricItem` |
| `BentoGridLayout` | Composes hero + bento grid |

---

## 7. Accessibility

- **Dynamic Type:** all text scales; layout reflows, no truncation of values.
- **VoiceOver:** every card exposes a combined accessibility label (title + value + tier).
- **Reduced Motion:** spring → opacity fallback.
- **High Contrast:** borders thicken; text opacity floors raised.
- Minimum tap target 44×44 (Reset button included).
