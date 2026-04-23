import type { WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { attachWsKeepAlive } from "./wsKeepAlive.js";

export type PresencePose = {
  x: number;
  z: number;
  ry: number;
};

export type PresenceLivestock = {
  sheep: number;
  goat: number;
  cow: number;
  horse: number;
  camel: number;
};

type Peer = {
  id: string;
  displayName: string;
  heroModelPath: string;
  gerLevel: number;
  livestock: PresenceLivestock;
  ws: WebSocket;
  last: PresencePose | null;
  lastSentServer: number;
};

const DEFAULT_HERO_PATH = "/models/hero-22.fbx";
const MAX_HERO_PATH_LEN = 280;

const POSE_MIN_INTERVAL_MS = 240;
const MAX_DISPLAY = 36;
const CLAMP = 6500;

const ZERO_LS: PresenceLivestock = {
  sheep: 0,
  goat: 0,
  cow: 0,
  horse: 0,
  camel: 0,
};

function clampPose(p: PresencePose): PresencePose {
  return {
    x: Math.max(-CLAMP, Math.min(CLAMP, p.x)),
    z: Math.max(-CLAMP, Math.min(CLAMP, p.z)),
    ry: Number.isFinite(p.ry) ? p.ry : 0,
  };
}

function safeJson(raw: unknown): Record<string, unknown> | null {
  try {
    const s = String(raw);
    if (s.length > 4096) return null;
    const v = JSON.parse(s) as unknown;
    return typeof v === "object" && v !== null && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function send(ws: WebSocket, msg: Record<string, unknown>): void {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function parseLivestock(body: Record<string, unknown>): PresenceLivestock {
  const raw = body.livestock;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...ZERO_LS };
  }
  const r = raw as Record<string, unknown>;
  const n = (k: string) => {
    const v = r[k];
    return typeof v === "number" && Number.isFinite(v)
      ? Math.max(0, Math.min(99, Math.floor(v)))
      : 0;
  };
  return {
    sheep: n("sheep"),
    goat: n("goat"),
    cow: n("cow"),
    horse: n("horse"),
    camel: n("camel"),
  };
}

function wirePeerRow(p: Peer): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: p.id,
    displayName: p.displayName,
    heroModelPath: p.heroModelPath,
    gerLevel: p.gerLevel,
    livestock: p.livestock,
  };
  if (p.last) {
    row.x = p.last.x;
    row.z = p.last.z;
    row.ry = p.last.ry;
  }
  return row;
}

export class MapPresenceHub {
  private readonly peers = new Map<string, Peer>();

  get peerCount(): number {
    return this.peers.size;
  }

  snapshotFor(exceptId: string): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    for (const p of this.peers.values()) {
      if (p.id === exceptId || !p.last) continue;
      out.push(wirePeerRow(p));
    }
    return out;
  }

  private broadcastPeerState(fromId: string): void {
    const rec = this.peers.get(fromId);
    if (!rec || !rec.last) return;
    const payload = JSON.stringify({
      type: "peer_pose",
      ...wirePeerRow(rec),
    });
    for (const p of this.peers.values()) {
      if (p.id === fromId) continue;
      if (p.ws.readyState === p.ws.OPEN) p.ws.send(payload);
    }
  }

  broadcastPeerLeft(leftId: string): void {
    const payload = JSON.stringify({ type: "peer_left", id: leftId });
    for (const p of this.peers.values()) {
      if (p.id === leftId) continue;
      if (p.ws.readyState === p.ws.OPEN) p.ws.send(payload);
    }
  }

  addConnection(ws: WebSocket, shardIndex = 0): void {
    attachWsKeepAlive(ws, "map-presence");
    const id = randomUUID();
    const peer: Peer = {
      id,
      displayName: "Тоглогч",
      heroModelPath: DEFAULT_HERO_PATH,
      gerLevel: 1,
      livestock: { ...ZERO_LS },
      ws,
      last: null,
      lastSentServer: 0,
    };
    this.peers.set(id, peer);

    send(ws, { type: "welcome", id, shard: shardIndex });

    const snap = this.snapshotFor(id);
    if (snap.length > 0) {
      send(ws, { type: "snapshot", peers: snap });
    }

    ws.on("message", (raw) => {
      const body = safeJson(raw);
      if (!body) return;
      const t = body.type;
      const rec = this.peers.get(id);
      if (!rec) return;

      if (t === "hello") {
        const name =
          typeof body.displayName === "string"
            ? body.displayName.slice(0, MAX_DISPLAY).trim()
            : "";
        rec.displayName = name || "Тоглогч";
        const hp =
          typeof body.heroModelPath === "string"
            ? body.heroModelPath.slice(0, MAX_HERO_PATH_LEN).trim()
            : "";
        rec.heroModelPath = hp || DEFAULT_HERO_PATH;
        const gl = Number(body.gerLevel);
        rec.gerLevel =
          Number.isFinite(gl) ? Math.max(1, Math.min(30, Math.floor(gl))) : 1;
        rec.livestock = parseLivestock(body);
        if (rec.last) this.broadcastPeerState(id);
        return;
      }

      if (t === "pose") {
        const x = Number(body.x),
          z = Number(body.z),
          ry = Number(body.ry);
        if (![x, z, ry].every((n) => Number.isFinite(n))) return;
        const now = Date.now();
        if (now - rec.lastSentServer < POSE_MIN_INTERVAL_MS) return;
        rec.lastSentServer = now;
        const pose = clampPose({ x, z, ry });
        rec.last = pose;
        this.broadcastPeerState(id);
      }
    });

    ws.on("close", () => {
      this.peers.delete(id);
      this.broadcastPeerLeft(id);
    });
  }
}
