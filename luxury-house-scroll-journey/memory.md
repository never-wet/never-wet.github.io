# Luxury Residence Memory

## Experience Rules

- The page is a virtual tour, not a normal scrolling landing page.
- Scroll must feel like forward and reverse movement through the property.
- The first frame starts outside the entrance gate.
- The final frame ends with premium booking/gallery actions.
- Keep UI sparse: small nav, one stage text block, progress, and final CTAs.

## Architecture Direction

- Use a modern villa language: stone, concrete, walnut, black steel, glass, water, clipped planting, warm interior lights.
- The property should read as large, private, and expensive from the first viewport.
- Prefer long sightlines, axial driveway movement, deep overhangs, and gallery-like rooms.
- Avoid cartoon shapes, cheap template cards, cluttered labels, and small suburban-house proportions.

## Camera Rules

- Camera positions are authored in `CameraPathController.ts`.
- Use damped interpolation in the frame loop so stage changes do not jump.
- Scroll down moves deeper into the property; scroll up reverses the same path.
- Keep the front door and interior transitions physically readable.

## Performance Rules

- Use modular primitive geometry before importing heavy GLB assets.
- Keep lights purposeful and cap pixel ratio.
- Avoid dense particles and excessive transparent surfaces.
- Preserve drawing buffer for visual checks only because the scene needs canvas validation.
