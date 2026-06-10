# Aura — Information Architecture & User Flows

---

## 1. Navigation map

```
App
└── Dashboard (root, flagship)
    ├── Floating Reset Button ──► Camera Selection (modal sheet)
    │                              ├── Take Photo  ──► UIImagePickerController (.camera)
    │                              └── Upload Photo ──► PhotosPicker
    ├── Hero Score Card
    └── Bento Grid
        ├── Eye Area Harmony (detail-capable)
        ├── Jawline Angle
        ├── Dimorphism Index
        ├── Facial Symmetry
        └── Dermal Quality
```

v1 is intentionally single-screen. Metric detail screens, history, and premium reports are
additive (see roadmap) and slot in without restructuring navigation.

---

## 2. Primary flow — first analysis

```
1. Launch ──────────────► Dashboard renders in `idle` (empty / prompt state)
2. Tap Reset (or empty-state CTA) ──► Camera Selection sheet
3. Choose "Take Photo" or "Upload Photo"
4. Capture / select image ──► sheet dismisses
5. VM transitions idle → loading (skeleton shimmer on cards)
6. Service returns AnalysisResult ──► loading → loaded
7. Hero + bento cards spring in; scores animate from 0 → value
```

## 3. Re-analysis / reset flow

```
1. Tap floating Reset (always visible, top-right)
2. VM.reset(): cancel in-flight task · clear AnalysisResult · clear cached image · state → idle
3. Camera Selection sheet auto-presents
4. New capture ──► new analysis (as above)
```

## 4. Error flow

```
analyze() fails
 └─ state → error(message)
     ├─ Inline error surface on dashboard (clinical, non-alarming copy)
     └─ "Retry" re-runs analyze() with the same cached image
        "New Photo" opens Camera Selection
```

## 5. Empty / idle state

When no analysis exists, the dashboard shows a restrained prompt ("Begin assessment") with
the same Bento silhouette rendered as inert placeholders — reinforcing the report metaphor
before data exists.

---

## 6. Content model per card

| Card | Headline value | Secondary | Progress | Insight |
|------|----------------|-----------|----------|---------|
| Hero | PSL score `/10` | Tier + confidence % | — | AI summary |
| Eye Area Harmony | Score | Canthal tilt · sclera · spacing · orbital | linear | explanation + trajectory |
| Jawline Angle | `121°` | Structural classification | linear | — |
| Dimorphism Index | Score | Masculinity / hormonal markers | linear (gauge) | — |
| Facial Symmetry | Score | Bilateral · thirds · midline | linear | — |
| Dermal Quality | Score | Texture · acne · clarity | linear | — |

All card content is supplied by `AnalysisResult.metrics` — the UI never hardcodes values.
