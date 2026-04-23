import type { WebSocket } from "ws";
import { randomInt, randomUUID } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_TTL_MS = 45 * 60 * 1000;

export type RoomPlayer = {
  id: string;
  displayName: string;
  ready: boolean;
  ws: WebSocket;
};

export type Room = {
  code: string;
  hostId: string;
  gameType: string;
  gameSlug: string;
  maxPlayers: number;
  players: Map<string, RoomPlayer>;
  status: "lobby" | "playing";
  createdAt: number;
};

export type RoomPublicPlayer = {
  id: string;
  displayName: string;
  ready: boolean;
};

function randomRoomCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]!;
  }
  return s;
}

function normalizePreferredCode(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const u = raw.trim().toUpperCase();
  if (u.length !== 6) return null;
  for (let i = 0; i < u.length; i++) {
    if (!CODE_ALPHABET.includes(u[i]!)) return null;
  }
  return u;
}

export class MatchRoomManager {
  readonly rooms = new Map<string, Room>();
  private readonly playerRoom = new Map<string, string>();

  findRoomForPlayer(playerId: string): Room | undefined {
    const code = this.playerRoom.get(playerId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  createRoom(params: {
    hostId: string;
    hostWs: WebSocket;
    displayName: string;
    gameType: string;
    gameSlug: string;
    maxPlayers: number;
    preferredCode?: string | null;
  }):
    | { ok: true; room: Room }
    | { ok: false; error: "code_taken" } {
    let code: string;
    const pref = normalizePreferredCode(params.preferredCode ?? undefined);
    if (pref) {
      if (this.rooms.has(pref)) {
        return { ok: false, error: "code_taken" };
      }
      code = pref;
    } else {
      code = randomRoomCode();
      while (this.rooms.has(code)) code = randomRoomCode();
    }

    const host: RoomPlayer = {
      id: params.hostId,
      displayName: params.displayName.slice(0, 40),
      ready: false,
      ws: params.hostWs,
    };

    const room: Room = {
      code,
      hostId: params.hostId,
      gameType: params.gameType.slice(0, 64),
      gameSlug: params.gameSlug.slice(0, 64),
      maxPlayers: Math.max(2, Math.min(4, params.maxPlayers)),
      players: new Map([[params.hostId, host]]),
      status: "lobby",
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerRoom.set(params.hostId, code);
    return { ok: true, room };
  }

  joinRoom(params: {
    code: string;
    playerId: string;
    ws: WebSocket;
    displayName: string;
  }): { ok: true; room: Room } | { ok: false; error: string } {
    const raw = params.code.trim().toUpperCase();
    const room = this.rooms.get(raw);
    if (!room) return { ok: false, error: "room_not_found" };
    if (room.status !== "lobby") {
      return { ok: false, error: "match_already_started" };
    }
    if (room.players.size >= room.maxPlayers) {
      return { ok: false, error: "room_full" };
    }
    if (room.players.has(params.playerId)) {
      return { ok: false, error: "already_in_room" };
    }

    const p: RoomPlayer = {
      id: params.playerId,
      displayName: params.displayName.slice(0, 40),
      ready: false,
      ws: params.ws,
    };
    room.players.set(params.playerId, p);
    this.playerRoom.set(params.playerId, raw);
    return { ok: true, room };
  }

  removePlayer(playerId: string): Room | null {
    const code = this.playerRoom.get(playerId);
    if (!code) return null;
    const room = this.rooms.get(code);
    if (!room) {
      this.playerRoom.delete(playerId);
      return null;
    }

    room.players.delete(playerId);
    this.playerRoom.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (room.hostId === playerId) {
      const next = room.players.values().next().value as RoomPlayer | undefined;
      if (next) room.hostId = next.id;
    }

    if (room.players.size < 2 && room.status === "playing") {
      room.status = "lobby";
    }

    return room;
  }

  setReady(room: Room, playerId: string, ready: boolean): boolean {
    const p = room.players.get(playerId);
    if (!p) return false;
    p.ready = ready;
    return true;
  }

  canHostStart(
    room: Room,
    hostId: string,
    opts?: { forceSolo?: boolean },
  ): boolean {
    if (room.hostId !== hostId) return false;
    if (room.status !== "lobby") return false;
    const n = room.players.size;
    if (opts?.forceSolo) {
      return n === 1;
    }
    if (n < 2) return false;
    for (const pl of room.players.values()) {
      if (!pl.ready) return false;
    }
    return true;
  }

  beginMatch(room: Room): number {
    room.status = "playing";
    for (const pl of room.players.values()) pl.ready = false;
    return randomInt(1, 0x7fffffff);
  }

  toPublicPlayers(room: Room): RoomPublicPlayer[] {
    return [...room.players.values()].map((p) => ({
      id: p.id,
      displayName: p.displayName,
      ready: p.ready,
    }));
  }

  newPlayerId(): string {
    return randomUUID();
  }

  pruneStaleRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.players.size > 0) continue;
      if (now - room.createdAt > ROOM_TTL_MS) this.rooms.delete(code);
    }
  }
}
