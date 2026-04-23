"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl, getMatchWsUrl } from "@/lib/api";

export type MatchRoomPlayer = {
  id: string;
  displayName: string;
  ready: boolean;
};

export function useMatchRoom(opts: {
  enabled: boolean;
  gameType: string;
  gameSlug: string;
  displayName: string;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const nameRef = useRef(opts.displayName);
  nameRef.current = opts.displayName;
  /** «Өрөө нээх» дээр сонгосон кодыг code_taken бол join руу шилжүүлнэ. */
  const pendingJoinOnCodeTakenRef = useRef<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [players, setPlayers] = useState<MatchRoomPlayer[]>([]);
  const [roomStatus, setRoomStatus] = useState<"lobby" | "playing" | null>(
    null,
  );
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [matchSeed, setMatchSeed] = useState<number | null>(null);
  const [matchStartedAt, setMatchStartedAt] = useState<number | null>(null);

  const send = useCallback((msg: Record<string, unknown>) => {
    const w = wsRef.current;
    if (w?.readyState === WebSocket.OPEN) w.send(JSON.stringify(msg));
  }, []);

  const createRoom = useCallback(
    (preferredCode?: string) => {
      setError(null);
      const raw = preferredCode?.trim().toUpperCase() ?? "";
      pendingJoinOnCodeTakenRef.current =
        raw.length === 6 ? raw : null;
      send({
        type: "create",
        displayName: nameRef.current?.trim() || "Player",
        gameType: opts.gameType,
        gameSlug: opts.gameSlug,
        maxPlayers: 20,
        preferredCode: raw.length === 6 ? raw : undefined,
      });
    },
    [send, opts.gameType, opts.gameSlug],
  );

  const joinRoom = useCallback(
    (code: string) => {
      setError(null);
      send({
        type: "join",
        code: code.trim().toUpperCase(),
        displayName: nameRef.current?.trim() || "Player",
      });
    },
    [send],
  );

  const leaveRoom = useCallback(() => {
    send({ type: "leave" });
    setRoomCode(null);
    setHostId(null);
    setPlayers([]);
    setRoomStatus(null);
    setMatchSeed(null);
    setMatchStartedAt(null);
  }, [send]);

  const setReady = useCallback(
    (ready: boolean) => {
      send({ type: "set_ready", ready });
    },
    [send],
  );

  const startMatch = useCallback((opts?: { forceSolo?: boolean }) => {
    send({
      type: "start_match",
      ...(opts?.forceSolo ? { forceSolo: true } : {}),
    });
  }, [send]);

  const resetRoomLobby = useCallback(() => {
    send({ type: "reset_room" });
    setMatchSeed(null);
    setMatchStartedAt(null);
  }, [send]);

  useEffect(() => {
    if (!opts.enabled) {
      pendingJoinOnCodeTakenRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      setPlayerId(null);
      setRoomCode(null);
      setHostId(null);
      setPlayers([]);
      setRoomStatus(null);
      setMatchSeed(null);
      setMatchStartedAt(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      const url = getMatchWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        setConnected(true);
        setError(null);
      };

      ws.onerror = () => {
        if (cancelled) return;
        setError("connection_failed");
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[match] WebSocket — API ассан уу? Баз:",
            getApiBaseUrl(),
            "| WS:",
            url,
          );
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        setConnected(false);
        setPlayerId(null);
        setRoomCode(null);
        setHostId(null);
        setPlayers([]);
        setRoomStatus(null);
        setMatchSeed(null);
        setMatchStartedAt(null);
        attempt += 1;
        const delay = Math.min(
          30_000,
          Math.round(650 * Math.pow(1.5, Math.min(attempt, 10))),
        );
        retryTimer = setTimeout(() => {
          retryTimer = null;
          connect();
        }, delay);
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
        } catch {
          return;
        }
        const ty = msg.type;
        if (ty === "welcome" && typeof msg.playerId === "string") {
          setPlayerId(msg.playerId);
          return;
        }
        if (ty === "error" && typeof msg.message === "string") {
          const m = msg.message;
          if (m === "code_taken") {
            const joinCode = pendingJoinOnCodeTakenRef.current;
            pendingJoinOnCodeTakenRef.current = null;
            if (joinCode) {
              setError(null);
              send({
                type: "join",
                code: joinCode,
                displayName: nameRef.current?.trim() || "Player",
              });
              return;
            }
          }
          setError(m);
          return;
        }
        if (ty === "left_room") {
          pendingJoinOnCodeTakenRef.current = null;
          setRoomCode(null);
          setHostId(null);
          setPlayers([]);
          setRoomStatus(null);
          setMatchSeed(null);
          setMatchStartedAt(null);
          return;
        }
        if (ty === "room_state") {
          pendingJoinOnCodeTakenRef.current = null;
          if (typeof msg.code === "string") setRoomCode(msg.code);
          if (typeof msg.hostId === "string") setHostId(msg.hostId);
          if (msg.status === "lobby" || msg.status === "playing") {
            setRoomStatus(msg.status);
            if (msg.status === "lobby") {
              setMatchSeed(null);
              setMatchStartedAt(null);
            }
          }
          if (typeof msg.maxPlayers === "number") setMaxPlayers(msg.maxPlayers);
          const pl = msg.players;
          if (Array.isArray(pl)) {
            setPlayers(
              pl.map((p) => {
                const r = p as Record<string, unknown>;
                return {
                  id: String(r.id ?? ""),
                  displayName: String(r.displayName ?? ""),
                  ready: Boolean(r.ready),
                };
              }),
            );
          }
          return;
        }
        if (ty === "match_begin") {
          if (typeof msg.seed === "number") setMatchSeed(msg.seed);
          if (typeof msg.startedAt === "number")
            setMatchStartedAt(msg.startedAt);
          return;
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [opts.enabled, opts.gameType, opts.gameSlug, send]);

  const isHost = Boolean(playerId && hostId && playerId === hostId);

  return {
    connected,
    playerId,
    roomCode,
    hostId,
    players,
    roomStatus,
    maxPlayers,
    error,
    matchSeed,
    matchStartedAt,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startMatch,
    resetRoomLobby,
  };
}

export type MatchRoomControls = ReturnType<typeof useMatchRoom>;
