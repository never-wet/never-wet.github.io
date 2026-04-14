const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const viewport = $("#canvasViewport");
const stage = $("#canvasStage");
const drawLayer = $("#drawLayer");
const cursorLayer = $("#cursorLayer");
const fitButton = $("#fitButton");
const zoomButton = $("#zoomButton");
const panButton = $("#panButton");
const shareButton = $("#shareButton");
const moreButton = $("#moreButton");
const topMenu = $("#topMenu");
const toolButtons = $$("[data-tool]");
const navButtons = $$(".nav-button");
const panelCopies = $$("[data-panel-copy]");
const newLayerButton = $("#newLayerButton");
const helpButton = $("#helpButton");
const archiveButton = $("#archiveButton");
const zoomRange = $("#zoomRange");
const gridToggle = $("#gridToggle");
const layerList = $("#layerList");
const historyList = $("#historyList");
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");
const closeModalButton = $("#closeModalButton");
const toast = $("#toast");
const canvasGrid = $(".canvas-grid");
const liveBadge = $("#liveBadge");
const roomSummary = $("#roomSummary");
const presenceList = $("#presenceList");
const penControls = $("#penControls");
const penWidthInput = $("#penWidthInput");
const penWidthValue = $("#penWidthValue");
const penSwatches = $$("[data-pen-color]");
const penColorButton = $("#penColorButton");
const penColorPopover = $("#penColorPopover");
const penColorPreview = $("#penColorPreview");
const penColorValue = $("#penColorValue");
const penPickerSwatch = $("#penPickerSwatch");
const penPickerCaption = $("#penPickerCaption");
const penHexInput = $("#penHexInput");
const penRedInput = $("#penRedInput");
const penGreenInput = $("#penGreenInput");
const penBlueInput = $("#penBlueInput");
const penRedValue = $("#penRedValue");
const penGreenValue = $("#penGreenValue");
const penBlueValue = $("#penBlueValue");
const mediaDrawer = $("#mediaDrawer");
const mediaDrawerTitle = $("#mediaDrawerTitle");
const mediaDrawerBody = $("#mediaDrawerBody");
const closeMediaDrawerButton = $("#closeMediaDrawerButton");

const STAGE_W = 2200;
const STAGE_H = 1800;
const DEFAULT_SERVER_PORT = "8787";
const IMAGES = ["../img/code2.png", "../img/code.jpg", "../img/background.jpeg", "../img/cat.jpg"];
const COLORS = ["#005bc1", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8"];
const NAMES = ["Aurora", "Juniper", "Marin", "Sol", "Mika", "Nova", "Ari", "Jules"];

const roomId = ensureRoomId();
const clientId = ensureClientId();
const user = loadUser();
const serverOrigin = resolveServerOrigin();
const snapshotUrl = new URL(`/api/rooms/${encodeURIComponent(roomId)}`, serverOrigin);
const websocketUrl = buildWebsocketUrl(serverOrigin, roomId, clientId);
const nodes = new Map();
const strokeNodes = new Map();
const selectedIds = new Set();
const selectionBox = document.createElement("div");
const state = {
  roomId,
  elements: new Map(),
  settings: {
    grid: true,
    glow: false
  },
  meta: {
    seedVersion: "v1",
    nextOrder: 0
  },
  history: [],
  presence: new Map()
};

let socket = null;
let reconnectTimer = null;
let destroyed = false;
let connected = false;
let bootstrapped = false;
let toastTimer = null;
let zoom = 1;
let panEnabled = true;
let panState = null;
let dragState = null;
let localCount = 0;
let currentTool = "sticky";
let currentCursor = null;
let presenceTimer = null;
let drawState = null;
let penColor = "#005bc1";
let penWidth = 6;
let suppressMediaOpenUntil = 0;
let marqueeState = null;

setup();
setPanel("documents");
setTool(currentTool, false);
applyZoom(1);
renderAll();
window.addEventListener("load", () => center(false));
window.addEventListener("beforeunload", () => {
  destroyed = true;
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  if (presenceTimer) window.clearTimeout(presenceTimer);
  socket?.close();
});

initLiveRoom();

async function initLiveRoom() {
  await loadSnapshot();
  connectSocket();
}

function setup() {
  selectionBox.dataset.selectionBox = "true";
  selectionBox.classList.add("is-hidden");
  stage.appendChild(selectionBox);

  toolButtons.forEach((b) => b.addEventListener("click", () => {
    setTool(b.dataset.tool, true);
    if (b.dataset.tool === "media") {
      openMediaImportModal();
      return;
    }
    if (b.dataset.tool !== "pen") addItem(b.dataset.tool);
  }));
  navButtons.forEach((b) => b.addEventListener("click", () => setPanel(b.dataset.panel)));
  newLayerButton.addEventListener("click", () => {
    if (currentTool === "pen") {
      showToast("Use the canvas to draw with the pen");
      return;
    }
    if (currentTool === "media") {
      openMediaImportModal();
      return;
    }
    addItem(currentTool);
  });
  helpButton.addEventListener("click", () => openModal("Public Live Mode", `<p>This page uses a custom live sync backend.</p><p>Anyone opening the same live link joins room <strong>${esc(roomId)}</strong> and should see the same shared canvas state.</p><p>Server: <code>${esc(serverOrigin)}</code></p>`));
  archiveButton.addEventListener("click", () => openModal("Archive Snapshot", `<p>${state.elements.size} shared layers are currently in room <strong>${esc(roomId)}</strong>.</p><p>This live room syncs state in real time, but the current backend is not a permanent archive.</p>`));
  shareButton.addEventListener("click", shareModal);
  moreButton.addEventListener("click", () => topMenu.classList.toggle("is-hidden"));
  topMenu.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-menu-action]");
    if (!b) return;
    topMenu.classList.add("is-hidden");
    if (b.dataset.menuAction === "theme") {
      const nextGlow = !(state.settings.glow === true);
      if (!patchSettings({ glow: nextGlow })) return;
      pushHistory(`${user.name} toggled ambient glow`);
      return;
    }
    if (b.dataset.menuAction === "shuffle") {
      if (!ensureConnected()) return;
      const items = sortedElements();
      let changed = 0;
      items.forEach((item, i) => {
        if (updateFields(item.id, { x: 260 + (i % 5) * 180, y: 180 + Math.floor(i / 5) * 170 })) {
          changed += 1;
        }
      });
      if (changed > 0) {
        pushHistory(`${user.name} shuffled the layout`);
        showToast("Layout shuffled");
      }
      return;
    }
    if (b.dataset.menuAction === "clear") {
      if (!ensureConnected()) return;
      const generated = sortedElements().filter((item) => item.seed !== true);
      let deleted = 0;
      generated.forEach((item) => {
        if (deleteItem(item.id)) deleted += 1;
      });
      if (deleted > 0) {
        pushHistory(`${user.name} cleared generated items`);
        showToast("Generated items cleared");
      }
    }
  });
  zoomButton.addEventListener("click", () => {
    const next = zoom >= 1.4 ? 0.8 : Number((zoom + 0.1).toFixed(2));
    applyZoom(next);
    zoomRange.value = String(Math.round(next * 100));
    dock(zoomButton);
    showToast(`Zoom ${Math.round(next * 100)}%`);
  });
  fitButton.addEventListener("click", () => {
    applyZoom(1);
    zoomRange.value = "100";
    center(true);
  });
  panButton.addEventListener("click", () => {
    panEnabled = !panEnabled;
    dock(panButton);
    showToast(panEnabled ? "Pan enabled" : "Pan locked");
  });
  zoomRange.addEventListener("input", () => {
    applyZoom(Number(zoomRange.value) / 100);
    dock(zoomButton);
  });
  gridToggle.addEventListener("change", () => {
    if (!patchSettings({ grid: gridToggle.checked })) {
      renderSettings();
      return;
    }
    pushHistory(`${user.name} ${gridToggle.checked ? "showed" : "hid"} the grid`);
  });
  penColorButton.addEventListener("click", (event) => {
    event.stopPropagation();
    penColorPopover.classList.toggle("is-hidden");
  });
  penColorPopover.addEventListener("pointerdown", (event) => event.stopPropagation());
  penColorPopover.addEventListener("click", (event) => event.stopPropagation());
  penSwatches.forEach((swatch) => swatch.addEventListener("click", () => {
    setPenColor(swatch.dataset.penColor);
  }));
  [penRedInput, penGreenInput, penBlueInput].forEach((input) => input.addEventListener("input", syncPenColorFromRgb));
  penHexInput.addEventListener("focus", selectPenHexInput);
  penHexInput.addEventListener("input", syncPenColorFromHexPreview);
  penHexInput.addEventListener("blur", syncPenColorFromHexCommit);
  penHexInput.addEventListener("keydown", onPenHexKeyDown);
  penWidthInput.addEventListener("input", () => {
    penWidth = Number(penWidthInput.value);
    penWidthValue.textContent = `${penWidth}px`;
  });
  setPenColor(penColor);
  penWidthValue.textContent = `${penWidth}px`;
  closeModalButton.addEventListener("click", closeModal);
  closeMediaDrawerButton.addEventListener("click", closeMediaDrawer);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#moreButton") && !e.target.closest("#topMenu")) topMenu.classList.add("is-hidden");
    if (!e.target.closest(".pen-picker-shell")) penColorPopover.classList.add("is-hidden");
  });
  viewport.addEventListener("pointerdown", panStart);
  viewport.addEventListener("pointermove", panMove);
  viewport.addEventListener("pointerup", panStop);
  viewport.addEventListener("pointercancel", panStop);
  viewport.addEventListener("pointerdown", marqueeStart);
  viewport.addEventListener("pointermove", marqueeMove);
  viewport.addEventListener("pointerup", marqueeStop);
  viewport.addEventListener("pointercancel", marqueeStop);
  viewport.addEventListener("pointerdown", drawStart);
  viewport.addEventListener("pointermove", drawMove);
  viewport.addEventListener("pointerup", drawStop);
  viewport.addEventListener("pointercancel", drawStop);
  viewport.addEventListener("pointermove", localCursor);
  viewport.addEventListener("pointerleave", () => sendPresence(null));
}

async function loadSnapshot() {
  try {
    const response = await fetch(snapshotUrl, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Snapshot request failed with ${response.status}`);
    }
    const snapshot = await response.json();
    applySnapshot(snapshot);
    bootstrapped = true;
  } catch (error) {
    console.error(error);
    showToast("Snapshot load failed");
    liveBadge.textContent = "Offline";
    roomSummary.textContent = `Room ${roomId} could not load from ${serverOrigin}.`;
  }
}

function connectSocket() {
  if (destroyed) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  socket = new WebSocket(websocketUrl);
  updatePresence();

  socket.addEventListener("open", () => {
    connected = true;
    updatePresence();
    showToast("Live room connected");
    sendMessage({ type: "room.snapshot.request" });
    sendPresence(currentCursor);
  });

  socket.addEventListener("message", async (event) => {
    const payload = await readSocketMessage(event.data);
    if (payload) handleServerMessage(payload);
  });

  socket.addEventListener("close", () => {
    connected = false;
    updatePresence();
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    connected = false;
    updatePresence();
  });
}

function scheduleReconnect() {
  if (destroyed) return;
  if (reconnectTimer) return;
  liveBadge.textContent = "Reconnecting";
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectSocket();
  }, 1800);
}

function handleServerMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    console.warn("Invalid server message", raw);
    return;
  }

  if (message.type === "room.snapshot") {
    applySnapshot(message.payload);
    return;
  }

  if (message.type === "presence.list") {
    applyPresenceList(message.payload);
    return;
  }

  if (message.type === "presence.updated") {
    if (!message.payload?.clientId) return;
    state.presence.set(message.payload.clientId, message.payload);
    updatePresence();
    renderRemote();
    return;
  }

  if (message.type === "element.upserted") {
    const item = message.payload;
    if (!item?.id) return;
    rememberElement(item);
    renderElements();
    renderLayers();
    return;
  }

  if (message.type === "element.patched") {
    const current = state.elements.get(message.payload?.id);
    if (!current) return;
    rememberElement({ ...current, ...message.payload.fields, id: current.id });
    renderElements();
    renderLayers();
    return;
  }

  if (message.type === "element.deleted") {
    state.elements.delete(message.payload?.id);
    renderElements();
    renderLayers();
    return;
  }

  if (message.type === "settings.patched") {
    state.settings = {
      ...state.settings,
      ...message.payload
    };
    renderSettings();
    return;
  }

  if (message.type === "history.appended") {
    state.history.unshift(message.payload);
    if (state.history.length > 20) state.history.length = 20;
    renderHistory();
    return;
  }

  if (message.type === "error") {
    console.warn("Server error", message.payload);
    showToast(message.payload?.message || "Live sync error");
  }
}

function applySnapshot(snapshot) {
  if (!snapshot) return;
  bootstrapped = true;
  state.roomId = snapshot.roomId || roomId;
  state.elements = new Map((snapshot.elements || []).filter((item) => item?.id !== "seed-sprint").map((item) => [item.id, item]));
  state.settings = {
    grid: snapshot.settings?.grid !== false,
    glow: snapshot.settings?.glow === true
  };
  state.meta = {
    seedVersion: snapshot.meta?.seedVersion || "v1",
    nextOrder: Number(snapshot.meta?.nextOrder || 0)
  };
  state.history = Array.isArray(snapshot.history) ? snapshot.history.slice(0, 20) : [];
  state.presence = new Map((snapshot.presence || []).map((entry) => [entry.clientId, entry]));
  localCount = Math.max(localCount, Array.from(state.elements.values()).filter((item) => !item.seed).length);
  ensureOwnPresenceListed();
  renderAll();
}

function applyPresenceList(list) {
  state.presence = new Map((Array.isArray(list) ? list : []).map((entry) => [entry.clientId, entry]));
  ensureOwnPresenceListed();
  updatePresence();
  renderRemote();
}

function ensureOwnPresenceListed() {
  if (!connected && !currentCursor && !state.presence.has(clientId)) return;
  state.presence.set(clientId, {
    clientId,
    user,
    cursor: currentCursor,
    lastSeenAt: Date.now()
  });
}

function renderAll() {
  renderSettings();
  renderElements();
  renderHistory();
  renderLayers();
  updatePresence();
  renderRemote();
}

function addItem(tool) {
  if (tool === "pen") {
    showToast("Use the canvas to draw with the pen");
    return;
  }
  if (!ensureConnected()) return;
  localCount += 1;
  const id = `item-${crypto.randomUUID()}`;
  const base = {
    id,
    x: 320 + (localCount % 5) * 120,
    y: 240 + (localCount % 4) * 110,
    order: nextOrder(),
    seed: false
  };
  let item;
  if (tool === "text") item = { ...base, kind: "text", title: `HEADLINE ${localCount}` };
  else if (tool === "shape") item = { ...base, kind: localCount % 2 === 0 ? "shape-circle" : "shape-blob", title: localCount % 2 === 0 ? `Shape ${localCount} Circle` : `Shape ${localCount} Blob` };
  else if (tool === "media") item = { ...base, kind: "media", title: `Reference ${localCount}`, text: "Auto-added inspiration card", image: IMAGES[localCount % IMAGES.length], rotation: 0 };
  else item = { ...base, kind: "sticky", title: `Idea Note ${localCount}`, text: "Fresh note dropped onto the board. Drag it anywhere and keep building.", rotation: 0 };
  if (!sendMessage({ type: "element.upsert", payload: item })) return;
  rememberElement(item);
  renderElements();
  renderLayers();
  pushHistory(`${user.name} added ${item.title}`);
  showToast(`${item.title} created`);
}

function makeMediaItemFromFile(image, filename, dimensions) {
  localCount += 1;
  return {
    id: `item-${crypto.randomUUID()}`,
    kind: "media",
    title: stripFileExtension(filename) || `Reference ${localCount}`,
    text: "Imported from your device",
    importSource: "Your device",
    fileName: filename,
    fileType: filename.split(".").pop()?.toUpperCase() || "Image",
    image,
    width: dimensions.width,
    height: dimensions.height,
    x: 320 + (localCount % 5) * 120,
    y: 240 + (localCount % 4) * 110,
    order: nextOrder(),
    rotation: 0,
    seed: false
  };
}

function sortedElements() {
  return Array.from(state.elements.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
}

function renderElements() {
  const ids = new Set();
  sortedElements().forEach((el) => {
    if (el.kind === "stroke") return;
    ids.add(el.id);
    let node = nodes.get(el.id);
    if (!node) {
      node = document.createElement(el.kind === "text" ? "div" : "article");
      node.classList.add("draggable");
      node.dataset.id = el.id;
      bindDrag(node);
      nodes.set(el.id, node);
      stage.appendChild(node);
    }
    paint(node, el);
  });
  Array.from(nodes.keys()).forEach((id) => {
    if (!ids.has(id)) {
      nodes.get(id)?.remove();
      nodes.delete(id);
    }
  });
  renderStrokes();
  stage.appendChild(selectionBox);
  cursorLayer.remove();
  stage.appendChild(cursorLayer);
}

function renderStrokes() {
  const ids = new Set();
  sortedElements()
    .filter((el) => el.kind === "stroke")
    .forEach((el) => {
      ids.add(el.id);
      let node = strokeNodes.get(el.id);
      if (!node) {
        node = document.createElementNS("http://www.w3.org/2000/svg", "path");
        node.classList.add("draw-path");
        strokeNodes.set(el.id, node);
        drawLayer.appendChild(node);
      }
      node.setAttribute("d", pointsToPath(el.points || []));
      node.setAttribute("stroke", el.color || "#005bc1");
      node.setAttribute("stroke-width", String(el.width || 6));
    });
  Array.from(strokeNodes.keys()).forEach((id) => {
    if (!ids.has(id)) {
      strokeNodes.get(id)?.remove();
      strokeNodes.delete(id);
    }
  });
}

function paint(node, el) {
  node.className = "draggable";
  node.dataset.id = el.id;
  node.classList.toggle("is-selected", selectedIds.has(el.id));
  node.style.left = `${el.x}px`;
  node.style.top = `${el.y}px`;
  node.style.zIndex = String(el.order);
  node.style.transform = "";
  if (el.kind === "sticky") {
    node.classList.add("sticky-note");
    node.classList.toggle("is-pinned", el.pinned === true);
    node.style.transform = `rotate(${el.rotation || 0}deg)`;
    node.innerHTML = `<div><h2 data-edit-field="title">${esc(el.title)}</h2><p data-edit-field="text">${esc(el.text)}</p></div><div class="pin-row"><button class="pin-button ${el.pinned ? "is-pinned" : ""}" data-pin-toggle="true" type="button" aria-label="${el.pinned ? "Unpin note" : "Pin note"}"><span class="material-symbols-outlined">${el.pinned ? "keep" : "push_pin"}</span></button></div>`;
    return;
  }
  if (el.kind === "shape-circle") { node.classList.add("shape-circle"); node.innerHTML = ""; return; }
  if (el.kind === "shape-blob") { node.classList.add("shape-blob"); node.style.transform = "none"; node.innerHTML = ""; return; }
  if (el.kind === "media") {
    node.classList.add("media-card");
    node.style.transform = `rotate(${el.rotation || 0}deg)`;
    node.innerHTML = `<img src="${esc(el.image)}" alt="${esc(el.title)}" width="${Number(el.width) || 420}" height="${Number(el.height) || 236}" /><div class="media-overlay"><span class="material-symbols-outlined">zoom_in</span></div>`;
    return;
  }
  if (el.kind === "text") { node.classList.add("hero-type"); node.innerHTML = `<span data-edit-field="title">${esc(el.title)}</span>`; return; }
  node.classList.add("sprint-card");
  node.innerHTML = `<div class="sprint-head"><div class="spark-badge"><span class="material-symbols-outlined">auto_awesome</span></div><span class="status-pill">Active</span></div><h3 data-edit-field="title">${esc(el.title)}</h3><div class="team-stack" aria-hidden="true"><span></span><span></span><span></span><span class="team-more">+5</span></div><div class="sprint-meta"><span data-edit-field="text">${esc(el.text)}</span><span class="material-symbols-outlined">arrow_forward_ios</span></div>`;
}

function bindDrag(node) {
  node.addEventListener("click", (e) => {
    const item = getItem(node.dataset.id);
    if (!item) return;

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(item.id);
      return;
    }

    if (Date.now() >= suppressMediaOpenUntil) selectOnly(item.id);

    if (e.target.closest("[data-pin-toggle]")) {
      e.preventDefault();
      e.stopPropagation();
      if (item.kind === "sticky") {
        if (updateFields(item.id, { pinned: !item.pinned })) {
          pushHistory(`${user.name} ${item.pinned ? "unpinned" : "pinned"} ${item.title}`);
          showToast(item.pinned ? "Sticky note unpinned" : "Sticky note pinned");
        }
      }
      return;
    }

    if (Date.now() < suppressMediaOpenUntil) return;
    const el = item;
    if (!el || el.kind !== "media") return;
    if (e.target.closest("[data-edit-field]")) return;
    openMediaDrawer(el);
  });

  node.addEventListener("dblclick", (e) => {
    const item = getItem(node.dataset.id);
    if (item?.kind === "sticky") {
      e.preventDefault();
      e.stopPropagation();
      openStickyEditor(item);
      return;
    }

    if (node.classList.contains("hero-type")) {
      const hero = node.querySelector("[data-edit-field]") || node;
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit(hero, node);
      return;
    }
    const source = e.target.nodeType === Node.TEXT_NODE ? e.target.parentElement : e.target;
    const target = source?.closest("[data-edit-field]");
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    startInlineEdit(target, node);
  });

  node.addEventListener("pointerdown", (e) => {
    if (currentTool === "pen") return;
    const source = e.target.nodeType === Node.TEXT_NODE ? e.target.parentElement : e.target;
    if (source?.closest('[data-edit-field][data-editing="true"]')) return;
    e.stopPropagation();
    const el = getItem(node.dataset.id);
    if (el?.pinned) return;
    if (!el || e.target.closest("button")) return;
    if (!selectedIds.has(el.id) && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      selectOnly(el.id);
    }
    const groupIds = selectedIds.has(el.id) ? Array.from(selectedIds) : [el.id];
    dragState = {
      id: el.id,
      pid: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ix: el.x,
      iy: el.y,
      lx: el.x,
      ly: el.y,
      order: el.order,
      moved: false,
      group: groupIds.map((id) => {
        const item = getItem(id);
        if (!item || item.pinned) return null;
        return { id, x: item.x, y: item.y };
      }).filter(Boolean)
    };
    panState = null;
    viewport.classList.remove("is-panning");
    node.setPointerCapture(e.pointerId);
  });

  const stop = (e) => {
    e.stopPropagation();
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    if (dragState.moved) {
      const deltaX = dragState.lx - dragState.ix;
      const deltaY = dragState.ly - dragState.iy;
      let ok = true;
      dragState.group.forEach((entry) => {
        if (!updateFields(entry.id, {
          x: entry.x + deltaX,
          y: entry.y + deltaY,
          order: entry.id === dragState.id ? dragState.order : getItem(entry.id)?.order
        })) ok = false;
      });
      if (!ok) renderElements();
      else pushHistory(`${user.name} moved ${dragState.group.length > 1 ? `${dragState.group.length} items` : (getItem(dragState.id)?.title || "an item")}`);
      suppressMediaOpenUntil = Date.now() + 180;
    }
    node.releasePointerCapture(e.pointerId);
    dragState = null;
  };

  node.addEventListener("pointermove", (e) => {
    e.stopPropagation();
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    const deltaX = (e.clientX - dragState.sx) / zoom;
    const deltaY = (e.clientY - dragState.sy) / zoom;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) return;
    if (!dragState.moved) {
      dragState.moved = true;
      dragState.order = nextOrder();
      const current = getItem(dragState.id);
      if (current) {
        rememberElement({ ...current, order: dragState.order });
        renderElements();
        renderLayers();
      }
    }
    dragState.lx = dragState.ix + deltaX;
    dragState.ly = dragState.iy + deltaY;
    dragState.group.forEach((entry) => {
      const groupNode = nodes.get(entry.id);
      if (!groupNode) return;
      groupNode.style.left = `${entry.x + deltaX}px`;
      groupNode.style.top = `${entry.y + deltaY}px`;
    });
    sendPresence({ x: dragState.lx, y: dragState.ly });
  });
  node.addEventListener("pointerup", stop);
  node.addEventListener("pointercancel", stop);
}

function startInlineEdit(target, owner) {
  if (dragState) return;
  const field = target.dataset.editField;
  const el = getItem(owner.dataset.id);
  if (!el || !field) return;
  const current = String(el[field] || "");
  target.setAttribute("contenteditable", "true");
  target.setAttribute("data-editing", "true");
  queueMicrotask(() => {
    target.focus();
    caretEnd(target);
  });
  const finish = (save) => {
    const next = target.textContent ?? "";
    target.removeAttribute("contenteditable");
    target.removeAttribute("data-editing");
    target.removeEventListener("blur", onBlur);
    target.removeEventListener("keydown", onKeyDown);
    if (!save) {
      target.textContent = current;
      return;
    }
    if (next === current) return;
    if (!next.trim()) {
      target.textContent = current;
      showToast("Text can't be empty");
      return;
    }
    if (!updateFields(el.id, { [field]: next })) {
      target.textContent = current;
      return;
    }
    pushHistory(`${user.name} edited ${el.title || "text"}`);
    showToast("Text updated");
  };
  const onBlur = () => finish(true);
  const onKeyDown = (event) => {
    if (event.key === "Enter" && field !== "text" && !event.shiftKey) {
      event.preventDefault();
      finish(true);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  };
  target.addEventListener("blur", onBlur);
  target.addEventListener("keydown", onKeyDown);
}

function caretEnd(el) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function panStart(e) {
  if (!panEnabled || dragState || drawState || marqueeState || currentTool === "pen" || e.target.closest(".draggable") || e.target.closest("button")) return;
  if (!e.shiftKey && !e.ctrlKey && !e.metaKey) clearSelection();
  panState = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
  viewport.classList.add("is-panning");
  viewport.setPointerCapture(e.pointerId);
}
function panMove(e) {
  if (!panState || dragState || drawState || marqueeState || panState.pid !== e.pointerId) return;
  viewport.scrollLeft = panState.sl - (e.clientX - panState.sx);
  viewport.scrollTop = panState.st - (e.clientY - panState.sy);
}
function panStop(e) {
  if (!panState || panState.pid !== e.pointerId) return;
  viewport.classList.remove("is-panning");
  viewport.releasePointerCapture(e.pointerId);
  panState = null;
}

function localCursor(e) {
  const r = stage.getBoundingClientRect();
  sendPresence({ x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom });
}

function drawStart(e) {
  if (currentTool !== "pen" || dragState || e.button !== 0 || e.target.closest(".draggable") || e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) return;
  if (!ensureConnected()) return;
  const point = pointerToStagePoint(e);
  drawState = {
    pid: e.pointerId,
    points: [point],
    preview: document.createElementNS("http://www.w3.org/2000/svg", "path")
  };
  drawState.preview.classList.add("draw-path");
  drawState.preview.setAttribute("stroke", penColor);
  drawState.preview.setAttribute("stroke-width", String(penWidth));
  drawState.preview.setAttribute("d", pointsToPath(drawState.points));
  drawLayer.appendChild(drawState.preview);
  viewport.setPointerCapture(e.pointerId);
  e.preventDefault();
}

function drawMove(e) {
  if (!drawState || drawState.pid !== e.pointerId) return;
  const point = pointerToStagePoint(e);
  const last = drawState.points[drawState.points.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
  drawState.points.push(point);
  drawState.preview.setAttribute("d", pointsToPath(drawState.points));
  e.preventDefault();
}

function drawStop(e) {
  if (!drawState || drawState.pid !== e.pointerId) return;
  const points = drawState.points.slice();
  drawState.preview.remove();
  viewport.releasePointerCapture(e.pointerId);
  drawState = null;
  if (points.length < 2) return;
  localCount += 1;
  const stroke = {
    id: `stroke-${crypto.randomUUID()}`,
    kind: "stroke",
    title: `Stroke ${localCount}`,
    points,
    color: penColor,
    width: penWidth,
    order: nextOrder(),
    seed: false
  };
  if (!sendMessage({ type: "element.upsert", payload: stroke })) return;
  rememberElement(stroke);
  renderElements();
  renderLayers();
  pushHistory(`${user.name} drew a stroke`);
  showToast("Stroke added");
}
function marqueeStart(e) {
  if (currentTool === "pen" || drawState || dragState || e.button !== 0) return;
  if (e.target.closest(".draggable") || e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) return;
  const point = pointerToStagePoint(e);
  if (!e.shiftKey && !e.ctrlKey && !e.metaKey) clearSelection();
  marqueeState = { pid: e.pointerId, sx: point.x, sy: point.y, additive: !!(e.shiftKey || e.ctrlKey || e.metaKey) };
  selectionBox.classList.remove("is-hidden");
  updateSelectionBox(point.x, point.y, point.x, point.y);
  viewport.setPointerCapture(e.pointerId);
  e.preventDefault();
}
function marqueeMove(e) {
  if (!marqueeState || marqueeState.pid !== e.pointerId) return;
  const point = pointerToStagePoint(e);
  updateSelectionBox(marqueeState.sx, marqueeState.sy, point.x, point.y);
}
function marqueeStop(e) {
  if (!marqueeState || marqueeState.pid !== e.pointerId) return;
  const point = pointerToStagePoint(e);
  const rect = normalizeRect(marqueeState.sx, marqueeState.sy, point.x, point.y);
  if (!marqueeState.additive) clearSelection();
  getIntersectingSelection(rect).forEach((id) => selectedIds.add(id));
  renderElements();
  selectionBox.classList.add("is-hidden");
  viewport.releasePointerCapture(e.pointerId);
  marqueeState = null;
}
function updateSelectionBox(x1, y1, x2, y2) {
  const rect = normalizeRect(x1, y1, x2, y2);
  selectionBox.style.left = `${rect.left}px`;
  selectionBox.style.top = `${rect.top}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;
}
function normalizeRect(x1, y1, x2, y2) {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  };
}
function getIntersectingSelection(rect) {
  const hits = [];
  nodes.forEach((node, id) => {
    const left = node.offsetLeft;
    const top = node.offsetTop;
    const right = left + node.offsetWidth;
    const bottom = top + node.offsetHeight;
    if (right >= rect.left && left <= rect.right && bottom >= rect.top && top <= rect.bottom) hits.push(id);
  });
  return hits;
}

function renderSettings() {
  const grid = state.settings.grid !== false;
  const glow = state.settings.glow === true;
  gridToggle.checked = grid;
  canvasGrid.classList.toggle("is-hidden", !grid);
  document.body.classList.toggle("alt-glow", glow);
}

function renderHistory() {
  historyList.innerHTML = state.history.slice(0, 8).map((x) => `<li>${esc(x.text || "")}</li>`).join("");
}

function renderLayers() {
  layerList.innerHTML = sortedElements().slice().reverse().map((x) => `<li>${esc(x.title || "Canvas item")}</li>`).join("");
}

function updatePresence() {
  const states = Array.from(state.presence.values()).filter((x) => x?.user);
  presenceList.innerHTML = states.map((entry) => `<span class="presence-chip"><span class="presence-dot" style="background:${esc(entry.user.color)}"></span><span>${esc(entry.user.name)}</span></span>`).join("");
  liveBadge.textContent = connected
    ? `${states.length} live`
    : socket?.readyState === WebSocket.CONNECTING
      ? "Connecting"
      : bootstrapped
        ? "Reconnecting"
        : "Syncing";
  roomSummary.textContent = `Public live room ${roomId}. Open the same link on other devices to collaborate through ${serverOrigin}.`;
}

function renderRemote() {
  cursorLayer.innerHTML = Array.from(state.presence.values())
    .filter((entry) => entry.clientId !== clientId && entry?.user && entry?.cursor)
    .map((entry) => `<div class="remote-cursor" style="left:${entry.cursor.x}px; top:${entry.cursor.y}px;"><div class="remote-cursor-dot" style="background:${esc(entry.user.color)}"></div><div class="remote-cursor-label" style="background:${esc(entry.user.color)}">${esc(entry.user.name)}</div></div>`)
    .join("");
}

function setTool(tool, toastIt) {
  currentTool = tool;
  toolButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.tool === tool));
  penControls.classList.toggle("is-hidden", tool !== "pen");
  if (tool !== "pen") penColorPopover.classList.add("is-hidden");
  if (toastIt) showToast(`${tool[0].toUpperCase()}${tool.slice(1)} tool selected`);
}
function syncPenSwatches(color) {
  penSwatches.forEach((swatch) => swatch.classList.toggle("is-active", swatch.dataset.penColor?.toLowerCase() === color.toLowerCase()));
  penColorPreview?.style.setProperty("--pen-preview", color);
  if (penColorValue) penColorValue.textContent = color.toUpperCase();
  penPickerSwatch?.style.setProperty("--pen-preview", color);
  if (penPickerCaption) penPickerCaption.textContent = color.toUpperCase();
}
function selectOnly(id) {
  selectedIds.clear();
  selectedIds.add(id);
  renderElements();
}
function toggleSelection(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  renderElements();
}
function clearSelection() {
  if (!selectedIds.size) return;
  selectedIds.clear();
  renderElements();
}
function setPenColor(color) {
  penColor = normalizeHex(color) || penColor;
  syncPenSwatches(penColor);
  syncPenColorInputs(penColor);
}
function syncPenColorInputs(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return;
  if (document.activeElement !== penHexInput) {
    penHexInput.value = color.toUpperCase();
  }
  penRedInput.value = String(rgb.r);
  penGreenInput.value = String(rgb.g);
  penBlueInput.value = String(rgb.b);
  penRedValue.textContent = String(rgb.r);
  penGreenValue.textContent = String(rgb.g);
  penBlueValue.textContent = String(rgb.b);
}
function syncPenColorFromRgb() {
  penRedValue.textContent = penRedInput.value;
  penGreenValue.textContent = penGreenInput.value;
  penBlueValue.textContent = penBlueInput.value;
  setPenColor(rgbToHex(Number(penRedInput.value), Number(penGreenInput.value), Number(penBlueInput.value)));
}
function syncPenColorFromHexPreview() {
  const next = normalizeHex(penHexInput.value);
  if (!next) return;
  setPenColor(next);
}
function syncPenColorFromHexCommit() {
  const next = normalizeHex(penHexInput.value);
  if (!next) {
    penHexInput.value = penColor.toUpperCase();
    return;
  }
  setPenColor(next);
}
function selectPenHexInput() {
  queueMicrotask(() => penHexInput.select());
}
function onPenHexKeyDown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    syncPenColorFromHexCommit();
    penHexInput.blur();
  }
}

function setPanel(panel) {
  navButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.panel === panel));
  panelCopies.forEach((p) => p.classList.toggle("is-hidden", p.dataset.panelCopy !== panel));
}

function applyZoom(v) {
  zoom = v;
  stage.style.transform = `scale(${v})`;
  stage.style.width = `${STAGE_W * v}px`;
  stage.style.height = `${STAGE_H * v}px`;
}

function center(smooth) {
  viewport.scrollTo({ left: Math.max(0, (stage.scrollWidth - viewport.clientWidth) / 2 - 240), top: Math.max(0, (stage.scrollHeight - viewport.clientHeight) / 2 - 180), behavior: smooth ? "smooth" : "auto" });
  dock(fitButton);
}

function dock(btn) {
  [zoomButton, fitButton, panButton].forEach((b) => b.classList.toggle("is-active", b === btn));
}

function shareModal() {
  const liveUrl = new URL(window.location.href);
  if (liveUrl.searchParams.get("server") || !isDefaultServerOrigin(serverOrigin)) {
    liveUrl.searchParams.set("server", serverOrigin);
  }
  openModal("Share Live Room", `<p>Anyone opening this link joins the same live room through the configured backend.</p><div class="connection-tools"><button class="menu-item" id="copyLiveLinkButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy live link</span></button><button class="menu-item" id="copyServerLinkButton" type="button"><span class="material-symbols-outlined">link</span><span>Copy backend URL</span></button><button class="menu-item" id="openLocalModeButton" type="button"><span class="material-symbols-outlined">desktop_windows</span><span>Switch to local-only mode</span></button></div><div class="connection-panel"><p class="connection-status">${esc(liveUrl.toString())}</p></div>`);
  $("#copyLiveLinkButton")?.addEventListener("click", () => copyText(liveUrl.toString(), "Live link copied"));
  $("#copyServerLinkButton")?.addEventListener("click", () => copyText(serverOrigin, "Backend URL copied"));
  $("#openLocalModeButton")?.addEventListener("click", () => {
    const localUrl = new URL("./index.html", window.location.href);
    localUrl.searchParams.set("room", roomId);
    if (liveUrl.searchParams.get("server")) localUrl.searchParams.set("server", liveUrl.searchParams.get("server"));
    window.location.href = localUrl.toString();
  });
}

function openMediaImportModal() {
  openModal("Import Media", `
    <div class="media-import">
      <div class="media-dropzone" id="mediaDropzone">
        <div>
          <span class="material-symbols-outlined">upload_file</span>
          <h3>Drop images here</h3>
          <p>Drag and drop files into the canvas, or choose images from your computer.</p>
          <div class="media-import-actions">
            <button class="primary-action" id="mediaBrowseButton" type="button">
              <span class="material-symbols-outlined">image</span>
              <span>Choose Images</span>
            </button>
          </div>
          <input class="media-import-input" id="mediaFileInput" type="file" accept="image/*" multiple />
        </div>
      </div>
      <p class="media-import-meta">Imported images are added to the live room and shared with connected collaborators.</p>
    </div>
  `);

  const dropzone = $("#mediaDropzone");
  const input = $("#mediaFileInput");
  const browse = $("#mediaBrowseButton");
  if (!dropzone || !input || !browse) return;

  browse.addEventListener("click", () => input.click());
  input.addEventListener("change", () => importMediaFiles(input.files));
  ["dragenter", "dragover"].forEach((type) => dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  }));
  ["dragleave", "dragend", "drop"].forEach((type) => dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
  }));
  dropzone.addEventListener("drop", (event) => importMediaFiles(event.dataTransfer?.files));
}

function openStickyEditor(item) {
  openModal("Edit Sticky Note", `
    <div class="sticky-editor">
      <input class="sticky-editor-title" id="stickyEditorTitle" type="text" value="${esc(item.title || "")}" />
      <textarea class="sticky-editor-body" id="stickyEditorBody">${esc(item.text || "")}</textarea>
      <div class="sticky-editor-actions">
        <button class="ghost-row" id="stickyEditorCancel" type="button">Cancel</button>
        <button class="primary-action" id="stickyEditorDone" type="button">Done</button>
      </div>
    </div>
  `);

  const titleInput = $("#stickyEditorTitle");
  const bodyInput = $("#stickyEditorBody");
  const cancelButton = $("#stickyEditorCancel");
  const doneButton = $("#stickyEditorDone");
  if (!titleInput || !bodyInput || !doneButton || !cancelButton) return;

  titleInput.focus();
  titleInput.select();

  const commit = () => {
    const nextTitle = titleInput.value.trim() || item.title || "Untitled note";
    const nextBody = bodyInput.value.trim() || item.text || "";
    if (nextTitle !== item.title && !updateFields(item.id, { title: nextTitle })) return;
    if (nextBody !== item.text && !updateFields(item.id, { text: nextBody })) return;
    if (nextTitle !== item.title || nextBody !== item.text) {
      pushHistory(`${user.name} edited ${nextTitle}`);
      showToast("Sticky note updated");
    }
    closeModal();
  };

  doneButton.addEventListener("click", commit);
  cancelButton.addEventListener("click", closeModal);
}

function openMediaDrawer(item) {
  mediaDrawerTitle.textContent = item.title || "Untitled image";
  mediaDrawerBody.innerHTML = `
    <div class="media-drawer-preview"><img src="${esc(item.image)}" alt="${esc(item.title || "Media preview")}" /></div>
    <div class="media-drawer-meta">
      <div class="media-drawer-row"><div class="media-drawer-label">File</div><div class="media-drawer-value">${esc(item.fileName || item.title || "Unknown")}</div></div>
      <div class="media-drawer-row"><div class="media-drawer-label">Source</div><div class="media-drawer-value">${esc(item.importSource || item.text || "Board media")}</div></div>
      <div class="media-drawer-row"><div class="media-drawer-label">Type</div><div class="media-drawer-value">${esc(item.fileType || "Image")}</div></div>
      <div class="media-drawer-row"><div class="media-drawer-label">Notes</div><div class="media-drawer-value">${esc(item.text || "No extra notes")}</div></div>
    </div>
  `;
  mediaDrawer.classList.add("is-open");
}

function closeMediaDrawer() {
  mediaDrawer.classList.remove("is-open");
}

async function importMediaFiles(fileList) {
  if (!ensureConnected()) return;
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    showToast("No image files found");
    return;
  }

  for (const file of files) {
    try {
      const image = await readFileAsDataUrl(file);
      const dimensions = await getImageDimensions(image);
      const item = makeMediaItemFromFile(image, file.name, dimensions);
      if (!sendMessage({ type: "element.upsert", payload: item })) return;
      rememberElement(item);
      renderElements();
      renderLayers();
      pushHistory(`${user.name} imported ${item.title}`);
    } catch {
      showToast(`Couldn't import ${file.name}`);
    }
  }

  closeModal();
  showToast(files.length === 1 ? "Image added" : `${files.length} images added`);
}

function openModal(title, body) { modalTitle.textContent = title; modalBody.innerHTML = body; modal.classList.remove("is-hidden"); }
function closeModal() { modal.classList.add("is-hidden"); }
function showToast(msg) { toast.textContent = msg; toast.classList.remove("is-hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add("is-hidden"), 2200); }

function rememberElement(item) {
  state.elements.set(item.id, item);
  state.meta.nextOrder = Math.max(state.meta.nextOrder || 0, Number(item.order || 0));
}

function updateFields(id, fields) {
  const current = state.elements.get(id);
  if (!current) return false;
  if (!sendMessage({ type: "element.patch", payload: { id, fields } })) return false;
  rememberElement({ ...current, ...fields, id: current.id });
  renderElements();
  renderLayers();
  return true;
}

function patchSettings(fields) {
  if (!sendMessage({ type: "settings.patch", payload: fields })) return false;
  state.settings = {
    ...state.settings,
    ...fields
  };
  renderSettings();
  return true;
}

function deleteItem(id) {
  if (!state.elements.has(id)) return false;
  if (!sendMessage({ type: "element.delete", payload: { id } })) return false;
  state.elements.delete(id);
  renderElements();
  renderLayers();
  return true;
}

function getItem(id) {
  const item = state.elements.get(id);
  return item ? { ...item } : null;
}

function nextOrder() {
  const next = Number(state.meta.nextOrder || 0) + 1;
  state.meta.nextOrder = next;
  return next;
}

function pushHistory(text) {
  sendMessage({
    type: "history.append",
    payload: {
      text,
      actorId: clientId,
      at: Date.now()
    }
  });
}

function sendPresence(cursor) {
  currentCursor = cursor;
  ensureOwnPresenceListed();
  updatePresence();
  renderRemote();
  if (presenceTimer) return;
  presenceTimer = window.setTimeout(() => {
    presenceTimer = null;
    sendMessage({
      type: "presence.update",
      payload: {
        clientId,
        user,
        cursor: currentCursor,
        lastSeenAt: Date.now()
      }
    }, false);
  }, 40);
}

function ensureConnected() {
  if (connected && socket?.readyState === WebSocket.OPEN) return true;
  showToast("Live server unavailable");
  connectSocket();
  return false;
}

function sendMessage(message, toastOnFailure = true) {
  if (!connected || !socket || socket.readyState !== WebSocket.OPEN) {
    if (toastOnFailure) showToast("Live server unavailable");
    return false;
  }
  socket.send(JSON.stringify(message));
  return true;
}

function ensureRoomId() {
  const u = new URL(window.location.href);
  let id = u.searchParams.get("room");
  if (!id) {
    id = (crypto.randomUUID?.() || `room-${Date.now()}`).slice(0, 8);
    u.searchParams.set("room", id);
    window.history.replaceState({}, "", u);
  }
  return id;
}

function ensureClientId() {
  const key = "never-wet-freeform-live-client";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || `client-${Date.now()}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

function resolveServerOrigin() {
  const page = new URL(window.location.href);
  const explicit = page.searchParams.get("server");
  if (explicit) {
    return normalizeServerOrigin(explicit);
  }
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SERVER_PORT}`;
  }
  return `http://localhost:${DEFAULT_SERVER_PORT}`;
}

function normalizeServerOrigin(value) {
  try {
    const url = new URL(value.includes("://") ? value : `http://${value}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return `http://localhost:${DEFAULT_SERVER_PORT}`;
  }
}

function buildWebsocketUrl(origin, room, client) {
  const httpUrl = new URL(origin);
  const wsProtocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = new URL(`${wsProtocol}//${httpUrl.host}/ws`);
  wsUrl.searchParams.set("room", room);
  wsUrl.searchParams.set("clientId", client);
  return wsUrl.toString();
}

function isDefaultServerOrigin(origin) {
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return origin === `http://localhost:${DEFAULT_SERVER_PORT}`;
  }
  return origin === `${window.location.protocol}//${window.location.hostname}:${DEFAULT_SERVER_PORT}`;
}

function loadUser() {
  const key = "never-wet-freeform-live-user";
  try {
    const old = JSON.parse(localStorage.getItem(key));
    if (old) return old;
  } catch {}
  const created = { name: `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${Math.floor(Math.random() * 90 + 10)}`, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  localStorage.setItem(key, JSON.stringify(created));
  return created;
}

async function readSocketMessage(data) {
  if (typeof data === "string") return data;
  if (data instanceof Blob) return await data.text();
  return null;
}

async function copyText(v, ok) { try { await navigator.clipboard.writeText(v); showToast(ok); } catch { showToast("Copy failed"); } }
function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function stripFileExtension(name) { return String(name || "").replace(/\.[^.]+$/, ""); }
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}
function pointerToStagePoint(e) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom,
    y: (e.clientY - rect.top) / zoom
  };
}
function pointsToPath(points) {
  if (!points.length) return "";
  if (points.length === 1) {
    const x = roundPoint(points[0].x);
    const y = roundPoint(points[0].y);
    return `M ${x} ${y} L ${x + 0.01} ${y + 0.01}`;
  }
  if (points.length === 2) {
    return `M ${roundPoint(points[0].x)} ${roundPoint(points[0].y)} L ${roundPoint(points[1].x)} ${roundPoint(points[1].y)}`;
  }

  let path = `M ${roundPoint(points[0].x)} ${roundPoint(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${roundPoint(current.x)} ${roundPoint(current.y)} ${roundPoint(midX)} ${roundPoint(midY)}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  path += ` Q ${roundPoint(penultimate.x)} ${roundPoint(penultimate.y)} ${roundPoint(last.x)} ${roundPoint(last.y)}`;
  return path;
}
function roundPoint(value) {
  return Math.round(value * 10) / 10;
}
function normalizeHex(value) {
  const raw = String(value || "").trim().replace(/^#/, "");
  if (/^[\da-fA-F]{3}$/.test(raw)) {
    return `#${raw.split("").map((char) => `${char}${char}`).join("").toLowerCase()}`;
  }
  if (/^[\da-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}
function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}
