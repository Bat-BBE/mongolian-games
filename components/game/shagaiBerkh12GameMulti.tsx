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
import ShagaiBerkh12UI from "./shagaiBerkh12UI";
import {
  applyBerkhTurn,
  BERKH12_MAX_TURNS,
  BERKH12_START_STACK,
  hasFullWin,
  type Berkh12Mode,
  type Berkh12Phase,
  type LocalPlayerCount,
  type ShagaiSide,
  countCamels,
  countHorses,
  nextClockwiseActive,
} from "./shagaiBerkh12Type";
import { getShagaiThrowParams } from "./shagaiThrowShared";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useApp } from "@/components/AppContext";
import { MatchRoomLobbyIntro } from "./MatchRoomLobbyIntro";
import { Berkh12GameScene, PhysicsFloor } from "./shagaiBerkh12Game";

const REL = "berkh_12_mp_v1";

type P = {
  kind: "b12";
  v: number;
  nPlayers: 2 | 3 | 4;
  throwerId: string;
  sides: ShagaiSide[];
  m0: number;
  m1: number;
  m2: number;
  m3: number;
  center: number;
  a0: boolean;
  a1: boolean;
  a2: boolean;
  a3: boolean;
  nextTurnId: string;
  totalT: number;
  matchOver: boolean;
  winnerId: string | null;
  elimSlot: number;
};

function parseP(x: unknown): P | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as P;
  if (o.kind !== "b12" || typeof o.v !== "number") return null;
  if (!Array.isArray(o.sides) || o.sides.length !== 12) return null;
  if (o.nPlayers !== 2 && o.nPlayers !== 3 && o.nPlayers !== 4) return null;
  if (typeof o.m0 !== "number") return null;
  return o;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
  playerCount: LocalPlayerCount;
};

export function ShagaiBerkh12OnlineLobby() {
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

function findWinnerSlot(
  m: number[],
  a: boolean[],
  n: number,
  throwCount: number,
): number | null {
  for (let i = 0; i < n; i++) {
    if (a[i] && hasFullWin(m, i, n * BERKH12_START_STACK)) return i;
  }
  const alive = a.slice(0, n).filter(Boolean);
  if (alive.length === 1) {
    for (let i = 0; i < n; i++) if (a[i]) return i;
  }
  if (throwCount >= BERKH12_MAX_TURNS) {
    let b = -1;
    let bi = 0;
    for (let i = 0; i < n; i++) {
      if (!a[i]) continue;
      if (m[i]! > b) {
        b = m[i]!;
        bi = i;
      }
    }
    if (b >= 0) return bi;
  }
  return null;
}

const Z12: (ShagaiSide | null)[] = Array(12).fill(null);

export default function ShagaiBerkh12GameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
  playerCount: nP,
}: Props) {
  const { language } = useApp();
  const isMn = language === "mn";
  const myId = mp.playerId ?? "";
  const order = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean) as string[],
    [mp.players],
  );
  const nPlayers = nP;
  const { grant, resetGrants } = useInventoryGrant();

  const [phase, setPhase] = useState<Berkh12Phase>("idle");
  const [turnSlot, setTurnSlot] = useState(0);
  const [turnId, setTurnId] = useState("");
  const [center, setCenter] = useState(0);
  const [mories, setMories] = useState([
    BERKH12_START_STACK,
    BERKH12_START_STACK,
    BERKH12_START_STACK,
    BERKH12_START_STACK,
  ]);
  const [active, setActive] = useState(
    [0, 1, 2, 3].map((i) => i < nP) as [boolean, boolean, boolean, boolean],
  );
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState(
    () => Array.from({ length: 12 }, () => getShagaiThrowParams()),
  );
  const [settledSides, setSettledSides] = useState(() => [...Z12]);
  const [lastSides, setLastSides] = useState(() => [...Z12]);
  const [lastH, setLastH] = useState(0);
  const [lastC, setLastC] = useState(0);
  const [winnerSlot, setWinnerSlot] = useState<number | null>(null);
  const [elimT, setElimT] = useState<string | null>(null);
  const [tTotal, setTTotal] = useState(0);

  const settledCount = useRef(0);
  const settledRef = useRef([...Z12] as (ShagaiSide | null)[]);
  const resultDone = useRef(false);
  const syncG = useRef(0);
  const sendV = useRef(0);
  const applyV = useRef(0);
  const lastEvt = useRef(-1);
  const completeOnce = useRef(false);
  const tTotalRef = useRef(0);
  const mRef = useRef(mories);
  const cRef = useRef(center);
  const aRef = useRef(active);
  mRef.current = mories;
  cRef.current = center;
  aRef.current = active;
  useEffect(() => {
    tTotalRef.current = tTotal;
  }, [tTotal]);

  const orderId = useMemo(() => order.slice(0, nP), [order, nP]);
  const iAm = orderId.length === nP && orderId.length > 0 && Boolean(myId) && orderId.includes(myId);

  const nameL = (i: number) => {
    const id = orderId[i];
    return (
      (id && mp.players.find((p) => p.id === id)?.displayName) ||
      (isMn ? "Т" : "P") + (i + 1)
    );
  };
  const nameLabels: string[] = [0, 1, 2, 3].map((i) => (i < nP ? nameL(i) : ""));

  const reMatch = useCallback(() => {
    setPhase("idle");
    setCenter(0);
    setMories([
      BERKH12_START_STACK,
      BERKH12_START_STACK,
      BERKH12_START_STACK,
      BERKH12_START_STACK,
    ]);
    mRef.current = [
      BERKH12_START_STACK,
      BERKH12_START_STACK,
      BERKH12_START_STACK,
      BERKH12_START_STACK,
    ];
    const act = [0, 1, 2, 3].map((i) => i < nP) as [boolean, boolean, boolean, boolean];
    setActive(act);
    aRef.current = act;
    cRef.current = 0;
    setTurnSlot(0);
    setTurnId(orderId[0] ?? "");
    setWinnerSlot(null);
    tTotalRef.current = 0;
    setTTotal(0);
    setSettledSides([...Z12]);
    settledRef.current = [...Z12] as (ShagaiSide | null)[];
    setLastSides([...Z12]);
    sendV.current = 0;
    applyV.current = 0;
    lastEvt.current = -1;
    completeOnce.current = false;
    resetGrants();
  }, [nP, orderId, resetGrants]);

  const key = mp.matchStartedAt ?? 0;
  useEffect(() => {
    if (key) reMatch();
  }, [key, reMatch]);

  const applyPayload = useCallback(
    (h: P) => {
      if (h.v <= applyV.current) return;
      applyV.current = h.v;
      setMories([h.m0, h.m1, h.m2, h.m3]);
      mRef.current = [h.m0, h.m1, h.m2, h.m3];
      setCenter(h.center);
      cRef.current = h.center;
      setActive(
        [h.a0, h.a1, h.a2, h.a3] as [boolean, boolean, boolean, boolean],
      );
      aRef.current = [h.a0, h.a1, h.a2, h.a3] as [boolean, boolean, boolean, boolean];
      setLastH(countHorses(h.sides));
      setLastC(countCamels(h.sides));
      setLastSides(h.sides as unknown as (ShagaiSide | null)[]);
      setTTotal(h.totalT);
      tTotalRef.current = h.totalT;
      if (h.throwerId === myId && countHorses(h.sides) > 0)
        grant({ coins: STONE_ROUND_COINS });
      if (h.elimSlot >= 0) {
        setElimT(
          isMn
            ? `${nameL(h.elimSlot)} — төлж чадсангүй!`
            : `${nameL(h.elimSlot)} — out!`,
        );
        window.setTimeout(() => setElimT(null), 2800);
      } else {
        setElimT(null);
      }
      if (h.matchOver && h.winnerId) {
        const wsi = orderId.findIndex((id) => id === h.winnerId);
        setWinnerSlot(wsi >= 0 ? wsi : 0);
        setPhase("matchOver");
        setTurnId(h.winnerId);
        if (!completeOnce.current) {
          completeOnce.current = true;
          onComplete(
            h.winnerId === myId ? "win" : "lose",
            h.winnerId === myId ? 100 : 0,
          );
        }
        return;
      }
      const nextSlot = orderId.findIndex((id) => id === h.nextTurnId);
      setTurnSlot(nextSlot >= 0 ? nextSlot : 0);
      setTurnId(h.nextTurnId);
      setPhase("result");
      setTimeout(() => {
        if (applyV.current !== h.v) return;
        setSettledSides([...Z12]);
        setIsThrown(false);
        setPhase("idle");
      }, 1000);
    },
    [grant, isMn, myId, nameL, onComplete, orderId],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.id === lastEvt.current) return;
    if (lastPeerRelay.channel !== REL) return;
    lastEvt.current = lastPeerRelay.id;
    if (lastPeerRelay.from === myId) return;
    const p = parseP(lastPeerRelay.payload);
    if (p) applyPayload(p);
  }, [lastPeerRelay, myId, applyPayload]);

  const canThrow =
    iAm &&
    phase !== "matchOver" &&
    (phase === "idle" || phase === "result") &&
    turnId === myId;

  const startT = useCallback(() => {
    if (!canThrow) return;
    const g = ++syncG.current;
    settledCount.current = 0;
    resultDone.current = false;
    settledRef.current = [...Z12] as (ShagaiSide | null)[];
    setSettledSides([...Z12]);
    setThrowParams(
      Array.from({ length: 12 }, () => getShagaiThrowParams()),
    );
    setPhase("throwing");
    setIsThrown(false);
    setTimeout(() => {
      if (g !== syncG.current) return;
      setIsThrown(true);
    }, 50);
  }, [canThrow]);

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      if (turnId !== myId) return;
      if (id < 0 || id > 11) return;
      if (settledRef.current[id] != null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;
      setSettledSides([...settledRef.current]);
      setPhase("settling");
      if (settledCount.current < 12 || resultDone.current) return;
      resultDone.current = true;
      const g0 = syncG.current;
      window.setTimeout(() => {
        if (g0 !== syncG.current) return;
        const sk = settledRef.current.filter(
          (s): s is ShagaiSide => s != null,
        );
        if (sk.length !== 12) return;
        const mySlot = orderId.findIndex((p) => p === myId);
        if (mySlot < 0) return;
        const r = applyBerkhTurn(
          [...mRef.current],
          cRef.current,
          [...aRef.current],
          mySlot,
          sk,
          nPlayers,
        );
        const nextN = tTotalRef.current + 1;
        const wSlot = findWinnerSlot(
          r.mories,
          r.active,
          nP,
          nextN,
        );
        const wId = wSlot != null ? (orderId[wSlot] ?? null) : null;
        const nxtS = wId
          ? wId
          : (orderId[
              nextClockwiseActive(nP, mySlot, r.active)
            ] ?? orderId[0] ?? "");

        const pay: P = {
          kind: "b12",
          v: ++sendV.current,
          nPlayers: nP,
          throwerId: myId,
          sides: sk,
          m0: r.mories[0]!,
          m1: r.mories[1]!,
          m2: r.mories[2]!,
          m3: r.mories[3]!,
          center: r.center,
          a0: r.active[0]!,
          a1: r.active[1]!,
          a2: r.active[2]!,
          a3: r.active[3]!,
          nextTurnId: wId ? wId : nxtS,
          totalT: nextN,
          matchOver: wId != null,
          winnerId: wId,
          elimSlot: r.eliminated,
        };
        sendRelay(REL, pay);
        applyPayload(pay);
        resultDone.current = false;
        settledCount.current = 0;
        settledRef.current = [...Z12] as (ShagaiSide | null)[];
      }, 500);
    },
    [turnId, myId, nP, nPlayers, orderId, sendRelay, applyPayload],
  );

  if (!iAm) {
    return <ShagaiBerkh12OnlineLobby />;
  }

  return (
    <div
      className="relative h-full w-full"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, #3a2a1a 0%, #160e08 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 11, 12.5], fov: 55 }}
        shadows
        className="h-full w-full"
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
            <Berkh12GameScene
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
      <ShagaiBerkh12UI
        phase={phase}
        mode={"local" as Berkh12Mode}
        playerCount={nP}
        turn={turnSlot}
        mories={mories as number[]}
        center={center}
        active={active as boolean[]}
        canThrow={canThrow}
        onThrow={startT}
        onReset={reMatch}
        onModeChange={() => {}}
        onPlayerCountChange={() => {}}
        lastSides={lastSides}
        lastHorses={lastH}
        lastCamels={lastC}
        showElimToast={elimT}
        winner={winnerSlot}
        nameLabels={nameLabels}
        lockMode
      />
    </div>
  );
}
