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
};

let toastTimer = null;
let panState = null;
let dragState = null;

setup();
render();
window.addEventListener("load", () => center(false));

function setup() {
  toolButtons.forEach((b) => b.addEventListener("click", () => {
    setTool(b.dataset.tool, true);
    dispatch({ type: "add", tool: b.dataset.tool, actor: user.name });
  }));
  navButtons.forEach((b) => b.addEventListener("click", () => setPanel(b.dataset.panel)));
  newLayerButton.addEventListener("click", () => dispatch({ type: "add", tool: state.tool, actor: user.name }));
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
    { id: "seed-note", kind: "sticky", title: "Project Brainstorm", text: "Add ideas for the new ethereal workshop interface here...", x: 360, y: 220, rotation: -2, order: 1, seed: true },
    { id: "seed-circle", kind: "shape-circle", title: "Orbit Circle", x: 760, y: 180, order: 2, seed: true },
    { id: "seed-blob", kind: "shape-blob", title: "Glass Blob", x: 850, y: 310, order: 3, seed: true },
    { id: "seed-media", kind: "media", title: "Creative Reference #42", text: "Inspired by ethereal workshop concept", image: "../img/code2.png", x: 470, y: 560, rotation: 3, order: 4, seed: true },
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
    state.count += 1;
    state.elements.push(makeItem(a.tool, state.count));
    log(`${a.actor} added ${state.elements[state.elements.length - 1].title}`);
    showToast(`${state.elements[state.elements.length - 1].title} created`);
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
  if (tool === "media") return { ...base, kind: "media", title: `Reference ${n}`, text: "Auto-added inspiration card", image: IMAGES[n % IMAGES.length], rotation: 3 };
  if (tool === "pen") return { ...base, kind: "sticky", title: `Sketch Layer ${n}`, text: "Quick sketch stroke converted into a note card for this prototype.", rotation: -1 };
  return { ...base, kind: "sticky", title: `Idea Note ${n}`, text: "Fresh note dropped onto the board. Drag it anywhere and keep building.", rotation: -2 };
}

function renderElements() {
  const ids = new Set();
  state.elements.slice().sort((l, r) => l.order - r.order).forEach((el) => {
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
    node.innerHTML = `<div><h2>${esc(el.title)}</h2><p>${esc(el.text)}</p></div><div class="pin-row"><span class="material-symbols-outlined">push_pin</span></div>`;
    return;
  }
  if (el.kind === "shape-circle") { node.classList.add("shape-circle"); node.innerHTML = ""; return; }
  if (el.kind === "shape-blob") { node.classList.add("shape-blob"); node.style.transform = "rotate(15deg)"; node.innerHTML = ""; return; }
  if (el.kind === "media") {
    node.classList.add("media-card");
    node.style.transform = `rotate(${el.rotation || 3}deg)`;
    node.innerHTML = `<div class="media-frame"><img src="${esc(el.image)}" alt="${esc(el.title)}" /><div class="media-overlay"><span class="material-symbols-outlined">zoom_in</span></div></div><div class="media-copy"><h3>${esc(el.title)}</h3><p>${esc(el.text)}</p></div>`;
    return;
  }
  if (el.kind === "text") { node.classList.add("hero-type"); node.textContent = el.title; return; }
  node.classList.add("sprint-card");
  node.innerHTML = `<div class="sprint-head"><div class="spark-badge"><span class="material-symbols-outlined">auto_awesome</span></div><span class="status-pill">Active</span></div><h3>${esc(el.title)}</h3><div class="team-stack" aria-hidden="true"><span></span><span></span><span></span><span class="team-more">+5</span></div><div class="sprint-meta"><span>${esc(el.text)}</span><span class="material-symbols-outlined">arrow_forward_ios</span></div>`;
}

function bindDrag(node) {
  node.addEventListener("pointerdown", (e) => {
    const el = find(node.dataset.id);
    if (!el || e.target.closest("button")) return;
    const front = nextOrder();
    dispatch({ type: "front", id: el.id, order: front, actor: user.name });
    dragState = { id: el.id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ix: el.x, iy: el.y, lx: el.x, ly: el.y, order: front };
    node.setPointerCapture(e.pointerId);
  });
  const stop = (e) => {
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    dispatch({ type: "move", id: dragState.id, x: dragState.lx, y: dragState.ly, order: dragState.order, actor: user.name });
    node.releasePointerCapture(e.pointerId);
    dragState = null;
  };
  node.addEventListener("pointermove", (e) => {
    if (!dragState || dragState.pid !== e.pointerId || dragState.id !== node.dataset.id) return;
    dragState.lx = dragState.ix + (e.clientX - dragState.sx) / state.zoom;
    dragState.ly = dragState.iy + (e.clientY - dragState.sy) / state.zoom;
    node.style.left = `${dragState.lx}px`;
    node.style.top = `${dragState.ly}px`;
    sendCursor({ x: dragState.lx, y: dragState.ly });
  });
  node.addEventListener("pointerup", stop);
  node.addEventListener("pointercancel", stop);
}

function panStart(e) {
  if (!state.pan || e.target.closest(".draggable") || e.target.closest("button")) return;
  panState = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
  viewport.classList.add("is-panning");
  viewport.setPointerCapture(e.pointerId);
}
function panMove(e) {
  if (!panState || panState.pid !== e.pointerId) return;
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

function renderSettings() {
  gridToggle.checked = state.grid;
  canvasGrid.classList.toggle("is-hidden", !state.grid);
  document.body.classList.toggle("alt-glow", state.glow);
}
function renderHistory() { historyList.innerHTML = state.history.slice(0, 8).map((x) => `<li>${esc(x)}</li>`).join(""); }
function renderLayers() { layerList.innerHTML = state.elements.slice().sort((l, r) => r.order - l.order).map((x) => `<li>${esc(x.title)}</li>`).join(""); }
function renderPresence() {
  const people = [user, ...Array.from(remote.values()).map((x) => x.user)];
  presenceList.innerHTML = people.map((u) => `<span class="presence-chip"><span class="presence-dot" style="background:${esc(u.color)}"></span><span>${esc(u.name)}</span></span>`).join("");
  updateBadge();
}
function renderRemote() {
  cursorLayer.innerHTML = Array.from(remote.values()).filter((x) => x.cursor).map((x) => `<div class="remote-cursor" style="left:${x.cursor.x}px; top:${x.cursor.y}px;"><div class="remote-cursor-dot" style="background:${esc(x.user.color)}"></div><div class="remote-cursor-label" style="background:${esc(x.user.color)}">${esc(x.user.name)}</div></div>`).join("");
}

function updateBadge() {
  const n = 1 + remote.size;
  const mode = state.mode === "host" ? "host" : state.mode === "client" ? "joined" : "solo";
  liveBadge.textContent = `${n} live ${mode}`;
  roomSummary.textContent = state.mode === "host"
    ? "This laptop is the host. Keep it open while others use the room."
    : state.mode === "client"
      ? "This laptop is joined to a host. If the host closes, the room ends."
      : "Solo mode. Use Share to host or join a live room.";
}

function setTool(tool, toastIt) {
  state.tool = tool;
  toolButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.tool === tool));
  if (toastIt) showToast(`${tool[0].toUpperCase()}${tool.slice(1)} tool selected`);
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
  openModal("Host And Join", `<p>This version does not use a sync server.</p><p>One laptop hosts the room. Each joining laptop needs a one-time invite/response handshake. The host must stay open, and when it closes, the session disappears.</p>`);
}

function shareModal() {
  openModal("Share Or Join", `<p>Without a server, browsers need a manual handshake. One laptop hosts, the others join.</p><div class="connection-tools"><button class="menu-item" id="hostRoomButton" type="button"><span class="material-symbols-outlined">lan</span><span>Host on this laptop</span></button><button class="menu-item" id="joinRoomButton" type="button"><span class="material-symbols-outlined">link</span><span>Join another laptop</span></button></div><div class="connection-panel" id="connectionPanel"></div>`);
  $("#hostRoomButton")?.addEventListener("click", hostPanel);
  $("#joinRoomButton")?.addEventListener("click", joinPanel);
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
    const response = await joinFromInvite($("#joinInviteInput").value.trim());
    $("#joinResponseOutput").innerHTML = `<label class="connection-label">Paste this back into the host laptop</label><textarea class="connection-textarea">${response}</textarea><button class="menu-item" id="copyJoinResponseButton" type="button"><span class="material-symbols-outlined">content_copy</span><span>Copy response</span></button>`;
    $("#copyJoinResponseButton")?.addEventListener("click", () => copyText(response, "Response copied"));
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
  const data = dec(text);
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
  const data = dec(text);
  const pc = mkPeer(data.id);
  pc.addEventListener("datachannel", (e) => { peers.set(data.id, { pc, ch: e.channel }); bindChannel(data.id, e.channel); });
  await pc.setRemoteDescription(new RTCSessionDescription(data.desc));
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc);
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
function waitIce(pc) { if (pc.iceGatheringState === "complete") return Promise.resolve(); return new Promise((r) => { const h = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", h); r(); } }; pc.addEventListener("icegatheringstatechange", h); }); }

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
