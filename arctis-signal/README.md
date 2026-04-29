# ARCTIS / SIGNAL

An immersive Next.js, React, and Three.js brand world with scroll-driven WebGL choreography.

## Running Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.

## Static Export

```bash
npm run build
```

The build runs `next build`, then `scripts/publish-static.mjs` copies the exported files from `out/` into the `arctis-signal/` project root and removes `out/`.

This matters for GitHub Pages: the live portfolio link points at `./arctis-signal/`, so `arctis-signal/index.html` must be the real exported page, not a redirect to the ignored `out/` folder.
