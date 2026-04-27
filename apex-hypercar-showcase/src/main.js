import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector("#showcase-canvas");
const loaderEl = document.querySelector("[data-loader]");
const bubbleEl = document.querySelector("[data-cursor-bubble]");
const eyebrowEl = document.querySelector("[data-stage-eyebrow]");
const titleEl = document.querySelector("[data-stage-title]");
const bodyEl = document.querySelector("[data-stage-body]");
const revealStateEl = document.querySelector("[data-reveal-state]");
const progressFillEl = document.querySelector("[data-progress-fill]");
const dotEls = [...document.querySelectorAll("[data-stage-dot]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stages = [
  {
    eyebrow: "01 / F142 system",
    title: "Precision Surface",
    body: "A clean exterior study with the original Ferrari 458 material palette preserved.",
    state: "Solid"
  },
  {
    eyebrow: "02 / Cursor reveal",
    title: "Liquid Inspection",
    body: "Hover over the body to soften only the painted shell beneath the cursor and reveal the mechanical layer inside.",
    state: "Hover"
  },
  {
    eyebrow: "03 / Power core",
    title: "Engine Architecture",
    body: "The outer body steps back so the rear powertrain, cockpit, and chassis structure can take focus.",
    state: "Engine"
  },
  {
    eyebrow: "04 / Signal outline",
    title: "Particle Assembly",
    body: "The model resolves into a precise point silhouette, then returns to a complete sculpted form.",
    state: "Particle"
  }
];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.15, 7.7);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const carPivot = new THREE.Group();
scene.add(carPivot);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(10, 10);
const targetLookAt = new THREE.Vector3(0, -0.05, 0);

const hitMeshes = [];
const allMaterials = [];
const shellMaterials = [];
const engineMaterials = [];
const internalMaterials = [];

const hoverUniforms = {
  uBubble: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
  uAspect: { value: window.innerWidth / window.innerHeight }
};

const particleUniforms = {
  uTime: { value: 0 },
  uOpacity: { value: 0 },
  uEngine: { value: 0 },
  uMotion: { value: reducedMotion ? 0.1 : 1 },
  uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.6) }
};

const state = {
  targetProgress: 0,
  progress: 0,
  activeStage: 0,
  carReady: false,
  bodyAlpha: 1,
  hoverReveal: 0,
  particleSystem: null,
  bubble: new THREE.Vector4(0.5, 0.5, 0, 0),
  targetBubble: new THREE.Vector4(0.5, 0.5, 0, 0),
  bubbleCss: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, scale: 0.45 },
  targetCss: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, scale: 0.45 },
  pointerInside: false,
  pointerScreen: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
  pointerUv: { x: 0.5, y: 0.5 },
  lastScrollInput: performance.now()
};

createLighting();
createGround();
initScroll();
bindPointer();
bindStageDots();
resize();
window.addEventListener("resize", resize);

loadCar();
requestAnimationFrame(animate);

function createLighting() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6d0c8, 1.5));

  const key = new THREE.DirectionalLight(0xffffff, 2.35);
  key.position.set(3.8, 4.2, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 1.05);
  rim.position.set(-4.8, 2.6, -3.8);
  scene.add(rim);

  const roof = new THREE.RectAreaLight(0xffffff, 2.2, 5.4, 0.75);
  roof.position.set(0, 3.2, 2.6);
  roof.lookAt(0, 0, 0);
  scene.add(roof);
}

function createGround() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 11),
    new THREE.ShadowMaterial({ color: 0x111111, opacity: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.72;
  floor.receiveShadow = true;
  scene.add(floor);

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 96),
    new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.04,
      depthWrite: false
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.scale.set(1.58, 0.24, 1);
  halo.position.y = -0.705;
  scene.add(halo);
}

async function loadCar() {
  const loader = new GLTFLoader();

  try {
    const gltf = await loadFirstAvailableModel(loader, [
      new URL("./public/models/2011_ferrari_458_italia.glb", window.location.href).href,
      new URL("./models/2011_ferrari_458_italia.glb", window.location.href).href,
      "/models/2011_ferrari_458_italia.glb"
    ]);

    const car = gltf.scene;
    normalizeCar(car);
    prepareCar(car);

    carPivot.add(car);
    state.particleSystem = createParticleSystem(car);
    carPivot.add(state.particleSystem);
    state.carReady = true;

    gsap.to(loaderEl, {
      autoAlpha: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => loaderEl.classList.add("is-hidden")
    });
  } catch (error) {
    console.error("Unable to load GLB model", error);
    loaderEl.textContent = "GLB load failed";
  }
}

async function loadFirstAvailableModel(loader, urls) {
  let lastError;
  for (const url of urls) {
    try {
      return await loader.loadAsync(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function normalizeCar(model) {
  model.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = 4.9 / Math.max(size.x, size.z);
  model.scale.setScalar(scale);
  model.updateWorldMatrix(true, true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y += -scaledBox.min.y - 0.66;
  model.rotation.y = Math.PI;
  model.updateWorldMatrix(true, true);
}

function prepareCar(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;

    const label = meshLabel(child, child.material);
    if (shouldHideModelHelper(label)) {
      child.visible = false;
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.userData.kind = classifyMesh(child);
    child.material = cloneMaterials(child);
    hitMeshes.push(child);
  });
}

function cloneMaterials(mesh) {
  const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const cloned = source.map((material) => prepareMaterial(material, mesh));
  return Array.isArray(mesh.material) ? cloned : cloned[0];
}

function prepareMaterial(material, mesh) {
  const label = meshLabel(mesh, material);
  const isFrontHood = /cockpit_s_hooda_body/.test(label);
  const clone = isFrontHood
    ? new THREE.MeshBasicMaterial({ color: 0xf72a14 })
    : material?.clone ? material.clone() : new THREE.MeshStandardMaterial({ color: 0x161616 });
  const kind = mesh.userData.kind;
  clone.userData.kind = kind;
  clone.userData.label = label;
  clone.userData.baseOpacity = typeof clone.opacity === "number" ? clone.opacity : 1;
  clone.userData.baseTransparent = Boolean(clone.transparent);
  clone.userData.shellFade = kind === "shell" ? 0.12 : 0;
  clone.userData.baseEmissive = clone.emissive?.clone?.() ?? null;
  clone.userData.baseEmissiveIntensity = clone.emissiveIntensity ?? 0;

  if (kind === "glass") {
    clone.transparent = true;
    clone.opacity = Math.min(clone.opacity || 1, 0.46);
    clone.depthWrite = false;
    clone.envMapIntensity = Math.max(clone.envMapIntensity ?? 1, 1.2);
  } else if (kind === "shell") {
    clone.opacity = 1;
    clone.transparent = false;
    if (/carpaint|paint/.test(label)) {
      clone.map = null;
      clone.normalMap = null;
      clone.roughnessMap = null;
      clone.metalnessMap = null;
      clone.color?.set?.(0xff220f);
      clone.metalness = 0.18;
      clone.roughness = 0.34;
    }
    clone.alphaMap = null;
    clone.alphaTest = 0;
    clone.transmission = 0;
    clone.transmissionMap = null;
    clone.thickness = 0;
    clone.attenuationDistance = Infinity;
    clone.userData.baseOpacity = 1;
    clone.userData.baseTransparent = false;
    clone.depthWrite = true;
    clone.envMapIntensity = Math.max(clone.envMapIntensity ?? 1, 1.05);
    addLocalizedShellFade(clone);
    shellMaterials.push(clone);
  } else if (kind === "engine") {
    clone.transparent = true;
    clone.depthWrite = true;
    clone.envMapIntensity = Math.max(clone.envMapIntensity ?? 1, 1.18);
    engineMaterials.push(clone);
  } else if (kind === "interior") {
    clone.envMapIntensity = Math.max(clone.envMapIntensity ?? 1, 1.08);
    internalMaterials.push(clone);
  } else {
    clone.envMapIntensity = Math.max(clone.envMapIntensity ?? 1, 0.86);
  }

  if (clone.map) clone.map.colorSpace = THREE.SRGBColorSpace;
  allMaterials.push(clone);
  return clone;
}

function addLocalizedShellFade(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBubble = hoverUniforms.uBubble;
    shader.uniforms.uAspect = hoverUniforms.uAspect;
    shader.uniforms.uShellFade = { value: material.userData.shellFade };

    shader.vertexShader = `
      varying vec4 vHoverClipPosition;
    ${shader.vertexShader}`.replace(
      "#include <project_vertex>",
      `
      #include <project_vertex>
      vHoverClipPosition = gl_Position;
      `
    );

    shader.fragmentShader = `
      uniform vec4 uBubble;
      uniform float uAspect;
      uniform float uShellFade;
      varying vec4 vHoverClipPosition;

      float hoverMask(vec2 screenUv) {
        vec2 p = screenUv - uBubble.xy;
        p.x *= uAspect;
        float d = length(p);
        float radius = max(0.0, uBubble.z);
        float mask = 1.0 - smoothstep(radius - 0.018, radius + 0.05, d);
        return clamp(mask * uBubble.w, 0.0, 1.0);
      }
    ${shader.fragmentShader}`.replace(
      "#include <opaque_fragment>",
      `
      vec2 hoverScreenUv = (vHoverClipPosition.xy / max(vHoverClipPosition.w, 0.0001)) * 0.5 + 0.5;
      float shellHover = hoverMask(hoverScreenUv);
      diffuseColor.rgb = mix(diffuseColor.rgb, min(diffuseColor.rgb * 1.08 + vec3(0.035), vec3(1.0)), shellHover * 0.5);
      diffuseColor.a *= 1.0 - shellHover * uShellFade;
      #include <opaque_fragment>
      `
    );
  };
  material.customProgramCacheKey = () => "localized-shell-fade";
}

function classifyMesh(mesh) {
  const label = meshLabel(mesh, mesh.material);

  if (/glass|window|windshield|windscreen|transparent/.test(label)) return "glass";
  if (/tire|tyre/.test(label)) return "tire";
  if (/wheel|rim|caliper|rotor|brake|disc/.test(label)) return "wheel";
  if (/lamp|light|reflector|emissive/.test(label)) return "light";
  if (/engine|motor|exhaust|intake|manifold|muffler|silencer/.test(label)) return "engine";
  if (/cockpit|seat|leather|dashboard|steer|tach|gauge|doorcard|cloth|stitching/.test(label)) return "interior";
  if (/body|carpaint|hood|bumper|door|fender|mirror|spoiler|paint/.test(label)) return "shell";
  return "hardware";
}

function shouldHideModelHelper(label) {
  return /cockpit_s_hooda_(plastic|piston|matte_colors|misc)/.test(label);
}

function meshLabel(mesh, material) {
  const materialName = Array.isArray(material)
    ? material.map((entry) => entry?.name ?? "").join(" ")
    : material?.name ?? "";
  return `${mesh.name ?? ""} ${materialName}`.toLowerCase();
}

function createParticleSystem(model) {
  carPivot.updateWorldMatrix(true, false);
  model.updateWorldMatrix(true, true);

  const points = [];
  const engineFlags = [];
  const seeds = [];
  const tmp = new THREE.Vector3();
  const maxPoints = 7600;

  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position || seeds.length >= maxPoints) return;

    const position = child.geometry.attributes.position;
    const kind = child.userData.kind;
    const step = Math.max(1, Math.ceil(position.count / (kind === "shell" ? 330 : 180)));
    for (let index = 0; index < position.count; index += step) {
      tmp.fromBufferAttribute(position, index).applyMatrix4(child.matrixWorld);
      carPivot.worldToLocal(tmp);
      points.push(tmp.x, tmp.y, tmp.z);
      const rearCore = tmp.z < -0.15 && Math.abs(tmp.x) < 1.1 && tmp.y > -0.42 && tmp.y < 0.42;
      engineFlags.push(kind === "engine" || rearCore ? 1 : 0);
      seeds.push(Math.random());
      if (seeds.length >= maxPoints) break;
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aEngine", new THREE.Float32BufferAttribute(engineFlags, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: particleUniforms,
    vertexShader: `
      attribute float aSeed;
      attribute float aEngine;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uEngine;
      uniform float uMotion;
      uniform float uPixelRatio;
      varying float vEngine;
      varying float vAlpha;

      void main() {
        vEngine = aEngine;
        vec3 direction = normalize(position + vec3(0.04, 0.08, 0.03));
        float drift = (sin(uTime * 1.24 + aSeed * 17.0) * 0.014 + sin(uTime * 0.7 + aSeed * 29.0) * 0.008) * uMotion;
        vec3 animatedPosition = position + direction * drift;
        vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        gl_PointSize = mix(2.35, 4.2, aEngine * uEngine) * uPixelRatio * (5.7 / max(1.0, -mvPosition.z));
        vAlpha = uOpacity;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uEngine;
      varying float vEngine;
      varying float vAlpha;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float particle = 1.0 - smoothstep(0.27, 0.5, length(p));
        vec3 graphite = vec3(0.018, 0.018, 0.017);
        vec3 core = vec3(0.34, 0.33, 0.29);
        vec3 color = mix(graphite, core, vEngine * uEngine);
        gl_FragColor = vec4(color, particle * vAlpha);
      }
    `
  });

  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  particles.visible = false;
  particles.renderOrder = 4;
  return particles;
}

function initScroll() {
  ScrollTrigger.create({
    trigger: "#scroll-range",
    start: "top top",
    end: "bottom bottom",
    scrub: reducedMotion ? 0.2 : 0.85,
    onUpdate: (self) => {
      if (Math.abs(self.progress - state.targetProgress) > 0.0002) {
        state.lastScrollInput = performance.now();
      }
      state.targetProgress = self.progress;
    }
  });
}

function bindPointer() {
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    pointer.set(x * 2 - 1, -(y * 2 - 1));
    state.pointerInside = true;
    state.pointerScreen.x = event.clientX;
    state.pointerScreen.y = event.clientY;
    state.pointerUv.x = x;
    state.pointerUv.y = y;
    state.targetCss.x = event.clientX;
    state.targetCss.y = event.clientY;
  });

  canvas.addEventListener("pointerleave", () => {
    state.pointerInside = false;
    state.targetBubble.w = 0;
    state.targetBubble.z = 0;
    state.targetCss.scale = 0.45;
    bubbleEl.classList.remove("is-visible");
  });
}

function bindStageDots() {
  dotEls.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: maxScroll * (index / (stages.length - 1)),
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.25);
  const elapsed = clock.elapsedTime;
  const smoothing = 1 - Math.exp(-delta * (reducedMotion ? 7.5 : 4.8));

  state.progress += (state.targetProgress - state.progress) * smoothing;
  updateStage(state.progress);
  updateSceneState(state.progress, elapsed, delta);
  updateHoverTarget();
  updateBubble(elapsed);

  camera.lookAt(targetLookAt);
  renderer.render(scene, camera);
}

function updateSceneState(progress, elapsed, delta) {
  const engine = peak(progress, 0.38, 0.54, 0.72);
  const particle = smoothstep(progress, 0.56, 0.68) * (1 - smoothstep(progress, 0.94, 1));
  const reassembled = smoothstep(progress, 0.95, 1);
  const visualEase = 1 - Math.exp(-delta * (reducedMotion ? 12 : 7.5));

  carPivot.rotation.y = Math.PI * 0.84 + progress * Math.PI * 2;
  carPivot.rotation.x = Math.sin(progress * Math.PI) * 0.022;
  carPivot.position.y = Math.sin(elapsed * 0.55) * (reducedMotion ? 0.001 : 0.01);

  const targetBodyAlpha = THREE.MathUtils.clamp(1 - engine * 0.42 - particle * 0.95 + reassembled * 0.46, 0.08, 1);
  state.bodyAlpha += (targetBodyAlpha - state.bodyAlpha) * visualEase;

  allMaterials.forEach((material) => {
    const kind = material.userData.kind;
    const base = material.userData.baseOpacity ?? 1;
    let opacity = base;

    if (kind === "shell") opacity = Math.max(0.08, base * state.bodyAlpha);
    if (kind === "glass") opacity = Math.max(0.12, Math.min(base, 0.5) * (0.9 - engine * 0.35));
    if (kind === "engine") opacity = Math.max(0.18, base * (0.52 + engine * 0.48));
    if (kind === "interior") opacity = Math.max(0.38, base * (0.78 + engine * 0.22));
    if (kind === "tire" || kind === "wheel") opacity = Math.max(0.72, base * (1 - particle * 0.25));

    material.opacity += (opacity - material.opacity) * visualEase;
    const shellNeedsBlend = kind === "shell" && (state.hoverReveal > 0.01 || material.opacity < 0.995);
    const needsTransparent = kind === "glass" || kind === "engine" || shellNeedsBlend || material.opacity < 0.995 || material.userData.baseTransparent;
    if (material.transparent !== needsTransparent) {
      material.transparent = needsTransparent;
      material.needsUpdate = true;
    }
    material.depthWrite = kind === "shell" ? true : material.opacity > 0.96 && kind !== "glass";
  });

  const coreSignal = Math.max(engine, state.hoverReveal * 0.58, particle * 0.42);
  [...engineMaterials, ...internalMaterials].forEach((material) => {
    if (!material.emissive) return;
    const baseEmissive = material.userData.baseEmissive ?? new THREE.Color(0x000000);
    material.emissive.copy(baseEmissive).lerp(new THREE.Color(0x77736a), coreSignal * 0.34);
    material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? 0) + coreSignal * 0.24;
  });

  particleUniforms.uTime.value = elapsed;
  particleUniforms.uOpacity.value += (Math.min(1, particle * 1.14) - particleUniforms.uOpacity.value) * visualEase;
  particleUniforms.uEngine.value += (Math.max(engine, particle * 0.78) - particleUniforms.uEngine.value) * visualEase;

  if (state.particleSystem) {
    state.particleSystem.visible = particleUniforms.uOpacity.value > 0.012;
  }
}

function updateHoverTarget() {
  const scrollSettled = performance.now() - state.lastScrollInput > 180;
  const canHover = state.pointerInside && state.carReady && scrollSettled;
  if (!canHover) {
    state.targetBubble.w = 0;
    state.targetBubble.z = 0;
    state.targetCss.scale = 0.45;
    bubbleEl.classList.remove("is-visible");
    return;
  }

  pointer.set(state.pointerUv.x * 2 - 1, -(state.pointerUv.y * 2 - 1));
  carPivot.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(hitMeshes, false);
  const active = hits.length > 0;
  const radius = window.innerWidth < 720 ? 0.23 : 0.152;

  state.targetBubble.set(state.pointerUv.x, 1 - state.pointerUv.y, active ? radius : 0, active ? 1 : 0);
  state.targetCss.x = state.pointerScreen.x;
  state.targetCss.y = state.pointerScreen.y;
  state.targetCss.scale = active ? 1 : 0.45;
  bubbleEl.classList.toggle("is-visible", active);
}

function updateBubble(elapsed) {
  const speed = reducedMotion ? 0.22 : 0.13;
  state.bubble.lerp(state.targetBubble, speed);
  state.hoverReveal += (state.bubble.w - state.hoverReveal) * (reducedMotion ? 0.24 : 0.16);
  hoverUniforms.uBubble.value.copy(state.bubble);

  state.bubbleCss.x += (state.targetCss.x - state.bubbleCss.x) * 0.16;
  state.bubbleCss.y += (state.targetCss.y - state.bubbleCss.y) * 0.16;
  state.bubbleCss.scale += (state.targetCss.scale - state.bubbleCss.scale) * 0.14;
  bubbleEl.style.transform = `translate3d(${state.bubbleCss.x}px, ${state.bubbleCss.y}px, 0) translate3d(-50%, -50%, 0) scale(${state.bubbleCss.scale})`;
  bubbleEl.style.borderRadius = `${50 + Math.sin(elapsed * 1.4) * 5}% ${50 - Math.sin(elapsed * 1.1) * 4}% ${48 + Math.cos(elapsed * 1.2) * 4}% ${52 - Math.cos(elapsed * 1.6) * 4}% / ${52 + Math.sin(elapsed * 1.7) * 4}% ${46 - Math.sin(elapsed * 1.2) * 4}% ${56 + Math.cos(elapsed * 1.3) * 4}% ${45 - Math.cos(elapsed * 1.5) * 3}%`;
}

function updateStage(progress) {
  const index = Math.min(stages.length - 1, Math.floor(progress * stages.length));
  if (index !== state.activeStage) {
    state.activeStage = index;
    const next = stages[index];

    gsap.killTweensOf([eyebrowEl, titleEl, bodyEl]);
    eyebrowEl.textContent = next.eyebrow;
    titleEl.textContent = next.title;
    bodyEl.textContent = next.body;
    revealStateEl.textContent = next.state;
    dotEls.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));

    gsap.fromTo(
      [eyebrowEl, titleEl, bodyEl],
      { y: 18, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: reducedMotion ? 0.01 : 0.44,
        stagger: 0.06,
        ease: "power3.out",
        overwrite: true
      }
    );
  }

  progressFillEl.style.transform = `scaleX(${progress.toFixed(4)})`;
}

function peak(value, start, middle, end) {
  return smoothstep(value, start, middle) * (1 - smoothstep(value, middle, end));
}

function smoothstep(value, edge0, edge1) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.fov = width < 700 ? 41 : 32;
  camera.position.set(0, width < 700 ? 1.05 : 1.15, width < 700 ? 8.25 : 7.7);
  camera.updateProjectionMatrix();

  hoverUniforms.uAspect.value = width / height;
  particleUniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 1.6);
  carPivot.scale.setScalar(width < 700 ? 0.78 : 1);

  ScrollTrigger.refresh();
}
