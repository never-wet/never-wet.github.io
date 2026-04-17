import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActivityLog } from "../components/dashboard/ActivityLog";
import { InventoryPanel } from "../components/escape/InventoryPanel";
import { EscapeRoomScene } from "../components/escape/EscapeRoomScene";
import { PageHero } from "../components/layout/PageHero";
import { useGame } from "../hooks/useGame";
import { getRoomProgress as buildRoomProgress, getRoomStatus, hasAllItems, isTransitionAvailable } from "../lib/game/progression";
import { getRoomById } from "../lib/game/progression";

export function EscapeRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { state, startRoom, moveToScene, inspectHotspot, combineItems, completeRoom, rooms } = useGame();
  const [sceneMessage, setSceneMessage] = useState<string>("");

  const room = roomId ? getRoomById(roomId) : undefined;
  const roomProgress = room ? buildRoomProgress(room, state) : undefined;
  const roomStatus = room ? getRoomStatus(room, state) : "locked";

  useEffect(() => {
    if (room && roomStatus !== "locked") {
      startRoom(room.id);
    }
  }, [room?.id, roomStatus, startRoom, room]);

  if (!room || !roomProgress) {
    return (
      <div className="page page--stack">
        <PageHero eyebrow="Escape Mode" title="Room not found" description="The requested room is not in the registry." />
        <Link to="/escape" className="button button--primary">
          Back to Escape Mode
        </Link>
      </div>
    );
  }

  const currentSceneId = roomProgress.currentSceneId || room.scenes[0].id;
  const currentTransitions = room.transitions[currentSceneId] ?? [];
  const finalScene = room.scenes[room.scenes.length - 1];
  const finalRequirements = finalScene.hotspots[0]?.requiresItemIds ?? [];
  const canEscape = currentSceneId === finalScene.id && hasAllItems(state, finalRequirements);

  return (
    <div className="page page--stack">
      <PageHero eyebrow="Escape Room" title={room.title} description={room.tagline} />

      {roomStatus === "locked" ? (
        <section className="panel">
          <h2>Room locked</h2>
          <p>{room.unlock.description ?? "Solve more content to unlock this room."}</p>
          <Link to="/escape" className="button button--primary">
            Back to Escape Mode
          </Link>
        </section>
      ) : (
        <>
          <section className="escape-meta">
            <article className="panel">
              <span className="eyebrow">Objective</span>
              <h2>{room.exitGoal}</h2>
              <p>{room.intro}</p>
            </article>
            <article className="panel">
              <span className="eyebrow">Progress</span>
              <h2>{roomProgress.visitedSceneIds.length}/{room.scenes.length} scenes visited</h2>
              <p>{roomProgress.discoveredHotspotIds.length} hotspots discovered and {roomProgress.collectedItemIds.length} inventory items collected.</p>
            </article>
          </section>

          <div className="escape-grid">
            <EscapeRoomScene
              room={room}
              currentSceneId={currentSceneId}
              foundHotspotIds={roomProgress.discoveredHotspotIds}
              transitions={currentTransitions.map((definition) => ({
                definition,
                available: isTransitionAvailable(definition, roomProgress, state),
              }))}
              onTransition={(sceneId) => moveToScene(room.id, sceneId)}
              onInspect={(hotspotId) => {
                const result = inspectHotspot(room.id, currentSceneId, hotspotId);
                setSceneMessage(result.message);
                if (result.status === "needs-puzzle") {
                  navigate(`/puzzle/${result.puzzleId}`);
                }
              }}
            />

            <div className="escape-grid__side">
              <InventoryPanel room={room} collectedItemIds={roomProgress.collectedItemIds} onCombine={(first, second) => combineItems(room.id, first, second)} />
              <section className="panel">
                <div className="section-heading">
                  <h2>Scene Log</h2>
                </div>
                <p>{sceneMessage || "Inspect a hotspot to reveal clues, items, or linked puzzle prompts."}</p>
                <div className="scene-chip-list">
                  {room.scenes.map((scene) => (
                    <span
                      key={scene.id}
                      className={`scene-chip ${roomProgress.currentSceneId === scene.id ? "scene-chip--active" : ""} ${
                        roomProgress.unlockedSceneIds.includes(scene.id) ? "scene-chip--unlocked" : ""
                      }`}
                    >
                      {scene.title}
                    </span>
                  ))}
                </div>
                {canEscape ? (
                  <button type="button" className="button button--primary" onClick={() => completeRoom(room.id)}>
                    Trigger Escape Sequence
                  </button>
                ) : null}
              </section>
            </div>
          </div>

          <ActivityLog
            title="Room Activity"
            entries={state.recentActivity.filter((entry) => entry.entityId === room.id || room.inventory.some((item) => item.id === entry.entityId))}
            limit={8}
          />

          <section className="panel">
            <div className="section-heading">
              <h2>Other Rooms</h2>
            </div>
            <div className="room-strip">
              {rooms
                .filter((entry) => entry.id !== room.id)
                .map((entry) => (
                  <Link key={entry.id} to={`/escape/${entry.id}`} className="room-strip__card">
                    <strong>{entry.title}</strong>
                    <span>{entry.tagline}</span>
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
