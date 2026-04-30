# Wheel of Fortune

Interactive spinning wheel app built with Next.js, React, TypeScript, and Canvas.

## Features

- Editable option list with add, remove, color, randomize, and preset controls
- Fair spin flow: a random segment index is chosen before motion starts
- Exact pointer landing: the final wheel rotation is calculated from the chosen segment
- Physics-style animation driven by `requestAnimationFrame`, angular velocity, and friction
- Highlighted winning segment and clear result display
- Optional Web Audio ticks while spinning and a small finish tone
- Static export support for GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run publish
```

`npm run publish` copies the static export from `out/` into the project root so `wheel-of-fortune/index.html` can be served directly from GitHub Pages.
