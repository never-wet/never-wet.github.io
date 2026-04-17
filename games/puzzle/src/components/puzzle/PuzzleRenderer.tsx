import { useEffect, useState } from "react";
import { SelectMenu } from "../common/SelectMenu";
import { useGame } from "../../hooks/useGame";
import type { ClueBlock, PuzzleDefinition, PuzzleProgress } from "../../memory/types";
import { PasscodeInput } from "./PasscodeInput";
import { SceneHotspotLayer } from "../escape/SceneHotspotLayer";
import { PuzzleVisual } from "./PuzzleVisual";

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

function renderClueBlocks(blocks?: ClueBlock[]) {
  return blocks?.map((block) => (
    <article key={block.title} className={`clue-block clue-block--${block.tone ?? "neutral"}`}>
      <strong>{block.title}</strong>
      {block.visual ? <PuzzleVisual visual={block.visual} compact /> : null}
      <p>{block.body}</p>
    </article>
  ));
}

function renderGuide(puzzle: PuzzleDefinition) {
  if (!puzzle.guide) {
    return null;
  }

  return (
    <section className="question-guide">
      <strong>{puzzle.guide.title ?? "Plain Language"}</strong>
      <p>{puzzle.guide.summary}</p>
      {puzzle.guide.steps?.length ? (
        <ul className="question-guide__steps">
          {puzzle.guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
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
    const hasVisualChoices = puzzle.content.choices.some((choice) => Boolean(choice.visual));

    return (
      <div className="play-surface">
        {puzzle.content.promptVisual ? <PuzzleVisual visual={puzzle.content.promptVisual} /> : null}
        {renderGuide(puzzle)}
        <p className="lead">{puzzle.content.prompt}</p>
        <div className={`choice-grid ${hasVisualChoices ? "choice-grid--visual" : ""}`}>
          {puzzle.content.choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              className={`choice-card ${choiceAnswer === choice.id ? "choice-card--selected" : ""}`}
              onClick={() => {
                setChoiceAnswer(choice.id);
                savePuzzleSession(puzzle.id, { choiceAnswer: choice.id });
              }}
            >
              {choice.visual ? <PuzzleVisual visual={choice.visual} compact /> : null}
              <strong>{hasVisualChoices ? `Option ${String.fromCharCode(65 + index)}` : choice.label}</strong>
              {choice.visual ? <p className="choice-card__caption">{choice.label}</p> : null}
              {!choice.visual && choice.detail ? <p>{choice.detail}</p> : null}
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
        {puzzle.content.promptVisual ? <PuzzleVisual visual={puzzle.content.promptVisual} /> : null}
        {renderGuide(puzzle)}
        <p className="lead">{puzzle.content.prompt}</p>
        {renderClueBlocks(puzzle.content.clueBlocks)}
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
    const content = puzzle.content;
    const hasVisualOptions = content.options.some((option) => Boolean(content.optionVisuals?.[option]));

    return (
      <div className="play-surface">
        {content.promptVisual ? <PuzzleVisual visual={content.promptVisual} /> : null}
        {renderGuide(puzzle)}
        <p className="lead">{content.prompt}</p>
        {content.sequenceVisuals?.length ? (
          <div className="sequence-visual-grid">
            {content.sequenceVisuals.map((visual, index) => (
              <PuzzleVisual key={`sequence-visual-${index}`} visual={visual} compact />
            ))}
          </div>
        ) : (
          <div className="sequence-strip">
            {content.sequence.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        )}
        <div className={`choice-grid choice-grid--tight ${hasVisualOptions ? "choice-grid--visual" : ""}`}>
          {content.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`choice-card ${textAnswer === option ? "choice-card--selected" : ""}`}
              onClick={() => {
                setTextAnswer(option);
                savePuzzleSession(puzzle.id, { textAnswer: option });
              }}
            >
              {content.optionVisuals?.[option] ? <PuzzleVisual visual={content.optionVisuals[option]} compact /> : null}
              <strong>{content.optionVisuals?.[option] ? `Pattern ${String.fromCharCode(65 + index)}` : option}</strong>
              {content.optionVisuals?.[option] ? <p className="choice-card__caption">{option}</p> : null}
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
        {content.promptVisual ? <PuzzleVisual visual={content.promptVisual} /> : null}
        {renderGuide(puzzle)}
        <p className="lead">{content.prompt}</p>
        <div className="pair-grid">
          {content.left.map((item) => (
            <div key={item.id} className="pair-row">
              {item.visual ? <PuzzleVisual visual={item.visual} compact /> : null}
              <span>{item.label}</span>
              <SelectMenu
                ariaLabel={`Choose a match for ${item.label}`}
                value={pairAnswer[item.id] ?? ""}
                placeholder="Choose a match"
                onChange={(value) => {
                  const next = { ...pairAnswer, [item.id]: value };
                  setPairAnswer(next);
                  savePuzzleSession(puzzle.id, { pairAnswer: next });
                }}
                options={[
                  { value: "", label: "Choose a match" },
                  ...content.right.map((option) => ({
                    value: option.id,
                    label: option.label,
                  })),
                ]}
              />
            </div>
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
        {content.promptVisual ? <PuzzleVisual visual={content.promptVisual} /> : null}
        {renderGuide(puzzle)}
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
                  {item.visual ? <PuzzleVisual visual={item.visual} compact /> : null}
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
        {puzzle.content.promptVisual ? <PuzzleVisual visual={puzzle.content.promptVisual} /> : null}
        {renderGuide(puzzle)}
        <p className="lead">{puzzle.content.prompt}</p>
        {renderClueBlocks(puzzle.content.clueBlocks)}
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
        {renderGuide(puzzle)}
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
        {renderGuide(puzzle)}
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
