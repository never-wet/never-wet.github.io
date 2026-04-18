import { audioManager } from "../../lib/audio/audioManager";
import { contentRegistry } from "../../memory/contentRegistry";
import type { GameState } from "../../memory/types";
import { ArtImage } from "../common/ArtImage";

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
    <div className="scene-overlay dialogue-overlay">
      <div className="dialogue-scene">
        <ArtImage assetId={scene.backgroundAssetId} alt={scene.title} className="dialogue-scene-bg" />
        <div className="dialogue-window">
          <div className="dialogue-window-portrait">
            <ArtImage assetId={portrait} alt={speakerName} className="dialogue-portrait-art" />
          </div>
          <div className="dialogue-window-copy">
            <p className="hud-label">{scene.title}</p>
            <h2>{speakerName}</h2>
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
        </div>
      </div>
    </div>
  );
};
