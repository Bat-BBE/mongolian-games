"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CinematicCamera, GameScene } from "./stoneGame";
import StoneGameUI from "./stoneGameUI";
import {
  type GameState,
  type RoundResult,
  INITIAL_STATE,
  buildMessage,
  WIN_SCORE,
} from "./stoneType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useMatchLobbyIntro } from "./gameModalSession";
import { useApp } from "@/components/AppContext";

const RELAY_CH = "stone_mp_v1";

type StoneMpPayload = {
  v: number;
  phase: GameState["phase"];
  round: number;
  hostPick: number | null;
  joinPick: number | null;
  hostGuess: number | null;
  joinGuess: number | null;
  scoreP: number;
  scoreC: number;
  history: RoundResult[];
  message: string;
};

function toGameState(p: StoneMpPayload): GameState {
  return {
    phase: p.phase,
    playerStones: p.hostPick,
    computerStones: p.joinPick,
    playerGuess: p.hostGuess,
    computerGuess: p.joinGuess,
    score: { player: p.scoreP, computer: p.scoreC },
    round: p.round,
    history: p.history,
    message: p.message,
  };
}

function fromGameState(gs: GameState, v: number): StoneMpPayload {
  return {
    v,
    phase: gs.phase,
    round: gs.round,
    hostPick: gs.playerStones,
    joinPick: gs.computerStones,
    hostGuess: gs.playerGuess,
    joinGuess: gs.computerGuess,
    scoreP: gs.score.player,
    scoreC: gs.score.computer,
    history: gs.history,
    message: gs.message,
  };
}

function parsePayload(x: unknown): StoneMpPayload | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.v !== "number") return null;
  if (o.phase !== "pick" && o.phase !== "guess" && o.phase !== "result")
    return null;
  if (typeof o.round !== "number") return null;
  if (!Array.isArray(o.history)) return null;
  if (typeof o.message !== "string") return null;
  return o as unknown as StoneMpPayload;
}

function resolveRound(base: GameState): GameState {
  const ps = base.playerStones;
  const cs = base.computerStones;
  const pg = base.playerGuess;
  const jg = base.computerGuess;
  if (ps == null || cs == null || pg == null || jg == null) return base;
  const total = ps + cs;
  const playerCorrect = pg === total;
  const compCorrect = jg === total;
  const outcome: RoundResult["outcome"] = playerCorrect
    ? "player"
    : compCorrect
      ? "computer"
      : "none";
  const roundResult: RoundResult = {
    playerStones: ps,
    computerStones: cs,
    total,
    playerGuess: pg,
    computerGuess: jg,
    outcome,
  };
  const newScore = {
    player: base.score.player + (outcome === "player" ? 1 : 0),
    computer: base.score.computer + (outcome === "computer" ? 1 : 0),
  };
  return {
    ...base,
    phase: "result",
    score: newScore,
    history: [...base.history, roundResult],
    message: buildMessage(roundResult),
  };
}

type Props = {
  onComplete: (result: "win" | "lose") => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function StoneGameOnlineLobby() {
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
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 1.5,
        background: "radial-gradient(circle at 50% 45%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <span>{lobbyIntro}</span>
    </div>
  );
}

export default function StoneGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const hostId = mp.hostId ?? "";
  const myId = mp.playerId ?? "";
  const iAmHost = Boolean(myId && hostId && myId === hostId);
  const orderIds = mp.players.map((p) => p.id).filter(Boolean);
  const joinerId = orderIds.find((id) => id !== hostId) ?? "";
  const iAmJoiner = Boolean(myId && joinerId && myId === joinerId);
  const oppName =
    mp.players.find((p) => p.id !== myId)?.displayName?.trim() || "?";

  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [burst, setBurst] = useState(false);
  const appliedV = useRef(0);
  const sendV = useRef(0);
  const gameOverRef = useRef(false);
  const lastRoundGrantRef = useRef(-1);

  const matchKey = mp.matchStartedAt ?? 0;
  useEffect(() => {
    if (!matchKey) return;
    appliedV.current = 0;
    sendV.current = 0;
    gameOverRef.current = false;
    lastRoundGrantRef.current = -1;
    setState(INITIAL_STATE);
    resetGrants();
  }, [matchKey, resetGrants]);

  const broadcast = useCallback(
    (gs: GameState) => {
      sendV.current += 1;
      const v = sendV.current;
      appliedV.current = Math.max(appliedV.current, v);
      sendRelay(RELAY_CH, fromGameState(gs, v));
    },
    [sendRelay],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.channel !== RELAY_CH) return;
    const p = parsePayload(lastPeerRelay.payload);
    if (!p) return;
    if (p.v <= appliedV.current) return;
    appliedV.current = p.v;
    sendV.current = Math.max(sendV.current, p.v);
    setState(toGameState(p));
  }, [lastPeerRelay]);

  useEffect(() => {
    if (state.phase !== "result") return;
    const r = state.history[state.history.length - 1];
    if (!r) return;
    const roundIdx = state.history.length;
    if (lastRoundGrantRef.current === roundIdx) return;
    const iWonRound =
      (iAmHost && r.outcome === "player") ||
      (iAmJoiner && r.outcome === "computer");
    if (iWonRound) {
      lastRoundGrantRef.current = roundIdx;
      grant({ coins: STONE_ROUND_COINS });
    }
  }, [state, grant, iAmHost, iAmJoiner]);

  const handleMyPick = useCallback(
    (n: number) => {
      if (state.phase !== "pick") return;
      if (iAmHost) {
        if (state.playerStones !== null) return;
        setState((prev) => {
          const next: GameState = {
            ...prev,
            playerStones: n,
            phase: prev.computerStones !== null ? "guess" : "pick",
          };
          setTimeout(() => broadcast(next), 0);
          return next;
        });
        return;
      }
      if (iAmJoiner) {
        if (state.computerStones !== null) return;
        setState((prev) => {
          const next: GameState = {
            ...prev,
            computerStones: n,
            phase: prev.playerStones !== null ? "guess" : "pick",
          };
          setTimeout(() => broadcast(next), 0);
          return next;
        });
      }
    },
    [state, broadcast, iAmHost, iAmJoiner],
  );

  const handleMyGuess = useCallback(
    (g: number) => {
      if (state.phase !== "guess") return;
      if (iAmHost) {
        if (state.playerGuess !== null) return;
        setState((prev) => {
          if (prev.computerStones == null || prev.playerStones == null) {
            return prev;
          }
          const withGuess: GameState = { ...prev, playerGuess: g };
          if (withGuess.computerGuess == null) {
            setTimeout(() => broadcast(withGuess), 0);
            return withGuess;
          }
          const ended = resolveRound(withGuess);
          setBurst(true);
          setTimeout(() => setBurst(false), 1500);
          setTimeout(() => broadcast(ended), 0);
          return ended;
        });
        return;
      }
      if (iAmJoiner) {
        if (state.computerGuess !== null) return;
        setState((prev) => {
          if (prev.computerStones == null || prev.playerStones == null) {
            return prev;
          }
          const withGuess: GameState = { ...prev, computerGuess: g };
          if (withGuess.playerGuess == null) {
            setTimeout(() => broadcast(withGuess), 0);
            return withGuess;
          }
          const ended = resolveRound(withGuess);
          setBurst(true);
          setTimeout(() => setBurst(false), 1500);
          setTimeout(() => broadcast(ended), 0);
          return ended;
        });
      }
    },
    [state, broadcast, iAmHost, iAmJoiner],
  );

  const handleNext = useCallback(() => {
    if (state.phase !== "result") return;
    setState((prev) => {
      const next: GameState = {
        ...INITIAL_STATE,
        round: prev.round + 1,
        score: prev.score,
        history: prev.history,
      };
      setTimeout(() => broadcast(next), 0);
      return next;
    });
  }, [state.phase, broadcast]);

  const handleRestart = useCallback(() => {
    const next: GameState = { ...INITIAL_STATE };
    setState(next);
    setTimeout(() => broadcast(next), 0);
    gameOverRef.current = false;
    resetGrants();
  }, [broadcast, resetGrants]);

  useEffect(() => {
    if (state.phase !== "result" || gameOverRef.current) return;
    if (state.score.player < WIN_SCORE && state.score.computer < WIN_SCORE) {
      return;
    }
    gameOverRef.current = true;
    const iWin =
      (iAmHost && state.score.player >= WIN_SCORE) ||
      (iAmJoiner && state.score.computer >= WIN_SCORE);
    onComplete(iWin ? "win" : "lose");
  }, [state, onComplete, iAmHost, iAmJoiner]);

  if (!iAmHost && !iAmJoiner) {
    return <StoneGameOnlineLobby />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#080604",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 4, 7], fov: 52 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <CinematicCamera phase={state.phase} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 10, 5]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-3, 4, -3]} intensity={0.45} color="#ffd080" />
        <pointLight position={[3, 3, 3]} intensity={0.22} color="#c0d0ff" />
        <pointLight position={[0, -0.2, 0]} intensity={0.34} color="#c8a030" />
        <Suspense fallback={null}>
          <Environment preset="night" />
          <GameScene state={state} burstActive={burst} swapHands={iAmJoiner} />
        </Suspense>
        <OrbitControls
          enabled={state.phase !== "result"}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          minDistance={4}
          maxDistance={12}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      <StoneGameUI
        state={state}
        onPick={handleMyPick}
        onGuess={handleMyGuess}
        onNext={handleNext}
        onRestart={handleRestart}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
        multiplayer={{
          iAmHost,
          opponentName: oppName,
          lang: language === "en" ? "en" : "mn",
        }}
      />
    </div>
  );
}
