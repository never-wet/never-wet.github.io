# Project Atlas Architecture

## Overview

`cinematic-portfolio/` is a static React + TypeScript + Vite site built around one fixed WebGL canvas and one real page scroll track.

The scroll track does not render the content itself. It only drives the camera through a 3D world made of intro, transition, project, and outro scenes.

## Runtime layers

### 1. Memory files

`src/memory/` is the compact source of truth.

- `siteManifest.ts`: site identity, visual direction, feature flags
- `projectIndex.ts`: all project copy, stack, links, media, chamber metadata
- `sceneIndex.ts`: scene order, scroll ranges, audio profile references, overlay copy
- `objectManifest.ts`: 3D anchor definitions for each project object
- `iconManifest.ts`: icon sculpture identity and silhouette notes
- `audioManifest.ts`: ambient profiles and synthesized cue definitions
- `uiManifest.ts`: overlay copy and control labels
- `storageKeys.ts`: local persistence keys
- `defaultState.ts`: initial UI, audio, and interaction state
- `types.ts`: shared contracts
- `contentRegistry.ts`: joins scenes, objects, and projects
- `performanceConfig.ts`: quality presets and fallback rules

### 2. App state

`src/app/SiteProvider.tsx` owns:

- scroll progress
- active scene
- active project chamber
- hovered project
- viewed projects
- audio settings persistence
- reduced motion and quality mode
- the GSAP-driven `projectBlendRef` used for fullscreen scene transitions

### 3. Camera system

`src/animation/cameraPaths.ts` stores the authored camera anchors and creates the spline used for the journey view.

`src/animation/ScrollCameraRig.tsx` samples the spline from page scroll and blends that path into a project-specific camera when a chamber opens.

That means project transitions are not a modal swap. The same camera and canvas continue, but the rig interpolates from journey mode into project mode.

### 4. 3D scene composition

`src/scenes/MainExperience.tsx` composes the full world:

- `Starfield`
- `AtmosphereField`
- `IntroScene`
- `TransitionScene`
- project chambers in `src/projects/`
- `OutroScene`

Project chambers are separate components so each project can have its own object language and atmosphere.

A second, shorter handoff layer also lives in the root `memory/` folder for future sessions that need the smallest possible starting context.

### 5. Project scenes

Each project scene file in `src/projects/` handles:

- the floating anchor object
- hover and click interactions
- object-specific animation
- chamber-specific materials and geometry

The overlay detail content comes from `projectIndex.ts`, while the 3D chamber visuals live in these scene files.

### 6. UI overlays

`src/components/ui/` holds the fixed overlay system:

- `BootOverlay.tsx`: cinematic loading and entry overlay
- `CinematicOverlay.tsx`: brand, scene copy, scene navigation, project rail
- `AudioDock.tsx`: audio controls with local persistence
- `ProjectPanel.tsx`: fullscreen project detail layout shown while a chamber is open

The overlay never becomes the main experience. It stays lightweight and lets the canvas remain dominant.

### 7. Audio

`src/audio/AudioProvider.tsx` uses the Web Audio API instead of heavy media files.

It creates:

- a low-volume ambient synth bed
- filtered noise for atmospheric texture
- lightweight hover / scene / open / close cues

Scene and project audio routing comes from `audioManifest.ts`, and settings persist through `localStorage`.

## Scroll model

The page contains a transparent scroll track in `AppShell.tsx` with one marker per scene.

On scroll:

1. `SiteProvider` converts `window.scrollY` into normalized progress.
2. The active scene is resolved from `sceneIndex.ts`.
3. `ScrollCameraRig.tsx` samples the journey spline.
4. Overlay copy updates to the active scene.
5. Audio profile changes when the scene changes.

## Fullscreen project scene behavior

When a project is clicked:

1. `openProject()` sets `activeProjectId`.
2. GSAP animates `projectBlendRef` from `0` to `1`.
3. The camera rig blends from the journey spline to that project's `detailCamera`.
4. `ProjectPanel.tsx` fades in the fuller project story, media, links, and stack.
5. `Escape` or `Return to atlas` reverses the transition.

## Performance strategy

- quality presets live in `performanceConfig.ts`
- DPR is capped and adaptive
- bloom is disabled on lower presets
- particles are authored from preset counts
- scenes use primitive geometry and transmission materials instead of large models
- ambient audio is synthesized instead of fetched
- Vite splits React, Three, and GSAP into separate build chunks
