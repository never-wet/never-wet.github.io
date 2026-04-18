import { audioManager } from "../../lib/audio/audioManager";
import { contentRegistry } from "../../memory/contentRegistry";
import type { GameState } from "../../memory/types";
import { ArtImage } from "../common/ArtImage";
import { Panel } from "../common/Panel";

interface DialogueViewProps {
  state: GameState;
  onContinue: () => void;
  onChoose: (choiceId: string) => void;
}

export const DialogueView = ({ state, onContinue, onChoose }: DialogueViewProps) => {
  if (!state.activeSceneId || !state.activeNodeId) {
    return null;
  }

  const scene = contentRegistry.scenesById[state.activeSceneId];
  const node = scene.nodes[state.activeNodeId];
  const speakerName = node.speakerName ?? contentRegistry.charactersById[node.speakerId ?? ""]?.name ?? "Narration";
  const portrait = node.portraitAssetId ?? contentRegistry.charactersById[node.speakerId ?? ""]?.portraitAssetId ?? scene.backgroundAssetId;
  const choices = node.choices?.filter((choice) => {
    if (!choice.conditions?.length) {
      return true;
    }
    return choice.conditions.every((condition) => {
      switch (condition.type) {
        case "decision":
          return state.decisions[condition.key] === condition.equals;
        case "flag":
          return state.flags[condition.key] === condition.equals;
        default:
          return true;
      }
    });
  });

  return (
    <Panel eyebrow={scene.title} title={speakerName} className="dialogue-panel">
      <div className="dialogue-portrait">
        <ArtImage assetId={portrait} alt={speakerName} className="art-frame tall" />
      </div>
      <div className="dialogue-copy">
        {node.text.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {choices?.length ? (
          <div className="choice-list">
            {choices.map((choice) => (
              <button
                key={choice.id}
                className="choice-button"
                onClick={() => {
                  audioManager.playSfx("dialogue-blip");
                  onChoose(choice.id);
                }}
                type="button"
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="primary-button"
            onClick={() => {
              audioManager.playSfx("dialogue-blip");
              onContinue();
            }}
            type="button"
          >
            Continue
          </button>
        )}
      </div>
    </Panel>
  );
};
