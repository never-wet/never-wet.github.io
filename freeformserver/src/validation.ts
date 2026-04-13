import type {
  CanvasElement,
  ClientMessage,
  HistoryEntry,
  PresenceState,
  RoomSettings
} from "./types.js";

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

const ROOM_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export function validateRoomId(roomId: string): ValidationResult<string> {
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return {
      ok: false,
      message: "roomId must match /^[A-Za-z0-9._-]{1,128}$/"
    };
  }

  return { ok: true, value: roomId };
}

export function parseClientMessage(raw: string): ValidationResult<ClientMessage> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Message must be valid JSON." };
  }

  if (!isRecord(data) || typeof data.type !== "string") {
    return { ok: false, message: "Message must contain a string type." };
  }

  const requestId = optionalString(data.requestId, "requestId");
  if (!requestId.ok) {
    return requestId;
  }

  if (data.type === "room.snapshot.request") {
    return {
      ok: true,
      value: withRequestId({
        type: "room.snapshot.request",
      }, requestId.value)
    };
  }

  if (data.type === "presence.update") {
    const presence = validatePresenceState(data.payload);
    if (!presence.ok) {
      return presence;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "presence.update",
        payload: presence.value
      }, requestId.value)
    };
  }

  if (data.type === "element.upsert") {
    const element = validateCanvasElement(data.payload);
    if (!element.ok) {
      return element;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "element.upsert",
        payload: element.value
      }, requestId.value)
    };
  }

  if (data.type === "element.patch") {
    if (!isRecord(data.payload)) {
      return { ok: false, message: "element.patch payload must be an object." };
    }
    const id = requiredString(data.payload.id, "payload.id");
    if (!id.ok) {
      return id;
    }
    const fields = validateElementPatchFields(data.payload.fields);
    if (!fields.ok) {
      return fields;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "element.patch",
        payload: {
          id: id.value,
          fields: fields.value
        }
      }, requestId.value)
    };
  }

  if (data.type === "element.delete") {
    if (!isRecord(data.payload)) {
      return { ok: false, message: "element.delete payload must be an object." };
    }
    const id = requiredString(data.payload.id, "payload.id");
    if (!id.ok) {
      return id;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "element.delete",
        payload: { id: id.value }
      }, requestId.value)
    };
  }

  if (data.type === "settings.patch") {
    const settings = validateSettingsPatch(data.payload);
    if (!settings.ok) {
      return settings;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "settings.patch",
        payload: settings.value
      }, requestId.value)
    };
  }

  if (data.type === "history.append") {
    const history = validateHistoryEntry(data.payload);
    if (!history.ok) {
      return history;
    }
    return {
      ok: true,
      value: withRequestId({
        type: "history.append",
        payload: history.value
      }, requestId.value)
    };
  }

  return {
    ok: false,
    message: `Unsupported message type: ${String(data.type)}`
  };
}

function validateCanvasElement(value: unknown): ValidationResult<CanvasElement> {
  if (!isRecord(value)) {
    return { ok: false, message: "CanvasElement must be an object." };
  }

  const id = requiredString(value.id, "element.id");
  const kind = requiredString(value.kind, "element.kind");
  const x = requiredNumber(value.x, "element.x");
  const y = requiredNumber(value.y, "element.y");
  const order = requiredNumber(value.order, "element.order");
  const seed = requiredBoolean(value.seed, "element.seed");
  const title = optionalString(value.title, "element.title");
  const text = optionalString(value.text, "element.text");
  const image = optionalString(value.image, "element.image");
  const rotation = optionalNumber(value.rotation, "element.rotation");

  const failed = [id, kind, x, y, order, seed, title, text, image, rotation].find((entry) => !entry.ok);
  if (failed && !failed.ok) {
    return failed;
  }

  const element: CanvasElement = {
    id: id.value,
    kind: kind.value as CanvasElement["kind"],
    x: x.value,
    y: y.value,
    order: order.value,
    seed: seed.value
  };

  if (title.value !== undefined) {
    element.title = title.value;
  }
  if (text.value !== undefined) {
    element.text = text.value;
  }
  if (image.value !== undefined) {
    element.image = image.value;
  }
  if (rotation.value !== undefined) {
    element.rotation = rotation.value;
  }

  const requirementError = validateElementRequirements(element);
  if (requirementError) {
    return {
      ok: false,
      message: requirementError
    };
  }

  return { ok: true, value: element };
}

function validateElementPatchFields(value: unknown): ValidationResult<Partial<CanvasElement>> {
  if (!isRecord(value)) {
    return { ok: false, message: "element.patch payload.fields must be an object." };
  }

  const fields: Partial<CanvasElement> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key === "id" || key === "seed" || key === "kind") {
      return {
        ok: false,
        message: `${key} cannot be changed with element.patch.`
      };
    }

    if (key === "x" || key === "y" || key === "order" || key === "rotation") {
      const number = requiredNumber(raw, `fields.${key}`);
      if (!number.ok) {
        return number;
      }
      fields[key] = number.value;
      continue;
    }

    if (key === "title" || key === "text" || key === "image") {
      const text = requiredString(raw, `fields.${key}`);
      if (!text.ok) {
        return text;
      }
      fields[key] = text.value;
      continue;
    }

    return {
      ok: false,
      message: `Unsupported element.patch field: ${key}`
    };
  }

  return { ok: true, value: fields };
}

function validateSettingsPatch(value: unknown): ValidationResult<Partial<RoomSettings>> {
  if (!isRecord(value)) {
    return { ok: false, message: "settings.patch payload must be an object." };
  }

  const patch: Partial<RoomSettings> = {};
  if ("grid" in value) {
    const grid = requiredBoolean(value.grid, "settings.grid");
    if (!grid.ok) {
      return grid;
    }
    patch.grid = grid.value;
  }

  if ("glow" in value) {
    const glow = requiredBoolean(value.glow, "settings.glow");
    if (!glow.ok) {
      return glow;
    }
    patch.glow = glow.value;
  }

  return { ok: true, value: patch };
}

function validateHistoryEntry(value: unknown): ValidationResult<HistoryEntry> {
  if (!isRecord(value)) {
    return { ok: false, message: "HistoryEntry must be an object." };
  }

  const text = requiredString(value.text, "history.text");
  const at = optionalNumber(value.at, "history.at");
  const actorId = optionalString(value.actorId, "history.actorId");
  const failed = [text, at, actorId].find((entry) => !entry.ok);
  if (failed && !failed.ok) {
    return failed;
  }

  const entry: HistoryEntry = { text: text.value };
  if (at.value !== undefined) {
    entry.at = at.value;
  }
  if (actorId.value !== undefined) {
    entry.actorId = actorId.value;
  }
  return { ok: true, value: entry };
}

function validatePresenceState(value: unknown): ValidationResult<PresenceState> {
  if (!isRecord(value)) {
    return { ok: false, message: "PresenceState must be an object." };
  }

  const clientId = requiredString(value.clientId, "presence.clientId");
  const lastSeenAt = optionalNumber(value.lastSeenAt, "presence.lastSeenAt");
  if (!clientId.ok) {
    return clientId;
  }
  if (!lastSeenAt.ok) {
    return lastSeenAt;
  }

  if (!isRecord(value.user)) {
    return { ok: false, message: "presence.user must be an object." };
  }
  const name = requiredString(value.user.name, "presence.user.name");
  const color = requiredString(value.user.color, "presence.user.color");
  if (!name.ok) {
    return name;
  }
  if (!color.ok) {
    return color;
  }

  let cursor: PresenceState["cursor"] = null;
  if (value.cursor !== null && value.cursor !== undefined) {
    if (!isRecord(value.cursor)) {
      return { ok: false, message: "presence.cursor must be null or an object." };
    }
    const x = requiredNumber(value.cursor.x, "presence.cursor.x");
    const y = requiredNumber(value.cursor.y, "presence.cursor.y");
    if (!x.ok) {
      return x;
    }
    if (!y.ok) {
      return y;
    }
    cursor = { x: x.value, y: y.value };
  }

  return {
    ok: true,
    value: {
      clientId: clientId.value,
      user: {
        name: name.value,
        color: color.value
      },
      cursor,
      lastSeenAt: lastSeenAt.value ?? Date.now()
    }
  };
}

function validateElementRequirements(element: CanvasElement): string | null {
  if (!isKnownKind(element.kind)) {
    return `Unsupported element kind: ${String(element.kind)}`;
  }

  if (element.kind === "sticky") {
    return requireFields(element, ["title", "text"]);
  }

  if (element.kind === "shape-circle" || element.kind === "shape-blob" || element.kind === "text") {
    return requireFields(element, ["title"]);
  }

  if (element.kind === "media") {
    return requireFields(element, ["title", "text", "image"]);
  }

  if (element.kind === "sprint") {
    return requireFields(element, ["title", "text"]);
  }

  return null;
}

function requireFields(element: CanvasElement, fields: Array<keyof CanvasElement>): string | null {
  for (const field of fields) {
    const value = element[field];
    if (typeof value !== "string" || value.length === 0) {
      return `${element.kind} requires a non-empty ${field}.`;
    }
  }
  return null;
}

function isKnownKind(value: string): value is CanvasElement["kind"] {
  return [
    "sticky",
    "shape-circle",
    "shape-blob",
    "media",
    "text",
    "sprint"
  ].includes(value);
}

function requiredString(value: unknown, label: string): ValidationResult<string> {
  if (typeof value !== "string" || value.length === 0) {
    return { ok: false, message: `${label} must be a non-empty string.` };
  }
  return { ok: true, value };
}

function optionalString(value: unknown, label: string): ValidationResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, message: `${label} must be a string.` };
  }
  return { ok: true, value };
}

function requiredNumber(value: unknown, label: string): ValidationResult<number> {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, message: `${label} must be a finite number.` };
  }
  return { ok: true, value };
}

function optionalNumber(value: unknown, label: string): ValidationResult<number | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  return requiredNumber(value, label);
}

function requiredBoolean(value: unknown, label: string): ValidationResult<boolean> {
  if (typeof value !== "boolean") {
    return { ok: false, message: `${label} must be a boolean.` };
  }
  return { ok: true, value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withRequestId<T extends ClientMessage>(message: T, requestId?: string): T {
  if (!requestId) {
    return message;
  }

  return {
    ...message,
    requestId
  } as T;
}
