import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { manualSlotIds } from "../memory/saveSchema";

const formatStamp = (timestamp?: number) =>
  timestamp ? new Date(timestamp).toLocaleString() : "Empty slot";

export const LoadPage = () => {
  const navigate = useNavigate();
  const { state, latestSave, loadGame, saveRecord, saveToSlot, deleteSlot, exportCurrentSave, importSavePayload } = useGame();
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="page-grid">
      <Panel eyebrow="Continue" title="Autosave">
        <div className="slot-card">
          {latestSave ? (
            <>
              <p>
                <strong>{latestSave.state.player.name}</strong> in {latestSave.state.currentLocationId}
              </p>
              <p>{formatStamp(latestSave.savedAt)}</p>
              <button
                className="primary-button"
                onClick={() => {
                  loadGame(latestSave);
                  navigate("/game");
                }}
                type="button"
              >
                Load Latest
              </button>
            </>
          ) : (
            <p>No local save found yet. Start a journey and the autosave will appear here.</p>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Manual Saves" title="Save Slots">
        <div className="card-grid three-up">
          {manualSlotIds.map((slotId) => {
            const save = saveRecord.manual[slotId];
            return (
              <article key={slotId} className="slot-card">
                <h3>{slotId.replace("slot-", "Slot ")}</h3>
                <p>{save ? `${save.state.player.name} - ${save.state.chapterId}` : "Empty"}</p>
                <p>{formatStamp(save?.savedAt)}</p>
                <div className="stack-actions">
                  <button
                    className="primary-button"
                    disabled={!save}
                    onClick={() => {
                      if (save) {
                        loadGame(save);
                        navigate("/game");
                      }
                    }}
                    type="button"
                  >
                    Load
                  </button>
                  <button
                    className="secondary-button"
                    disabled={state.status !== "playing"}
                    onClick={() => saveToSlot(slotId)}
                    type="button"
                  >
                    Save Current
                  </button>
                  <button className="ghost-button" disabled={!save} onClick={() => deleteSlot(slotId)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel eyebrow="Backup" title="Export / Import Save">
        <div className="split-panel">
          <div>
            <button className="secondary-button" onClick={() => setExportText(exportCurrentSave())} type="button">
              Export Current Journey
            </button>
            <textarea className="code-box" value={exportText} onChange={(event) => setExportText(event.target.value)} rows={12} />
          </div>
          <div>
            <textarea
              className="code-box"
              placeholder="Paste exported save JSON here."
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={12}
            />
            <button
              className="primary-button"
              onClick={() => {
                const success = importSavePayload(importText);
                setMessage(success ? "Save imported. Continue in camp." : "Import failed. Check the JSON payload.");
                if (success) {
                  navigate("/game");
                }
              }}
              type="button"
            >
              Import Save
            </button>
            {message ? <p className="support-copy">{message}</p> : null}
          </div>
        </div>
      </Panel>
    </div>
  );
};
