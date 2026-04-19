import { AudioManager } from "../engine/AudioManager";
import { GameSession, type PauseTab, type UiState } from "../engine/GameSession";
import { InputManager } from "../engine/InputManager";
import { Renderer } from "../engine/Renderer";
import { SaveManager } from "../engine/SaveManager";
import { contentRegistry } from "../memory/contentRegistry";
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
          <div class="lo-ending-layer"></div>
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

      if (action === "go-games") {
        window.location.href = "../";
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

      if (action === "return-main-menu") {
        this.returnToTitle();
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

      if (action === "ending-continue") {
        this.session.dismissEnding();
        return;
      }

      if (action === "ending-return-title") {
        this.session.dismissEnding();
        this.returnToTitle();
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

  private returnToTitle(): void {
    this.session = null;
    this.renderTitle();
    if (this.audioUnlocked) {
      this.audioManager.playMusic("title_theme");
    }
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
                        <div class="lo-slot-meta">
                          <p>${slot.exists ? `${slot.locationName} · ${formatDuration(slot.playtimeMs)}` : "Fresh route"}</p>
                          ${slot.completedMainStory ? "<span class='lo-badge'>Cleared</span>" : ""}
                        </div>
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
              <button data-action="go-games">Games</button>
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
    const endingLayer = this.root.querySelector(".lo-ending-layer") as HTMLElement;
    const gameoverLayer = this.root.querySelector(".lo-gameover-layer") as HTMLElement;

    this.setLayerHtml(titleLayer, "");
    this.setLayerHtml(hudLayer, this.renderHud(ui), (layer) => this.renderIcons(layer));
    this.setLayerHtml(sideLayer, this.renderSidebar(ui));
    this.setLayerHtml(dialogueLayer, ui.conversation ? this.renderDialogue(ui) : "");
    this.setLayerHtml(shopLayer, ui.shop ? this.renderShop(ui) : "", (layer) => this.renderIcons(layer));
    this.setLayerHtml(pauseLayer, ui.mode === "paused" ? this.renderPause(ui) : "", (layer) => this.renderIcons(layer));
    this.setLayerHtml(endingLayer, ui.ending ? this.renderEnding(ui) : "");
    this.setLayerHtml(gameoverLayer, ui.gameOver ? this.renderGameOver() : "");
  }

  private getTrackedQuest(ui: UiState): UiState["activeQuests"][number] | undefined {
    return (
      ui.activeQuests.find((quest) => quest.category === "main" && quest.readyToTurnIn) ??
      ui.activeQuests.find((quest) => quest.category === "main") ??
      ui.activeQuests.find((quest) => quest.readyToTurnIn) ??
      ui.activeQuests[0]
    );
  }

  private renderHud(ui: UiState): string {
    const hp = (ui.playerVitals.health / Math.max(ui.playerVitals.maxHealth, 1)) * 100;
    const stamina = (ui.playerVitals.stamina / Math.max(ui.playerVitals.maxStamina, 1)) * 100;
    const aether = (ui.playerVitals.aether / Math.max(ui.playerVitals.maxAether, 1)) * 100;
    const trackedQuest = this.getTrackedQuest(ui);
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
          <div class="lo-hud-quest">
            <p class="lo-kicker">Tracked Quest</p>
            ${
              trackedQuest
                ? `
                  <strong>${trackedQuest.title}</strong>
                  <p class="lo-muted lo-quest-guidance">${trackedQuest.routeHint}</p>
                  <ul class="lo-plain-list lo-quest-objectives">
                    ${trackedQuest.objectives
                      .map((objective) => `<li>${objective.label} (${objective.current}/${objective.required})</li>`)
                      .join("")}
                  </ul>
                `
                : ui.storyComplete
                  ? "<p class='lo-muted'>Main story complete. Your cleared route is still open for side stories, jobs, and secrets.</p>"
                  : `<p class='lo-muted'>${ui.storyNote}</p>`
            }
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
    const trackedQuest = this.getTrackedQuest(ui);
    return `
      <div class="lo-sidebar">
        <div class="lo-hud-card lo-sidebar-card">
          <p class="lo-kicker">Road Notes</p>
          <p class="lo-prompt">${ui.prompt ?? ui.storyNote}</p>
          ${
            trackedQuest
              ? `
                <div class="lo-quest-snippet">
                  <strong>${trackedQuest.title}</strong>
                  <p class="lo-muted lo-quest-guidance">${trackedQuest.routeHint}</p>
                  <p>${trackedQuest.objectives
                    .map((objective) => `${objective.label} (${objective.current}/${objective.required})`)
                    .join(" · ")}</p>
                </div>
              `
              : ui.storyComplete
                ? "<p class='lo-muted'>The last hearth burns again. Keep exploring jobs, side stories, and hidden corners of the Reach.</p>"
                : `<p class='lo-muted'>${ui.storyNote}</p>`
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
              .map((stock) => {
                const ownedQuantity = ui.inventory.find((entry) => entry.itemId === stock.itemId)?.quantity ?? 0;
                const equipped = Object.values(ui.equipment).some((entry) => entry?.id === stock.itemId);
                return `
                  <div class="lo-shop-item">
                    <div class="lo-icon-chip" data-icon-id="${stock.item.iconId}"></div>
                    <div class="lo-entry-stack">
                      <strong>${stock.item.name}</strong>
                      <p class="lo-kicker">${this.capitalize(stock.item.category)}</p>
                      <p>${stock.item.description}</p>
                      <p class="lo-muted">${this.describeItem(stock.item)}</p>
                      <p>Owned: ${ownedQuantity}${equipped ? " - Equipped now" : ""}</p>
                    </div>
                    <div class="lo-shop-buy">
                      <span>${stock.price}g</span>
                      <button data-action="buy-item" data-item-id="${stock.itemId}" ${stock.affordable ? "" : "disabled"}>Buy</button>
                    </div>
                  </div>`;
              })
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
            <div class="lo-actions-row">
              <button data-action="go-games">Games</button>
              <button data-action="return-main-menu">Main Menu</button>
              <button data-action="resume">Return</button>
            </div>
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
          <article class="lo-entry-card lo-entry-stack">
            <h3>Player</h3>
            <p>${ui.playerName} is carrying the lantern oath through ${ui.regionName}.</p>
            <p>${ui.regionSummary}</p>
            <p><strong>Current route:</strong> ${ui.storyNote}</p>
            <p>Current save: ${ui.saveLabel}</p>
            <p>Discovered regions: ${ui.discoveredRegions.length ? ui.discoveredRegions.join(", ") : "None yet"}</p>
            <p>${ui.storyComplete ? "Main story complete. The Reach is relit, but your cleared route stays open for side stories and jobs." : "The last hearth is still ahead. Keep following the road notes and journal."}</p>
          </article>
          <article class="lo-entry-card lo-entry-stack">
            <h3>Equipment</h3>
            <ul class="lo-plain-list">
              <li>Weapon: ${ui.equipment.weapon?.name ?? "None"}</li>
              <li>Armor: ${ui.equipment.armor?.name ?? "None"}</li>
              <li>Trinket: ${ui.equipment.trinket?.name ?? "None"}</li>
            </ul>
          </article>
          <article class="lo-entry-card lo-entry-stack">
            <h3>Controls</h3>
            <ul class="lo-plain-list">
              <li>Move: WASD or arrow keys</li>
              <li>Attack: J</li>
              <li>Lantern Skill: K</li>
              <li>Dodge: Space</li>
              <li>Interact: E</li>
              <li>Pause: Esc</li>
            </ul>
          </article>
        </div>
      `;
    }

    if (ui.pauseTab === "inventory") {
      const categoryOrder = ["weapon", "armor", "trinket", "consumable", "material", "quest"] as const;
      const categoryLabels: Record<(typeof categoryOrder)[number], string> = {
        weapon: "Weapons",
        armor: "Armor",
        trinket: "Trinkets",
        consumable: "Consumables",
        material: "Materials",
        quest: "Quest Items",
      };

      return `
        <div class="lo-item-list">
          ${categoryOrder
            .map((category) => {
              const entries = ui.inventory.filter((entry) => entry.item.category === category);
              if (!entries.length) {
                return "";
              }

              return `
                <section class="lo-entry-stack">
                  <h3>${categoryLabels[category]}</h3>
                  ${entries
                    .map(
                      (entry) => `
                        <div class="lo-item-row">
                          <div class="lo-icon-chip" data-icon-id="${entry.item.iconId}"></div>
                          <div class="lo-entry-stack">
                            <strong>${entry.item.name}${entry.equipped ? " (Equipped)" : ""}</strong>
                            <p>${entry.item.description}</p>
                            <p class="lo-muted">${this.describeItem(entry.item)}</p>
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
                </section>
              `;
            })
            .join("")}
        </div>
      `;
    }

    if (ui.pauseTab === "journal") {
      const mainQuests = ui.activeQuests.filter((quest) => quest.category === "main");
      const sideQuests = ui.activeQuests.filter((quest) => quest.category === "side");
      return `
        <div class="lo-journal">
          <h3>Main Story</h3>
          ${
            mainQuests.length
              ? mainQuests
                  .map(
                    (quest) => `
                      <article class="lo-entry-card lo-entry-stack">
                        <p class="lo-kicker">Main Story</p>
                        <strong>${quest.title}</strong>
                        <p>${quest.summary}</p>
                        <p class="lo-muted">${quest.journalSummary}</p>
                        <p class="lo-quest-guidance">${quest.routeHint}</p>
                        <ul class="lo-plain-list">
                          ${quest.objectives.map((objective) => `<li>${objective.label} (${objective.current}/${objective.required})</li>`).join("")}
                        </ul>
                      </article>`,
                  )
                  .join("")
              : "<p class='lo-muted'>No active main quest right now.</p>"
          }
          <h3>Side Stories</h3>
          ${
            sideQuests.length
              ? sideQuests
                  .map(
                    (quest) => `
                      <article class="lo-entry-card lo-entry-stack">
                        <p class="lo-kicker">Side Story</p>
                        <strong>${quest.title}</strong>
                        <p>${quest.summary}</p>
                        <p class="lo-muted">${quest.journalSummary}</p>
                        <p class="lo-quest-guidance">${quest.routeHint}</p>
                        <ul class="lo-plain-list">
                          ${quest.objectives.map((objective) => `<li>${objective.label} (${objective.current}/${objective.required})</li>`).join("")}
                        </ul>
                      </article>`,
                  )
                  .join("")
              : "<p class='lo-muted'>No active side stories right now.</p>"
          }
          <p class="lo-muted">Completed quests: ${ui.completedQuestCount}</p>
        </div>
      `;
    }

    if (ui.pauseTab === "jobs") {
      return `
        <div class="lo-job-grid">
          ${ui.jobs
            .map((job) => {
              const jobDef = contentRegistry.jobs[job.id];
              const mentor = contentRegistry.characters[jobDef.mentorId];
              const location = contentRegistry.maps[jobDef.locationId];
              return `
                <article class="lo-entry-card">
                  <p class="lo-kicker">${job.rankTitle}</p>
                  <strong>${job.name}</strong>
                  <p>${jobDef.description}</p>
                  <p><strong>Shift:</strong> ${job.label}</p>
                  <p>Progress: ${job.current}/${job.required}</p>
                  <p>Loops completed: ${job.loopsCompleted}</p>
                  <p><strong>Mentor:</strong> ${mentor?.name ?? "Unknown"}${location ? ` - ${location.name}` : ""}</p>
                  <p><strong>Pay:</strong> ${jobDef.baseRewardGold + job.rank * 4} gold per turn-in</p>
                  <p class="lo-muted">${jobDef.perkText}</p>
                  <p>${job.readyToTurnIn ? "Ready to turn in" : job.active ? "Shift active" : "Talk to the mentor to work."}</p>
                </article>`;
            })
            .join("")}
        </div>
      `;
    }

    if (ui.pauseTab === "map") {
      const regionCards = Object.values(contentRegistry.regions)
        .map((region) => {
          const discovered = ui.discoveredRegions.includes(region.id);
          const isCurrent = region.id === ui.regionId;
          const mapNames = region.mapIds
            .map((mapId) => contentRegistry.maps[mapId])
            .filter(Boolean)
            .map((map) => `${map.name}${map.id === ui.mapId ? " (Here)" : ""}`);
          const connectionNames = region.connections
            .map((regionId) => contentRegistry.regions[regionId]?.name)
            .filter(Boolean)
            .join(" · ");

          return `
            <article class="lo-entry-card lo-entry-stack lo-region-card ${isCurrent ? "is-current" : ""}">
              <p class="lo-kicker">${discovered ? region.biome : "Undiscovered Region"}</p>
              <strong>${region.name}${isCurrent ? " (Current Region)" : ""}</strong>
              <p>${discovered ? region.summary : "You have not charted this route yet."}</p>
              ${
                discovered
                  ? `
                    <p><strong>Known maps:</strong> ${mapNames.join(" · ")}</p>
                    <p><strong>Road links:</strong> ${connectionNames || "None listed"}</p>
                  `
                  : "<p class='lo-muted'>Travel farther, follow rumors, and keep taking road work to uncover this part of the Reach.</p>"
              }
            </article>
          `;
        })
        .join("");

      return `
        <div class="lo-map-card">
          <h3>World Map</h3>
          <p>${ui.storyNote}</p>
          <div class="lo-region-grid lo-region-card-grid">
            ${regionCards}
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
                    <div class="lo-slot-meta">
                      <p>${slot.exists ? `${slot.locationName} · ${formatDuration(slot.playtimeMs)}` : "Empty slot"}</p>
                      ${slot.completedMainStory ? "<span class='lo-badge'>Cleared</span>" : ""}
                    </div>
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

  private describeItem(item: UiState["inventory"][number]["item"]): string {
    if (item.healAmount) {
      return `Restores ${item.healAmount} HP.`;
    }

    const bonuses = Object.entries(item.statBonuses ?? {})
      .map(([key, value]) => `${this.formatStatLabel(key)} +${value}`)
      .join(", ");
    if (bonuses) {
      return bonuses;
    }

    if (item.equipmentSlot) {
      return `${this.capitalize(item.equipmentSlot)} gear.`;
    }

    return item.category === "quest" ? "Important story item." : `Worth ${item.value} gold.`;
  }

  private formatStatLabel(key: string): string {
    const labels: Record<string, string> = {
      attack: "Attack",
      defense: "Defense",
      maxHealth: "Max HP",
      maxStamina: "Max ST",
      maxAether: "Max AE",
      moveSpeed: "Move",
    };
    return labels[key] ?? key;
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
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

  private renderEnding(ui: UiState): string {
    if (!ui.ending) {
      return "";
    }

    return `
      <div class="lo-modal">
        <div class="lo-panel lo-ending-panel">
          <p class="lo-kicker">Main Story Complete</p>
          <h2>${ui.ending.title}</h2>
          ${ui.ending.summary.map((line) => `<p>${line}</p>`).join("")}
          <div class="lo-ending-grid">
            ${ui.ending.stats
              .map(
                (entry) => `
                  <div class="lo-ending-stat">
                    <span class="lo-muted">${entry.label}</span>
                    <strong>${entry.value}</strong>
                  </div>`,
              )
              .join("")}
          </div>
          <p class="lo-muted">Press E, Enter, or use the buttons below to keep going.</p>
          <div class="lo-actions-row">
            <button data-action="ending-continue">Continue Exploring</button>
            <button data-action="ending-return-title">Return to Title</button>
          </div>
        </div>
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
