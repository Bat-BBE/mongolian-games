"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMatchRoom } from "@/hooks/useMatchRoom";
import { mulberry32 } from "@/components/game/fourPowersType";
import { deriveDuelMatchCode } from "@/lib/archeryDuel/duelMatchCode";
import { ARCHERY_DUEL_RELAY_CHANNEL } from "@/lib/archeryDuel/duelRelayChannel";
import type { MapPresenceChallenge } from "@/hooks/useMapPresence";

export type DuelPhase =
  | "idle"
  | "challenge_received"
  | "connecting"
  | "countdown"
  | "aiming"
  | "resolved";

export type DuelShot = { power: number; angle: number };

export type DuelResult = {
  winnerId: string;
  myAccuracy: number;
  opponentAccuracy: number;
  myHit: boolean;
  opponentHit: boolean;
};

/** Deterministic "bullseye" window for this match, derived from the shared
 * match seed — both clients compute the identical target independently.
 * Exported so the aim HUD can reveal the same window to the player (there is
 * no secret-information asymmetry to protect here: both sides shoot at the
 * same target independently, there's no bluffing/hidden-state to exploit). */
export function seededTarget(seed: number): { power: number; angle: number } {
  const rng = mulberry32(seed);
  return { power: 0.35 + rng() * 0.45, angle: -0.35 + rng() * 0.7 };
}

function shotAccuracy(shot: DuelShot, target: { power: number; angle: number }): number {
  const dp = Math.abs(shot.power - target.power);
  const da = Math.abs(shot.angle - target.angle);
  return Math.max(0, 1 - (dp * 1.6 + da * 1.1));
}

const HIT_THRESHOLD = 0.55;

/**
 * Resolves a duel purely from (seed, shotA+idA, shotB+idB) — never from which
 * shot "arrived first" on either client, since network arrival order can
 * differ between the two peers. Same inputs -> same output on both ends.
 */
function resolveDuel(
  seed: number,
  idA: string,
  shotA: DuelShot,
  idB: string,
  shotB: DuelShot,
): DuelResult {
  const target = seededTarget(seed);
  const accA = shotAccuracy(shotA, target);
  const accB = shotAccuracy(shotB, target);
  const hitA = accA >= HIT_THRESHOLD;
  const hitB = accB >= HIT_THRESHOLD;

  let winnerId: string;
  if (hitA && !hitB) winnerId = idA;
  else if (hitB && !hitA) winnerId = idB;
  else if (accA !== accB) winnerId = accA > accB ? idA : idB;
  else winnerId = [idA, idB].sort()[0]!; // fully deterministic fallback tie-break

  return { winnerId, myAccuracy: accA, opponentAccuracy: accB, myHit: hitA, opponentHit: hitB };
}

export function useArcheryDuel(opts: {
  myDisplayName: string;
  sendChallenge: (targetId: string, code: string) => void;
  setOnPeerChallenged: (
    listener: ((challenge: MapPresenceChallenge) => void) | null,
  ) => void;
}) {
  const [phase, setPhase] = useState<DuelPhase>("idle");
  const [opponentPresenceId, setOpponentPresenceId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myShot, setMyShot] = useState<DuelShot | null>(null);
  const [opponentShot, setOpponentShot] = useState<DuelShot | null>(null);
  const [result, setResult] = useState<DuelResult | null>(null);
  const createdRef = useRef(false);
  const startedRef = useRef(false);

  const mr = useMatchRoom({
    enabled: phase !== "idle" && phase !== "challenge_received",
    gameType: "archery-duel",
    gameSlug: "archery-duel",
    displayName: opts.myDisplayName,
    maxRoomPlayers: 2,
  });

  // Incoming challenge from another player.
  useEffect(() => {
    opts.setOnPeerChallenged((c) => {
      if (phase !== "idle") return; // already busy
      setOpponentPresenceId(c.fromPeerId);
      setOpponentName(c.fromDisplayName);
      setRoomCode(c.code);
      setPhase("challenge_received");
    });
    return () => opts.setOnPeerChallenged(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const challenge = useCallback(
    (myId: string, targetId: string, targetName: string) => {
      const code = deriveDuelMatchCode(myId, targetId);
      opts.sendChallenge(targetId, code);
      setOpponentPresenceId(targetId);
      setOpponentName(targetName);
      setRoomCode(code);
      // Join the match room immediately rather than waiting for an explicit
      // "accepted" ack — useMatchRoom's create/join-on-code-taken fallback
      // already makes both sides converge on the same room regardless of who
      // arrives first, so there's nothing to wait for. If the target never
      // accepts, the challenger just sits alone in the room (see `cancel`).
      setPhase("connecting");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.sendChallenge],
  );

  const acceptChallenge = useCallback(() => {
    if (!roomCode) return;
    setPhase("connecting");
  }, [roomCode]);

  const cancel = useCallback(() => {
    if (mr.roomCode) mr.leaveRoom();
    createdRef.current = false;
    startedRef.current = false;
    setPhase("idle");
    setOpponentPresenceId(null);
    setOpponentName("");
    setRoomCode(null);
    setMyShot(null);
    setOpponentShot(null);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mr.roomCode]);

  // Once connected to the match WS, create/join the derived room code.
  useEffect(() => {
    if (phase !== "connecting") return;
    if (!mr.connected || !roomCode || createdRef.current) return;
    createdRef.current = true;
    mr.createRoom(roomCode);
  }, [phase, mr.connected, roomCode, mr]);

  // No separate ready-up UI for the MVP — both players already committed by
  // challenging/accepting, so mark ready as soon as the room is joined.
  // canHostStart() on the server requires every player's `ready` flag set.
  const readySentRef = useRef(false);
  useEffect(() => {
    if (phase !== "connecting") return;
    if (!mr.roomCode || mr.roomStatus !== "lobby" || readySentRef.current) return;
    readySentRef.current = true;
    mr.setReady(true);
  }, [phase, mr.roomCode, mr.roomStatus, mr]);

  // Host auto-starts once both players are present AND ready (the server
  // rejects start_match with "cannot_start" otherwise).
  const allReady = mr.players.length === 2 && mr.players.every((p) => p.ready);
  useEffect(() => {
    if (phase !== "connecting") return;
    if (!mr.isHost || startedRef.current) return;
    if (mr.roomStatus === "lobby" && allReady) {
      startedRef.current = true;
      mr.startMatch();
    }
  }, [phase, mr.isHost, mr.roomStatus, allReady, mr]);

  // Match began -> countdown. Split from the timer effect below: if this
  // effect also started the setTimeout, "phase" (a dependency) changing to
  // "countdown" would re-run it, and the re-run's cleanup would cancel the
  // just-started timer before it ever fired.
  useEffect(() => {
    if (phase !== "connecting") return;
    if (mr.matchSeed == null) return;
    setPhase("countdown");
  }, [phase, mr.matchSeed]);

  // countdown -> aiming, exactly once per countdown entry.
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => setPhase("aiming"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // Incoming opponent shot via relay.
  useEffect(() => {
    const ev = mr.lastPeerRelay;
    if (!ev || ev.channel !== ARCHERY_DUEL_RELAY_CHANNEL) return;
    const p = ev.payload as { power?: unknown; angle?: unknown } | null;
    const power = Number(p?.power);
    const angle = Number(p?.angle);
    if (!Number.isFinite(power) || !Number.isFinite(angle)) return;
    setOpponentShot({ power, angle });
  }, [mr.lastPeerRelay]);

  const fireShot = useCallback(
    (power: number, angle: number) => {
      if (phase !== "aiming" || myShot) return;
      const shot: DuelShot = {
        power: Math.max(0, Math.min(1, power)),
        angle: Math.max(-1, Math.min(1, angle)),
      };
      setMyShot(shot);
      mr.sendRelay(ARCHERY_DUEL_RELAY_CHANNEL, shot);
    },
    [phase, myShot, mr],
  );

  // Resolve once both shots are known.
  useEffect(() => {
    if (phase !== "aiming") return;
    if (!myShot || !opponentShot || !mr.playerId || !mr.matchSeed) return;
    const opponentPlayerId =
      mr.players.find((p) => p.id !== mr.playerId)?.id ?? "opponent";
    const res = resolveDuel(
      mr.matchSeed,
      mr.playerId,
      myShot,
      opponentPlayerId,
      opponentShot,
    );
    setResult(res);
    setPhase("resolved");
  }, [phase, myShot, opponentShot, mr.playerId, mr.matchSeed, mr.players]);

  const iWon = result != null && mr.playerId != null && result.winnerId === mr.playerId;

  return {
    phase,
    opponentName,
    opponentPresenceId,
    roomCode,
    matchSeed: mr.matchSeed,
    myShot,
    opponentShot,
    result,
    iWon,
    challenge,
    acceptChallenge,
    declineChallenge: cancel,
    cancel,
    fireShot,
  };
}
