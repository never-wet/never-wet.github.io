export type ElementKind =
  | "sticky"
  | "shape-circle"
  | "shape-blob"
  | "media"
  | "text"
  | "sprint";

export type CanvasElement = {
  id: string;
  kind: ElementKind;
  title?: string;
  text?: string;
  image?: string;
  x: number;
  y: number;
  order: number;
  rotation?: number;
  seed: boolean;
};

export type RoomSettings = {
  grid: boolean;
  glow: boolean;
};

export type RoomMeta = {
  seedVersion: string;
  nextOrder: number;
};

export type HistoryEntry = {
  text: string;
  at?: number;
  actorId?: string;
};

export type PresenceUser = {
  name: string;
  color: string;
};

export type CursorPosition = {
  x: number;
  y: number;
};

export type PresenceState = {
  clientId: string;
  user: PresenceUser;
  cursor: CursorPosition | null;
  lastSeenAt: number;
};

export type RoomSnapshot = {
  roomId: string;
  elements: CanvasElement[];
  settings: RoomSettings;
  meta: RoomMeta;
  history: HistoryEntry[];
  presence: PresenceState[];
};

export type ClientMessage =
  | {
      type: "presence.update";
      payload: PresenceState;
      requestId?: string;
    }
  | {
      type: "element.upsert";
      payload: CanvasElement;
      requestId?: string;
    }
  | {
      type: "element.patch";
      payload: {
        id: string;
        fields: Partial<CanvasElement>;
      };
      requestId?: string;
    }
  | {
      type: "element.delete";
      payload: {
        id: string;
      };
      requestId?: string;
    }
  | {
      type: "settings.patch";
      payload: Partial<RoomSettings>;
      requestId?: string;
    }
  | {
      type: "history.append";
      payload: HistoryEntry;
      requestId?: string;
    }
  | {
      type: "room.snapshot.request";
      payload?: undefined;
      requestId?: string;
    };

export type ServerMessage =
  | {
      type: "room.snapshot";
      payload: RoomSnapshot;
      requestId?: string;
    }
  | {
      type: "presence.list";
      payload: PresenceState[];
      requestId?: string;
    }
  | {
      type: "presence.updated";
      payload: PresenceState;
      requestId?: string;
    }
  | {
      type: "element.upserted";
      payload: CanvasElement;
      requestId?: string;
    }
  | {
      type: "element.patched";
      payload: {
        id: string;
        fields: Partial<CanvasElement>;
      };
      requestId?: string;
    }
  | {
      type: "element.deleted";
      payload: {
        id: string;
      };
      requestId?: string;
    }
  | {
      type: "settings.patched";
      payload: Partial<RoomSettings>;
      requestId?: string;
    }
  | {
      type: "history.appended";
      payload: HistoryEntry;
      requestId?: string;
    }
  | {
      type: "ack";
      payload: {
        requestId?: string;
      };
    }
  | {
      type: "error";
      payload: {
        code: string;
        message: string;
      };
      requestId?: string;
    };
