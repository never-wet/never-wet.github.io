# World Landmarks Gallery - Memory & Context

## Project Overview
This folder contains a horizontally scrolling, interactive "World Landmarks" gallery. It uses Vanilla JS, HTML, and CSS, incorporating interactive 3D models via Google's `<model-viewer>`.

## Core Features & Mechanics
- **Conveyor Belt Scroll:** Horizontal scrolling mapped 1:1 to vertical scroll position.
- **Click-vs-Drag Detection:** Implements a 5px movement threshold using `mousedown` and `mouseup` to distinguish between spinning a 3D model (drag) and opening the info panel (click).
- **Split-Screen Details:** Clicking a landmark scales it (1.6x) and slides in a rich details panel from the right.
- **Dynamic Zoom/Pan:** Zooming and Panning are programmatically enabled *only* when a landmark is expanded, ensuring they don't interfere with gallery navigation.
- **Scrollbar Management:** All visual scrollbars are hidden via aggressive CSS (including `!important` flags for Opera GX) to maintain an immersive, app-like feel.

## Visual Design: Holographic Museum
- **Atmospheric Look:** Deep dark theme with glowing golden radial gradients.
- **Holographic Pedestals:** Models that are still loading display a pulsing golden light pedestal effect.
- **"3D INTERACTIVE" Badges:** Each landmark item features a stylized badge to signal interactivity.
- **Information Panel:** A scrollable side-panel containing quantitative stats (Weight, Volume, Dimensions) and qualitative narratives.

## Performance & Loading
- **Auto-Loading Strategy:** Per user request, all 3D models load eagerly (`loading="eager"`, `reveal="auto"`) upon site visit to ensure visual completeness.
- **GPU Optimization:** Uses `power-preference="high-performance"` and `will-change: transform` hints to leverage dedicated graphics hardware.
- **Shadow Management:** Real-time shadows are disabled (`shadow-intensity="0"`) to maintain high frame rates with 8K high-resolution models.

## Integrated 3D Models
The gallery features several 8K/high-poly models:
1. **Eiffel Tower** (`models/free__la_tour_eiffel.glb`)
2. **Great Wall of China** (`models/great_wall_survey.glb`)
3. **Colosseum** (`models/romes_colosseum.glb`)
4. **Taj Mahal** (`models/taj_mahal_3d_model.glb`)
5. **Machu Picchu** (`models/Machu_Picchu,_Peru.glb`)
6. **Statue of Liberty** (`models/statue_of_liberty.glb`)
7. **Sydney Opera_House** (`models/sydney_opera_house_sydney_australia.glb`)

## Content & Data
- **Wikipedia Integration:** Major landmarks feature multiple paragraphs of exhaustive history, engineering details, and cultural context.
- **Structural Stories:** Construction details (e.g., the Eiffel Tower's 2.5 million rivets) are woven directly into the narrative descriptions.

## Deployment & Infrastructure
- **Git LFS:** 3D models are stored via Git LFS.
- **GitHub Actions:** Deployment is handled by `.github/workflows/static.yml` which explicitly fetches LFS files during the build process to fix the "missing models" issue on GitHub Pages.
