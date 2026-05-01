import * as THREE from "three";
import { OrbitControls } from "../threejs/three.js-master/examples/jsm/controls/OrbitControls.js";

const gsap = window.gsap;

function createFallbackStore(stateCreator) {
  let state;
  const listeners = new Set();
  const api = {
    setState(partial, replace = false) {
      const next = typeof partial === "function" ? partial(state) : partial;
      state = replace ? next : { ...state, ...next };
      listeners.forEach((listener) => listener(state));
    },
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  state = stateCreator(api.setState, api.getState, api);
  return api;
}

let createStore = createFallbackStore;
try {
  const zustand = await import("https://esm.sh/zustand@4.5.5/vanilla");
  if (zustand.createStore) createStore = zustand.createStore;
} catch (error) {
  console.warn("Zustand CDN unavailable, using local store fallback.", error);
}

const BUILDINGS = [
  {
    id: "command",
    name: "Command Center",
    shortName: "Command",
    tag: "Home / State Router",
    color: 0xf3b65d,
    position: [0, 0, 0],
    size: [2.8, 1.9, 2.8],
    dossier: "Central control UI, state routing, and launch access for every system in the world.",
  },
  {
    id: "intelligence",
    name: "Global Intelligence Center",
    shortName: "Intel",
    tag: "AI News / Geopolitics",
    color: 0x48d5c5,
    position: [-6.4, 0, -4.6],
    size: [2.3, 3.2, 2.3],
    dossier: "Live event clustering, regional signal monitoring, urgency scoring, and AI-style insights.",
  },
  {
    id: "market",
    name: "Market Analytics Center",
    shortName: "Market",
    tag: "Stocks / Prediction",
    color: 0x79d37b,
    position: [6.1, 0, -4.2],
    size: [2.6, 2.8, 2.1],
    dossier: "Market pulse, volatility movement, sector heat, and prediction confidence.",
  },
  {
    id: "infrastructure",
    name: "Infrastructure Monitor",
    shortName: "Infra",
    tag: "Systems / Telemetry",
    color: 0x9d8cff,
    position: [-5.7, 0, 4.8],
    size: [2.4, 2.6, 2.4],
    dossier: "Node health, network load, data latency, and live system throughput.",
  },
  {
    id: "projects",
    name: "Project Hub",
    shortName: "Projects",
    tag: "Portfolio / Launches",
    color: 0xef6d64,
    position: [6.2, 0, 4.7],
    size: [2.5, 2.4, 2.6],
    dossier: "Portfolio access, project systems, experiments, and external launch paths.",
  },
];

const REGION_POINTS = {
  "North America": { x: 20, y: 37 },
  Europe: { x: 47, y: 32 },
  Asia: { x: 67, y: 40 },
  "Middle East": { x: 56, y: 47 },
  Africa: { x: 50, y: 61 },
  "Latin America": { x: 30, y: 66 },
  Oceania: { x: 78, y: 68 },
  Global: { x: 52, y: 48 },
};

const COUNTRY_REGIONS = {
  "United States": "North America",
  Canada: "North America",
  Mexico: "North America",
  Brazil: "Latin America",
  Argentina: "Latin America",
  "United Kingdom": "Europe",
  France: "Europe",
  Germany: "Europe",
  Italy: "Europe",
  Spain: "Europe",
  Hungary: "Europe",
  Ukraine: "Europe",
  Russia: "Europe",
  China: "Asia",
  Japan: "Asia",
  India: "Asia",
  Korea: "Asia",
  Singapore: "Asia",
  Israel: "Middle East",
  Turkey: "Middle East",
  Iran: "Middle East",
  "Saudi Arabia": "Middle East",
  Egypt: "Africa",
  Nigeria: "Africa",
  "South Africa": "Africa",
  Australia: "Oceania",
};

const CATEGORY_KEYWORDS = [
  ["Energy", ["energy", "oil", "gas", "power", "grid", "opec", "solar", "nuclear"]],
  ["Markets", ["market", "stock", "bond", "currency", "inflation", "rates", "bank", "trade"]],
  ["Security", ["security", "defense", "missile", "military", "cyber", "attack", "war", "border"]],
  ["Politics", ["election", "minister", "policy", "government", "parliament", "summit", "vote"]],
  ["Technology", ["ai", "chip", "data", "software", "robot", "satellite", "semiconductor"]],
  ["Climate", ["climate", "storm", "flood", "heat", "water", "wildfire", "weather"]],
];

const seedFeed = [
  makeEvent("Energy route volatility rising near key shipping lanes", "Middle East", "Energy", "negative", 88, "Synthetic Monitor"),
  makeEvent("Central banks signal cautious rate posture after fresh inflation prints", "Europe", "Markets", "neutral", 63, "Synthetic Monitor"),
  makeEvent("AI infrastructure investment accelerates across cloud providers", "North America", "Technology", "positive", 54, "Synthetic Monitor"),
  makeEvent("Regional election monitoring flags information integrity pressure", "Asia", "Politics", "negative", 74, "Synthetic Monitor"),
  makeEvent("Grid reliability teams report improved reserve margins", "North America", "Infrastructure", "positive", 42, "Synthetic Monitor"),
  makeEvent("Severe weather disruption creates logistics bottlenecks", "Latin America", "Climate", "negative", 69, "Synthetic Monitor"),
];

const initialFeed = seedFeed.map((event, index) => ({ ...event, id: `seed-${index}` }));

const store = createStore((set, get) => ({
  mode: "world",
  activeBuilding: "command",
  hoveredBuilding: null,
  feed: initialFeed,
  insights: generateInsights(initialFeed),
  source: "standby",
  lastSync: "Standby",
  orbit: false,
  market: createMarketState(),
  infra: createInfraState(),
  setHoveredBuilding(id) {
    set({ hoveredBuilding: id });
  },
  setActiveBuilding(id) {
    set({ activeBuilding: id });
  },
  setMode(mode) {
    set({ mode });
  },
  setOrbit(orbit) {
    set({ orbit });
  },
  setFeed(feed, source) {
    set({
      feed,
      source,
      lastSync: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      insights: generateInsights(feed),
    });
  },
  tickFeed() {
    const state = get();
    const nextEvent = generateSyntheticEvent();
    const feed = [nextEvent, ...state.feed].slice(0, 18);
    set({
      feed,
      source: state.source === "standby" ? "local stream" : state.source,
      lastSync: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      insights: generateInsights(feed),
    });
  },
  tickMarket() {
    set({ market: updateMarketState(get().market) });
  },
  tickInfra() {
    set({ infra: updateInfraState(get().infra) });
  },
}));

const els = {
  canvas: document.getElementById("worldCanvas"),
  labels: document.getElementById("worldLabels"),
  modeReadout: document.getElementById("modeReadout"),
  focusReadout: document.getElementById("focusReadout"),
  feedReadout: document.getElementById("feedReadout"),
  fpsReadout: document.getElementById("fpsReadout"),
  dossierKicker: document.getElementById("dossierKicker"),
  dossierTitle: document.getElementById("dossierTitle"),
  dossierText: document.getElementById("dossierText"),
  enterButton: document.getElementById("enterButton"),
  orbitButton: document.getElementById("orbitButton"),
  exitButton: document.getElementById("exitButton"),
  dashboardShell: document.getElementById("dashboardShell"),
  dashboardKicker: document.getElementById("dashboardKicker"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  dashboardContent: document.getElementById("dashboardContent"),
  transitionCurtain: document.getElementById("transitionCurtain"),
  transitionLabel: document.getElementById("transitionLabel"),
};

const world = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  player: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(99, 99),
  keys: new Set(),
  clock: new THREE.Clock(),
  interactive: [],
  buildingGroups: new Map(),
  labelNodes: new Map(),
  cameraTarget: new THREE.Vector3(),
  cameraLook: new THREE.Vector3(),
  dashboardCameraLock: false,
  frameCounter: { frames: 0, last: performance.now() },
};

boot();

function boot() {
  initWorld();
  initLabels();
  bindUI();
  bindStore();
  startDataSystems();
  animate();
}

function initWorld() {
  world.renderer = new THREE.WebGLRenderer({
    canvas: els.canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  world.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  world.renderer.setSize(window.innerWidth, window.innerHeight);
  world.renderer.outputColorSpace = THREE.SRGBColorSpace;
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  world.scene = new THREE.Scene();
  world.scene.fog = new THREE.FogExp2(0x111412, 0.034);

  world.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 160);
  world.camera.position.set(0, 7.4, 10.8);
  world.cameraLook.set(0, 0.7, 0);
  world.camera.lookAt(world.cameraLook);

  const hemi = new THREE.HemisphereLight(0xf4f6ef, 0x111412, 1.7);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(7, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -18;
  key.shadow.camera.right = 18;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  const tealLight = new THREE.PointLight(0x48d5c5, 15, 22);
  tealLight.position.set(-3, 5, -5);
  const amberLight = new THREE.PointLight(0xf3b65d, 12, 18);
  amberLight.position.set(5, 3, 5);
  world.scene.add(hemi, key, tealLight, amberLight);

  createGround();
  createPathNetwork();
  createBuildings();
  createPlayer();
  createAmbientField();

  world.controls = new OrbitControls(world.camera, els.canvas);
  world.controls.enabled = false;
  world.controls.enableDamping = true;
  world.controls.target.set(0, 0.4, 0);
  world.controls.maxPolarAngle = Math.PI * 0.46;
  world.controls.minDistance = 6;
  world.controls.maxDistance = 18;

  window.addEventListener("resize", resizeWorld);
  window.addEventListener("keydown", (event) => {
    world.keys.add(event.key.toLowerCase());
    if (event.key.toLowerCase() === "enter") enterActiveBuilding();
    if (event.key.toLowerCase() === "escape") exitDashboard();
  });
  window.addEventListener("keyup", (event) => world.keys.delete(event.key.toLowerCase()));
  els.canvas.addEventListener("pointermove", updatePointer);
  els.canvas.addEventListener("pointerleave", () => {
    world.pointer.set(99, 99);
    store.getState().setHoveredBuilding(null);
  });
  els.canvas.addEventListener("click", () => {
    const hit = getHoveredBuilding();
    if (hit) enterBuilding(hit);
  });
}

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 34, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x171a17,
      roughness: 0.84,
      metalness: 0.18,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.scene.add(ground);

  const grid = new THREE.GridHelper(32, 32, 0x48d5c5, 0x29312c);
  grid.position.y = 0.012;
  grid.material.opacity = 0.22;
  grid.material.transparent = true;
  world.scene.add(grid);

  const ringGeometry = new THREE.RingGeometry(4.1, 4.18, 96);
  const ring = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshBasicMaterial({ color: 0xf3b65d, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  world.scene.add(ring);
}

function createPathNetwork() {
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfe3d8,
    roughness: 0.68,
    metalness: 0.12,
    transparent: true,
    opacity: 0.72,
  });
  const specs = [
    { x: 0, z: -2.4, w: 1, d: 6.2, r: 0 },
    { x: 0, z: 2.5, w: 1, d: 6.8, r: 0 },
    { x: -3.3, z: 0, w: 7, d: 1, r: 0 },
    { x: 3.3, z: 0, w: 7, d: 1, r: 0 },
    { x: -3.1, z: -2.35, w: 6.3, d: 0.72, r: -0.58 },
    { x: 3, z: -2.25, w: 6.2, d: 0.72, r: 0.55 },
    { x: -3, z: 2.45, w: 6.4, d: 0.72, r: 0.58 },
    { x: 3.1, z: 2.55, w: 6.1, d: 0.72, r: -0.56 },
  ];

  specs.forEach((spec) => {
    const path = new THREE.Mesh(new THREE.BoxGeometry(spec.w, 0.04, spec.d), pathMaterial);
    path.position.set(spec.x, 0.045, spec.z);
    path.rotation.y = spec.r;
    path.receiveShadow = true;
    world.scene.add(path);
  });
}

function createBuildings() {
  BUILDINGS.forEach((spec) => {
    const group = new THREE.Group();
    group.position.set(spec.position[0], 0, spec.position[2]);
    group.userData.spec = spec;

    const material = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.5,
      metalness: 0.28,
      emissive: spec.color,
      emissiveIntensity: 0.03,
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x242a25,
      roughness: 0.58,
      metalness: 0.34,
      emissive: spec.color,
      emissiveIntensity: 0.02,
    });

    const [width, height, depth] = spec.size;
    const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    base.position.y = height / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.buildingId = spec.id;
    group.add(base);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.34, depth * 0.72), darkMaterial);
    crown.position.y = height + 0.24;
    crown.castShadow = true;
    crown.userData.buildingId = spec.id;
    group.add(crown);

    if (spec.id === "intelligence") {
      addAntennaArray(group, spec.color, height);
    } else if (spec.id === "market") {
      addMarketBars(group, spec.color, height);
    } else if (spec.id === "infrastructure") {
      addInfraTowers(group, spec.color, height);
    } else if (spec.id === "projects") {
      addPortalFrame(group, spec.color, height);
    } else {
      addCommandBeacon(group, spec.color, height);
    }

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(width, depth) * 0.78, Math.max(width, depth) * 0.95, 0.08, 64),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.1 })
    );
    pad.position.y = 0.04;
    pad.userData.buildingId = spec.id;
    group.add(pad);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(width, depth) * 0.74, 0.025, 8, 72),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.36 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    group.add(ring);

    group.userData.materials = [material, darkMaterial];
    group.userData.ring = ring;
    group.userData.baseScale = 1;
    world.scene.add(group);
    world.buildingGroups.set(spec.id, group);
    world.interactive.push(base, crown, pad);
  });
}

function addAntennaArray(group, color, height) {
  const mastMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86 });
  for (let index = 0; index < 4; index += 1) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1 + index * 0.18, 10), mastMaterial);
    mast.position.set(-0.54 + index * 0.36, height + 0.92 + index * 0.08, 0.08);
    group.add(mast);
  }
}

function addMarketBars(group, color, height) {
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.16, roughness: 0.4 });
  [0.7, 1.1, 0.82, 1.36].forEach((barHeight, index) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, barHeight, 0.22), material);
    bar.position.set(-0.54 + index * 0.36, height + barHeight / 2, -0.82);
    bar.castShadow = true;
    group.add(bar);
  });
}

function addInfraTowers(group, color, height) {
  const material = new THREE.MeshStandardMaterial({ color: 0x242a25, emissive: color, emissiveIntensity: 0.16, roughness: 0.44 });
  [-0.72, 0.72].forEach((x) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.5, 6), material);
    tower.position.set(x, height + 0.64, 0);
    tower.castShadow = true;
    group.add(tower);
  });
}

function addPortalFrame(group, color, height) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.035, 8, 64), material);
  frame.position.set(0, height + 0.84, 0);
  frame.rotation.x = Math.PI / 2;
  group.add(frame);
}

function addCommandBeacon(group, color, height) {
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.44, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.28, metalness: 0.25 })
  );
  beacon.position.y = height + 0.8;
  group.add(beacon);
  group.userData.beacon = beacon;
}

function createPlayer() {
  world.player = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 0.7, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4f6ef, roughness: 0.38, metalness: 0.18 })
  );
  body.position.y = 0.42;
  body.castShadow = true;
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.12, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x48d5c5 })
  );
  visor.position.set(0, 0.68, -0.23);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.015, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x48d5c5, transparent: true, opacity: 0.52 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  world.player.add(body, visor, ring);
  world.player.position.set(0, 0, 2.6);
  world.scene.add(world.player);
}

function createAmbientField() {
  const material = new THREE.MeshBasicMaterial({ color: 0xf4f6ef, transparent: true, opacity: 0.2 });
  for (let index = 0; index < 42; index += 1) {
    const node = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), material);
    const angle = index * 1.71;
    const radius = 7.5 + (index % 9) * 0.42;
    node.position.set(Math.cos(angle) * radius, 1.6 + (index % 5) * 0.45, Math.sin(angle) * radius);
    node.userData.floatSpeed = 0.45 + (index % 7) * 0.04;
    node.userData.baseY = node.position.y;
    world.scene.add(node);
  }
}

function initLabels() {
  BUILDINGS.forEach((spec) => {
    const label = document.createElement("button");
    label.className = "location-tag";
    label.type = "button";
    label.dataset.id = spec.id;
    label.innerHTML = `<strong>${spec.name}</strong><small>${spec.tag}</small>`;
    label.addEventListener("pointerenter", () => store.getState().setHoveredBuilding(spec.id));
    label.addEventListener("pointerleave", () => store.getState().setHoveredBuilding(null));
    label.addEventListener("click", () => enterBuilding(spec.id));
    els.labels.append(label);
    world.labelNodes.set(spec.id, label);
  });
}

function bindUI() {
  els.enterButton.addEventListener("click", enterActiveBuilding);
  els.exitButton.addEventListener("click", exitDashboard);
  els.orbitButton.addEventListener("click", () => {
    const next = !store.getState().orbit;
    store.getState().setOrbit(next);
  });
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.jump;
      focusBuilding(id);
      store.getState().setActiveBuilding(id);
      store.getState().setHoveredBuilding(id);
    });
  });
}

function bindStore() {
  store.subscribe((state) => {
    updateHUD(state);
    updateBuildingHighlights(state);
    updateDashboardData(state);
  });
  updateHUD(store.getState());
  updateBuildingHighlights(store.getState());
}

function updateHUD(state) {
  const active = getBuilding(state.hoveredBuilding || state.activeBuilding);
  els.modeReadout.textContent = titleCase(state.mode);
  els.focusReadout.textContent = active.shortName;
  els.feedReadout.textContent = state.source;
  els.dossierTitle.textContent = active.name;
  els.dossierKicker.textContent = active.tag;
  els.dossierText.textContent = active.dossier;
  els.orbitButton.textContent = state.orbit ? "Follow" : "Orbit";

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.jump === state.activeBuilding);
  });

  world.labelNodes.forEach((label, id) => {
    label.classList.toggle("is-hovered", state.hoveredBuilding === id);
    label.classList.toggle("is-active", state.activeBuilding === id);
  });
}

function updateBuildingHighlights(state) {
  world.buildingGroups.forEach((group, id) => {
    const isActive = id === state.activeBuilding;
    const isHovered = id === state.hoveredBuilding;
    const intensity = isActive ? 0.2 : isHovered ? 0.32 : 0.035;
    group.userData.materials.forEach((material) => {
      material.emissiveIntensity += (intensity - material.emissiveIntensity) * 0.22;
    });
    group.userData.ring.material.opacity += ((isActive || isHovered ? 0.78 : 0.32) - group.userData.ring.material.opacity) * 0.2;
    const targetScale = isHovered ? 1.045 : 1;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.16);
  });
}

function updateDashboardData(state) {
  if (state.mode !== "dashboard") return;
  if (state.activeBuilding === "intelligence") renderIntelligenceData(state);
  if (state.activeBuilding === "market") renderMarketData(state);
  if (state.activeBuilding === "infrastructure") renderInfraData(state);
}

function updatePointer(event) {
  const rect = els.canvas.getBoundingClientRect();
  world.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  world.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  const hit = getHoveredBuilding();
  store.getState().setHoveredBuilding(hit);
  if (hit) store.getState().setActiveBuilding(hit);
}

function getHoveredBuilding() {
  world.raycaster.setFromCamera(world.pointer, world.camera);
  const intersections = world.raycaster.intersectObjects(world.interactive, false);
  return intersections[0]?.object?.userData?.buildingId || null;
}

function enterActiveBuilding() {
  const state = store.getState();
  enterBuilding(state.hoveredBuilding || state.activeBuilding);
}

function enterBuilding(id) {
  const spec = getBuilding(id);
  if (store.getState().mode === "transition") return;
  store.getState().setActiveBuilding(id);
  store.getState().setMode("transition");
  world.dashboardCameraLock = true;
  els.transitionLabel.textContent = `Entering ${spec.name}`;
  els.transitionCurtain.classList.add("is-active");

  const target = new THREE.Vector3(spec.position[0], 0.6, spec.position[2]);
  const cameraEnd = new THREE.Vector3(spec.position[0] + 2.2, 3.2, spec.position[2] + 3.5);

  if (gsap) {
    gsap.to(world.camera.position, {
      x: cameraEnd.x,
      y: cameraEnd.y,
      z: cameraEnd.z,
      duration: 1.05,
      ease: "power3.inOut",
      onUpdate: () => world.camera.lookAt(target),
    });
    gsap.to(world.player.position, {
      x: spec.position[0] * 0.82,
      z: spec.position[2] * 0.82,
      duration: 0.8,
      ease: "power2.out",
    });
  } else {
    world.camera.position.copy(cameraEnd);
    world.camera.lookAt(target);
  }

  window.setTimeout(() => {
    renderDashboard(id);
    els.dashboardShell.classList.add("is-open");
    store.getState().setMode("dashboard");
    window.location.hash = id;
    window.setTimeout(() => els.transitionCurtain.classList.remove("is-active"), 160);
  }, 760);
}

function exitDashboard() {
  if (store.getState().mode === "world") return;
  els.transitionLabel.textContent = "Returning to world";
  els.transitionCurtain.classList.add("is-active");
  window.setTimeout(() => {
    els.dashboardShell.classList.remove("is-open");
    store.getState().setMode("world");
    world.dashboardCameraLock = false;
    if (history.replaceState) history.replaceState(null, "", window.location.pathname);
    window.setTimeout(() => els.transitionCurtain.classList.remove("is-active"), 160);
  }, 320);
}

function focusBuilding(id) {
  const spec = getBuilding(id);
  const destination = new THREE.Vector3(spec.position[0] * 0.62, 0, spec.position[2] * 0.62);
  if (gsap) {
    gsap.to(world.player.position, {
      x: destination.x,
      z: destination.z,
      duration: 0.72,
      ease: "power2.out",
    });
  } else {
    world.player.position.copy(destination);
  }
}

function renderDashboard(id) {
  const spec = getBuilding(id);
  els.dashboardKicker.textContent = spec.tag;
  els.dashboardTitle.textContent = spec.name;
  if (id === "intelligence") renderIntelligenceShell();
  if (id === "market") renderMarketShell();
  if (id === "infrastructure") renderInfraShell();
  if (id === "projects") renderProjectsShell();
  if (id === "command") renderCommandShell();
  updateDashboardData(store.getState());
}

function renderIntelligenceShell() {
  els.dashboardContent.innerHTML = `
    <section class="dashboard-grid three-col">
      <article class="dashboard-panel">
        <div class="panel-title">
          <span>World Event Map</span>
          <span class="source-pill" data-source-pill>Syncing</span>
        </div>
        <div class="world-map" data-world-map>
          <span class="map-shape one"></span>
          <span class="map-shape two"></span>
          <span class="map-shape three"></span>
          <span class="map-shape four"></span>
        </div>
        <div class="cluster-band" data-cluster-band></div>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>Live Feed</span><span class="source-pill" data-sync-time>Standby</span></div>
        <div class="feed-list" data-feed-list></div>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>AI Insight Engine</span><span class="source-pill">Local</span></div>
        <div class="insight-list" data-insight-list></div>
      </article>
    </section>
  `;
}

function renderIntelligenceData(state) {
  const feedList = els.dashboardContent.querySelector("[data-feed-list]");
  const insightList = els.dashboardContent.querySelector("[data-insight-list]");
  const map = els.dashboardContent.querySelector("[data-world-map]");
  const clusterBand = els.dashboardContent.querySelector("[data-cluster-band]");
  const sourcePill = els.dashboardContent.querySelector("[data-source-pill]");
  const syncTime = els.dashboardContent.querySelector("[data-sync-time]");
  if (!feedList || !insightList || !map || !clusterBand) return;

  sourcePill.textContent = state.source;
  syncTime.textContent = state.lastSync;

  map.querySelectorAll(".event-node").forEach((node) => node.remove());
  state.feed.slice(0, 12).forEach((event) => {
    const point = REGION_POINTS[event.region] || REGION_POINTS.Global;
    const node = document.createElement("span");
    node.className = "event-node";
    node.style.left = `${point.x + hashToOffset(event.id, 6)}%`;
    node.style.top = `${point.y + hashToOffset(event.title, 5)}%`;
    node.dataset.urgency = event.urgency > 78 ? "high" : event.urgency > 55 ? "medium" : "low";
    node.title = event.title;
    map.append(node);
  });

  const clusters = countBy(state.feed, "category");
  clusterBand.innerHTML = Object.entries(clusters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, total]) => `<span>${category}<strong>${total}</strong></span>`)
    .join("");

  feedList.innerHTML = state.feed
    .slice(0, 8)
    .map(
      (event) => `
        <article class="event-row">
          <strong>${escapeHtml(event.title)}</strong>
          <div class="feed-meta">
            <span class="event-chip">${event.region}</span>
            <span class="event-chip">${event.category}</span>
            <span class="event-chip sentiment-${event.sentiment}">${event.sentiment}</span>
            <span class="event-chip">${event.urgency}% urgency</span>
            <span class="event-chip">${event.source}</span>
          </div>
        </article>
      `
    )
    .join("");

  insightList.innerHTML = state.insights
    .map(
      (insight) => `
        <article class="insight-card">
          <strong>${escapeHtml(insight.title)}</strong>
          <p>${escapeHtml(insight.body)}</p>
        </article>
      `
    )
    .join("");
}

function renderMarketShell() {
  els.dashboardContent.innerHTML = `
    <section class="dashboard-grid">
      <article class="dashboard-panel">
        <div class="panel-title"><span>Market Pulse</span><span class="source-pill">Live model</span></div>
        <canvas class="market-chart" id="marketChart" width="900" height="320"></canvas>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>Signals</span><span class="source-pill">AI projection</span></div>
        <div class="metric-grid" data-market-metrics></div>
      </article>
    </section>
  `;
}

function renderMarketData(state) {
  const target = els.dashboardContent.querySelector("[data-market-metrics]");
  const canvas = els.dashboardContent.querySelector("#marketChart");
  if (!target || !canvas) return;
  target.innerHTML = state.market.metrics
    .map(
      (metric) => `
        <article class="metric">
          <small>${metric.label}</small>
          <span class="metric-value">${metric.value}</span>
          <div class="metric-bar"><span style="--value: ${metric.score}%"></span></div>
        </article>
      `
    )
    .join("");
  drawLineChart(canvas, state.market.series, "#79d37b");
}

function renderInfraShell() {
  els.dashboardContent.innerHTML = `
    <section class="dashboard-grid">
      <article class="dashboard-panel">
        <div class="panel-title"><span>Infrastructure Health</span><span class="source-pill">Tracking</span></div>
        <canvas class="infra-chart" id="infraChart" width="900" height="320"></canvas>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>Telemetry</span><span class="source-pill">Node mesh</span></div>
        <div class="metric-grid" data-infra-metrics></div>
      </article>
    </section>
  `;
}

function renderInfraData(state) {
  const target = els.dashboardContent.querySelector("[data-infra-metrics]");
  const canvas = els.dashboardContent.querySelector("#infraChart");
  if (!target || !canvas) return;
  target.innerHTML = state.infra.metrics
    .map(
      (metric) => `
        <article class="metric">
          <small>${metric.label}</small>
          <span class="metric-value">${metric.value}</span>
          <div class="metric-bar"><span style="--value: ${metric.score}%"></span></div>
        </article>
      `
    )
    .join("");
  drawLineChart(canvas, state.infra.series, "#9d8cff");
}

function renderProjectsShell() {
  els.dashboardContent.innerHTML = `
    <section class="dashboard-grid">
      <article class="dashboard-panel">
        <div class="panel-title"><span>Project Hub</span><span class="source-pill">Launch paths</span></div>
        <div class="project-list">
          ${projectLinks()
            .map(
              (project) => `
                <article class="project-launch">
                  <span>
                    <strong>${project.title}</strong>
                    <p>${project.text}</p>
                  </span>
                  <a href="${project.href}">Open</a>
                </article>
              `
            )
            .join("")}
        </div>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>Portfolio Signals</span><span class="source-pill">System</span></div>
        <div class="metric-grid">
          <article class="metric"><small>Interactive systems</small><span class="metric-value">31</span><div class="metric-bar"><span style="--value: 86%"></span></div></article>
          <article class="metric"><small>3D worlds</small><span class="metric-value">12</span><div class="metric-bar"><span style="--value: 68%"></span></div></article>
          <article class="metric"><small>Tools</small><span class="metric-value">14</span><div class="metric-bar"><span style="--value: 74%"></span></div></article>
          <article class="metric"><small>Games</small><span class="metric-value">6</span><div class="metric-bar"><span style="--value: 42%"></span></div></article>
        </div>
      </article>
    </section>
  `;
}

function renderCommandShell() {
  els.dashboardContent.innerHTML = `
    <section class="dashboard-grid">
      <article class="dashboard-panel">
        <div class="panel-title"><span>Command Center</span><span class="source-pill">Home</span></div>
        <div class="metric-grid">
          <article class="metric"><small>World state</small><span class="metric-value">3</span><div class="metric-bar"><span style="--value: 100%"></span></div></article>
          <article class="metric"><small>Buildings online</small><span class="metric-value">5</span><div class="metric-bar"><span style="--value: 100%"></span></div></article>
          <article class="metric"><small>Data channels</small><span class="metric-value">4</span><div class="metric-bar"><span style="--value: 82%"></span></div></article>
          <article class="metric"><small>Transition sync</small><span class="metric-value">OK</span><div class="metric-bar"><span style="--value: 96%"></span></div></article>
        </div>
      </article>
      <article class="dashboard-panel">
        <div class="panel-title"><span>Launch Matrix</span><span class="source-pill">Routing</span></div>
        <div class="project-list">
          ${BUILDINGS.filter((building) => building.id !== "command")
            .map(
              (building) => `
                <article class="project-launch">
                  <span>
                    <strong>${building.name}</strong>
                    <p>${building.dossier}</p>
                  </span>
                  <a href="#${building.id}" data-route-building="${building.id}">Enter</a>
                </article>
              `
            )
            .join("")}
        </div>
      </article>
    </section>
  `;

  els.dashboardContent.querySelectorAll("[data-route-building]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      enterBuilding(link.dataset.routeBuilding);
    });
  });
}

function startDataSystems() {
  fetchLiveNews();
  window.setInterval(() => store.getState().tickFeed(), 6500);
  window.setInterval(() => store.getState().tickMarket(), 1800);
  window.setInterval(() => store.getState().tickInfra(), 2200);
  window.setInterval(fetchLiveNews, 90000);
}

async function fetchLiveNews() {
  const gdeltEndpoint =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=(geopolitical%20OR%20election%20OR%20energy%20OR%20market%20OR%20AI)&mode=artlist&format=json&maxrecords=18&sort=HybridRel&timespan=24h";
  const endpoint = `https://r.jina.ai/http://${gdeltEndpoint}`;
  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`Live feed ${response.status}`);
    const text = await response.text();
    const payload = parseReaderJson(text);
    const articles = Array.isArray(payload.articles) ? payload.articles : [];
    const feed = articles
      .filter((article) => article.title)
      .map((article, index) => articleToEvent(article, index))
      .slice(0, 18);
    if (!feed.length) throw new Error("No articles returned");
    store.getState().setFeed(feed, "GDELT live");
  } catch (error) {
    console.warn("Live feed unavailable, using local stream.", error);
    const state = store.getState();
    if (state.source === "standby") store.getState().setFeed(initialFeed, "local stream");
  }
}

function parseReaderJson(text) {
  const start = text.indexOf('{"articles"');
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON payload found");
  return JSON.parse(text.slice(start, end + 1));
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(world.clock.getDelta(), 0.05);
  updateMovement(delta);
  updateCamera(delta);
  updateLabels();
  updateWorldAnimation(delta);
  world.controls.update();
  updateFps();
  world.renderer.render(world.scene, world.camera);
}

function updateMovement(delta) {
  const state = store.getState();
  if (state.mode !== "world" || state.orbit) return;
  const direction = new THREE.Vector3();
  if (world.keys.has("w") || world.keys.has("arrowup")) direction.z -= 1;
  if (world.keys.has("s") || world.keys.has("arrowdown")) direction.z += 1;
  if (world.keys.has("a") || world.keys.has("arrowleft")) direction.x -= 1;
  if (world.keys.has("d") || world.keys.has("arrowright")) direction.x += 1;
  if (direction.lengthSq() === 0) return;
  direction.normalize();
  const speed = 4.2;
  world.player.position.addScaledVector(direction, speed * delta);
  world.player.position.x = THREE.MathUtils.clamp(world.player.position.x, -9.5, 9.5);
  world.player.position.z = THREE.MathUtils.clamp(world.player.position.z, -9.5, 9.5);
  world.player.rotation.y = Math.atan2(direction.x, direction.z);
}

function updateCamera() {
  const state = store.getState();
  if (state.mode !== "world" || world.dashboardCameraLock) return;

  world.controls.enabled = state.orbit;
  if (state.orbit) {
    world.controls.target.lerp(new THREE.Vector3(world.player.position.x, 0.4, world.player.position.z), 0.08);
    return;
  }

  world.cameraTarget.set(world.player.position.x, 6.8, world.player.position.z + 9.4);
  world.camera.position.lerp(world.cameraTarget, 0.07);
  world.cameraLook.set(world.player.position.x, 0.82, world.player.position.z);
  world.camera.lookAt(world.cameraLook);
}

function updateLabels() {
  BUILDINGS.forEach((spec) => {
    const label = world.labelNodes.get(spec.id);
    const group = world.buildingGroups.get(spec.id);
    if (!label || !group) return;
    const position = new THREE.Vector3(spec.position[0], spec.size[1] + 1.15, spec.position[2]);
    position.project(world.camera);
    const visible = position.z < 1;
    label.style.opacity = visible ? "1" : "0";
    label.style.left = `${(position.x * 0.5 + 0.5) * window.innerWidth}px`;
    label.style.top = `${(-position.y * 0.5 + 0.5) * window.innerHeight}px`;
  });
}

function updateWorldAnimation(delta) {
  const elapsed = world.clock.elapsedTime;
  world.buildingGroups.forEach((group, id) => {
    if (group.userData.beacon) {
      group.userData.beacon.rotation.y += delta * 0.9;
      group.userData.beacon.position.y = getBuilding(id).size[1] + 0.82 + Math.sin(elapsed * 1.5) * 0.08;
    }
    group.userData.ring.rotation.z += delta * 0.24;
  });
  world.scene.children.forEach((child) => {
    if (!child.userData.floatSpeed) return;
    child.position.y = child.userData.baseY + Math.sin(elapsed * child.userData.floatSpeed + child.position.x) * 0.12;
    child.rotation.y += delta * 0.2;
  });
}

function updateFps() {
  world.frameCounter.frames += 1;
  const now = performance.now();
  if (now - world.frameCounter.last < 600) return;
  const fps = Math.round((world.frameCounter.frames * 1000) / (now - world.frameCounter.last));
  els.fpsReadout.textContent = String(fps);
  world.frameCounter.frames = 0;
  world.frameCounter.last = now;
}

function resizeWorld() {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  world.renderer.setSize(window.innerWidth, window.innerHeight);
}

function getBuilding(id) {
  return BUILDINGS.find((building) => building.id === id) || BUILDINGS[0];
}

function titleCase(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function makeEvent(title, region, category, sentiment, urgency, source) {
  const point = REGION_POINTS[region] || REGION_POINTS.Global;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    region,
    category,
    sentiment,
    urgency,
    source,
    x: point.x,
    y: point.y,
  };
}

function articleToEvent(article, index) {
  const title = article.title || "Untitled event";
  const country = article.sourceCountry || article.sourcecountry || "";
  const region = inferRegion(country, title);
  const category = classifyCategory(title);
  const sentiment = classifySentiment(title);
  return {
    id: article.url || `${article.seendate || Date.now()}-${index}`,
    title,
    region,
    category,
    sentiment,
    urgency: calculateUrgency(title, category, sentiment, index),
    source: article.domain || "GDELT",
  };
}

function inferRegion(country, title) {
  if (COUNTRY_REGIONS[country]) return COUNTRY_REGIONS[country];
  const lower = title.toLowerCase();
  if (lower.includes("asia") || lower.includes("china") || lower.includes("japan") || lower.includes("india")) return "Asia";
  if (lower.includes("europe") || lower.includes("eu ") || lower.includes("ukraine")) return "Europe";
  if (lower.includes("middle east") || lower.includes("iran") || lower.includes("israel")) return "Middle East";
  if (lower.includes("africa")) return "Africa";
  if (lower.includes("america") || lower.includes("u.s.") || lower.includes("canada")) return "North America";
  return "Global";
}

function classifyCategory(title) {
  const lower = title.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(([, words]) => words.some((word) => lower.includes(word)));
  return match ? match[0] : "World";
}

function classifySentiment(title) {
  const lower = title.toLowerCase();
  const negative = ["risk", "war", "crisis", "attack", "fall", "slump", "concern", "warning", "instability", "volatility"];
  const positive = ["growth", "deal", "improve", "gain", "peace", "boost", "stable", "record", "approval", "advance"];
  const negativeScore = negative.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
  const positiveScore = positive.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
  if (negativeScore > positiveScore) return "negative";
  if (positiveScore > negativeScore) return "positive";
  return "neutral";
}

function calculateUrgency(title, category, sentiment, index) {
  const lower = title.toLowerCase();
  const urgentWords = ["breaking", "attack", "war", "crisis", "emergency", "volatility", "missile", "sanction", "shock"];
  const base = 42 + (category === "Security" ? 20 : 0) + (category === "Energy" ? 13 : 0) + (sentiment === "negative" ? 12 : 0);
  const wordBoost = urgentWords.reduce((score, word) => score + (lower.includes(word) ? 8 : 0), 0);
  return THREE.MathUtils.clamp(base + wordBoost - index * 2 + Math.round(Math.random() * 10), 28, 96);
}

function generateSyntheticEvent() {
  const templates = [
    ["Market instability detected in Asia", "Asia", "Markets", "negative", 82],
    ["Energy sector volatility rising near supply chokepoints", "Middle East", "Energy", "negative", 86],
    ["AI infrastructure investment momentum strengthens", "North America", "Technology", "positive", 58],
    ["Election signal noise increases across regional media clusters", "Europe", "Politics", "neutral", 64],
    ["Severe weather pressure affects logistics corridors", "Oceania", "Climate", "negative", 71],
    ["Cyber defense coordination improves across public agencies", "North America", "Security", "positive", 56],
  ];
  const item = templates[Math.floor(Math.random() * templates.length)];
  return makeEvent(`${item[0]} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, item[1], item[2], item[3], item[4], "AI local");
}

function generateInsights(feed) {
  const urgent = [...feed].sort((a, b) => b.urgency - a.urgency)[0] || initialFeed[0];
  const categories = countBy(feed, "category");
  const regions = countBy(feed, "region");
  const topCategory = topEntry(categories);
  const topRegion = topEntry(regions);
  const negativeCount = feed.filter((event) => event.sentiment === "negative").length;
  const trendTone = negativeCount > feed.length * 0.42 ? "defensive" : "stable";
  return [
    {
      title: `${urgent.category} pressure at ${urgent.urgency}%`,
      body: `${urgent.region} is producing the sharpest signal. Priority review should focus on source diversity and second-order effects.`,
    },
    {
      title: `${topCategory[0]} cluster expanding`,
      body: `${topCategory[1]} events are grouped in this theme, with ${topRegion[0]} currently carrying the broadest regional weight.`,
    },
    {
      title: `Operating posture: ${trendTone}`,
      body: `The local classifier sees ${negativeCount} negative signals across ${feed.length} tracked events and is keeping alerts in a measured watch state.`,
    },
  ];
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    counts[item[key]] = (counts[item[key]] || 0) + 1;
    return counts;
  }, {});
}

function topEntry(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["Global", 0];
}

function hashToOffset(value, range) {
  const text = String(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 997;
  }
  return ((hash / 997) * 2 - 1) * range;
}

function createMarketState() {
  const series = Array.from({ length: 42 }, (_, index) => 62 + Math.sin(index * 0.42) * 8 + Math.random() * 8);
  return {
    series,
    metrics: [
      { label: "Global index", value: "62.4", score: 62 },
      { label: "Volatility", value: "18%", score: 48 },
      { label: "AI confidence", value: "74%", score: 74 },
      { label: "Energy pressure", value: "81%", score: 81 },
    ],
  };
}

function updateMarketState(market) {
  const last = market.series[market.series.length - 1] || 62;
  const next = THREE.MathUtils.clamp(last + (Math.random() - 0.45) * 5.2, 34, 94);
  const series = [...market.series.slice(1), next];
  const volatility = Math.round(20 + Math.abs(next - last) * 9);
  return {
    series,
    metrics: [
      { label: "Global index", value: next.toFixed(1), score: Math.round(next) },
      { label: "Volatility", value: `${volatility}%`, score: THREE.MathUtils.clamp(volatility, 12, 92) },
      { label: "AI confidence", value: `${Math.round(68 + Math.random() * 16)}%`, score: 74 },
      { label: "Energy pressure", value: `${Math.round(72 + Math.random() * 17)}%`, score: 81 },
    ],
  };
}

function createInfraState() {
  const series = Array.from({ length: 42 }, (_, index) => 74 + Math.cos(index * 0.33) * 6 + Math.random() * 5);
  return {
    series,
    metrics: [
      { label: "Node health", value: "97%", score: 97 },
      { label: "Latency", value: "24ms", score: 84 },
      { label: "Throughput", value: "8.2k", score: 76 },
      { label: "Queue load", value: "31%", score: 31 },
    ],
  };
}

function updateInfraState(infra) {
  const last = infra.series[infra.series.length - 1] || 74;
  const next = THREE.MathUtils.clamp(last + (Math.random() - 0.5) * 4.4, 48, 99);
  const series = [...infra.series.slice(1), next];
  return {
    series,
    metrics: [
      { label: "Node health", value: `${Math.round(next)}%`, score: Math.round(next) },
      { label: "Latency", value: `${Math.round(18 + Math.random() * 18)}ms`, score: Math.round(86 - Math.random() * 18) },
      { label: "Throughput", value: `${(7.4 + Math.random() * 1.9).toFixed(1)}k`, score: Math.round(72 + Math.random() * 18) },
      { label: "Queue load", value: `${Math.round(22 + Math.random() * 24)}%`, score: Math.round(22 + Math.random() * 24) },
    ],
  };
}

function drawLineChart(canvas, series, color) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(0, 0, 0, 0.18)";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(244, 246, 239, 0.12)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const min = Math.min(...series) - 4;
  const max = Math.max(...series) + 4;
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.beginPath();
  series.forEach((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `${color}44`);
  gradient.addColorStop(1, `${color}00`);
  context.fillStyle = gradient;
  context.fill();
}

function projectLinks() {
  return [
    {
      title: "Main Project Hub",
      text: "Full index of the live Never Wet launch paths.",
      href: "../project-hub.html",
    },
    {
      title: "Market Intel AI",
      text: "Realtime stock analysis terminal with market signals.",
      href: "../market-intel-ai/",
    },
    {
      title: "Object Scanner",
      text: "Camera-based 3D scanning and point-cloud previews.",
      href: "../object-scanner/",
    },
    {
      title: "Code Workspace",
      text: "Browser workspace with editor, terminal, files, and commands.",
      href: "../code-workspace/",
    },
    {
      title: "Physics Engine Playground",
      text: "Matter.js and Three.js physics laboratory.",
      href: "../physics-engine-playground/physics-engine-playground.html",
    },
  ];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
