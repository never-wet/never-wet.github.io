# Aura - Premium Facial Analytics Platform

## Product Requirements Document (PRD)

### 1. Product Vision & Positioning
Aura is a luxury facial analytics and biometric assessment iOS application. It merges the precision of medical imaging with the elite UX of modern health applications (e.g., WHOOP, Apple Health). The platform provides an objective, scientifically-grounded analysis of facial structure, symmetry, and dermal quality. 

**Core Identity:**
*   **Aesthetic:** Luxury Clinical Dark Mode. Engineered, sharp, and precise.
*   **Tone:** Scientific, objective, and exclusive.
*   **Anti-Goals:** No gamification, no social media sharing hooks, no cartoonish UI elements, no rounded pills or soft corners.

### 2. Core Features & Capabilities
*   **Biometric Assessment Engine:** Utilizes geometric relationships and facial landmarks to assign a structural score.
*   **PSL Scoring Framework (1.0 - 10.0 Scale):**
    *   **Sub-5:** Below average structural traits.
    *   **5.0 - 5.9 (Normie Spectrum):** LTN (5.0-5.2), MTN (5.3-5.5), HTN (5.6-5.9).
    *   **6.0 - 8.5+ (Elite Spectrum):** Chad (6.0-6.9), True Adam (7.0+).
*   **Bento Grid Dashboard:** A flagship view that displays modular, heavily-engineered metric cards (Eye Area Harmony, Jawline Angle, Dimorphism Index, Facial Symmetry, Dermal Quality).
*   **Session Management:** Users can instantly clear analysis, reset state, and launch a sophisticated camera/upload flow.

### 3. Design System Specification
*   **Theme:** Luxury Clinical Dark Mode.
    *   Background: `#09090A`
    *   Surface: `#16161A`
    *   Secondary Surface: `#09090B`
    *   Border: `#24242B`
    *   Accent Purple: `#8B5CF6`
    *   Accent Blue: `#60A5FA`
    *   Accent White: `#FFFFFF`
*   **Typography:** SF Pro. Hierarchy relies on font weight and strict kerning over oversized text.
*   **Corner Rule:** Strictly `cornerRadius(5)` for all UI elements. No circular progress bars, no pills.
*   **Animations:** Spring animations (duration 0.2–0.4s), subtle opacity transitions, no flashy bounces.

### 4. Information Architecture & User Flows
1.  **Onboarding / Empty State:** Minimalist prompt to begin assessment.
2.  **Fallback Camera Selection (Sheet):** Secure options to 'Take Photo' or 'Upload Photo'.
3.  **Analysis Processing:** Clinical loading states mimicking scanning technology.
4.  **Dashboard (Main):**
    *   Floating Reset Button (Top Right).
    *   Hero Card (Overall Score, Tier, Confidence, Summary).
    *   Bento Grid of specific structural metrics.

### 5. Future AI Integration Strategy
*   **Phase 1 (Current):** Mocked/Local static analysis to establish UI/UX architecture.
*   **Phase 2:** Integration of `Vision` Framework for local 2D face landmark detection.
*   **Phase 3:** OpenCV / MediaPipe Face Mesh integration for high-density 3D spatial mapping and precise angular measurements.
*   **Phase 4:** GPT-4V or custom Vision-Language models to generate personalized architectural summaries and trajectory advice.

---

## Engineering Architecture

### 1. Architectural Pattern
*   **MVVM (Model-View-ViewModel):** Strict separation of state management, UI rendering, and data modeling.
*   **Protocol-Oriented Services:** All API/Analysis calls are routed through `AnalysisServiceProtocol` to allow seamless swapping between Mock, Vision, and Cloud backends.

### 2. State Management & Concurrency
*   Swift 6 Concurrency (`async/await`, `@MainActor`).
*   `ObservableObject` (or `@Observable` in iOS 17+) for ViewModels.

### 3. Directory Structure
```text
Aura/
├── App/
│   └── AuraApp.swift
├── Models/
│   ├── AnalysisResult.swift
│   └── MetricModels.swift
├── Services/
│   ├── AnalysisServiceProtocol.swift
│   └── MockAnalysisService.swift
├── ViewModels/
│   └── DashboardViewModel.swift
├── Views/
│   ├── DashboardView.swift
│   ├── BentoGridLayout.swift
│   └── FallbackCameraSelectionView.swift
├── Components/
│   ├── HeroScoreCard.swift
│   └── MetricCard.swift
└── Theme/
    └── Theme.swift
```
