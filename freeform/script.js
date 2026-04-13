import * as Y from "https://esm.sh/yjs@13.6.27";
import { WebsocketProvider } from "https://esm.sh/y-websocket@2.1.0?bundle";

const viewport = document.getElementById("canvasViewport");
const stage = document.getElementById("canvasStage");
const cursorLayer = document.getElementById("cursorLayer");
const fitButton = document.getElementById("fitButton");
const zoomButton = document.getElementById("zoomButton");
const panButton = document.getElementById("panButton");
const shareButton = document.getElementById("shareButton");
const moreButton = document.getElementById("moreButton");
const topMenu = document.getElementById("topMenu");
const navButtons = Array.from(document.querySelectorAll(".nav-button"));
const panelCopies = Array.from(document.querySelectorAll("[data-panel-copy]"));
const toolButtons = Array.from(document.querySelectorAll("[data-tool]"));
const newLayerButton = document.getElementById("newLayerButton");
const helpButton = document.getElementById("helpButton");
const archiveButton = document.getElementById("archiveButton");
const zoomRange = document.getElementById("zoomRange");
const gridToggle = document.getElementById("gridToggle");
const layerList = document.getElementById("layerList");
const historyList = document.getElementById("historyList");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModalButton");
const toast = document.getElementById("toast");
const canvasGrid = document.querySelector(".canvas-grid");
const liveBadge = document.getElementById("liveBadge");
const roomSummary = document.getElementById("roomSummary");
const presenceList = document.getElementById("presenceList");

const ROOM_PREFIX = "never-wet-freeform";
const WS_SERVER_URL = "wss://demos.yjs.dev/ws";
const STAGE_BASE_WIDTH = 2200;
const STAGE_BASE_HEIGHT = 1800;
const HISTORY_LIMIT = 20;
const SEED_VERSION = "v1";
const stockImages = [
  "../img/code2.png",
  "../img/code.jpg",
  "../img/background.jpeg",
  "../img/cat.jpg",
];

const colorPalette = [
  "#005bc1",
  "#0f766e",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#1d4ed8",
];

const userNames = [
  "Aurora",
  "Juniper",
  "Marin",
  "Sol",
  "Mika",
  "Nova",
  "Ari",
  "Jules",
];

const roomId = ensureRoomId();
const roomUrl = new URL(window.location.href);
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(WS_SERVER_URL, `${ROOM_PREFIX}-${roomId}`, ydoc);
const awareness = provider.awareness;
const yElements = ydoc.getMap("elements");
const ySettings = ydoc.getMap("settings");
const yHistory = ydoc.getArray("history");
const yMeta = ydoc.getMap("meta");

const localUser = getLocalUserProfile();
const elementNodes = new Map();

let toastTimer = null;
let currentTool = "sticky";
let zoomLevel = 1;
let freePanEnabled = true;
let panState = null;
let dragState = null;
let localElementCount = 0;

setupRealtime();
setupUi();
seedInitialRoom();
renderAll();
window.addEventListener("load", () => {
  centerCanvas(false);
  pushCursorAwareness(null);
});

function setupRealtime() {
  awareness.setLocalStateField("user", localUser);
  awareness.setLocalStateField("tool", currentTool);
  awareness.setLocalStateField("cursor", null);

  provider.on("status", (event) => {
    const statusText = event.status === "connected" ? "connected" : "connecting";
    liveBadge.textContent = `${statusText} ${roomId}`;
  });

  provider.on("sync", (isSynced) => {
    if (isSynced) {
      showToast("Live room synced");
    }
  });

  yElements.observeDeep(() => {
    renderElements();
    refreshLayerList();
  });

  ySettings.observe(() => {
    renderSharedSettings();
  });

  yHistory.observe(() => {
    renderHistory();
  });

  awareness.on("change", () => {
    renderPresence();
    renderRemoteCursors();
  });

  window.addEventListener("beforeunload", () => {
    awareness.setLocalState(null);
    provider.destroy();
    ydoc.destroy();
  });
}

function setupUi() {
  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTool(button.dataset.tool);
      addCanvasItem(button.dataset.tool);
    });
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSidebarPanel(button.dataset.panel);
    });
  });

  newLayerButton.addEventListener("click", () => {
    addCanvasItem(currentTool);
  });

  helpButton.addEventListener("click", () => {
    openModal(
      "Live Collaboration",
      `<p>This canvas now opens a shared room from the link in your address bar.</p><p>Anyone opening the same link joins the same board through a shared websocket sync server, so updates travel across different laptops instead of relying on direct browser-to-browser connections.</p><p>Drag objects, create layers, shuffle layouts, and toggle shared board settings together in real time.</p>`
    );
  });

  archiveButton.addEventListener("click", () => {
    const count = yElements.size;
    openModal(
      "Archive Snapshot",
      `<p>This live room currently contains ${count} shared layers.</p><p>Archive is still a prototype action, but the room state itself is now collaborative and shareable through the URL.</p>`
    );
  });

  shareButton.addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomUrl.toString());
        showToast("Live room link copied");
        pushHistory(`${localUser.name} copied the room link`);
        return;
      }
    } catch (error) {
      // Fall through to modal.
    }

    openModal(
      "Share This Room",
      `<p>Copy and send this link to invite collaborators into the same live canvas:</p><p><strong>${escapeHtml(roomUrl.toString())}</strong></p>`
    );
  });

  moreButton.addEventListener("click", () => {
    topMenu.classList.toggle("is-hidden");
  });

  topMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-menu-action]");
    if (!button) {
      return;
    }

    topMenu.classList.add("is-hidden");
    const action = button.dataset.menuAction;

    if (action === "theme") {
      const nextGlow = !(ySettings.get("altGlow") === true);
      ySettings.set("altGlow", nextGlow);
      pushHistory(`${localUser.name} ${nextGlow ? "enabled" : "disabled"} ambient glow`);
      showToast(nextGlow ? "Ambient glow shared" : "Ambient glow reset");
      return;
    }

    if (action === "shuffle") {
      shuffleLayout();
      return;
    }

    if (action === "clear") {
      clearGeneratedItems();
    }
  });

  zoomButton.addEventListener("click", () => {
    const next = zoomLevel >= 1.4 ? 0.8 : Number((zoomLevel + 0.1).toFixed(2));
    applyZoom(next);
    zoomRange.value = String(Math.round(next * 100));
    setDockActive(zoomButton);
    showToast(`Zoom ${Math.round(next * 100)}%`);
  });

  fitButton.addEventListener("click", () => {
    applyZoom(1);
    zoomRange.value = "100";
    centerCanvas(true);
  });

  panButton.addEventListener("click", () => {
    freePanEnabled = !freePanEnabled;
    setDockActive(panButton);
    showToast(freePanEnabled ? "Pan enabled" : "Pan locked");
  });

  zoomRange.addEventListener("input", () => {
    const next = Number(zoomRange.value) / 100;
    applyZoom(next);
    setDockActive(zoomButton);
  });

  gridToggle.addEventListener("change", () => {
    ySettings.set("gridVisible", gridToggle.checked);
    pushHistory(`${localUser.name} ${gridToggle.checked ? "showed" : "hid"} the grid`);
  });

  closeModalButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#moreButton") && !event.target.closest("#topMenu")) {
      topMenu.classList.add("is-hidden");
    }
  });

  viewport.addEventListener("pointerdown", startPan);
  viewport.addEventListener("pointermove", movePan);
  viewport.addEventListener("pointerup", stopPan);
  viewport.addEventListener("pointercancel", stopPan);
  viewport.addEventListener("pointermove", updateLocalCursor);
  viewport.addEventListener("pointerleave", () => pushCursorAwareness(null));
}

function seedInitialRoom() {
  if (yMeta.get("seedVersion") === SEED_VERSION) {
    return;
  }

  ydoc.transact(() => {
    yMeta.set("seedVersion", SEED_VERSION);
    yMeta.set("nextOrder", 6);

    if (!ySettings.has("gridVisible")) {
      ySettings.set("gridVisible", true);
    }

    if (!ySettings.has("altGlow")) {
      ySettings.set("altGlow", false);
    }

    upsertElement("seed-note", {
      id: "seed-note",
      kind: "sticky",
      title: "Project Brainstorm",
      text: "Add ideas for the new ethereal workshop interface here...",
      x: 360,
      y: 220,
      rotation: -2,
      order: 1,
      seed: true,
    });

    upsertElement("seed-circle", {
      id: "seed-circle",
      kind: "shape-circle",
      title: "Orbit Circle",
      x: 760,
      y: 180,
      order: 2,
      seed: true,
    });

    upsertElement("seed-blob", {
      id: "seed-blob",
      kind: "shape-blob",
      title: "Glass Blob",
      x: 850,
      y: 310,
      order: 3,
      seed: true,
    });

    upsertElement("seed-media", {
      id: "seed-media",
      kind: "media",
      title: "Creative Reference #42",
      text: "Inspired by ethereal workshop concept",
      image: "../img/code2.png",
      x: 470,
      y: 560,
      rotation: 3,
      order: 4,
      seed: true,
    });

    upsertElement("seed-type", {
      id: "seed-type",
      kind: "text",
      title: "ETHEREAL WORKSPACE",
      x: 1010,
      y: 470,
      order: 5,
      seed: true,
    });

    upsertElement("seed-sprint", {
      id: "seed-sprint",
      kind: "sprint",
      title: "Design Sprint",
      text: "Due in 2 days",
      x: 1130,
      y: 170,
      order: 6,
      seed: true,
    });
  });
}

function renderAll() {
  setSidebarPanel("documents");
  setTool(currentTool, false);
  applyZoom(1);
  renderSharedSettings();
  renderElements();
  renderHistory();
  refreshLayerList();
  renderPresence();
  renderRemoteCursors();
  roomSummary.textContent = `Room ${roomId} is live through a shared sync server. Anyone opening this exact link joins the same board.`;
  liveBadge.textContent = `connecting ${roomId}`;
}

function renderElements() {
  const items = getSortedElements();
  const activeIds = new Set();

  items.forEach((record) => {
    activeIds.add(record.id);
    let node = elementNodes.get(record.id);

    if (!node) {
      node = createElementNode(record);
      elementNodes.set(record.id, node);
      stage.appendChild(node);
    }

    updateElementNode(node, record);
  });

  Array.from(elementNodes.keys()).forEach((id) => {
    if (!activeIds.has(id)) {
      elementNodes.get(id)?.remove();
      elementNodes.delete(id);
    }
  });

  cursorLayer.remove();
  stage.appendChild(cursorLayer);
  renderRemoteCursors();
}

function getSortedElements() {
  return Array.from(yElements.entries())
    .map(([id, value]) => ({ id, ...value.toJSON() }))
    .sort((left, right) => (left.order || 0) - (right.order || 0));
}

function createElementNode(record) {
  const node = document.createElement(record.kind === "text" ? "div" : "article");
  node.classList.add("draggable");
  node.dataset.id = record.id;
  bindDrag(node);
  return node;
}

function updateElementNode(node, record) {
  node.className = "draggable";
  node.dataset.id = record.id;
  node.dataset.layerName = record.title || "Canvas item";
  node.style.left = `${record.x || 0}px`;
  node.style.top = `${record.y || 0}px`;
  node.style.zIndex = String(record.order || 1);
  node.style.transform = "";

  if (record.kind === "sticky") {
    node.classList.add("sticky-note");
    node.style.transform = `rotate(${record.rotation || -2}deg)`;
    node.innerHTML = `
      <div>
        <h2>${escapeHtml(record.title || "Idea Note")}</h2>
        <p>${escapeHtml(record.text || "Fresh note dropped onto the board.")}</p>
      </div>
      <div class="pin-row">
        <span class="material-symbols-outlined">push_pin</span>
      </div>
    `;
    return;
  }

  if (record.kind === "shape-circle") {
    node.classList.add("shape-circle");
    node.innerHTML = "";
    return;
  }

  if (record.kind === "shape-blob") {
    node.classList.add("shape-blob");
    node.style.transform = "rotate(15deg)";
    node.innerHTML = "";
    return;
  }

  if (record.kind === "media") {
    node.classList.add("media-card");
    node.style.transform = `rotate(${record.rotation || 3}deg)`;
    node.innerHTML = `
      <div class="media-frame">
        <img src="${escapeAttribute(record.image || stockImages[0])}" alt="${escapeAttribute(record.title || "Reference")}" />
        <div class="media-overlay">
          <span class="material-symbols-outlined">zoom_in</span>
        </div>
      </div>
      <div class="media-copy">
        <h3>${escapeHtml(record.title || "Reference")}</h3>
        <p>${escapeHtml(record.text || "Auto-added inspiration card")}</p>
      </div>
    `;
    return;
  }

  if (record.kind === "text") {
    node.classList.add("hero-type");
    node.textContent = record.title || "ETHEREAL WORKSPACE";
    return;
  }

  node.classList.add("sprint-card");
  node.innerHTML = `
    <div class="sprint-head">
      <div class="spark-badge">
        <span class="material-symbols-outlined">auto_awesome</span>
      </div>
      <span class="status-pill">Active</span>
    </div>
    <h3>${escapeHtml(record.title || "Design Sprint")}</h3>
    <div class="team-stack" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span class="team-more">+5</span>
    </div>
    <div class="sprint-meta">
      <span>${escapeHtml(record.text || "Due in 2 days")}</span>
      <span class="material-symbols-outlined">arrow_forward_ios</span>
    </div>
  `;
}

function bindDrag(node) {
  node.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    const id = node.dataset.id;
    const record = getElementRecord(id);
    if (!record) {
      return;
    }

    bringElementToFront(id);

    dragState = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: record.x || 0,
      initialY: record.y || 0,
      lastX: record.x || 0,
      lastY: record.y || 0,
      rafId: null,
    };

    node.setPointerCapture(event.pointerId);
  });

  node.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId || dragState.id !== node.dataset.id) {
      return;
    }

    const nextX = dragState.initialX + (event.clientX - dragState.startX) / zoomLevel;
    const nextY = dragState.initialY + (event.clientY - dragState.startY) / zoomLevel;
    dragState.lastX = nextX;
    dragState.lastY = nextY;

    node.style.left = `${nextX}px`;
    node.style.top = `${nextY}px`;
    queueDragSync();
    pushCursorAwareness({ x: nextX, y: nextY });
  });

  const stopDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId || dragState.id !== node.dataset.id) {
      return;
    }

    if (dragState.rafId) {
      cancelAnimationFrame(dragState.rafId);
      dragState.rafId = null;
    }

    updateElementFields(dragState.id, { x: dragState.lastX, y: dragState.lastY });
    pushHistory(`${localUser.name} moved ${getElementRecord(dragState.id)?.title || "an item"}`);
    node.releasePointerCapture(event.pointerId);
    dragState = null;
  };

  node.addEventListener("pointerup", stopDrag);
  node.addEventListener("pointercancel", stopDrag);
}

function queueDragSync() {
  if (!dragState || dragState.rafId) {
    return;
  }

  dragState.rafId = requestAnimationFrame(() => {
    updateElementFields(dragState.id, {
      x: dragState.lastX,
      y: dragState.lastY,
    });
    dragState.rafId = null;
  });
}

function startPan(event) {
  if (!freePanEnabled || event.target.closest(".draggable") || event.target.closest("button")) {
    return;
  }

  panState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
  };

  viewport.classList.add("is-panning");
  viewport.setPointerCapture(event.pointerId);
}

function movePan(event) {
  if (!panState || panState.pointerId !== event.pointerId) {
    return;
  }

  viewport.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX);
  viewport.scrollTop = panState.scrollTop - (event.clientY - panState.startY);
}

function stopPan(event) {
  if (!panState || panState.pointerId !== event.pointerId) {
    return;
  }

  viewport.classList.remove("is-panning");
  viewport.releasePointerCapture(event.pointerId);
  panState = null;
}

function updateLocalCursor(event) {
  const point = getCanvasPoint(event);
  if (point) {
    pushCursorAwareness(point);
  }
}

function getCanvasPoint(event) {
  const stageRect = stage.getBoundingClientRect();
  return {
    x: (event.clientX - stageRect.left) / zoomLevel,
    y: (event.clientY - stageRect.top) / zoomLevel,
  };
}

function pushCursorAwareness(cursor) {
  awareness.setLocalStateField("cursor", cursor);
}

function renderPresence() {
  const states = Array.from(awareness.getStates().values()).filter((state) => state?.user);
  const presenceText = states.length === 1 ? "1 live" : `${states.length} live`;
  liveBadge.textContent = `${presenceText} ${roomId}`;
  presenceList.innerHTML = states
    .map((state) => {
      const user = state.user;
      return `
        <span class="presence-chip">
          <span class="presence-dot" style="background:${escapeAttribute(user.color)}"></span>
          <span>${escapeHtml(user.name)}</span>
        </span>
      `;
    })
    .join("");
}

function renderRemoteCursors() {
  const remoteStates = Array.from(awareness.getStates().entries()).filter(
    ([clientId, state]) => clientId !== ydoc.clientID && state?.user && state?.cursor
  );

  cursorLayer.innerHTML = remoteStates
    .map(([, state]) => {
      const { user, cursor } = state;
      return `
        <div class="remote-cursor" style="left:${cursor.x}px; top:${cursor.y}px;">
          <div class="remote-cursor-dot" style="background:${escapeAttribute(user.color)}"></div>
          <div class="remote-cursor-label" style="background:${escapeAttribute(user.color)}">${escapeHtml(user.name)}</div>
        </div>
      `;
    })
    .join("");
}

function renderSharedSettings() {
  const showGrid = ySettings.get("gridVisible") !== false;
  const glow = ySettings.get("altGlow") === true;
  gridToggle.checked = showGrid;
  canvasGrid.classList.toggle("is-hidden", !showGrid);
  document.body.classList.toggle("alt-glow", glow);
}

function renderHistory() {
  const entries = yHistory.toArray().slice(0, 8);
  historyList.innerHTML = entries
    .map((entry) => `<li>${escapeHtml(entry.text || "")}</li>`)
    .join("");
}

function refreshLayerList() {
  const items = getSortedElements().slice().reverse();
  layerList.innerHTML = items
    .map((item) => `<li>${escapeHtml(item.title || "Canvas item")}</li>`)
    .join("");
}

function addCanvasItem(tool = currentTool) {
  localElementCount += 1;
  const id = `item-${crypto.randomUUID()}`;
  const order = nextOrder();
  const left = 320 + (localElementCount % 5) * 120;
  const top = 240 + (localElementCount % 4) * 110;

  const item = {
    id,
    x: left,
    y: top,
    order,
    seed: false,
  };

  if (tool === "text") {
    item.kind = "text";
    item.title = `Headline ${localElementCount}`.toUpperCase();
  } else if (tool === "shape") {
    item.kind = localElementCount % 2 === 0 ? "shape-circle" : "shape-blob";
    item.title = item.kind === "shape-circle" ? `Shape ${localElementCount} Circle` : `Shape ${localElementCount} Blob`;
  } else if (tool === "media") {
    item.kind = "media";
    item.title = `Reference ${localElementCount}`;
    item.text = "Auto-added inspiration card";
    item.image = stockImages[localElementCount % stockImages.length];
    item.rotation = 3;
  } else if (tool === "pen") {
    item.kind = "sticky";
    item.title = `Sketch Layer ${localElementCount}`;
    item.text = "Quick sketch stroke converted into a note card for this prototype.";
    item.rotation = -1;
  } else {
    item.kind = "sticky";
    item.title = `Idea Note ${localElementCount}`;
    item.text = "Fresh note dropped onto the board. Drag it anywhere and keep building.";
    item.rotation = -2;
  }

  upsertElement(id, item);
  pushHistory(`${localUser.name} added ${item.title}`);
  showToast(`${item.title} created`);
}

function clearGeneratedItems() {
  ydoc.transact(() => {
    Array.from(yElements.entries()).forEach(([id, value]) => {
      if (value.get("seed") !== true) {
        yElements.delete(id);
      }
    });
  });

  pushHistory(`${localUser.name} cleared generated items`);
  showToast("Generated items cleared");
}

function shuffleLayout() {
  const items = getSortedElements();
  ydoc.transact(() => {
    items.forEach((item, index) => {
      updateElementFields(item.id, {
        x: 260 + (index % 5) * 180,
        y: 180 + Math.floor(index / 5) * 170,
      });
    });
  });

  pushHistory(`${localUser.name} shuffled the layout`);
  showToast("Layout shuffled");
}

function bringElementToFront(id) {
  updateElementFields(id, { order: nextOrder() });
}

function upsertElement(id, record) {
  ydoc.transact(() => {
    let target = yElements.get(id);
    if (!target) {
      target = new Y.Map();
      yElements.set(id, target);
    }

    Object.entries(record).forEach(([key, value]) => {
      target.set(key, value);
    });
  });
}

function updateElementFields(id, fields) {
  const target = yElements.get(id);
  if (!target) {
    return;
  }

  Object.entries(fields).forEach(([key, value]) => {
    target.set(key, value);
  });
}

function getElementRecord(id) {
  const item = yElements.get(id);
  return item ? { id, ...item.toJSON() } : null;
}

function nextOrder() {
  const current = Number(yMeta.get("nextOrder") || 0) + 1;
  yMeta.set("nextOrder", current);
  return current;
}

function pushHistory(text) {
  ydoc.transact(() => {
    yHistory.insert(0, [
      {
        id: crypto.randomUUID(),
        text,
        at: Date.now(),
      },
    ]);

    if (yHistory.length > HISTORY_LIMIT) {
      yHistory.delete(HISTORY_LIMIT, yHistory.length - HISTORY_LIMIT);
    }
  });
}

function setTool(tool, announce = true) {
  currentTool = tool;
  toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  });
  awareness.setLocalStateField("tool", tool);

  if (announce) {
    showToast(`${tool[0].toUpperCase()}${tool.slice(1)} tool selected`);
  }
}

function setSidebarPanel(panel) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.panel === panel);
  });
  panelCopies.forEach((copy) => {
    copy.classList.toggle("is-hidden", copy.dataset.panelCopy !== panel);
  });
}

function applyZoom(value) {
  zoomLevel = value;
  stage.style.transform = `scale(${zoomLevel})`;
  stage.style.width = `${STAGE_BASE_WIDTH * zoomLevel}px`;
  stage.style.height = `${STAGE_BASE_HEIGHT * zoomLevel}px`;
}

function centerCanvas(smooth) {
  const left = Math.max(0, (stage.scrollWidth - viewport.clientWidth) / 2 - 240);
  const top = Math.max(0, (stage.scrollHeight - viewport.clientHeight) / 2 - 180);
  viewport.scrollTo({ left, top, behavior: smooth ? "smooth" : "auto" });
  setDockActive(fitButton);
}

function setDockActive(activeButton) {
  [zoomButton, fitButton, panButton].forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function openModal(title, body) {
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modal.classList.remove("is-hidden");
}

function closeModal() {
  modal.classList.add("is-hidden");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("is-hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.add("is-hidden");
  }, 2200);
}

function ensureRoomId() {
  const url = new URL(window.location.href);
  let id = url.searchParams.get("room");

  if (!id) {
    id = (crypto.randomUUID?.() || `room-${Date.now()}`).slice(0, 8);
    url.searchParams.set("room", id);
    window.history.replaceState({}, "", url);
  }

  return id;
}

function getLocalUserProfile() {
  const storageKey = "never-wet-freeform-user";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (error) {
      window.localStorage.removeItem(storageKey);
    }
  }

  const name = `${userNames[Math.floor(Math.random() * userNames.length)]} ${Math.floor(Math.random() * 90 + 10)}`;
  const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const profile = { name, color };
  window.localStorage.setItem(storageKey, JSON.stringify(profile));
  return profile;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
