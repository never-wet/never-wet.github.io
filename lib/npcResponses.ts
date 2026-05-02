import { getBuildingById } from "./worldData";

export type NpcTopic =
  | "intro"
  | "portfolio"
  | "ai-lab"
  | "stock-terminal"
  | "music-studio"
  | "galaxy-lab"
  | "contact-office"
  | "recommend";

export const NPC_RESPONSES: Record<NpcTopic, string> = {
  intro: "Welcome to the hub. Walk to a building or tap a minimap marker and I will help you find the right portal.",
  portfolio: "Portfolio Building opens the project index. Start there when you want the broadest view of the work.",
  "ai-lab": "AI Lab collects experiments around agents, models, interfaces, and tool systems.",
  "stock-terminal": "Stock Terminal opens Market Pulse Trader, the browser stock trading simulation.",
  "music-studio": "Music Studio takes you to the loop DAW, a browser music workspace.",
  "galaxy-lab": "Galaxy Lab opens Galaxy Simulator, the interactive space and gravity sandbox.",
  "contact-office": "Contact Office routes back to the main contact area when you want to reach out.",
  recommend: "If you are exploring for the first time, enter Portfolio Building. If you want the most technical stop, choose AI Lab."
};

export function getNpcResponse(topic: string) {
  if (topic in NPC_RESPONSES) {
    return NPC_RESPONSES[topic as NpcTopic];
  }

  const building = getBuildingById(topic);
  return building?.hint ?? NPC_RESPONSES.intro;
}
