# Object Scanner

A real-time camera-based object scanner for the Never Wet project hub. It asks for camera access, prefers the front camera, shows a radar-style scanner overlay, captures object samples from live frames, and reconstructs the result as a colored interactive Three.js point cloud.

This web scanner uses camera-based approximation and point-cloud reconstruction. It is not true LiDAR scanning.

## Camera Permission

Open the app from a secure origin such as `https://`, `localhost`, or `127.0.0.1`. Browsers block `getUserMedia()` on insecure origins. The app requests the front camera with `facingMode: { ideal: "user" }` and falls back to any available camera when the front camera constraint is unavailable.

The UI handles denied permission, missing cameras, and unsupported browsers with an inline retry state.

## How The Pseudo-3D Scan Works

The scanner processes downsampled video frames with an HTML canvas. Each capture estimates an object mask from:

- central guide area sampling
- background subtraction
- local edge contrast
- color saturation
- brightness and frame-to-frame motion

Every accepted sample stores its screen position, camera pixel color, confidence, frame index, and an estimated depth value. The depth is approximate, built from edge density, brightness, mask strength, and small temporal motion cues.

## Point Cloud Generation

When the user clicks `Done`, the captured samples are converted into a colored 3D point cloud. The builder uses the frame index as a small sweep angle, bends the samples into volume, normalizes the bounds, and keeps the original camera pixel colors as per-point RGB attributes. The 3D preview renders both a dense `BufferGeometry` point cloud and a lighter voxel skin for a radar reconstruction feel.

## Run Locally

```bash
cd object-scanner
npm install
npm run dev
```

Then open the local URL shown by Next.js. Camera access works on `localhost`.

## Build Static HTML

```bash
cd object-scanner
npm run publish
```

That runs a static Next export and copies the generated files into the project root, including `object-scanner/index.html` for GitHub Pages.
