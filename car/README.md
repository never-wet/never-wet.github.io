# Aeroform — Interactive Aerodynamic Car Showcase

A scroll-driven, WebGL-powered wind tunnel visualization that places high-performance cars in an interactive aerodynamic study. Built with vanilla Three.js — no build step, no framework.

---

## What It Is

Aeroform renders four distinct sports cars inside a virtual wind tunnel and visualizes how air flows over, under, and around each body. As you scroll through six narrative chapters, the camera glides through curated angles while thousands of particle tracers wrap around the car surface, color-coded by velocity.

The experience is designed to feel like a premium automotive design tool — something you might see in a Formula 1 team's CFD suite or a luxury car configurator.

---

## Live Behavior

| Interaction | Behavior |
|-------------|----------|
| **Scroll** | Drives the entire experience — camera path, particle intensity, UI narrative, and aerodynamic readouts |
| **Drag on canvas** | Orbit 360° around the car (click + drag) |
| **Double-click** | Reset camera orbit to default |
| **Car switcher (header)** | Crossfade between Porsche, Ferrari, Lotus, BMW with unique aero profiles |
| **Debug toggle / D key** | Show wireframe collision volumes, particle vectors, and live telemetry |
| **Pointer move** | Parallax camera offset + custom cursor dot |

---

## File Structure

```
car/
├── index.html              # Semantic markup, UI overlays, scroll chapters
├── app.js                  # Core application (~1400 lines, vanilla Three.js)
├── styles.css              # Glassmorphism UI, responsive breakpoints
├── ATTRIBUTION.md          # 3D model credits
├── README.md               # This file
├── models/
│   ├── porsche_911_gt3.glb
│   ├── 2021_ferrari_sf90_spider.glb
│   ├── lotus_emira_2022__www.vecarz.com.glb
│   ├── 2021_bmw_m3_competition_g80.glb
│   └── ferrari_ao.png      # Shared ambient occlusion shadow texture
└── utils/
    ├── BufferGeometryUtils.js
    └── SkeletonUtils.js
```

> **Note:** The `vendor/` folder (Three.js core, GLTFLoader, DRACOLoader, DRACO wasm binaries) is expected at runtime but not tracked in this directory listing.

---

## How It Works

### 1. Scene Setup

The scene is a minimal studio: soft gray background, exponential fog, a reflective floor plane, subtle grid helper, and vertical rib cage lines that suggest a wind tunnel enclosure. Lighting is a three-point setup — key directional, cool rim, and warm fill.

### 2. Car Loading Strategy

Each car is loaded as a GLB file via `GLTFLoader` with `DRACOLoader` for compressed geometry. If a model fails to load, the system falls back to a **procedurally sculpted car body** generated from parametric profile curves.

The fallback body is built using:
- `THREE.ExtrudeGeometry` from a `THREE.Shape` traced along upper/lower profile curves
- Cabin glass as a separate extruded shape
- Torus wheels with 10-spoke rims
- Box headlights and taillights with emissive materials

### 3. Car Data Model

Each car is defined by a rich configuration object:

```js
{
  id: "porsche",
  brand: "Porsche",
  model: "911 GT3",
  cd: "0.34 Cd",
  asset: "./models/porsche_911_gt3.glb",
  paint: "#d7d2c8",
  trim: "#10100f",
  accent: "#e7ff5b",
  length: 4.8, width: 1.9, height: 1.24,
  wheelRadius: 0.37,
  wheelFront: -0.66, wheelRear: 0.68,
  // Profile curves (normalized x, y) used for fallback body + collision
  upper: [[-1, 0.16], [-0.84, 0.34], ...],
  lower: [[1, 0.13], [0.6, 0.08], ...],
  cabin: [[-0.44, 0.46], [-0.18, 0.82], ...],
  // 12 aerodynamic parameters that drive the simulation
  aero: {
    split: 0.72, surfaceGrip: 0.9, roofAccel: 0.78,
    sideChannel: 0.48, wake: 0.32, turbulence: 0.06,
    blockage: 0.72, frontCompression: 0.64,
    roofAttachment: 1.08, underbodyAccel: 0.58,
    wakeSpread: 0.48, wakeLength: 0.78, mirrorVortex: 0.18
  }
}
```

### 4. The Aerodynamic Simulation

This is the heart of the project. There are **three visual layers**:

#### A. Pressure Zones (Static Meshes)
Five translucent planes float around the car — front, roof, sides, underbody, and wake. Each uses a custom `ShaderMaterial` with animated scanlines that pulse based on scroll intensity and wind speed.

#### B. Advected Particle Tracers
156 particles (84 on mobile) are spawned at the tunnel inlet and advected through a custom flow field. Each particle leaves a trail of line segments behind it, creating the characteristic "wind tunnel streamer" look.

**The flow field** (`sampleFlowField`) is not a real CFD solve — it's a carefully tuned analytical model that samples:

- **Body window** — whether the particle is near the car's bounding region
- **Roof band / side band / under band** — which surface region is closest
- **Profile slope** — derivative of the upper body curve
- **Distance from surface** — used for collision response

The velocity vector is then modified by:
- Surface normal deflection (air slides around the body)
- Front compression (slows air at the nose)
- Roof acceleration (speeds air over the crown)
- Side channeling (pushes air around the shoulders)
- Underbody acceleration
- Mirror vortex (sinusoidal perturbation near the A-pillar)
- Wake turbulence and spread (behind the rear axle)

Particles respawn when they exit the tunnel bounds. Trails are maintained in a ring buffer history array.

#### C. Pressure Wake
Three billboarded planes behind the car render swirling vortex patterns with custom fragment shaders that mix lane streaks with sinusoidal swirl patterns.

### 5. Scroll-Driven Narrative

Six invisible scroll chapters (each `105vh` tall) drive the experience via `window.scrollY`. The scroll progress (`0 → 1`) maps to:

| Progress Range | Effect |
|----------------|--------|
| `0.00 – 0.16` | Stage 1: Car reveal, minimal flow |
| `0.16 – 0.32` | Stage 2: Laminar traces approach |
| `0.32 – 0.50` | Stage 3: Full flow wraps the shell |
| `0.50 – 0.68` | Stage 4: Pressure zones appear |
| `0.68 – 0.86` | Stage 5: Wake intensifies |
| `0.86 – 1.00` | Stage 6: Feature markers resolve |

**Camera path:** 6 keyframe positions are interpolated with `easeInOutCubic` based on scroll progress. The camera also responds to:
- Pointer position (parallax offset)
- Orbit yaw/pitch (from drag interaction)

**UI updates:** Story panel text crossfades, velocity readout climbs, metrics update (Flow %, Pressure state, Wake state), and scroll rail grows.

### 6. Collision System

Air particles use a **signed-distance-field (SDF)** approximation of the car body. The `sampleCarField` function computes:

- Normalized position `t` along the car's length
- Elliptical distance from the body center (using `radiusY` and `radiusZ`)
- Surface normal vector

If a particle penetrates the body, it's pushed out along the normal. This is lightweight but convincing — no raycasting, no BVH.

### 7. Debug Mode

Press **D** or click the Debug button to reveal:
- Wireframe collision ellipsoid and wake bounding box
- Color-coded zone boxes (front=orange, roof=blue, sides=green)
- Flow field vector arrows sampled on a grid
- Particle seed points
- Live telemetry: particle count, respawns, velocity, wake value

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **No build step** | Pure ES modules with importmap — runs directly in browser |
| **DRACO compression** | GLB files are large; DRACO reduces geometry size ~10x |
| **Custom shaders** | Needed for speed-based color mapping, scanline pulses, and trail fading |
| **Procedural fallback** | Ensures the experience works even if GLB network requests fail |
| **Scroll hijacking via tall sections** | Native scroll with invisible spacers — preserves accessibility and mobile behavior |
| **Reduced motion support** | Respects `prefers-reduced-motion: reduce` — slows animation and increases lerp factors |

---

## Running Locally

Because the app uses ES modules and loads GLB/DRACO assets, it must be served over HTTP (not `file://`):

```bash
# From the repo root
npx serve . -p 3000
# Then open http://localhost:3000/car/
```

Or use the Python helper at the repo root:

```bash
python serve_loreline_tmp.py
```

---

## Dependencies

| Package | Source | Purpose |
|---------|--------|---------|
| Three.js | `vendor/three.module.min.js` | WebGL renderer, scene graph, math |
| GLTFLoader | `vendor/GLTFLoader.js` | Load `.glb` car models |
| DRACOLoader | `vendor/DRACOLoader.js` | Decompress DRACO-encoded geometry |
| DRACO wasm | `vendor/draco/` | Binary decoder for DRACOLoader |

No npm, no bundler, no framework. The entire application is a single `app.js` module.

---

## Car Model Attribution

See `ATTRIBUTION.md` for per-model credits. All models are user-provided GLB assets with Creative Commons or similar licensing.

---

## Performance Notes

- Pixel ratio capped at `1.65` (`1.25` on mobile) to prevent GPU overload
- Antialiasing disabled on viewports under `760px`
- Particle count halved on mobile
- Delta time clamped at `40ms` to prevent spiral on lag frames
- Frustum culling disabled on particle line segments (they're always visible)

---

## Future AI Assistants: Start Here

If you're modifying this project:

1. **Car data** lives in the `CARS` array at the top of `app.js` — add new vehicles by copying an existing object and tuning the `upper`/`lower`/`cabin` curves.
2. **Scroll stages** are in the `STAGES` array — edit copy without touching logic.
3. **Flow simulation** is in `sampleFlowField()` and `resolveAirCollision()` — changes here affect how air behaves globally.
4. **Shaders** are inline strings in `createAdvectedParticles`, `createPressureZoneMaterial`, `createFlowTube`, and `createPressureWake` — edit GLSL directly.
5. **UI text** is in `index.html` — the JavaScript only swaps content, not structure.
6. **Styling** is fully in `styles.css` — no CSS-in-JS or utility classes.

The code is intentionally monolithic (single `app.js`) to keep the mental model flat. There are no classes, no state management library, and no reactive framework — just a single `requestAnimationFrame` loop that mutates Three.js objects directly.
