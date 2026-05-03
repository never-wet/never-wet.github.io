import type { NPCDefinition } from "../data/npcs";
import type { QuestState } from "./QuestSystem";
import type { DialogueLine } from "../../store/useWorldStore";

interface AIChatContext {
  npc: NPCDefinition;
  quests: QuestState[];
  visitedPortals: string[];
  conversationCount: number;
  playerQuestion?: string;
}

export class AIChatService {
  async getNpcLines(context: AIChatContext): Promise<DialogueLine[]> {
    const endpoint = process.env.NEXT_PUBLIC_SITEBOUND_AI_ENDPOINT;

    if (endpoint && typeof window !== "undefined") {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            npcId: context.npc.id,
            npcName: context.npc.name,
            role: context.npc.role,
            personality: context.npc.personality,
            systemPrompt: context.npc.systemPrompt,
            quests: context.quests.map((quest) => ({
              id: quest.id,
              title: quest.title,
              status: quest.status
            })),
            visitedPortals: context.visitedPortals,
            question: context.playerQuestion ?? ""
          })
        });

        if (response.ok) {
          const data = (await response.json()) as { lines?: DialogueLine[] };

          if (Array.isArray(data.lines) && data.lines.length > 0) {
            return data.lines;
          }
        }
      } catch {
        // Fall through to scripted dialogue. The key never lives in the frontend.
      }
    }

    return fallbackLines(context);
  }
}

function fallbackLines(context: AIChatContext): DialogueLine[] {
  const { npc } = context;
  const visits = context.visitedPortals.length;

  if (npc.id === "lyra") {
    return [
      {
        speaker: npc.name,
        text: context.conversationCount > 0
          ? "You are getting the rhythm. Roads lead to doors, doors lead to playable rooms, and quests make the town open up."
          : "Welcome to Sitebound. Move with WASD or the arrow keys, press E near people or doors, and follow the quest marker when the roads branch.",
        mood: "bright"
      },
      {
        speaker: npc.name,
        text: "Start with the Workshop north of the plaza. It is a real building, not a menu pretending to be scenery.",
        mood: "calm"
      }
    ];
  }

  if (npc.id === "iko") {
    return [
      {
        speaker: npc.name,
        text: "The AI Lab is where the town keeps its thinking machines. I can answer with an AI endpoint if one is configured, but the fallback script is ready when no key exists.",
        mood: "bright"
      },
      {
        speaker: npc.name,
        text: "The pathfinding line on your minimap uses A*. Click a destination marker and the route should draw through walkable tiles only.",
        mood: "calm"
      }
    ];
  }

  if (npc.id === "marlo") {
    return [
      {
        speaker: npc.name,
        text: "Markets are just weather with prices. Step inside the Trading House and try the timing challenge when you want a quick coin test.",
        mood: "fun"
      }
    ];
  }

  if (npc.id === "rhea") {
    return [
      {
        speaker: npc.name,
        text: "Creative District has the Music Studio and Particle Gallery. Listen at sunset; the lighting makes the windows feel awake.",
        mood: "bright"
      }
    ];
  }

  if (npc.id === "warden") {
    return [
      {
        speaker: npc.name,
        text: "The observatory path opens after you win the circuit duel in the practice yard. A route should be earned, even a small one.",
        mood: "warning"
      }
    ];
  }

  if (npc.id === "archivist") {
    return [
      {
        speaker: npc.name,
        text: "Three signal shards are tucked into sensible corners of the town. No random clutter, no trees through roofs. That is the archive oath.",
        mood: "calm"
      }
    ];
  }

  return [
    {
      speaker: npc.name,
      text: visits > 0 ? `You have entered ${visits} building room${visits === 1 ? "" : "s"}. Very official adventurer behavior.` : "The weather changes the mood, but the roads still know where they are going.",
      mood: "fun"
    }
  ];
}
