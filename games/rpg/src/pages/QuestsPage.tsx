import { Panel } from "../components/common/Panel";
import { useGame } from "../hooks/useGame";
import { getCompletedQuests, getQuestObjective, isManualTurnInReady } from "../lib/game/selectors";
import { contentRegistry } from "../memory/contentRegistry";

export const QuestsPage = () => {
  const { state, dispatch } = useGame();
  const active = contentRegistry.quests.filter((quest) => state.quests[quest.id]?.status === "active");
  const completed = getCompletedQuests(state);

  return (
    <div className="page-grid">
      <Panel eyebrow="Active" title="Current Quests">
        <div className="stack-actions">
          {active.map((quest) => {
            const objective = getQuestObjective(state, quest);
            return (
              <article key={quest.id} className="quest-card">
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <strong>{objective?.text ?? "Ready to turn in."}</strong>
                <small>
                  Rewards: {quest.rewardSilver} silver, {quest.rewardXp} XP
                </small>
                {isManualTurnInReady(state, quest.id) ? (
                  <button className="primary-button" onClick={() => dispatch({ type: "TURN_IN_QUEST", questId: quest.id })} type="button">
                    Turn In Quest
                  </button>
                ) : null}
              </article>
            );
          })}
          {!active.length ? <p>No active quests right now.</p> : null}
        </div>
      </Panel>

      <Panel eyebrow="Completed" title="Finished Work">
        <div className="card-grid">
          {completed.map((quest) => (
            <article key={quest.id} className="feature-card">
              <h3>{quest.title}</h3>
              <p>{quest.summary}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
};
