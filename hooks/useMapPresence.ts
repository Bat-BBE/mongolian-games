"use client";

import { useCallback, useEffect, useRef } from "react";
import { getApiBaseUrl, getMapPresenceWsUrl } from "@/lib/api";

export type MapPresenceLivestock = {
  sheep: number;
  goat: number;
  cow: number;
  horse: number;
  camel: number;
};

export type MapPresencePeer = {
  id: string;
  displayName: string;
  /** Алсын баатрын загварын зам (жишээ нь /models/hero-22.fbx). */
  heroModelPath: string;
  x: number;
  z: number;
  ry: number;
  gerLevel: number;
  livestock: MapPresenceLivestock;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const DEFAULT_HERO = "/models/hero-22.fbx";

const ZERO_LS: MapPresenceLivestock = {
  sheep: 0,
  goat: 0,
  cow: 0,
  horse: 0,
  camel: 0,
};

function normalizeHeroPath(raw: string | null | undefined): string {
  const t = raw?.trim();
  return t ? t : DEFAULT_HERO;
}

function parseLivestockFromRow(row: Record<string, unknown>): MapPresenceLivestock {
  const raw = row.livestock;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...ZERO_LS };
  }
  const r = raw as Record<string, unknown>;
  const n = (k: string) => {
    const v = r[k];
    return typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : 0;
  };
  return {
    sheep: Math.max(0, n("sheep")),
    goat: Math.max(0, n("goat")),
    cow: Math.max(0, n("cow")),
    horse: Math.max(0, n("horse")),
    camel: Math.max(0, n("camel")),
  };
}

function peerFromRow(row: Record<string, unknown>): MapPresencePeer | null {
  if (typeof row.id !== "string") return null;
  const x = Number(row.x),
    z = Number(row.z),
    ry = Number(row.ry);
  if (![x, z, ry].every(Number.isFinite)) return null;
  const gl = Number(row.gerLevel);
  return {
    id: row.id,
    displayName:
      typeof row.displayName === "string" ? row.displayName : "Тоглогч",
    heroModelPath: normalizeHeroPath(
      typeof row.heroModelPath === "string" ? row.heroModelPath : undefined,
    ),
    x,
    z,
    ry,
    gerLevel: Number.isFinite(gl) ? Math.max(1, Math.min(30, Math.floor(gl))) : 1,
    livestock: parseLivestockFromRow(row),
  };
}

export function useMapPresence(opts: {
  displayName: string;
  enabled: boolean;
  heroModelPath?: string | null;
  gerLevel?: number;
  livestock?: MapPresenceLivestock | null;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const othersRef = useRef(new Map<string, MapPresencePeer>());
  const remotePeersRef = useRef<MapPresencePeer[]>([]);
  const lastPublishRef = useRef(0);
  const myIdRef = useRef<string | null>(null);
  const nameRef = useRef(opts.displayName);
  nameRef.current = opts.displayName;
  const heroPathRef = useRef(normalizeHeroPath(opts.heroModelPath));
  heroPathRef.current = normalizeHeroPath(opts.heroModelPath);
  const gerLevelRef = useRef(Math.max(1, Math.floor(opts.gerLevel ?? 1)));
  gerLevelRef.current = Math.max(1, Math.floor(opts.gerLevel ?? 1));
  const livestockRef = useRef<MapPresenceLivestock>(
    opts.livestock ?? { ...ZERO_LS },
  );
  livestockRef.current = opts.livestock ?? { ...ZERO_LS };

  const publishPose = useCallback((x: number, z: number, ry: number) => {
    const w = wsRef.current;
    if (!w || w.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (now - lastPublishRef.current < 260) return;
    lastPublishRef.current = now;
    w.send(JSON.stringify({ type: "pose", x, z, ry }));
  }, []);

  const flushList = () => {
    remotePeersRef.current = Array.from(othersRef.current.values());
  };

  useEffect(() => {
    if (!opts.enabled) {
      wsRef.current?.close();
      wsRef.current = null;
      othersRef.current.clear();
      remotePeersRef.current = [];
      myIdRef.current = null;
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const sendHello = (ws: WebSocket) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const ls = livestockRef.current;
      ws.send(
        JSON.stringify({
          type: "hello",
          displayName: nameRef.current?.trim() || "Тоглогч",
          heroModelPath: heroPathRef.current,
          gerLevel: gerLevelRef.current,
          livestock: ls,
        }),
      );
    };

    const connect = () => {
      if (cancelled) return;
      const url = getMapPresenceWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        sendHello(ws);
      };

      ws.onerror = () => {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[map-presence] WebSocket — API ассан уу? Баз:",
            getApiBaseUrl(),
            "| WS:",
            url,
          );
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        myIdRef.current = null;
        othersRef.current.clear();
        remotePeersRef.current = [];
        attempt += 1;
        const delay = Math.min(
          30_000,
          Math.round(500 * Math.pow(1.55, Math.min(attempt, 10))),
        );
        retryTimer = setTimeout(() => {
          retryTimer = null;
          connect();
        }, delay);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        let msg: unknown;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (!isRecord(msg)) return;
        const ty = msg.type;

        if (ty === "welcome" && typeof msg.id === "string") {
          myIdRef.current = msg.id;
          return;
        }

        if (ty === "snapshot" && Array.isArray(msg.peers)) {
          for (const row of msg.peers) {
            if (!isRecord(row) || typeof row.id !== "string") continue;
            if (row.id === myIdRef.current) continue;
            const p = peerFromRow(row);
            if (p) othersRef.current.set(row.id, p);
          }
          flushList();
          return;
        }

        if (ty === "peer_pose" && typeof msg.id === "string") {
          if (msg.id === myIdRef.current) return;
          const p = peerFromRow(msg);
          if (p) {
            othersRef.current.set(msg.id, p);
            flushList();
          }
          return;
        }

        if (ty === "peer_left" && typeof msg.id === "string") {
          othersRef.current.delete(msg.id);
          flushList();
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
      othersRef.current.clear();
      remotePeersRef.current = [];
      myIdRef.current = null;
    };
  }, [opts.enabled]);

  useEffect(() => {
    if (!opts.enabled) return;
    const w = wsRef.current;
    if (!w || w.readyState !== WebSocket.OPEN) return;
    const ls = opts.livestock ?? { ...ZERO_LS };
    w.send(
      JSON.stringify({
        type: "hello",
        displayName: nameRef.current?.trim() || "Тоглогч",
        heroModelPath: heroPathRef.current,
        gerLevel: Math.max(1, Math.floor(opts.gerLevel ?? 1)),
        livestock: ls,
      }),
    );
  }, [
    opts.enabled,
    opts.heroModelPath,
    opts.displayName,
    opts.gerLevel,
    opts.livestock,
  ]);

  return { publishPose, remotePeersRef };
}
