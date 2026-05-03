"use client";

import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Bug, Compass, DoorOpen, Map, RotateCcw, Save, Settings, Volume2, VolumeX, X } from "lucide-react";
import { npcs } from "../game/data/npcs";
import { portals } from "../game/data/portals";
import { EXTERIOR_WIDTH, worldMap } from "../game/data/worldMap";
import { getCurrentQuest, getQuestProgress, getQuestTarget } from "../game/systems/QuestSystem";
import { createMiniGame, miniGameAttack, miniGameDodge } from "../game/systems/MiniGameManager";
import { clearSave } from "../game/systems/SaveSystem";
import { useWorldStore, type DialogueChoice, type MiniGameState } from "../store/useWorldStore";

export function HUD() {
  const player = useWorldStore((state) => state.player);
  const prompt = useWorldStore((state) => state.prompt);
  const dialogue = useWorldStore((state) => state.dialogue);
  const quests = useWorldStore((state) => state.quests);
  const activeQuestId = useWorldStore((state) => state.activeQuestId);
  const notifications = useWorldStore((state) => state.notifications);
  const weather = useWorldStore((state) => state.weather);
  const dayPhase = useWorldStore((state) => state.dayPhase);
  const dayProgress = useWorldStore((state) => state.dayProgress);
  const path = useWorldStore((state) => state.path);
  const miniGame = useWorldStore((state) => state.miniGame);
  const settings = useWorldStore((state) => state.settings);
  const debugCollision = useWorldStore((state) => state.debugCollision);
  const currentInteriorId = useWorldStore((state) => state.currentInteriorId);
  const visitedPortals = useWorldStore((state) => state.visitedPortals);
  const unlocked = useWorldStore((state) => state.unlocked);
  const destinationTile = useWorldStore((state) => state.destinationTile);
  const setSettings = useWorldStore((state) => state.setSettings);
  const requestPathTo = useWorldStore((state) => state.requestPathTo);
  const requestTeleport = useWorldStore((state) => state.requestTeleport);
  const clearPath = useWorldStore((state) => state.clearPath);
  const advanceDialogue = useWorldStore((state) => state.advanceDialogue);
  const closeDialogue = useWorldStore((state) => state.closeDialogue);
  const chooseDialogue = useWorldStore((state) => state.chooseDialogue);
  const dismissNotification = useWorldStore((state) => state.dismissNotification);
  const setMiniGame = useWorldStore((state) => state.setMiniGame);
  const startMiniGame = useWorldStore((state) => state.startMiniGame);
  const progressQuest = useWorldStore((state) => state.progressQuest);
  const saveGame = useWorldStore((state) => state.saveGame);
  const toggleDebugCollision = useWorldStore((state) => state.toggleDebugCollision);
  const pushNotification = useWorldStore((state) => state.pushNotification);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [visibleText, setVisibleText] = useState("");
  const currentQuest = getCurrentQuest(quests, activeQuestId);
  const currentLine = dialogue?.lines[dialogue.index] ?? null;
  const questProgress = currentQuest ? getQuestProgress(currentQuest) : null;
  const questTarget = getQuestTarget(currentQuest);
  const activeObjective = currentQuest?.objectives.find((objective) => objective.progress < objective.required) ?? null;
  const discoveredCount = visitedPortals.length;
  const totalPortals = portals.length;
  const routeSteps = path.length > 1 ? path.length - 1 : 0;
  const routeDistance = destinationTile
    ? Math.abs(destinationTile.x - player.tileX) + Math.abs(destinationTile.y - player.tileY)
    : questTarget
      ? Math.abs(questTarget.x - player.tileX) + Math.abs(questTarget.y - player.tileY)
      : null;
  const currentInterior = useMemo(
    () => portals.find((portal) => portal.id === currentInteriorId)?.interior ?? null,
    [currentInteriorId]
  );
  const mapBounds = useMemo(
    () =>
      currentInterior
        ? {
            x: currentInterior.x,
            y: currentInterior.y,
            width: currentInterior.width,
            height: currentInterior.height
          }
        : {
            x: 0,
            y: 0,
            width: EXTERIOR_WIDTH,
            height: worldMap.height
          },
    [currentInterior]
  );

  useEffect(() => {
    if (!currentLine) {
      const resetTimer = window.setTimeout(() => setVisibleText(""), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const resetTimer = window.setTimeout(() => {
      setVisibleText("");
    }, 0);

    let index = 0;
    const timer = window.setInterval(() => {
      index += 2;
      setVisibleText(currentLine.text.slice(0, index));

      if (index >= currentLine.text.length) {
        window.clearInterval(timer);
      }
    }, 18);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(timer);
    };
  }, [currentLine]);

  const minimapPath = useMemo(
    () =>
      path
        .map((point) => `${((point.x - mapBounds.x) / mapBounds.width) * 100},${((point.y - mapBounds.y) / mapBounds.height) * 100}`)
        .join(" "),
    [mapBounds, path]
  );

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(mapBounds.x + ((event.clientX - rect.left) / rect.width) * mapBounds.width);
    const y = Math.round(mapBounds.y + ((event.clientY - rect.top) / rect.height) * mapBounds.height);

    requestPathTo({ x, y });
  };

  const markerStyle = (x: number, y: number) => ({
    left: `${((x - mapBounds.x) / mapBounds.width) * 100}%`,
    top: `${((y - mapBounds.y) / mapBounds.height) * 100}%`
  });
  const isInMap = (x: number, y: number) =>
    x >= mapBounds.x && y >= mapBounds.y && x <= mapBounds.x + mapBounds.width && y <= mapBounds.y + mapBounds.height;
  const showQuestTarget = questTarget ? isInMap(questTarget.x, questTarget.y) : false;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.target instanceof HTMLInputElement) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "j") {
        setGuideOpen((open) => !open);
      } else if (key === "p") {
        setDirectoryOpen((open) => !open);
      } else if (key === "m") {
        setMapOpen((open) => !open);
      } else if (key === "o") {
        setSettingsOpen((open) => !open);
      } else if (key === "u") {
        requestTeleport(worldMap.spawn, null);
      } else if (key === "escape") {
        setGuideOpen(false);
        setDirectoryOpen(false);
        setMapOpen(false);
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestTeleport]);

  const handleQuestPath = () => {
    if (questTarget) {
      requestPathTo(questTarget);
    }
  };

  const handleSave = () => {
    saveGame();
    pushNotification("Game saved.");
  };

  const handleUnstuck = () => {
    requestTeleport(worldMap.spawn, null);
  };

  const handleReset = () => {
    clearSave();
    window.location.reload();
  };

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.openMiniGame) {
      startMiniGame(createMiniGame(choice.openMiniGame));
      chooseDialogue(choice);
      return;
    }

    chooseDialogue(choice);
  };

  const handleMiniGameUpdate = (next: MiniGameState) => {
    setMiniGame(next);
  };

  const handleClaimMiniGame = () => {
    if (!miniGame) {
      return;
    }

    if (miniGame.result === "won" && miniGame.questReward) {
      progressQuest(miniGame.questReward.questId, miniGame.questReward.objectiveId);
    }

    setMiniGame(null);
    saveGame();
  };

  const renderMapField = (large = false) => (
    <div className={large ? "mini-map__field mini-map__field--large" : "mini-map__field"} onClick={handleMapClick} role="button" tabIndex={0}>
      {!currentInterior
        ? worldMap.zones.map((zone) => (
            <span
              className={`map-zone map-zone--${zone.id}`}
              key={zone.id}
              style={{
                left: `${((zone.bounds.x - mapBounds.x) / mapBounds.width) * 100}%`,
                top: `${((zone.bounds.y - mapBounds.y) / mapBounds.height) * 100}%`,
                width: `${(zone.bounds.width / mapBounds.width) * 100}%`,
                height: `${(zone.bounds.height / mapBounds.height) * 100}%`
              }}
            />
          ))
        : null}
      <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {minimapPath ? <polyline points={minimapPath} /> : null}
      </svg>
      {!currentInterior
        ? portals.map((portal) => (
            <span
              className="map-building"
              data-visited={visitedPortals.includes(portal.id)}
              key={portal.id}
              style={markerStyle(portal.door.x + 0.5, portal.door.y + 0.5)}
            />
          ))
        : null}
      {!currentInterior
        ? npcs.map((npc) => <span className="map-npc" key={npc.id} style={markerStyle(npc.x, npc.y)} />)
        : null}
      {currentInterior ? <span className="map-building" style={markerStyle(currentInterior.exit.x + 0.5, currentInterior.exit.y + 0.5)} /> : null}
      {questTarget && showQuestTarget ? <span className="map-target" style={markerStyle(questTarget.x, questTarget.y)} /> : null}
      <span className="map-player" style={markerStyle(player.tileX, player.tileY)} />
    </div>
  );

  return (
    <div className="hud-layer">
      <section className="quest-panel" aria-label="Current quest">
        <div className="panel-title">
          <Compass size={17} aria-hidden="true" />
          <span>{currentQuest?.title ?? "Free Explore"}</span>
        </div>
        <p>{currentQuest?.summary ?? "All active quests are complete. Explore any building interior."}</p>
        {currentQuest ? (
          <>
            <div className="objective-list">
              {currentQuest.objectives.map((objective) => (
                <div className="objective-row" data-done={objective.progress >= objective.required} key={objective.id}>
                  <span className="objective-check" aria-hidden="true" />
                  <span>{objective.label}</span>
                  <b>
                    {objective.progress}/{objective.required}
                  </b>
                </div>
              ))}
            </div>
            <div className="task-meter">
              <span style={{ width: `${questProgress ? (questProgress.completed / questProgress.total) * 100 : 0}%` }} />
            </div>
            {questTarget ? (
              <button className="small-command" onClick={handleQuestPath} type="button">
                Show Route
              </button>
            ) : null}
            {routeSteps > 0 ? (
              <button className="small-command small-command--quiet" onClick={clearPath} type="button">
                Clear Route
              </button>
            ) : null}
            <div className="route-readout">
              <span>{activeObjective?.label ?? "Explore freely"}</span>
              <b>{routeSteps > 0 ? `${routeSteps} steps` : routeDistance !== null ? `${routeDistance} tiles away` : `${discoveredCount}/${totalPortals} rooms found`}</b>
            </div>
          </>
        ) : null}
      </section>

      <section className="status-strip" aria-label="World status">
        <span>{dayPhase}</span>
        <span>{weather}</span>
        <span>{Math.round(dayProgress * 24)}:00</span>
        <span>{currentInterior ? currentInterior.title : "Overworld"}</span>
      </section>

      <section className="mini-map" aria-label="Minimap">
        <div className="panel-title">
          <Map size={17} aria-hidden="true" />
          <span>Map</span>
        </div>
        {renderMapField()}
      </section>

      <nav className="quick-bar" aria-label="Game tools">
        <button className="tool-button" onClick={() => setGuideOpen((open) => !open)} type="button" aria-label="Quest journal">
          <BookOpen size={17} aria-hidden="true" />
          <kbd>J</kbd>
        </button>
        <button className="tool-button" onClick={() => setDirectoryOpen((open) => !open)} type="button" aria-label="Building directory">
          <DoorOpen size={17} aria-hidden="true" />
          <kbd>P</kbd>
        </button>
        <button className="tool-button" onClick={() => setMapOpen((open) => !open)} type="button" aria-label="Expanded map">
          <Map size={17} aria-hidden="true" />
          <kbd>M</kbd>
        </button>
      </nav>

      <button className="settings-button" onClick={() => setSettingsOpen((open) => !open)} type="button" aria-label="Settings">
        <Settings size={18} aria-hidden="true" />
      </button>

      {settingsOpen ? (
        <section className="settings-panel">
          <div className="panel-title">
            {settings.muted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
            <span>Audio</span>
          </div>
          <label>
            Music
            <input
              max="1"
              min="0"
              step="0.05"
              type="range"
              value={settings.musicVolume}
              onChange={(event) => setSettings({ musicVolume: Number(event.target.value) })}
            />
          </label>
          <label>
            SFX
            <input
              max="1"
              min="0"
              step="0.05"
              type="range"
              value={settings.sfxVolume}
              onChange={(event) => setSettings({ sfxVolume: Number(event.target.value) })}
            />
          </label>
          <button className="small-command" onClick={() => setSettings({ muted: !settings.muted })} type="button">
            {settings.muted ? "Unmute" : "Mute"}
          </button>
          <div className="panel-title settings-panel__subhead">
            <Bug size={17} aria-hidden="true" />
            <span>Debug</span>
          </div>
          <button className="small-command" data-active={debugCollision} onClick={toggleDebugCollision} type="button">
            {debugCollision ? "Hide Grid Debug" : "Show Grid Debug"}
          </button>
          <div className="panel-title settings-panel__subhead">
            <Save size={17} aria-hidden="true" />
            <span>Game</span>
          </div>
          <button className="small-command" onClick={handleSave} type="button">
            Save Now
          </button>
          <button className="small-command" onClick={handleUnstuck} type="button">
            Unstuck
          </button>
          <button className="small-command small-command--danger" onClick={handleReset} type="button">
            <RotateCcw size={15} aria-hidden="true" />
            Reset Save
          </button>
        </section>
      ) : null}

      {guideOpen ? (
        <section className="codex-panel codex-panel--wide" aria-label="Quest journal">
          <div className="codex-panel__head">
            <div className="panel-title">
              <BookOpen size={17} aria-hidden="true" />
              <span>Field Guide</span>
            </div>
            <button className="icon-button" onClick={() => setGuideOpen(false)} type="button" aria-label="Close field guide">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="codex-grid">
            {Object.values(quests).map((quest) => {
              const progress = getQuestProgress(quest);
              const target = getQuestTarget(quest);

              return (
                <article className="quest-card" data-status={quest.status} key={quest.id}>
                  <div className="quest-card__top">
                    <h3>{quest.title}</h3>
                    <span>{quest.status}</span>
                  </div>
                  <p>{quest.summary}</p>
                  <div className="objective-list objective-list--compact">
                    {quest.objectives.map((objective) => (
                      <div className="objective-row" data-done={objective.progress >= objective.required} key={objective.id}>
                        <span className="objective-check" aria-hidden="true" />
                        <span>{objective.label}</span>
                        <b>
                          {objective.progress}/{objective.required}
                        </b>
                      </div>
                    ))}
                  </div>
                  <div className="task-meter">
                    <span style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
                  </div>
                  {target && quest.status === "active" ? (
                    <button className="small-command" onClick={() => requestPathTo(target)} type="button">
                      Route Objective
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {directoryOpen ? (
        <section className="codex-panel" aria-label="Building directory">
          <div className="codex-panel__head">
            <div className="panel-title">
              <DoorOpen size={17} aria-hidden="true" />
              <span>Building Directory</span>
            </div>
            <button className="icon-button" onClick={() => setDirectoryOpen(false)} type="button" aria-label="Close directory">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="codex-note">
            Rooms discovered: {discoveredCount}/{totalPortals}
          </p>
          <div className="portal-list">
            {portals.map((portal) => {
              const visited = visitedPortals.includes(portal.id);
              const locked = Boolean(portal.lockedBy && !unlocked[portal.id] && !unlocked[portal.lockedBy]);

              return (
                <article className="portal-row" data-locked={locked} data-visited={visited} key={portal.id}>
                  <div>
                    <h3>{portal.name}</h3>
                    <p>{portal.description}</p>
                  </div>
                  <span>{locked ? "Locked" : visited ? "Visited" : "Unvisited"}</span>
                  <button className="small-command" onClick={() => requestPathTo(portal.door)} type="button">
                    Route Door
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {mapOpen ? (
        <section className="codex-panel map-panel-large" aria-label="Expanded map">
          <div className="codex-panel__head">
            <div className="panel-title">
              <Map size={17} aria-hidden="true" />
              <span>Area Map</span>
            </div>
            <button className="icon-button" onClick={() => setMapOpen(false)} type="button" aria-label="Close map">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {renderMapField(true)}
          <p className="codex-note">Click the map to set an A* route. Blue marks buildings, green marks NPCs, gold marks you.</p>
        </section>
      ) : null}

      {prompt ? (
        <div className="interaction-prompt" role="status">
          <kbd>E</kbd>
          <span>{prompt.action}</span>
          <strong>{prompt.label}</strong>
        </div>
      ) : null}

      <div className="notification-stack" aria-live="polite">
        {notifications.map((notification) => (
          <button className="toast" key={notification.id} onClick={() => dismissNotification(notification.id)} type="button">
            {notification.text}
          </button>
        ))}
      </div>

      {currentLine ? (
        <section className="dialogue-box" data-mood={currentLine.mood ?? "calm"} aria-live="polite">
          <div className="dialogue-box__speaker">{currentLine.speaker}</div>
          <p>{visibleText}</p>
          <div className="dialogue-box__actions">
            <button className="icon-button" onClick={closeDialogue} type="button" aria-label="Close dialogue">
              <X size={18} aria-hidden="true" />
            </button>
            {dialogue && dialogue.index >= dialogue.lines.length - 1 && dialogue.choices.length > 0 ? (
              dialogue.choices.map((choice) => (
                <button className="next-button" key={choice.id} onClick={() => handleChoice(choice)} type="button">
                  {choice.label}
                </button>
              ))
            ) : (
              <button className="next-button" onClick={advanceDialogue} type="button">
                Next
              </button>
            )}
          </div>
        </section>
      ) : null}

      {miniGame ? (
        <section className="mini-game-panel">
          <h2>{miniGame.title}</h2>
          <p>{miniGame.message}</p>
          <div className="combat-bars">
            <span style={{ width: `${(miniGame.playerHp / 20) * 100}%` }} />
            <span style={{ width: `${(miniGame.enemyHp / 22) * 100}%` }} />
          </div>
          <div className="timing-meter">
            <span className="timing-band" />
            <span className="timing-cursor" style={{ left: `${miniGame.meter * 100}%` }} />
          </div>
          <div className="dialogue-box__actions">
            {miniGame.result === "playing" ? (
              <>
                <button className="next-button" onClick={() => handleMiniGameUpdate(miniGameAttack(miniGame))} type="button">
                  Attack
                </button>
                <button className="next-button" onClick={() => handleMiniGameUpdate(miniGameDodge(miniGame))} type="button">
                  Dodge
                </button>
              </>
            ) : (
              <button className="next-button" onClick={handleClaimMiniGame} type="button">
                {miniGame.result === "won" ? "Claim Reward" : "Close"}
              </button>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
