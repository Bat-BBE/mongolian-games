"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ShagaiTwelveUI from "./shagaiTwelveUI";
import {
  TWELVE_TARGET,
  countHorses,
  getRequiredPickAfterThrows,
  isTwelveGameOver,
  type ShagaiSide,
  type TwelvePhase,
  type TwelvePick,
} from "./shagaiTwelveType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { getShagaiThrowParams } from "./shagaiThrowShared";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { MatchRoomLobbyIntro } from "./MatchRoomLobbyIntro";
import { PhysicsFloor, ShagaiTwelveGameScene } from "./shagaiTwelveGame";

const REL = "twelve_shagai_mp_v1";

type T12Relay = {
  kind: "t12";
  v: number;
  throwerId: string;
  n: TwelvePick;
  sides: ShagaiSide[];
  s0: number;
  s1: number;
  nextTurnPlayerId: string;
  lastHorses: number;
  matchOver: boolean;
  winnerId: string | null;
  /** Тоглолт дууссан шидэлтийн нийт тоо (энэ шидэлтийг оруулсны дараа). */
  matchThrowN: number;
};

function parseR(x: unknown): T12Relay | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as T12Relay;
  if (o.kind !== "t12" || typeof o.v !== "number") return null;
  if (typeof o.throwerId !== "string" || !Array.isArray(o.sides)) return null;
  if (o.n !== 2 && o.n !== 3 && o.n !== 4) return null;
  if (typeof o.s0 !== "number" || typeof o.s1 !== "number") return null;
  if (typeof o.matchThrowN !== "number" || o.matchThrowN < 1) return null;
  return o;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function ShagaiTwelveOnlineLobby() {
  return (
    <div
      className="flex h-full w-full items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      <MatchRoomLobbyIntro />
    </div>
  );
}

export default function ShagaiTwelveGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const myId = mp.playerId ?? "";
  const order = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean) as string[],
    [mp.players],
  );
  const name0 = order[0]
    ? (mp.players.find((p) => p.id === order[0])?.displayName ?? "?")
    : "?";
  const name1 = order[1]
    ? (mp.players.find((p) => p.id === order[1])?.displayName ?? "?")
    : "?";

  const { grant, resetGrants } = useInventoryGrant();

  const [phase, setPhase] = useState<TwelvePhase>("idle");
  const [turnPlayerId, setTurnPlayerId] = useState("");
  const [turnSlot, setTurnSlot] = useState<0 | 1>(0);
  const [pick, setPick] = useState<TwelvePick>(4);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [nThrow, setNThrow] = useState<TwelvePick>(4);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState(
    [0, 1, 2, 3].map(() => getShagaiThrowParams()),
  );
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [lastSides, setLastSides] = useState<(ShagaiSide | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [lastHorses, setLastHorses] = useState(0);
  const [throwsDone, setThrowsDone] = useState(0);
  const [winnerSlot, setWinnerSlot] = useState<0 | 1 | null>(null);
  const matchThrowsRef = useRef(0);
  const scoresRef = useRef(scores);
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultDone = useRef(false);
  const nRef = useRef<TwelvePick>(4);
  const syncGen = useRef(0);
  const appliedV = useRef(0);
  const sendV = useRef(0);
  const lastRelayEventId = useRef(-1);
  const orderRef = useRef(order);
  const completeOnce = useRef(false);
  const applyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  orderRef.current = order;

  const iAmInMatch = useMemo(
    () => order.length === 2 && Boolean(myId) && order.includes(myId),
    [order, myId],
  );

  const resetForNewMatch = useCallback(() => {
    if (applyTimer.current) {
      clearTimeout(applyTimer.current);
      applyTimer.current = null;
    }
    syncGen.current += 1;
    appliedV.current = 0;
    sendV.current = 0;
    lastRelayEventId.current = -1;
    resultDone.current = false;
    completeOnce.current = false;
    const ord = orderRef.current;
    setTurnPlayerId(ord[0] ?? "");
    setTurnSlot(0);
    setPhase("idle");
    setPick(4);
    setNThrow(4);
    nRef.current = 4;
    setScores([0, 0]);
    setSettledSides([null, null, null, null]);
    settledRef.current = [null, null, null, null];
    settledCount.current = 0;
    setIsThrown(false);
    setLastSides([null, null, null, null]);
    setLastHorses(0);
    setThrowsDone(0);
    matchThrowsRef.current = 0;
    setWinnerSlot(null);
    setThrowParams([0, 1, 2, 3].map(() => getShagaiThrowParams()));
    resetGrants();
  }, [resetGrants]);

  const matchStartedKey = mp.matchStartedAt ?? 0;
  useEffect(() => {
    if (matchStartedKey) resetForNewMatch();
  }, [matchStartedKey, resetForNewMatch]);

  const startThrow = useCallback(
    (forId: string, num: TwelvePick) => {
      if (forId !== myId) return;
      const g = ++syncGen.current;
      setTurnPlayerId(forId);
      setTurnSlot(forId === orderRef.current[0] ? 0 : 1);
      setNThrow(num);
      nRef.current = num;
      settledCount.current = 0;
      resultDone.current = false;
      const empty: (ShagaiSide | null)[] = [null, null, null, null];
      settledRef.current = [...empty];
      setSettledSides([...empty]);
      setThrowParams([0, 1, 2, 3].map(() => getShagaiThrowParams()));
      setPhase("throwing");
      setIsThrown(false);
      setTimeout(() => {
        if (g !== syncGen.current) return;
        setIsThrown(true);
      }, 50);
    },
    [myId],
  );

  const applyPayload = useCallback(
    (p: T12Relay) => {
      if (p.v <= appliedV.current) return;
      appliedV.current = p.v;
      if (p.lastHorses > 0 && p.throwerId === myId)
        grant({ coins: STONE_ROUND_COINS });

      const last4: (ShagaiSide | null)[] = [null, null, null, null];
      for (let i = 0; i < p.sides.length; i++) {
        last4[i] = p.sides[i] ?? null;
      }
      setNThrow(p.n);
      nRef.current = p.n;
      setLastSides(last4);
      setLastHorses(p.lastHorses);
      setThrowsDone(p.matchThrowN);
      matchThrowsRef.current = p.matchThrowN;
      if (!p.matchOver) {
        setPick(getRequiredPickAfterThrows(p.matchThrowN));
      }
      setScores([p.s0, p.s1] as [number, number]);
      setSettledSides([...last4] as (ShagaiSide | null)[]);
      setIsThrown(true);

      if (p.matchOver) {
        setPhase("matchOver");
        const ord = orderRef.current;
        const ws = p.winnerId === ord[0] ? 0 : p.winnerId === ord[1] ? 1 : null;
        setWinnerSlot(ws);
        setTurnPlayerId(p.winnerId ?? p.throwerId);
        if (!completeOnce.current) {
          completeOnce.current = true;
          const w = p.winnerId === myId;
          const mySlot = myId === ord[0] ? 0 : 1;
          const myScore = mySlot === 0 ? p.s0 : p.s1;
          onComplete(
            w ? "win" : "lose",
            w
              ? 100
              : Math.min(100, Math.round((myScore / TWELVE_TARGET) * 100)),
          );
        }
        return;
      }

      setPhase("result");
      setTurnPlayerId(p.nextTurnPlayerId);
      setTurnSlot(p.nextTurnPlayerId === orderRef.current[0] ? 0 : 1);
      if (applyTimer.current) clearTimeout(applyTimer.current);
      const gen = appliedV.current;
      applyTimer.current = setTimeout(() => {
        applyTimer.current = null;
        if (gen !== appliedV.current) return;
        setSettledSides([null, null, null, null]);
        setIsThrown(false);
        setPhase("idle");
      }, 1000);
    },
    [grant, myId, onComplete],
  );

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      const num = nRef.current;
      if (turnPlayerId !== myId) return;
      if (id >= num) return;
      if (settledRef.current[id] != null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;
      setSettledSides([...settledRef.current]);
      setPhase("settling");
      if (settledCount.current < num || resultDone.current) return;
      resultDone.current = true;
      const g = syncGen.current;
      window.setTimeout(() => {
        if (g !== syncGen.current) return;
        if (num !== getRequiredPickAfterThrows(matchThrowsRef.current)) {
          return;
        }
        const raw = settledRef.current.slice(0, num);
        const sides = raw.filter((s): s is ShagaiSide => s != null);
        const horses = countHorses(sides);
        const ord = orderRef.current;
        if (ord.length < 2) return;
        const tId = myId;
        const slot = tId === ord[0] ? 0 : 1;
        const prev = scoresRef.current;
        const s0 = slot === 0 ? prev[0] + horses : prev[0];
        const s1 = slot === 1 ? prev[1] + horses : prev[1];
        const o = isTwelveGameOver(s0, s1);
        const other = ord[0] === tId ? ord[1]! : ord[0]!;
        const nextTurnPlayerId = o.over ? tId : other;
        const winnerId = o.over
          ? o.winner === 0
            ? ord[0]!
            : o.winner === 1
              ? ord[1]!
              : null
          : null;

        sendV.current += 1;
        const v = sendV.current;
        const matchThrowN = matchThrowsRef.current + 1;
        const pay: T12Relay = {
          kind: "t12",
          v,
          throwerId: tId,
          n: num,
          sides,
          s0,
          s1,
          nextTurnPlayerId: o.over ? tId : other,
          lastHorses: horses,
          matchOver: o.over,
          winnerId: o.over ? (winnerId ?? tId) : null,
          matchThrowN,
        };
        sendRelay(REL, pay);
        applyPayload(pay);
      }, 500);
    },
    [turnPlayerId, myId, sendRelay, applyPayload],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.id === lastRelayEventId.current) return;
    if (lastPeerRelay.channel !== REL) return;
    lastRelayEventId.current = lastPeerRelay.id;
    if (lastPeerRelay.from === myId) return;
    const p = parseR(lastPeerRelay.payload);
    if (p) applyPayload(p);
  }, [lastPeerRelay, myId, applyPayload]);

  const canThrow =
    iAmInMatch &&
    phase !== "matchOver" &&
    (phase === "idle" || phase === "result") &&
    turnPlayerId === myId;

  const onThrow = useCallback(() => {
    if (!canThrow) return;
    const need = getRequiredPickAfterThrows(matchThrowsRef.current);
    if (pick !== need) return;
    startThrow(myId, pick);
  }, [canThrow, myId, pick, startThrow]);

  if (!iAmInMatch) {
    return <ShagaiTwelveOnlineLobby />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 45%, #3a2a1a 0%, #241810 45%, #160e08 100%)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 10, 12.5], fov: 55 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.28} />
        <directionalLight
          position={[5, 14, 6]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-4, 5, -4]} intensity={0.35} color="#ffd080" />
        <Suspense fallback={null}>
          <Environment preset="night" />
          <Physics
            gravity={[0, -14, 0]}
            defaultContactMaterial={{ friction: 0.88, restitution: 0.12 }}
          >
            <PhysicsFloor />
            <ShagaiTwelveGameScene
              n={nThrow}
              throwParams={throwParams}
              isThrown={isThrown}
              settledSides={settledSides}
              onSettle={handleSettle}
            />
          </Physics>
        </Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={6}
          maxDistance={20}
          enablePan={false}
          target={[0, 0, 0.5]}
        />
      </Canvas>
      <ShagaiTwelveUI
        phase={phase}
        mode="local2"
        turn={turnSlot}
        pick={pick}
        onPick={setPick}
        matchCompletedThrows={throwsDone}
        scores={scores}
        canThrow={canThrow}
        onThrow={onThrow}
        onReset={resetForNewMatch}
        lastSides={lastSides}
        lastHorses={lastHorses}
        winner={winnerSlot}
        name0={name0}
        name1={name1}
        lockMode
      />
    </div>
  );
}
