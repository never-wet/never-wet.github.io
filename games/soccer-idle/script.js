const STORAGE_KEY = "neverwet-soccer-idle-save-v2";
const MAX_OFFLINE_SECONDS = 60 * 60 * 4;
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

const upgradeDefinitions = [
  {
    id: "ball-boys",
    name: "Ball Boys",
    icon: "⚽",
    description: "More balls, less downtime. Keeps shots flowing constantly.",
    baseCost: 18,
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
    baseCost: 30,
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
    baseCost: 48,
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
    baseCost: 76,
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
    baseCost: 120,
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
    baseCost: 185,
    growth: 1.8,
    effectText: "+1.5 auto shots / sec, +1 goal / shot",
    apply: (state) => {
      state.autoShotsPerSecond += 1.5;
      state.goalsPerShot += 1;
    },
  },
];

const state = loadState();
const runtime = {
  buzz: 0,
  pendingAutoShots: 0,
  lastFrame: performance.now(),
  lastSaveAt: 0,
  lastAutoVisualAt: 0,
  lastAutoTickerAt: 0,
  shotAnimationToken: 0,
  flashTimeout: 0,
};

const elements = {
  cashDisplay: document.getElementById("cashDisplay"),
  goalsDisplay: document.getElementById("goalsDisplay"),
  perSecondDisplay: document.getElementById("perSecondDisplay"),
  fansDisplay: document.getElementById("fansDisplay"),
  buzzDisplay: document.getElementById("buzzDisplay"),
  divisionNameDisplay: document.getElementById("divisionNameDisplay"),
  divisionProgressText: document.getElementById("divisionProgressText"),
  divisionProgressFill: document.getElementById("divisionProgressFill"),
  cashPerGoalDisplay: document.getElementById("cashPerGoalDisplay"),
  goalsPerShotDisplay: document.getElementById("goalsPerShotDisplay"),
  autoShotsDisplay: document.getElementById("autoShotsDisplay"),
  upgradeGrid: document.getElementById("upgradeGrid"),
  field: document.getElementById("field"),
  fieldTapButton: document.getElementById("fieldTapButton"),
  ball: document.getElementById("ball"),
  goalFlash: document.getElementById("goalFlash"),
  eventTicker: document.getElementById("eventTicker"),
  floatingLayer: document.getElementById("floatingLayer"),
};

buildUpgradeCards();
attachEvents();
applyOfflineProgress();
render();
requestAnimationFrame(gameLoop);

function createDefaultState() {
  return {
    version: 2,
    cash: 0,
    goals: 0,
    fans: 0,
    cashPerGoal: 1,
    goalsPerShot: 1,
    autoShotsPerSecond: 0,
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

function saveState() {
  state.lastActiveAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  runtime.lastSaveAt = performance.now();
}

function applyOfflineProgress() {
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
    `Welcome back. Your club played ${formatNumber(offlineShots)} auto shots and earned $${formatNumber(rewards.payout)}.`
  );
  spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, 68, 22, "upgrade");
  saveState();
}

function buildUpgradeCards() {
  elements.upgradeGrid.innerHTML = "";

  upgradeDefinitions.forEach((upgrade) => {
    const card = document.createElement("article");
    card.className = "upgrade-card";
    card.dataset.id = upgrade.id;
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
        <span id="cost-${upgrade.id}" class="buy-cost">$0</span>
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

function takeManualShot(originX, originY) {
  runtime.buzz = clamp(runtime.buzz + 12, 0, 100);
  const rewards = resolveShotBatch(1, { manual: true });

  animateShot(originX, originY, randomTarget());
  showGoalFlash(`+$${formatNumber(rewards.payout)}`);
  pulseStage();
  spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, originX, originY - 4, "cash");
  spawnRipple(originX, originY);

  setTicker(
    `Cracking finish. ${formatNumber(rewards.goals)} goal and $${formatNumber(rewards.payout)} from the shot.`
  );

  render();
}

function resolveShotBatch(shots, options = {}) {
  const manualMultiplier = options.manual ? 1 + runtime.buzz / 240 : 1;
  const goalsMade = shots * state.goalsPerShot;
  const payout = goalsMade * state.cashPerGoal * manualMultiplier;
  const fanGain = Math.max(1, Math.round(goalsMade * (options.manual ? 2.4 : 0.95)));

  state.goals += goalsMade;
  state.cash += payout;
  state.fans += fanGain;

  return { goals: goalsMade, payout, fanGain };
}

function animateShot(originX, originY, target) {
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

  requestAnimationFrame(() => {
    elements.ball.classList.add("shooting");
  });

  window.setTimeout(() => {
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

function randomTarget() {
  const rightSide = Math.random() > 0.5;
  return {
    x: rightSide ? 58 + Math.random() * 15 : 28 + Math.random() * 15,
    y: 18 + Math.random() * 9,
  };
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
  const cashPerSecond = state.autoShotsPerSecond * state.goalsPerShot * state.cashPerGoal;
  const division = getDivisionInfo();

  elements.cashDisplay.textContent = `$${formatNumber(state.cash)}`;
  elements.goalsDisplay.textContent = formatNumber(state.goals);
  elements.perSecondDisplay.textContent = `$${formatNumber(cashPerSecond)}`;
  elements.fansDisplay.textContent = formatNumber(state.fans);
  elements.buzzDisplay.textContent = `${Math.round(runtime.buzz)}%`;
  elements.divisionNameDisplay.textContent = division.name;
  elements.divisionProgressText.textContent = `${formatNumber(division.current)} / ${formatNumber(division.target)} goals`;
  elements.divisionProgressFill.style.width = `${division.progress * 100}%`;
  elements.cashPerGoalDisplay.textContent = `$${formatNumber(state.cashPerGoal)}`;
  elements.goalsPerShotDisplay.textContent = formatNumber(state.goalsPerShot);
  elements.autoShotsDisplay.textContent = `${formatNumber(state.autoShotsPerSecond)}/s`;

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
    costLabel.textContent = `$${formatNumber(cost)}`;
    fill.style.width = `${affordableProgress * 100}%`;
    card.classList.toggle("affordable", state.cash >= cost);
  });
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
  runtime.pendingAutoShots += state.autoShotsPerSecond * deltaSeconds;

  const autoShots = Math.floor(runtime.pendingAutoShots);
  if (autoShots > 0) {
    runtime.pendingAutoShots -= autoShots;
    const rewards = resolveShotBatch(autoShots, { manual: false });

    if (now - runtime.lastAutoVisualAt > 420) {
      runtime.lastAutoVisualAt = now;
      animateShot(50 + (Math.random() * 10 - 5), 78, randomTarget());
      spawnRewardBubble(`+$${formatNumber(rewards.payout)}`, 50, 62, "cash");
    }

    if (now - runtime.lastAutoTickerAt > 2200) {
      runtime.lastAutoTickerAt = now;
      setTicker(`Your squad keeps scoring on autopilot for $${formatNumber(rewards.payout)}.`);
    }

    render();
  } else {
    render();
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
