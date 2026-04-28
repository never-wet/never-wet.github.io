# AeroRank Vehicle Analysis System

A premium futuristic car showcase built as a digital aerodynamic testing interface. The experience places four vehicles inside a cinematic wind tunnel where the UI scans, ranks, and analyzes each car through airflow, pressure, performance, and design data.

## Tech Stack

- Next.js, React, TypeScript
- Three.js with React Three Fiber and Drei
- GSAP ScrollTrigger for state timelines
- Zustand for system and vehicle state
- Tailwind CSS with custom system CSS
- Local GLB vehicle assets from the existing repository

## Folder Structure

```text
aero-rank-system/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   ├── draco/
│   └── models/
├── src/
│   ├── components/
│   │   ├── scene/
│   │   └── ui/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   └── store/
├── memory.md
└── README.md
```

## Interaction Model

The website behaves like a system changing states instead of a conventional scrolling page:

1. Boot initializes the grid and blueprint car.
2. Identity resolves the vehicle name, rank, class, and short cinematic profile.
3. Aerodynamic scan activates directional airflow and pressure zones.
4. Performance analysis highlights power, acceleration, speed, and stability.
5. Comparison lets the user switch vehicle profiles and recalculates the flow.
6. Final command surfaces minimal premium calls to action.

## Car Profile System

Profiles live in `src/data/vehicles.ts`. Each vehicle defines:

- Accent colors and identity copy
- Rank, classification, and score values
- Model file and fit settings
- Performance metrics
- Aerodynamic metrics
- Airflow behavior controls
- Analysis labels for scan points

## Airflow Visualization

`src/components/scene/AirflowSystem.tsx` generates directional streamlines from analytic curves. Each car adjusts split, attachment, side channel behavior, wake spread, turbulence, speed, and particle density, so switching vehicles changes the visible flow field instead of only swapping text.

## Running Locally

```bash
npm install
npm run dev
```

Open the URL printed by Next, usually `http://127.0.0.1:3000`.

## Static Export

```bash
npm run build
```

The exported site is written to `out/`. The root `index.html` redirects to `./out/` so the project can be linked from the main homepage as `./aero-rank-system/`.
