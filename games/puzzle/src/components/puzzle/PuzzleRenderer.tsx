import { useEffect, useState } from "react";
import { useGame } from "../../hooks/useGame";
import type { PuzzleDefinition, PuzzleProgress } from "../../memory/types";
import { PasscodeInput } from "./PasscodeInput";
import { SceneHotspotLayer } from "../escape/SceneHotspotLayer";

function moveItem(order: string[], fromId: string, toId: string) {
  const next = order.slice();
  const fromIndex = next.indexOf(fromId);
  const toIndex = next.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) {
    return next;
  }

  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromId);
  return next;
}

export function PuzzleRenderer({
  puzzle,
  progress,
  elapsedSeconds,
}: {
  puzzle: PuzzleDefinition;
  progress?: PuzzleProgress;
  elapsedSeconds?: number;
}) {
  const { submitPuzzle, savePuzzleSession } = useGame();
  const [textAnswer, setTextAnswer] = useState("");
  const [choiceAnswer, setChoiceAnswer] = useState("");
  const [pairAnswer, setPairAnswer] = useState<Record<string, string>>({});
  const [arrangeOrder, setArrangeOrder] = useState<string[]>([]);
  const [foundHotspots, setFoundHotspots] = useState<string[]>([]);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setTextAnswer(typeof progress?.sessionData?.textAnswer === "string" ? String(progress?.sessionData?.textAnswer) : "");
    setChoiceAnswer(typeof progress?.sessionData?.choiceAnswer === "string" ? String(progress?.sessionData?.choiceAnswer) : "");
    setPairAnswer((progress?.sessionData?.pairAnswer as Record<string, string>) ?? {});
    setArrangeOrder(
      Array.isArray(progress?.sessionData?.arrangeOrder)
        ? (progress?.sessionData?.arrangeOrder as string[])
        : puzzle.content.kind === "arrange"
          ? puzzle.content.items.map((item) => item.id)
          : [],
    );
    setFoundHotspots(
      Array.isArray(progress?.sessionData?.foundHotspots)
        ? (progress?.sessionData?.foundHotspots as string[])
        : [],
    );
  }, [puzzle.id, progress?.sessionData, puzzle.content]);

  if (puzzle.content.kind === "multipleChoice") {
    return (
      <div className="play-surface">
        <p className="lead">{puzzle.content.prompt}</p>
        <div className="choice-grid">
          {puzzle.content.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={`choice-card ${choiceAnswer === choice.id ? "choice-card--selected" : ""}`}
              onClick={() => {
                setChoiceAnswer(choice.id);
                savePuzzleSession(puzzle.id, { choiceAnswer: choice.id });
              }}
            >
              <strong>{choice.label}</strong>
              {choice.detail ? <p>{choice.detail}</p> : null}
            </button>
          ))}
        </div>
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, choiceAnswer, elapsedSeconds)}>
          Submit Answer
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "textInput") {
    return (
      <div className="play-surface">
        <p className="lead">{puzzle.content.prompt}</p>
        {puzzle.content.clueBlocks?.map((block) => (
          <article key={block.title} className={`clue-block clue-block--${block.tone ?? "neutral"}`}>
            <strong>{block.title}</strong>
            <p>{block.body}</p>
          </article>
        ))}
        <label className="field-label" htmlFor={`${puzzle.id}-answer`}>
          Answer
        </label>
        <input
          id={`${puzzle.id}-answer`}
          className="text-input"
          value={textAnswer}
          placeholder={puzzle.content.placeholder}
          onChange={(event) => {
            setTextAnswer(event.target.value);
            savePuzzleSession(puzzle.id, { textAnswer: event.target.value });
          }}
        />
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, textAnswer, elapsedSeconds)}>
          Submit Answer
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "sequence") {
    return (
      <div className="play-surface">
        <p className="lead">{puzzle.content.prompt}</p>
        <div className="sequence-strip">
          {puzzle.content.sequence.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
        <div className="choice-grid choice-grid--tight">
          {puzzle.content.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`choice-card ${textAnswer === option ? "choice-card--selected" : ""}`}
              onClick={() => {
                setTextAnswer(option);
                savePuzzleSession(puzzle.id, { textAnswer: option });
              }}
            >
              <strong>{option}</strong>
            </button>
          ))}
        </div>
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, textAnswer, elapsedSeconds)}>
          Confirm Sequence
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "matchPairs") {
    const content = puzzle.content;

    return (
      <div className="play-surface">
        <p className="lead">{content.prompt}</p>
        <div className="pair-grid">
          {content.left.map((item) => (
            <label key={item.id} className="pair-row">
              <span>{item.label}</span>
              <select
                className="select-input"
                value={pairAnswer[item.id] ?? ""}
                onChange={(event) => {
                  const next = { ...pairAnswer, [item.id]: event.target.value };
                  setPairAnswer(next);
                  savePuzzleSession(puzzle.id, { pairAnswer: next });
                }}
              >
                <option value="">Choose a match</option>
                {content.right.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, pairAnswer, elapsedSeconds)}>
          Check Matches
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "arrange") {
    const content = puzzle.content;

    const orderedItems =
      arrangeOrder.length > 0
        ? arrangeOrder.map((id) => content.items.find((item) => item.id === id)).filter(Boolean)
        : content.items;

    return (
      <div className="play-surface">
        <p className="lead">{content.prompt}</p>
        <div className="arrange-list">
          {orderedItems.map((item) => {
            if (!item) {
              return null;
            }

            return (
              <div
                key={item.id}
                className="arrange-item"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const draggedId = event.dataTransfer.getData("text/plain");
                  const next = moveItem(arrangeOrder, draggedId, item.id);
                  setArrangeOrder(next);
                  savePuzzleSession(puzzle.id, { arrangeOrder: next });
                }}
              >
                <div>
                  <strong>{item.label}</strong>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
                <div className="arrange-item__actions">
                  <button
                    type="button"
                    className="button button--subtle"
                    onClick={() => {
                      const index = arrangeOrder.indexOf(item.id);
                      if (index > 0) {
                        const next = arrangeOrder.slice();
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        setArrangeOrder(next);
                        savePuzzleSession(puzzle.id, { arrangeOrder: next });
                      }
                    }}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="button button--subtle"
                    onClick={() => {
                      const index = arrangeOrder.indexOf(item.id);
                      if (index < arrangeOrder.length - 1) {
                        const next = arrangeOrder.slice();
                        [next[index + 1], next[index]] = [next[index], next[index + 1]];
                        setArrangeOrder(next);
                        savePuzzleSession(puzzle.id, { arrangeOrder: next });
                      }
                    }}
                  >
                    Down
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, arrangeOrder, elapsedSeconds)}>
          Lock Order
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "combinationLock") {
    return (
      <div className="play-surface">
        <p className="lead">{puzzle.content.prompt}</p>
        {puzzle.content.clueBlocks?.map((block) => (
          <article key={block.title} className={`clue-block clue-block--${block.tone ?? "neutral"}`}>
            <strong>{block.title}</strong>
            <p>{block.body}</p>
          </article>
        ))}
        <PasscodeInput
          label={puzzle.content.keypadLabel}
          value={textAnswer}
          maxLength={puzzle.content.codeLength}
          placeholder={`Enter ${puzzle.content.codeLength} digits`}
          onChange={(value) => {
            setTextAnswer(value);
            savePuzzleSession(puzzle.id, { textAnswer: value });
          }}
        />
        <button type="button" className="button button--primary" onClick={() => submitPuzzle(puzzle.id, textAnswer, elapsedSeconds)}>
          Test Code
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "hotspot") {
    const requiredFound = puzzle.content.requiredHotspotIds.every((id) => foundHotspots.includes(id));

    return (
      <div className="play-surface">
        <div className="section-heading">
          <div>
            <h2>Scene Puzzle</h2>
            <p>{puzzle.content.prompt}</p>
          </div>
          <button type="button" className="button button--subtle" onClick={() => setZoomed((value) => !value)}>
            {zoomed ? "Reset Zoom" : "Zoom Inspect"}
          </button>
        </div>
        <SceneHotspotLayer
          scene={puzzle.content.scene}
          foundHotspotIds={foundHotspots}
          zoomed={zoomed}
          onHotspotClick={(hotspotId) => {
            const next = Array.from(new Set([...foundHotspots, hotspotId]));
            setFoundHotspots(next);
            savePuzzleSession(puzzle.id, { foundHotspots: next, textAnswer });
          }}
        />
        {puzzle.content.passcode ? (
          <PasscodeInput
            label={puzzle.content.passcode.label}
            value={textAnswer}
            maxLength={Math.max(4, puzzle.content.passcode.acceptedAnswer.length)}
            placeholder={puzzle.content.passcode.placeholder}
            onChange={(value) => {
              setTextAnswer(value);
              savePuzzleSession(puzzle.id, { textAnswer: value, foundHotspots });
            }}
          />
        ) : null}
        <button
          type="button"
          className="button button--primary"
          disabled={!requiredFound}
          onClick={() =>
            submitPuzzle(
              puzzle.id,
              {
                foundHotspots,
                code: textAnswer,
              },
              elapsedSeconds,
            )
          }
        >
          {puzzle.content.passcode ? "Submit Scene Solution" : "Complete Scene"}
        </button>
      </div>
    );
  }

  if (puzzle.content.kind === "spotDifference") {
    return (
      <div className="play-surface">
        <p className="lead">{puzzle.content.prompt}</p>
        <div className="scene-compare">
          <SceneHotspotLayer
            scene={puzzle.content.leftScene}
            compareLabel="A"
            foundHotspotIds={foundHotspots}
            onHotspotClick={(hotspotId) => {
              const next = Array.from(new Set([...foundHotspots, hotspotId]));
              setFoundHotspots(next);
              savePuzzleSession(puzzle.id, { foundHotspots: next });
            }}
          />
          <SceneHotspotLayer
            scene={puzzle.content.rightScene}
            compareLabel="B"
            foundHotspotIds={foundHotspots}
            onHotspotClick={(hotspotId) => {
              const next = Array.from(new Set([...foundHotspots, hotspotId]));
              setFoundHotspots(next);
              savePuzzleSession(puzzle.id, { foundHotspots: next });
            }}
          />
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => submitPuzzle(puzzle.id, { foundHotspots }, elapsedSeconds)}
        >
          Confirm Differences
        </button>
      </div>
    );
  }

  return null;
}
