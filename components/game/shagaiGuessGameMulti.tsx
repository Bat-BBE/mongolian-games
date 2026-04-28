"use client";

import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pickLastShagai } from "./shagaiModel";
import { SHAGAI_PHYS_BOX, SHAGAI_SIDE_UP_AXIS } from "./shagai";
import ShagaiGuessUI from "./shagaiGuessUI";
import {
  GuessState,
  INITIAL_GUESS_STATE,
  applyRound,
  resolveRound,
  TOTAL_SHAGAI,
} from "./shagaiGuessType";
import { ShagaiGuessGameScene } from "./shagaiGuessGame";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useApp } from "@/components/AppContext";
import { useMatchLobbyIntro } from "./gameModalSession";

const RELAY_CH = "shagai_guess_mp_v1";

type CommitPayload = {
  kind: "commit";
  round: number;
  from: string;
  hidden: number;
  guess: number;
};

type RoundPayload = {
  kind: "round";
  v: number;
  state: GuessState;
  revealHidden: { player: number; robot: number } | null;
};

type SyncPayload = {
  kind: "sync";
  v: number;
  state: GuessState;
};

type MpPayload = CommitPayload | RoundPayload | SyncPayload;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parsePayload(raw: unknown): MpPayload | null {
  if (!isRecord(raw) || raw.kind == null) return null;
  if (raw.kind === "commit") {
    if (typeof raw.round !== "number") return null;
    if (typeof raw.from !== "string") return null;
    if (typeof raw.hidden !== "number" || typeof raw.guess !== "number")
      return null;
    return raw as unknown as CommitPayload;
  }
  if (raw.kind === "round") {
    if (typeof raw.v !== "number" || !isRecord(raw.state)) return null;
    return raw as unknown as RoundPayload;
  }
  if (raw.kind === "sync") {
    if (typeof raw.v !== "number" || !isRecord(raw.state)) return null;
    return raw as unknown as SyncPayload;
  }
  return null;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function ShagaiGuessOnlineLobby() {
  const { language } = useApp();
  const lobbyIntro = useMatchLobbyIntro(language === "en" ? "en" : "mn");
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 20,
        color: "rgba(255,255,255,0.85)",
        fontSize: 14,
        lineHeight: 1.5,
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <span>{lobbyIntro}</span>
    </div>
  );
}

useGLTF.preload("/models/shagai_model.glb");

export default function ShagaiGuessGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const myId = mp.playerId ?? "";
  const order = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean).slice(0, 2),
    [mp.players],
  );
  const nameById = useMemo(
    () =>
      Object.fromEntries(mp.players.map((p) => [p.id, p.displayName] as const)),
    [mp.players],
  );

  const aId = order[0] ?? "";
  const bId = order[1] ?? "";
  const isMerger = aId === myId;

  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<GuessState>(INITIAL_GUESS_STATE);
  const [revealHidden, setRevealHidden] = useState<{
    player: number;
    robot: number;
  } | null>(null);
  const [robotThinking, setRobotThinking] = useState(false);
  const [commitLocked, setCommitLocked] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const matchSentRef = useRef(false);
  const appliedV = useRef(0);
  const lastRelayId = useRef(-1);
  const commitsRef = useRef<
    Record<string, { round: number; hidden: number; guess: number }>
  >({});
  const mergedRound = useRef<number | null>(null);

  const sendV = useCallback(() => {
    appliedV.current += 1;
    return appliedV.current;
  }, []);

  const pushSync = useCallback(
    (next: GuessState) => {
      const v = sendV();
      sendRelay(RELAY_CH, {
        kind: "sync",
        v,
        state: next,
      } satisfies SyncPayload);
    },
    [sendRelay, sendV],
  );

  const tryMerge = useCallback(
    (s: GuessState) => {
      if (!isMerger || !aId || !bId) return;
      const cA = commitsRef.current[aId];
      const cB = commitsRef.current[bId];
      if (!cA || !cB || cA.round !== cB.round || cA.round !== s.round) return;
      if (mergedRound.current === cA.round) return;
      const record = resolveRound({
        playerHeld: cA.hidden,
        playerGuess: cA.guess,
        robotHeld: cB.hidden,
        robotGuess: cB.guess,
        playerStack: s.playerStack,
        robotStack: s.robotStack,
        round: s.round,
      });
      if (record.transferredTo === "player" && record.transferredAmount > 0) {
        grant({ coins: STONE_ROUND_COINS });
      }
      const after = applyRound(s, record);
      mergedRound.current = cA.round;
      commitsRef.current = {};
      setCommitLocked(false);
      setRevealHidden({ player: cA.hidden, robot: cB.hidden });
      setRobotThinking(false);
      setState(after);
      const v = sendV();
      sendRelay(RELAY_CH, {
        kind: "round",
        v,
        state: after,
        revealHidden: { player: cA.hidden, robot: cB.hidden },
      } satisfies RoundPayload);
    },
    [aId, bId, grant, isMerger, sendRelay, sendV],
  );

  const queueMerge = useCallback(() => {
    queueMicrotask(() => {
      tryMerge(stateRef.current);
    });
  }, [tryMerge]);

  useEffect(() => {
    if (state.phase !== "matchOver" || matchSentRef.current) return;
    const wonA = state.winner === "player" && myId === aId;
    const wonB = state.winner === "robot" && myId === bId;
    const won = wonA || wonB;
    matchSentRef.current = true;
    const myPile = myId === aId ? state.playerStack : state.robotStack;
    const progressPct = Math.max(
      0,
      Math.min(100, Math.round((myPile / TOTAL_SHAGAI) * 100)),
    );
    onComplete(won ? "win" : "lose", won ? 100 : progressPct);
  }, [aId, bId, myId, onComplete, state]);

  const applyFromRelay = useCallback(
    (p: MpPayload) => {
      if (p.kind === "commit") {
        commitsRef.current[p.from] = {
          round: p.round,
          hidden: p.hidden,
          guess: p.guess,
        };
        if (isMerger) queueMerge();
        return;
      }
      if (p.kind === "sync") {
        if (p.v <= appliedV.current) return;
        appliedV.current = p.v;
        commitsRef.current = {};
        mergedRound.current = null;
        setCommitLocked(false);
        setRevealHidden(null);
        setRobotThinking(false);
        setState(p.state);
        return;
      }
      if (p.kind === "round") {
        if (p.v <= appliedV.current) return;
        appliedV.current = p.v;
        commitsRef.current = {};
        mergedRound.current = p.state.round;
        setCommitLocked(false);
        setRevealHidden(p.revealHidden);
        setState(p.state);
        return;
      }
    },
    [isMerger, queueMerge],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.id === lastRelayId.current) return;
    if (lastPeerRelay.channel !== RELAY_CH) return;
    lastRelayId.current = lastPeerRelay.id;
    if (lastPeerRelay.from === myId) return;
    const p = parsePayload(lastPeerRelay.payload);
    if (p) applyFromRelay(p);
  }, [lastPeerRelay, myId, applyFromRelay]);

  useEffect(() => {
    if (state.phase !== "idle" || state.round !== 0) return;
    if (!aId || !bId) return;
    if (!isMerger) return;
    const next: GuessState = {
      ...INITIAL_GUESS_STATE,
      phase: "hiding",
      round: 1,
    };
    setRevealHidden(null);
    commitsRef.current = {};
    mergedRound.current = null;
    setCommitLocked(false);
    setState(next);
    pushSync(next);
  }, [state.phase, state.round, aId, bId, isMerger, pushSync]);

  useEffect(() => {
    if (state.phase !== "result" || state.winner) return;
    if (!isMerger) return;
    const t = setTimeout(() => {
      setState((prev) => {
        if (prev.winner) return prev;
        const next: GuessState = {
          ...prev,
          phase: "hiding",
          round: prev.round + 1,
          lastRound: null,
        };
        commitsRef.current = {};
        mergedRound.current = null;
        setCommitLocked(false);
        setRevealHidden(null);
        setTimeout(() => pushSync(next), 0);
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [state.phase, state.winner, isMerger, pushSync]);

  const onCommit = useCallback(
    (playerHidden: number, playerGuess: number) => {
      setRobotThinking(false);
      commitsRef.current[myId] = {
        round: stateRef.current.round,
        hidden: playerHidden,
        guess: playerGuess,
      };
      setCommitLocked(true);
      const payload: CommitPayload = {
        kind: "commit",
        round: stateRef.current.round,
        from: myId,
        hidden: playerHidden,
        guess: playerGuess,
      };
      sendRelay(RELAY_CH, payload);
      if (isMerger) queueMerge();
    },
    [isMerger, myId, sendRelay, queueMerge],
  );

  const leftN = aId ? (nameById[aId] ?? "P1").slice(0, 10) : "P1";
  const rightN = bId ? (nameById[bId] ?? "P2").slice(0, 10) : "P2";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 50%, #3a2a1a 0%, #241810 45%, #160e08 100%)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 7.5, 9], fov: 48 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 14, 6]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-4, 5, -4]} intensity={0.3} color="#ffd080" />
        <pointLight position={[4, 4, 4]} intensity={0.2} color="#c0d4ff" />
        <Suspense fallback={null}>
          <Environment preset="night" />
          <ShagaiGuessGameScene
            state={state}
            hiddenReveal={revealHidden}
            robotThinking={robotThinking}
            leftName={leftN}
            rightName={rightN}
          />
        </Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={16}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      <ShagaiGuessUI
        state={state}
        onCommit={onCommit}
        robotThinking={robotThinking}
        revealHidden={revealHidden}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
        uiMode="mp"
        mp={{ myId, order, nameById }}
        commitLocked={commitLocked}
      />
    </div>
  );
}
