# Aura

**Luxury facial analytics & looksmaxxing platform for iOS.**

Aura combines computer vision, facial-landmark detection, and aesthetic scoring into a
premium, clinical-grade biometric assessment experience — *Apple Health meets Tesla,
WHOOP meets Clear.*

> This repository contains a production-grade SwiftUI reference implementation (Swift 6),
> a full Product Requirements Document, the engineering architecture, and a complete
> design system. It is structured so a senior iOS team can begin implementation immediately.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Engineering architecture, diagrams, data flow |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colors, typography, spacing, motion, corner rule |
| [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md) | IA, navigation map, user flows |
| [docs/AI_ROADMAP.md](docs/AI_ROADMAP.md) | Future CV / ML integration strategy |

## Source layout

```
Aura/
├── App/                     App entry point + composition root
├── DesignSystem/            Tokens: colors, typography, spacing, motion
├── Models/                  Codable + Sendable domain models
├── Services/                Protocol-based analysis service layer
├── ViewModels/              MVVM view models (@MainActor, ObservableObject)
├── Components/              Reusable UI: cards, progress, hero, metric, bento
├── Views/                   Screens: Dashboard, Camera selection
└── Preview/                 Mock data + preview fixtures
```

## Requirements

- iOS 17.0+ (targets iPhone 14 / 15 / 16 families)
- Xcode 16+
- Swift 6 language mode (strict concurrency)

## Quick start

1. Create a new iOS App target in Xcode (SwiftUI lifecycle, Swift 6).
2. Drag the `Aura/` source folders into the target.
3. Set `AuraApp` as the `@main` entry point.
4. Build & run. The app ships with `MockAnalysisService` so it runs with zero backend.

Swap `MockAnalysisService` for `FutureRemoteAnalysisService` in `AuraApp.swift` to point
at a real backend — no UI code changes required.
