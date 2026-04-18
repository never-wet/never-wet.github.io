import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MoveHistoryPanel } from "../components/game/MoveHistoryPanel";
import { StatusBanner } from "../components/game/StatusBanner";
import { SelectMenu } from "../components/ui/SelectMenu";
import { useAppContext } from "../context/AppContext";
import { aiIndex } from "../memory/aiIndex";
import { contentRegistry } from "../memory/contentRegistry";
import { gameIndex } from "../memory/gameIndex";
import type { Difficulty, GameId, MatchResult } from "../memory/types";
import { formatDateTime } from "../utils/format";

const UNDO_LIMIT = 48;

export function GamePage() {
  const params = useParams<{ gameId: GameId }>();
  const gameId = params.gameId;
  const { appState, saveGame, markGameFinished } = useAppContext();

  const module = gameId ? contentRegistry[gameId] : null;
  const game = gameId ? gameIndex[gameId] : null;
  const isChessGame = gameId === "chess";

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [state, setState] = useState<any>(module?.createInitialState() ?? null);
  const [undoStack, setUndoStack] = useState<unknown[]>([]);
  const [thinking, setThinking] = useState(false);

  const completionRecordedRef = useRef(false);

  useEffect(() => {
    if (!gameId || !module) {
      return;
    }

    const existingSave = appState.saves[gameId];
    const canResume = existingSave && !existingSave.isComplete;

    setDifficulty(canResume ? existingSave.difficulty : "medium");
    setState(canResume ? module.parseState(existingSave.state) : module.createInitialState());
    setUndoStack(canResume ? [...existingSave.undoStack] : []);
    setThinking(false);
    completionRecordedRef.current = Boolean(existingSave?.isComplete);
  }, [gameId, module]);

  const status = useMemo(() => (module && state ? module.getStatus(state) : null), [module, state]);
  const moveHistory = useMemo(() => (module && state ? module.getMoveHistory(state) : []), [module, state]);
  const sidebarStats = useMemo(
    () => (module && state ? module.getSidebarStats(state) : []),
    [module, state],
  );

  useEffect(() => {
    if (!gameId || !module || !state || !status) {
      return;
    }

    saveGame({
      gameId,
      difficulty,
      state: module.serializeState(state),
      undoStack,
      updatedAt: new Date().toISOString(),
      isComplete: status.phase !== "playing",
    });
  }, [difficulty, gameId, module, saveGame, state, status, undoStack]);

  useEffect(() => {
    if (!gameId || !module || !state || !status || status.phase === "playing" || completionRecordedRef.current) {
      return;
    }

    completionRecordedRef.current = true;
    const result: MatchResult =
      status.phase === "win" ? "win" : status.phase === "loss" ? "loss" : "draw";

    markGameFinished(
      gameId,
      difficulty,
      result,
      module.getTurnCount(state),
      status.headline,
      module.serializeState(state),
    );
  }, [difficulty, gameId, markGameFinished, module, state, status]);

  useEffect(() => {
    if (!module || !state || !status || status.phase !== "playing" || !module.isAiTurn(state)) {
      setThinking(false);
      return;
    }

    setThinking(true);
    const timeoutId = window.setTimeout(() => {
      const move = module.getAiMove(state, difficulty);
      if (!move) {
        setThinking(false);
        return;
      }

      const nextState = module.applyMove(state, move);
      if (nextState === state) {
        setThinking(false);
        return;
      }

      setUndoStack((current) => [...current, module.serializeState(state)].slice(-UNDO_LIMIT));
      setState(nextState);
      setThinking(false);
    }, aiIndex[difficulty].moveDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [difficulty, module, state, status]);

  if (!gameId || !module || !game || !status) {
    return (
      <section className="surface-card section-heading">
        <p className="eyebrow">Missing Board</p>
        <h1>Game not found.</h1>
        <p>The board you requested is not registered in the vault.</p>
        <Link className="primary-button" to="/games">
          Back to games
        </Link>
      </section>
    );
  }

  const Board = module.Board as any;
  const existingSave = appState.saves[gameId];

  function commitMove(move: unknown) {
    if (!module || !state || !status || thinking || status.phase !== "playing") {
      return;
    }

    const nextState = module.applyMove(state, move);
    if (nextState === state) {
      return;
    }

    completionRecordedRef.current = false;
    setUndoStack((current) => [...current, module.serializeState(state)].slice(-UNDO_LIMIT));
    setState(nextState);
  }

  function restartGame() {
    if (!module) {
      return;
    }

    completionRecordedRef.current = false;
    setThinking(false);
    setUndoStack([]);
    setState(module.createInitialState());
  }

  function undoMove() {
    if (!module || !undoStack.length) {
      return;
    }

    completionRecordedRef.current = false;
    const snapshot = undoStack[undoStack.length - 1];
    setUndoStack((current) => current.slice(0, -1));
    setThinking(false);
    setState(module.parseState(snapshot));
  }

  return (
    <div className="page-stack play-page" data-game-id={gameId}>
      <section className={`play-hero surface-card${isChessGame ? " is-chess-hero" : ""}`}>
        <div>
          <p className="eyebrow">{game.tag}</p>
          <h1>{game.title}</h1>
          <p>{game.longDescription}</p>
          <div className="hero-actions">
            <Link className="secondary-button" to="/games">
              Back to hub
            </Link>
            <Link className="secondary-button" to="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>
        <div className="play-summary">
          <div>
            <span>Autosave</span>
            <strong>{existingSave ? formatDateTime(existingSave.updatedAt) : "New match"}</strong>
          </div>
          <div>
            <span>Difficulty</span>
            <strong>{aiIndex[difficulty].label}</strong>
          </div>
          <div>
            <span>Board</span>
            <strong>{game.boardShape}</strong>
          </div>
          <div>
            <span>AI style</span>
            <strong>{game.difficultyNote}</strong>
          </div>
        </div>
      </section>

      <div className={`play-layout${isChessGame ? " is-chess-layout" : ""}`}>
        <section className={`surface-card board-panel${isChessGame ? " is-chess-board-panel" : ""}`}>
          <StatusBanner status={status} thinking={thinking} />

          <div className="control-bar">
            <label className="inline-field">
              <span>Difficulty</span>
              <SelectMenu
                onChange={setDifficulty}
                options={(Object.entries(aiIndex) as [Difficulty, (typeof aiIndex)[Difficulty]][]).map(
                  ([id, profile]) => ({
                    value: id,
                    label: profile.label,
                    description: profile.description,
                  }),
                )}
                value={difficulty}
              />
            </label>

            <div className="control-actions">
              <button className="game-action-button is-primary" onClick={restartGame} type="button">
                {isChessGame ? "New Game" : "Restart"}
              </button>
              {isChessGame ? null : (
                <button
                  className="game-action-button is-secondary"
                  disabled={!undoStack.length || thinking}
                  onClick={undoMove}
                  type="button"
                >
                  Undo
                </button>
              )}
            </div>
          </div>

          <div className="board-wrap">
            <Board
              coordinateLabels={appState.settings.coordinateLabels}
              disabled={thinking || status.phase !== "playing"}
              onMove={commitMove}
              state={state}
            />
          </div>
        </section>

        <aside className="sidebar-stack">
          <section className={`surface-card sidebar-card${isChessGame ? " is-chess-sidebar-card" : ""}`}>
            <div className="panel-heading">
              <h3>Live Stats</h3>
              <span>{module.getTurnCount(state)} turns</span>
            </div>
            <div className="fact-grid">
              {sidebarStats.map((item) => (
                <article className="fact-tile" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className={`surface-card sidebar-card${isChessGame ? " is-chess-sidebar-card" : ""}`}>
            <div className="panel-heading">
              <h3>Rules & Help</h3>
              <span>{module.rules.length} notes</span>
            </div>
            <div className="rules-list">
              {module.rules.map((rule) => (
                <article key={rule.title}>
                  <h4>{rule.title}</h4>
                  <p>{rule.body}</p>
                </article>
              ))}
            </div>
          </section>

          <MoveHistoryPanel moves={moveHistory} />
        </aside>
      </div>
    </div>
  );
}
