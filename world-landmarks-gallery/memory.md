# World Landmarks Gallery - Memory & Context

## Project Overview
This folder contains a horizontally scrolling, interactive "World Landmarks" gallery. It uses Vanilla JS, HTML, and CSS, incorporating 2D transparent placeholders and interactive 3D models via Google's `<model-viewer>`.

## Core Features & Mechanics
- **Conveyor Belt Scroll:** The horizontal scrolling is achieved by mapping the vertical scroll position to horizontal track translation (1:1 speed ratio mapping: `document.body.style.height = track.scrollWidth + 'px'`).
- **Click to Expand:** Clicking a landmark scales it up (1.6x), centers it vertically and aligns it to the left 25% of the viewport. A details panel slides in from the right.
- **Centering Calculation:** Uses `getBoundingClientRect()` on the `.track` parent for stable coordinates, bypassing unreliable flexbox offsets during animations.
- **Lighting & Z-Index:** Models use `shadow-intensity="1"`, `exposure="1"` (or `0.5` for bright models like Taj Mahal), and `environment-image="neutral"`. Stacking contexts are managed so the dark overlay dims inactive items (`opacity: 0.15`, `filter: brightness(0.3)`).
- **Loading Screen:** A full-screen dark overlay with a spinner masks the site until all `<model-viewer>` components fire their `load` events.

## Integrated 3D Models
The gallery currently features four interactive 3D models. Panning (`disable-pan`) is disabled to keep the camera locked to the model's exact center.
1. **Eiffel Tower** (`models/free__la_tour_eiffel.glb`)
2. **Great Wall of China** (`models/great_wall_survey.glb`)
3. **Colosseum** (`models/romes_colosseum.glb`)
4. **Taj Mahal** (`models/taj_mahal_3d_model.glb`) - *Exposure lowered to 0.5 for detail visibility.*

## Content
- Contains a list of 150 landmarks injected into the HTML.
- Rich metadata (location, year built, height, and descriptions) is populated in the `landmarkData` JS object for the four 3D models.

## Version Control
- **Git LFS:** Configured to track `*.glb` files via Git LFS. The `.gitattributes` file has been added and committed.
