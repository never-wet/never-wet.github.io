import * as Y from "https://esm.sh/yjs@13.6.27";
import { WebsocketProvider } from "https://esm.sh/y-websocket@2.1.0?bundle";

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const viewport = $("#canvasViewport");
const stage = $("#canvasStage");
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

const WS_URL = "wss://demos.yjs.dev/ws";
const ROOM_PREFIX = "never-wet-freeform";
const STAGE_W = 2200;
const STAGE_H = 1800;
const IMAGES = ["../img/code2.png", "../img/code.jpg", "../img/background.jpeg", "../img/cat.jpg"];
const COLORS = ["#005bc1", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8"];
const NAMES = ["Aurora", "Juniper", "Marin", "Sol", "Mika", "Nova", "Ari", "Jules"];

const roomId = ensureRoomId();
const user = loadUser();
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(WS_URL, `${ROOM_PREFIX}-${roomId}`, ydoc);
const awareness = provider.awareness;
const yElements = ydoc.getMap("elements");
const yHistory = ydoc.getArray("history");
const ySettings = ydoc.getMap("settings");
const yMeta = ydoc.getMap("meta");
const nodes = new Map();

let toastTimer = null;
let zoom = 1;
let panEnabled = true;
let panState = null;
let dragState = null;
let localCount = 0;
let currentTool = "sticky";

awareness.setLocalStateField("user", user);
awareness.setLocalStateField("cursor", null);

seedIfNeeded();
setup();
renderAll();
window.addEventListener("load", () => center(false));

provider.on("status", (event) => {
  if (event.status === "connected") {
    showToast("Live room connected");
  }
  updatePresence();
});

yElements.observeDeep(() => {
  renderElements();
  renderLayers();
});
yHistory.observe(() => renderHistory());
ySettings.observe(() => renderSettings());
awareness.on("change", () => {
  updatePresence();
  renderRemote();
});

function setup() {
  toolButtons.forEach((b) => b.addEventListener("click", () => {
    setTool(b.dataset.tool, true);
    addItem(b.dataset.tool);
  }));
  navButtons.forEach((b) => b.addEventListener("click", () => setPanel(b.dataset.panel)));
  newLayerButton.addEventListener("click", () => addItem(currentTool));
  helpButton.addEventListener("click", () => openModal("Public Live Mode", `<p>This page uses a shared websocket sync service.</p><p>Anyone opening the same live link joins the same room and should see updates across devices.</p><p>If this public live mode misbehaves, you can switch back to the local-only version.</p>`));
  archiveButton.addEventListener("click", () => openModal("Archive Snapshot", `<p>${yElements.size} shared layers are currently in room <strong>${roomId}</strong>.</p><p>This public room is meant for live collaboration, not private persistence.</p>`));
  shareButton.addEventListener("click", shareModal);
  moreButton.addEventListener("click", () => topMenu.classList.toggle("is-hidden"));
  topMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-menu-action]");
    if (!b) return;
    topMenu.classList.add("is-hidden");
    if (b.dataset.menuAction === "theme") {
      ySettings.set("glow", !(ySettings.get("glow") === true));
      pushHistory(`${user.name} toggled ambient glow`);
    }
    if (b.dataset.menuAction === "shuffle") {
      const items = sortedElements();
      ydoc.transact(() => {
        items.forEach((item, i) => updateFields(item.id, { x: 260 + (i % 5) * 180, y: 180 + Math.floor(i / 5) * 170 }));
      });
      pushHistory(`${user.name} shuffled the layout`);
      showToast("Layout shuffled");
    }
    if (b.dataset.menuAction === "clear") {
      ydoc.transact(() => {
        Array.from(yElements.keys()).forEach((id) => {
          const item = yElements.get(id);
          if (item?.get("seed") !== true) yElements.delete(id);
        });
      });
      pushHistory(`${user.name} cleared generated items`);
      showToast("Generated items cleared");
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
    ySettings.set("grid", gridToggle.checked);
    pushHistory(`${user.name} ${gridToggle.checked ? "showed" : "hid"} the grid`);
  });
  closeModalButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#moreButton") && !e.target.closest("#topMenu")) topMenu.classList.add("is-hidden");
  });
  viewport.addEventListener("pointerdown", panStart);
  viewport.addEventListener("pointermove", panMove);
  viewport.addEventListener("pointerup", panStop);
  viewport.addEventListener("pointercancel", panStop);
  viewport.addEventListener("pointermove", localCursor);
  viewport.addEventListener("pointerleave", () => awareness.setLocalStateField("cursor", null));
}

function seedIfNeeded() {
  if (yMeta.get("seedVersion") === "v1") return;
  ydoc.transact(() => {
    yMeta.set("seedVersion", "v1");
    yMeta.set("nextOrder", 6);
    ySettings.set("grid", true);
    ySettings.set("glow", false);
    putItem({ id: "seed-note", kind: "sticky", title: "Project Brainstorm", text: "Add ideas for the new ethereal workshop interface here...", x: 360, y: 220, rotation: -2, order: 1, seed: true });
    putItem({ id: "seed-circle", kind: "shape-circle", title: "Orbit Circle", x: 760, y: 180, order: 2, seed: true });
    putItem({ id: "seed-blob", kind: "shape-blob", title: "Glass Blob", x: 850, y: 310, order: 3, seed: true });
    putItem({ id: "seed-media", kind: "media", title: "Creative Reference #42", text: "Inspired by ethereal workshop concept", image: "../img/code2.png", x: 470, y: 560, rotation: 3, order: 4, seed: true });
    putItem({ id: "seed-type", kind: "text", title: "ETHEREAL WORKSPACE", x: 1010, y: 470, order: 5, seed: true });
    putItem({ id: "seed-sprint", kind: "sprint", title: "Design Sprint", text: "Due in 2 days", x: 1130, y: 170, order: 6, seed: true });
    yHistory.insert(0, [{ text: "Canvas ready" }]);
  });
}

function renderAll() {
  setPanel("documents");
  setTool(currentTool, false);
  applyZoom(1);
  renderSettings();
  renderElements();
  renderHistory();
  renderLayers();
  updatePresence();
  renderRemote();
}

function addItem(tool) {
  localCount += 1;
  const id = `item-${crypto.randomUUID()}`;
  const base = { id, x: 320 + (localCount % 5) * 120, y: 240 + (localCount % 4) * 110, order: nextOrder(), seed: false };
  let item;
  if (tool === "text") item = { ...base, kind: "text", title: `HEADLINE ${localCount}` };
  else if (tool === "shape") item = { ...base, kind: localCount % 2 === 0 ? "shape-circle" : "shape-blob", title: localCount % 2 === 0 ? `Shape ${localCount} Circle` : `Shape ${localCount} Blob` };
  else if (tool === "media") item = { ...base, kind: "media", title: `Reference ${localCount}`, text: "Auto-added inspiration card", image: IMAGES[localCount % IMAGES.length], rotation: 3 };
  else if (tool === "pen") item = { ...base, kind: "sticky", title: `Sketch Layer ${localCount}`, text: "Quick sketch stroke converted into a note card for this prototype.", rotation: -1 };
  else item = { ...base, kind: "sticky", title: `Idea Note ${localCount}`, text: "Fresh note dropped onto the board. Drag it anywhere and keep building.", rotation: -2 };
  putItem(item);
  pushHistory(`${user.name} added ${item.title}`);
  showToast(`${item.title} created`);
}

function sortedElements() {
  return Array.from(yElements.entries())
    .map(([id, map]) => ({ id, ...map.toJSON() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function renderElements() {
  const ids = new Set();
  sortedElements().forEach((el) => {
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
  cursorLayer.remove();
  stage.appendChild(cursorLayer);
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
    node.style.transform = `rotate(${el.rotation || -2}deg)`;
    node.innerHTML = `<div><h2 data-edit-field="title">${esc(el.title)}</h2><p data-edit-field="text">${esc(el.text)}</p></div><div class="pin-row"><span class="material-symbols-outlined">push_pin</span></div>`;
    return;
  }
  if (el.kind === "shape-circle") { node.classList.add("shape-circle"); node.innerHTML = ""; return; }
  if (el.kind === "shape-blob") { node.classList.add("shape-blob"); node.style.transform = "rotate(15deg)"; node.innerHTML = ""; return; }
  if (el.kind === "media") {
    node.classList.add("media-card");
    node.style.transform = `rotate(${el.rotation || 3}deg)`;
    node.innerHTML = `<div class="media-frame"><img src="${esc(el.image)}" alt="${esc(el.title)}" /><div class="media-overlay"><span class="material-symbols-outlined">zoom_in</span></div></div><div class="media-copy"><h3 data-edit-field="title">${esc(el.title)}</h3><p data-edit-field="text">${esc(el.text)}</p></div>`;
    return;
  }
  if (el.kind === "text") { node.classList.add("hero-type"); node.innerHTML = `<span data-edit-field="title">${esc(el.title)}</span>`; return; }
  node.classList.add("sprint-card");
  node.innerHTML = `<div class="sprint-head"><div class="spark-badge"><span class="material-symbols-outlined">auto_awesome</span></div><span class="status-pill">Active</span></div><h3 data-edit-field="title">${esc(el.title)}</h3><div class="team-stack" aria-hidden="true"><span></span><span></span><span></span><span class="team-more">+5</span></div><div class="sprint-meta"><span data-edit-field="text">${esc(el.text)}</span><span class="material-symbols-outlined">arrow_forward_ios</span></div>`;
}

function bindDrag(node) {
  node.addEventListener("dblclick", (e) => {
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
    const source = e.target.nodeType === Node.TEXT_NODE ? e.target.parentElement : e.target;
    if (source?.closest('[data-edit-field][data-editing="true"]')) return;
    e.stopPropagation();
    const el = getItem(node.dataset.id);
    if (!el || e.target.closest("button")) return;
    dragState = { id: el.id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ix: el.x, iy: el.y, lx: el.x, ly: el.y, order: el.order, moved: false };
    panState = null;
    viewport.classList.remove("is-panning");
    node.setPointerCapture(e.pointerId);
  });

  const stop = (e) => {
    e.stopPropagation();
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    if (dragState.moved) {
      updateFields(dragState.id, { x: dragState.lx, y: dragState.ly, order: dragState.order });
      pushHistory(`${user.name} moved ${getItem(dragState.id)?.title || "an item"}`);
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
      updateFields(dragState.id, { order: dragState.order });
    }
    dragState.lx = dragState.ix + deltaX;
    dragState.ly = dragState.iy + deltaY;
    node.style.left = `${dragState.lx}px`;
    node.style.top = `${dragState.ly}px`;
    awareness.setLocalStateField("cursor", { x: dragState.lx, y: dragState.ly });
  });
  node.addEventListener("pointerup", stop);
  node.addEventListener("pointercancel", stop);
}

function startInlineEdit(target, owner) {
  if (dragState) return;
  const field = target.dataset.editField;
  const el = getItem(owner.dataset.id);
  if (!el) return;
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
    updateFields(el.id, { [field]: next });
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
  if (!panEnabled || dragState || e.target.closest(".draggable") || e.target.closest("button")) return;
  panState = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
  viewport.classList.add("is-panning");
  viewport.setPointerCapture(e.pointerId);
}
function panMove(e) {
  if (!panState || dragState || panState.pid !== e.pointerId) return;
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
  awareness.setLocalStateField("cursor", { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom });
}

function renderSettings() {
  const grid = ySettings.get("grid") !== false;
  const glow = ySettings.get("glow") === true;
  gridToggle.checked = grid;
  canvasGrid.classList.toggle("is-hidden", !grid);
  document.body.classList.toggle("alt-glow", glow);
}
function renderHistory() { historyList.innerHTML = yHistory.toArray().slice(0, 8).map((x) => `<li>${esc(x.text || "")}</li>`).join(""); }
function renderLayers() { layerList.innerHTML = sortedElements().slice().reverse().map((x) => `<li>${esc(x.title || "Canvas item")}</li>`).join(""); }

function updatePresence() {
  const states = Array.from(awareness.getStates().values()).filter((x) => x?.user);
  presenceList.innerHTML = states.map((entry) => `<span class="presence-chip"><span class="presence-dot" style="background:${esc(entry.user.color)}"></span><span>${esc(entry.user.name)}</span></span>`).join("");
  liveBadge.textContent = `${states.length} live`;
  roomSummary.textContent = `Public live room ${roomId}. Open the same link on other devices to collaborate.`;
}

function renderRemote() {
  cursorLayer.innerHTML = Array.from(awareness.getStates().entries())
    .filter(([id, entry]) => id !== ydoc.clientID && entry?.user && entry?.cursor)
    .map(([, entry]) => `<div class="remote-cursor" style="left:${entry.cursor.x}px; top:${entry.cursor.y}px;"><div class="remote-cursor-dot" style="background:${esc(entry.user.color)}"></div><div class="remote-cursor-label" style="background:${esc(entry.user.color)}">${esc(entry.user.name)}</div></div>`)
    .join("");
}

function setTool(tool, toastIt) {
  currentTool = tool;
  toolButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.tool === tool));
  if (toastIt) showToast(`${tool[0].toUpperCase()}${tool.slice(1)} tool selected`);
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
function dock(btn) { [zoomButton, fitButton, panButton].forEach((b) => b.classList.toggle("is-active", b === btn)); }

function shareModal() {
  const liveUrl = new URL(window.location.href);
  openModal("Share Live Room", `<p>Anyone opening this link joins the same public live room.</p><div class="connection-tools"><button class="menu-item" id="copyLiveLinkButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy live link</span></button><button class="menu-item" id="openLocalModeButton" type="button"><span class="material-symbols-outlined">desktop_windows</span><span>Switch to local-only mode</span></button></div><div class="connection-panel"><p class="connection-status">${esc(liveUrl.toString())}</p></div>`);
  $("#copyLiveLinkButton")?.addEventListener("click", () => copyText(liveUrl.toString(), "Live link copied"));
  $("#openLocalModeButton")?.addEventListener("click", () => {
    const localUrl = new URL("./index.html", window.location.href);
    localUrl.searchParams.set("room", roomId);
    window.location.href = localUrl.toString();
  });
}

function openModal(title, body) { modalTitle.textContent = title; modalBody.innerHTML = body; modal.classList.remove("is-hidden"); }
function closeModal() { modal.classList.add("is-hidden"); }
function showToast(msg) { toast.textContent = msg; toast.classList.remove("is-hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add("is-hidden"), 2200); }

function putItem(item) {
  let map = yElements.get(item.id);
  if (!map) {
    map = new Y.Map();
    yElements.set(item.id, map);
  }
  Object.entries(item).forEach(([k, v]) => map.set(k, v));
}
function updateFields(id, fields) {
  const map = yElements.get(id);
  if (!map) return;
  Object.entries(fields).forEach(([k, v]) => map.set(k, v));
}
function getItem(id) {
  const map = yElements.get(id);
  return map ? { id, ...map.toJSON() } : null;
}
function nextOrder() {
  const next = Number(yMeta.get("nextOrder") || 0) + 1;
  yMeta.set("nextOrder", next);
  return next;
}
function pushHistory(text) {
  yHistory.insert(0, [{ text }]);
  if (yHistory.length > 20) yHistory.delete(20, yHistory.length - 20);
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
async function copyText(v, ok) { try { await navigator.clipboard.writeText(v); showToast(ok); } catch { showToast("Copy failed"); } }
function esc(v) { return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
