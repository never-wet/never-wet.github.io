# Object Scanner

A real-time camera-based scanner for the Never Wet project hub. It supports `Object Scan` for close-up object reconstruction and `Room Scan` for a spatial room-mapping experience where the user moves around and captures walls, floor, and major objects.

This web scanner uses camera-based approximation and point-cloud reconstruction. It is not true LiDAR scanning.

This system uses camera-based spatial reconstruction and is not true LiDAR scanning.

## Camera Permission

Open the app from a secure origin such as `https://`, `localhost`, or `127.0.0.1`. Browsers block `getUserMedia()` on insecure origins.

Object Scan requests the front camera with `facingMode: { ideal: "user" }`. Room Scan requests the rear camera with `facingMode: { ideal: "environment" }`, which is better for walking around a room on mobile. Both modes fall back to any available camera when the preferred camera is unavailable.

The UI handles denied permission, missing cameras, and unsupported browsers with an inline retry state.

## Object Scan

Object Scan processes downsampled video frames with an HTML canvas. Each capture estimates an object mask from:

- central guide area sampling
- background subtraction
- local edge contrast
- color saturation
- brightness and frame-to-frame motion

Every accepted sample stores its screen position, camera pixel color, confidence, frame index, and an estimated depth value. The depth is approximate, built from edge density, brightness, mask strength, and small temporal motion cues.

## Room Scan

Room Scan adds a denser pseudo-SLAM spatial tracking pipeline:

- detects corner-like feature points from each downsampled frame
- matches points frame-to-frame to simulate optical flow
- estimates rough camera panning, tilt, forward motion, and motion magnitude
- stores a continuous camera path, current camera marker, and coverage heatmap
- classifies sampled pixels as floor, wall, ceiling, or object hints
- expands sampled pixels into dense surface support points for readable walls, floor, ceiling, furniture, and corners
- projects colored samples into a global room / house-scale point cloud
- updates a live Three.js mini-preview while scanning
- offloads final room point-cloud reconstruction to a Web Worker when available

The live overlay shows grid alignment, feature points, tracking indicators, a virtual scan boundary, coverage heatmap, point count, tracking quality, path distance, and movement guidance. The 3D preview draws the point cloud, voxel accents, camera path line, current device marker, and direction arrow. The reconstruction is an approximate spatial map, not a measured CAD model.

## Point Cloud Generation

When the user clicks `Done`, the captured samples are converted into a colored 3D point cloud. Object Scan uses frame sweep to bend samples into object volume. Room Scan uses estimated camera pose, surface classification, dense surface samples, and feature coverage to build a larger room or house point cloud with floor, wall, ceiling, object, and camera path hints.

Both previews keep the original camera pixel colors as per-point RGB attributes. The 3D preview renders `BufferGeometry` points and a lighter voxel skin for a radar reconstruction feel.

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
