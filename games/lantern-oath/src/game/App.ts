import { AudioManager } from "../engine/AudioManager";
import { GameSession, type PauseTab, type UiState } from "../engine/GameSession";
import { InputManager } from "../engine/InputManager";
import { Renderer } from "../engine/Renderer";
import { SaveManager } from "../engine/SaveManager";
import { gameManifest } from "../memory/gameManifest";
import { PixelFactory } from "../lib/assets/pixelFactory";

function formatDuration(milliseconds?: number): string {
  const totalSeconds = Math.floor((milliseconds ?? 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export class App {
  private readonly input = new InputManager();
  private readonly saveManager = new SaveManager();
  private readonly audioManager = new AudioManager(this.saveManager.loadSettings());
  private readonly pixels = new PixelFactory();
  private readonly canvas = document.createElement("canvas");
  private readonly root = document.createElement("div");
  private readonly renderer = new Renderer(this.canvas);
  private readonly lastLayerHtml = new Map<HTMLElement, string>();
  private session: GameSession | null = null;
  private lastFrame = performance.now();
  private audioUnlocked = false;

  constructor(private readonly mountNode: HTMLElement) {
    this.root.className = "lo-app";
    this.mountNode.appendChild(this.root);
    this.buildShell();
    this.attachEvents();
    this.renderTitle();
    requestAnimationFrame(this.loop);
  }

  private buildShell(): void {
    this.root.innerHTML = `
      <div class="lo-stage">
        <div class="lo-game-shell">
          <div class="lo-hud-layer"></div>
          <div class="lo-play-layout">
            <div class="lo-canvas-frame"></div>
            <div class="lo-side-layer"></div>
          </div>
        </div>
        <div class="lo-overlay">
          <div class="lo-title-layer"></div>
          <div class="lo-dialogue-layer"></div>
          <div class="lo-shop-layer"></div>
          <div class="lo-pause-layer"></div>
          <div class="lo-gameover-layer"></div>
        </div>
      </div>
    `;

    const frame = this.root.querySelector(".lo-canvas-frame");
    if (!frame) {
      return;
    }
    this.canvas.className = "lo-canvas";
    frame.appendChild(this.canvas);
  }

  private attachEvents(): void {
    window.addEventListener(
      "pointerdown",
      () => {
        if (!this.audioUnlocked) {
          this.audioUnlocked = true;
          void this.audioManager.unlock().then(() => {
            if (!this.session) {
              this.audioManager.playMusic("title_theme");
            }
          });
        }
      },
      { once: true },
    );

    this.root.addEventListener("pointerdown", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
      if (!button) {
        return;
      }

      if ((event.target as HTMLElement).closest("button")) {
        event.preventDefault();
      }

      const action = button.dataset.action;
      if (!action) {
        return;
      }

      if (action === "continue-latest") {
        const save = this.saveManager.loadLatestSlot();
        if (save) {
          this.startSession(save);
        }
        return;
      }

      if (action === "new-slot") {
        const slot = Number(button.dataset.slot);
        this.startSession(this.saveManager.createFreshSave(slot));
        this.session?.openScript("system_intro");
        return;
      }

      if (action === "load-slot") {
        const slot = Number(button.dataset.slot);
        const save = this.saveManager.loadSlot(slot);
        if (save) {
          this.startSession(save);
        }
        return;
      }

      if (action === "reset-saves") {
        this.saveManager.clearAllSaves();
        this.renderTitle();
        return;
      }

      if (!this.session) {
        return;
      }

      if (action === "dialogue-choice") {
        this.session.chooseDialogue(button.dataset.choiceId ?? "");
        return;
      }

      if (action === "dialogue-advance") {
        this.session.advanceDialogue();
        return;
      }

      if (action === "close-shop") {
        this.session.closeShop();
        return;
      }

      if (action === "buy-item") {
        this.session.buyItem(button.dataset.itemId ?? "");
        return;
      }

      if (action === "resume") {
        this.session.resume();
        return;
      }

      if (action === "pause-tab") {
        this.session.setPauseTab(button.dataset.tab as PauseTab);
        return;
      }

      if (action === "save-slot") {
        this.session.manualSave(Number(button.dataset.slot));
        return;
      }

      if (action === "pause-load-slot") {
        const save = this.saveManager.loadSlot(Number(button.dataset.slot));
        if (save) {
          this.startSession(save);
        }
        return;
      }

      if (action === "equip-item") {
        this.session.equipItem(button.dataset.itemId ?? "");
        return;
      }

      if (action === "use-item") {
        this.session.useItem(button.dataset.itemId ?? "");
        return;
      }

      if (action === "respawn") {
        this.session.respawn();
        return;
      }

      if (action === "open-pause") {
        this.session.pause((button.dataset.tab as PauseTab) ?? "status");
      }
    });

    this.root.addEventListener("input", (event) => {
      const element = event.target as HTMLInputElement;
      if (!element.matches("[data-setting]")) {
        return;
      }

      const key = element.dataset.setting as "masterVolume" | "musicVolume" | "sfxVolume";
      const value = Number(element.value);
      if (this.session) {
        this.session.setSettings({ [key]: value });
      } else {
        const settings = this.saveManager.loadSettings();
        const next = { ...settings, [key]: value };
        this.saveManager.saveSettings(next);
        this.audioManager.applySettings(next);
      }
    });

    this.root.addEventListener("change", (event) => {
      const element = event.target as HTMLInputElement;
      if (!element.matches("[data-toggle-setting]")) {
        return;
      }
      const key = element.dataset.toggleSetting as "muteMusic" | "muteSfx";
      if (this.session) {
        this.session.setSettings({ [key]: element.checked });
      } else {
        const settings = this.saveManager.loadSettings();
        const next = { ...settings, [key]: element.checked };
        this.saveManager.saveSettings(next);
        this.audioManager.applySettings(next);
      }
    });
  }

  private startSession(save: ReturnType<SaveManager["createFreshSave"]>): void {
    this.session = new GameSession(save, this.saveManager, this.audioManager);
    this.renderOverlays();
  }

  private loop = (timestamp: number): void => {
    const deltaMs = Math.min(33, timestamp - this.lastFrame);
    this.lastFrame = timestamp;

    if (this.session) {
      this.session.update(deltaMs, this.input);
      this.renderer.render(this.session.getRenderState());
      this.renderOverlays();
    }

    this.input.beginFrame();
    requestAnimationFrame(this.loop);
  };

  private renderTitle(): void {
    const titleLayer = this.root.querySelector(".lo-title-layer");
    const hudLayer = this.root.querySelector(".lo-hud-layer");
    const sideLayer = this.root.querySelector(".lo-side-layer");
    if (!titleLayer) {
      return;
    }

    const settings = this.saveManager.loadSettings();
    const slots = this.saveManager.getAllSlotSummaries();
    this.setLayerHtml(hudLayer as HTMLElement, "");
    this.setLayerHtml(sideLayer as HTMLElement, "");
    this.setLayerHtml(titleLayer as HTMLElement, `
      <section class="lo-title-screen">
        <div class="lo-title-header">
          <div class="lo-title-emblem" data-icon-id="ui_logo_emblem"></div>
          <div>
            <p class="lo-kicker">Open-World Retro Action RPG</p>
            <h1>${gameManifest.title}</h1>
            <p class="lo-subtitle">${gameManifest.worldSummary}</p>
          </div>
        </div>
        <div class="lo-title-grid">
          <article class="lo-panel">
            <h2>Save Slots</h2>
            <div class="lo-slot-list">
              ${slots
                .map(
                  (slot) => `
                    <div class="lo-slot-card">
                      <div>
                        <strong>Slot ${slot.slot}</strong>
                        <p>${slot.label}</p>
                        <p>${slot.exists ? `${slot.locationName} · ${formatDuration(slot.playtimeMs)}` : "Fresh route"}</p>
                      </div>
                      <div class="lo-slot-actions">
                        <button data-action="new-slot" data-slot="${slot.slot}">New Game</button>
                        <button data-action="load-slot" data-slot="${slot.slot}" ${slot.exists ? "" : "disabled"}>Load</button>
                      </div>
                    </div>`,
                )
                .join("")}
            </div>
            <div class="lo-title-actions">
              <button data-action="continue-latest">Continue Latest</button>
              <button data-action="reset-saves">Reset Saves</button>
            </div>
          </article>
          <article class="lo-panel">
            <h2>World</h2>
            <ul class="lo-plain-list">
              ${gameManifest.chapterOverview.map((chapter) => `<li>${chapter}</li>`).join("")}
            </ul>
            <h3>Core Controls</h3>
            <ul class="lo-plain-list">
              <li><strong>Move:</strong> WASD or arrow keys</li>
              <li><strong>Attack:</strong> J</li>
              <li><strong>Dodge:</strong> Space</li>
              <li><strong>Lantern Skill:</strong> K</li>
              <li><strong>Interact:</strong> E</li>
              <li><strong>Pause:</strong> Esc</li>
            </ul>
          </article>
          <article class="lo-panel">
            <h2>Audio & Options</h2>
            ${this.renderSettings(settings)}
          </article>
        </div>
      </section>
    `, (layer) => this.renderIcons(layer));
  }

  private renderOverlays(): void {
    if (!this.session) {
      this.renderTitle();
      return;
    }

    const ui = this.session.getUiState();
    const titleLayer = this.root.querySelector(".lo-title-layer") as HTMLElement;
    const hudLayer = this.root.querySelector(".lo-hud-layer") as HTMLElement;
    const sideLayer = this.root.querySelector(".lo-side-layer") as HTMLElement;
    const dialogueLayer = this.root.querySelector(".lo-dialogue-layer") as HTMLElement;
    const shopLayer = this.root.querySelector(".lo-shop-layer") as HTMLElement;
    const pauseLayer = this.root.querySelector(".lo-pause-layer") as HTMLElement;
    const gameoverLayer = this.root.querySelector(".lo-gameover-layer") as HTMLElement;

    this.setLayerHtml(titleLayer, "");
    this.setLayerHtml(hudLayer, this.renderHud(ui), (layer) => this.renderIcons(layer));
    this.setLayerHtml(sideLayer, this.renderSidebar(ui));
    this.setLayerHtml(dialogueLayer, ui.conversation ? this.renderDialogue(ui) : "");
    this.setLayerHtml(shopLayer, ui.shop ? this.renderShop(ui) : "", (layer) => this.renderIcons(layer));
    this.setLayerHtml(pauseLayer, ui.mode === "paused" ? this.renderPause(ui) : "", (layer) => this.renderIcons(layer));
    this.setLayerHtml(gameoverLayer, ui.gameOver ? this.renderGameOver() : "");
  }

  private renderHud(ui: UiState): string {
    const hp = (ui.playerVitals.health / Math.max(ui.playerVitals.maxHealth, 1)) * 100;
    const stamina = (ui.playerVitals.stamina / Math.max(ui.playerVitals.maxStamina, 1)) * 100;
    const aether = (ui.playerVitals.aether / Math.max(ui.playerVitals.maxAether, 1)) * 100;
    return `
      <div class="lo-hud-shell">
        <div class="lo-hud-card lo-hud-status-card">
          <div class="lo-hud-row">
            <strong>${ui.playerName}</strong>
            <span>${ui.mapName}</span>
          </div>
          <div class="lo-bars">
            <div class="lo-bar-line"><label>HP</label><div class="lo-bar lo-bar-health"><span style="width:${hp}%"></span></div></div>
            <div class="lo-bar-line"><label>ST</label><div class="lo-bar lo-bar-stamina"><span style="width:${stamina}%"></span></div></div>
            <div class="lo-bar-line"><label>AE</label><div class="lo-bar lo-bar-aether"><span style="width:${aether}%"></span></div></div>
          </div>
          <div class="lo-stat-line">
            <span>Chapter ${ui.chapter}</span>
            <span>${ui.timeLabel}</span>
            <span>${ui.gold} gold</span>
          </div>
        </div>
        <div class="lo-hud-card lo-hud-shortcuts">
          <p class="lo-kicker">Field Menu</p>
          <div class="lo-actions-row">
            <button data-action="open-pause" data-tab="status">Menu</button>
            <button data-action="open-pause" data-tab="inventory">Bag</button>
            <button data-action="open-pause" data-tab="map">Map</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderSidebar(ui: UiState): string {
    const trackedQuest = ui.activeQuests[0];
    return `
      <div class="lo-sidebar">
        <div class="lo-hud-card lo-sidebar-card">
          <p class="lo-kicker">Road Notes</p>
          <p class="lo-prompt">${ui.prompt ?? "Explore the Reach and talk to the townsfolk."}</p>
          ${
            trackedQuest
              ? `
                <div class="lo-quest-snippet">
                  <strong>${trackedQuest.title}</strong>
                  <p>${trackedQuest.objectives
                    .map((objective) => `${objective.label} (${objective.current}/${objective.required})`)
                    .join(" · ")}</p>
                </div>
              `
              : "<p class='lo-muted'>No active quest. Speak with the roadwardens and townsfolk.</p>"
          }
        </div>
        ${
          ui.toasts.length
            ? `
              <div class="lo-toast-stack">
                ${ui.toasts.map((toast) => `<div class="lo-toast">${toast.text}</div>`).join("")}
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  private renderDialogue(ui: UiState): string {
    const dialogue = ui.conversation;
    if (!dialogue) {
      return "";
    }

    return `
      <div class="lo-dialogue">
        <div class="lo-panel lo-dialogue-panel">
          <p class="lo-kicker">${dialogue.speakerName}</p>
          ${dialogue.text.map((line) => `<p>${line}</p>`).join("")}
          <div class="lo-choice-list">
            ${
              dialogue.choices.length
                ? dialogue.choices
                    .map((choice) => `<button data-action="dialogue-choice" data-choice-id="${choice.id}">${choice.label}</button>`)
                    .join("")
                : `<button data-action="dialogue-advance">Continue</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  private renderShop(ui: UiState): string {
    const shop = ui.shop;
    if (!shop) {
      return "";
    }

    return `
      <div class="lo-modal">
        <div class="lo-panel lo-modal-panel">
          <div class="lo-modal-header">
            <div>
              <p class="lo-kicker">Shop</p>
              <h2>${shop.name}</h2>
            </div>
            <button data-action="close-shop">Close</button>
          </div>
          <div class="lo-shop-grid">
            ${shop.stock
              .map(
                (stock) => `
                  <div class="lo-shop-item">
                    <div class="lo-icon-chip" data-icon-id="${stock.item.iconId}"></div>
                    <div>
                      <strong>${stock.item.name}</strong>
                      <p>${stock.item.description}</p>
                    </div>
                    <div class="lo-shop-buy">
                      <span>${stock.price}g</span>
                      <button data-action="buy-item" data-item-id="${stock.itemId}" ${stock.affordable ? "" : "disabled"}>Buy</button>
                    </div>
                  </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  private renderPause(ui: UiState): string {
    return `
      <div class="lo-modal">
        <div class="lo-panel lo-pause-panel">
          <div class="lo-modal-header">
            <div>
              <p class="lo-kicker">Paused</p>
              <h2>${ui.mapName}</h2>
            </div>
            <button data-action="resume">Return</button>
          </div>
          <div class="lo-tab-row">
            ${["status", "inventory", "journal", "jobs", "map", "save", "settings"]
              .map(
                (tab) => `
                  <button data-action="pause-tab" data-tab="${tab}" class="${ui.pauseTab === tab ? "is-active" : ""}">
                    ${tab}
                  </button>`,
              )
              .join("")}
          </div>
          <div class="lo-tab-content">
            ${this.renderPauseContent(ui)}
          </div>
        </div>
      </div>
    `;
  }

  private renderPauseContent(ui: UiState): string {
    if (ui.pauseTab === "status") {
      return `
        <div class="lo-status-grid">
          <div>
            <h3>Player</h3>
            <p>${ui.playerName} is carrying the lantern oath through ${ui.regionName}.</p>
            <p>Current save: ${ui.saveLabel}</p>
            <p>Discovered regions: ${ui.discoveredRegions.join(", ")}</p>
          </div>
          <div>
            <h3>Equipment</h3>
            <ul class="lo-plain-list">
              <li>Weapon: ${ui.equipment.weapon?.name ?? "None"}</li>
              <li>Armor: ${ui.equipment.armor?.name ?? "None"}</li>
              <li>Trinket: ${ui.equipment.trinket?.name ?? "None"}</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (ui.pauseTab === "inventory") {
      return `
        <div class="lo-item-list">
          ${ui.inventory
            .map(
              (entry) => `
                <div class="lo-item-row">
                  <div class="lo-icon-chip" data-icon-id="${entry.item.iconId}"></div>
                  <div>
                    <strong>${entry.item.name}${entry.equipped ? " (Equipped)" : ""}</strong>
                    <p>${entry.item.description}</p>
                    <p>Qty: ${entry.quantity}</p>
                  </div>
                  <div class="lo-item-actions">
                    ${
                      entry.item.equipmentSlot && !entry.equipped
                        ? `<button data-action="equip-item" data-item-id="${entry.itemId}">Equip</button>`
                        : ""
                    }
                    ${entry.item.healAmount ? `<button data-action="use-item" data-item-id="${entry.itemId}">Use</button>` : ""}
                  </div>
                </div>`,
            )
            .join("")}
        </div>
      `;
    }

    if (ui.pauseTab === "journal") {
      return `
        <div class="lo-journal">
          <h3>Active Quests</h3>
          ${ui.activeQuests
            .map(
              (quest) => `
                <article class="lo-entry-card">
                  <p class="lo-kicker">${quest.category === "main" ? "Main Story" : "Side Story"}</p>
                  <strong>${quest.title}</strong>
                  <p>${quest.summary}</p>
                  <ul class="lo-plain-list">
                    ${quest.objectives.map((objective) => `<li>${objective.label} (${objective.current}/${objective.required})</li>`).join("")}
                  </ul>
                </article>`,
            )
            .join("")}
          <p class="lo-muted">Completed quests: ${ui.completedQuestCount}</p>
        </div>
      `;
    }

    if (ui.pauseTab === "jobs") {
      return `
        <div class="lo-job-grid">
          ${ui.jobs
            .map(
              (job) => `
                <article class="lo-entry-card">
                  <p class="lo-kicker">${job.rankTitle}</p>
                  <strong>${job.name}</strong>
                  <p>${job.label}</p>
                  <p>Progress: ${job.current}/${job.required}</p>
                  <p>Loops completed: ${job.loopsCompleted}</p>
                  <p>${job.readyToTurnIn ? "Ready to turn in" : job.active ? "Shift active" : "Talk to the mentor to work."}</p>
                </article>`,
            )
            .join("")}
        </div>
      `;
    }

    if (ui.pauseTab === "map") {
      return `
        <div class="lo-map-card">
          <h3>World Map</h3>
          <p>The Cinder Reach opens by region as you travel and take work.</p>
          <div class="lo-region-grid">
            ${ui.discoveredRegions
              .map(
                (region) => `
                  <div class="lo-region-pill">
                    <strong>${region}</strong>
                  </div>`,
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (ui.pauseTab === "save") {
      const slots = this.saveManager.getAllSlotSummaries();
      return `
        <div class="lo-slot-list">
          ${slots
            .map(
              (slot) => `
                <div class="lo-slot-card">
                  <div>
                    <strong>Slot ${slot.slot}</strong>
                    <p>${slot.label}</p>
                    <p>${slot.exists ? `${slot.locationName} · ${formatDuration(slot.playtimeMs)}` : "Empty slot"}</p>
                  </div>
                  <div class="lo-slot-actions">
                    <button data-action="save-slot" data-slot="${slot.slot}">Save</button>
                    <button data-action="pause-load-slot" data-slot="${slot.slot}" ${slot.exists ? "" : "disabled"}>Load</button>
                  </div>
                </div>`,
            )
            .join("")}
        </div>
      `;
    }

    return this.renderSettings(ui.settings);
  }

  private renderSettings(settings: UiState["settings"]): string {
    return `
      <div class="lo-settings-grid">
        <label>
          <span>Master Volume</span>
          <input type="range" min="0" max="1" step="0.05" value="${settings.masterVolume}" data-setting="masterVolume" />
        </label>
        <label>
          <span>Music Volume</span>
          <input type="range" min="0" max="1" step="0.05" value="${settings.musicVolume}" data-setting="musicVolume" />
        </label>
        <label>
          <span>SFX Volume</span>
          <input type="range" min="0" max="1" step="0.05" value="${settings.sfxVolume}" data-setting="sfxVolume" />
        </label>
        <label class="lo-check">
          <input type="checkbox" ${settings.muteMusic ? "checked" : ""} data-toggle-setting="muteMusic" />
          <span>Mute Music</span>
        </label>
        <label class="lo-check">
          <input type="checkbox" ${settings.muteSfx ? "checked" : ""} data-toggle-setting="muteSfx" />
          <span>Mute SFX</span>
        </label>
      </div>
    `;
  }

  private renderGameOver(): string {
    return `
      <div class="lo-modal">
        <div class="lo-panel lo-gameover-panel">
          <p class="lo-kicker">Lantern Faded</p>
          <h2>You were overcome on the road.</h2>
          <p>Respawn at the last safe hearth with most of your strength restored and a little less coin in your purse.</p>
          <button data-action="respawn">Return to the Hearth</button>
        </div>
      </div>
    `;
  }

  private renderIcons(scope: HTMLElement): void {
    scope.querySelectorAll<HTMLElement>("[data-icon-id]").forEach((node) => {
      if (node.childElementCount > 0) {
        return;
      }
      node.appendChild(this.pixels.makeIconElement(node.dataset.iconId ?? "icon_key"));
    });
  }

  private setLayerHtml(layer: HTMLElement | null, html: string, onChanged?: (layer: HTMLElement) => void): void {
    if (!layer) {
      return;
    }

    if (this.lastLayerHtml.get(layer) === html) {
      return;
    }

    layer.innerHTML = html;
    this.lastLayerHtml.set(layer, html);
    onChanged?.(layer);
  }
}
