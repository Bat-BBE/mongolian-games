import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { MatchRoomManager, type Room } from "./matchRooms.js";

type ConnMeta = { playerId: string };

const META = new WeakMap<WebSocket, ConnMeta>();

function safeJsonParse(raw: RawData): unknown {
  try {
    const s = raw.toString();
    if (s.length > 32_768) return null;
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function send(ws: WebSocket, msg: Record<string, unknown>): void {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function broadcastRoom(
  room: Room,
  msg: Record<string, unknown>,
  exceptId?: string,
): void {
  const payload = JSON.stringify(msg);
  for (const p of room.players.values()) {
    if (p.id === exceptId) continue;
    if (p.ws.readyState === p.ws.OPEN) p.ws.send(payload);
  }
}

function roomStatePayload(manager: MatchRoomManager, room: Room) {
  return {
    type: "room_state",
    code: room.code,
    hostId: room.hostId,
    gameType: room.gameType,
    gameSlug: room.gameSlug,
    maxPlayers: room.maxPlayers,
    status: room.status,
    players: manager.toPublicPlayers(room),
  };
}

/** `noServer: true` — HTTP `upgrade`-ийг `index.ts` дээр нэг газраас дамжуулна. */
export function createMatchWebSocketServer(
  manager: MatchRoomManager,
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  setInterval(() => manager.pruneStaleRooms(), 120_000).unref?.();

  wss.on("connection", (ws) => {
    const playerId = manager.newPlayerId();
    META.set(ws, { playerId });
    send(ws, { type: "welcome", playerId });

    ws.on("message", (raw) => {
      const body = safeJsonParse(raw);
      if (!isRecord(body)) {
        send(ws, { type: "error", message: "bad_json" });
        return;
      }

      const t = body.type;
      if (typeof t !== "string") {
        send(ws, { type: "error", message: "missing_type" });
        return;
      }

      const meta = META.get(ws);
      if (!meta) return;

      if (t === "create") {
        const existing = manager.findRoomForPlayer(meta.playerId);
        if (existing) {
          send(ws, { type: "error", message: "leave_room_first" });
          return;
        }
        const displayName =
          typeof body.displayName === "string" ? body.displayName : "Player";
        const gameType = typeof body.gameType === "string" ? body.gameType : "";
        const gameSlug = typeof body.gameSlug === "string" ? body.gameSlug : "";
        let maxPlayers = 2;
        if (typeof body.maxPlayers === "number" && Number.isFinite(body.maxPlayers)) {
          maxPlayers = Math.floor(body.maxPlayers);
        }
        if (!gameType.trim()) {
          send(ws, { type: "error", message: "gameType_required" });
          return;
        }
        const preferredCode =
          typeof body.preferredCode === "string" ? body.preferredCode : undefined;
        const created = manager.createRoom({
          hostId: meta.playerId,
          hostWs: ws,
          displayName,
          gameType: gameType.trim(),
          gameSlug: gameSlug.trim(),
          maxPlayers,
          preferredCode,
        });
        if (!created.ok) {
          send(ws, { type: "error", message: created.error });
          return;
        }
        send(ws, roomStatePayload(manager, created.room));
        return;
      }

      if (t === "join") {
        const existing = manager.findRoomForPlayer(meta.playerId);
        if (existing) {
          send(ws, { type: "error", message: "leave_room_first" });
          return;
        }
        const code = typeof body.code === "string" ? body.code : "";
        const displayName =
          typeof body.displayName === "string" ? body.displayName : "Player";
        const res = manager.joinRoom({
          code,
          playerId: meta.playerId,
          ws,
          displayName,
        });
        if (!res.ok) {
          send(ws, { type: "error", message: res.error });
          return;
        }
        send(ws, roomStatePayload(manager, res.room));
        broadcastRoom(res.room, roomStatePayload(manager, res.room), meta.playerId);
        return;
      }

      if (t === "leave") {
        const left = manager.removePlayer(meta.playerId);
        if (left) {
          broadcastRoom(left, roomStatePayload(manager, left));
        }
        send(ws, { type: "left_room" });
        return;
      }

      const room = manager.findRoomForPlayer(meta.playerId);
      if (!room) {
        send(ws, { type: "error", message: "not_in_room" });
        return;
      }

      if (t === "set_ready") {
        const ready = Boolean(body.ready);
        manager.setReady(room, meta.playerId, ready);
        broadcastRoom(room, roomStatePayload(manager, room));
        return;
      }

      if (t === "start_match") {
        const forceSolo = Boolean(body.forceSolo);
        if (!manager.canHostStart(room, meta.playerId, { forceSolo })) {
          send(ws, { type: "error", message: "cannot_start" });
          return;
        }
        const seed = manager.beginMatch(room);
        const startedAt = Date.now();
        const begin = {
          type: "match_begin",
          seed,
          startedAt,
          gameType: room.gameType,
          gameSlug: room.gameSlug,
        };
        for (const p of room.players.values()) {
          if (p.ws.readyState === p.ws.OPEN) p.ws.send(JSON.stringify(begin));
        }
        broadcastRoom(room, roomStatePayload(manager, room));
        return;
      }

      if (t === "reset_room") {
        if (room.hostId !== meta.playerId) {
          send(ws, { type: "error", message: "host_only" });
          return;
        }
        room.status = "lobby";
        for (const pl of room.players.values()) pl.ready = false;
        broadcastRoom(room, roomStatePayload(manager, room));
        return;
      }

      if (t === "relay") {
        const channel =
          typeof body.channel === "string" ? body.channel.slice(0, 64) : "";
        if (!channel) {
          send(ws, { type: "error", message: "relay_channel_required" });
          return;
        }
        broadcastRoom(room, {
          type: "peer_relay",
          from: meta.playerId,
          channel,
          payload: body.payload ?? null,
        }, meta.playerId);
        return;
      }

      if (t === "ping") {
        send(ws, { type: "pong", t: body.t });
        return;
      }

      send(ws, { type: "error", message: "unknown_type" });
    });

    ws.on("close", () => {
      const left = manager.removePlayer(playerId);
      if (left) {
        broadcastRoom(left, roomStatePayload(manager, left));
      }
    });
  });

  return wss;
}
