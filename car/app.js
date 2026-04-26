import * as THREE from "three";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { DRACOLoader } from "./vendor/DRACOLoader.js";

{
  const canvas = document.getElementById("windTunnel");
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  const carButtons = Array.from(document.querySelectorAll("[data-car]"));
  const stagePanel = document.querySelector(".story-panel");
  const stageKicker = document.getElementById("stageKicker");
  const stageTitle = document.getElementById("stageTitle");
  const stageText = document.getElementById("stageText");
  const activeBrand = document.getElementById("activeBrand");
  const activeModel = document.getElementById("activeModel");
  const activeTrait = document.getElementById("activeTrait");
  const readoutVelocity = document.getElementById("readoutVelocity");
  const readoutCd = document.getElementById("readoutCd");
  const metricFlow = document.getElementById("metricFlow");
  const metricPressure = document.getElementById("metricPressure");
  const metricWake = document.getElementById("metricWake");
  const scrollRail = document.getElementById("scrollRail");
  const cursorDot = document.getElementById("cursorDot");
  const debugToggle = document.getElementById("debugToggle");
  const debugReadout = document.getElementById("debugReadout");
  const featureLayer = document.querySelector(".feature-layer");
  const featureLabels = new Map(
    Array.from(document.querySelectorAll("[data-feature]")).map((label) => [
      label.dataset.feature,
      label,
    ]),
  );

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallViewport = () => window.innerWidth < 760;
  const BODY_BASE = 0.03;
  const WORLD_START = -8.4;
  const WORLD_END = 8.4;

  const CARS = [
    {
      id: "porsche",
      brand: "Porsche",
      model: "911 GT3",
      trait: "rear-biased fastback profile",
      cd: "0.34 Cd",
      asset: "./models/porsche_911_gt3.glb",
      paint: "#d7d2c8",
      trim: "#10100f",
      accent: "#e7ff5b",
      modelScale: [1.02, 0.9, 0.96],
      length: 4.8,
      width: 1.9,
      height: 1.24,
      wheelRadius: 0.37,
      displayWheelRadius: 0.34,
      displayWheelYOffset: 0.12,
      wheelFront: -0.66,
      wheelRear: 0.68,
      widthBulge: 0.08,
      aero: {
        split: 0.72,
        surfaceGrip: 0.9,
        roofAccel: 0.78,
        sideChannel: 0.48,
        wake: 0.32,
        turbulence: 0.06,
        blockage: 0.72,
        frontCompression: 0.64,
        roofAttachment: 1.08,
        underbodyAccel: 0.58,
        wakeSpread: 0.48,
        wakeLength: 0.78,
        mirrorVortex: 0.18,
      },
      upper: [
        [-1, 0.16],
        [-0.84, 0.34],
        [-0.52, 0.48],
        [-0.18, 0.88],
        [0.24, 0.96],
        [0.68, 0.56],
        [1, 0.38],
      ],
      lower: [
        [1, 0.13],
        [0.6, 0.08],
        [-0.62, 0.08],
        [-1, 0.16],
      ],
      cabin: [
        [-0.44, 0.46],
        [-0.18, 0.82],
        [0.22, 0.9],
        [0.58, 0.5],
        [0.4, 0.43],
        [-0.36, 0.42],
      ],
    },
    {
      id: "ferrari",
      brand: "Ferrari",
      model: "SF90 Spider",
      trait: "hybrid supercar with active aero channels",
      cd: "0.31 Cd",
      asset: "./models/2021_ferrari_sf90_spider.glb",
      paint: "#9f2522",
      trim: "#0d0c0b",
      accent: "#ff8a46",
      modelScale: [1.05, 0.94, 1.02],
      length: 4.95,
      width: 2.02,
      height: 1.12,
      wheelRadius: 0.38,
      wheelFront: -0.62,
      wheelRear: 0.58,
      widthBulge: 0.12,
      aero: {
        split: 1.18,
        surfaceGrip: 1.04,
        roofAccel: 1.08,
        sideChannel: 0.92,
        wake: 0.52,
        turbulence: 0.12,
        blockage: 0.82,
        frontCompression: 1.08,
        roofAttachment: 0.92,
        underbodyAccel: 0.92,
        wakeSpread: 0.68,
        wakeLength: 1,
        mirrorVortex: 0.32,
      },
      upper: [
        [-1, 0.13],
        [-0.75, 0.26],
        [-0.38, 0.36],
        [-0.08, 0.82],
        [0.26, 0.9],
        [0.64, 0.46],
        [1, 0.3],
      ],
      lower: [
        [1, 0.12],
        [0.5, 0.07],
        [-0.65, 0.07],
        [-1, 0.13],
      ],
      cabin: [
        [-0.34, 0.39],
        [-0.08, 0.77],
        [0.24, 0.84],
        [0.52, 0.44],
        [0.34, 0.37],
        [-0.26, 0.35],
      ],
    },
    {
      id: "lotus",
      brand: "Lotus",
      model: "Emira",
      trait: "compact shoulders and side intake tunnels",
      cd: "0.33 Cd",
      asset: "./models/lotus_emira_2022__www.vecarz.com.glb",
      paint: "#1d6a5c",
      trim: "#10120f",
      accent: "#f2c64d",
      modelScale: [0.97, 0.84, 0.96],
      length: 4.55,
      width: 1.92,
      height: 1.18,
      wheelRadius: 0.36,
      wheelFront: -0.6,
      wheelRear: 0.58,
      widthBulge: 0.1,
      aero: {
        split: 0.88,
        surfaceGrip: 0.96,
        roofAccel: 0.9,
        sideChannel: 0.66,
        wake: 0.42,
        turbulence: 0.08,
        blockage: 0.76,
        frontCompression: 0.78,
        roofAttachment: 1,
        underbodyAccel: 0.72,
        wakeSpread: 0.56,
        wakeLength: 0.86,
        mirrorVortex: 0.24,
      },
      upper: [
        [-1, 0.14],
        [-0.82, 0.3],
        [-0.44, 0.4],
        [-0.12, 0.82],
        [0.24, 0.88],
        [0.66, 0.5],
        [1, 0.32],
      ],
      lower: [
        [1, 0.11],
        [0.58, 0.07],
        [-0.6, 0.07],
        [-1, 0.14],
      ],
      cabin: [
        [-0.4, 0.4],
        [-0.12, 0.76],
        [0.24, 0.82],
        [0.56, 0.45],
        [0.36, 0.38],
        [-0.32, 0.36],
      ],
    },
    {
      id: "bmw",
      brand: "BMW",
      model: "M3 Competition G80",
      trait: "wide sedan stance with planted diffuser flow",
      cd: "0.36 Cd",
      asset: "./models/2021_bmw_m3_competition_g80.glb",
      paint: "#40536b",
      trim: "#101013",
      accent: "#70b7ff",
      modelScale: [0.98, 0.97, 0.96],
      modelYaw: Math.PI,
      length: 4.62,
      width: 1.86,
      height: 1.34,
      wheelRadius: 0.38,
      wheelFront: -0.64,
      wheelRear: 0.58,
      widthBulge: 0.05,
      aero: {
        split: 0.82,
        surfaceGrip: 0.72,
        roofAccel: 0.58,
        sideChannel: 0.42,
        wake: 0.88,
        turbulence: 0.26,
        blockage: 1.02,
        frontCompression: 1,
        roofAttachment: 0.58,
        underbodyAccel: 0.46,
        wakeSpread: 1.04,
        wakeLength: 1.22,
        mirrorVortex: 0.42,
      },
      upper: [
        [-1, 0.2],
        [-0.82, 0.38],
        [-0.48, 0.48],
        [-0.2, 0.9],
        [0.36, 0.92],
        [0.72, 0.56],
        [1, 0.44],
      ],
      lower: [
        [1, 0.14],
        [0.62, 0.08],
        [-0.64, 0.08],
        [-1, 0.2],
      ],
      cabin: [
        [-0.48, 0.48],
        [-0.22, 0.84],
        [0.36, 0.86],
        [0.64, 0.54],
        [0.48, 0.47],
        [-0.4, 0.44],
      ],
    },
  ];

  const STAGES = [
    {
      kicker: "01 / Arrival",
      title: "The body enters the tunnel.",
      text: "A dark studio opens around the car while the first pressure lines settle into formation.",
    },
    {
      kicker: "02 / Formation",
      title: "Air begins to organize.",
      text: "Laminar traces approach from the left, reading the nose and preparing to divide around the surfaces.",
    },
    {
      kicker: "03 / Full Flow",
      title: "The stream wraps the shell.",
      text: "Velocity climbs over the crown and shoulders, then narrows into cleaner channels behind the rear axle.",
    },
    {
      kicker: "04 / Aero Map",
      title: "Every surface has a job.",
      text: "The flow field reveals where pressure gathers, releases, and rejoins around the body.",
    },
    {
      kicker: "05 / Wake",
      title: "The wake rejoins with control.",
      text: "The field intensifies, then settles into a tight exit signature that reads as reduced drag.",
    },
    {
      kicker: "06 / Feature Trace",
      title: "The pressure map resolves.",
      text: "Front compression, roof suction, side channels, and rear separation remain visible as the tunnel keeps moving.",
    },
  ];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f2f2);
  scene.fog = new THREE.FogExp2(0xf2f2f2, 0.024);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(0, 1.08, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !smallViewport(),
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0xf2f2f2, 1);
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const root = new THREE.Group();
  scene.add(root);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("./vendor/draco/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  const textureLoader = new THREE.TextureLoader();
  const aoTexture = textureLoader.load("./models/ferrari_ao.png");
  aoTexture.colorSpace = THREE.SRGBColorSpace;
  let debugEnabled = false;

  const carGroups = CARS.map((car, index) => {
    const group = createGltfCarShell(car);
    setGroupOpacity(group, index === 0 ? 1 : 0);
    root.add(group);
    return group;
  });

  const flowGroups = CARS.map((car, index) => {
    const group = createFlowGroup(car);
    group.visible = index === 0;
    setFlowUniforms(group, index === 0 ? 1 : 0, 0.1, 0.2, 0.65);
    root.add(group);
    return group;
  });

  const featureGroup = createFeatureGroup();
  scene.add(featureGroup);
  createStudio();
  const modelReady = loadGltfCars(carGroups).catch((error) => {
    console.warn("GLTF car model batch failed to load; using sculpted fallback bodies.", error);
    carGroups.forEach((group, index) => {
      group.add(createFallbackCarGroup(CARS[index]));
    });
  });

  const requestedProgress = Number.parseFloat(new URLSearchParams(window.location.search).get("progress"));
  const initialProgress = Number.isFinite(requestedProgress) ? clamp(requestedProgress, 0, 1) : getScrollProgress();

  let activeIndex = 0;
  let previousIndex = 0;
  let transition = 1;
  let targetScroll = initialProgress;
  let smoothScroll = targetScroll;
  let currentStage = -1;
  let lastTime = performance.now();
  let elapsed = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const orbit = {
    dragging: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    targetYaw: 0,
    pitch: 0,
    targetPitch: 0,
  };
  const screenVector = new THREE.Vector3();

  updateActiveCopy(CARS[activeIndex]);
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", () => {
    targetScroll = getScrollProgress();
  }, { passive: true });

  window.addEventListener("pointermove", (event) => {
    pointer.tx = event.clientX / window.innerWidth - 0.5;
    pointer.ty = event.clientY / window.innerHeight - 0.5;
    if (!smallViewport()) {
      cursorDot.classList.add("is-visible");
      cursorDot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    }
  }, { passive: true });

  window.addEventListener("pointerdown", () => cursorDot.classList.add("is-pressed"));
  window.addEventListener("pointerup", () => cursorDot.classList.remove("is-pressed"));

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    orbit.dragging = true;
    orbit.lastX = event.clientX;
    orbit.lastY = event.clientY;
    document.body.classList.add("is-inspecting");
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!orbit.dragging) return;
    const dx = event.clientX - orbit.lastX;
    const dy = event.clientY - orbit.lastY;
    orbit.lastX = event.clientX;
    orbit.lastY = event.clientY;
    orbit.targetYaw += dx * 0.01;
    orbit.targetPitch = clamp(orbit.targetPitch - dy * 0.004, -0.58, 0.58);
    event.preventDefault();
  });

  canvas.addEventListener("pointerup", endInspection);
  canvas.addEventListener("pointercancel", endInspection);
  canvas.addEventListener("dblclick", () => {
    orbit.targetYaw = 0;
    orbit.targetPitch = 0;
  });

  carButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = CARS.findIndex((car) => car.id === button.dataset.car);
      if (nextIndex !== -1) setActiveCar(nextIndex);
    });
  });

  debugToggle?.addEventListener("click", () => {
    setDebugEnabled(!debugEnabled);
  });

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() === "d") setDebugEnabled(!debugEnabled);
  });

  if (Number.isFinite(requestedProgress)) {
    requestAnimationFrame(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, max * initialProgress);
    });
  }

  const loaderStarted = performance.now();
  let assetReady = false;
  modelReady.finally(() => {
    assetReady = true;
  });
  const loaderTimer = window.setInterval(() => {
    const elapsedLoad = performance.now() - loaderStarted;
    const timedAmount = Math.min(92, (elapsedLoad / 1200) * 92);
    const amount = assetReady ? Math.min(100, timedAmount + 10) : timedAmount;
    loaderBar.style.width = `${amount}%`;
    if (assetReady && amount >= 100) {
      window.clearInterval(loaderTimer);
      window.setTimeout(() => loader.classList.add("is-done"), 240);
    }
  }, 40);

  requestAnimationFrame(tick);

  function tick(now) {
    const delta = Math.min(0.04, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    elapsed += delta * (reducedMotion ? 0.35 : 1);
    smoothScroll += (targetScroll - smoothScroll) * (reducedMotion ? 0.22 : 0.075);
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    orbit.yaw += (orbit.targetYaw - orbit.yaw) * 0.11;
    orbit.pitch += (orbit.targetPitch - orbit.pitch) * 0.11;
    transition = Math.min(1, transition + delta * 1.55);

    const carReveal = 1;
    const flowReveal = 0.28 + smoothstep(0.13, 0.54, smoothScroll) * 0.72;
    const fullFlow = smoothstep(0.34, 0.62, smoothScroll);
    const featureFocus = smoothstep(0.62, 0.73, smoothScroll) * (1 - smoothstep(0.9, 0.98, smoothScroll));
    const finalPulse = smoothstep(0.82, 1, smoothScroll);
    const intensity = 0.14 + fullFlow * 0.86 + finalPulse * 0.28;
    const windSpeed = reducedMotion
      ? 0.32
      : 0.62 + fullFlow * 0.7 + Math.sin(elapsed * 0.7) * 0.04 - finalPulse * 0.16;
    const easedTransition = easeOutCubic(transition);

    carGroups.forEach((group, index) => {
      let opacity = 0;
      if (index === activeIndex) opacity = easedTransition;
      if (index === previousIndex && previousIndex !== activeIndex) opacity = 1 - easedTransition;
      group.rotation.y = 0;
      group.rotation.x = 0;
      setGroupOpacity(group, opacity * carReveal);
      if (group.userData.wheels) {
        group.userData.wheels.forEach((wheel) => {
          wheel.rotation.x = -elapsed * (2.2 + windSpeed * 3.4);
        });
      }
    });

    flowGroups.forEach((group, index) => {
      let opacity = 0;
      if (index === activeIndex) opacity = easedTransition;
      if (index === previousIndex && previousIndex !== activeIndex) opacity = 1 - easedTransition;
      group.rotation.y = 0;
      setFlowUniforms(group, opacity, flowReveal, intensity, windSpeed, 0);
      updateFlowTime(group, elapsed, delta);
    });

    updateCamera(smoothScroll);
    updateFeatureMarkers(featureFocus);
    updateHud(smoothScroll, intensity, windSpeed);
    if (debugEnabled) updateDebugReadout();

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function setActiveCar(index) {
    if (index === activeIndex) return;
    previousIndex = activeIndex;
    activeIndex = index;
    transition = 0;
    updateActiveCopy(CARS[activeIndex]);
    updateDebugReadout();
    carButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.car === CARS[index].id);
    });
  }

  function endInspection(event) {
    if (!orbit.dragging) return;
    orbit.dragging = false;
    document.body.classList.remove("is-inspecting");
    if (event && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function updateActiveCopy(car) {
    activeBrand.textContent = car.brand;
    activeModel.textContent = car.model;
    activeTrait.textContent = car.trait;
    readoutCd.textContent = car.cd;
  }

  function setDebugEnabled(enabled) {
    debugEnabled = enabled;
    debugToggle?.classList.toggle("is-active", enabled);
    debugToggle?.setAttribute("aria-pressed", String(enabled));
    debugReadout?.classList.toggle("is-visible", enabled);
    debugReadout?.setAttribute("aria-hidden", String(!enabled));
    flowGroups.forEach((group) => {
      if (group.userData.debugGroup) group.userData.debugGroup.visible = enabled;
      if (group.userData.particleField?.debugGroup) group.userData.particleField.debugGroup.visible = enabled;
    });
    updateDebugReadout();
  }

  function updateDebugReadout() {
    if (!debugReadout) return;
    const car = CARS[activeIndex];
    const aero = getAero(car);
    const flow = flowGroups[activeIndex];
    const field = flow?.userData.particleField;
    const tracers = field?.count || 0;
    const streamlines = flow?.userData.streamlineCount || 0;
    const firstX = field ? field.positions[0].toFixed(2) : "0.00";
    const firstVx = field ? field.velocities[0].toFixed(2) : "0.00";
    const respawns = field?.respawnCount || 0;
    debugReadout.innerHTML = `
      <span>Profile <strong>${car.model}</strong></span>
      <span>Collision <strong>6 zones + SDF</strong></span>
      <span>Moving paths <strong>${streamlines}</strong></span>
      <span>Particles <strong>${tracers}</strong></span>
      <span>Spawn / exit <strong>${WORLD_START.toFixed(1)} / ${WORLD_END.toFixed(1)}</strong></span>
      <span>Particle x <strong>${firstX}</strong></span>
      <span>Velocity x <strong>${firstVx}</strong></span>
      <span>Respawns <strong>${respawns}</strong></span>
      <span>Wake <strong>${aero.wake.toFixed(2)}</strong></span>
    `;
  }

  function updateHud(progress, intensity, windSpeed) {
    const stage = getStage(progress);
    if (stage !== currentStage) {
      currentStage = stage;
      const next = STAGES[stage];
      stagePanel.classList.add("is-changing");
      window.setTimeout(() => {
        stageKicker.textContent = next.kicker;
        stageTitle.textContent = next.title;
        stageText.textContent = next.text;
        stagePanel.classList.remove("is-changing");
      }, 130);
    }

    scrollRail.style.height = `${Math.max(1, progress * 100)}%`;
    const velocity = Math.round(82 + intensity * 48 + windSpeed * 42);
    readoutVelocity.textContent = `${velocity} km/h`;
    metricFlow.textContent = `${Math.min(100, Math.round(28 + intensity * 68))}%`;
    metricPressure.textContent = progress > 0.62 ? "Mapped" : progress > 0.35 ? "Active" : "Low";
    metricWake.textContent = progress > 0.82 ? "Rejoined" : progress > 0.5 ? "Tight" : "Clean";
  }

  function getStage(progress) {
    if (progress < 0.16) return 0;
    if (progress < 0.32) return 1;
    if (progress < 0.5) return 2;
    if (progress < 0.68) return 3;
    if (progress < 0.86) return 4;
    return 5;
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.fov = smallViewport() ? 52 : 34;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, smallViewport() ? 1.25 : 1.65);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
  }

  function updateCamera(progress) {
    const compact = smallViewport();
    const stage = [
      new THREE.Vector3(compact ? 0 : -0.12, compact ? 0.98 : 1.05, compact ? 14.25 : 7.9),
      new THREE.Vector3(compact ? 0.06 : 0.12, compact ? 1.02 : 1.08, compact ? 13.85 : 7.45),
      new THREE.Vector3(compact ? 0.16 : 0.42, compact ? 1.05 : 1.14, compact ? 13.45 : 6.9),
      new THREE.Vector3(compact ? -0.12 : -0.28, compact ? 1.1 : 1.22, compact ? 13.6 : 6.8),
      new THREE.Vector3(compact ? 0.18 : 0.5, compact ? 1.0 : 1.12, compact ? 14 : 7.05),
      new THREE.Vector3(compact ? 0.06 : 0.26, compact ? 1.04 : 1.2, compact ? 13.7 : 7.25),
    ];

    const scaled = progress * (stage.length - 1);
    const index = Math.min(stage.length - 2, Math.floor(scaled));
    const localT = easeInOutCubic(scaled - index);
    const from = stage[index];
    const to = stage[index + 1];
    const lookTarget = new THREE.Vector3(
      pointer.x * 0.12,
      0.66 - pointer.y * 0.08 + orbit.pitch * 0.32,
      0,
    );
    const targetPosition = from.clone().lerp(to, localT);
    targetPosition.x += pointer.x * (compact ? 0.08 : 0.28);
    targetPosition.y -= pointer.y * (compact ? 0.03 : 0.12);
    targetPosition.y += orbit.pitch * (compact ? 0.8 : 1.15);

    const orbitOffset = targetPosition.sub(lookTarget);
    orbitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit.yaw);
    camera.position.lerp(lookTarget.clone().add(orbitOffset), 0.055);
    camera.lookAt(lookTarget);
  }

  function createStudio() {
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc3c7, 1.05));

    const key = new THREE.DirectionalLight(0xffffff, 2.35);
    key.position.set(-4, 5, 5);
    key.castShadow = false;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xcdd9ff, 1.18);
    rim.position.set(5, 2.4, -3.5);
    scene.add(rim);

    const warm = new THREE.PointLight(0xf2e4d2, 0.82, 12);
    warm.position.set(-3.8, 1.2, 3.6);
    scene.add(warm);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 11, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0xe9e9e6,
        metalness: 0.22,
        roughness: 0.34,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = false;
    scene.add(floor);

    const grid = new THREE.GridHelper(18, 18, 0xb9b9b4, 0xd9d9d5);
    grid.position.y = 0.012;
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    scene.add(grid);

    const ribs = [];
    for (let x = -7; x <= 7; x += 2) {
      ribs.push(x, 0.04, -3.5, x, 2.45, -3.5);
      ribs.push(x, 2.45, -3.5, x, 2.45, 3.5);
      ribs.push(x, 2.45, 3.5, x, 0.04, 3.5);
    }
    const ribGeometry = new THREE.BufferGeometry();
    ribGeometry.setAttribute("position", new THREE.Float32BufferAttribute(ribs, 3));
    const ribLines = new THREE.LineSegments(
      ribGeometry,
      new THREE.LineBasicMaterial({
        color: 0x4c4c4a,
        transparent: true,
        opacity: 0.07,
      }),
    );
    scene.add(ribLines);
  }

  function createGltfCarShell(car) {
    const group = new THREE.Group();
    group.name = car.id;
    group.userData.wheels = [];
    group.userData.featureAnchors = {
      splitter: new THREE.Vector3(-car.length / 2 - 0.18, BODY_BASE + 0.17, car.width * 0.34),
      channels: new THREE.Vector3(-car.length * 0.06, BODY_BASE + car.height * 0.38, car.width / 2 + 0.1),
      diffuser: new THREE.Vector3(car.length / 2 - 0.22, BODY_BASE + 0.18, car.width * 0.27),
    };
    return group;
  }

  function loadGltfCars(groups) {
    loader.querySelector(".loader__copy").textContent = "Loading distinct GLTF car models";

    return Promise.all(
      CARS.map((car, index) =>
        loadGltfCar(car)
          .then((gltf) => {
            mountGltfCar(groups[index], gltf.scene, car);
          })
          .catch((error) => {
            console.warn(`${car.brand} ${car.model} failed to load; using sculpted fallback body.`, error);
            groups[index].add(createFallbackCarGroup(car));
            setGroupOpacity(groups[index], groups[index].visible ? 1 : 0);
          }),
      ),
    );
  }

  function loadGltfCar(car) {
    return new Promise((resolve, reject) => {
      gltfLoader.load(car.asset, resolve, undefined, reject);
    });
  }

  function mountGltfCar(group, template, car) {
    const model = template.clone(true);
    model.name = `${car.id}-gltf`;

    model.updateMatrixWorld(true);
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    group.userData.wheels = [];
    fitGltfModel(model, car);

    group.add(model);
    addAmbientOcclusionShadow(group, car);
    setGroupOpacity(group, group.visible ? 1 : 0);
  }

  function fitGltfModel(model, car) {
    model.updateMatrixWorld(true);
    let baseBox = new THREE.Box3().setFromObject(model);
    let baseSize = baseBox.getSize(new THREE.Vector3());

    if (baseSize.z > baseSize.x * 1.08) {
      model.rotation.y -= Math.PI / 2;
      model.updateMatrixWorld(true);
      baseBox = new THREE.Box3().setFromObject(model);
      baseSize = baseBox.getSize(new THREE.Vector3());
    }
    model.rotation.y += car.modelYaw || 0;
    model.updateMatrixWorld(true);

    const baseScale = car.length / Math.max(0.001, Math.max(baseSize.x, baseSize.z));
    const variantScale = car.modelScale || [1, 1, 1];
    model.scale.set(baseScale * variantScale[0], baseScale * variantScale[1], baseScale * variantScale[2]);

    const fittedBox = new THREE.Box3().setFromObject(model);
    const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
    model.position.x -= fittedCenter.x;
    model.position.z -= fittedCenter.z;
    model.position.y += 0.004 - fittedBox.min.y;
  }

  function addAmbientOcclusionShadow(group, car) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(car.length * 0.9, car.width * 1.72),
      new THREE.MeshBasicMaterial({
        map: aoTexture,
        blending: THREE.MultiplyBlending,
        toneMapped: false,
        transparent: true,
        premultipliedAlpha: true,
        opacity: 0.62,
      }),
    );
    mesh.material.userData.baseOpacity = 0.62;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.004;
    mesh.renderOrder = 2;
    group.add(mesh);
  }

  function createFallbackCarGroup(car) {
    const group = new THREE.Group();
    group.name = car.id;

    const PhysicalMaterial = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
    const paint = new PhysicalMaterial({
      color: new THREE.Color(car.paint),
      metalness: 0.72,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      transparent: true,
      opacity: 1,
    });
    paint.userData.baseOpacity = 1;

    const trim = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.trim),
      metalness: 0.5,
      roughness: 0.34,
      transparent: true,
      opacity: 1,
    });
    trim.userData.baseOpacity = 1;

    const glass = new PhysicalMaterial({
      color: 0x0e1215,
      metalness: 0.12,
      roughness: 0.08,
      clearcoat: 1,
      transmission: 0.08,
      transparent: true,
      opacity: 0.68,
    });
    glass.userData.baseOpacity = 0.68;

    const body = new THREE.Mesh(createProfileGeometry(car, createBodyUpperProfile(car), car.lower, car.width, 0.07), paint);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const cabinLower = [
      car.cabin[car.cabin.length - 1],
      car.cabin[car.cabin.length - 2],
    ];
    const cabin = new THREE.Mesh(
      createProfileGeometry(car, car.cabin.slice(0, 4), cabinLower, car.width * 0.58, 0.045),
      glass,
    );
    cabin.position.z = 0;
    cabin.castShadow = true;
    group.add(cabin);

    addWheels(group, car, trim);
    addLights(group, car);

    group.userData.featureAnchors = {
      splitter: new THREE.Vector3(-car.length / 2 - 0.28, BODY_BASE + 0.17, car.width * 0.36),
      channels: new THREE.Vector3(-car.length * 0.06, BODY_BASE + car.height * 0.38, car.width / 2 + 0.12),
      diffuser: new THREE.Vector3(car.length / 2 - 0.28, BODY_BASE + 0.18, car.width * 0.28),
    };

    return group;
  }

  function createProfileGeometry(car, upper, lower, depth, bevel) {
    const points = sampleProfilePoints(car, upper, lower);
    const shape = new THREE.Shape();
    points.forEach((point, index) => {
      const x = point.x;
      const y = point.y;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 8,
      curveSegments: 20,
    });
    geometry.translate(0, 0, -depth / 2);
    geometry.computeVertexNormals();
    return geometry;
  }

  function createBodyUpperProfile(car) {
    return car.upper.map(([x, y]) => {
      const cockpit = smoothstep(-0.62, -0.35, x) * (1 - smoothstep(0.56, 0.76, x));
      const sedanLift = car.id === "bmw" ? 0.07 : 0;
      const shoulder = 0.43 + sedanLift + smoothstep(0.45, 1, x) * 0.04;
      return [x, cockpit > 0.08 ? Math.min(y, shoulder) : y];
    });
  }

  function sampleProfilePoints(car, upper, lower) {
    const toWorld = ([x, y]) => new THREE.Vector3(x * car.length * 0.5, BODY_BASE + y * car.height, 0);
    const upperCurve = new THREE.CatmullRomCurve3(upper.map(toWorld), false, "catmullrom", 0.18);
    const lowerCurve = new THREE.CatmullRomCurve3(lower.map(toWorld), false, "catmullrom", 0.08);
    const upperPoints = upperCurve.getPoints(Math.max(24, upper.length * 10));
    const lowerPoints = lowerCurve.getPoints(Math.max(12, lower.length * 6));
    return upperPoints.concat(lowerPoints);
  }

  function addWheels(group, car, trimMaterial) {
    const wheelRadius = car.displayWheelRadius || car.wheelRadius;
    const wheelYOffset = car.displayWheelYOffset || 0;
    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.78,
      metalness: 0.18,
      transparent: true,
      opacity: 1,
    });
    tireMaterial.userData.baseOpacity = 1;

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.rim || "#c8c8c2"),
      roughness: 0.28,
      metalness: 0.85,
      transparent: true,
      opacity: 1,
    });
    rimMaterial.userData.baseOpacity = 1;

    const wheelXs = [car.wheelFront, car.wheelRear].map((value) => value * car.length * 0.5);
    const sides = car.singleSideWheels ? [1] : [-1, 1];
    wheelXs.forEach((x) => {
      sides.forEach((side) => {
        const wheel = new THREE.Group();
        const z = side * (car.width / 2 + 0.05);
        const tire = new THREE.Mesh(
          new THREE.TorusGeometry(wheelRadius, wheelRadius * 0.09, 16, 72),
          tireMaterial,
        );
        tire.castShadow = true;
        wheel.add(tire);

        const rim = new THREE.Mesh(
          new THREE.TorusGeometry(wheelRadius * 0.52, wheelRadius * 0.035, 10, 56),
          rimMaterial,
        );
        wheel.add(rim);

        for (let spokeIndex = 0; spokeIndex < 10; spokeIndex += 1) {
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(wheelRadius * 0.035, wheelRadius * 0.68, 0.026),
            rimMaterial,
          );
          spoke.position.y = wheelRadius * 0.11;
          spoke.rotation.z = (spokeIndex / 10) * Math.PI * 2;
          wheel.add(spoke);
        }

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(wheelRadius * 0.15, wheelRadius * 0.15, 0.07, 28),
          trimMaterial,
        );
        hub.rotation.x = Math.PI / 2;
        wheel.add(hub);

        wheel.position.set(x, wheelRadius + 0.03 + wheelYOffset, z);
        group.add(wheel);
      });
    });
  }

  function addLights(group, car) {
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f2db,
      emissive: 0xf7f2db,
      emissiveIntensity: 0.9,
      roughness: 0.18,
      transparent: true,
      opacity: 1,
    });
    frontMaterial.userData.baseOpacity = 1;
    const rearMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3f36,
      emissive: 0xff221b,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 1,
    });
    rearMaterial.userData.baseOpacity = 1;

    [-1, 1].forEach((side) => {
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.095, 0.24), frontMaterial);
      front.position.set(-car.length / 2 + 0.1, BODY_BASE + car.height * 0.31, side * car.width * 0.32);
      group.add(front);

      const rear = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.095, 0.26), rearMaterial);
      rear.position.set(car.length / 2 - 0.08, BODY_BASE + car.height * 0.34, side * car.width * 0.34);
      group.add(rear);
    });
  }

  function createFlowGroup(car) {
    const group = new THREE.Group();
    group.name = `${car.id}-flow`;
    group.userData.materials = [];
    const streamCount = smallViewport() ? 84 : 156;
    group.userData.streamlineCount = streamCount;

    const pressureZones = createPressureZones(car);
    pressureZones.traverse((node) => {
      if (node.material && node.material.uniforms) group.userData.materials.push(node.material);
    });
    group.add(pressureZones);

    const particleField = createAdvectedParticles(car);
    group.userData.particleField = particleField;
    group.userData.materials.push(particleField.points.material);
    group.add(particleField.points);
    group.add(particleField.debugGroup);

    const wake = createPressureWake(car);
    wake.traverse((node) => {
      if (node.material && node.material.uniforms) group.userData.materials.push(node.material);
    });
    group.add(wake);

    const debugGroup = createDebugGroup(car);
    debugGroup.visible = debugEnabled;
    group.userData.debugGroup = debugGroup;
    group.add(debugGroup);
    return group;
  }

  function createAdvectedParticles(car) {
    const count = smallViewport() ? 84 : 156;
    const trailPoints = smallViewport() ? 52 : 104;
    const trailSegments = trailPoints - 1;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const history = new Float32Array(count * trailPoints * 3);
    const linePositions = new Float32Array(count * trailSegments * 6);
    const speeds = new Float32Array(count * trailSegments * 2);
    const fades = new Float32Array(count * trailSegments * 2);
    const seeds = [];
    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < count; i += 1) {
      seeds.push(createPhysicsSeed(car, i, count));
    }

    const field = {
      car,
      count,
      trailPoints,
      trailSegments,
      positions,
      velocities,
      history,
      linePositions,
      speeds,
      fades,
      seeds,
      points: null,
      debugGroup: null,
      debugPositions: null,
      debugVectorPositions: null,
      respawnCount: 0,
      maxRespawnX: WORLD_END,
      cursor: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      flowState: { opacity: 0, reveal: 0, intensity: 0, wind: 0.6 },
    };

    for (let i = 0; i < count; i += 1) {
      respawnAdvectedParticle(field, i, i / count);
      seedTrailHistory(field, i);
      writeTracerTrail(field, i, 0.2, 0);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aFade", new THREE.BufferAttribute(fades, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uReveal: { value: 0 },
        uIntensity: { value: 0.2 },
        uWind: { value: 0.6 },
        uSeed: { value: car.id.length * 0.17 },
      },
      vertexShader: `
        attribute float aSpeed;
        attribute float aFade;
        varying float vSpeed;
        varying float vFade;

        void main() {
          vSpeed = aSpeed;
          vFade = aFade;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vSpeed;
        varying float vFade;
        uniform float uOpacity;
        uniform float uReveal;
        uniform float uIntensity;

        void main() {
          vec3 slow = vec3(0.58, 0.86, 1.0);
          vec3 mid = vec3(0.05, 0.95, 0.62);
          vec3 fast = vec3(1.0, 0.9, 0.18);
          vec3 color = mix(slow, mid, smoothstep(0.18, 0.58, vSpeed));
          color = mix(color, fast, smoothstep(0.68, 1.08, vSpeed));
          float reveal = smoothstep(0.08, 0.5, uReveal);
          float alpha = vFade * reveal * uOpacity * (0.34 + uIntensity * 0.66);
          if (alpha < 0.006) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    material.userData.baseOpacity = 1.34;

    const points = new THREE.LineSegments(geometry, material);
    points.frustumCulled = false;
    field.points = points;
    field.debugGroup = createParticleDebugLayer(field);
    return field;
  }

  function respawnAdvectedParticle(field, index, spread = 0) {
    const car = field.car;
    const seed = field.seeds[index];
    const lanePhase = (index * 0.61803398875) % 1;
    const x = spread > 0 ? lerp(WORLD_START - 0.9, WORLD_END * 0.76, spread) : WORLD_START - 1.1 - lanePhase * 0.5;
    const y = seed.y + (lanePhase - 0.5) * car.height * 0.16;
    const z = seed.z + (((index * 17) % 11) / 10 - 0.5) * car.width * 0.28;
    const offset = index * 3;
    field.positions[offset] = x;
    field.positions[offset + 1] = clamp(y, BODY_BASE + 0.1, BODY_BASE + car.height * 1.46);
    field.positions[offset + 2] = clamp(z, -car.width * 1.42, car.width * 1.42);
    field.velocities[offset] = 1;
    field.velocities[offset + 1] = 0;
    field.velocities[offset + 2] = 0;
  }

  function updateAdvectedParticles(field, delta) {
    if (!field || !field.points.visible) return;
    const { car, positions, velocities, seeds, cursor, previous, flowState } = field;
    const step = Math.min(0.033, delta) * (1.42 + flowState.wind * 0.72) * (0.72 + flowState.intensity * 1.1);
    const activeReveal = smoothstep(0.06, 0.48, flowState.reveal);

    for (let i = 0; i < field.count; i += 1) {
      const offset = i * 3;
      cursor.set(positions[offset], positions[offset + 1], positions[offset + 2]);
      previous.copy(cursor);
      const state = sampleFlowField(car, cursor, seeds[i]);
      const particleVelocity = state.velocity.clone().multiplyScalar(1.28 + state.speed * 0.54);
      particleVelocity.x = Math.max(0.22, particleVelocity.x);
      cursor.addScaledVector(particleVelocity, step);
      resolveAirCollision(car, cursor);

      const outOfBounds =
        cursor.x > WORLD_END + 0.6 ||
        cursor.y < BODY_BASE - 0.02 ||
        cursor.y > BODY_BASE + car.height * 1.7 ||
        Math.abs(cursor.z) > car.width * 1.62;

      if (outOfBounds) {
        field.respawnCount += 1;
        respawnAdvectedParticle(field, i, 0);
        seedTrailHistory(field, i);
        cursor.set(positions[offset], positions[offset + 1], positions[offset + 2]);
      }

      const inletFade = smoothstep(WORLD_START - 0.7, WORLD_START + 1.4, cursor.x);
      const exitFade = 1 - smoothstep(WORLD_END - 1.2, WORLD_END + 0.5, cursor.x);
      positions[offset] = cursor.x;
      positions[offset + 1] = cursor.y;
      positions[offset + 2] = cursor.z;
      velocities[offset] = particleVelocity.x;
      velocities[offset + 1] = particleVelocity.y;
      velocities[offset + 2] = particleVelocity.z;
      advanceTrailHistory(field, i, cursor, previous);
      const laneVisibility =
        seeds[i].channel === "roof" ||
        seeds[i].channel === "hood" ||
        seeds[i].channel === "side" ||
        seeds[i].channel === "underbody"
          ? 1
          : 0.68;
      const fade = (0.42 + inletFade * 0.58) * exitFade * activeReveal * laneVisibility;
      writeTracerTrail(field, i, state.speed, fade);
    }

    field.points.geometry.attributes.position.needsUpdate = true;
    field.points.geometry.attributes.aSpeed.needsUpdate = true;
    field.points.geometry.attributes.aFade.needsUpdate = true;
    updateParticleDebugLayer(field);
  }

  function seedTrailHistory(field, index) {
    const offset = index * 3;
    const seed = field.seeds[index];
    const interval = field.car.length * (seed.channel === "roof" ? 0.055 : seed.channel === "underbody" ? 0.046 : 0.05);
    for (let j = 0; j < field.trailPoints; j += 1) {
      const age = field.trailPoints - j - 1;
      const h = (index * field.trailPoints + j) * 3;
      const x = Math.max(WORLD_START - 1.0, field.positions[offset] - age * interval);
      const t = x / (field.car.length * 0.5);
      const body = smoothstep(-1.18, -0.82, t) * (1 - smoothstep(0.78, 1.25, t));
      const roofLift = seed.channel === "roof" || seed.channel === "hood" ? body * field.car.height * 0.16 : 0;
      const sidePush = seed.channel === "side" || seed.channel === "shoulder" ? body * seed.side * field.car.width * 0.22 : 0;
      field.history[h] = x;
      field.history[h + 1] = field.positions[offset + 1] + roofLift + (seed.channel === "side" ? body * field.car.height * 0.08 : 0);
      field.history[h + 2] = field.positions[offset + 2] + sidePush;
    }
  }

  function advanceTrailHistory(field, index, cursor, previous) {
    const base = index * field.trailPoints * 3;
    for (let j = 0; j < field.trailPoints - 1; j += 1) {
      const from = base + (j + 1) * 3;
      const to = base + j * 3;
      field.history[to] = field.history[from];
      field.history[to + 1] = field.history[from + 1];
      field.history[to + 2] = field.history[from + 2];
    }
    const tail = base + (field.trailPoints - 1) * 3;
    field.history[tail] = cursor.x;
    field.history[tail + 1] = cursor.y;
    field.history[tail + 2] = cursor.z;

    if (cursor.x <= previous.x) {
      field.history[tail] = previous.x + 0.001;
    }
  }

  function writeTracerTrail(field, index, speed, fade) {
    const baseHistory = index * field.trailPoints * 3;
    const baseLine = index * field.trailSegments * 6;
    const baseSpeed = index * field.trailSegments * 2;
    for (let j = 0; j < field.trailSegments; j += 1) {
      const from = baseHistory + j * 3;
      const to = baseHistory + (j + 1) * 3;
      const line = baseLine + j * 6;
      const attr = baseSpeed + j * 2;
      const amount = (j + 1) / field.trailSegments;
      const midX = (field.history[from] + field.history[to]) * 0.5;
      const midY = (field.history[from + 1] + field.history[to + 1]) * 0.5;
      const t = midX / (field.car.length * 0.5);
      const silhouette = smoothstep(-1.12, -0.86, t) * (1 - smoothstep(0.86, 1.12, t));
      const roofLine = sampleUpper(field.car, clamp(t, -1, 1)) + field.car.height * 0.08;
      const lowerLine = BODY_BASE + field.car.height * 0.1;
      const insideSideView = silhouette > 0.02 && midY > lowerLine && midY < roofLine;
      const occlusion = insideSideView ? 0.08 : 1;
      const trailFade = fade * occlusion * (0.22 + amount * 0.78) * smoothstep(0.0, 0.16, amount);
      field.linePositions[line] = field.history[from];
      field.linePositions[line + 1] = field.history[from + 1];
      field.linePositions[line + 2] = field.history[from + 2];
      field.linePositions[line + 3] = field.history[to];
      field.linePositions[line + 4] = field.history[to + 1];
      field.linePositions[line + 5] = field.history[to + 2];
      field.speeds[attr] = speed;
      field.speeds[attr + 1] = speed;
      field.fades[attr] = trailFade * 0.72;
      field.fades[attr + 1] = trailFade;
    }
  }

  function createParticleDebugLayer(field) {
    const group = new THREE.Group();
    group.visible = debugEnabled;
    const sampleCount = Math.min(96, field.count);
    const debugPositions = new Float32Array(sampleCount * 3);
    const debugVectorPositions = new Float32Array(sampleCount * 6);
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(debugPositions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.62,
      size: 0.035,
      sizeAttenuation: true,
      depthWrite: false,
    });
    group.add(new THREE.Points(pointGeometry, pointMaterial));

    const vectorGeometry = new THREE.BufferGeometry();
    vectorGeometry.setAttribute("position", new THREE.BufferAttribute(debugVectorPositions, 3));
    const vectorMaterial = new THREE.LineBasicMaterial({
      color: 0xff8a46,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    group.add(new THREE.LineSegments(vectorGeometry, vectorMaterial));

    const boundaryMaterial = new THREE.LineBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const y0 = BODY_BASE - 0.05;
    const y1 = BODY_BASE + field.car.height * 1.55;
    const z0 = -field.car.width * 1.55;
    const z1 = field.car.width * 1.55;
    const boundaryPositions = new Float32Array([
      WORLD_START, y0, z0, WORLD_START, y1, z0,
      WORLD_START, y1, z0, WORLD_START, y1, z1,
      WORLD_START, y1, z1, WORLD_START, y0, z1,
      WORLD_START, y0, z1, WORLD_START, y0, z0,
      WORLD_END, y0, z0, WORLD_END, y1, z0,
      WORLD_END, y1, z0, WORLD_END, y1, z1,
      WORLD_END, y1, z1, WORLD_END, y0, z1,
      WORLD_END, y0, z1, WORLD_END, y0, z0,
    ]);
    const boundaryGeometry = new THREE.BufferGeometry();
    boundaryGeometry.setAttribute("position", new THREE.BufferAttribute(boundaryPositions, 3));
    group.add(new THREE.LineSegments(boundaryGeometry, boundaryMaterial));

    field.debugPositions = debugPositions;
    field.debugVectorPositions = debugVectorPositions;
    field.debugSampleCount = sampleCount;
    return group;
  }

  function updateParticleDebugLayer(field) {
    if (!field?.debugGroup?.visible) return;
    const stride = Math.max(1, Math.floor(field.count / field.debugSampleCount));
    for (let i = 0; i < field.debugSampleCount; i += 1) {
      const source = Math.min(field.count - 1, i * stride);
      const p = source * 3;
      const d = i * 3;
      const v = i * 6;
      field.debugPositions[d] = field.positions[p];
      field.debugPositions[d + 1] = field.positions[p + 1];
      field.debugPositions[d + 2] = field.positions[p + 2];
      field.debugVectorPositions[v] = field.positions[p];
      field.debugVectorPositions[v + 1] = field.positions[p + 1];
      field.debugVectorPositions[v + 2] = field.positions[p + 2];
      field.debugVectorPositions[v + 3] = field.positions[p] + field.velocities[p] * 0.16;
      field.debugVectorPositions[v + 4] = field.positions[p + 1] + field.velocities[p + 1] * 0.16;
      field.debugVectorPositions[v + 5] = field.positions[p + 2] + field.velocities[p + 2] * 0.16;
    }
    const pointGeometry = field.debugGroup.children[0].geometry;
    const vectorGeometry = field.debugGroup.children[1].geometry;
    pointGeometry.attributes.position.needsUpdate = true;
    vectorGeometry.attributes.position.needsUpdate = true;
  }

  function createAeroEnvelope(car) {
    const group = new THREE.Group();
    const material = createEnvelopeMaterial();
    const topPoints = [];
    const bottomPoints = [];
    const centerTopPoints = [];
    const segments = 156;
    const aero = getAero(car);

    for (let i = 0; i <= segments; i += 1) {
      const x = lerp(WORLD_START - 0.15, WORLD_END + 0.15, i / segments);
      const t = x / (car.length * 0.5);
      const body = smoothstep(-1.28, -0.72, t) * (1 - smoothstep(0.78, 1.42, t));
      const wake = smoothstep(0.78, 1.3, t) * (1 - smoothstep(1.3, 2.8, t));
      const upper = BODY_BASE + car.height * (1.03 + body * (0.38 + aero.roofAttachment * 0.08) + wake * 0.12);
      const lower = BODY_BASE + car.height * (0.02 - body * 0.02 + wake * 0.02);
      const topZ = car.width * (0.72 + body * 0.1);
      topPoints.push(new THREE.Vector3(x, upper, topZ));
      centerTopPoints.push(new THREE.Vector3(x, upper + car.height * 0.05, 0));
      bottomPoints.push(new THREE.Vector3(x, lower, car.width * 0.48));
    }

    [
      topPoints,
      topPoints.map((point) => point.clone().setZ(-point.z)),
      centerTopPoints,
      bottomPoints,
      bottomPoints.map((point) => point.clone().setZ(-point.z)),
    ].forEach((points, index) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material.clone());
      line.material.userData.baseOpacity = index === 2 ? 0.2 : 0.28;
      group.add(line);
    });
    return group;
  }

  function createEnvelopeMaterial() {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uReveal: { value: 0 },
        uIntensity: { value: 0 },
        uWind: { value: 0.6 },
        uSeed: { value: 0.12 },
      },
      vertexShader: `
        varying float vX;
        void main() {
          vX = position.x;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vX;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uReveal;
        uniform float uIntensity;
        uniform float uWind;

        void main() {
          float dash = 0.45 + 0.55 * smoothstep(0.2, 1.0, fract(vX * 1.6 - uTime * (0.32 + uWind * 0.18)));
          float alpha = dash * uOpacity * smoothstep(0.25, 0.7, uReveal) * (0.18 + uIntensity * 0.26);
          gl_FragColor = vec4(0.04, 0.92, 0.62, alpha);
        }
      `,
    });
    material.userData.baseOpacity = 0.28;
    return material;
  }

  function getAeroSpacePoint(car, x, seed, sourceY, sourceZ) {
    const t = x / (car.length * 0.5);
    const body = smoothstep(-1.24, -0.74, t) * (1 - smoothstep(0.76, 1.32, t));
    const wake = smoothstep(0.78, 1.24, t) * (1 - smoothstep(1.24, 2.6, t));
    const top = sampleUpper(car, clamp(t, -1, 1)) + car.height * (0.16 + body * 0.16);
    const lower = BODY_BASE + car.height * 0.08;
    const side = seed.side || Math.sign(seed.lane || 1);
    let y = sourceY;
    let z = sourceZ;

    if (seed.channel === "roof") {
      y = lerp(y, top + car.height * 0.34, body * 0.96);
      z = lerp(z, seed.lane * car.width * 0.18, 0.18);
    } else if (seed.channel === "hood" || seed.channel === "wake") {
      y = lerp(y, top + car.height * 0.18, body * 0.9);
      z = lerp(z, seed.lane * car.width * 0.22, 0.18);
    } else if (seed.channel === "underbody") {
      y = lerp(y, lower, body * 0.94);
      z = lerp(z, seed.lane * car.width * 0.28, 0.22);
    } else {
      y = lerp(y, top + car.height * (0.04 + Math.abs(seed.lane || 0) * 0.08), body * 0.78);
      z = lerp(z, side * car.width * (1.04 + Math.abs(seed.lane || 0) * 0.34), body * 0.92);
    }

    y += Math.sin(t * 6.0 + seed.type) * wake * getAero(car).turbulence * car.height * 0.25;
    z += side * wake * getAero(car).wakeSpread * car.width * 0.12;
    return { y, z };
  }

  function constrainToAeroSpace(car, point, velocity, seed) {
    const shaped = getAeroSpacePoint(car, point.x, seed, point.y, point.z);
    const t = point.x / (car.length * 0.5);
    const body = smoothstep(-1.25, -0.78, t) * (1 - smoothstep(0.82, 1.36, t));
    const pull = seed.channel === "underbody" ? 0.16 : seed.channel === "side" || seed.channel === "shoulder" ? 0.2 : 0.24;
    point.y = lerp(point.y, shaped.y, body * pull);
    point.z = lerp(point.z, shaped.z, body * pull);

    const field = sampleCarField(car, point);
    const inSilhouette = field.bodyWindow > 0.02 && field.distance < 1.18;
    if (inSilhouette) {
      const side = seed.side || Math.sign(seed.lane || 1);
      if (seed.channel === "underbody") {
        point.y = Math.min(point.y, BODY_BASE + car.height * 0.08);
      } else if (seed.channel === "side" || seed.channel === "shoulder") {
        point.y = Math.max(point.y, sampleUpper(car, field.clampedT) + car.height * 0.04);
        point.z = side * Math.max(Math.abs(point.z), field.radiusZ * 1.28);
      } else {
        point.y = Math.max(point.y, sampleUpper(car, field.clampedT) + car.height * 0.14);
      }
    }

    const upperBound = BODY_BASE + car.height * (1.46 + body * 0.3);
    const lowerBound = BODY_BASE + 0.012;
    if (point.y > upperBound) {
      point.y = lerp(point.y, upperBound, 0.4);
      velocity.y *= 0.25;
    }
    if (point.y < lowerBound) {
      point.y = lowerBound;
      velocity.y = Math.max(0, velocity.y);
    }
  }

  function createDebugGroup(car) {
    const group = new THREE.Group();
    const aero = getAero(car);

    const volumeMaterial = new THREE.MeshBasicMaterial({
      color: 0x3c5cff,
      transparent: true,
      opacity: 0.11,
      wireframe: true,
      depthWrite: false,
    });
    const collision = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), volumeMaterial);
    collision.scale.set(car.length * 0.52, car.height * 0.58, car.width * 0.52);
    collision.position.set(0, BODY_BASE + car.height * 0.54, 0);
    group.add(collision);

    const wakeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd000,
      transparent: true,
      opacity: 0.14,
      wireframe: true,
      depthWrite: false,
    });
    const wake = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wakeMaterial);
    wake.scale.set(car.length * (0.7 + aero.wakeLength * 0.28), car.height * (0.62 + aero.wake * 0.16), car.width * (0.86 + aero.wakeSpread * 0.34));
    wake.position.set(car.length * 0.78, BODY_BASE + car.height * 0.52, 0);
    group.add(wake);

    const frontMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8a46,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
      depthWrite: false,
    });
    const front = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), frontMaterial);
    front.scale.set(car.length * 0.22, car.height * 0.74, car.width * (0.62 + aero.split * 0.08));
    front.position.set(-car.length * 0.5, BODY_BASE + car.height * 0.48, 0);
    group.add(front);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), volumeMaterial.clone());
    roof.material.color.set(0x00b8ff);
    roof.material.opacity = 0.12;
    roof.scale.set(car.length * 0.48, car.height * 0.22, car.width * 0.44);
    roof.position.set(-car.length * 0.05, BODY_BASE + car.height * (0.94 + aero.roofAttachment * 0.035), 0);
    group.add(roof);

    [-1, 1].forEach((side) => {
      const sideZone = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), volumeMaterial.clone());
      sideZone.material.color.set(0x00ff8a);
      sideZone.material.opacity = 0.1;
      sideZone.scale.set(car.length * 0.66, car.height * 0.38, car.width * 0.14);
      sideZone.position.set(0.05, BODY_BASE + car.height * 0.43, side * car.width * (0.55 + aero.sideChannel * 0.05));
      group.add(sideZone);
    });

    const vectorPositions = [];
    const vectorMaterial = new THREE.LineBasicMaterial({
      color: 0x00b8ff,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const lanes = [-0.72, -0.32, 0.32, 0.72];
    for (let xi = 0; xi < 7; xi += 1) {
      const x = lerp(-car.length * 0.82, car.length * 1.18, xi / 6);
      lanes.forEach((lane, laneIndex) => {
        const seed = createPhysicsSeed(car, laneIndex, lanes.length);
        const p = new THREE.Vector3(x, seed.y, lane * car.width);
        const state = sampleFlowField(car, p, seed);
        const end = p.clone().add(state.velocity.clone().normalize().multiplyScalar(0.18 + state.speed * 0.12));
        vectorPositions.push(p.x, p.y, p.z, end.x, end.y, end.z);
      });
    }
    const vectorGeometry = new THREE.BufferGeometry();
    vectorGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vectorPositions, 3));
    group.add(new THREE.LineSegments(vectorGeometry, vectorMaterial));

    const seedCount = smallViewport() ? 56 : 124;
    const seedPositions = new Float32Array(seedCount * 3);
    for (let i = 0; i < seedCount; i += 1) {
      const seed = createPhysicsSeed(car, i, seedCount);
      const offset = i * 3;
      seedPositions[offset] = WORLD_START + 0.12;
      seedPositions[offset + 1] = seed.y;
      seedPositions[offset + 2] = seed.z;
    }
    const seedGeometry = new THREE.BufferGeometry();
    seedGeometry.setAttribute("position", new THREE.BufferAttribute(seedPositions, 3));
    const seedMaterial = new THREE.PointsMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.54,
      size: 0.025,
      sizeAttenuation: true,
      depthWrite: false,
    });
    group.add(new THREE.Points(seedGeometry, seedMaterial));

    return group;
  }

  function createPressureZones(car) {
    const group = new THREE.Group();
    const aero = getAero(car);

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 32, 16),
      createPressureZoneMaterial(new THREE.Color(0xffd36a), 0.14, 0.18),
    );
    front.material.userData.baseOpacity = 1;
    front.position.set(-car.length * 0.54, BODY_BASE + car.height * 0.48, 0);
    front.rotation.y = Math.PI / 2;
    front.scale.set(car.width * (0.82 + aero.split * 0.08), car.height * 0.72, 1);
    group.add(front);

    const roof = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 40, 10),
      createPressureZoneMaterial(new THREE.Color(0x7cc8ff), 0.12, 0.46),
    );
    roof.material.userData.baseOpacity = 1;
    roof.position.set(-car.length * 0.08, BODY_BASE + car.height * 1.04, 0);
    roof.rotation.x = -Math.PI / 2;
    roof.scale.set(car.length * 0.58, car.width * 0.62, 1);
    group.add(roof);

    [-1, 1].forEach((side) => {
      const sideZone = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 40, 8),
        createPressureZoneMaterial(new THREE.Color(0x63f0b0), 0.1, 0.34),
      );
      sideZone.material.userData.baseOpacity = 1;
      sideZone.position.set(0.08, BODY_BASE + car.height * 0.42, side * car.width * 0.62);
      sideZone.scale.set(car.length * 0.68, car.height * 0.42, 1);
      group.add(sideZone);
    });

    const under = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 36, 8),
      createPressureZoneMaterial(new THREE.Color(0xffffff), 0.09, 0.28),
    );
    under.material.userData.baseOpacity = 1;
    under.position.set(0.06, BODY_BASE + 0.13, 0);
    under.rotation.x = -Math.PI / 2;
    under.scale.set(car.length * 0.7, car.width * 0.54, 1);
    group.add(under);

    const wake = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 48, 16),
      createPressureZoneMaterial(new THREE.Color(0x89d8ff), 0.13, 0.62),
    );
    wake.material.userData.baseOpacity = 1;
    wake.position.set(car.length * (0.62 + aero.wakeLength * 0.08), BODY_BASE + car.height * 0.54, 0);
    wake.rotation.y = Math.PI / 2;
    wake.scale.set(car.width * (0.74 + aero.wakeSpread * 0.34), car.height * (0.55 + aero.wake * 0.22), 1);
    group.add(wake);

    return group;
  }

  function createPressureZoneMaterial(color, alpha, pulse) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uReveal: { value: 0 },
        uIntensity: { value: 0 },
        uWind: { value: 0.6 },
        uSeed: { value: pulse },
        uColor: { value: color },
        uAlpha: { value: alpha },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uReveal;
        uniform float uIntensity;
        uniform float uWind;
        uniform float uSeed;
        uniform float uAlpha;
        uniform vec3 uColor;

        void main() {
          vec2 centered = vUv * 2.0 - 1.0;
          float envelope = (1.0 - smoothstep(0.58, 1.02, length(centered)));
          float lines = 0.72 + 0.28 * sin((vUv.x * 18.0 - uTime * (0.18 + uWind * 0.08) + uSeed) * 6.2831853);
          float reveal = smoothstep(0.38, 0.76, uReveal);
          float alpha = envelope * lines * uAlpha * uOpacity * reveal * (0.4 + uIntensity * 0.7);
          if (alpha < 0.004) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
    material.userData.baseOpacity = alpha;
    return material;
  }

  function createFlowTube(car, points, radius, seed, type, sampledSpeeds = null) {
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.32);
    const segments = smallViewport() ? 90 : 150;
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 5, false);
    const speeds = [];
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) {
      const u = uv.getX(i);
      if (sampledSpeeds && sampledSpeeds.length > 1) {
        const index = Math.min(sampledSpeeds.length - 1, Math.floor(u * (sampledSpeeds.length - 1)));
        speeds.push(sampledSpeeds[index]);
      } else {
        const x = WORLD_START + (WORLD_END - WORLD_START) * u;
        const t = x / (car.length * 0.5);
        const around = smoothstep(-1.12, -0.62, t) * (1 - smoothstep(0.62, 1.12, t));
        const roof = smoothstep(-0.5, -0.08, t) * (1 - smoothstep(0.18, 0.72, t));
        const wake = smoothstep(0.82, 1.22, t) * (1 - smoothstep(1.22, 2.5, t));
        const channelBoost = type === 1 || type === 4 ? 0.2 : 0;
        speeds.push(0.22 + around * 0.42 + roof * 0.36 + wake * 0.18 + channelBoost);
      }
    }
    geometry.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uReveal: { value: 0 },
        uIntensity: { value: 0.2 },
        uWind: { value: 0.6 },
        uSeed: { value: seed * 0.137 },
      },
      vertexShader: `
        attribute float aSpeed;
        varying vec2 vUv;
        varying float vSpeed;
        uniform float uTime;
        uniform float uWind;
        uniform float uSeed;

        void main() {
          vUv = uv;
          vSpeed = aSpeed;
          vec3 p = position;
          float wave = sin((uv.x * 9.0 + uTime * (0.35 + uWind * 0.2) + uSeed) * 6.2831853);
          p += normal * wave * 0.0028 * uWind;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        varying float vSpeed;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uReveal;
        uniform float uIntensity;
        uniform float uWind;
        uniform float uSeed;

        void main() {
          float reveal = smoothstep(vUv.x - 0.12, vUv.x + 0.035, uReveal);
          float endFade = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.95, 1.0, vUv.x));
          float core = 1.0 - smoothstep(0.04, 0.36, abs(vUv.y - 0.5));
          float packetPhase = fract(vUv.x * 10.0 - uTime * (0.42 + uWind * 0.38 + vSpeed * 0.18) - uSeed);
          float packet = smoothstep(0.0, 0.08, packetPhase) * (1.0 - smoothstep(0.26, 0.72, packetPhase));
          float finePhase = fract(vUv.x * 28.0 - uTime * (0.9 + uWind * 0.42) - uSeed * 1.7);
          float fineTrace = smoothstep(0.2, 1.0, finePhase);
          vec3 slow = vec3(0.78, 0.9, 1.0);
          vec3 mid = vec3(0.12, 0.92, 0.52);
          vec3 fast = vec3(0.98, 0.86, 0.28);
          vec3 color = mix(slow, mid, smoothstep(0.16, 0.62, vSpeed));
          color = mix(color, fast, smoothstep(0.68, 1.12, vSpeed));
          float alpha = (0.34 + packet * 1.05 + fineTrace * 0.18) * core * reveal * endFade * uOpacity * uIntensity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    material.userData.baseOpacity = type === 2 ? 0.92 : 1.18;

    return new THREE.Mesh(geometry, material);
  }

  function createPhysicsSeed(car, index, total) {
    const groups = 6;
    const row = Math.floor(index / groups);
    const rows = Math.max(1, Math.ceil(total / groups) - 1);
    const ratio = rows <= 0 ? 0.5 : row / rows;
    const lane = ratio * 2 - 1;
    const type = index % groups;
    const side = (row + type) % 2 === 0 ? -1 : 1;
    const jitter = ((index * 37) % 19) / 19 - 0.5;
    const absLane = Math.abs(lane);

    if (type === 0) {
      return {
        type,
        channel: "roof",
        lane,
        side: Math.sign(lane || 1),
        y: BODY_BASE + car.height * (0.7 + jitter * 0.025),
        z: lane * car.width * 0.18,
      };
    }

    if (type === 1) {
      return {
        type,
        channel: "hood",
        lane,
        side: Math.sign(lane || 1),
        y: BODY_BASE + car.height * (0.5 + absLane * 0.06 + jitter * 0.02),
        z: lane * car.width * 0.22,
      };
    }

    if (type === 2) {
      return {
        type,
        channel: "underbody",
        lane,
        side: Math.sign(lane || 1),
        y: BODY_BASE + car.height * (0.12 + jitter * 0.012),
        z: lane * car.width * 0.34,
      };
    }

    if (type === 3) {
      return {
        type,
        channel: "side",
        lane: side * Math.max(0.28, absLane),
        side,
        y: BODY_BASE + car.height * (0.46 + absLane * 0.13 + jitter * 0.02),
        z: side * car.width * (0.58 + absLane * 0.32),
      };
    }

    if (type === 4) {
      return {
        type,
        channel: "shoulder",
        lane: side * Math.max(0.2, absLane),
        side,
        y: BODY_BASE + car.height * (0.68 + absLane * 0.12 + jitter * 0.02),
        z: side * car.width * (0.66 + absLane * 0.22),
      };
    }

    return {
      type,
      channel: "wake",
      lane,
      side: Math.sign(lane || 1),
      y: BODY_BASE + car.height * (0.62 + lane * 0.06 + jitter * 0.03),
      z: lane * car.width * 0.28,
    };
  }

  function traceStreamline(car, seed) {
    const points = [];
    const speeds = [];
    const steps = smallViewport() ? 90 : 128;
    const dx = (WORLD_END - WORLD_START) / steps;
    const baseY = seed.y;
    const baseZ = seed.z;
    const p = new THREE.Vector3(WORLD_START, baseY, baseZ);

    for (let i = 0; i <= steps; i += 1) {
      resolveAirCollision(car, p);
      const state = sampleFlowField(car, p, seed);
      const wake = smoothstep(car.length * 0.45, car.length * 1.1, p.x);
      const rejoin = wake * wake;
      p.y = lerp(p.y, baseY - 0.04, rejoin * 0.035);
      p.z = lerp(p.z, baseZ * 0.28, rejoin * 0.055);
      points.push(p.clone());
      speeds.push(state.speed);

      const invX = 1 / Math.max(0.24, state.velocity.x);
      p.x += dx;
      p.y += state.velocity.y * invX * dx;
      p.z += state.velocity.z * invX * dx;
      resolveAirCollision(car, p);
      p.y = clamp(p.y, BODY_BASE + 0.08, BODY_BASE + car.height * 1.42);
      p.z = clamp(p.z, -car.width * 1.35, car.width * 1.35);
    }

    return { points, speeds };
  }

  function sampleFlowField(car, point, seed) {
    const aero = getAero(car);
    const field = sampleCarField(car, point);
    const t = field.t;
    const channel = seed.channel || "roof";
    const nearBody = field.bodyWindow * Math.exp(-Math.max(0, field.distance - 1) * 2.1);
    const surfaceLayer = field.bodyWindow * smoothstep(1.72, 0.92, field.distance);
    const noseRamp = smoothstep(-1.34, -0.9, t) * (1 - smoothstep(-0.62, -0.12, t));
    const hoodRamp = smoothstep(-1.02, -0.5, t) * (1 - smoothstep(-0.08, 0.36, t));
    const roofRamp = smoothstep(-0.45, -0.06, t) * (1 - smoothstep(0.32, 0.86, t));
    const tailRamp = smoothstep(0.34, 0.86, t) * (1 - smoothstep(0.86, 1.22, t));
    const wakeStart = 0.78 + (1 - aero.roofAttachment) * 0.08;
    const wake = smoothstep(wakeStart, wakeStart + 0.34, t) * (1 - smoothstep(1.42 + aero.wakeLength * 0.42, 3.0 + aero.wakeLength * 0.38, t));
    const sideSign = seed.side || (point.z < 0 ? -1 : 1);
    const roofIntent = channel === "roof" ? 1 : channel === "hood" || channel === "wake" ? 0.62 : channel === "shoulder" ? 0.38 : 0.16;
    const sideIntent = channel === "side" || channel === "shoulder" ? 1 : Math.min(1, Math.abs(seed.lane || 0) * 0.72);
    const underIntent = channel === "underbody" ? 1 : 0.14;

    const velocity = new THREE.Vector3(1, 0, 0);
    const incoming = velocity.dot(field.normal);
    if (incoming < 0 && surfaceLayer > 0.02) {
      velocity.addScaledVector(field.normal, -incoming * surfaceLayer * aero.surfaceGrip * (0.92 + aero.roofAttachment * 0.18));
    }

    const compression = smoothstep(-1.58, -1.08, t) * (1 - smoothstep(-1.02, -0.58, t));
    velocity.x -= compression * aero.frontCompression * field.frontBand * 0.18;
    velocity.addScaledVector(field.normal, nearBody * aero.blockage * (1.42 - Math.min(1.42, field.distance)) * (0.23 + compression * 0.1));

    const roofAttachment = field.roofBand * (hoodRamp * 0.7 + roofRamp) * aero.roofAttachment;
    const roofSpeed = field.roofBand * aero.roofAccel * (0.24 + roofIntent * 0.28);
    velocity.x += nearBody * 0.18 + roofSpeed + field.sideBand * aero.sideChannel * (0.12 + sideIntent * 0.16);
    velocity.y += field.profileSlope * roofAttachment * aero.surfaceGrip * 0.82;
    velocity.y += noseRamp * aero.split * (0.06 + roofIntent * 0.18);
    velocity.y += hoodRamp * roofIntent * aero.roofAccel * 0.11;
    velocity.y -= tailRamp * field.roofBand * (0.12 + aero.wake * 0.22 + (1 - aero.roofAttachment) * 0.14);

    velocity.z += sideSign * noseRamp * aero.split * field.frontBand * (0.18 + sideIntent * 0.2);
    velocity.z += sideSign * field.sideBand * aero.sideChannel * (0.12 + sideIntent * 0.2);
    velocity.z += sideSign * hoodRamp * sideIntent * aero.sideChannel * 0.06;

    velocity.x += field.underBand * aero.underbodyAccel * (0.2 + underIntent * 0.24);
    velocity.y -= field.underBand * underIntent * 0.1;
    velocity.y += tailRamp * field.underBand * aero.underbodyAccel * 0.16;
    velocity.z += sideSign * field.underBand * underIntent * aero.sideChannel * 0.06;

    const mirrorX = Math.exp(-((t + 0.1) * (t + 0.1)) / 0.028);
    const mirrorY = smoothstep(0.34, 0.78, (point.y - BODY_BASE) / Math.max(0.1, car.height));
    const mirrorZ = smoothstep(0.42, 0.9, Math.abs(point.z) / Math.max(0.2, car.width * 0.5));
    const mirrorWake = mirrorX * mirrorY * mirrorZ * aero.mirrorVortex;
    velocity.y += Math.sin(t * 18 + seed.lane * 4.4) * mirrorWake * 0.07;
    velocity.z += sideSign * Math.cos(t * 12 + seed.lane * 2.7) * mirrorWake * 0.09;

    const wakeCoreY = smoothstep(1.05, 0.08, Math.abs(point.y - (BODY_BASE + car.height * 0.48)) / Math.max(0.2, car.height));
    const wakeCoreZ = smoothstep(1.15 + aero.wakeSpread * 0.35, 0.08, Math.abs(point.z) / Math.max(0.24, car.width));
    const wakeCore = wake * wakeCoreY * wakeCoreZ;
    const wakePhase = t * (7.0 + aero.wake * 4.0) + seed.lane * 4.6 + seed.type * 0.7;
    velocity.x -= wake * aero.wake * (0.12 + wakeCore * 0.22);
    
    // Chaotic wake turbulence (pseudo-random noise instead of uniform sine)
    const wakeNoise1 = fract(Math.sin(wakePhase * 12.9898 + seed.lane * 78.233) * 43758.5453);
    const wakeNoise2 = fract(Math.sin(wakePhase * 17.9898 + seed.type * 37.719) * 43758.5453);
    const wakeNoise3 = fract(Math.sin(wakePhase * 23.451 + seed.side * 91.173) * 43758.5453);
    velocity.y += (wakeNoise1 - 0.5) * 2.0 * aero.turbulence * wake * (0.16 + wakeCore * 0.16);
    velocity.y += Math.sin(wakePhase * Math.PI * 0.3) * aero.turbulence * wake * 0.08;
    velocity.z += sideSign * (wakeNoise2 - 0.5) * 2.0 * aero.turbulence * wake * (0.2 + wakeCore * 0.2);
    velocity.z += sideSign * Math.cos(wakePhase * Math.PI * 0.8) * aero.turbulence * wake * 0.1;
    velocity.z -= sideSign * wake * aero.wakeSpread * 0.08;
    velocity.y -= wakeCore * aero.wake * 0.05;

    // Boundary layer / no-slip condition
    const boundaryLayerThickness = 0.18;
    if (field.distance < 1 + boundaryLayerThickness && field.bodyWindow > 0.02) {
      const boundaryFactor = Math.max(0, (field.distance - 1) / boundaryLayerThickness);
      const normalComponent = velocity.dot(field.normal);
      const tangent = velocity.clone().sub(field.normal.clone().multiplyScalar(normalComponent));
      tangent.multiplyScalar(boundaryFactor * boundaryFactor);
      velocity.copy(field.normal.clone().multiplyScalar(normalComponent)).add(tangent);
      const surfaceGradient = new THREE.Vector3(1, field.profileSlope, 0).normalize();
      velocity.addScaledVector(surfaceGradient, (1 - boundaryFactor) * 0.04 * aero.surfaceGrip);
    }

    // Ground boundary layer
    const groundHeight = point.y - BODY_BASE;
    const groundLayer = smoothstep(0.25, 0.0, groundHeight);
    velocity.y += groundLayer * 0.06;
    velocity.x -= groundLayer * 0.015;

    const rawSpeed = velocity.length();
    const curvatureAccel = Math.abs(field.profileSlope) * field.roofBand * aero.roofAccel * (0.6 + roofIntent * 0.4);
    const channelAccel = field.sideBand * aero.sideChannel * (0.22 + sideIntent * 0.18);
    const underAccel = field.underBand * aero.underbodyAccel * (0.12 + underIntent * 0.18);
    const speed = clamp(0.12 + rawSpeed * 0.5 + curvatureAccel * 0.46 + channelAccel + underAccel - wake * aero.wake * 0.09, 0.1, 1.28);
    velocity.x = Math.max(0.18, velocity.x);
    return { velocity, speed };
  }

  function resolveAirCollision(car, point) {
    const field = sampleCarField(car, point);
    const clearance = 0.06;
    if (!field.bodyWindow || field.distance >= 1 + clearance) return;
    const push = (1 + clearance - field.distance) * Math.min(field.radiusY, field.radiusZ);
    point.addScaledVector(field.normal, push);
    
    // Double-check we didn't land inside due to curved surface
    const field2 = sampleCarField(car, point);
    if (field2.distance < 1) {
      point.addScaledVector(field2.normal, (1 - field2.distance) * Math.min(field2.radiusY, field2.radiusZ) * 0.5);
    }
  }

  function sampleCarField(car, point) {
    const halfLength = car.length * 0.5;
    const t = point.x / halfLength;
    const clampedT = clamp(t, -1, 1);
    const bodyWindow = smoothstep(-1.34, -0.92, t) * (1 - smoothstep(0.92, 1.38, t));
    const top = sampleUpper(car, clampedT) + 0.08;
    const bottom = BODY_BASE + 0.09;
    const centerY = (top + bottom) * 0.5;
    const radiusY = Math.max(0.22, (top - bottom) * 0.5 + 0.16);
    const radiusZ = Math.max(0.34, halfWidthAt(car, clampedT) + 0.13);
    const dy = point.y - centerY;
    const dz = point.z;
    const distance = Math.sqrt((dy / radiusY) ** 2 + (dz / radiusZ) ** 2);
    const profileSlope = getUpperSlope(car, clampedT);
    const widthSlope = getWidthSlope(car, clampedT);
    const noseRamp = smoothstep(-1.18, -0.78, t) * (1 - smoothstep(-0.78, -0.18, t));
    const tailRamp = smoothstep(0.42, 0.92, t) * (1 - smoothstep(0.92, 1.22, t));
    const normal = new THREE.Vector3(
      -noseRamp * 0.84 + tailRamp * 0.22,
      dy / (radiusY * radiusY) - profileSlope * 0.16,
      dz / (radiusZ * radiusZ) - Math.sign(dz || 1) * widthSlope * 0.1,
    ).normalize();
    const roofBand = smoothstep(0.1, 0.96, dy / radiusY) * bodyWindow * smoothstep(1.75, 0.75, distance);
    const sideBand = smoothstep(0.42, 1.14, Math.abs(dz) / radiusZ) * bodyWindow * smoothstep(1.72, 0.86, distance);
    const underBand = smoothstep(0.86, 0.08, (point.y - bottom) / Math.max(0.12, radiusY)) * bodyWindow;
    const frontBand = noseRamp * bodyWindow * smoothstep(1.85, 0.78, distance);
    return {
      t,
      clampedT,
      bodyWindow,
      distance,
      normal,
      radiusY,
      radiusZ,
      roofBand,
      sideBand,
      underBand,
      frontBand,
      profileSlope,
    };
  }

  function getAero(car) {
    return car.aero || {
      split: 0.85,
      surfaceGrip: 0.85,
      roofAccel: 0.8,
      sideChannel: 0.5,
      wake: 0.5,
      turbulence: 0.1,
      blockage: 0.8,
      frontCompression: 0.8,
      roofAttachment: 0.9,
      underbodyAccel: 0.6,
      wakeSpread: 0.7,
      wakeLength: 0.9,
      mirrorVortex: 0.24,
    };
  }

  function createPressureWake(car) {
    const group = new THREE.Group();
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uReveal: { value: 1 },
        uIntensity: { value: 1 },
        uWind: { value: 1 },
        uSeed: { value: 0.42 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uIntensity;
        uniform float uWind;

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          uv.x *= 1.65;
          float vortex = sin((uv.x * 5.4 + uTime * (0.52 + uWind * 0.3)) + sin(uv.y * 8.0 + uTime * 0.7) * 0.7);
          float lane = smoothstep(0.07, 0.0, abs(fract((uv.y + 1.0) * 9.0 + uv.x * 0.38 - uTime * (0.36 + uWind * 0.28)) - 0.5));
          float swirl = smoothstep(0.2, 1.0, vortex * 0.5 + 0.5);
          float envelope = (1.0 - smoothstep(0.66, 1.08, abs(uv.y))) * smoothstep(-0.98, -0.32, uv.x) * (1.0 - smoothstep(0.8, 1.05, uv.x));
          float alpha = (lane * 0.72 + swirl * 0.28) * envelope * 0.55 * uOpacity * uIntensity;
          vec3 color = mix(vec3(0.55, 0.78, 1.0), vec3(0.12, 0.95, 0.48), smoothstep(-0.2, 0.85, uv.x));
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    material.userData.baseOpacity = 0.56;

    const positions = [
      [car.length / 2 + 0.8, BODY_BASE + car.height * 0.58, 0, 1.4, 0.58],
      [car.length / 2 + 1.55, BODY_BASE + car.height * 0.43, 0, 1.9, 0.42],
      [car.length / 2 + 0.35, BODY_BASE + car.height * 0.9, 0, 1.05, 0.32],
    ];
    positions.forEach((entry, index) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 36, 16), material.clone());
      mesh.material.userData.baseOpacity = 0.24 + index * 0.07;
      mesh.position.set(entry[0], entry[1], entry[2]);
      mesh.scale.set(entry[3], entry[4], 1);
      mesh.userData.billboard = true;
      group.add(mesh);
    });
    return group;
  }

  function buildTopPath(car, lane, seed) {
    const points = [];
    const startY = BODY_BASE + car.height * (0.58 + lane * 0.08 + (seed % 3) * 0.035);
    const zBase = lane * car.width * 0.28;
    for (let i = 0; i <= 96; i += 1) {
      const u = i / 96;
      const x = lerp(WORLD_START, WORLD_END, u);
      const t = x / (car.length * 0.5);
      const body = smoothstep(-1.16, -0.72, t) * (1 - smoothstep(0.72, 1.18, t));
      const wake = smoothstep(0.76, 1.06, t) * (1 - smoothstep(1.06, 2.1, t));
      const surfaceY = sampleUpper(car, clamp(t, -1, 1)) + 0.18 + Math.abs(lane) * 0.08;
      const y = lerp(startY, Math.max(startY, surfaceY), body) - wake * 0.08;
      const z = zBase + Math.sin(u * Math.PI) * lane * 0.08 * body;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  function buildSidePath(car, lane, seed) {
    const points = [];
    const side = lane < 0 ? -1 : 1;
    const offset = 0.08 + Math.abs(lane) * 0.2;
    const startZ = side * (0.08 + (seed % 4) * 0.035);
    const startY = BODY_BASE + car.height * (0.34 + ((seed + 1) % 4) * 0.055);
    for (let i = 0; i <= 100; i += 1) {
      const u = i / 100;
      const x = lerp(WORLD_START, WORLD_END, u);
      const t = x / (car.length * 0.5);
      const body = smoothstep(-1.18, -0.78, t) * (1 - smoothstep(0.74, 1.18, t));
      const rejoin = smoothstep(0.82, 1.9, t);
      const width = halfWidthAt(car, clamp(t, -1, 1)) + offset;
      const channelDip = Math.sin(clamp((t + 1) * 0.5, 0, 1) * Math.PI) * 0.09;
      const z = lerp(startZ, side * width, body) * (1 - rejoin * 0.52);
      const y = startY + body * channelDip - rejoin * 0.04;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  function buildUnderPath(car, lane, seed) {
    const points = [];
    const zBase = lane * car.width * 0.32;
    const startY = BODY_BASE + 0.17 + (seed % 2) * 0.025;
    for (let i = 0; i <= 86; i += 1) {
      const u = i / 86;
      const x = lerp(WORLD_START, WORLD_END, u);
      const t = x / (car.length * 0.5);
      const body = smoothstep(-1.08, -0.78, t) * (1 - smoothstep(0.75, 1.12, t));
      const diffuserRise = smoothstep(0.38, 1, t) * body * 0.12;
      const z = zBase * (1 + body * 0.18);
      const y = startY - body * 0.055 + diffuserRise;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }

  function sampleUpper(car, t) {
    const points = car.upper;
    if (t <= points[0][0]) return BODY_BASE + points[0][1] * car.height;
    if (t >= points[points.length - 1][0]) return BODY_BASE + points[points.length - 1][1] * car.height;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      if (t >= a[0] && t <= b[0]) {
        const amount = (t - a[0]) / (b[0] - a[0]);
        return BODY_BASE + lerp(a[1], b[1], easeInOutCubic(amount)) * car.height;
      }
    }
    return BODY_BASE + car.height * 0.5;
  }

  function getUpperSlope(car, t) {
    const delta = 0.035;
    const y1 = sampleUpper(car, clamp(t - delta, -1, 1));
    const y2 = sampleUpper(car, clamp(t + delta, -1, 1));
    return (y2 - y1) / (delta * car.length);
  }

  function halfWidthAt(car, t) {
    const front = smoothstep(-1, -0.58, t);
    const rear = 1 - smoothstep(0.72, 1, t);
    const fullness = Math.min(front, rear);
    const shoulder = 1 + Math.sin(clamp((t + 1) * 0.5, 0, 1) * Math.PI) * car.widthBulge;
    return car.width * 0.5 * (0.34 + fullness * 0.66) * shoulder;
  }

  function getWidthSlope(car, t) {
    const delta = 0.035;
    const z1 = halfWidthAt(car, clamp(t - delta, -1, 1));
    const z2 = halfWidthAt(car, clamp(t + delta, -1, 1));
    return (z2 - z1) / (delta * car.length);
  }

  function setGroupOpacity(group, opacity) {
    group.visible = opacity > 0.003;
    group.traverse((node) => {
      if (!node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (typeof material.userData.baseOpacity !== "number") {
          material.userData.baseOpacity = typeof material.opacity === "number" ? material.opacity : 1;
        }
        const materialOpacity = material.userData.baseOpacity * opacity;
        const baseTransparent = material.userData.baseTransparent === true || material.userData.baseOpacity < 0.995;
        material.transparent = baseTransparent || materialOpacity < 0.995;
        material.opacity = materialOpacity;
        material.depthWrite = !baseTransparent && materialOpacity > 0.985;
      });
    });
  }

  function setFlowUniforms(group, opacity, reveal, intensity, wind, yaw = 0) {
    group.visible = opacity > 0.003;
    const wakeVisibility = smoothstep(0.55, 0.95, reveal);
    const yawDrag = Math.abs(Math.sin(yaw));
    const yawOpacity = 1 - yawDrag * 0.18;
    group.userData.flowState = { opacity, reveal, intensity, wind };
    if (group.userData.particleField) {
      group.userData.particleField.flowState = group.userData.flowState;
    }
    group.userData.materials.forEach((material) => {
      material.uniforms.uOpacity.value = material.userData.baseOpacity * opacity * yawOpacity * (material.userData.baseOpacity < 0.5 ? wakeVisibility : 1);
      material.uniforms.uReveal.value = reveal;
      material.uniforms.uIntensity.value = intensity * (1 + yawDrag * 0.16);
      material.uniforms.uWind.value = wind;
    });
  }

  function updateFlowTime(group, time, delta) {
    group.traverse((node) => {
      if (node.material && node.material.uniforms) {
        node.material.uniforms.uTime.value = time;
        if (node.userData.billboard) node.lookAt(camera.position);
      }
    });
    updateAdvectedParticles(group.userData.particleField, delta);
  }

  function createFeatureGroup() {
    const group = new THREE.Group();
    group.userData.markers = [];
    return group;
  }

  function updateFeatureMarkers(opacity) {
    const carGroup = carGroups[activeIndex];
    const anchors = carGroup.userData.featureAnchors;
    const labelOffsets = {
      splitter: [82, -44],
      channels: [88, -14],
      diffuser: [80, 30],
    };
    featureLayer.classList.toggle("is-visible", opacity > 0.18);
    featureGroup.userData.markers.forEach(({ feature, ring, line }) => {
      const world = anchors[feature].clone();
      carGroup.localToWorld(world);
      ring.position.copy(world);
      ring.lookAt(camera.position);
      ring.material.opacity = opacity * 0.3;

      const lineEnd = world.clone().add(new THREE.Vector3(feature === "splitter" ? -0.26 : 0.26, 0.18, 0));
      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, world.x, world.y, world.z);
      positions.setXYZ(1, lineEnd.x, lineEnd.y, lineEnd.z);
      positions.needsUpdate = true;
      line.material.opacity = opacity * 0.16;

      const label = featureLabels.get(feature);
      if (!label) return;
      screenVector.copy(lineEnd).project(camera);
      const left = (screenVector.x * 0.5 + 0.5) * window.innerWidth + labelOffsets[feature][0];
      const top = (-screenVector.y * 0.5 + 0.5) * window.innerHeight + labelOffsets[feature][1];
      label.style.left = `${left}px`;
      label.style.top = `${top}px`;
    });
  }

  function getScrollProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(window.scrollY / max, 0, 1);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function fract(value) {
    return value - Math.floor(value);
  }
}
