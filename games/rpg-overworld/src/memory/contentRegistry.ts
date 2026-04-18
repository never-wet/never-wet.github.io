import { audioRoutes } from "../data/audio/audioRoutes";
import { characters } from "../data/characters/characters";
import { skills } from "../data/characters/skills";
import { enemies } from "../data/enemies/enemies";
import { items } from "../data/items/items";
import { locationActions } from "../data/locations/actions";
import { locations } from "../data/locations/locations";
import { overworldMaps } from "../data/locations/overworldMaps";
import { quests } from "../data/quests/quests";
import { encounters } from "../data/story/encounters";
import { journalEntries } from "../data/story/journal";
import { scenes } from "../data/story/scenes";
import { assetManifest } from "./assetManifest";
import { battleIndex } from "./battleIndex";
import { audioManifest } from "./audioManifest";
import { characterIndex } from "./characterIndex";
import { eventIndex } from "./eventIndex";
import { locationIndex } from "./locationIndex";
import { mapIndex } from "./mapIndex";
import { questIndex } from "./questIndex";
import { storyIndex } from "./storyIndex";

const byId = <T extends { id: string }>(entries: T[]) =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<string, T>;

export const contentRegistry = {
  audioRoutes,
  audioManifest,
  characterIndex,
  characters,
  charactersById: byId(characters),
  skills,
  skillsById: byId(skills),
  enemies,
  enemiesById: byId(enemies),
  items,
  itemsById: byId(items),
  locationIndex,
  locations,
  locationsById: byId(locations),
  overworldMaps,
  overworldMapsById: byId(overworldMaps),
  locationActions,
  locationActionsById: byId(locationActions),
  quests,
  questIndex,
  questsById: byId(quests),
  encounters,
  encountersById: byId(encounters),
  battleIndex,
  battleIndexById: byId(battleIndex),
  journalEntries,
  journalEntriesById: byId(journalEntries),
  eventIndex,
  eventIndexById: byId(eventIndex),
  mapIndex,
  mapIndexById: byId(mapIndex),
  storyIndex,
  scenes,
  scenesById: byId(scenes),
  assets: assetManifest,
  assetsById: byId(assetManifest),
};
