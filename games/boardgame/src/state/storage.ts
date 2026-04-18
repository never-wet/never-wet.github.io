import { storageKeys } from "../memory/storageKeys";
import { migrateAppState } from "../memory/saveSchema";
import type { PersistedAppState } from "../memory/types";

export function loadAppState(): PersistedAppState {
  try {
    const raw = window.localStorage.getItem(storageKeys.appState);
    return raw ? migrateAppState(JSON.parse(raw)) : migrateAppState(undefined);
  } catch {
    return migrateAppState(undefined);
  }
}

export function saveAppState(value: PersistedAppState): void {
  window.localStorage.setItem(storageKeys.appState, JSON.stringify(value));
  window.localStorage.setItem(storageKeys.themeHint, value.settings.theme);
}
