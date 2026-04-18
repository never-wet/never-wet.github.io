import { assetManifest } from "./assetManifest";
import { audioCues, musicTracks } from "./audioManifest";
import { characterIndex } from "./characterIndex";
import { dayProgression } from "./dayProgression";
import { enemyIndex } from "./enemyIndex";
import { evolutionIndex } from "./evolutionIndex";
import { lootIndex } from "./lootIndex";
import { passiveIndex } from "./passiveIndex";
import { relicIndex } from "./relicIndex";
import { synergyIndex } from "./synergyIndex";
import { weaponIndex } from "./weaponIndex";
import type { AssetDefinition, AudioCueDefinition, BiomeDefinition, ContentRegistry, MusicTrackDefinition } from "./types";
import { biomeIndex } from "../data/maps/biomes";

const byId = <T extends { id: string }>(items: T[]): Record<string, T> =>
  items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});

const byTrack = <T extends { id: string }>(items: T[]): Record<string, T> =>
  items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});

export const contentRegistry: ContentRegistry = {
  weapons: byId(weaponIndex),
  passives: byId(passiveIndex),
  enemies: byId(enemyIndex),
  loot: byId(lootIndex),
  characters: byId(characterIndex),
  relics: byId(relicIndex),
  evolutions: byId(evolutionIndex),
  synergies: byId(synergyIndex),
  days: dayProgression,
  assets: byId(assetManifest as AssetDefinition[]),
  biomes: byId(biomeIndex as BiomeDefinition[]),
  audio: {
    tracks: byTrack(musicTracks) as Record<string, MusicTrackDefinition>,
    cues: byTrack(audioCues) as Record<string, AudioCueDefinition>,
  },
};
