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
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
const COLORS = ["#005bc1", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8"];
const NAMES = ["Aurora", "Juniper", "Marin", "Sol", "Mika", "Nova", "Ari", "Jules"];
const IMAGES = ["../img/code2.png", "../img/code.jpg", "../img/background.jpeg", "../img/cat.jpg"];

const user = loadUser();
const peers = new Map();
const remote = new Map();
const pending = new Map();
const nodes = new Map();
const strokeNodes = new Map();
const state = {
  mode: "solo",
  roomId: ensureRoomId(),
  tool: "sticky",
  zoom: 1,
  pan: true,
  glow: false,
  grid: true,
  count: 0,
  order: 6,
  history: ["Canvas ready"],
  elements: seed(),
  penColor: "#005bc1",
  penWidth: 6,
};

let toastTimer = null;
let panState = null;
let dragState = null;
let drawState = null;
let suppressMediaOpenUntil = 0;

setup();
render();
window.addEventListener("load", () => center(false));

function setup() {
  toolButtons.forEach((b) => b.addEventListener("click", () => {
    setTool(b.dataset.tool, true);
    if (b.dataset.tool === "media") {
      openMediaImportModal();
      return;
    }
    if (b.dataset.tool !== "pen") dispatch({ type: "add", tool: b.dataset.tool, actor: user.name });
  }));
  navButtons.forEach((b) => b.addEventListener("click", () => setPanel(b.dataset.panel)));
  newLayerButton.addEventListener("click", () => {
    if (state.tool === "pen") {
      showToast("Use the canvas to draw with the pen");
      return;
    }
    if (state.tool === "media") {
      openMediaImportModal();
      return;
    }
    dispatch({ type: "add", tool: state.tool, actor: user.name });
  });
  helpButton.addEventListener("click", helpModal);
  archiveButton.addEventListener("click", () => openModal("Archive Snapshot", `<p>${state.elements.length} live layers are on this host-based session.</p><p>If the host closes, the room disappears.</p>`));
  shareButton.addEventListener("click", shareModal);
  moreButton.addEventListener("click", () => topMenu.classList.toggle("is-hidden"));
  topMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-menu-action]");
    if (!b) return;
    topMenu.classList.add("is-hidden");
    if (b.dataset.menuAction === "theme") dispatch({ type: "glow", actor: user.name });
    if (b.dataset.menuAction === "shuffle") dispatch({ type: "shuffle", actor: user.name });
    if (b.dataset.menuAction === "clear") dispatch({ type: "clear", actor: user.name });
  });
  zoomButton.addEventListener("click", () => {
    const next = state.zoom >= 1.4 ? 0.8 : Number((state.zoom + 0.1).toFixed(2));
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
    state.pan = !state.pan;
    dock(panButton);
    showToast(state.pan ? "Pan enabled" : "Pan locked");
  });
  zoomRange.addEventListener("input", () => {
    applyZoom(Number(zoomRange.value) / 100);
    dock(zoomButton);
  });
  gridToggle.addEventListener("change", () => dispatch({ type: "grid", visible: gridToggle.checked, actor: user.name }));
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
    state.penWidth = Number(penWidthInput.value);
    penWidthValue.textContent = `${state.penWidth}px`;
  });
  setPenColor(state.penColor);
  penWidthValue.textContent = `${state.penWidth}px`;
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
  viewport.addEventListener("pointerdown", drawStart);
  viewport.addEventListener("pointermove", drawMove);
  viewport.addEventListener("pointerup", drawStop);
  viewport.addEventListener("pointercancel", drawStop);
  viewport.addEventListener("pointermove", localCursor);
  viewport.addEventListener("pointerleave", () => sendCursor(null));
}

function render() {
  setPanel("documents");
  setTool(state.tool, false);
  applyZoom(1);
  renderSettings();
  renderElements();
  renderHistory();
  renderLayers();
  renderPresence();
  renderRemote();
  updateBadge();
}

function seed() {
  return [
    { id: "seed-note", kind: "sticky", title: "Project Brainstorm", text: "Add ideas for the new ethereal workshop interface here...", x: 360, y: 220, rotation: 0, order: 1, seed: true },
    { id: "seed-circle", kind: "shape-circle", title: "Orbit Circle", x: 760, y: 180, order: 2, seed: true },
    { id: "seed-blob", kind: "shape-blob", title: "Glass Blob", x: 850, y: 310, order: 3, seed: true },
    { id: "seed-media", kind: "media", title: "Creative Reference #42", text: "Inspired by ethereal workshop concept", image: "../img/code2.png", x: 470, y: 560, rotation: 0, order: 4, seed: true },
    { id: "seed-type", kind: "text", title: "ETHEREAL WORKSPACE", x: 1010, y: 470, order: 5, seed: true },
    { id: "seed-sprint", kind: "sprint", title: "Design Sprint", text: "Due in 2 days", x: 1130, y: 170, order: 6, seed: true },
  ];
}

function dispatch(action, fromPeer = false) {
  if (state.mode === "client" && !fromPeer) return sendHost({ type: "action", action });
  apply(action);
  if (state.mode === "host") broadcastState();
}

function apply(a) {
  if (a.type === "add") {
    if (a.tool === "pen") return;
    state.count += 1;
    state.elements.push(makeItem(a.tool, state.count));
    log(`${a.actor} added ${state.elements[state.elements.length - 1].title}`);
    showToast(`${state.elements[state.elements.length - 1].title} created`);
  }
  if (a.type === "draw") {
    state.count += 1;
    state.elements.push(makeStroke(a.points, a.color, a.width));
    log(`${a.actor} drew a stroke`);
  }
  if (a.type === "add-media") {
    state.elements.push(a.item);
    log(`${a.actor} imported ${a.item.title}`);
    showToast(`${a.item.title} added`);
  }
  if (a.type === "front") {
    const el = find(a.id);
    if (el) el.order = a.order;
  }
  if (a.type === "move") {
    const el = find(a.id);
    if (el) {
      el.x = a.x;
      el.y = a.y;
      el.order = a.order;
      log(`${a.actor} moved ${el.title}`);
    }
  }
  if (a.type === "edit-text") {
    const el = find(a.id);
    if (el) {
      el[a.field] = a.value;
      log(`${a.actor} edited ${el.title || "text"}`);
      showToast("Text updated");
    }
  }
  if (a.type === "grid") {
    state.grid = a.visible;
    log(`${a.actor} ${a.visible ? "showed" : "hid"} the grid`);
  }
  if (a.type === "glow") {
    state.glow = !state.glow;
    log(`${a.actor} ${state.glow ? "enabled" : "disabled"} ambient glow`);
    showToast(state.glow ? "Ambient glow shared" : "Ambient glow reset");
  }
  if (a.type === "shuffle") {
    state.elements.slice().sort((l, r) => l.order - r.order).forEach((el, i) => {
      el.x = 260 + (i % 5) * 180;
      el.y = 180 + Math.floor(i / 5) * 170;
    });
    log(`${a.actor} shuffled the layout`);
    showToast("Layout shuffled");
  }
  if (a.type === "clear") {
    state.elements = state.elements.filter((e) => e.seed);
    log(`${a.actor} cleared generated items`);
    showToast("Generated items cleared");
  }
  renderSettings();
  renderElements();
  renderHistory();
  renderLayers();
}

function makeItem(tool, n) {
  const base = { id: `item-${crypto.randomUUID()}`, x: 320 + (n % 5) * 120, y: 240 + (n % 4) * 110, order: nextOrder(), seed: false };
  if (tool === "text") return { ...base, kind: "text", title: `HEADLINE ${n}` };
  if (tool === "shape") return { ...base, kind: n % 2 === 0 ? "shape-circle" : "shape-blob", title: n % 2 === 0 ? `Shape ${n} Circle` : `Shape ${n} Blob` };
  if (tool === "media") return { ...base, kind: "media", title: `Reference ${n}`, text: "Auto-added inspiration card", image: IMAGES[n % IMAGES.length], rotation: 0 };
  return { ...base, kind: "sticky", title: `Idea Note ${n}`, text: "Fresh note dropped onto the board. Drag it anywhere and keep building.", rotation: 0 };
}

function makeStroke(points, color, width) {
  return {
    id: `stroke-${crypto.randomUUID()}`,
    kind: "stroke",
    title: `Stroke ${state.count}`,
    points,
    color,
    width,
    order: nextOrder(),
    seed: false,
  };
}

function makeMediaItemFromFile(image, filename, dimensions) {
  state.count += 1;
  return {
    id: `item-${crypto.randomUUID()}`,
    kind: "media",
    title: stripFileExtension(filename) || `Reference ${state.count}`,
    text: "Imported from your device",
    importSource: "Your device",
    fileName: filename,
    fileType: filename.split(".").pop()?.toUpperCase() || "Image",
    image,
    width: dimensions.width,
    height: dimensions.height,
    x: 320 + (state.count % 5) * 120,
    y: 240 + (state.count % 4) * 110,
    order: nextOrder(),
    rotation: 0,
    seed: false,
  };
}

function renderElements() {
  const ids = new Set();
  state.elements.slice().sort((l, r) => l.order - r.order).forEach((el) => {
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
  cursorLayer.remove();
  stage.appendChild(cursorLayer);
}

function renderStrokes() {
  const ids = new Set();
  state.elements
    .filter((el) => el.kind === "stroke")
    .sort((l, r) => l.order - r.order)
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
  node.style.left = `${el.x}px`;
  node.style.top = `${el.y}px`;
  node.style.zIndex = String(el.order);
  node.style.transform = "";
  if (el.kind === "sticky") {
    node.classList.add("sticky-note");
    node.style.transform = `rotate(${el.rotation || 0}deg)`;
    node.innerHTML = `<div><h2 data-edit-field="title">${esc(el.title)}</h2><p data-edit-field="text">${esc(el.text)}</p></div><div class="pin-row"><span class="material-symbols-outlined">push_pin</span></div>`;
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
    if (Date.now() < suppressMediaOpenUntil) return;
    const el = find(node.dataset.id);
    if (!el || el.kind !== "media") return;
    if (e.target.closest("[data-edit-field]")) return;
    openMediaDrawer(el);
  });

  node.addEventListener("dblclick", (e) => {
    if (node.classList.contains("hero-type")) {
      const heroField = node.querySelector("[data-edit-field]") || node;
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit(heroField, node);
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
    if (state.tool === "pen") return;
    const source = e.target.nodeType === Node.TEXT_NODE ? e.target.parentElement : e.target;
    if (source?.closest('[data-edit-field][data-editing="true"]')) return;
    e.stopPropagation();
    const el = find(node.dataset.id);
    if (!el || e.target.closest("button")) return;
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
    };
    panState = null;
    viewport.classList.remove("is-panning");
    node.setPointerCapture(e.pointerId);
  });
  const stop = (e) => {
    e.stopPropagation();
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    if (dragState.moved) {
      dispatch({ type: "move", id: dragState.id, x: dragState.lx, y: dragState.ly, order: dragState.order, actor: user.name });
      suppressMediaOpenUntil = Date.now() + 180;
    }
    node.releasePointerCapture(e.pointerId);
    dragState = null;
  };
  node.addEventListener("pointermove", (e) => {
    e.stopPropagation();
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    const deltaX = (e.clientX - dragState.sx) / state.zoom;
    const deltaY = (e.clientY - dragState.sy) / state.zoom;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) return;
    if (!dragState.moved) {
      dragState.moved = true;
      dragState.order = nextOrder();
      dispatch({ type: "front", id: dragState.id, order: dragState.order, actor: user.name });
    }
    dragState.lx = dragState.ix + deltaX;
    dragState.ly = dragState.iy + deltaY;
    node.style.left = `${dragState.lx}px`;
    node.style.top = `${dragState.ly}px`;
    sendCursor({ x: dragState.lx, y: dragState.ly });
  });
  node.addEventListener("pointerup", stop);
  node.addEventListener("pointercancel", stop);
}

function panStart(e) {
  if (!state.pan || dragState || drawState || state.tool === "pen" || e.target.closest(".draggable") || e.target.closest("button")) return;
  panState = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
  viewport.classList.add("is-panning");
  viewport.setPointerCapture(e.pointerId);
}
function panMove(e) {
  if (!panState || dragState || drawState || panState.pid !== e.pointerId) return;
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
  if (state.mode === "solo") return;
  const r = stage.getBoundingClientRect();
  sendCursor({ x: (e.clientX - r.left) / state.zoom, y: (e.clientY - r.top) / state.zoom });
}

function drawStart(e) {
  if (state.tool !== "pen" || dragState || e.button !== 0 || e.target.closest(".draggable") || e.target.closest("button") || e.target.closest("input") || e.target.closest("label")) return;
  const point = pointerToStagePoint(e);
  drawState = {
    pid: e.pointerId,
    points: [point],
    preview: document.createElementNS("http://www.w3.org/2000/svg", "path"),
  };
  drawState.preview.classList.add("draw-path");
  drawState.preview.setAttribute("stroke", state.penColor);
  drawState.preview.setAttribute("stroke-width", String(state.penWidth));
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
  dispatch({ type: "draw", points, color: state.penColor, width: state.penWidth, actor: user.name });
  renderElements();
  showToast("Stroke added");
}

function startInlineEdit(target, owner) {
  if (dragState) return;
  const field = target.dataset.editField;
  const el = find(owner.dataset.id);
  if (!el) return;

  const current = String(el[field] || "");
  target.setAttribute("contenteditable", "true");
  target.setAttribute("data-editing", "true");
  queueMicrotask(() => {
    target.focus();
    placeCaretAtEnd(target);
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
    dispatch({
      type: "edit-text",
      id: el.id,
      field,
      value: next,
      actor: user.name,
    });
  };

  const onBlur = () => finish(true);
  const onKeyDown = (event) => {
    if (event.key === "Enter" && field !== "text" && !event.shiftKey) {
      event.preventDefault();
      finish(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  };

  target.addEventListener("blur", onBlur);
  target.addEventListener("keydown", onKeyDown);
}

function placeCaretAtEnd(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function renderSettings() {
  gridToggle.checked = state.grid;
  canvasGrid.classList.toggle("is-hidden", !state.grid);
  document.body.classList.toggle("alt-glow", state.glow);
}
function renderHistory() { historyList.innerHTML = state.history.slice(0, 8).map((x) => `<li>${esc(x)}</li>`).join(""); }
function renderLayers() { layerList.innerHTML = state.elements.slice().sort((l, r) => r.order - l.order).map((x) => `<li>${esc(x.title || "Stroke")}</li>`).join(""); }
function renderPresence() {
  const people = [user, ...Array.from(remote.values()).map((x) => x.user)];
  presenceList.innerHTML = people.map((u) => `<span class="presence-chip"><span class="presence-dot" style="background:${esc(u.color)}"></span><span>${esc(u.name)}</span></span>`).join("");
  updateBadge();
}
function renderRemote() {
  cursorLayer.innerHTML = Array.from(remote.values()).filter((x) => x.cursor).map((x) => `<div class="remote-cursor" style="left:${x.cursor.x}px; top:${x.cursor.y}px;"><div class="remote-cursor-dot" style="background:${esc(x.user.color)}"></div><div class="remote-cursor-label" style="background:${esc(x.user.color)}">${esc(x.user.name)}</div></div>`).join("");
}

function updateBadge() {
  liveBadge.textContent = "Local Only";
  roomSummary.textContent = "Local-only mode. Use Share to open the public live version for cross-device collaboration.";
}

function setTool(tool, toastIt) {
  state.tool = tool;
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
function setPenColor(color) {
  state.penColor = normalizeHex(color) || state.penColor;
  syncPenSwatches(state.penColor);
  syncPenColorInputs(state.penColor);
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
    penHexInput.value = state.penColor.toUpperCase();
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
  state.zoom = v;
  stage.style.transform = `scale(${v})`;
  stage.style.width = `${STAGE_W * v}px`;
  stage.style.height = `${STAGE_H * v}px`;
}
function center(smooth) {
  viewport.scrollTo({ left: Math.max(0, (stage.scrollWidth - viewport.clientWidth) / 2 - 240), top: Math.max(0, (stage.scrollHeight - viewport.clientHeight) / 2 - 180), behavior: smooth ? "smooth" : "auto" });
  dock(fitButton);
}
function dock(btn) { [zoomButton, fitButton, panButton].forEach((b) => b.classList.toggle("is-active", b === btn)); }
function find(id) { return state.elements.find((x) => x.id === id); }
function nextOrder() { state.order += 1; return state.order; }
function log(msg) { state.history.unshift(msg); state.history = state.history.slice(0, 20); }
function openModal(title, body) { modalTitle.textContent = title; modalBody.innerHTML = body; modal.classList.remove("is-hidden"); }
function closeModal() { modal.classList.add("is-hidden"); }
function showToast(msg) { toast.textContent = msg; toast.classList.remove("is-hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add("is-hidden"), 2200); }

function helpModal() {
  openModal("Offline Mode", `<p>This page is the local-only freeform canvas.</p><p>Your edits work on this device while the page is open, but they do not sync to other devices.</p><p>Use Share to switch to the public live version if you want collaboration.</p>`);
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
      <p class="media-import-meta">Supports common image formats like PNG, JPG, GIF, and WebP.</p>
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

async function importMediaFiles(fileList) {
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
      dispatch({ type: "add-media", item, actor: user.name });
    } catch {
      showToast(`Couldn't import ${file.name}`);
    }
  }

  closeModal();
}

function shareModal() {
  const liveUrl = new URL("./live.html", window.location.href);
  liveUrl.searchParams.set("room", state.roomId);
  openModal("Share Options", `<p>This page is local-only.</p><div class="connection-tools"><button class="menu-item" id="openLiveModeButton" type="button"><span class="material-symbols-outlined">hub</span><span>Open public live mode</span></button><button class="menu-item" id="copyLiveModeButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy live link</span></button></div><div class="connection-panel"><p class="connection-status">Public live mode uses a shared sync service and is the version meant for multi-device collaboration.</p></div>`);
  $("#openLiveModeButton")?.addEventListener("click", () => {
    window.location.href = liveUrl.toString();
  });
  $("#copyLiveModeButton")?.addEventListener("click", () => copyText(liveUrl.toString(), "Live link copied"));
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

function hostPanel() {
  state.mode = "host";
  renderPresence();
  $("#connectionPanel").innerHTML = `<p>Create one invite per joining laptop.</p><button class="menu-item" id="createInviteButton" type="button"><span class="material-symbols-outlined">add_link</span><span>Create invite</span></button><label class="connection-label" for="hostAnswerInput">Paste the joiner response here</label><textarea class="connection-textarea" id="hostAnswerInput" placeholder="Joiner response"></textarea><button class="menu-item" id="acceptAnswerButton" type="button"><span class="material-symbols-outlined">done_all</span><span>Accept response</span></button><div id="hostInviteOutput"></div>`;
  $("#createInviteButton")?.addEventListener("click", async () => {
    const invite = await createInvite();
    $("#hostInviteOutput").innerHTML = `<label class="connection-label">Send this invite to one laptop</label><textarea class="connection-textarea">${invite}</textarea><button class="menu-item" id="copyHostInviteButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy invite</span></button>`;
    $("#copyHostInviteButton")?.addEventListener("click", () => copyText(invite, "Invite copied"));
  });
  $("#acceptAnswerButton")?.addEventListener("click", () => acceptAnswer($("#hostAnswerInput").value.trim()));
}

function joinPanel() {
  $("#connectionPanel").innerHTML = `<label class="connection-label" for="joinInviteInput">Paste the host invite</label><textarea class="connection-textarea" id="joinInviteInput" placeholder="Host invite"></textarea><button class="menu-item" id="createJoinResponseButton" type="button"><span class="material-symbols-outlined">outbound</span><span>Create response</span></button><div id="joinResponseOutput"></div>`;
  $("#createJoinResponseButton")?.addEventListener("click", async () => {
    const output = $("#joinResponseOutput");
    const invite = $("#joinInviteInput").value.trim();
    if (!invite) {
      if (output) output.innerHTML = `<p class="connection-status is-error">Paste a host invite first.</p>`;
      showToast("Paste an invite first");
      return;
    }

    if (output) output.innerHTML = `<p class="connection-status">Creating response...</p>`;

    try {
      const response = await joinFromInvite(invite);
      if (!output) return;
      output.innerHTML = `<p class="connection-status is-success">Response created. Copy this back to the host laptop.</p><label class="connection-label">Paste this back into the host laptop</label><textarea class="connection-textarea">${response}</textarea><button class="menu-item" id="copyJoinResponseButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy response</span></button>`;
      $("#copyJoinResponseButton")?.addEventListener("click", () => copyText(response, "Response copied"));
      showToast("Response created");
    } catch (error) {
      if (output) output.innerHTML = `<p class="connection-status is-error">${esc(error?.message || "Could not create a response from that invite.")}</p>`;
      showToast("Response failed");
    }
  });
}

async function createInvite() {
  const id = crypto.randomUUID();
  const pc = mkPeer(id);
  const ch = pc.createDataChannel("freeform");
  pending.set(id, { pc, ch });
  bindChannel(id, ch);
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  return enc({ id, room: state.roomId, desc: pc.localDescription, user });
}

async function acceptAnswer(text) {
  let data;
  try {
    data = dec(text);
  } catch {
    showToast("Invalid response");
    return;
  }
  const x = pending.get(data.id);
  if (!x) return showToast("Invite not found");
  await x.pc.setRemoteDescription(new RTCSessionDescription(data.desc));
  peers.set(data.id, x);
  pending.delete(data.id);
  send(x.ch, { type: "state", state: snap() });
  send(x.ch, { type: "hello", user });
  showToast("Joiner connected");
}

async function joinFromInvite(text) {
  let data;
  try {
    data = dec(text);
  } catch {
    throw new Error("That invite text is invalid.");
  }
  const pc = mkPeer(data.id);
  pc.addEventListener("datachannel", (e) => { peers.set(data.id, { pc, ch: e.channel }); bindChannel(data.id, e.channel); });
  await pc.setRemoteDescription(new RTCSessionDescription(data.desc));
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc, 8000);
  state.mode = "client";
  renderPresence();
  return enc({ id: data.id, room: data.room, desc: pc.localDescription, user });
}

function mkPeer(id) {
  const pc = new RTCPeerConnection(ICE);
  pc.addEventListener("connectionstatechange", () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      peers.delete(id);
      remote.delete(id);
      renderPresence();
      renderRemote();
    }
  });
  return pc;
}

function bindChannel(id, ch) {
  ch.addEventListener("open", () => {
    send(ch, { type: "hello", user });
    if (state.mode === "host") send(ch, { type: "state", state: snap() });
    showToast("Peer connected");
  });
  ch.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "hello") {
      remote.set(id, { user: m.user, cursor: null });
      renderPresence();
      renderRemote();
      if (state.mode === "host") {
        peers.forEach((p, pid) => {
          if (pid !== id) send(p.ch, { type: "presence", user: m.user, cursor: null });
        });
        send(ch, { type: "presence", user, cursor: null });
        remote.forEach((entry, rid) => {
          if (rid !== id) send(ch, { type: "presence", user: entry.user, cursor: entry.cursor || null });
        });
      }
    }
    if (m.type === "presence") { remote.set(id, { user: m.user, cursor: m.cursor || null }); renderPresence(); renderRemote(); if (state.mode === "host") relay(id, m); }
    if (m.type === "cursor") { const x = remote.get(id); if (x) { x.cursor = m.cursor; renderRemote(); if (state.mode === "host") relay(id, { type: "presence", user: x.user, cursor: m.cursor }); } }
    if (m.type === "action" && state.mode === "host") dispatch(m.action, true);
    if (m.type === "state" && state.mode === "client") { load(m.state); renderPresence(); }
  });
}

function relay(skip, msg) { peers.forEach((p, id) => { if (id !== skip) send(p.ch, msg); }); }
function sendHost(msg) { const p = peers.values().next().value; if (p) send(p.ch, msg); }
function send(ch, msg) { if (ch.readyState === "open") ch.send(JSON.stringify(msg)); }
function broadcastState() { peers.forEach((p) => send(p.ch, { type: "state", state: snap() })); }
function sendCursor(cursor) {
  if (state.mode === "solo") return;
  if (state.mode === "host") peers.forEach((p) => send(p.ch, { type: "presence", user, cursor }));
  else sendHost({ type: "cursor", cursor });
}
function snap() { return JSON.parse(JSON.stringify({ tool: state.tool, glow: state.glow, grid: state.grid, count: state.count, order: state.order, history: state.history, elements: state.elements })); }
function load(s) { state.tool = s.tool; state.glow = s.glow; state.grid = s.grid; state.count = s.count; state.order = s.order; state.history = s.history; state.elements = s.elements; setTool(state.tool, false); renderSettings(); renderElements(); renderHistory(); renderLayers(); }
function waitIce(pc, timeoutMs = 8000) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

function loadUser() {
  const key = "never-wet-freeform-user";
  try { const old = JSON.parse(localStorage.getItem(key)); if (old) return old; } catch {}
  const u = { name: `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${Math.floor(Math.random() * 90 + 10)}`, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  localStorage.setItem(key, JSON.stringify(u));
  return u;
}
function ensureRoomId() {
  const u = new URL(location.href);
  let id = u.searchParams.get("room");
  if (!id) { id = (crypto.randomUUID?.() || `room-${Date.now()}`).slice(0, 8); u.searchParams.set("room", id); history.replaceState({}, "", u); }
  return id;
}
function enc(x) { return btoa(unescape(encodeURIComponent(JSON.stringify(x)))); }
function dec(x) { return JSON.parse(decodeURIComponent(escape(atob(x)))); }
async function copyText(v, ok) { try { await navigator.clipboard.writeText(v); showToast(ok); } catch { showToast("Copy failed"); } }
function esc(v) { return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
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
  return { x: (e.clientX - rect.left) / state.zoom, y: (e.clientY - rect.top) / state.zoom };
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
