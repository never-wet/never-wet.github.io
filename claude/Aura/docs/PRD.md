# Aura — Product Requirements Document

**Version:** 1.0
**Status:** Implementation-ready
**Owner:** Product / iOS
**Last updated:** 2026-06-10

---

## 1. Overview

**Aura** is a luxury facial analytics and looksmaxxing platform. It applies computer
vision, facial-landmark detection, and geometric aesthetic scoring to deliver a premium,
clinical-grade biometric assessment of the user's face.

The product should read as a **professional facial diagnostic report**, not a social app.
Every interaction should communicate precision, intelligence, scientific credibility,
exclusivity, and premium craftsmanship.

### Positioning

> Apple Health meets Tesla · WHOOP meets Clear · Luxury medical imaging meets elite
> aesthetics analysis.

### Anti-goals

Aura must **never** feel gamified, cartoonish, social-media-like, cheap, or trendy.

---

## 2. Goals & success metrics

| Goal | Metric | Target |
|------|--------|--------|
| Premium perception | App Store rating | ≥ 4.7 |
| Engagement | Repeat analyses / user / month | ≥ 3 |
| Trust | Confidence score shown on every report | 100% of analyses |
| Performance | Dashboard scroll | 60 fps on iPhone 14+ |
| Conversion | Free → premium report upgrade | ≥ 8% |

---

## 3. Target users

- **Aesthetic optimizers ("looksmaxxers")** — track and improve facial structure.
- **Clients of cosmetic / dermatology practices** — pre/post objective assessment.
- **Quantified-self enthusiasts** — biometric progression tracking.

---

## 4. Core analysis system

Aura analyzes facial structure using facial landmarks and geometric relationships.
The scoring engine is **modular and API-driven** — no scores are hardcoded into views.

Supported / planned vision backends:

- Apple Vision Framework
- MediaPipe Face Mesh
- OpenCV landmark analysis
- Custom landmark-detection APIs / ML models

All scoring flows through `AnalysisServiceProtocol`, which can be backed by a mock,
on-device CV, or a remote backend without UI changes.

---

## 5. PSL scoring framework

Aura scores faces on a continuous **1.0–10.0** scale, mapped to named tiers. The mapping
is data-driven (`PSLTier`) and supports **future recalibration** without UI changes.

### Below average

| Band | Range | Meaning |
|------|-------|---------|
| Sub-3 | 1.0–2.9 | Severe structural deficiencies, major asymmetry, recessed features |
| Sub-5 | 3.0–4.9 | Below average, minor structural weaknesses |

### Normie spectrum

| Tier | Range | Name |
|------|-------|------|
| LTN | 5.0–5.2 | Low Tier Normie |
| MTN | 5.3–5.5 | Mid Tier Normie |
| HTN | 5.6–5.9 | High Tier Normie |

### Elite spectrum

| Tier | Range | Name |
|------|-------|------|
| Chad | 6.0–6.9 | Strong masculine structure |
| True Adam | 7.0–10.0 | Near-ideal facial proportions |

> Tier boundaries live in a single source of truth (`PSLTier.tier(for:)`) so the entire
> framework can be recalibrated by editing one table.

---

## 6. Information architecture

```
Launch
 └─ Dashboard (flagship)
     ├─ Hero Card  ........ Overall PSL score · tier · confidence · AI summary
     ├─ Bento Grid
     │    ├─ Eye Area Harmony   (double-height)
     │    ├─ Jawline Angle      (square)
     │    ├─ Dimorphism Index   (square)
     │    ├─ Facial Symmetry    (square)
     │    └─ Dermal Quality     (square)
     └─ Floating Reset (top-right, always visible)
          └─ Fallback Camera Selection (sheet)
               ├─ Take Photo
               └─ Upload Photo
```

See [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) for full flows.

---

## 7. Feature requirements

### 7.1 Dashboard (flagship)

The dashboard is the flagship screen and must feel like opening a professional facial
diagnostic report. Built on a **Bento Grid** architecture.

**Top navigation layer**
- Floating **Reset** button, top-right, visible at all times.
- On tap: clears analysis, clears cached image, resets state, opens camera selection flow.

**Hero card (full width)** — displays:
- Overall PSL score (e.g. `5.8 / 10`)
- Assigned tier (e.g. `HTN`)
- Confidence score (e.g. `92%`)
- Short AI-generated assessment summary

**Bento grid cards**

| Card | Size | Displays |
|------|------|----------|
| Eye Area Harmony | Double height | Canthal tilt, sclera exposure, eye spacing, orbital support · score · progress · explanation · improvement trajectory |
| Jawline Angle | Square | Gonial angle (e.g. `121°`), structural classification, linear progress |
| Dimorphism Index | Square | Masculinity indicators, hormonal marker estimation, progress gauge |
| Facial Symmetry | Square | Bilateral consistency, facial-thirds balance, midline alignment |
| Dermal Quality | Square | Texture score, acne indicators, skin clarity |

### 7.2 Camera flow

`FallbackCameraSelectionView` presented as a **sheet** with two options:
1. Take Photo
2. Upload Photo

Architecture must support `UIImagePickerController`, `PhotosPicker`, Vision Framework,
and future live-camera scanning.

### 7.3 States

Every analysis surface must handle: **idle**, **loading**, **loaded**, **error**, with
graceful transitions and retry.

---

## 8. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | 60 fps scrolling; minimal hierarchy depth; lazy loading; efficient state updates |
| Devices | iPhone 14+, 15+, 16+ |
| Accessibility | Dynamic Type, VoiceOver, Reduced Motion, High Contrast; every metric card exposes accessibility labels |
| Privacy | Images processed with explicit consent; on-device first; remote uploads opt-in & encrypted |
| Concurrency | Swift 6 strict concurrency; `Sendable` models; `@MainActor` view models |

---

## 9. Future roadmap

- OpenCV landmark analysis · MediaPipe Face Mesh · Vision Framework · custom ML models
- GPT-powered recommendations
- Facial progression tracking + historical score trends
- Subscription-gated premium reports

See [AI_ROADMAP.md](AI_ROADMAP.md).

---

## 10. Out of scope (v1)

- Social sharing / feeds
- Real-time AR overlays
- Android / web clients
