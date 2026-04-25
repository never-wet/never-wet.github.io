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
  const featureLayer = document.querySelector(".feature-layer");
  const featureLabels = new Map(
    Array.from(document.querySelectorAll("[data-feature]")).map((label) => [
      label.dataset.feature,
      label,
    ]),
  );

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallViewport = () => window.innerWidth < 760;
  const BODY_BASE = 0.2;
  const WORLD_START = -8.4;
  const WORLD_END = 8.4;

  const CARS = [
    {
      id: "porsche",
      brand: "Porsche",
      model: "911 GT3",
      trait: "rear-biased fastback profile",
      cd: "0.34 Cd",
      asset: "./models/porsche-911-gt3.glb",
      paint: "#d7d2c8",
      trim: "#10100f",
      accent: "#e7ff5b",
      hideModelArtifacts: true,
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
      model: "488 GTE",
      trait: "SF90 fallback with race aero surfaces",
      cd: "0.31 Cd",
      asset: "./models/ferrari-488-gte.glb",
      paint: "#9f2522",
      trim: "#0d0c0b",
      accent: "#ff8a46",
      modelScale: [1.05, 0.82, 1.02],
      length: 4.95,
      width: 2.02,
      height: 1.12,
      wheelRadius: 0.38,
      wheelFront: -0.62,
      wheelRear: 0.58,
      hideModelParts: ["vehicle_exterior_mm_misc"],
      widthBulge: 0.12,
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
      asset: "./models/lotus-emira.glb",
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
      model: "M3",
      trait: "coupe roofline with planted diffuser flow",
      cd: "0.36 Cd",
      asset: "./models/bmw-m3-gtr.glb",
      paint: "#40536b",
      trim: "#101013",
      accent: "#70b7ff",
      modelScale: [0.98, 0.97, 0.96],
      length: 4.62,
      width: 1.86,
      height: 1.34,
      wheelRadius: 0.38,
      wheelFront: -0.64,
      wheelRear: 0.58,
      hideModelParts: ["vehicle_exterior_mm_misc"],
      clipModelParts: [
        { match: "vehicle_exterior_mm_ext", zBelow: -1.7, yAbove: 0.95 },
        { match: "vehicle_exterior_mm_lights", zBelow: -1.82, yAbove: 0.92 },
      ],
      widthBulge: 0.05,
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
      text: "Splitter, side channel, and diffuser markers expose the pressure work happening around the body.",
    },
    {
      kicker: "05 / Wake",
      title: "The wake rejoins with control.",
      text: "The field intensifies, then settles into a tight exit signature that reads as reduced drag.",
    },
  ];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f0e);
  scene.fog = new THREE.FogExp2(0x0f0f0e, 0.032);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(0, 1.08, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !smallViewport(),
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x0f0f0e, 1);
  renderer.shadowMap.enabled = !smallViewport();
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
    if (event.button !== 0 && event.pointerType === "mouse") return;
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
    orbit.targetYaw += dx * 0.012;
    orbit.targetPitch = clamp(orbit.targetPitch + dy * 0.0035, -0.18, 0.18);
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
      group.rotation.y = orbit.yaw;
      group.rotation.x = orbit.pitch;
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
      group.rotation.y = orbit.yaw * 0.16;
      setFlowUniforms(group, opacity, flowReveal, intensity, windSpeed, orbit.yaw);
      updateFlowTime(group, elapsed);
    });

    updateCamera(smoothScroll);
    updateFeatureMarkers(featureFocus);
    updateHud(smoothScroll, intensity, windSpeed);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  function setActiveCar(index) {
    if (index === activeIndex) return;
    previousIndex = activeIndex;
    activeIndex = index;
    transition = 0;
    updateActiveCopy(CARS[activeIndex]);
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
    metricFlow.textContent = `${Math.round(28 + intensity * 68)}%`;
    metricPressure.textContent = progress > 0.62 ? "Mapped" : progress > 0.35 ? "Active" : "Low";
    metricWake.textContent = progress > 0.82 ? "Rejoined" : progress > 0.5 ? "Tight" : "Clean";
  }

  function getStage(progress) {
    if (progress < 0.2) return 0;
    if (progress < 0.4) return 1;
    if (progress < 0.62) return 2;
    if (progress < 0.82) return 3;
    return 4;
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
    ];

    const scaled = progress * (stage.length - 1);
    const index = Math.min(stage.length - 2, Math.floor(scaled));
    const localT = easeInOutCubic(scaled - index);
    const from = stage[index];
    const to = stage[index + 1];
    const targetPosition = from.clone().lerp(to, localT);
    targetPosition.x += pointer.x * (compact ? 0.08 : 0.28);
    targetPosition.y -= pointer.y * (compact ? 0.03 : 0.12);
    camera.position.lerp(targetPosition, 0.055);

    const lookTarget = new THREE.Vector3(pointer.x * 0.12, 0.66 - pointer.y * 0.08, 0);
    camera.lookAt(lookTarget);
  }

  function createStudio() {
    scene.add(new THREE.HemisphereLight(0xf2f2f2, 0x10100f, 0.78));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-4, 5, 5);
    key.castShadow = !smallViewport();
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x8fc9ff, 1.1);
    rim.position.set(5, 2.4, -3.5);
    scene.add(rim);

    const warm = new THREE.PointLight(0xff9d55, 1.1, 12);
    warm.position.set(-3.8, 1.2, 3.6);
    scene.add(warm);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 11, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x10100f,
        metalness: 0.35,
        roughness: 0.42,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(18, 18, 0x343432, 0x1b1b1a);
    grid.position.y = 0.012;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
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
        color: 0xf2f2f2,
        transparent: true,
        opacity: 0.055,
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

    const materials = createGltfMaterials(car);
    model.updateMatrixWorld(true);
    model.traverse((node) => {
      if (node.isMesh) {
        if (shouldHideImportedPart(node, car)) {
          node.visible = false;
          node.castShadow = false;
          node.receiveShadow = false;
          return;
        }
        trimImportedGeometry(node, car);
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) node.material = prepareGltfMaterial(node, materials, car);
      }
    });

    group.userData.wheels = [];
    fitGltfModel(model, car);

    group.add(model);
    if (car.replaceModelWheels) {
      addWheels(group, car, materials.details);
    }
    addGltfAeroParts(group, car, materials);
    addAmbientOcclusionShadow(group, car);
    setGroupOpacity(group, group.visible ? 1 : 0);
  }

  function shouldHideImportedPart(node, car) {
    const names = [node.name || ""];
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    nodeMaterials.forEach((material) => {
      if (material?.name) names.push(material.name);
    });
    const name = names.join(" ").toLowerCase();
    if (car.hideModelParts?.some((part) => name.includes(part))) return true;
    if (car.hideModelArtifacts && /(object_195|mat_wheels)/.test(name)) return true;
    if (!car.replaceModelWheels) return false;
    return /(tire|tyre|wheel|rim|mat_wheels|gloss_black)/.test(name);
  }

  function trimImportedGeometry(node, car) {
    if (!car.clipModelParts?.length || !node.geometry?.attributes?.position) return;
    const names = [node.name || ""];
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    nodeMaterials.forEach((material) => {
      if (material?.name) names.push(material.name);
    });
    const name = names.join(" ").toLowerCase();
    const clipRules = car.clipModelParts.filter((rule) => name.includes(rule.match));
    if (!clipRules.length) return;

    const sourceGeometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    const position = sourceGeometry.getAttribute("position");
    const keptIndices = [];
    const vertex = new THREE.Vector3();
    const centroid = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 3) {
      centroid.set(0, 0, 0);
      for (let j = 0; j < 3; j += 1) {
        vertex.fromBufferAttribute(position, i + j).applyMatrix4(node.matrixWorld);
        centroid.add(vertex);
      }
      centroid.multiplyScalar(1 / 3);
      const clipped = clipRules.some((rule) => centroid.z < rule.zBelow && centroid.y > rule.yAbove);
      if (!clipped) {
        keptIndices.push(i, i + 1, i + 2);
      }
    }

    if (keptIndices.length === position.count) {
      sourceGeometry.dispose();
      return;
    }

    const trimmedGeometry = new THREE.BufferGeometry();
    Object.entries(sourceGeometry.attributes).forEach(([attributeName, attribute]) => {
      const output = new attribute.array.constructor(keptIndices.length * attribute.itemSize);
      keptIndices.forEach((sourceIndex, outputIndex) => {
        const sourceOffset = sourceIndex * attribute.itemSize;
        const outputOffset = outputIndex * attribute.itemSize;
        for (let item = 0; item < attribute.itemSize; item += 1) {
          output[outputOffset + item] = attribute.array[sourceOffset + item];
        }
      });
      trimmedGeometry.setAttribute(
        attributeName,
        new THREE.BufferAttribute(output, attribute.itemSize, attribute.normalized),
      );
    });
    trimmedGeometry.computeBoundingBox();
    trimmedGeometry.computeBoundingSphere();
    node.geometry = trimmedGeometry;
    sourceGeometry.dispose();
  }

  function prepareGltfMaterial(node, materials, car) {
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const prepared = source.map((material) => enhanceGltfMaterial(material, node, materials, car));
    return Array.isArray(node.material) ? prepared : prepared[0];
  }

  function enhanceGltfMaterial(material, node, materials, car) {
    const cloned = material ? material.clone() : materials.body.clone();
    const name = `${node.name || ""} ${cloned.name || ""}`.toLowerCase();

    if (/(glass|window|windscreen|windshield)/.test(name)) {
      const glass = materials.glass.clone();
      glass.map = cloned.map || null;
      glass.normalMap = cloned.normalMap || null;
      glass.userData.baseTransparent = true;
      return glass;
    }

    if (/(tire|tyre|rubber|wheel|rim|rotor|brake|carbon|grille|chassis|badge|trim)/.test(name)) {
      cloned.color = cloned.color || new THREE.Color(car.trim);
      cloned.roughness = Math.min(typeof cloned.roughness === "number" ? cloned.roughness : 0.38, 0.42);
      cloned.metalness = Math.max(typeof cloned.metalness === "number" ? cloned.metalness : 0.5, 0.38);
      cloned.opacity = 1;
      cloned.transparent = false;
      cloned.userData.baseOpacity = 1;
      cloned.userData.baseTransparent = false;
      return cloned;
    }

    if (/(paint|body|coloured|exterior|_ext|phong|lambert)/.test(name)) {
      cloned.color = cloned.color ? cloned.color.clone().lerp(new THREE.Color(car.paint), 0.55) : new THREE.Color(car.paint);
      cloned.metalness = Math.max(typeof cloned.metalness === "number" ? cloned.metalness : 0.65, 0.56);
      cloned.roughness = Math.min(typeof cloned.roughness === "number" ? cloned.roughness : 0.2, 0.24);
      cloned.clearcoat = Math.max(typeof cloned.clearcoat === "number" ? cloned.clearcoat : 0.7, 0.72);
      cloned.clearcoatRoughness = Math.min(typeof cloned.clearcoatRoughness === "number" ? cloned.clearcoatRoughness : 0.12, 0.16);
      cloned.opacity = 1;
      cloned.transparent = false;
      cloned.userData.baseOpacity = 1;
      cloned.userData.baseTransparent = false;
      return cloned;
    }

    cloned.userData.baseOpacity = cloned.transparent && typeof cloned.opacity === "number" ? Math.max(0.78, cloned.opacity) : 1;
    cloned.userData.baseTransparent = cloned.transparent === true && cloned.userData.baseOpacity < 0.999;
    return cloned;
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

    const baseScale = car.length / Math.max(0.001, Math.max(baseSize.x, baseSize.z));
    const variantScale = car.modelScale || [1, 1, 1];
    model.scale.set(baseScale * variantScale[0], baseScale * variantScale[1], baseScale * variantScale[2]);

    const fittedBox = new THREE.Box3().setFromObject(model);
    const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
    model.position.x -= fittedCenter.x;
    model.position.z -= fittedCenter.z;
    model.position.y += BODY_BASE - fittedBox.min.y + 0.015;
  }

  function createGltfMaterials(car) {
    const PhysicalMaterial = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
    const body = new PhysicalMaterial({
      color: new THREE.Color(car.paint),
      metalness: 0.86,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 1,
    });
    body.userData.baseOpacity = 1;

    const details = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.trim),
      metalness: 0.72,
      roughness: 0.28,
      transparent: true,
      opacity: 1,
    });
    details.userData.baseOpacity = 1;

    const glass = new PhysicalMaterial({
      color: 0x080b0e,
      metalness: 0.08,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      transmission: 0.12,
      transparent: true,
      opacity: 0.48,
    });
    glass.userData.baseOpacity = 0.48;

    return { body, details, glass };
  }

  function addGltfAeroParts(group, car, materials) {
    const aeroMaterial = materials.details.clone();
    aeroMaterial.color = new THREE.Color(car.trim);
    aeroMaterial.userData.baseOpacity = 0.94;

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.accent),
      emissive: new THREE.Color(car.accent),
      emissiveIntensity: 0.18,
      metalness: 0.28,
      roughness: 0.35,
      transparent: true,
      opacity: 1,
    });
    accentMaterial.userData.baseOpacity = 0.55;

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, car.width * 1.05), aeroMaterial);
    splitter.position.set(-car.length / 2 - 0.08, BODY_BASE + 0.12, 0);
    group.add(splitter);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.055, car.width * 0.68), aeroMaterial);
    diffuser.position.set(car.length / 2 - 0.18, BODY_BASE + 0.16, 0);
    diffuser.rotation.z = -0.11;
    group.add(diffuser);

    [-1, 1].forEach((side) => {
      const sideBlade = new THREE.Mesh(new THREE.BoxGeometry(car.length * 0.32, 0.035, 0.025), accentMaterial);
      sideBlade.position.set(-car.length * 0.02, BODY_BASE + car.height * 0.29, side * (car.width / 2 + 0.05));
      group.add(sideBlade);
    });
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
    mesh.position.y = 0.018;
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
    addAeroDetails(group, car, trim, paint);
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
      color: 0xc8c8c2,
      roughness: 0.28,
      metalness: 0.85,
      transparent: true,
      opacity: 1,
    });
    rimMaterial.userData.baseOpacity = 1;

    const wheelXs = [car.wheelFront, car.wheelRear].map((value) => value * car.length * 0.5);
    const sides = [-1, 1];
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

  function addAeroDetails(group, car, trim, paint) {
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, car.width * 1.08), trim);
    splitter.position.set(-car.length / 2 - 0.1, BODY_BASE + 0.13, 0);
    group.add(splitter);

    const sideChannelGeometry = new THREE.BoxGeometry(car.length * 0.34, 0.055, 0.045);
    [-1, 1].forEach((side) => {
      const channel = new THREE.Mesh(sideChannelGeometry, trim);
      channel.position.set(-car.length * 0.02, BODY_BASE + car.height * 0.36, side * (car.width / 2 + 0.03));
      group.add(channel);
    });

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, car.width * 0.72), trim);
    diffuser.position.set(car.length / 2 - 0.22, BODY_BASE + 0.16, 0);
    diffuser.rotation.z = -0.08;
    group.add(diffuser);

    for (let i = -1; i <= 1; i += 1) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.035), trim);
      fin.position.set(car.length / 2 - 0.18, BODY_BASE + 0.2, i * car.width * 0.2);
      fin.rotation.z = -0.18;
      group.add(fin);
    }

    if (car.id === "bmw") {
      [-0.13, 0.13].forEach((z) => {
        const grille = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.15), trim);
        grille.position.set(-car.length / 2 - 0.02, BODY_BASE + car.height * 0.35, z);
        group.add(grille);
      });
    }
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
    const streamCount = smallViewport() ? 24 : 42;

    for (let i = 0; i < streamCount; i += 1) {
      const seed = createPhysicsSeed(car, i, streamCount);
      const trace = traceStreamline(car, seed);
      const type = seed.type;
      const radius = type === 2 ? 0.008 : 0.011;
      const mesh = createFlowTube(car, trace.points, radius, i, type, trace.speeds);
      group.userData.materials.push(mesh.material);
      group.add(mesh);
    }

    const wake = createPressureWake(car);
    wake.traverse((node) => {
      if (node.material && node.material.uniforms) group.userData.materials.push(node.material);
    });
    group.add(wake);
    return group;
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
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uReveal: { value: 0 },
        uIntensity: { value: 0.2 },
        uWind: { value: 0.6 },
        uSeed: { value: seed * 0.137 },
        uAccent: { value: new THREE.Color(car.accent) },
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
          p += normal * wave * 0.0055 * uWind;
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
        uniform vec3 uAccent;

        void main() {
          float reveal = smoothstep(vUv.x - 0.12, vUv.x + 0.035, uReveal);
          float endFade = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.95, 1.0, vUv.x));
          float dash = smoothstep(0.68, 1.0, fract(vUv.x * 16.0 - uTime * (0.22 + uWind * 0.18 + vSpeed * 0.18) - uSeed));
          float micro = smoothstep(0.92, 1.0, fract(vUv.x * 54.0 - uTime * (0.5 + uWind * 0.3) - uSeed));
          vec3 slow = vec3(0.48, 0.76, 0.94);
          vec3 fast = vec3(0.95, 0.97, 0.9);
          vec3 warm = vec3(1.0, 0.58, 0.25);
          vec3 color = mix(slow, fast, clamp(vSpeed, 0.0, 1.0));
          color = mix(color, warm, smoothstep(0.78, 1.1, vSpeed) * 0.26);
          color = mix(color, uAccent, 0.12);
          float alpha = (0.05 + dash * 0.42 + micro * 0.16) * reveal * endFade * uOpacity * uIntensity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    material.userData.baseOpacity = type === 2 ? 0.62 : 0.86;

    return new THREE.Mesh(geometry, material);
  }

  function createPhysicsSeed(car, index, total) {
    const ratio = total <= 1 ? 0.5 : index / (total - 1);
    const lane = ratio * 2 - 1;
    const type = index % 5;
    const side = lane < 0 ? -1 : 1;
    const jitter = ((index * 37) % 17) / 17 - 0.5;

    if (type === 0 || type === 3) {
      return {
        type,
        lane,
        y: BODY_BASE + car.height * (0.6 + lane * 0.07 + jitter * 0.03),
        z: lane * car.width * 0.26,
      };
    }

    if (type === 1 || type === 4) {
      return {
        type,
        lane,
        y: BODY_BASE + car.height * (0.34 + Math.abs(lane) * 0.08 + jitter * 0.025),
        z: side * car.width * (0.18 + Math.abs(lane) * 0.34),
      };
    }

    return {
      type,
      lane,
      y: BODY_BASE + 0.18 + jitter * 0.025,
      z: lane * car.width * 0.3,
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
      p.y = clamp(p.y, BODY_BASE + 0.08, BODY_BASE + car.height * 1.42);
      p.z = clamp(p.z, -car.width * 1.35, car.width * 1.35);
    }

    return { points, speeds };
  }

  function sampleFlowField(car, point, seed) {
    const halfLength = car.length * 0.5;
    const t = point.x / halfLength;
    const bodyWindow = smoothstep(-1.34, -0.9, t) * (1 - smoothstep(0.9, 1.42, t));
    const clampedT = clamp(t, -1, 1);
    const top = sampleUpper(car, clampedT) + 0.08;
    const bottom = BODY_BASE + 0.1;
    const centerY = (top + bottom) * 0.5;
    const radiusY = Math.max(0.22, (top - bottom) * 0.5 + 0.18);
    const radiusZ = Math.max(0.34, halfWidthAt(car, clampedT) + 0.18);
    const dy = point.y - centerY;
    const dz = point.z;
    const distance = Math.sqrt((dy / radiusY) ** 2 + (dz / radiusZ) ** 2);
    const nearBody = bodyWindow * Math.exp(-Math.max(0, distance - 1) * 1.45);
    const normalY = dy / (radiusY * radiusY);
    const normalZ = dz / (radiusZ * radiusZ);
    const normalLength = Math.hypot(normalY, normalZ) || 1;
    const roofBand = smoothstep(0.12, 0.92, dy / radiusY) * nearBody;
    const sideBand = smoothstep(0.42, 1.12, Math.abs(dz) / radiusZ) * nearBody;
    const underBand = smoothstep(0.82, 0.08, (point.y - bottom) / Math.max(0.12, radiusY)) * nearBody;
    const profileSlope = getUpperSlope(car, clampedT);
    const noseRamp = smoothstep(-1.18, -0.72, t) * (1 - smoothstep(-0.48, -0.1, t));
    const tailRamp = smoothstep(0.38, 0.94, t) * (1 - smoothstep(0.94, 1.24, t));
    const wake = smoothstep(0.78, 1.18, t) * (1 - smoothstep(1.18, 2.6, t));
    const sideSign = point.z < 0 ? -1 : 1;

    const velocity = new THREE.Vector3(1, 0, 0);
    const repulsion = nearBody * (distance < 1.35 ? (1.35 - distance) * 0.46 : 0.04);
    velocity.y += (normalY / normalLength) * repulsion;
    velocity.z += (normalZ / normalLength) * repulsion;
    velocity.y += profileSlope * roofBand * 0.58;
    velocity.y += noseRamp * roofBand * 0.16;
    velocity.y -= tailRamp * roofBand * 0.22;
    velocity.z += sideSign * sideBand * 0.2;
    velocity.y -= underBand * 0.12;
    velocity.y += tailRamp * underBand * 0.24;
    velocity.z -= sideSign * wake * 0.18;
    velocity.y -= wake * 0.05;
    velocity.x += nearBody * 0.42 + roofBand * 0.32 + sideBand * 0.18 + underBand * 0.12 - wake * 0.12;

    const rawSpeed = velocity.length();
    const speed = clamp(0.18 + rawSpeed * 0.46 + nearBody * 0.24 + wake * 0.1, 0.16, 1.18);
    return { velocity, speed };
  }

  function createPressureWake(car) {
    const group = new THREE.Group();
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uReveal: { value: 1 },
        uIntensity: { value: 1 },
        uWind: { value: 1 },
        uSeed: { value: 0.42 },
        uAccent: { value: new THREE.Color(car.accent) },
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
        uniform vec3 uAccent;

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          uv.x *= 1.65;
          float d = length(uv);
          float rings = smoothstep(0.54, 0.5, abs(fract(d * 6.0 - uTime * 0.22 * uWind) - 0.5));
          float core = 1.0 - smoothstep(0.05, 0.92, d);
          float alpha = (core * 0.16 + rings * 0.055) * uOpacity * uIntensity;
          vec3 color = mix(vec3(0.28, 0.58, 0.9), uAccent, 0.2);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    material.userData.baseOpacity = 0.42;

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
    group.userData.materials.forEach((material) => {
      material.uniforms.uOpacity.value = material.userData.baseOpacity * opacity * yawOpacity * (material.userData.baseOpacity < 0.5 ? wakeVisibility : 1);
      material.uniforms.uReveal.value = reveal;
      material.uniforms.uIntensity.value = intensity * (1 + yawDrag * 0.16);
      material.uniforms.uWind.value = wind;
    });
  }

  function updateFlowTime(group, time) {
    group.traverse((node) => {
      if (node.material && node.material.uniforms) {
        node.material.uniforms.uTime.value = time;
        if (node.userData.billboard) node.lookAt(camera.position);
      }
    });
  }

  function createFeatureGroup() {
    const group = new THREE.Group();
    const ringGeometry = new THREE.RingGeometry(0.035, 0.055, 32);
    const features = ["splitter", "channels", "diffuser"];
    group.userData.markers = features.map((feature) => {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xf2f2f2,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData.feature = feature;
      group.add(ring);

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xf2f2f2,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);
      return { feature, ring, line };
    });
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
      ring.material.opacity = opacity * 0.86;

      const lineEnd = world.clone().add(new THREE.Vector3(feature === "splitter" ? -0.26 : 0.26, 0.18, 0));
      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, world.x, world.y, world.z);
      positions.setXYZ(1, lineEnd.x, lineEnd.y, lineEnd.z);
      positions.needsUpdate = true;
      line.material.opacity = opacity * 0.38;

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
}
