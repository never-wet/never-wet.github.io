import { audioTracks } from "../data/audio/tracks";
import { characters } from "../data/characters/characters";
import { enemies, skills, weapons } from "../data/combat/weapons";
import { dialogueProfiles } from "../data/dialogue/dialogues";
import { items, shops } from "../data/items/items";
import { jobs } from "../data/jobs/jobs";
import { maps } from "../data/maps/maps";
import { quests } from "../data/quests/quests";
import { worldIndex } from "./worldIndex";
import type { ContentRegistry } from "./types";

function toRecord<T extends { id: string }>(values: T[]): Record<string, T> {
  return Object.fromEntries(values.map((value) => [value.id, value]));
}

export const contentRegistry: ContentRegistry = {
  regions: toRecord(
    [...worldIndex].map((region) => ({
      ...region,
      mapIds: [...region.mapIds],
      connections: [...region.connections],
    })),
  ),
  maps: toRecord(maps),
  characters: toRecord(characters),
  dialogue: Object.fromEntries(dialogueProfiles.map((profile) => [profile.npcId, profile])),
  quests: toRecord(quests),
  jobs: toRecord(jobs),
  items: toRecord(items),
  shops: toRecord(shops),
  weapons: toRecord(weapons),
  skills: toRecord(skills),
  enemies: toRecord(enemies),
  audioTracks: Object.fromEntries(audioTracks.map((track) => [track.id, track])) as ContentRegistry["audioTracks"],
};
