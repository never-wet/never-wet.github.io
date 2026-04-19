# Adding Projects

## Fast path

To add a new project chamber, update the memory files first, then add the 3D scene component.

## 1. Add the project data

Edit `src/memory/projectIndex.ts` and add a new `ProjectDefinition` with:

- `id`
- `title`
- `shortDescription`
- `fullDescription`
- `techStack`
- `sceneId`
- `sceneTheme`
- `visualTags`
- `objectId`
- `objectType`
- `portalType`
- `media`
- `links`
- `transitionBehavior`
- `accentLighting`
- `interactionText`
- `soundCueIds`
- `detailCamera`
- `chamberTitle`
- `chamberDescription`
- `stats`

## 2. Add the project object anchor

Edit `src/memory/objectManifest.ts` and add the new floating object definition:

- world `position`
- `rotation`
- `scale`
- `portalType`
- `lightColor`
- `islandRadius`
- `interactionHint`

This is the spatial anchor for the 3D chamber.

## 3. Add or reuse a scroll scene

If the new project needs its own place in the journey, add a scene entry in `src/memory/sceneIndex.ts`.

Give it:

- a unique `id`
- scroll range
- overlay copy
- `cameraAnchorId`
- `audioProfileId`
- `projectId`

If you add a new scene, also add its ID to `siteManifest.ts`.

## 4. Add the camera anchor

Edit `src/animation/cameraPaths.ts`.

Add:

- a journey anchor if the project has a new scroll stop
- a `detailCamera` in `projectIndex.ts` for the fullscreen chamber view

The fullscreen transition depends on that `detailCamera`.

## 5. Add audio routing

Edit `src/memory/audioManifest.ts`.

- add a scene profile if the new chamber needs a distinct ambient color
- add cue IDs only if the current hover/open cues are not enough

## 6. Add media assets

Put new image/video/poster assets in `public/media/` and reference them from `projectIndex.ts`.

The current `ProjectPanel` supports:

- `image`
- `video`
- `signal`

`signal` is the lightweight synthetic fallback when you want a designed surface without a heavy asset.

## 7. Create the 3D chamber component

Add a new scene file under `src/projects/`, following the existing pattern:

- read `project` and `anchor` from `contentRegistry`
- use `useSite()` for hover and open state
- use `useAudio()` for cue triggers
- animate the chamber with `useFrame()`
- keep geometry clean, lightweight, and project-specific

## 8. Mount the new chamber

Import the new component into `src/scenes/MainExperience.tsx` and render it in the scene stack.

## 9. Verify the overlay copy

Check:

- `CinematicOverlay.tsx` project rail
- `ProjectPanel.tsx` detail layout
- scene navigation labels

Most of the overlay content should already work automatically if the memory data is complete.

## 10. Build and test

Run:

```bash
npm run build
```

Then verify:

- scroll stop feels natural
- hover sound does not spam
- click opens the chamber cleanly
- `Escape` closes the chamber
- audio settings persist
- media surfaces look correct on desktop and mobile
