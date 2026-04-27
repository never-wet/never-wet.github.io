# Apex Hypercar Showcase

A fixed cinematic Three.js hypercar reveal where scroll drives scene progress instead of moving content vertically.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173/`.

Do not open `index.html` directly with `file://`; browsers block local module scripts and GLB loading in that mode. A static server also works:

```bash
python -m http.server 8097
```

## Interaction

- Scroll controls the car rotation and staged state changes.
- Hover the car to soften only the painted shell under the liquid bubble and reveal internal details.
- The engine stage fades the exterior shell and brings the rear mechanical structure forward.
- The final stage transitions into a live particle silhouette and reassembles.
