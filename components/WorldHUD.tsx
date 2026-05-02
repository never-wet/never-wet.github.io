"use client";

import { useState } from "react";
import { CharacterCustomizer } from "./CharacterCustomizer";
import { Minimap } from "./Minimap";
import { getTimeLabel } from "../lib/worldData";
import { useWorldStore } from "../store/useWorldStore";

export function WorldHUD() {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const activeBuilding = useWorldStore((state) => state.activeBuilding());
  const selectedBuildingId = useWorldStore((state) => state.selectedBuildingId);
  const selectedBuilding = useWorldStore((state) => state.buildings.find((building) => building.id === selectedBuildingId));
  const timeOfDay = useWorldStore((state) => state.timeOfDay);
  const autoCycle = useWorldStore((state) => state.autoCycle);
  const setTimeOfDay = useWorldStore((state) => state.setTimeOfDay);
  const setAutoCycle = useWorldStore((state) => state.setAutoCycle);
  const npcChatOpen = useWorldStore((state) => state.npcChatOpen);
  const openNpcChat = useWorldStore((state) => state.openNpcChat);
  const closeNpcChat = useWorldStore((state) => state.closeNpcChat);
  const askNpc = useWorldStore((state) => state.askNpc);
  const npcMessages = useWorldStore((state) => state.npcMessages);

  return (
    <>
      <div className="hud" aria-live="polite">
        <div className="brand-lockup">
          <strong>Never Wet</strong>
          <span>Playable homepage</span>
        </div>
        <aside className="target-panel" aria-label="Current destination">
          <small>Nearby portal</small>
          <strong>{activeBuilding?.name ?? selectedBuilding?.name ?? "Central Plaza"}</strong>
          <p>{activeBuilding?.hint ?? selectedBuilding?.hint ?? "Move through the plaza. Buildings are portals."}</p>
        </aside>
        <Minimap />
        <div className="help-strip" aria-label="Controls">
          <kbd>WASD</kbd>
          <span>move</span>
          <kbd>Drag</kbd>
          <span>look</span>
          <kbd>Click</kbd>
          <span>walk or target</span>
          <kbd>E</kbd>
          <span>enter</span>
        </div>
      </div>

      <div className="world-tools" aria-label="World tools">
        <button className={`tool-button ${customizerOpen ? "is-active" : ""}`} type="button" onClick={() => setCustomizerOpen((open) => !open)}>C</button>
        <button className={`tool-button ${timeOpen ? "is-active" : ""}`} type="button" onClick={() => setTimeOpen((open) => !open)}>T</button>
        <button className={`tool-button ${npcChatOpen ? "is-active" : ""}`} type="button" onClick={() => openNpcChat("intro")}>G</button>
      </div>

      {customizerOpen ? <CharacterCustomizer /> : null}

      {timeOpen ? (
        <section className="floating-panel time-panel is-open" aria-label="Day night controls">
          <header>
            <div>
              <small>Atmosphere</small>
              <strong>Day / Night Cycle</strong>
            </div>
          </header>
          <div className="panel-body">
            <div className="time-readout">
              <span>{getTimeLabel(timeOfDay)}</span>
              <button className={`choice-pill ${autoCycle ? "is-active" : ""}`} type="button" onClick={() => setAutoCycle(!autoCycle)}>
                {autoCycle ? "Auto On" : "Auto Off"}
              </button>
            </div>
            <input type="range" min={0} max={1} step={0.001} value={timeOfDay} onChange={(event) => {
              setAutoCycle(false);
              setTimeOfDay(Number(event.currentTarget.value));
            }} />
          </div>
        </section>
      ) : null}

      {npcChatOpen ? (
        <section className="floating-panel npc-chat is-open" aria-label="AI guide chat">
          <header>
            <div>
              <small>Guide</small>
              <strong>Hub Concierge</strong>
            </div>
            <button className="panel-close" type="button" onClick={closeNpcChat}>x</button>
          </header>
          <div className="panel-body">
            <div className="npc-chat-log">
              {npcMessages.map((message) => (
                <div key={message.id} className={`chat-message ${message.from === "user" ? "is-user" : ""}`}>{message.text}</div>
              ))}
            </div>
            <div className="npc-quick-actions">
              {["portfolio", "ai-lab", "stock-terminal", "music-studio", "galaxy-lab", "recommend"].map((topic) => (
                <button key={topic} className="choice-pill" type="button" onClick={() => askNpc(topic)}>
                  {topic.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
