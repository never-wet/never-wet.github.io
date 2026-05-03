import { quests, type QuestId, type QuestObjectiveDefinition } from "../data/quests";

export type QuestStatus = "locked" | "active" | "completed";

export interface QuestObjectiveState extends QuestObjectiveDefinition {
  progress: number;
}

export interface QuestState {
  id: QuestId;
  title: string;
  summary: string;
  giver: string;
  reward: string;
  status: QuestStatus;
  objectives: QuestObjectiveState[];
  unlocks: string[];
}

export interface QuestProgressResult {
  quests: Record<QuestId, QuestState>;
  completedQuestIds: QuestId[];
  unlockedIds: string[];
  messages: string[];
}

const initialActiveQuests: QuestId[] = ["first_steps", "engineer_intro", "observatory_pass", "archive_shards"];

export function createInitialQuests(): Record<QuestId, QuestState> {
  return Object.fromEntries(
    quests.map((quest) => [
      quest.id,
      {
        id: quest.id,
        title: quest.title,
        summary: quest.summary,
        giver: quest.giver,
        reward: quest.reward,
        status: initialActiveQuests.includes(quest.id) ? "active" : "locked",
        unlocks: quest.unlocks ?? [],
        objectives: quest.objectives.map((objective) => ({
          ...objective,
          progress: 0
        }))
      }
    ])
  ) as Record<QuestId, QuestState>;
}

export function getCurrentQuest(questStates: Record<QuestId, QuestState>, activeQuestId: QuestId) {
  const selected = questStates[activeQuestId];

  if (selected?.status === "active") {
    return selected;
  }

  return Object.values(questStates).find((quest) => quest.status === "active") ?? null;
}

export function getQuestProgress(quest: QuestState) {
  const completed = quest.objectives.filter((objective) => objective.progress >= objective.required).length;

  return {
    completed,
    total: quest.objectives.length,
    isComplete: completed === quest.objectives.length
  };
}

export function progressQuestObjective(
  questStates: Record<QuestId, QuestState>,
  questId: QuestId,
  objectiveId: string,
  amount = 1
): QuestProgressResult {
  const quest = questStates[questId];

  if (!quest || quest.status !== "active") {
    return emptyResult(questStates);
  }

  const objectiveIndex = quest.objectives.findIndex((objective) => objective.id === objectiveId);

  if (objectiveIndex < 0) {
    return emptyResult(questStates);
  }

  const objective = quest.objectives[objectiveIndex];

  if (objective.progress >= objective.required) {
    return emptyResult(questStates);
  }

  const nextObjective = {
    ...objective,
    progress: Math.min(objective.required, objective.progress + amount)
  };
  const nextObjectives = [...quest.objectives];
  nextObjectives[objectiveIndex] = nextObjective;
  const nextQuest = {
    ...quest,
    objectives: nextObjectives
  };
  const progress = getQuestProgress(nextQuest);
  const completedQuestIds = progress.isComplete ? [quest.id] : [];
  const unlockedIds = progress.isComplete ? nextQuest.unlocks : [];
  const messages = [`${nextObjective.label}: ${nextObjective.progress}/${nextObjective.required}`];
  const nextQuests = {
    ...questStates,
    [quest.id]: {
      ...nextQuest,
      status: progress.isComplete ? "completed" : "active"
    }
  };

  if (progress.isComplete) {
    messages.push(`Quest complete: ${quest.title}`);
    messages.push(`Reward: ${quest.reward}`);
  }

  if (quest.id === "market_signal" && progress.isComplete && nextQuests.observatory_pass.status === "locked") {
    nextQuests.observatory_pass = {
      ...nextQuests.observatory_pass,
      status: "active"
    };
    messages.push("New quest: Ridge Clearance");
  }

  return {
    quests: nextQuests as Record<QuestId, QuestState>,
    completedQuestIds,
    unlockedIds,
    messages
  };
}

export function activateQuest(
  questStates: Record<QuestId, QuestState>,
  questId: QuestId
): QuestProgressResult {
  const quest = questStates[questId];

  if (!quest || quest.status !== "locked") {
    return emptyResult(questStates);
  }

  return {
    quests: {
      ...questStates,
      [questId]: {
        ...quest,
        status: "active"
      }
    },
    completedQuestIds: [],
    unlockedIds: [],
    messages: [`New quest: ${quest.title}`]
  };
}

export function hasObjectiveProgress(
  questStates: Record<QuestId, QuestState>,
  questId: QuestId,
  objectiveId: string
) {
  const objective = questStates[questId]?.objectives.find((entry) => entry.id === objectiveId);

  return Boolean(objective && objective.progress >= objective.required);
}

export function getQuestTarget(quest: QuestState | null) {
  if (!quest) {
    return null;
  }

  const objective = quest.objectives.find((entry) => entry.progress < entry.required);

  return objective?.targetTile ?? null;
}

function emptyResult(questStates: Record<QuestId, QuestState>): QuestProgressResult {
  return {
    quests: questStates,
    completedQuestIds: [],
    unlockedIds: [],
    messages: []
  };
}
