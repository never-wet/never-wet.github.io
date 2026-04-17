import { escapeRooms } from "../data/escapeRooms";
import type { EscapeRoomIndexEntry } from "./types";

function summarizeUnlock(description?: string) {
  return description ?? "Available from the start.";
}

export const escapeRoomIndex: EscapeRoomIndexEntry[] = escapeRooms.map((room) => ({
  id: room.id,
  title: room.title,
  difficulty: room.difficulty,
  estimatedTime: room.estimatedTime,
  sceneCount: room.scenes.length,
  featuredPuzzleIds: room.featuredPuzzleIds,
  unlockSummary: summarizeUnlock(room.unlock.description),
}));
