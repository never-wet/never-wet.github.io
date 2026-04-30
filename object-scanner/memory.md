# Object Scanner Memory

## Scanner Concept

- Radar-style real-time object scanner using a normal webcam.
- Room scanning mode that feels like spatial mapping by walking around with the camera.
- Preserve camera colors and reconstruct a convincing pseudo-3D point-cloud / voxel preview.
- Be honest in docs that this is not LiDAR, but keep the UI focused and premium.

## UX Rules

- First screen is the scanner, not a landing page.
- Provide a clear Object Scan / Room Scan toggle.
- Ask for camera access on open.
- Keep the interface clean, dark, futuristic, and uncluttered.
- Show live camera, scan guide, progress, mode controls, Done, Retake, and compact quality feedback.
- Required instruction: “Move slowly around the object”.
- Room Scan instructions: “Move slowly around the room”, “Keep the camera steady”, “Scan walls, floor, and objects”.
- Room Scan overlay must show spatial grid, tracking corners, feature points, coverage heatmap, progress, and “Move device slowly”.
- If detection is weak, show: “Move object closer / improve lighting”.

## Camera Rules

- Use `navigator.mediaDevices.getUserMedia()`.
- Prefer the front camera with `facingMode: { ideal: "user" }`.
- For Room Scan, prefer the rear camera with `facingMode: { ideal: "environment" }`.
- Fall back to any camera when the preferred camera cannot be opened.
- Handle denied permission, missing camera, and unsupported browser states.
- Stop camera tracks after generating the preview.

## Frame Processing Rules

- Process frames through a downsampled canvas.
- Avoid full-resolution pixel loops.
- Use background subtraction, edge density, saturation, central guide weighting, brightness, and frame motion for object isolation.
- Always retain sampled pixel RGB values for 3D color.
- Do not require perfect segmentation; fallback to central object-area samples when confidence is weak.

## Room Tracking Rules

- Use downsampled canvas frames.
- Detect corner-like feature points using local luma gradients.
- Match feature points frame-to-frame to simulate optical flow.
- Estimate camera movement direction, panning, tilt, and confidence.
- Maintain a camera path and scan coverage heatmap.
- Classify room samples as floor, wall, or object hints.
- Project colored samples into room-scale coordinates using the estimated pose.

## 3D Preview Rules

- Build a colored `BufferGeometry` point cloud from captured samples.
- Add light voxel particles using sampled colors.
- Use approximate depth and frame sweep to create inspectable volume.
- Provide orbit rotation, zoom, reset view, rotate buttons, and optional auto-rotate.
- Room preview must allow orbit, zoom, rotate, and pan.
- Room preview should include a virtual bounding box, floor/wall hints, camera path, point cloud, and voxel layer.
- Keep the preview feeling like radar reconstruction.

## Performance Limits

- Quick Scan: fewer frames and fewer points.
- Detail Scan: more frames, slower capture, more point detail.
- Full Room Scan: more frames, more features, denser room point cloud.
- Limit total retained frames and final point counts.
- Use requestAnimationFrame for scan timing.
- Use the room reconstruction Web Worker for final room point-cloud building when available.
- Use Three.js BufferGeometry and instancing for rendering.
- Cap device pixel ratio in the 3D canvas.

## Things To Avoid

- Do not claim true LiDAR or perfect 3D scanning.
- Do not claim room scans are metrically accurate.
- Do not make the scan monochrome; preserve camera colors.
- Do not clutter the camera feed with heavy controls.
- Do not process every pixel at full camera resolution.
- Do not keep camera streams alive after scan preview is generated.
