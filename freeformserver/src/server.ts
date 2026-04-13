import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import WebSocket, { WebSocketServer, type RawData } from "ws";
import { RoomStore } from "./store.js";
import type { PresenceState, ServerMessage } from "./types.js";
import { parseClientMessage, validateRoomId } from "./validation.js";

type ClientSession = {
  socket: WebSocket;
  roomId: string;
  clientId: string;
};

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8787);
const store = new RoomStore(20);
const sessions = new Set<ClientSession>();

const server = createServer(async (request, response) => {
  try {
    addCorsHeaders(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const route = matchRoomRoute(url.pathname);

    if (request.method === "GET" && url.pathname === "/health") {
      return writeJson(response, 200, {
        ok: true,
        service: "freeformserver"
      });
    }

    if (request.method === "GET" && route?.action === "snapshot") {
      return handleSnapshot(response, route.roomId);
    }

    if (request.method === "GET" && route?.action === "presence") {
      return handlePresence(response, route.roomId);
    }

    if (request.method === "POST" && route?.action === "seed") {
      await readRequestBody(request);
      return handleSeed(response, route.roomId);
    }

    writeJson(response, 404, {
      error: {
        code: "NOT_FOUND",
        message: `No route for ${request.method} ${url.pathname}`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    writeJson(response, 500, {
      error: {
        code: "INTERNAL_ERROR",
        message
      }
    });
  }
});

const websocketServer = new WebSocketServer({
  noServer: true
});

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname !== "/ws") {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    const roomIdParam = url.searchParams.get("room") ?? "";
    const clientIdParam = url.searchParams.get("clientId") ?? "";
    const roomId = validateRoomId(roomIdParam);
    const clientId = validateRoomId(clientIdParam);

    if (!roomId.ok || !clientId.ok) {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      registerConnection(websocket, request, roomId.value, clientId.value);
    });
  } catch {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  }
});

server.listen(port, host, () => {
  const address = host === "0.0.0.0" ? "localhost" : host;
  console.log(`freeformserver listening on http://${address}:${port}`);
});

function registerConnection(
  socket: WebSocket,
  _request: IncomingMessage,
  roomId: string,
  clientId: string
): void {
  const session: ClientSession = {
    socket,
    roomId,
    clientId
  };
  sessions.add(session);

  store.seedIfNeeded(session.roomId);
  send(
    socket,
    withRequestId({
      type: "room.snapshot",
      payload: store.getSnapshot(session.roomId)
    })
  );
  send(
    socket,
    withRequestId({
      type: "presence.list",
      payload: store.getPresence(session.roomId)
    })
  );

  socket.on("message", (raw) => handleSocketMessage(session, raw));
  socket.on("close", () => handleDisconnect(session));
  socket.on("error", () => handleDisconnect(session));
}

function handleSnapshot(response: ServerResponse, roomId: string): void {
  const valid = validateRoomId(roomId);
  if (!valid.ok) {
    writeJson(response, 400, errorResponse("INVALID_ROOM_ID", valid.message));
    return;
  }

  writeJson(response, 200, store.getSnapshot(valid.value));
}

function handlePresence(response: ServerResponse, roomId: string): void {
  const valid = validateRoomId(roomId);
  if (!valid.ok) {
    writeJson(response, 400, errorResponse("INVALID_ROOM_ID", valid.message));
    return;
  }

  writeJson(response, 200, {
    roomId: valid.value,
    presence: store.getPresence(valid.value)
  });
}

function handleSeed(response: ServerResponse, roomId: string): void {
  const valid = validateRoomId(roomId);
  if (!valid.ok) {
    writeJson(response, 400, errorResponse("INVALID_ROOM_ID", valid.message));
    return;
  }

  writeJson(response, 200, store.seedIfNeeded(valid.value));
}

function handleSocketMessage(session: ClientSession, raw: RawData): void {
  const text = normalizeMessage(raw);
  if (text === null) {
    send(session.socket, {
      type: "error",
      payload: {
        code: "INVALID_MESSAGE",
        message: "WebSocket messages must be text JSON."
      }
    });
    return;
  }

  const parsed = parseClientMessage(text);
  if (!parsed.ok) {
    send(session.socket, {
      type: "error",
      payload: {
        code: "BAD_REQUEST",
        message: parsed.message
      }
    });
    return;
  }

  const message = parsed.value;

  if (message.type === "room.snapshot.request") {
    send(session.socket, withRequestId({
      type: "room.snapshot",
      payload: store.getSnapshot(session.roomId)
    }, message.requestId));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "presence.update") {
    const presence: PresenceState = {
      ...message.payload,
      clientId: session.clientId,
      lastSeenAt: Date.now()
    };
    const updated = store.upsertPresence(session.roomId, presence);
    broadcast(session.roomId, withRequestId({
      type: "presence.updated",
      payload: updated
    }, message.requestId));
    broadcast(session.roomId, withRequestId({
      type: "presence.list",
      payload: store.getPresence(session.roomId)
    }));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "element.upsert") {
    const element = store.upsertElement(session.roomId, message.payload);
    broadcast(session.roomId, withRequestId({
      type: "element.upserted",
      payload: element
    }, message.requestId));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "element.patch") {
    const patched = store.patchElement(session.roomId, message.payload.id, message.payload.fields);
    if (!patched) {
      send(session.socket, withRequestId({
        type: "error",
        payload: {
          code: "NOT_FOUND",
          message: `Element ${message.payload.id} was not found.`
        },
      }, message.requestId));
      return;
    }
    broadcast(session.roomId, withRequestId({
      type: "element.patched",
      payload: {
        id: message.payload.id,
        fields: patched
      }
    }, message.requestId));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "element.delete") {
    const deleted = store.deleteElement(session.roomId, message.payload.id);
    if (!deleted) {
      send(session.socket, withRequestId({
        type: "error",
        payload: {
          code: "NOT_FOUND",
          message: `Element ${message.payload.id} was not found.`
        },
      }, message.requestId));
      return;
    }
    broadcast(session.roomId, withRequestId({
      type: "element.deleted",
      payload: {
        id: message.payload.id
      }
    }, message.requestId));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "settings.patch") {
    const patch = store.patchSettings(session.roomId, message.payload);
    broadcast(session.roomId, withRequestId({
      type: "settings.patched",
      payload: patch
    }, message.requestId));
    sendAck(session.socket, message.requestId);
    return;
  }

  if (message.type === "history.append") {
    const entry = store.appendHistory(session.roomId, message.payload);
    broadcast(session.roomId, withRequestId({
      type: "history.appended",
      payload: entry
    }, message.requestId));
    sendAck(session.socket, message.requestId);
  }
}

function handleDisconnect(session: ClientSession): void {
  if (!sessions.has(session)) {
    return;
  }

  sessions.delete(session);

  const stillConnected = Array.from(sessions).some((entry) => {
    return entry.roomId === session.roomId && entry.clientId === session.clientId;
  });

  if (stillConnected) {
    return;
  }

  const presence = store.removePresence(session.roomId, session.clientId);
  broadcast(session.roomId, {
    type: "presence.list",
    payload: presence
  });
}

function broadcast(roomId: string, message: ServerMessage): void {
  for (const session of sessions) {
    if (session.roomId !== roomId) {
      continue;
    }
    send(session.socket, message);
  }
}

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }
  socket.send(JSON.stringify(message));
}

function sendAck(socket: WebSocket, requestId?: string): void {
  send(socket, {
    type: "ack",
    payload: requestId ? { requestId } : {}
  });
}

function normalizeMessage(raw: RawData): string | null {
  if (typeof raw === "string") {
    return raw;
  }

  if (raw instanceof Buffer) {
    return raw.toString("utf8");
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString("utf8");
  }

  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw).toString("utf8");
  }

  return null;
}

function matchRoomRoute(pathname: string): { roomId: string; action: "snapshot" | "seed" | "presence" } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts.length > 4 || parts[0] !== "api" || parts[1] !== "rooms" || !parts[2]) {
    return null;
  }

  const roomId = decodeURIComponent(parts[2]);
  const action = parts[3];

  if (!action) {
    return {
      roomId,
      action: "snapshot"
    };
  }

  if (action === "snapshot" || action === "seed" || action === "presence") {
    return {
      roomId,
      action
    };
  }

  return null;
}

function addCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode);
  response.end(JSON.stringify(payload));
}

function errorResponse(code: string, message: string): {
  error: {
    code: string;
    message: string;
  };
} {
  return {
    error: {
      code,
      message
    }
  };
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  return await new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function withRequestId<T extends ServerMessage>(message: T, requestId?: string): T {
  if (!requestId) {
    return message;
  }

  return {
    ...message,
    requestId
  } as T;
}
