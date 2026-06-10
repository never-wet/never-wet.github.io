# Aura — Engineering Architecture

**Pattern:** MVVM + protocol-oriented service layer + dependency injection.
**Language:** Swift 6 (strict concurrency).
**UI:** SwiftUI, iOS 17+.

---

## 1. Layered overview

```
┌──────────────────────────────────────────────────────────────┐
│                          VIEWS (SwiftUI)                       │
│  DashboardView · FallbackCameraSelectionView                   │
│  — declarative, stateless beyond @State for local UI           │
└───────────────▲───────────────────────────────┬───────────────┘
                │ observes                       │ user intent
                │ (@Published)                   ▼
┌───────────────┴───────────────────────────────────────────────┐
│                       VIEW MODELS (@MainActor)                 │
│  DashboardViewModel : ObservableObject                         │
│  — view state, loading/error, refresh, reset, session          │
└───────────────▲───────────────────────────────┬───────────────┘
                │ returns models                 │ calls
                │                                ▼
┌───────────────┴───────────────────────────────────────────────┐
│                  SERVICES (protocol-oriented)                  │
│  AnalysisServiceProtocol                                       │
│   ├─ MockAnalysisService          (default, no backend)        │
│   └─ FutureRemoteAnalysisService  (URLSession / backend)       │
└───────────────▲───────────────────────────────┬───────────────┘
                │                                ▼
┌───────────────┴───────────────────────────────────────────────┐
│                     MODELS (Codable, Sendable)                 │
│  AnalysisResult · AnalysisSession · ScoreBreakdown             │
│  MetricItem · MetricCategory · FacialLandmarkData · PSLTier    │
└───────────────────────────────────────────────────────────────┘
```

Key rule: **dependencies point downward only.** Views know view models; view models know
service *protocols*; services know models. Models know nothing above them.

---

## 2. Dependency injection / composition root

`AuraApp` is the composition root. It instantiates the concrete service and injects it
into the view model. Swapping the backend is a one-line change.

```swift
// MockAnalysisService today …
let service: any AnalysisServiceProtocol = MockAnalysisService()
// … FutureRemoteAnalysisService tomorrow — no UI changes:
// let service = FutureRemoteAnalysisService(baseURL: ..., apiKey: ...)
DashboardView(viewModel: DashboardViewModel(service: service))
```

Because views depend only on `AnalysisServiceProtocol`, the implementation is fully
replaceable. Tests inject a stub conforming to the same protocol.

---

## 3. Data flow (analysis request)

```
User taps Reset ─► VM.reset() ─► clears state ─► presents camera sheet
                                                        │
User picks/takes photo ─► VM.analyze(image:) ──────────┘
        │
        ├─ state = .loading
        ├─ await service.analyze(request:)         (off main, async)
        │        └─ MockAnalysisService: simulated latency + deterministic mock
        │           FutureRemoteAnalysisService: multipart upload → JSON decode
        │
        ├─ success ─► state = .loaded(AnalysisResult)  ─► UI springs in
        └─ failure ─► state = .error(message)          ─► retry affordance
```

All service calls are `async throws`. The view model owns the `Task` lifecycle and cancels
in-flight work on reset.

---

## 4. State machine

`DashboardViewModel.ViewState`:

```
        ┌─────────┐  analyze()   ┌──────────┐  success  ┌──────────┐
        │  idle   │ ───────────► │ loading  │ ────────► │  loaded  │
        └─────────┘              └──────────┘           └────┬─────┘
             ▲                        │ failure              │ reset()
             │ reset()                ▼                      │
             │                   ┌──────────┐                │
             └───────────────────│  error   │◄───────────────┘
                                 └──────────┘
```

---

## 5. Concurrency model (Swift 6)

- **Models** are `Sendable` (value types / immutable) → free to cross actor boundaries.
- **Services** are `Sendable` actors or `final class … Sendable`; methods are `async`.
- **View models** are `@MainActor` → all `@Published` mutations happen on the main actor.
- No data races by construction; strict concurrency enabled.

---

## 6. Folder structure

```
Aura/
├── App/
│   └── AuraApp.swift
├── DesignSystem/
│   ├── AuraColor.swift
│   ├── AuraTypography.swift
│   ├── AuraSpacing.swift
│   └── AuraMotion.swift
├── Models/
│   ├── PSLTier.swift
│   ├── MetricCategory.swift
│   ├── MetricItem.swift
│   ├── ScoreBreakdown.swift
│   ├── FacialLandmarkData.swift
│   ├── AnalysisResult.swift
│   └── AnalysisSession.swift
├── Services/
│   ├── AnalysisServiceProtocol.swift
│   ├── MockAnalysisService.swift
│   └── FutureRemoteAnalysisService.swift
├── ViewModels/
│   └── DashboardViewModel.swift
├── Components/
│   ├── AuraCard.swift
│   ├── LinearProgressIndicator.swift
│   ├── HeroScoreCard.swift
│   ├── MetricCard.swift
│   └── BentoGridLayout.swift
├── Views/
│   ├── DashboardView.swift
│   └── FallbackCameraSelectionView.swift
└── Preview/
    └── MockData.swift
```

---

## 7. Testing strategy

| Layer | Approach |
|-------|----------|
| Models | Codable round-trip; `PSLTier.tier(for:)` boundary tests |
| Services | Protocol conformance; `MockAnalysisService` determinism |
| View models | Inject stub service; assert state transitions (idle→loading→loaded/error) |
| Views | SwiftUI previews per state; snapshot tests |

---

## 8. Extensibility hooks

- **New metric** → add a `MetricCategory` case + populate in service. UI renders generically.
- **New backend** → conform to `AnalysisServiceProtocol`. No UI changes.
- **Recalibration** → edit `PSLTier` table only.
- **Premium gating** → wrap `AnalysisResult` sections behind an entitlement check in the VM.
