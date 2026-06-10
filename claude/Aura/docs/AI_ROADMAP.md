# Aura — Future AI / CV Integration Strategy

The app ships with a deterministic `MockAnalysisService`. Every future capability slots in
behind `AnalysisServiceProtocol` with **zero UI changes**.

---

## 1. Integration seam

```
            ┌────────────────────────────┐
   UI ────► │  AnalysisServiceProtocol   │ ◄──── single seam for all backends
            └────────────┬───────────────┘
                         │
      ┌──────────────┬───┴────────────┬──────────────────┐
      ▼              ▼                ▼                  ▼
 MockAnalysis   VisionService   MediaPipeService   RemoteService
  (today)       (on-device)     (Face Mesh)        (backend + GPT)
```

`AnalysisRequest` carries the image + options; every implementation returns the same
`AnalysisResult`. The pipeline is therefore swappable and composable.

---

## 2. Phased plan

### Phase 1 — On-device Vision (Apple)
- `VNDetectFaceLandmarksRequest` → 76-point landmarks.
- Compute canthal tilt, facial thirds, midline symmetry, gonial-angle proxy.
- Populate `FacialLandmarkData` + derive `MetricItem`s. Fully offline, privacy-first.

### Phase 2 — MediaPipe Face Mesh
- 468-point dense mesh for finer geometry (orbital support, sclera exposure).
- Wrap via a `MediaPipeService` conforming to `AnalysisServiceProtocol`.

### Phase 3 — OpenCV refinement
- Texture / dermal analysis (acne indicators, clarity) via classical CV on the captured frame.

### Phase 4 — Custom ML models
- Core ML model for dimorphism / aesthetic regression trained on labelled data.
- On-device inference; `ScoreBreakdown` exposes per-feature contributions.

### Phase 5 — GPT-powered recommendations
- Send anonymized `ScoreBreakdown` (not the image) to a backend that calls an LLM for the
  natural-language assessment + improvement trajectory.
- Backed by `FutureRemoteAnalysisService`.

### Phase 6 — Progression & premium
- Persist `AnalysisSession` history → score trends over time.
- Subscription-gated premium reports (deeper breakdowns, trajectory modelling).

---

## 3. Privacy posture

- On-device first. Remote upload is **opt-in** and transmits derived metrics, not raw images,
  wherever possible.
- All remote traffic encrypted; explicit consent captured before any capture.

---

## 4. Recalibration

Score → tier mapping is centralized in `PSLTier`. Re-training or re-weighting only requires
updating the model + the tier table — the rest of the system is invariant.
