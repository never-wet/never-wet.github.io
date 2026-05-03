import type { WorldObjectDefinition } from "../data/worldMap";
import type { NPCRuntime } from "./NPCSystem";
import { AIChatService } from "./AIChatService";
import { hasObjectiveProgress } from "./QuestSystem";
import { useWorldStore, type DialogueChoice, type DialogueLine } from "../../store/useWorldStore";

export class DialogueSystem {
  private readonly ai = new AIChatService();

  async openNpc(runtime: NPCRuntime) {
    const state = useWorldStore.getState();
    const npc = runtime.definition;

    state.rememberConversation(npc.id);

    for (const quest of Object.values(state.quests)) {
      const objective = quest.objectives.find(
        (entry) => entry.type === "talk" && entry.targetNpc === npc.id && entry.progress < entry.required
      );

      if (objective) {
        state.progressQuest(quest.id, objective.id);
      }
    }

    if (npc.id === "marlo") {
      state.activateQuest("market_signal");
      state.progressQuest("market_signal", "talk_marlo");
    }

    if (npc.id === "warden" && hasObjectiveProgress(useWorldStore.getState().quests, "observatory_pass", "training_duel")) {
      state.progressQuest("observatory_pass", "talk_warden");
    }

    const updated = useWorldStore.getState();
    const lines = await this.ai.getNpcLines({
      npc,
      quests: Object.values(updated.quests),
      visitedPortals: updated.visitedPortals,
      conversationCount: updated.conversationFlags[npc.id] ?? 0
    });

    updated.openDialogue(npc.id, lines, choicesForNpc(npc.id));
  }

  openObject(object: WorldObjectDefinition) {
    useWorldStore.getState().openDialogue(object.id, objectLines(object), choicesForObject(object));
  }

  openLockedPortal(name: string, reason: string) {
    useWorldStore.getState().openDialogue(`locked-${name}`, [
      {
        speaker: name,
        text: reason,
        mood: "warning"
      }
    ]);
  }
}

function choicesForNpc(npcId: string): DialogueChoice[] {
  if (npcId === "marlo") {
    return [
      { id: "market", label: "Start market challenge", openMiniGame: "market_timing", close: true },
      { id: "bye", label: "Back to town", close: true }
    ];
  }

  if (npcId === "rhea") {
    return [
      { id: "rhythm", label: "Try rhythm pulse", openMiniGame: "rhythm_pulse", close: true },
      { id: "bye", label: "Back to town", close: true }
    ];
  }

  return [{ id: "bye", label: "Back to town", close: true }];
}

function choicesForObject(object: WorldObjectDefinition): DialogueChoice[] {
  if (object.type === "practice_yard") {
    return [
      { id: "duel", label: "Start circuit duel", openMiniGame: "circuit_duel", close: true },
      { id: "leave", label: "Leave yard", close: true }
    ];
  }

  if (object.id === "market_board" || object.id === "market_counter") {
    return [
      { id: "market", label: "Start market challenge", openMiniGame: "market_timing", close: true },
      { id: "leave", label: "Step back", close: true }
    ];
  }

  if (object.id === "studio_speakers" || object.id === "studio_stage") {
    return [
      { id: "rhythm", label: "Start rhythm pulse", openMiniGame: "rhythm_pulse", close: true },
      { id: "leave", label: "Step back", close: true }
    ];
  }

  return [{ id: "ok", label: "OK", close: true }];
}

function objectLines(object: WorldObjectDefinition): DialogueLine[] {
  if (object.type === "sign") {
    return [
      {
        speaker: object.name,
        text: "Starter Village is west, Tech District is east, Creative District is south, Observatory Ridge is north, and Archive Grove waits beyond the lower bridge.",
        mood: "calm"
      }
    ];
  }

  if (object.type === "tree") {
    return [
      {
        speaker: object.name,
        text: "Its roots stop neatly before the road. Somebody here respects collision maps.",
        mood: "fun"
      }
    ];
  }

  if (object.type === "rock") {
    return [
      {
        speaker: object.name,
        text: "A mossy stone, solid enough to block shortcuts and humble enough to stay out of doorways.",
        mood: "calm"
      }
    ];
  }

  if (object.type === "lamp") {
    return [
      {
        speaker: object.name,
        text: "The lamp brightens at night and makes the road feel safe without turning the HUD into a floodlight.",
        mood: "bright"
      }
    ];
  }

  if (object.type === "practice_yard") {
    return [
      {
        speaker: object.name,
        text: "A tiny combat circuit is painted on the ground. Win the duel here to earn ridge clearance.",
        mood: "bright"
      }
    ];
  }

  if (object.type === "bookshelf") {
    return [
      {
        speaker: object.name,
        text: "The shelf holds notes, sketches, and tiny labels. Every room is part of the game world now, not a web panel.",
        mood: "calm"
      }
    ];
  }

  if (object.type === "workbench") {
    return [
      {
        speaker: object.name,
        text: "Blueprints, saved builds, and tools are laid out like somebody actually works here.",
        mood: "bright"
      }
    ];
  }

  if (object.type === "console") {
    return [
      {
        speaker: object.name,
        text: "The terminal blinks through a few local routines. No exposed keys, no fake link, just a machine in a room.",
        mood: "bright"
      }
    ];
  }

  if (object.id === "market_board" || object.id === "market_counter") {
    return [
      {
        speaker: object.name,
        text: "The numbers pulse in a steady rhythm. Read the gold window well and the market challenge pays out.",
        mood: "fun"
      }
    ];
  }

  if (object.id === "studio_speakers" || object.id === "studio_stage") {
    return [
      {
        speaker: object.name,
        text: "A soft beat waits for input. The studio mini-game lives in the room, right where it belongs.",
        mood: "bright"
      }
    ];
  }

  if (object.type === "telescope") {
    return [
      {
        speaker: object.name,
        text: "The lens tracks a slow constellation path across the dome. The observatory finally feels like a place.",
        mood: "bright"
      }
    ];
  }

  if (object.type === "mosaic") {
    return [
      {
        speaker: object.name,
        text: "Tiny particles lock into patterns and then drift apart. The gallery is running its own little visual spell.",
        mood: "fun"
      }
    ];
  }

  return [
    {
      speaker: object.name,
      text: "The object hums softly in the town's pixel grammar.",
      mood: "calm"
    }
  ];
}
