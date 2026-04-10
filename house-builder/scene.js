import * as THREE from "three";
import { OrbitControls } from "../threejs/three.js-master/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("scene");
const pieceCount = document.getElementById("piece-count");
const levelReadout = document.getElementById("level-readout");
const rotationReadout = document.getElementById("rotation-readout");
const levelText = document.getElementById("level-text");
const footprintReadout = document.getElementById("footprint-readout");
const modeReadout = document.getElementById("mode-readout");
const selectedPartReadout = document.getElementById("selected-part-readout");
const summaryPart = document.getElementById("summary-part");
const summarySize = document.getElementById("summary-size");
const statusPill = document.getElementById("status-pill");
const paletteReadout = document.getElementById("palette-readout");
const areaReadout = document.getElementById("area-readout");

const toolCards = [...document.querySelectorAll(".tool-card")];
const swatchChips = [...document.querySelectorAll(".swatch-chip")];
const viewChips = [...document.querySelectorAll(".view-chip")];
const rotateButton = document.getElementById("rotate-button");
const eraseButton = document.getElementById("erase-button");
const resetButton = document.getElementById("reset-button");
const levelUpButton = document.getElementById("level-up");
const levelDownButton = document.getElementById("level-down");

const sizeXInput = document.getElementById("size-x");
const sizeYInput = document.getElementById("size-y");
const sizeZInput = document.getElementById("size-z");
const sizeXValue = document.getElementById("size-x-value");
const sizeYValue = document.getElementById("size-y-value");
const sizeZValue = document.getElementById("size-z-value");

const cellSize = 2;
const seamOverlap = 0.08;
const baseFloorThickness = 0.18;
const baseWallHeight = 2.0;
const baseStoryHeight = baseWallHeight;
const placements = new Map();
const placedMeshes = [];
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const buildPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersection = new THREE.Vector3();
const cameraRig = {
  currentPosition: new THREE.Vector3(16, 13, 18),
  targetPosition: new THREE.Vector3(16, 13, 18),
  currentLookAt: new THREE.Vector3(0, 3, 0),
  targetLookAt: new THREE.Vector3(0, 3, 0),
};
let isPresetAnimating = false;

const palettePresets = {
  clay: {
    label: "Clay",
    sceneBackground: 0xf4ede1,
    fog: 0xf4ede1,
    hemiSky: 0xfff5dd,
    hemiGround: 0xb08c65,
    pointLight: 0xb2cad2,
    platform: 0xe3cba4,
    gridMajor: 0xa9835f,
    gridMinor: 0xcbb79e,
    floor: 0xd6af79,
    wall: 0xf7f0e7,
    window: 0xa7ccd5,
    door: 0x7b4c37,
    column: 0x83936f,
    roof: 0xb45a3c,
    preview: 0xd8b17e,
  },
  studio: {
    label: "Studio",
    sceneBackground: 0xe9edf3,
    fog: 0xe9edf3,
    hemiSky: 0xf8fbff,
    hemiGround: 0x9aa8b7,
    pointLight: 0x8fb0dd,
    platform: 0xd8dde5,
    gridMajor: 0x90a0b5,
    gridMinor: 0xc4cfdb,
    floor: 0xc8d0db,
    wall: 0xfafbfd,
    window: 0xb9d7ef,
    door: 0x6f7d95,
    column: 0x9ea8b4,
    roof: 0x8699b3,
    preview: 0x9eb6d7,
  },
  forest: {
    label: "Forest",
    sceneBackground: 0xebeee5,
    fog: 0xebeee5,
    hemiSky: 0xf2f4eb,
    hemiGround: 0x7a7f5b,
    pointLight: 0xb5c8ab,
    platform: 0xcdbb98,
    gridMajor: 0x7b735b,
    gridMinor: 0xb8b39e,
    floor: 0xbea37e,
    wall: 0xf2eee5,
    window: 0xb2cec4,
    door: 0x6b5847,
    column: 0x708565,
    roof: 0x8a624a,
    preview: 0x92a57d,
  },
  night: {
    label: "Night",
    sceneBackground: 0x1c2230,
    fog: 0x1c2230,
    hemiSky: 0x6a7797,
    hemiGround: 0x141824,
    pointLight: 0x8db9ff,
    platform: 0x404a5c,
    gridMajor: 0x6f82a0,
    gridMinor: 0x4a5469,
    floor: 0x7e8697,
    wall: 0xd6dbe5,
    window: 0x8cb9ff,
    door: 0x5d4d48,
    column: 0x8b987d,
    roof: 0x6f7487,
    preview: 0x9db7ea,
  },
};

const scene = new THREE.Scene();
let activePalette = "clay";
scene.background = new THREE.Color(palettePresets[activePalette].sceneBackground);
scene.fog = new THREE.Fog(palettePresets[activePalette].fog, 28, 62);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
camera.position.copy(cameraRig.currentPosition);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.copy(cameraRig.currentLookAt);
controls.minDistance = 10;
controls.maxDistance = 42;
controls.maxPolarAngle = Math.PI / 2.04;

const hemi = new THREE.HemisphereLight(
  palettePresets[activePalette].hemiSky,
  palettePresets[activePalette].hemiGround,
  1.8
);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(16, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);

const fillLight = new THREE.PointLight(palettePresets[activePalette].pointLight, 40, 66);
fillLight.position.set(-12, 10, -10);
scene.add(fillLight);

const world = new THREE.Group();
scene.add(world);

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(18, 20, 1.8, 64),
  new THREE.MeshStandardMaterial({
    color: 0xe3cba4,
    roughness: 0.96,
    metalness: 0.04,
  })
);
platform.position.y = -0.9;
platform.receiveShadow = true;
world.add(platform);

const buildSurface = new THREE.Mesh(
  new THREE.PlaneGeometry(48, 48),
  new THREE.MeshStandardMaterial({
    color: 0xf0e5d1,
    transparent: true,
    opacity: 0.08,
  })
);
buildSurface.rotation.x = -Math.PI / 2;
buildSurface.position.y = 0.001;
world.add(buildSurface);

const skyBackdrop = new THREE.Mesh(
  new THREE.SphereGeometry(80, 48, 48),
  new THREE.MeshBasicMaterial({
    color: 0x90a8b8,
    side: THREE.BackSide,
  })
);
scene.add(skyBackdrop);

const grid = new THREE.GridHelper(48, 24, 0xa9835f, 0xcbb79e);
grid.position.y = 0.01;
world.add(grid);
const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];

const partsGroup = new THREE.Group();
world.add(partsGroup);

const partConfigs = {
  floor: {
    label: "Floor Plate",
    category: "floor",
    previewColor: 0xd8b17e,
    size: { x: [1, 6], y: [1, 2], z: [1, 6] },
    dimensions: (size) => ({
      width: size.x * cellSize - 0.12,
      height: baseFloorThickness + (size.y - 1) * 0.12,
      depth: size.z * cellSize - 0.12,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xd6af79, roughness: 0.88 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.floor.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.floor.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  wall: {
    label: "Wall Panel",
    category: "body",
    previewColor: 0xf6eee3,
    size: { x: [1, 6], y: [1, 5], z: [1, 2] },
    dimensions: (size) => ({
      width: size.x * cellSize - 0.12,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.8,
      depth: 0.22 + (size.z - 1) * 0.42,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xf7f0e7, roughness: 0.78 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.wall.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.wall.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  window: {
    label: "Window",
    category: "body",
    previewColor: 0x9cbfcb,
    size: { x: [1, 5], y: [1, 4], z: [1, 2] },
    dimensions: (size) => ({
      width: Math.max(1, size.x) * cellSize - 0.18,
      height: 1.4 + (size.y - 1) * 0.55,
      depth: 0.16 + (size.z - 1) * 0.22,
    }),
    material: () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xa7ccd5,
        transparent: true,
        opacity: 0.84,
        roughness: 0.14,
        metalness: 0.08,
        transmission: 0.18,
      }),
    positionY: (level, size) => level * baseStoryHeight + 0.72 + (size.y - 1) * 0.3,
    buildGeometry: (size) => {
      const dim = partConfigs.window.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  door: {
    label: "Door",
    category: "body",
    previewColor: 0x7f513a,
    size: { x: [1, 3], y: [1, 4], z: [1, 2] },
    dimensions: (size) => ({
      width: 1 + (size.x - 1) * 0.7,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.55,
      depth: 0.18 + (size.z - 1) * 0.18,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0x7b4c37, roughness: 0.76 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.door.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.door.dimensions(size);
      return new THREE.BoxGeometry(dim.width, dim.height, dim.depth);
    },
  },
  column: {
    label: "Column",
    category: "body",
    previewColor: 0x7e8e69,
    size: { x: [1, 2], y: [1, 5], z: [1, 2] },
    dimensions: (size) => ({
      radius: 0.12 + (size.x - 1) * 0.14,
      height: baseWallHeight + seamOverlap + (size.y - 1) * 0.8,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0x83936f, roughness: 0.72 }),
    positionY: (level, size) => level * baseStoryHeight + partConfigs.column.dimensions(size).height / 2,
    buildGeometry: (size) => {
      const dim = partConfigs.column.dimensions(size);
      return new THREE.CylinderGeometry(dim.radius, dim.radius, dim.height, 20);
    },
  },
  roof: {
    label: "Roof Volume",
    category: "roof",
    previewColor: 0xb45a3c,
    size: { x: [1, 5], y: [1, 4], z: [1, 5] },
    dimensions: (size) => ({
      radius: 1.1 + (size.x - 1) * 0.62,
      height: 1 + (size.y - 1) * 0.6,
      depthScale: 1 + (size.z - 1) * 0.28,
    }),
    material: () => new THREE.MeshStandardMaterial({ color: 0xb45a3c, roughness: 0.86 }),
    positionY: (level, size) => level * baseStoryHeight + baseWallHeight + 0.78 + (size.y - 1) * 0.25,
    buildGeometry: (size) => {
      const dim = partConfigs.roof.dimensions(size);
      return new THREE.ConeGeometry(dim.radius, dim.height, 4);
    },
    afterCreate: (mesh, size) => {
      mesh.rotation.y += Math.PI / 4;
      mesh.scale.z = 1 + (size.z - 1) * 0.28;
    },
  },
};

const sizeState = {
  floor: { x: 2, y: 1, z: 2 },
  wall: { x: 2, y: 2, z: 1 },
  window: { x: 2, y: 2, z: 1 },
  door: { x: 1, y: 2, z: 1 },
  column: { x: 1, y: 2, z: 1 },
  roof: { x: 2, y: 2, z: 2 },
};

let activePart = "floor";
let eraseMode = false;
let currentLevel = 0;
let currentRotation = 0;

const previewMaterial = new THREE.MeshStandardMaterial({
  color: palettePresets[activePalette].preview,
  transparent: true,
  opacity: 0.42,
});

let previewMesh = createPreviewMesh(activePart);
world.add(previewMesh);

function getActiveSize() {
  return sizeState[activePart];
}

function getCurrentPartConfig() {
  return partConfigs[activePart];
}

function getPaletteColor(partName) {
  return palettePresets[activePalette][partName];
}

function setCanvasSize() {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function clampSizeForPart(partName, axis, value) {
  const [min, max] = partConfigs[partName].size[axis];
  return Math.max(min, Math.min(max, value));
}

function syncSizeInputs() {
  const config = getCurrentPartConfig();
  const size = getActiveSize();

  sizeXInput.min = String(config.size.x[0]);
  sizeXInput.max = String(config.size.x[1]);
  sizeYInput.min = String(config.size.y[0]);
  sizeYInput.max = String(config.size.y[1]);
  sizeZInput.min = String(config.size.z[0]);
  sizeZInput.max = String(config.size.z[1]);

  sizeXInput.value = String(size.x);
  sizeYInput.value = String(size.y);
  sizeZInput.value = String(size.z);

  sizeXValue.textContent = String(size.x);
  sizeYValue.textContent = String(size.y);
  sizeZValue.textContent = String(size.z);
}

function getPlacementSpan(size) {
  return {
    x: size.x,
    z: size.z,
  };
}

function snapToGrid(value, span) {
  const offset = span % 2 === 0 ? cellSize / 2 : 0;
  return Math.round((value - offset) / cellSize) * cellSize + offset;
}

function createMesh(partName, size) {
  const config = partConfigs[partName];
  const mesh = new THREE.Mesh(config.buildGeometry(size), config.material(size));
  mesh.material.color.setHex(getPaletteColor(partName));
  if (partName === "window" && "emissive" in mesh.material) {
    mesh.material.emissive.setHex(getPaletteColor(partName));
    mesh.material.emissiveIntensity = activePalette === "night" ? 0.22 : 0.05;
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (config.afterCreate) {
    config.afterCreate(mesh, size);
  }
  return mesh;
}

function createPreviewMesh(partName) {
  const config = partConfigs[partName];
  const size = sizeState[partName];
  const mesh = new THREE.Mesh(config.buildGeometry(size), previewMaterial);
  mesh.material.color.setHex(getPaletteColor(partName));
  if (config.afterCreate) {
    config.afterCreate(mesh, size);
  }
  return mesh;
}

function rebuildPreviewMesh() {
  const lastPosition = previewMesh ? previewMesh.position.clone() : new THREE.Vector3();

  if (previewMesh) {
    world.remove(previewMesh);
    previewMesh.geometry.dispose();
  }

  previewMesh = createPreviewMesh(activePart);
  previewMesh.position.copy(lastPosition);
  previewMesh.visible = !eraseMode;
  world.add(previewMesh);
  updatePreviewTransform();
}

function formatFootprint(size) {
  return `${size.x} x ${size.z}`;
}

function formatVolume(size) {
  return `${size.x} x ${size.y} x ${size.z}`;
}

function updateHud() {
  const size = getActiveSize();
  const label = getCurrentPartConfig().label;
  const totalFloorArea = placedMeshes
    .filter((mesh) => mesh.userData.part === "floor")
    .reduce((sum, mesh) => sum + mesh.userData.size.x * mesh.userData.size.z * 4, 0);

  pieceCount.textContent = String(placedMeshes.length);
  levelReadout.textContent = String(currentLevel + 1);
  levelText.textContent = `Level ${currentLevel + 1}`;
  rotationReadout.textContent = `${Math.round(THREE.MathUtils.radToDeg(currentRotation % (Math.PI * 2)))}deg`;
  footprintReadout.textContent = formatFootprint(size);
  modeReadout.textContent = eraseMode ? "Erase" : "Build";
  selectedPartReadout.textContent = label;
  summaryPart.textContent = label;
  summarySize.textContent = formatVolume(size);
  paletteReadout.textContent = palettePresets[activePalette].label;
  areaReadout.textContent = `${totalFloorArea} sqm`;
  statusPill.textContent = eraseMode ? "Click a placed module to remove it" : "Ready to place";
  eraseButton.classList.toggle("is-active", eraseMode);
}

function updatePreviewTransform(x = previewMesh.position.x, z = previewMesh.position.z) {
  const size = getActiveSize();
  const config = getCurrentPartConfig();
  const span = getPlacementSpan(size);
  const snappedX = snapToGrid(x, span.x);
  const snappedZ = snapToGrid(z, span.z);

  previewMesh.position.set(snappedX, config.positionY(currentLevel, size), snappedZ);
  previewMesh.rotation.set(0, currentRotation, 0);

  if (config.afterCreate) {
    config.afterCreate(previewMesh, size);
  }
}

function setActivePart(partName) {
  activePart = partName;
  eraseMode = false;
  toolCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.part === partName);
  });
  syncSizeInputs();
  rebuildPreviewMesh();
  updateHud();
}

function applyPaletteToScene() {
  const palette = palettePresets[activePalette];
  scene.background.setHex(palette.sceneBackground);
  scene.fog.color.setHex(palette.fog);
  hemi.color.setHex(palette.hemiSky);
  hemi.groundColor.setHex(palette.hemiGround);
  fillLight.color.setHex(palette.pointLight);
  platform.material.color.setHex(palette.platform);
  buildSurface.material.color.setHex(palette.platform);
  skyBackdrop.material.color.setHex(palette.pointLight);
  if (gridMaterials[0]) {
    gridMaterials[0].color.setHex(palette.gridMajor);
  }
  if (gridMaterials[1]) {
    gridMaterials[1].color.setHex(palette.gridMinor);
  }
  previewMaterial.color.setHex(getPaletteColor(activePart));

  placedMeshes.forEach((mesh) => {
    const partName = mesh.userData.part;
    mesh.material.dispose();
    mesh.material = partConfigs[partName].material(mesh.userData.size);
    mesh.material.color.setHex(getPaletteColor(partName));
    if (partName === "window" && "emissive" in mesh.material) {
      mesh.material.emissive.setHex(getPaletteColor(partName));
      mesh.material.emissiveIntensity = activePalette === "night" ? 0.22 : 0.05;
    }
  });

  updateHud();
}

function setPalette(paletteName) {
  activePalette = paletteName;
  swatchChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.palette === paletteName);
  });
  applyPaletteToScene();
  rebuildPreviewMesh();
}

function setViewPreset(viewName) {
  const presets = {
    perspective: {
      position: new THREE.Vector3(16, 13, 18),
      lookAt: new THREE.Vector3(0, 3, 0),
    },
    top: {
      position: new THREE.Vector3(0, 30, 0.01),
      lookAt: new THREE.Vector3(0, 0, 0),
    },
    front: {
      position: new THREE.Vector3(0, 8, 24),
      lookAt: new THREE.Vector3(0, 4, 0),
    },
    detail: {
      position: new THREE.Vector3(8, 6, 8),
      lookAt: new THREE.Vector3(0, 2, 0),
    },
  };

  const preset = presets[viewName];
  if (!preset) {
    return;
  }

  viewChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.view === viewName);
  });

  cameraRig.targetPosition.copy(preset.position);
  cameraRig.targetLookAt.copy(preset.lookAt);
  isPresetAnimating = true;
}

function rotatePiece() {
  currentRotation += Math.PI / 2;
  updatePreviewTransform();
  updateHud();
}

function getFootprintCells(centerX, centerZ, size) {
  const cells = [];
  const startX = centerX - ((size.x - 1) * cellSize) / 2;
  const startZ = centerZ - ((size.z - 1) * cellSize) / 2;

  for (let ix = 0; ix < size.x; ix += 1) {
    for (let iz = 0; iz < size.z; iz += 1) {
      cells.push({
        x: startX + ix * cellSize,
        z: startZ + iz * cellSize,
      });
    }
  }

  return cells;
}

function getPlacementKey(centerX, centerZ, level, category) {
  return `${centerX}:${centerZ}:${level}:${category}`;
}

function placeCurrentPart() {
  const config = getCurrentPartConfig();
  const size = { ...getActiveSize() };
  const centerX = previewMesh.position.x;
  const centerZ = previewMesh.position.z;
  const key = getPlacementKey(centerX, centerZ, currentLevel, config.category);

  if (placements.has(key)) {
    const oldMesh = placements.get(key);
    partsGroup.remove(oldMesh);
    placedMeshes.splice(placedMeshes.indexOf(oldMesh), 1);
    placements.delete(key);
  }

  const mesh = createMesh(activePart, size);
  mesh.position.set(centerX, config.positionY(currentLevel, size), centerZ);
  mesh.rotation.y += currentRotation;
  mesh.userData = {
    key,
    part: activePart,
    level: currentLevel,
    size,
    footprint: getFootprintCells(centerX, centerZ, size),
  };

  partsGroup.add(mesh);
  placedMeshes.push(mesh);
  placements.set(key, mesh);
  updateHud();
}

function updatePointerFromEvent(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
}

function updatePreviewPosition(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.ray.intersectPlane(buildPlane, intersection)) {
    updatePreviewTransform(intersection.x, intersection.z);
  }
}

function eraseAtPointer(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(placedMeshes, false);

  if (!hits.length) {
    return;
  }

  const mesh = hits[0].object;
  placements.delete(mesh.userData.key);
  partsGroup.remove(mesh);
  placedMeshes.splice(placedMeshes.indexOf(mesh), 1);
  updateHud();
}

function resetScene() {
  placedMeshes.splice(0).forEach((mesh) => {
    partsGroup.remove(mesh);
  });
  placements.clear();
  updateHud();
}

function handleSizeInput(axis, value) {
  sizeState[activePart][axis] = clampSizeForPart(activePart, axis, Number(value));
  syncSizeInputs();
  rebuildPreviewMesh();
  updateHud();
}

toolCards.forEach((card) => {
  card.addEventListener("click", () => {
    setActivePart(card.dataset.part);
  });
});

swatchChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setPalette(chip.dataset.palette);
  });
});

viewChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setViewPreset(chip.dataset.view);
  });
});

rotateButton.addEventListener("click", rotatePiece);

eraseButton.addEventListener("click", () => {
  eraseMode = !eraseMode;
  previewMesh.visible = !eraseMode;
  updateHud();
});

resetButton.addEventListener("click", resetScene);

levelUpButton.addEventListener("click", () => {
  currentLevel = Math.min(currentLevel + 1, 5);
  updatePreviewTransform();
  updateHud();
});

levelDownButton.addEventListener("click", () => {
  currentLevel = Math.max(currentLevel - 1, 0);
  updatePreviewTransform();
  updateHud();
});

sizeXInput.addEventListener("input", (event) => handleSizeInput("x", event.target.value));
sizeYInput.addEventListener("input", (event) => handleSizeInput("y", event.target.value));
sizeZInput.addEventListener("input", (event) => handleSizeInput("z", event.target.value));

canvas.addEventListener("pointermove", updatePreviewPosition);

canvas.addEventListener("click", (event) => {
  if (eraseMode) {
    eraseAtPointer(event);
    return;
  }

  placeCurrentPart();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "r") {
    rotatePiece();
  }

  if (key === "e") {
    currentLevel = Math.min(currentLevel + 1, 5);
    updatePreviewTransform();
    updateHud();
  }

  if (key === "q") {
    currentLevel = Math.max(currentLevel - 1, 0);
    updatePreviewTransform();
    updateHud();
  }
});

controls.addEventListener("start", () => {
  isPresetAnimating = false;
  cameraRig.currentPosition.copy(camera.position);
  cameraRig.targetPosition.copy(camera.position);
  cameraRig.currentLookAt.copy(controls.target);
  cameraRig.targetLookAt.copy(controls.target);
});

window.addEventListener("resize", setCanvasSize);

const clouds = [];
for (let i = 0; i < 8; i += 1) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(0.8 + Math.random() * 1.4, 18, 18),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.24,
      roughness: 1,
    })
  );
  cloud.position.set(-18 + i * 5.2, 12 + Math.sin(i * 0.7) * 1.4, -14 + Math.cos(i) * 4);
  cloud.scale.set(1.8, 0.8, 1.2);
  scene.add(cloud);
  clouds.push(cloud);
}

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  clouds.forEach((cloud, index) => {
    cloud.position.x += Math.sin(elapsed * 0.08 + index) * 0.002;
    cloud.position.z += Math.cos(elapsed * 0.05 + index) * 0.0015;
  });

  if (isPresetAnimating) {
    cameraRig.currentPosition.lerp(cameraRig.targetPosition, 0.06);
    cameraRig.currentLookAt.lerp(cameraRig.targetLookAt, 0.06);
    camera.position.copy(cameraRig.currentPosition);
    controls.target.copy(cameraRig.currentLookAt);

    if (
      cameraRig.currentPosition.distanceTo(cameraRig.targetPosition) < 0.05 &&
      cameraRig.currentLookAt.distanceTo(cameraRig.targetLookAt) < 0.05
    ) {
      isPresetAnimating = false;
      cameraRig.currentPosition.copy(cameraRig.targetPosition);
      cameraRig.currentLookAt.copy(cameraRig.targetLookAt);
      camera.position.copy(cameraRig.targetPosition);
      controls.target.copy(cameraRig.targetLookAt);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

syncSizeInputs();

try {
  setCanvasSize();
  applyPaletteToScene();
  updatePreviewTransform();
  updateHud();
  animate();
} catch (error) {
  console.error(error);
  statusPill.textContent = "Scene failed to load";
  canvas.style.minHeight = "420px";
  canvas.style.background =
    "linear-gradient(180deg, rgba(248, 236, 228, 0.95), rgba(233, 221, 210, 0.95))";
}
