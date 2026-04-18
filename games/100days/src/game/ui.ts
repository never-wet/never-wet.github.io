import type {
  DaySummary,
  MetaProgression,
  SceneId,
  SettingsData,
  ShrineChoice,
  UpgradeChoice,
} from "../memory/types";

export interface UiHudModel {
  day: number;
  timeLeft: number;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  currentBiome: string;
  weapons: string[];
  passives: string[];
  relics: string[];
  synergies: string[];
  objectiveText?: string;
  objectiveProgress?: string;
  modeLabel?: string;
  characterName?: string;
  warningText?: string;
  bossName?: string;
  bossHpRatio?: number;
}

export interface UiChoiceCard {
  id: string;
  name: string;
  title?: string;
  description: string;
  accent?: string;
  selected?: boolean;
}

export interface UiCodexSection {
  title: string;
  entries: Array<{
    id: string;
    label: string;
    subtitle?: string;
    description: string;
    discovered: boolean;
  }>;
}

export interface UiEventModel {
  title: string;
  description: string;
  choices: ShrineChoice[];
}

export interface UiModel {
  scene: SceneId;
  hasContinueRun: boolean;
  canContinueFromDawn: boolean;
  profile: MetaProgression;
  settings: SettingsData;
  modes?: UiChoiceCard[];
  characters?: UiChoiceCard[];
  codexSections?: UiCodexSection[];
  eventState?: UiEventModel;
  hud?: UiHudModel;
  upgradeChoices?: UpgradeChoice[];
  daySummary?: DaySummary;
}

type ActionHandler = (action: string, value?: string) => void;

const percent = (value: number): string => `${Math.round(value * 100)}%`;

const button = (label: string, action: string, value?: string, extraClass = ""): string =>
  `<button class="ui-button ${extraClass}" data-action="${action}" ${value ? `data-value="${value}"` : ""}>${label}</button>`.trim();

const rarityClass = (rarity: UpgradeChoice["rarity"]): string => `rarity-${rarity}`;

export class GameUI {
  private lastMarkup = "";
  private readonly shell: HTMLDivElement;
  private readonly dynamicLayer: HTMLDivElement;
  private readonly pauseButton: HTMLButtonElement;

  constructor(private readonly root: HTMLElement, private readonly onAction: ActionHandler) {
    this.shell = document.createElement("div");
    this.shell.className = "ui-shell";

    this.dynamicLayer = document.createElement("div");
    this.dynamicLayer.className = "ui-dynamic";

    this.pauseButton = document.createElement("button");
    this.pauseButton.className = "floating-pause";
    this.pauseButton.dataset.action = "pause";
    this.pauseButton.textContent = "Pause";
    this.pauseButton.type = "button";
    this.pauseButton.hidden = true;

    this.shell.append(this.dynamicLayer, this.pauseButton);
    this.root.replaceChildren(this.shell);
    root.addEventListener("click", this.handleClick);
    root.addEventListener("input", this.handleInput);
  }

  render(model: UiModel): void {
    const markup = this.template(model);
    if (markup === this.lastMarkup) {
      this.syncPauseButton(model.scene);
      return;
    }
    this.lastMarkup = markup;
    this.dynamicLayer.innerHTML = markup;
    this.syncPauseButton(model.scene);
  }

  private template(model: UiModel): string {
    return `
      ${model.hud ? this.hudTemplate(model.hud) : ""}
      <div class="ui-modal-layer">
        ${this.modalTemplate(model)}
      </div>
    `;
  }

  private syncPauseButton(scene: SceneId): void {
    this.pauseButton.hidden = scene !== "playing";
  }

  private hudTemplate(hud: UiHudModel): string {
    return `
      <section class="hud-cluster hud-main">
        <div class="hud-title">Day ${hud.day}</div>
        <div class="hud-biome">${hud.currentBiome}</div>
        ${hud.modeLabel ? `<div class="hud-mode">${hud.modeLabel}${hud.characterName ? ` · ${hud.characterName}` : ""}</div>` : ""}
        <div class="bar-block">
          <span>Vital</span>
          <div class="bar-track"><div class="bar-fill bar-health" style="width:${(hud.hp / hud.maxHp) * 100}%"></div></div>
          <small>${Math.ceil(hud.hp)} / ${Math.ceil(hud.maxHp)}</small>
        </div>
        <div class="bar-block">
          <span>Experience Lv ${hud.level}</span>
          <div class="bar-track"><div class="bar-fill bar-xp" style="width:${(hud.xp / hud.xpToNext) * 100}%"></div></div>
          <small>${Math.floor(hud.xp)} / ${Math.floor(hud.xpToNext)}</small>
        </div>
      </section>

      <section class="hud-cluster hud-right">
        <div class="hud-time">${hud.timeLeft.toFixed(1)}s</div>
        ${hud.objectiveText ? `<div class="objective-banner"><strong>${hud.objectiveText}</strong><small>${hud.objectiveProgress ?? ""}</small></div>` : ""}
        ${hud.bossName ? `<div class="boss-card"><strong>${hud.bossName}</strong><div class="bar-track"><div class="bar-fill bar-boss" style="width:${(hud.bossHpRatio ?? 0) * 100}%"></div></div></div>` : ""}
        ${hud.warningText ? `<div class="warning-banner">${hud.warningText}</div>` : ""}
      </section>

      <section class="hud-cluster hud-loadout">
        <div>
          <h3>Weapons</h3>
          <div class="tag-row">${hud.weapons.map((item) => `<span class="tag-chip">${item}</span>`).join("")}</div>
        </div>
        <div>
          <h3>Passives</h3>
          <div class="tag-row">${hud.passives.map((item) => `<span class="tag-chip muted">${item}</span>`).join("")}</div>
        </div>
        <div>
          <h3>Relics & Synergies</h3>
          <div class="tag-row">
            ${hud.relics.map((item) => `<span class="tag-chip relic">${item}</span>`).join("")}
            ${hud.synergies.map((item) => `<span class="tag-chip synergy">${item}</span>`).join("")}
          </div>
        </div>
      </section>
    `;
  }

  private modalTemplate(model: UiModel): string {
    switch (model.scene) {
      case "title":
        return `
          <section class="panel hero-panel">
            <div class="eyebrow">Canvas Survival Action</div>
            <h1>Hundred Days of Ashfall</h1>
            <p class="hero-copy">Survive escalating daily swarms, auto-build an original weapon loadout, and endure until the final Day 100 boss.</p>
            <div class="selection-stack">
              <div>
                <div class="eyebrow">Challenge Modes</div>
                <div class="selector-grid compact">
                  ${(model.modes ?? [])
                    .map(
                      (mode) => `
                        <button class="selector-card ${mode.selected ? "selected" : ""}" data-action="select-mode" data-value="${mode.id}">
                          <strong>${mode.name}</strong>
                          <p>${mode.description}</p>
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </div>
              <div>
                <div class="eyebrow">Survivors</div>
                <div class="selector-grid">
                  ${(model.characters ?? [])
                    .map(
                      (character) => `
                        <button class="selector-card ${character.selected ? "selected" : ""}" data-action="select-character" data-value="${character.id}" ${character.accent ? `style="--accent:${character.accent}"` : ""}>
                          <span class="choice-type">${character.title ?? "Survivor"}</span>
                          <strong>${character.name}</strong>
                          <p>${character.description}</p>
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
            <div class="hero-actions">
              ${button("Start Run", "start-new")}
              ${model.hasContinueRun ? button("Continue Run", "continue-run") : ""}
              ${button("Codex", "open-codex", undefined, "secondary")}
              ${button("Settings", "open-settings")}
              ${button("Go To Games", "go-games", undefined, "secondary")}
            </div>
            <div class="stat-grid">
              <div><span>Best Day</span><strong>${model.profile.bestDay}</strong></div>
              <div><span>Total Runs</span><strong>${model.profile.totalRuns}</strong></div>
              <div><span>Completed Day 100</span><strong>${model.profile.completedDay100 ? "Yes" : "No"}</strong></div>
            </div>
          </section>
        `;
      case "codex":
        return `
          <section class="panel codex-panel">
            <div class="eyebrow">Codex</div>
            <h2>Unlocked Knowledge</h2>
            <div class="codex-stack">
              ${(model.codexSections ?? [])
                .map(
                  (section) => `
                    <section class="codex-section">
                      <h3>${section.title}</h3>
                      <div class="choice-grid codex-grid">
                        ${section.entries
                          .map(
                            (entry) => `
                              <article class="choice-card ${entry.discovered ? "rarity-rare" : ""}">
                                <span class="choice-type">${entry.discovered ? entry.subtitle ?? "Discovered" : "Locked"}</span>
                                <strong>${entry.discovered ? entry.label : "Unknown"}</strong>
                                <p>${entry.discovered ? entry.description : "Discover this entry during runs to record it in the codex."}</p>
                              </article>
                            `,
                          )
                          .join("")}
                      </div>
                    </section>
                  `,
                )
                .join("")}
            </div>
            <div class="stack-actions horizontal">
              ${button("Back", "close-codex")}
            </div>
          </section>
        `;
      case "event":
        return `
          <section class="panel choice-panel">
            <div class="eyebrow">Field Event</div>
            <h2>${model.eventState?.title ?? "Shrine"}</h2>
            <p>${model.eventState?.description ?? ""}</p>
            <div class="choice-grid">
              ${(model.eventState?.choices ?? [])
                .map(
                  (choice) => `
                    <button class="choice-card rarity-epic" data-action="take-event" data-value="${choice.id}">
                      <span class="choice-type">Shrine Choice</span>
                      <strong>${choice.title}</strong>
                      <p>${choice.description}</p>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>
        `;
      case "paused":
        return `
          <section class="panel menu-panel">
            <div class="eyebrow">Run Paused</div>
            <h2>Catch Your Breath</h2>
            <div class="stack-actions">
              ${button("Resume", "resume")}
              ${button("Settings", "open-settings")}
              ${button("Restart Run", "restart-run")}
              ${button("Return To Title", "back-title")}
              ${button("Go To Games", "go-games", undefined, "secondary")}
            </div>
          </section>
        `;
      case "upgrade":
        return `
          <section class="panel choice-panel">
            <div class="eyebrow">Level Up</div>
            <h2>Choose Your Next Edge</h2>
            <div class="choice-grid">
              ${(model.upgradeChoices ?? [])
                .map(
                  (choice) => `
                    <button class="choice-card ${rarityClass(choice.rarity)}" data-action="take-upgrade" data-value="${choice.id}">
                      <span class="choice-type">${choice.rarity}</span>
                      <strong>${choice.title}</strong>
                      <p>${choice.description}</p>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>
        `;
      case "day-summary":
        return `
          <section class="panel summary-panel">
            <div class="eyebrow">Dawn Secured</div>
            <h2>Day ${(model.daySummary?.day ?? 0)} Cleared</h2>
            <p>${model.daySummary?.summaryText ?? ""}</p>
            ${
              model.daySummary?.objectiveText
                ? `<div class="objective-banner"><strong>${model.daySummary.objectiveText}</strong><small>${model.daySummary.objectiveComplete ? `Completed - ${model.daySummary.objectiveRewardText ?? ""}` : "Not completed this day"}</small></div>`
                : ""
            }
            <div class="summary-metrics">
              <div><span>Kills</span><strong>${model.daySummary?.killCount ?? 0}</strong></div>
            </div>
            <div class="choice-grid">
              ${(model.daySummary?.rewardOptions ?? [])
                .map(
                  (choice) => `
                    <button class="choice-card rarity-rare" data-action="take-reward" data-value="${choice.id}">
                      <span class="choice-type">Camp Reward</span>
                      <strong>${choice.title}</strong>
                      <p>${choice.description}</p>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </section>
        `;
      case "settings":
        return `
          <section class="panel settings-panel">
            <div class="eyebrow">Settings</div>
            <h2>Audio And Combat Readability</h2>
            <div class="settings-list">
              ${this.rangeSetting("Master Volume", "masterVolume", model.settings.masterVolume)}
              ${this.rangeSetting("Music Volume", "musicVolume", model.settings.musicVolume)}
              ${this.rangeSetting("SFX Volume", "sfxVolume", model.settings.sfxVolume)}
              ${this.toggleSetting("Mute All", "muted", model.settings.muted)}
              ${this.toggleSetting("Mute Music", "musicMuted", model.settings.musicMuted)}
              ${this.toggleSetting("Mute SFX", "sfxMuted", model.settings.sfxMuted)}
              ${this.toggleSetting("Screen Shake", "screenshake", model.settings.screenshake)}
              ${this.toggleSetting("Damage Numbers", "damageNumbers", model.settings.damageNumbers)}
              ${this.toggleSetting("Reduced Flash", "reducedFlash", model.settings.reducedFlash)}
            </div>
            <div class="stack-actions horizontal">
              ${button("Back", "close-settings")}
              ${button("Go To Games", "go-games", undefined, "secondary")}
              ${button("Reset Save", "reset-save", undefined, "secondary")}
            </div>
          </section>
        `;
      case "game-over":
        return `
          <section class="panel menu-panel">
            <div class="eyebrow">Run Lost</div>
            <h2>The Horde Won This Night</h2>
            <p>Your build is saved in memory, but the battlefield takes its toll.</p>
            <div class="stack-actions">
              ${model.canContinueFromDawn ? button("Continue From Dawn", "continue-dawn") : ""}
              ${button("Restart Run", "restart-run")}
              ${button("Return To Title", "back-title")}
              ${button("Go To Games", "go-games", undefined, "secondary")}
            </div>
          </section>
        `;
      case "victory":
        return `
          <section class="panel hero-panel victory-panel">
            <div class="eyebrow">Day 100 Complete</div>
            <h1>Hundred Days Survived</h1>
            <p class="hero-copy">The final boss has fallen and the Ashfall cycle is broken. Your run is now recorded in local memory.</p>
            <div class="hero-actions">
              ${button("Start New Run", "start-new")}
              ${button("Return To Title", "back-title")}
              ${button("Go To Games", "go-games", undefined, "secondary")}
            </div>
          </section>
        `;
      default:
        return "";
    }
  }

  private rangeSetting(label: string, key: string, value: number): string {
    return `
      <label class="setting-row range-row">
        <span class="setting-label">${label}</span>
        <div class="slider-shell">
          <input class="pretty-slider" type="range" min="0" max="1" step="0.01" value="${value}" data-setting="${key}" data-setting-type="range" />
        </div>
        <strong class="setting-value">${percent(value)}</strong>
      </label>
    `;
  }

  private toggleSetting(label: string, key: string, value: boolean): string {
    return `
      <label class="setting-row toggle-row">
        <span class="setting-label">${label}</span>
        <span class="toggle-shell">
          <input class="toggle-input" type="checkbox" ${value ? "checked" : ""} data-setting="${key}" data-setting-type="checkbox" />
          <span class="toggle-visual" aria-hidden="true"></span>
        </span>
      </label>
    `;
  }

  private readonly handleClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const actionable = target?.closest<HTMLElement>("[data-action]");
    if (!actionable) {
      return;
    }
    this.onAction(actionable.dataset.action ?? "", actionable.dataset.value);
  };

  private readonly handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.dataset.setting) {
      return;
    }
    const key = target.dataset.setting;
    const value = target.dataset.settingType === "checkbox" ? String(target.checked) : target.value;
    this.onAction(`setting:${key}`, value);
  };
}
