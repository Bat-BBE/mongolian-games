import type { WebSocket } from "ws";
import { randomUUID } from "node:crypto";

export type PresencePose = {
  x: number;
  z: number;
  ry: number;
};

type Peer = {
  id: string;
  displayName: string;
  /** Клиентийн сонгосон FBX/GLB зам — бусад дээр ижил загвараар харагдана. */
  heroModelPath: string;
  ws: WebSocket;
  last: PresencePose | null;
  lastSentServer: number;
};

const DEFAULT_HERO_PATH = "/models/hero-22.fbx";
const MAX_HERO_PATH_LEN = 280;

const POSE_MIN_INTERVAL_MS = 240;
const MAX_DISPLAY = 36;
const CLAMP = 6500;

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

export class MapPresenceHub {
  private readonly peers = new Map<string, Peer>();

  snapshotFor(exceptId: string): Array<{
    id: string;
    displayName: string;
    heroModelPath: string;
    x: number;
    z: number;
    ry: number;
  }> {
    const out: Array<{
      id: string;
      displayName: string;
      heroModelPath: string;
      x: number;
      z: number;
      ry: number;
    }> = [];
    for (const p of this.peers.values()) {
      if (p.id === exceptId || !p.last) continue;
      out.push({
        id: p.id,
        displayName: p.displayName,
        heroModelPath: p.heroModelPath,
        x: p.last.x,
        z: p.last.z,
        ry: p.last.ry,
      });
    }
    return out;
  }

  broadcastPeerPose(
    fromId: string,
    displayName: string,
    pose: PresencePose,
  ): void {
    const from = this.peers.get(fromId);
    const heroModelPath = from?.heroModelPath ?? DEFAULT_HERO_PATH;
    const payload = JSON.stringify({
      type: "peer_pose",
      id: fromId,
      displayName,
      heroModelPath,
      x: pose.x,
      z: pose.z,
      ry: pose.ry,
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

  addConnection(ws: WebSocket): void {
    const id = randomUUID();
    const peer: Peer = {
      id,
      displayName: "Тоглогч",
      heroModelPath: DEFAULT_HERO_PATH,
      ws,
      last: null,
      lastSentServer: 0,
    };
    this.peers.set(id, peer);

    send(ws, { type: "welcome", id });

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
        this.broadcastPeerPose(id, rec.displayName, pose);
      }
    });

    ws.on("close", () => {
      this.peers.delete(id);
      this.broadcastPeerLeft(id);
    });
  }
}
