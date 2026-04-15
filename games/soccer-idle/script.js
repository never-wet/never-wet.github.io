const STORAGE_KEY = "neverwet-soccer-idle-save-v3";
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;
const LEADERBOARD_TICK_MS = 1000;
const divisionThresholds = [25, 90, 220, 480, 900, 1600, 2600, 4200];
const divisionNames = [
  "Sunday League",
  "District Cup",
  "Regional Clash",
  "National Push",
  "Premier Sprint",
  "Galaxy Tour",
  "World Icons",
  "GOAT Era",
];
const playerTierBands = [
  { id: "sss", label: "SSS", minOverall: 270 },
  { id: "ss", label: "SS", minOverall: 252 },
  { id: "s", label: "S", minOverall: 234 },
  { id: "a", label: "A", minOverall: 216 },
  { id: "b", label: "B", minOverall: 198 },
  { id: "c", label: "C", minOverall: 180 },
  { id: "d", label: "D", minOverall: 162 },
  { id: "e", label: "E", minOverall: 0 },
];
const lineupSlots = [
  { id: "lw", shortLabel: "LW", title: "Left Wing" },
  { id: "st", shortLabel: "ST", title: "Striker" },
  { id: "rw", shortLabel: "RW", title: "Right Wing" },
  { id: "cm1", shortLabel: "CM", title: "Left Midfield" },
  { id: "cm2", shortLabel: "CM", title: "Center Midfield" },
  { id: "cm3", shortLabel: "CM", title: "Right Midfield" },
  { id: "lb", shortLabel: "LB", title: "Left Back" },
  { id: "cb1", shortLabel: "CB", title: "Center Back" },
  { id: "cb2", shortLabel: "CB", title: "Center Back" },
  { id: "rb", shortLabel: "RB", title: "Right Back" },
  { id: "gk", shortLabel: "GK", title: "Goalkeeper" },
];
const squadBlueprint = [
  { name: "Eli Stone", role: "Left Wing", initials: "ES", preferredSlot: "lw", powerBase: 74, leadershipBase: 60, energyBase: 71 },
  { name: "Milo Vega", role: "Captain / Striker", initials: "MV", preferredSlot: "st", powerBase: 77, leadershipBase: 81, energyBase: 73 },
  { name: "Jae Park", role: "Right Wing", initials: "JP", preferredSlot: "rw", powerBase: 73, leadershipBase: 62, energyBase: 75 },
  { name: "Kai Flores", role: "Left Midfielder", initials: "KF", preferredSlot: "cm1", powerBase: 66, leadershipBase: 68, energyBase: 78 },
  { name: "Leo Quinn", role: "Central Midfielder", initials: "LQ", preferredSlot: "cm2", powerBase: 64, leadershipBase: 69, energyBase: 70 },
  { name: "Noah Cruz", role: "Playmaker", initials: "NC", preferredSlot: "cm3", powerBase: 69, leadershipBase: 72, energyBase: 68 },
  { name: "Rafa Mendez", role: "Left Back", initials: "RM", preferredSlot: "lb", powerBase: 56, leadershipBase: 63, energyBase: 72 },
  { name: "Owen Hart", role: "Center Back", initials: "OH", preferredSlot: "cb1", powerBase: 61, leadershipBase: 67, energyBase: 60 },
  { name: "Sung Min", role: "Center Back", initials: "SM", preferredSlot: "cb2", powerBase: 59, leadershipBase: 65, energyBase: 62 },
  { name: "Tariq Boone", role: "Right Back", initials: "TB", preferredSlot: "rb", powerBase: 57, leadershipBase: 61, energyBase: 74 },
  { name: "Zane Cole", role: "Goalkeeper", initials: "ZC", preferredSlot: "gk", powerBase: 51, leadershipBase: 71, energyBase: 64 },
];
const playerCatalog = buildPlayerCatalog();
const tierPriority = Object.fromEntries(playerTierBands.map((tier, index) => [tier.id, playerTierBands.length - index]));

const upgradeDefinitions = [
  {
    id: "ball-boys",
    name: "Ball Boys",
    icon: "⚽",
    description: "More balls, less downtime. Keeps shots flowing constantly.",
    baseCost: 24,
    growth: 1.42,
    effectText: "+0.45 auto shots / sec",
    apply: (state) => {
      state.autoShotsPerSecond += 0.45;
    },
  },
  {
    id: "finishing-drills",
    name: "Finishing Drills",
    icon: "🎯",
    description: "Sharpen strikers so every tap turns into more goals.",
    baseCost: 38,
    growth: 1.55,
    effectText: "+1 goal / shot",
    apply: (state) => {
      state.goalsPerShot += 1;
    },
  },
  {
    id: "shirt-sponsor",
    name: "Shirt Sponsor",
    icon: "💸",
    description: "Cash rolls in harder every time the ball hits the net.",
    baseCost: 60,
    growth: 1.58,
    effectText: "+$1.5 per goal",
    apply: (state) => {
      state.cashPerGoal += 1.5;
    },
  },
  {
    id: "youth-academy",
    name: "Youth Academy",
    icon: "🌟",
    description: "Fresh talent adds pressure, hype, and future stars.",
    baseCost: 92,
    growth: 1.68,
    effectText: "+0.9 auto shots / sec, +14 fans",
    apply: (state) => {
      state.autoShotsPerSecond += 0.9;
      state.fans += 14;
    },
  },
  {
    id: "night-fixture",
    name: "Night Fixture",
    icon: "🌙",
    description: "Prime-time matches raise payouts and crowd momentum.",
    baseCost: 145,
    growth: 1.74,
    effectText: "+$2.5 per goal, +28 fans",
    apply: (state) => {
      state.cashPerGoal += 2.5;
      state.fans += 28;
    },
  },
  {
    id: "pressing-system",
    name: "Pressing System",
    icon: "🔥",
    description: "Relentless team shape means more chances every second.",
    baseCost: 230,
    growth: 1.8,
    effectText: "+1.5 auto shots / sec, +1 goal / shot",
    apply: (state) => {
      state.autoShotsPerSecond += 1.5;
      state.goalsPerShot += 1;
    },
  },
  {
    id: "precision-lab",
    name: "Precision Lab",
    icon: "🧪",
    description: "Expensive analytics to trim misses a tiny bit at a time.",
    baseCost: 250000,
    growth: 2.4,
    effectText: "-0.1% miss chance",
    apply: (state) => {
      state.missChanceReduction += 0.001;
    },
  },
];

const state = loadState();
normalizeLineupAssignments();
normalizeRivalClubs();
const runtime = {
  buzz: 0,
  pendingAutoShots: 0,
  lastFrame: performance.now(),
  lastSaveAt: 0,
  lastAutoVisualAt: 0,
  lastAutoTickerAt: 0,
  lastRenderedBuzzInt: -1,
  activeScreen: "field",
  selectedLineupSlot: "st",
  shotAnimationToken: 0,
  flashTimeout: 0,
  ballResetTimeout: 0,
  lastLeaderboardUpdateAt: Date.now(),
};

const elements = {
  cashDisplay: document.getElementById("cashDisplay"),
  cashDisplayMirror: document.getElementById("cashDisplayMirror"),
  goalsDisplay: document.getElementById("goalsDisplay"),
  perSecondDisplay: document.getElementById("perSecondDisplay"),
  sidePerSecondLabel: document.getElementById("sidePerSecondLabel"),
  fansDisplay: document.getElementById("fansDisplay"),
  buzzDisplay: document.getElementById("buzzDisplay"),
  buzzMeterText: document.getElementById("buzzMeterText"),
  buzzMeterFill: document.getElementById("buzzMeterFill"),
  divisionNameDisplay: document.getElementById("divisionNameDisplay"),
  divisionProgressText: document.getElementById("divisionProgressText"),
  divisionProgressFill: document.getElementById("divisionProgressFill"),
  cashPerGoalDisplay: document.getElementById("cashPerGoalDisplay"),
  goalsPerShotDisplay: document.getElementById("goalsPerShotDisplay"),
  autoShotsDisplay: document.getElementById("autoShotsDisplay"),
  marketGoalsDisplay: document.getElementById("marketGoalsDisplay"),
  upgradesBalanceDisplay: document.getElementById("upgradesBalanceDisplay"),
  nextUpgradeBadge: document.getElementById("nextUpgradeBadge"),
  nextUpgradeName: document.getElementById("nextUpgradeName"),
  nextUpgradeDescription: document.getElementById("nextUpgradeDescription"),
  nextUpgradeButton: document.getElementById("nextUpgradeButton"),
  rankDisplay: document.getElementById("rankDisplay"),
  leaderboardDivisionDisplay: document.getElementById("leaderboardDivisionDisplay"),
  leaderboardList: document.getElementById("leaderboardList"),
  squadCountDisplay: document.getElementById("squadCountDisplay"),
  captainAvatar: document.getElementById("captainAvatar"),
  captainNameDisplay: document.getElementById("captainNameDisplay"),
  captainRoleDisplay: document.getElementById("captainRoleDisplay"),
  captainLeadershipDisplay: document.getElementById("captainLeadershipDisplay"),
  captainFinishingDisplay: document.getElementById("captainFinishingDisplay"),
  captainEnergyDisplay: document.getElementById("captainEnergyDisplay"),
  lineupCountDisplay: document.getElementById("lineupCountDisplay"),
  lineupHintDisplay: document.getElementById("lineupHintDisplay"),
  autoFillLineupButton: document.getElementById("autoFillLineupButton"),
  lineupGrid: document.getElementById("lineupGrid"),
  squadGrid: document.getElementById("squadGrid"),
  squadStatusMessage: document.getElementById("squadStatusMessage"),
  transferCountDisplay: document.getElementById("transferCountDisplay"),
  marketBalanceDisplay: document.getElementById("marketBalanceDisplay"),
  marketStatusMessage: document.getElementById("marketStatusMessage"),
  transferMarketGrid: document.getElementById("transferMarketGrid"),
  missChanceDisplay: document.getElementById("missChanceDisplay"),
  shotsFiredDisplay: document.getElementById("shotsFiredDisplay"),
  shotsScoredDisplay: document.getElementById("shotsScoredDisplay"),
  accuracyDisplay: document.getElementById("accuracyDisplay"),
  lifetimeCashDisplay: document.getElementById("lifetimeCashDisplay"),
  autoContributionDisplay: document.getElementById("autoContributionDisplay"),
  precisionLevelDisplay: document.getElementById("precisionLevelDisplay"),
  fanMomentumDisplay: document.getElementById("fanMomentumDisplay"),
  shootingPowerDisplay: document.getElementById("shootingPowerDisplay"),
  teamLeadershipDisplay: document.getElementById("teamLeadershipDisplay"),
  passingFlowDisplay: document.getElementById("passingFlowDisplay"),
  disciplineDisplay: document.getElementById("disciplineDisplay"),
  screens: Array.from(document.querySelectorAll(".screen[data-screen]")),
  upgradeGrid: document.getElementById("upgradeGrid"),
  field: document.getElementById("field"),
  fieldTapButton: document.getElementById("fieldTapButton"),
  ball: document.getElementById("ball"),
  goalFlash: document.getElementById("goalFlash"),
  eventTicker: document.getElementById("eventTicker"),
  floatingLayer: document.getElementById("floatingLayer"),
  topNavLinks: Array.from(document.querySelectorAll(".nav-link[data-screen-target]")),
  railLinks: Array.from(document.querySelectorAll(".rail-link[data-screen-target]")),
  mobileLinks: Array.from(document.querySelectorAll(".mobile-link[data-screen-target]")),
};

buildUpgradeCards();
attachEvents();
applyOfflineProgress();
render();
setupScreenNavigation();
setActiveScreen("field", true);
window.goalKineticShowScreen = (screenName) => setActiveScreen(screenName);
window.goalKineticSwitchScreen = (screenName) => setActiveScreen(screenName);
window.goalKineticBuyPlayer = (playerId) => buyPlayer(playerId);
window.goalKineticSelectLineupSlot = (slotId) => selectLineupSlot(slotId);
window.goalKineticAssignLineupPlayer = (playerId) => assignPlayerToLineup(playerId);
window.goalKineticBenchLineupPlayer = (playerId) => benchPlayer(playerId);
window.goalKineticClearLineupSlot = (slotId) => clearLineupSlot(slotId);
window.goalKineticAutoFillLineup = () => autoFillLineup();
requestAnimationFrame(gameLoop);

function createDefaultState() {
  return {
    version: 4,
    cash: 0,
    goals: 0,
    fans: 0,
    cashPerGoal: 1,
    goalsPerShot: 1,
    autoShotsPerSecond: 0,
    missChanceReduction: 0,
    totalShots: 0,
    totalHits: 0,
    lifetimeCash: 0,
    manualShots: 0,
    autoShots: 0,
    ownedPlayerIds: [],
    starterTransferGrantClaimed: false,
    lineupAssignments: buildDefaultLineupAssignments(),
    rivalClubs: buildDefaultRivalClubs(),
    lastLeaderboardTickAt: Date.now(),
    lastActiveAt: Date.now(),
    upgrades: Object.fromEntries(upgradeDefinitions.map((upgrade) => [upgrade.id, 0])),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw);
    const fresh = createDefaultState();

    return {
      ...fresh,
      ...parsed,
      upgrades: {
        ...fresh.upgrades,
        ...(parsed.upgrades || {}),
      },
    };
  } catch (error) {
    console.warn("Could not load Soccer Idle save", error);
    return createDefaultState();
  }
}

function getStarterPlayerId(index) {
  return `starter-${index}`;
}

function buildDefaultRivalClubs() {
  return [
    { id: "night-xi", name: "NIGHT XI", score: 8200, growthPerSecond: 38 },
    { id: "pixel-fc", name: "PIXEL FC", score: 5400, growthPerSecond: 24 },
    { id: "mega-boots", name: "MEGA BOOTS", score: 4700, growthPerSecond: 21 },
    { id: "goal-rush", name: "GOAL RUSH", score: 4300, growthPerSecond: 18 },
  ];
}

function buildDefaultLineupAssignments() {
  const assignments = Object.fromEntries(lineupSlots.map((slot) => [slot.id, null]));

  squadBlueprint.forEach((player, index) => {
    const targetSlotId = player.preferredSlot;
    if (targetSlotId && assignments[targetSlotId] === null) {
      assignments[targetSlotId] = getStarterPlayerId(index);
      return;
    }

    const fallbackSlot = lineupSlots.find((slot) => assignments[slot.id] === null);
    if (fallbackSlot) {
      assignments[fallbackSlot.id] = getStarterPlayerId(index);
    }
  });

  return assignments;
}

function normalizeLineupAssignments() {
  const rosterIds = new Set([
    ...squadBlueprint.map((_, index) => getStarterPlayerId(index)),
    ...state.ownedPlayerIds,
  ]);
  const fallbackAssignments = buildDefaultLineupAssignments();
  const normalized = {};
  const seenPlayerIds = new Set();

  lineupSlots.forEach((slot) => {
    const savedPlayerId = state.lineupAssignments?.[slot.id];
    const fallbackPlayerId = fallbackAssignments[slot.id];

    if (savedPlayerId && rosterIds.has(savedPlayerId) && !seenPlayerIds.has(savedPlayerId)) {
      normalized[slot.id] = savedPlayerId;
      seenPlayerIds.add(savedPlayerId);
      return;
    }

    if (fallbackPlayerId && rosterIds.has(fallbackPlayerId) && !seenPlayerIds.has(fallbackPlayerId)) {
      normalized[slot.id] = fallbackPlayerId;
      seenPlayerIds.add(fallbackPlayerId);
      return;
    }

    normalized[slot.id] = null;
  });

  const remainingRosterIds = [...rosterIds].filter((playerId) => !seenPlayerIds.has(playerId));
  lineupSlots.forEach((slot) => {
    if (normalized[slot.id]) {
      return;
    }

    const nextPlayerId = remainingRosterIds.shift();
    normalized[slot.id] = nextPlayerId || null;
    if (nextPlayerId) {
      seenPlayerIds.add(nextPlayerId);
    }
  });

  state.lineupAssignments = normalized;
}

function normalizeRivalClubs() {
  const defaults = buildDefaultRivalClubs();
  const savedById = new Map((state.rivalClubs || []).map((club) => [club.id, club]));

  state.rivalClubs = defaults.map((club) => ({
    ...club,
    ...(savedById.get(club.id) || {}),
  }));
}

function saveState() {
  state.lastActiveAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  runtime.lastSaveAt = performance.now();
}

function applyOfflineProgress() {
  maybeGrantStarterTransferBudget();
  progressRivalClubs();

  const elapsedSeconds = Math.min(
    Math.max(0, (Date.now() - (state.lastActiveAt || Date.now())) / 1000),
    MAX_OFFLINE_SECONDS
  );

  if (elapsedSeconds < 8 || state.autoShotsPerSecond <= 0) {
    saveState();
    return;
  }

  const offlineShots = Math.floor(elapsedSeconds * state.autoShotsPerSecond);
  if (offlineShots <= 0) {
    saveState();
    return;
  }

  const rewards = resolveShotBatch(offlineShots, { manual: false });
  setTicker(
    `Welcome back. Your club took ${formatNumber(offlineShots)} shots, scored ${formatNumber(rewards.goals)}, and earned $${formatNumber(rewards.payout)}.`
  );
  spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, 68, 22, "upgrade");
  saveState();
}

function progressRivalClubs(forceElapsedMs) {
  const now = Date.now();
  const previousTickAt = state.lastLeaderboardTickAt || now;
  const elapsedMs = Math.max(0, forceElapsedMs ?? now - previousTickAt);
  const elapsedSeconds = elapsedMs / 1000;

  if (elapsedSeconds <= 0) {
    state.lastLeaderboardTickAt = now;
    return false;
  }

  state.rivalClubs = (state.rivalClubs || []).map((club, index) => {
    const divisionBoost = 1 + Math.min(2.6, state.goals / 2200);
    const chaos = 0.94 + ((now / 1000 + index * 11) % 7) * 0.018;
    const scoreGain = club.growthPerSecond * divisionBoost * chaos * elapsedSeconds;

    return {
      ...club,
      score: Math.round(club.score + scoreGain),
    };
  });

  state.lastLeaderboardTickAt = now;
  return true;
}

function maybeGrantStarterTransferBudget() {
  if (state.ownedPlayerIds.length > 0) {
    return;
  }

  const affordablePlayers = playerCatalog.filter((player) => player.price <= state.cash).length;
  if (affordablePlayers >= 10 && state.cash >= 1000) {
    state.starterTransferGrantClaimed = true;
    return;
  }

  state.cash = Math.max(state.cash, 1000);
  state.starterTransferGrantClaimed = true;
}

function buildUpgradeCards() {
  elements.upgradeGrid.innerHTML = "";

  upgradeDefinitions.forEach((upgrade) => {
    const card = document.createElement("article");
    card.className = "upgrade-card";
    card.dataset.id = upgrade.id;
    card.dataset.icon = upgrade.icon;
    card.innerHTML = `
      <div class="upgrade-head">
        <span class="upgrade-icon">${upgrade.icon}</span>
        <div>
          <h3>${upgrade.name}</h3>
          <p>${upgrade.description}</p>
        </div>
      </div>
      <div class="upgrade-meta">
        <span>${upgrade.effectText}</span>
        <span id="owned-${upgrade.id}">Lv. 0</span>
      </div>
      <div class="upgrade-progress">
        <div id="fill-${upgrade.id}" class="upgrade-progress-fill"></div>
      </div>
      <div class="upgrade-footer">
        <span id="cost-${upgrade.id}" class="buy-cost">Cost<strong>$0</strong></span>
        <button id="buy-${upgrade.id}" class="buy-button" type="button">Buy</button>
      </div>
    `;

    elements.upgradeGrid.appendChild(card);
    card.querySelector("button").addEventListener("click", () => buyUpgrade(upgrade.id));
  });
}

function attachEvents() {
  const triggerShot = (event) => {
    if (event) {
      event.preventDefault();
    }

    const origin = getTapPosition(event);
    takeManualShot(origin.x, origin.y);
  };

  elements.fieldTapButton.addEventListener("click", triggerShot);
  elements.field.addEventListener("pointerdown", (event) => {
    if (event.target === elements.fieldTapButton) {
      return;
    }

    triggerShot(event);
  });

  window.addEventListener("beforeunload", saveState);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveState();
    }
  });

  const handleTransferPress = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("[data-player-id]");
    if (!button) {
      return;
    }

    event.preventDefault();
    buyPlayer(button.dataset.playerId);
  };

  elements.transferMarketGrid.addEventListener("click", handleTransferPress);
  elements.transferMarketGrid.addEventListener("pointerup", handleTransferPress);

  elements.autoFillLineupButton?.addEventListener("click", (event) => {
    event.preventDefault();
    autoFillLineup();
  });
  elements.autoFillLineupButton?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    autoFillLineup();
  });

  const handleLineupPress = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const clearButton = target?.closest("[data-clear-slot]");
    if (clearButton) {
      event.preventDefault();
      event.stopPropagation();
      clearLineupSlot(clearButton.dataset.clearSlot);
      return;
    }

    const slotButton = target?.closest("[data-lineup-slot]");
    if (!slotButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectLineupSlot(slotButton.dataset.lineupSlot);
  };

  elements.lineupGrid?.addEventListener("click", handleLineupPress);
  elements.lineupGrid?.addEventListener("pointerdown", handleLineupPress);

  const handleRosterPress = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const benchButton = target?.closest("[data-bench-player-id]");
    if (benchButton) {
      event.preventDefault();
      event.stopPropagation();
      benchPlayer(benchButton.dataset.benchPlayerId);
      return;
    }

    const assignButton = target?.closest("[data-assign-player-id]");
    if (!assignButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    assignPlayerToLineup(assignButton.dataset.assignPlayerId);
  };

  elements.squadGrid?.addEventListener("click", handleRosterPress);
  elements.squadGrid?.addEventListener("pointerdown", handleRosterPress);
}

function setupScreenNavigation() {
  const navButtons = [...elements.topNavLinks, ...elements.railLinks, ...elements.mobileLinks];

  navButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { screenTarget } = button.dataset;
      if (!screenTarget) {
        return;
      }

      setActiveScreen(screenTarget);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest("[data-screen-target]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    const { screenTarget } = trigger.dataset;
    if (!screenTarget) {
      return;
    }

    setActiveScreen(screenTarget);
  });
}

function setActiveScreen(screenName, force = false) {
  if (!screenName) {
    return;
  }

  if (!force && runtime.activeScreen === screenName) {
    return;
  }

  runtime.activeScreen = screenName;

  elements.screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === screenName);
  });

  elements.topNavLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.screenTarget === screenName);
  });

  elements.railLinks.forEach((link) => {
    link.classList.toggle("current", link.dataset.screenTarget === screenName);
  });

  elements.mobileLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.screenTarget === screenName);
  });
}

function getTapPosition(event) {
  const rect = elements.field.getBoundingClientRect();
  const clientX = event?.clientX ?? rect.left + rect.width * 0.5;
  const clientY = event?.clientY ?? rect.top + rect.height * 0.78;

  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;

  return {
    x: clamp(x, 15, 85),
    y: clamp(y, 18, 88),
  };
}

function getUpgradeCost(upgrade) {
  const owned = state.upgrades[upgrade.id] || 0;
  return Math.round(upgrade.baseCost * upgrade.growth ** owned);
}

function buyUpgrade(upgradeId) {
  const upgrade = upgradeDefinitions.find((item) => item.id === upgradeId);
  if (!upgrade) {
    return;
  }

  const cost = getUpgradeCost(upgrade);
  if (state.cash < cost) {
    setTicker(`Need $${formatNumber(cost - state.cash)} more for ${upgrade.name}.`);
    return;
  }

  state.cash -= cost;
  state.upgrades[upgrade.id] += 1;
  upgrade.apply(state);

  setTicker(`${upgrade.name} unlocked. The whole stadium feels stronger.`);
  spawnRewardBubble(upgrade.icon, 50, 76, "upgrade");
  render();
  saveState();
}

function buyPlayer(playerId) {
  const player = playerCatalog.find((item) => item.id === playerId);
  if (!player || state.ownedPlayerIds.includes(playerId)) {
    return;
  }

  if (state.cash < player.price) {
    setTicker(`Need $${formatNumber(player.price - state.cash)} more for ${player.name}.`);
    return;
  }

  state.cash -= player.price;
  state.ownedPlayerIds.push(playerId);
  setTicker(`${player.name} signed for the club.`);
  spawnRewardBubble(player.initials, 50, 72, "upgrade");
  render();
  saveState();
}

function getLineupSlot(slotId) {
  return lineupSlots.find((slot) => slot.id === slotId) || null;
}

function findPlayerAssignedSlot(playerId) {
  return (
    lineupSlots.find((slot) => state.lineupAssignments?.[slot.id] === playerId)?.id ||
    null
  );
}

function getNextLineupTarget(playerId) {
  const currentSlotId = findPlayerAssignedSlot(playerId);
  if (runtime.selectedLineupSlot && getLineupSlot(runtime.selectedLineupSlot)) {
    return runtime.selectedLineupSlot;
  }

  return (
    currentSlotId ||
    lineupSlots.find((slot) => !state.lineupAssignments?.[slot.id])?.id ||
    "st"
  );
}

function getPlayerName(playerId) {
  const starterIndex = squadBlueprint.findIndex((_, index) => getStarterPlayerId(index) === playerId);
  if (starterIndex >= 0) {
    return squadBlueprint[starterIndex].name;
  }

  return playerCatalog.find((player) => player.id === playerId)?.name || "Player";
}

function getPlayerTier(overall) {
  return playerTierBands.find((tier) => overall >= tier.minOverall) || playerTierBands[playerTierBands.length - 1];
}

function getPreferredSlotsForRole(role) {
  const lowerRole = (role || "").toLowerCase();

  if (lowerRole.includes("goal")) {
    return ["gk"];
  }

  if (lowerRole.includes("striker") || lowerRole.includes("finisher")) {
    return ["st", "lw", "rw"];
  }

  if (lowerRole.includes("left wing") || lowerRole.includes("winger")) {
    return ["lw", "rw", "st"];
  }

  if (lowerRole.includes("right wing")) {
    return ["rw", "lw", "st"];
  }

  if (lowerRole.includes("playmaker") || lowerRole.includes("mid")) {
    return ["cm2", "cm1", "cm3", "st"];
  }

  if (lowerRole.includes("left back")) {
    return ["lb", "rb", "cb1"];
  }

  if (lowerRole.includes("right back")) {
    return ["rb", "lb", "cb2"];
  }

  if (lowerRole.includes("center back") || lowerRole.includes("defender") || lowerRole.includes("anchor")) {
    return ["cb1", "cb2", "lb", "rb"];
  }

  return [];
}

function autoFillLineup() {
  const roster = buildSquadRows()
    .map((player) => ({
      ...player,
      roleSlots:
        squadBlueprint.find((starter, index) => getStarterPlayerId(index) === player.id)?.preferredSlot
          ? [squadBlueprint.find((starter, index) => getStarterPlayerId(index) === player.id)?.preferredSlot]
          : getPreferredSlotsForRole(player.role),
    }))
    .sort((left, right) => {
      const tierDelta = (tierPriority[right.tier.id] || 0) - (tierPriority[left.tier.id] || 0);
      if (tierDelta !== 0) {
        return tierDelta;
      }

      return right.overall - left.overall;
    });

  const nextAssignments = Object.fromEntries(lineupSlots.map((slot) => [slot.id, null]));
  const usedPlayers = new Set();

  roster.forEach((player) => {
    const preferredOpenSlot = player.roleSlots.find((slotId) => !nextAssignments[slotId]);
    if (!preferredOpenSlot || usedPlayers.has(player.id)) {
      return;
    }

    nextAssignments[preferredOpenSlot] = player.id;
    usedPlayers.add(player.id);
  });

  roster.forEach((player) => {
    if (usedPlayers.has(player.id)) {
      return;
    }

    const fallbackSlot = lineupSlots.find((slot) => !nextAssignments[slot.id]);
    if (!fallbackSlot) {
      return;
    }

    nextAssignments[fallbackSlot.id] = player.id;
    usedPlayers.add(player.id);
  });

  state.lineupAssignments = nextAssignments;
  runtime.selectedLineupSlot = lineupSlots.find((slot) => !nextAssignments[slot.id])?.id || "st";
  setSquadStatus("Starting XI auto-filled by tier: SSS, SS, S, A, B, C, D, then E.");
  render();
  saveState();
}

function setSquadStatus(message) {
  if (elements.squadStatusMessage) {
    elements.squadStatusMessage.textContent = message;
  }
}

function selectLineupSlot(slotId) {
  const slot = getLineupSlot(slotId);
  if (!slot) {
    return;
  }

  runtime.selectedLineupSlot = slot.id;
  setSquadStatus(`Selected ${slot.title}. Choose a player below to fill that spot.`);
  render();
}

function assignPlayerToLineup(playerId) {
  const validRosterIds = new Set([
    ...squadBlueprint.map((_, index) => getStarterPlayerId(index)),
    ...state.ownedPlayerIds,
  ]);
  if (!validRosterIds.has(playerId)) {
    return;
  }

  const targetSlotId = getNextLineupTarget(playerId);
  const targetSlot = getLineupSlot(targetSlotId);
  if (!targetSlot) {
    return;
  }

  const currentSlotId = findPlayerAssignedSlot(playerId);
  const displacedPlayerId = state.lineupAssignments[targetSlotId];

  if (currentSlotId === targetSlotId) {
    runtime.selectedLineupSlot = targetSlotId;
    setSquadStatus(`${getPlayerName(playerId)} is already starting at ${targetSlot.shortLabel}.`);
    render();
    return;
  }

  if (currentSlotId) {
    state.lineupAssignments[currentSlotId] =
      displacedPlayerId && displacedPlayerId !== playerId ? displacedPlayerId : null;
  }

  state.lineupAssignments[targetSlotId] = playerId;
  runtime.selectedLineupSlot = targetSlotId;

  const displacementNote =
    displacedPlayerId && displacedPlayerId !== playerId && !currentSlotId
      ? ` ${getPlayerName(displacedPlayerId)} moved to the bench.`
      : "";

  setSquadStatus(
    `${getPlayerName(playerId)} locked into ${targetSlot.shortLabel}.${displacementNote}`
  );
  render();
  saveState();
}

function clearLineupSlot(slotId) {
  const slot = getLineupSlot(slotId);
  if (!slot) {
    return;
  }

  const playerId = state.lineupAssignments[slotId];
  state.lineupAssignments[slotId] = null;
  runtime.selectedLineupSlot = slotId;
  setSquadStatus(
    playerId
      ? `${getPlayerName(playerId)} moved to the bench from ${slot.shortLabel}.`
      : `${slot.title} is empty. Pick a player below to fill it.`
  );
  render();
  saveState();
}

function benchPlayer(playerId) {
  const slotId = findPlayerAssignedSlot(playerId);
  if (!slotId) {
    runtime.selectedLineupSlot = getNextLineupTarget(playerId);
    setSquadStatus(`${getPlayerName(playerId)} is already on the bench.`);
    render();
    return;
  }

  clearLineupSlot(slotId);
}

function takeManualShot(originX, originY) {
  runtime.buzz = clamp(runtime.buzz + 12, 0, 100);
  state.totalShots += 1;
  state.manualShots += 1;
  const hit = rollHitChance();
  const target = hit ? randomHitTarget() : randomMissTarget();

  animateShot(originX, originY, target, hit);
  spawnRipple(originX, originY);
  setTicker(hit ? "Shot away..." : "Risky strike... it might curl wide.");

  queueShotResolution({ manual: true, hit, originX, originY });
  render();
}

function resolveShotBatch(shots, options = {}) {
  let totalGoals = 0;
  let totalPayout = 0;
  let totalFans = 0;

  for (let shotIndex = 0; shotIndex < shots; shotIndex += 1) {
    if (!rollHitChance()) {
      continue;
    }

    const reward = awardGoals(1, options);
    totalGoals += reward.goals;
    totalPayout += reward.payout;
    totalFans += reward.fanGain;
  }

  return { goals: totalGoals, payout: totalPayout, fanGain: totalFans };
}

function awardGoals(goalCount, options = {}) {
  const manualMultiplier = options.manual ? 1 + runtime.buzz / 240 : 1;
  const goalsMade = goalCount * state.goalsPerShot;
  const payout = goalsMade * state.cashPerGoal * manualMultiplier;
  const fanGain = Math.max(1, Math.round(goalsMade * (options.manual ? 2.4 : 0.95)));

  state.goals += goalsMade;
  state.cash += payout;
  state.lifetimeCash += payout;
  state.fans += fanGain;
  state.totalHits += goalCount;

  return { goals: goalsMade, payout, fanGain };
}

function queueShotResolution({ manual, hit, originX, originY }) {
  window.setTimeout(() => {
    if (!hit) {
      setTicker(manual ? "Missed the net. No cash for that shot." : "Auto shot missed the target.");
      spawnRewardBubble("MISS", originX, originY - 20, "upgrade");
      render();
      return;
    }

    const rewards = awardGoals(1, { manual });
    showGoalFlash(`+$${formatNumber(rewards.payout)}`);
    pulseStage();
    spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, originX, originY - 10, "cash");
    setTicker(
      manual
        ? `Cracking finish. ${formatNumber(rewards.goals)} goal and $${formatNumber(rewards.payout)} on impact.`
        : `Auto strike hits the net for $${formatNumber(rewards.payout)}.`
    );
    render();
  }, 520);
}

function queueAutoResolution({ shots, hits, misses }) {
  window.setTimeout(() => {
    state.totalShots += shots;
    state.autoShots += shots;

    if (hits > 0) {
      const rewards = awardGoals(hits, { manual: false });
      showGoalFlash(`+$${formatNumber(rewards.payout)}`);
      pulseStage();
      spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, 50, 52, "cash");
      setTicker(
        misses > 0
          ? `Auto run: ${formatNumber(hits)} hits, ${formatNumber(misses)} misses, $${formatNumber(rewards.payout)} earned.`
          : `Auto run lands ${formatNumber(hits)} clean shots for $${formatNumber(rewards.payout)}.`
      );
    } else {
      setTicker(`Auto run missed ${formatNumber(misses)} shots.`);
      spawnRewardBubble("MISS", 50, 48, "upgrade");
    }

    render();
  }, 520);
}

function animateShot(originX, originY, target, hit) {
  const rect = elements.field.getBoundingClientRect();
  const startX = rect.width * (originX / 100);
  const startY = rect.height * (originY / 100);
  const targetX = rect.width * (target.x / 100);
  const targetY = rect.height * (target.y / 100);

  runtime.shotAnimationToken += 1;
  const token = runtime.shotAnimationToken;

  const shotX = Math.round(targetX - startX);
  const shotY = Math.round(targetY - startY);

  elements.ball.classList.remove("shooting");
  elements.ball.style.left = `${originX}%`;
  elements.ball.style.top = `${originY}%`;
  elements.ball.style.bottom = "auto";
  elements.ball.style.setProperty("--shot-x", `${shotX}px`);
  elements.ball.style.setProperty("--shot-y", `${shotY}px`);
  elements.ball.style.zIndex = hit ? "7" : "6";

  requestAnimationFrame(() => {
    elements.ball.classList.add("shooting");
  });

  window.clearTimeout(runtime.ballResetTimeout);
  runtime.ballResetTimeout = window.setTimeout(() => {
    if (token !== runtime.shotAnimationToken) {
      return;
    }

    elements.ball.classList.remove("shooting");
    elements.ball.style.left = "50%";
    elements.ball.style.top = "auto";
    elements.ball.style.bottom = "86px";
    elements.ball.style.setProperty("--shot-x", "0px");
    elements.ball.style.setProperty("--shot-y", "-280px");
  }, 560);
}

function randomHitTarget() {
  return {
    x: 37 + Math.random() * 26,
    y: 23 + Math.random() * 7,
  };
}

function randomMissTarget() {
  const lanes = [
    { x: 18 + Math.random() * 8, y: 25 + Math.random() * 10 },
    { x: 74 + Math.random() * 8, y: 25 + Math.random() * 10 },
    { x: 32 + Math.random() * 36, y: 10 + Math.random() * 6 },
  ];

  return lanes[Math.floor(Math.random() * lanes.length)];
}

function getMissChance() {
  return clamp(0.42 - state.missChanceReduction, 0.08, 0.42);
}

function rollHitChance() {
  return Math.random() > getMissChance();
}

function showGoalFlash(text) {
  elements.goalFlash.textContent = text;
  elements.goalFlash.classList.add("show");
  window.clearTimeout(runtime.flashTimeout);
  runtime.flashTimeout = window.setTimeout(() => {
    elements.goalFlash.classList.remove("show");
  }, 560);
}

function pulseStage() {
  elements.field.classList.remove("goal-celebrate");
  void elements.field.offsetWidth;
  elements.field.classList.add("goal-celebrate");
}

function setTicker(message) {
  elements.eventTicker.textContent = message;
  if (elements.marketStatusMessage) {
    elements.marketStatusMessage.textContent = message;
  }
}

function spawnRewardBubble(text, xPercent, yPercent, tone) {
  const bubble = document.createElement("div");
  bubble.className = `reward-pop ${tone}`;
  bubble.textContent = text;
  bubble.style.left = `${xPercent}%`;
  bubble.style.top = `${yPercent}%`;
  elements.floatingLayer.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 920);
}

function spawnRipple(xPercent, yPercent) {
  const ripple = document.createElement("div");
  ripple.className = "ripple-pop";
  ripple.style.left = `${xPercent}%`;
  ripple.style.top = `${yPercent}%`;
  elements.floatingLayer.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 600);
}

function render() {
  const expectedHitRate = 1 - getMissChance();
  const cashPerSecond =
    state.autoShotsPerSecond * state.goalsPerShot * state.cashPerGoal * expectedHitRate;
  const division = getDivisionInfo();
  const nextUpgrade = getNextUpgrade();
  const totalAccuracy = state.totalShots > 0 ? (state.totalHits / state.totalShots) * 100 : 0;
  const autoContribution = state.totalShots > 0 ? (state.autoShots / state.totalShots) * 100 : 0;
  const leaderboardRows = buildLeaderboardRows();
  const squad = buildSquadRows();
  const activeLineupPlayers = getActiveLineupPlayers(squad);
  const teamPerformance = buildTeamPerformance(totalAccuracy, activeLineupPlayers);
  const availablePlayers = playerCatalog.filter((player) => !state.ownedPlayerIds.includes(player.id));

  const formattedCash = `$${formatNumber(state.cash)}`;
  elements.cashDisplay.textContent = formattedCash;
  elements.cashDisplayMirror.textContent = formattedCash;
  updateHeroCashDisplay(formattedCash);
  elements.goalsDisplay.textContent = formatNumber(state.goals);
  elements.perSecondDisplay.textContent = `$${formatNumber(cashPerSecond)}`;
  elements.sidePerSecondLabel.textContent = `CPS: ${formatNumber(cashPerSecond)}`;
  elements.fansDisplay.textContent = formatNumber(state.fans);
  elements.buzzDisplay.textContent = `${Math.round(runtime.buzz)}%`;
  elements.buzzMeterText.textContent = `${Math.round(runtime.buzz)}% / 100%`;
  elements.buzzMeterFill.style.width = `${runtime.buzz}%`;
  elements.divisionNameDisplay.textContent = division.name;
  elements.divisionProgressText.textContent = `${formatNumber(division.current)} / ${formatNumber(division.target)} goals`;
  elements.divisionProgressFill.style.width = `${division.progress * 100}%`;
  elements.cashPerGoalDisplay.textContent = `$${formatNumber(state.cashPerGoal)}`;
  elements.goalsPerShotDisplay.textContent = formatNumber(state.goalsPerShot);
  elements.autoShotsDisplay.textContent = `${formatNumber(state.autoShotsPerSecond)}/s`;
  if (elements.marketGoalsDisplay) {
    elements.marketGoalsDisplay.textContent = formatNumber(state.goals);
  }
  if (elements.upgradesBalanceDisplay) {
    elements.upgradesBalanceDisplay.textContent = `$${formatNumber(state.cash)}`;
  }
  elements.rankDisplay.textContent = `#${leaderboardRows.find((row) => row.isYou)?.rank ?? 999}`;
  elements.leaderboardDivisionDisplay.textContent = `${division.name} Division`;
  elements.squadCountDisplay.textContent = formatNumber(squad.length);
  elements.transferCountDisplay.textContent = formatNumber(availablePlayers.length);
  if (elements.marketBalanceDisplay) {
    elements.marketBalanceDisplay.textContent = `$${formatNumber(state.cash)}`;
  }
  elements.missChanceDisplay.textContent = `${(getMissChance() * 100).toFixed(1)}%`;
  elements.shotsFiredDisplay.textContent = formatNumber(state.totalShots);
  elements.shotsScoredDisplay.textContent = formatNumber(state.totalHits);
  elements.accuracyDisplay.textContent = `${formatNumber(totalAccuracy)}%`;
  elements.lifetimeCashDisplay.textContent = `$${formatNumber(state.lifetimeCash)}`;
  elements.autoContributionDisplay.textContent = `${formatNumber(autoContribution)}%`;
  elements.precisionLevelDisplay.textContent = `Lv. ${state.upgrades["precision-lab"] || 0}`;
  elements.fanMomentumDisplay.textContent = formatNumber(state.fans);
  elements.shootingPowerDisplay.textContent = formatNumber(teamPerformance.shootingPower);
  elements.teamLeadershipDisplay.textContent = formatNumber(teamPerformance.leadership);
  elements.passingFlowDisplay.textContent = formatNumber(teamPerformance.passingFlow);
  elements.disciplineDisplay.textContent = formatNumber(teamPerformance.discipline);

  renderNextUpgrade(nextUpgrade);
  renderLeaderboard(leaderboardRows);
  renderSquad(squad, activeLineupPlayers);
  renderTransferMarket();

  upgradeDefinitions.forEach((upgrade) => {
    const cost = getUpgradeCost(upgrade);
    const affordableProgress = Math.min(1, state.cash / cost);
    const button = document.getElementById(`buy-${upgrade.id}`);
    const owned = document.getElementById(`owned-${upgrade.id}`);
    const fill = document.getElementById(`fill-${upgrade.id}`);
    const costLabel = document.getElementById(`cost-${upgrade.id}`);
    const card = elements.upgradeGrid.querySelector(`[data-id="${upgrade.id}"]`);

    button.disabled = state.cash < cost;
    owned.textContent = `Lv. ${state.upgrades[upgrade.id]}`;
    costLabel.innerHTML = `Cost<strong>$${formatNumber(cost)}</strong>`;
    fill.style.width = `${affordableProgress * 100}%`;
    card.classList.toggle("affordable", state.cash >= cost);
  });
}

function updateHeroCashDisplay(valueText) {
  if (!elements.cashDisplayMirror) {
    return;
  }

  const compactLength = valueText.replace(/[^0-9A-Z.]/gi, "").length;
  elements.cashDisplayMirror.classList.remove("cash-display-large", "cash-display-compact", "cash-display-tight");

  if (compactLength >= 8) {
    elements.cashDisplayMirror.classList.add("cash-display-tight");
    return;
  }

  if (compactLength >= 6) {
    elements.cashDisplayMirror.classList.add("cash-display-compact");
    return;
  }

  elements.cashDisplayMirror.classList.add("cash-display-large");
}

function buildLeaderboardRows() {
  const yourScore = Math.round(state.goals + state.fans * 2.2 + state.lifetimeCash * 0.12);

  return [
    ...(state.rivalClubs || []).map((club) => ({
      name: club.name,
      score: club.score,
      isYou: false,
    })),
    { name: "KINETIC STRIKER", score: yourScore, isYou: true },
  ]
    .sort((left, right) => right.score - left.score)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function renderLeaderboard(rows) {
  elements.leaderboardList.innerHTML = rows
    .map(
      (row) => `
        <article class="leader-row${row.isYou ? " you" : ""}">
          <div class="leader-rank">#${row.rank}</div>
          <div class="leader-meta">
            <div class="leader-name">${row.name}</div>
            <span>${row.isYou ? "Your club" : "Global rival"}</span>
          </div>
          <div class="leader-score">${formatNumber(row.score)}</div>
        </article>
      `
    )
    .join("");
}

function renderTransferMarket() {
  const sortedPlayers = playerCatalog
    .filter((player) => !state.ownedPlayerIds.includes(player.id))
    .sort((left, right) => {
      const leftAffordable = state.cash >= left.price;
      const rightAffordable = state.cash >= right.price;

      if (leftAffordable !== rightAffordable) {
        return leftAffordable ? -1 : 1;
      }

      return left.price - right.price;
    });

  elements.transferMarketGrid.innerHTML = sortedPlayers
    .map((player) => {
      const affordable = state.cash >= player.price;

        return `
          <article class="transfer-card tier-${player.tier.id}${affordable ? " affordable" : ""}">
            <div class="transfer-top">
              <div class="player-avatar">${player.initials}</div>
              <div>
                <h3 class="transfer-name">${player.name}</h3>
                <p class="transfer-role">${player.role}</p>
              </div>
              <div class="tier-badge ${player.tier.id}">${player.tier.label}</div>
            </div>
            <div class="transfer-stats">
              <div>
                <span>Power</span>
                <strong>${player.power}</strong>
            </div>
            <div>
              <span>Lead</span>
              <strong>${player.leadership}</strong>
            </div>
            <div>
              <span>Energy</span>
              <strong>${player.energy}</strong>
            </div>
          </div>
          <div class="transfer-tier-summary">
            <span>Tier</span>
            <strong>${player.tier.label}</strong>
            <span>Overall ${player.overall}</span>
          </div>
          <div class="transfer-footer">
            <div class="transfer-price">Transfer Fee<strong>$${formatNumber(player.price)}</strong></div>
            <button
              class="buy-player-button"
              type="button"
              data-player-id="${player.id}"
              onclick="window.goalKineticBuyPlayer && window.goalKineticBuyPlayer('${player.id}')"
            >
              ${affordable ? "Buy" : `Need $${formatNumber(player.price - state.cash)}`}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildPlayerCatalog() {
  const firstNames = ["Luca", "Mateo", "Ethan", "Felix", "Ruben", "Nico", "Adrian", "Jonah", "Marco", "Soren"];
  const lastNames = ["Silva", "Morgan", "Sato", "Ibrahim", "Dawson", "Romero", "Park", "Novak", "Costa", "Quinn"];
  const roles = ["Striker", "Winger", "Playmaker", "Midfielder", "Defender", "Finisher", "Anchor", "Goalkeeper"];
  const catalog = [];

  firstNames.forEach((firstName, firstIndex) => {
    lastNames.forEach((lastName, lastIndex) => {
      const seed = firstIndex * lastNames.length + lastIndex;
      const power = 54 + ((seed * 7) % 36);
      const leadership = 48 + ((seed * 11 + 9) % 38);
      const energy = 52 + ((seed * 13 + 5) % 34);
      const overall = power + leadership + energy;
      let price;

      if (seed < 20) {
        price = 8 + seed * 6;
      } else if (seed < 45) {
        price = 120 + (seed - 20) * 20;
      } else if (seed < 75) {
        price = 700 + (seed - 45) * 55;
      } else {
        price = 2500 + (seed - 75) * 120;
      }

      catalog.push({
        id: `player-${seed + 1}`,
        name: `${firstName} ${lastName}`,
        initials: `${firstName[0]}${lastName[0]}`,
        role: roles[seed % roles.length],
        power,
        leadership,
        energy,
        overall,
        tier: getPlayerTier(overall),
        price: Math.max(5, Math.round(price + Math.max(0, overall - 180))),
      });
    });
  });

  return catalog;
}

function buildSquadRows() {
  const lineupBoosts = getLineupBoosts();
  const assignedSlots = new Map(
    lineupSlots
      .map((slot) => [state.lineupAssignments?.[slot.id], slot.id])
      .filter(([playerId]) => Boolean(playerId))
  );

  const starters = squadBlueprint.map((player, index) => {
    const id = getStarterPlayerId(index);
    const assignedSlotId = assignedSlots.get(id) || null;

    return buildRosterPlayerCard({
      id,
      name: player.name,
      role: player.role,
      initials: player.initials,
      basePower: player.powerBase,
      baseLeadership: player.leadershipBase,
      baseEnergy: player.energyBase,
      assignedSlotId,
      lineupBoosts,
    });
  });

  const boughtPlayers = state.ownedPlayerIds
    .map((playerId) => playerCatalog.find((player) => player.id === playerId))
    .filter(Boolean)
    .map((player) =>
      buildRosterPlayerCard({
        id: player.id,
        name: player.name,
        role: player.role,
        initials: player.initials,
        basePower: player.power,
        baseLeadership: player.leadership,
        baseEnergy: player.energy,
        assignedSlotId: assignedSlots.get(player.id) || null,
        lineupBoosts,
      })
    );

  return [...starters, ...boughtPlayers].sort((left, right) => {
    if (left.assignedSlotId && !right.assignedSlotId) {
      return -1;
    }

    if (!left.assignedSlotId && right.assignedSlotId) {
      return 1;
    }

    return right.overall - left.overall;
  });
}

function buildRosterPlayerCard({
  id,
  name,
  role,
  initials,
  basePower,
  baseLeadership,
  baseEnergy,
  assignedSlotId,
  lineupBoosts,
}) {
  const inLineup = Boolean(assignedSlotId);
  const power = Math.round(clamp(basePower + (inLineup ? lineupBoosts.power : 0), 35, 99));
  const leadership = Math.round(
    clamp(baseLeadership + (inLineup ? lineupBoosts.leadership : 0), 35, 99)
  );
  const energy = Math.round(clamp(baseEnergy + (inLineup ? lineupBoosts.energy : 0), 35, 99));
  const overall = power + leadership + energy;
  const tier = getPlayerTier(overall);

  return {
    id,
    name,
    role,
    initials,
    basePower,
    baseLeadership,
    baseEnergy,
    assignedSlotId,
    inLineup,
    power,
    leadership,
    energy,
    overall,
    tier,
  };
}

function getLineupBoosts() {
  return {
    power: Math.round(
      state.goalsPerShot * 2 +
        state.upgrades["finishing-drills"] * 2 +
        state.upgrades["pressing-system"] * 2
    ),
    leadership: Math.round(
      Math.min(12, state.fans / 90) +
        state.upgrades["youth-academy"] * 2 +
        state.upgrades["night-fixture"] * 1.5
    ),
    energy: Math.round(
      state.upgrades["ball-boys"] * 3 +
        state.upgrades["pressing-system"] +
        Math.min(12, state.autoShotsPerSecond * 1.4)
    ),
  };
}

function getActiveLineupPlayers(players) {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  return lineupSlots
    .map((slot) => playerMap.get(state.lineupAssignments?.[slot.id]))
    .filter(Boolean);
}

function renderLineup(players) {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const filledSlots = lineupSlots.filter((slot) => state.lineupAssignments?.[slot.id]).length;
  const selectedSlot = getLineupSlot(runtime.selectedLineupSlot) || lineupSlots[0];

  elements.lineupCountDisplay.textContent = `${filledSlots}`;
  elements.lineupHintDisplay.textContent = `Selected ${selectedSlot.shortLabel}. Tap a roster card below to assign or swap players.`;

  elements.lineupGrid.innerHTML = lineupSlots
    .map((slot) => {
      const player = playerMap.get(state.lineupAssignments?.[slot.id]);
      const isSelected = runtime.selectedLineupSlot === slot.id;

      return `
        <article class="lineup-slot-card slot-${slot.id}${player ? " filled" : " empty"}${isSelected ? " selected" : ""}">
          <button
            class="lineup-slot-button"
            type="button"
            data-lineup-slot="${slot.id}"
            onpointerdown="window.goalKineticSelectLineupSlot && window.goalKineticSelectLineupSlot('${slot.id}')"
            onclick="window.goalKineticSelectLineupSlot && window.goalKineticSelectLineupSlot('${slot.id}')"
          >
            <span class="lineup-slot-label">${slot.shortLabel}</span>
            <strong>${player ? player.name : "Open Slot"}</strong>
            <span>${player ? player.role : slot.title}</span>
            ${player ? `<span class="lineup-slot-rating">${player.overall}</span>` : ""}
          </button>
          <button
            class="lineup-clear-button"
            type="button"
            data-clear-slot="${slot.id}"
            onpointerdown="window.goalKineticClearLineupSlot && window.goalKineticClearLineupSlot('${slot.id}')"
            onclick="window.goalKineticClearLineupSlot && window.goalKineticClearLineupSlot('${slot.id}')"
          >
            ${player ? "Bench" : "Empty"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderSquad(players, activeLineupPlayers) {
  const captainPool = activeLineupPlayers.length > 0 ? activeLineupPlayers : players;
  const captain =
    [...captainPool].sort((left, right) => right.leadership - left.leadership || right.power - left.power)[0] ||
    players[0];

  renderLineup(players);

  elements.captainAvatar.textContent = captain.initials;
  elements.captainNameDisplay.textContent = captain.name;
  elements.captainRoleDisplay.textContent = captain.assignedSlotId
    ? `${captain.role} / ${getLineupSlot(captain.assignedSlotId)?.shortLabel || "XI"}`
    : captain.role;
  elements.captainLeadershipDisplay.textContent = captain.leadership;
  elements.captainFinishingDisplay.textContent = captain.power;
  elements.captainEnergyDisplay.textContent = captain.energy;
  setSquadStatus(
    elements.squadStatusMessage?.textContent || "Select a slot, then tap a player below to set your starting eleven."
  );

  elements.squadGrid.innerHTML = players
    .map(
        (player) => `
        <article class="player-card tier-${player.tier.id}${player.inLineup ? " starting" : " bench"}">
          <div class="player-head">
            <div class="player-avatar">${player.initials}</div>
            <div>
              <h3 class="player-name">${player.name}</h3>
              <p class="player-role">${player.role}</p>
            </div>
            <div class="tier-badge ${player.tier.id}">${player.tier.label}</div>
          </div>
          <div class="player-status-row">
            <span class="player-pill ${player.inLineup ? "starting" : "bench"}">
              ${player.inLineup ? `Starting ${getLineupSlot(player.assignedSlotId)?.shortLabel || ""}` : "Bench"}
            </span>
            <span class="player-pill ${player.inLineup ? "boosted" : "muted"}">
              ${player.inLineup ? "Lineup Boost On" : "No Upgrade Boost"}
            </span>
            <span class="player-pill tier ${player.tier.id}">
              ${player.tier.label} Tier
            </span>
          </div>
          <div class="player-meta">
            <div>
              <span>Power</span>
              <strong>${player.power}</strong>
            </div>
            <div>
              <span>Lead</span>
              <strong>${player.leadership}</strong>
            </div>
            <div>
              <span>Energy</span>
              <strong>${player.energy}</strong>
            </div>
          </div>
          <div class="player-actions">
            <button
              class="assign-player-button"
              type="button"
              data-assign-player-id="${player.id}"
              onpointerdown="window.goalKineticAssignLineupPlayer && window.goalKineticAssignLineupPlayer('${player.id}')"
              onclick="window.goalKineticAssignLineupPlayer && window.goalKineticAssignLineupPlayer('${player.id}')"
            >
              ${player.inLineup && player.assignedSlotId === runtime.selectedLineupSlot
                ? `Starting ${getLineupSlot(player.assignedSlotId)?.shortLabel || ""}`
                : `${player.inLineup ? "Move to" : "Assign to"} ${(getLineupSlot(getNextLineupTarget(player.id)) || lineupSlots[0]).shortLabel}`}
            </button>
            <button
              class="bench-player-button"
              type="button"
              data-bench-player-id="${player.id}"
              onpointerdown="window.goalKineticBenchLineupPlayer && window.goalKineticBenchLineupPlayer('${player.id}')"
              onclick="window.goalKineticBenchLineupPlayer && window.goalKineticBenchLineupPlayer('${player.id}')"
              ${player.inLineup ? "" : "disabled"}
            >
              Bench
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function buildTeamPerformance(totalAccuracy, lineupPlayers) {
  const squadAverage =
    lineupPlayers.length > 0
      ? lineupPlayers.reduce(
          (totals, player) => ({
            leadership: totals.leadership + player.leadership,
            power: totals.power + player.power,
            energy: totals.energy + player.energy,
          }),
          { leadership: 0, power: 0, energy: 0 }
        )
      : { leadership: 0, power: 0, energy: 0 };

  const averageLeadership = lineupPlayers.length > 0 ? squadAverage.leadership / lineupPlayers.length : 0;
  const averagePower = lineupPlayers.length > 0 ? squadAverage.power / lineupPlayers.length : 0;
  const averageEnergy = lineupPlayers.length > 0 ? squadAverage.energy / lineupPlayers.length : 0;

  return {
    shootingPower: Math.round(clamp(averagePower + state.goalsPerShot * 3 + state.cashPerGoal * 2, 0, 99)),
    leadership: Math.round(clamp(averageLeadership + state.fans / 70, 0, 99)),
    passingFlow: Math.round(clamp(averageEnergy + state.autoShotsPerSecond * 4, 0, 99)),
    discipline: Math.round(clamp(100 - getMissChance() * 100 + totalAccuracy * 0.25, 0, 99)),
  };
}

function getNextUpgrade() {
  const ranked = upgradeDefinitions
    .map((upgrade) => ({
      ...upgrade,
      cost: getUpgradeCost(upgrade),
      affordable: state.cash >= getUpgradeCost(upgrade),
    }))
    .sort((left, right) => left.cost - right.cost);

  return (
    ranked.find((upgrade) => upgrade.affordable) ||
    ranked[0] || {
      name: "No upgrade",
      description: "Nothing available.",
      cost: 0,
      affordable: false,
      id: null,
    }
  );
}

function renderNextUpgrade(nextUpgrade) {
  elements.nextUpgradeName.textContent = nextUpgrade.name;
  elements.nextUpgradeDescription.textContent = nextUpgrade.description;

  if (!nextUpgrade.id) {
    elements.nextUpgradeBadge.textContent = "Empty";
    elements.nextUpgradeButton.textContent = "Buy Soon";
    elements.nextUpgradeButton.disabled = true;
    elements.nextUpgradeButton.onclick = null;
    return;
  }

  elements.nextUpgradeBadge.textContent = nextUpgrade.affordable ? "Affordable" : "Target";
  elements.nextUpgradeButton.textContent = nextUpgrade.affordable
    ? `Buy $${formatNumber(nextUpgrade.cost)}`
    : `Need $${formatNumber(nextUpgrade.cost)}`;
  elements.nextUpgradeButton.disabled = !nextUpgrade.affordable;
  elements.nextUpgradeButton.onclick = () => buyUpgrade(nextUpgrade.id);
}

function getDivisionInfo() {
  let previousTarget = 0;

  for (let index = 0; index < divisionThresholds.length; index += 1) {
    const target = divisionThresholds[index];

    if (state.goals < target) {
      return {
        name: divisionNames[index],
        current: state.goals - previousTarget,
        target: target - previousTarget,
        progress: (state.goals - previousTarget) / (target - previousTarget),
      };
    }

    previousTarget = target;
  }

  return {
    name: divisionNames[divisionNames.length - 1],
    current: state.goals - previousTarget,
    target: divisionThresholds[divisionThresholds.length - 1],
    progress: 1,
  };
}

function gameLoop(now) {
  const deltaSeconds = Math.min((now - runtime.lastFrame) / 1000, 0.25);
  runtime.lastFrame = now;

  runtime.buzz = clamp(runtime.buzz - deltaSeconds * 5.5, 0, 100);
  const currentBuzzInt = Math.round(runtime.buzz);
  runtime.pendingAutoShots += state.autoShotsPerSecond * deltaSeconds;

  const autoShots = Math.floor(runtime.pendingAutoShots);
  if (autoShots > 0) {
    runtime.pendingAutoShots -= autoShots;
    let hits = 0;

    for (let shotIndex = 0; shotIndex < autoShots; shotIndex += 1) {
      if (rollHitChance()) {
        hits += 1;
      }
    }

    const misses = autoShots - hits;

    if (now - runtime.lastAutoVisualAt > 420) {
      runtime.lastAutoVisualAt = now;
      const sampleHit = hits > 0 && (misses === 0 || Math.random() > 0.5);
      animateShot(
        50 + (Math.random() * 10 - 5),
        78,
        sampleHit ? randomHitTarget() : randomMissTarget(),
        sampleHit
      );
    }

    queueAutoResolution({ shots: autoShots, hits, misses });

    if (now - runtime.lastAutoTickerAt > 2200) {
      runtime.lastAutoTickerAt = now;
      setTicker("Your squad keeps firing on autopilot.");
    }
  }

  if (currentBuzzInt !== runtime.lastRenderedBuzzInt) {
    runtime.lastRenderedBuzzInt = currentBuzzInt;
    render();
  }

  if (Date.now() - runtime.lastLeaderboardUpdateAt >= LEADERBOARD_TICK_MS) {
    runtime.lastLeaderboardUpdateAt = Date.now();
    if (progressRivalClubs(LEADERBOARD_TICK_MS)) {
      render();
    }
  }

  if (now - runtime.lastSaveAt > 5000) {
    saveState();
  }

  requestAnimationFrame(gameLoop);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  if (value >= 100) {
    return Math.round(value).toString();
  }

  return value.toFixed(1).replace(".0", "");
}
