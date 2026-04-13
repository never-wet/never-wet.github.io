import {
  buildSeedElements,
  buildSeedHistory,
  buildSeedMeta,
  buildSeedSettings,
  SEED_VERSION
} from "./seed.js";
import type {
  CanvasElement,
  HistoryEntry,
  PresenceState,
  RoomSettings,
  RoomSnapshot
} from "./types.js";

type RoomState = {
  roomId: string;
  elements: Map<string, CanvasElement>;
  settings: RoomSettings;
  meta: {
    seedVersion: string;
    nextOrder: number;
  };
  history: HistoryEntry[];
  presence: Map<string, PresenceState>;
};

export class RoomStore {
  private readonly rooms = new Map<string, RoomState>();

  constructor(private readonly historyLimit = 20) {}

  getSnapshot(roomId: string): RoomSnapshot {
    const room = this.ensureSeededRoom(roomId);
    return this.snapshotOf(room);
  }

  getPresence(roomId: string): PresenceState[] {
    return this.snapshotOf(this.ensureSeededRoom(roomId)).presence;
  }

  seedIfNeeded(roomId: string): RoomSnapshot {
    return this.getSnapshot(roomId);
  }

  upsertElement(roomId: string, element: CanvasElement): CanvasElement {
    const room = this.ensureSeededRoom(roomId);
    const existing = room.elements.get(element.id);
    const normalizedOrder =
      existing || element.order > room.meta.nextOrder
        ? element.order
        : room.meta.nextOrder + 1;
    const nextElement = {
      ...element,
      order: normalizedOrder
    };

    room.meta.nextOrder = normalizedOrder;
    room.elements.set(nextElement.id, nextElement);
    return cloneElement(nextElement);
  }

  patchElement(roomId: string, id: string, fields: Partial<CanvasElement>): Partial<CanvasElement> | null {
    const room = this.ensureSeededRoom(roomId);
    const current = room.elements.get(id);
    if (!current) {
      return null;
    }

    const next: CanvasElement = {
      ...current,
      ...fields,
      id: current.id
    };

    if (typeof next.order === "number" && next.order > room.meta.nextOrder) {
      room.meta.nextOrder = next.order;
    }

    room.elements.set(id, next);
    return clonePatch(fields);
  }

  deleteElement(roomId: string, id: string): boolean {
    const room = this.ensureSeededRoom(roomId);
    return room.elements.delete(id);
  }

  patchSettings(roomId: string, patch: Partial<RoomSettings>): Partial<RoomSettings> {
    const room = this.ensureSeededRoom(roomId);
    room.settings = {
      ...room.settings,
      ...patch
    };
    return { ...patch };
  }

  appendHistory(roomId: string, entry: HistoryEntry): HistoryEntry {
    const room = this.ensureSeededRoom(roomId);
    const normalized: HistoryEntry = {
      ...entry,
      at: entry.at ?? Date.now()
    };
    room.history.unshift(normalized);
    if (room.history.length > this.historyLimit) {
      room.history.length = this.historyLimit;
    }
    return { ...normalized };
  }

  upsertPresence(roomId: string, presence: PresenceState): PresenceState {
    const room = this.ensureSeededRoom(roomId);
    const normalized: PresenceState = {
      ...presence,
      lastSeenAt: presence.lastSeenAt || Date.now()
    };
    room.presence.set(normalized.clientId, normalized);
    return clonePresence(normalized);
  }

  removePresence(roomId: string, clientId: string): PresenceState[] {
    const room = this.ensureSeededRoom(roomId);
    room.presence.delete(clientId);
    return Array.from(room.presence.values()).map(clonePresence);
  }

  allocateOrder(roomId: string): number {
    const room = this.ensureSeededRoom(roomId);
    room.meta.nextOrder += 1;
    return room.meta.nextOrder;
  }

  private ensureSeededRoom(roomId: string): RoomState {
    const existing = this.rooms.get(roomId);
    if (existing && existing.meta.seedVersion === SEED_VERSION) {
      return existing;
    }

    if (existing) {
      existing.meta.seedVersion = SEED_VERSION;
      return existing;
    }

    const room: RoomState = {
      roomId,
      elements: new Map(buildSeedElements().map((element) => [element.id, element])),
      settings: buildSeedSettings(),
      meta: buildSeedMeta(),
      history: buildSeedHistory(),
      presence: new Map()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  private snapshotOf(room: RoomState): RoomSnapshot {
    return {
      roomId: room.roomId,
      elements: Array.from(room.elements.values())
        .map(cloneElement)
        .sort((left, right) => left.order - right.order),
      settings: { ...room.settings },
      meta: { ...room.meta },
      history: room.history.map((entry) => ({ ...entry })),
      presence: Array.from(room.presence.values()).map(clonePresence)
    };
  }
}

function cloneElement(element: CanvasElement): CanvasElement {
  return { ...element };
}

function clonePresence(presence: PresenceState): PresenceState {
  return {
    ...presence,
    user: { ...presence.user },
    cursor: presence.cursor ? { ...presence.cursor } : null
  };
}

function clonePatch(fields: Partial<CanvasElement>): Partial<CanvasElement> {
  return {
    ...fields
  };
}
