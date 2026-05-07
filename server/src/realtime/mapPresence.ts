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
  homeKey: string;
  gerLevel: number;
  livestock: PresenceLivestock;
  /** `components/dashboard/useThreeScene` MAP_EMOTE_CLIP_FILES-ийн түлхүүрүүд */
  emote: string;
  emoteGen: number;
  ws: WebSocket;
  last: PresencePose | null;
  lastSentServer: number;
  lastEmoteServer: number;
  lastChatServer: number;
};

const DEFAULT_HERO_PATH = "/models/hero-22.fbx";
const MAX_HERO_PATH_LEN = 280;
const MAX_HOME_KEY_LEN = 200;

const POSE_MIN_INTERVAL_MS = 240;
/** Ижил эмож дахин дарах, спам */
const EMOTE_MIN_INTERVAL_MS = 420;
const MAX_DISPLAY = 36;
const CLAMP = 6500;
const MAX_CHAT_LEN = 280;
const CHAT_MIN_INTERVAL_MS = 500;

const ALLOWED_MAP_EMOTES = new Set([
  "boxing",
  "booty",
  "praying",
  "silly_dance",
]);

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

function parseChatText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_CHAT_LEN);
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function spawnPoseForPeer(id: string): PresencePose {
  const h = hashString(id);
  const radius = 18 + (h % 28); // 18..45
  const angle = ((h % 360) * Math.PI) / 180;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    ry: angle + Math.PI,
  };
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
  if (p.homeKey) {
    row.homeKey = p.homeKey;
  }
  row.emote = p.emote;
  row.emoteGen = p.emoteGen;
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
      homeKey: "",
      gerLevel: 1,
      livestock: { ...ZERO_LS },
      emote: "",
      emoteGen: 0,
      ws,
      last: null,
      lastSentServer: 0,
      lastEmoteServer: 0,
      lastChatServer: 0,
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
        const hkr =
          typeof body.homeKey === "string"
            ? body.homeKey.slice(0, MAX_HOME_KEY_LEN).trim()
            : "";
        rec.homeKey = hkr;
        // Эхний pose-оос өмнө `last` байхгүй тул бусад нь `snapshot`/`peer_pose`-оор
        // харагдаагүй байсан. `hello` ирмэгц placeholder байрлал өгч зарлана.
        if (!rec.last) {
          rec.last = spawnPoseForPeer(id);
        }
        this.broadcastPeerState(id);
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
        return;
      }

      if (t === "emote") {
        const rawEm =
          typeof body.emote === "string" ? body.emote.slice(0, 32).trim() : "";
        if (!rawEm || !ALLOWED_MAP_EMOTES.has(rawEm)) return;
        const now = Date.now();
        if (now - rec.lastEmoteServer < EMOTE_MIN_INTERVAL_MS) return;
        rec.lastEmoteServer = now;
        rec.emote = rawEm;
        rec.emoteGen += 1;
        this.broadcastPeerState(id);
        return;
      }

      if (t === "chat") {
        const text = parseChatText(body.text);
        if (!text) return;
        const now = Date.now();
        if (now - rec.lastChatServer < CHAT_MIN_INTERVAL_MS) return;
        rec.lastChatServer = now;
        const payload = JSON.stringify({
          type: "peer_chat",
          id: rec.id,
          displayName: rec.displayName,
          text,
          sentAt: now,
          messageId: `${rec.id}:${now}:${Math.random().toString(36).slice(2, 7)}`,
        });
        for (const p of this.peers.values()) {
          if (p.ws.readyState === p.ws.OPEN) p.ws.send(payload);
        }
      }
    });

    ws.on("close", () => {
      this.peers.delete(id);
      this.broadcastPeerLeft(id);
    });
  }
}
