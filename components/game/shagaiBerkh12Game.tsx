"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import ShagaiBerkh12UI from "./shagaiBerkh12UI";
import {
  applyBerkhTurn,
  BERKH12_MAX_TURNS,
  BERKH12_START_STACK,
  BERKH12_THROW_COUNT,
  type Berkh12Mode,
  type Berkh12Phase,
  type Berkh12TransferSummary,
  hasFullWin,
  type LocalPlayerCount,
  type ShagaiSide,
  countCamels,
  countHorses,
  nextClockwiseActive,
  rollBerkh12Sides,
} from "./shagaiBerkh12Type";
import {
  getBerkhThrowStartPositions,
  getShagaiThrowParams,
} from "./shagaiThrowShared";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import { useApp } from "@/components/AppContext";

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as React.LegacyRef<THREE.Mesh> | undefined} />;
}

function ThrowMat() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.006, 2.0]}
        scale={[1, 0.7, 1]}
      >
        <circleGeometry args={[4.0, 48]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.009, 2.0]}
        scale={[1, 0.7, 1]}
      >
        <ringGeometry args={[3.9, 4.02, 48]} />
        <meshStandardMaterial
          color="#c8a030"
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>
      {(
        [
          [
            [3.2, 1, 2.0] as [number, number, number],
            [0.2, 2, 5.2] as [number, number, number],
          ],
          [
            [-3.2, 1, 2.0] as [number, number, number],
            [0.2, 2, 5.2] as [number, number, number],
          ],
          [
            [0, 1, 4.2] as [number, number, number],
            [7, 2, 0.2] as [number, number, number],
          ],
          [
            [0, 1, -0.3] as [number, number, number],
            [14, 2, 0.2] as [number, number, number],
          ],
        ] as const
      ).map((w, i) => (
        <mesh key={i} position={w[0]}>
          <boxGeometry args={w[1]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

const BERKH_THROW_POS = getBerkhThrowStartPositions();

type SceneProps = {
  throwParams: ReturnType<typeof getShagaiThrowParams>[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  /** 4 ширхэг — тогтоосон талууд (робот/peer replay). null = ердийн физик. */
  forceSettleSides?: ShagaiSide[] | null;
};

function Berkh12GameScene({
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  forceSettleSides = null,
}: SceneProps) {
  const pieceTemplate = useShagaiThrowPieceTemplate();
  return (
    <>
      <ThrowMat />
      {Array.from({ length: BERKH12_THROW_COUNT }, (_, i) => i).map((i) => (
        <SingleShagai
          key={i}
          id={i}
          startPos={BERKH_THROW_POS[i]!}
          throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
          throwAngVel={throwParams[i]?.angVel ?? [4, 4, 4]}
          isThrown={isThrown}
          onSettle={onSettle}
          highlight={settledSides[i] === "horse"}
          resultSide={settledSides[i] ?? null}
          pieceTemplate={pieceTemplate}
          maxOnkhRetries={0}
          forceSettleSide={forceSettleSides?.[i] ?? null}
        />
      ))}
    </>
  );
}

function labelFor(mode: Berkh12Mode, i: number, isMn: boolean): string {
  if (mode === "vsCpu") {
    if (i === 0) return isMn ? "Та" : "You";
    return (isMn ? "Робот" : "Bot") + i;
  }
  return (isMn ? "Тоглогч" : "P") + (i + 1);
}

export type ShagaiBerkh12GameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
  autoPlayVsBotWhenSoloInRoom?: boolean;
};

export { Berkh12GameScene, ThrowMat, PhysicsFloor };

const emptyThrowSlots = (): (ShagaiSide | null)[] =>
  Array.from({ length: BERKH12_THROW_COUNT }, () => null);


export default function ShagaiBerkh12Game({
  onComplete,
  autoPlayVsBotWhenSoloInRoom = false,
}: ShagaiBerkh12GameProps) {
  const { language } = useApp();
  const isMn = language === "mn";
  const { grant, resetGrants } = useInventoryGrant();

  const [mode, setMode] = useState<Berkh12Mode>(() =>
    autoPlayVsBotWhenSoloInRoom ? "vsCpu" : "local",
  );
  const wasAutoSolo = useRef(false);
  const [playerCount, setPlayerCount] = useState<LocalPlayerCount>(2);
  const [phase, setPhase] = useState<Berkh12Phase>("idle");
  const [turn, setTurn] = useState(0);
  const [center, setCenter] = useState(0);
  const [mories, setMories] = useState([
    BERKH12_START_STACK,
    BERKH12_START_STACK,
    BERKH12_START_STACK,
    BERKH12_START_STACK,
  ]);
  const [active, setActive] = useState([true, true, true, true]);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState(
    Array.from({ length: BERKH12_THROW_COUNT }, () => getShagaiThrowParams()),
  );
  const [settledSides, setSettledSides] =
    useState<(ShagaiSide | null)[]>(emptyThrowSlots());
  const [lastSides, setLastSides] = useState<(ShagaiSide | null)[]>(
    emptyThrowSlots(),
  );
  const [lastHorses, setLastHorses] = useState(0);
  const [lastCamels, setLastCamels] = useState(0);
  const [lastTransfer, setLastTransfer] = useState<Berkh12TransferSummary | null>(
    null,
  );
  const [winner, setWinner] = useState<number | null>(null);
  const [elimToast, setElimToast] = useState<string | null>(null);
  const [totalThrows, setTotalThrows] = useState(0);
  const [botForcedSides, setBotForcedSides] = useState<ShagaiSide[] | null>(
    null,
  );

  const nPlayers = playerCount;
  const turnRef = useRef(0);
  const nPlayersRef = useRef(nPlayers);
  const modeRef = useRef(mode);
  const settledCount = useRef(0);
  const settledRef = useRef<(ShagaiSide | null)[]>(emptyThrowSlots());
  const resultDone = useRef(false);
  const syncGen = useRef(0);
  const completeOnce = useRef(false);
  const totalThrowsRef = useRef(0);
  const activeRef = useRef(active);
  const moriesRef = useRef(mories);
  const centerRef = useRef(center);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);
  useEffect(() => {
    nPlayersRef.current = nPlayers;
  }, [nPlayers]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    moriesRef.current = mories;
  }, [mories]);
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  const nameLabels = Array.from({ length: 4 }, (_, i) =>
    labelFor(mode, i, isMn),
  );

  const findWinner = useCallback(
    (m: number[], a: boolean[], throwsAfter: number): number | null => {
      for (let i = 0; i < nPlayers; i++) {
        if (a[i] && hasFullWin(m, i, nPlayers * BERKH12_START_STACK)) return i;
      }
      const act = a.slice(0, nPlayers).filter(Boolean);
      if (act.length === 1) {
        for (let i = 0; i < nPlayers; i++) if (a[i]) return i;
      }
      if (throwsAfter >= BERKH12_MAX_TURNS) {
        let best = -1;
        let bestI = 0;
        for (let i = 0; i < nPlayers; i++) {
          if (!a[i]) continue;
          if (m[i]! > best) {
            best = m[i]!;
            bestI = i;
          }
        }
        if (best >= 0) return bestI;
      }
      return null;
    },
    [nPlayers],
  );

  const finishAndAdvance = useCallback(
    (sides: ShagaiSide[], thrower: number) => {
      if (sides.length !== BERKH12_THROW_COUNT) return;
      setBotForcedSides(null);
      setLastSides([...sides] as (ShagaiSide | null)[]);
      setLastHorses(countHorses(sides));
      setLastCamels(countCamels(sides));
      if (countHorses(sides) > 0) grant({ coins: STONE_ROUND_COINS });

      const r = applyBerkhTurn(
        [...moriesRef.current],
        centerRef.current,
        [...activeRef.current],
        thrower,
        sides,
        nPlayers,
      );
      setLastTransfer(r.transfer);
      setMories(r.mories);
      moriesRef.current = r.mories;
      setCenter(r.center);
      setActive(r.active);
      activeRef.current = r.active;

      if (r.eliminated >= 0) {
        const lab = labelFor(modeRef.current, r.eliminated, isMn);
        setElimToast(
          isMn ? `${lab} — төлж чадсангүй!` : `${lab} — not enough mories!`,
        );
        window.setTimeout(() => setElimToast(null), 3000);
      } else {
        setElimToast(null);
      }

      const nextN = totalThrowsRef.current + 1;
      totalThrowsRef.current = nextN;
      setTotalThrows(nextN);
      setPhase("result");

      const w1 = findWinner(r.mories, r.active, nextN);
      if (w1 != null) {
        setPhase("matchOver");
        setWinner(w1);
        return;
      }

      const t0 = thrower;
      const nxt = nextClockwiseActive(nPlayers, t0, r.active);
      setTurn(nxt);
      if (modeRef.current === "vsCpu" && nxt !== 0) {
        setPhase("botWait");
      } else {
        window.setTimeout(() => {
          setSettledSides(emptyThrowSlots());
          setIsThrown(false);
          setPhase("idle");
        }, 1000);
      }
    },
    [findWinner, grant, isMn, nPlayers],
  );

  useEffect(() => {
    if (phase !== "matchOver" || winner == null || completeOnce.current) return;
    completeOnce.current = true;
    if (mode === "vsCpu") {
      onComplete?.(winner === 0 ? "win" : "lose", winner === 0 ? 100 : 0);
    } else {
      onComplete?.("win", 100);
    }
  }, [phase, winner, mode, onComplete]);

  const startThrow = useCallback(
    (forPlayer: number) => {
      const g = ++syncGen.current;
      if (!active[forPlayer]) return;
      setBotForcedSides(null);
      setTurn(forPlayer);
      turnRef.current = forPlayer;
      settledCount.current = 0;
      resultDone.current = false;
      setLastTransfer(null);
      const e = emptyThrowSlots();
      settledRef.current = e;
      setSettledSides([...e]);
      setThrowParams(
        Array.from({ length: BERKH12_THROW_COUNT }, () => getShagaiThrowParams()),
      );
      setPhase("throwing");
      setIsThrown(false);
      setTimeout(() => {
        if (g !== syncGen.current) return;
        setIsThrown(true);
      }, 50);
    },
    [active],
  );

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      if (id < 0 || id >= BERKH12_THROW_COUNT) return;
      if (settledRef.current[id] != null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;
      setSettledSides([...settledRef.current]);
      setPhase("settling");
      if (settledCount.current < BERKH12_THROW_COUNT || resultDone.current)
        return;
      resultDone.current = true;
      const g = syncGen.current;
      window.setTimeout(() => {
        if (g !== syncGen.current) return;
        const slots = settledRef.current;
        if (slots.some((s) => s == null)) return;
        finishAndAdvance(slots as ShagaiSide[], turnRef.current);
      }, 450);
    },
    [finishAndAdvance],
  );

  useEffect(() => {
    if (phase !== "botWait" || mode !== "vsCpu") return;
    const t = window.setTimeout(() => {
      const s = rollBerkh12Sides();
      const g = ++syncGen.current;
      settledCount.current = 0;
      resultDone.current = false;
      const e = emptyThrowSlots();
      settledRef.current = e;
      setSettledSides([...e]);
      setLastTransfer(null);
      setLastSides(emptyThrowSlots());
      setBotForcedSides(s);
      setThrowParams(
        Array.from({ length: BERKH12_THROW_COUNT }, () =>
          getShagaiThrowParams(),
        ),
      );
      setPhase("throwing");
      setIsThrown(false);
      window.setTimeout(() => {
        if (g !== syncGen.current) return;
        setIsThrown(true);
      }, 50);
    }, 420);
    return () => clearTimeout(t);
  }, [phase, mode, turn, nPlayers]);

  const canThrow =
    phase !== "matchOver" &&
    (phase === "idle" || phase === "result") &&
    active[turn] &&
    (mode === "local" || (mode === "vsCpu" && turn === 0));

  const onThrow = useCallback(() => {
    if (!canThrow) return;
    startThrow(turn);
  }, [canThrow, startThrow, turn]);

  const onReset = useCallback(
    (nOverride?: number) => {
      const n = (nOverride != null ? nOverride : nPlayers) as LocalPlayerCount;
      nPlayersRef.current = n;
      if (nOverride != null) {
        setPlayerCount(n);
      }
      syncGen.current += 1;
      completeOnce.current = false;
      setPhase("idle");
      setTurn(0);
      setCenter(0);
      const m = [
        BERKH12_START_STACK,
        BERKH12_START_STACK,
        BERKH12_START_STACK,
        BERKH12_START_STACK,
      ] as [number, number, number, number];
      setMories(m);
      moriesRef.current = m;
      const a = [0, 1, 2, 3].map((i) => i < n) as [
        boolean,
        boolean,
        boolean,
        boolean,
      ];
      setActive(a);
      activeRef.current = a;
      centerRef.current = 0;
      setIsThrown(false);
      setThrowParams(
        Array.from({ length: BERKH12_THROW_COUNT }, () => getShagaiThrowParams()),
      );
      setSettledSides(emptyThrowSlots());
      setLastSides(emptyThrowSlots());
      setLastTransfer(null);
      setBotForcedSides(null);
      setLastHorses(0);
      setLastCamels(0);
      setWinner(null);
      setElimToast(null);
      totalThrowsRef.current = 0;
      setTotalThrows(0);
      resultDone.current = false;
      resetGrants();
    },
    [nPlayers, resetGrants],
  );

  useEffect(() => {
    if (!autoPlayVsBotWhenSoloInRoom) {
      wasAutoSolo.current = false;
      return;
    }
    if (wasAutoSolo.current) return;
    wasAutoSolo.current = true;
    setMode("vsCpu");
    onReset(2);
  }, [autoPlayVsBotWhenSoloInRoom, onReset]);

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
        camera={{ position: [0, 11, 12.5], fov: 55 }}
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
            <Berkh12GameScene
              throwParams={throwParams}
              isThrown={isThrown}
              settledSides={settledSides}
              onSettle={handleSettle}
              forceSettleSides={botForcedSides}
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
        mode={mode}
        playerCount={nPlayers as LocalPlayerCount}
        turn={turn}
        mories={mories as number[]}
        active={active as boolean[]}
        canThrow={canThrow}
        onThrow={onThrow}
        onReset={onReset}
        onModeChange={(m) => {
          setMode(m);
          onReset();
        }}
        onPlayerCountChange={onReset}
        hideModeToggle={autoPlayVsBotWhenSoloInRoom}
        lastSides={lastSides}
        lastHorses={lastHorses}
        lastCamels={lastCamels}
        lastTransfer={lastTransfer}
        showElimToast={elimToast}
        winner={winner}
        nameLabels={nameLabels}
        mySeat={mode === "vsCpu" ? 0 : null}
      />
    </div>
  );
}
