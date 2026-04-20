"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import ShagaiSevenUI from "./shagaiSevenUI";
import type { ShagaiSide } from "./shagaiTargetType";
import {
  SEVEN_COUNT,
  checkOutcomeAfterPair,
  validateSevenPairPath,
  type SevenPhase,
} from "./shagaiSevenType";
import { SevenPathDrawLayer } from "./sevenPathDraw";
import { buildPairAnimPathWorld } from "./shagaiSevenPathAnim";
import { SevenPairPathAnimator } from "./shagaiSevenAnimator";
import { SevenCollectAnimator } from "./shagaiSevenCollect";
import type { KnockBurst } from "./shagaiSevenKnock";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_MATCH_GEMS, STONE_ROUND_COINS } from "./gameRewardConstants";
import InventoryRewardOverlay from "./InventoryRewardOverlay";

export type ShagaiSevenGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as any} />;
}

function GameTable() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.005, 0]}
        scale={[1, 0.64, 1]}
      >
        <circleGeometry args={[5.5, 64]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.93} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
        scale={[1, 0.64, 1]}
      >
        <ringGeometry args={[5.4, 5.65, 64]} />
        <meshStandardMaterial
          color="#c8a030"
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.007, 0]}
        scale={[1, 0.64, 1]}
      >
        <ringGeometry args={[5.0, 5.1, 64]} />
        <meshStandardMaterial color="#a07820" metalness={0.5} roughness={0.4} />
      </mesh>

      {[
        {
          pos: [6, 1, 0] as [number, number, number],
          args: [0.2, 2, 12] as [number, number, number],
        },
        {
          pos: [-6, 1, 0] as [number, number, number],
          args: [0.2, 2, 12] as [number, number, number],
        },
        {
          pos: [0, 1, 5] as [number, number, number],
          args: [12, 2, 0.2] as [number, number, number],
        },
        {
          pos: [0, 1, -5] as [number, number, number],
          args: [12, 2, 0.2] as [number, number, number],
        },
      ].map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={w.args} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

const START_POSITIONS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  const n = SEVEN_COUNT;
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const a = (t - 0.5) * 1.35;
    const x = Math.sin(a) * 2.35;
    const z = Math.cos(a) * 0.85 - 0.35;
    const y = 4.55 + (i % 3) * 0.22;
    out.push([x, y, z]);
  }
  return out;
})();

function getThrowParams(): {
  vel: [number, number, number];
  angVel: [number, number, number];
} {
  const spread = 2.8;
  return {
    vel: [
      (Math.random() - 0.5) * spread * 2,
      6 + Math.random() * 4,
      (Math.random() - 0.5) * spread * 2,
    ],
    angVel: [
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 22,
    ],
  };
}

function GameScene({
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  isWin,
  activeIds,
  selection,
  takePick,
  onPiecePosition,
  kinematicRef,
  knockBurstRef,
}: {
  throwParams: {
    vel: [number, number, number];
    angVel: [number, number, number];
  }[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  isWin: boolean;
  activeIds: number[];
  selection: [number | null, number | null];
  takePick: { a: number; b: number } | null;
  onPiecePosition: (id: number, pos: [number, number, number]) => void;
  kinematicRef: React.MutableRefObject<
    Record<number, [number, number, number] | null>
  >;
  knockBurstRef: React.MutableRefObject<
    Record<number, KnockBurst | undefined>
  >;
}) {
  const allDone = settledSides.every((s) => s !== null);
  const pieceTemplate = useShagaiThrowPieceTemplate();

  return (
    <>
      <GameTable />
      {Array.from({ length: SEVEN_COUNT }, (_, i) => {
        const active = activeIds.includes(i);
        const sel =
          selection[0] === i ||
          selection[1] === i ||
          (takePick !== null && (takePick.a === i || takePick.b === i));
        return (
          <SingleShagai
            key={i}
            id={i}
            startPos={START_POSITIONS[i]!}
            throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
            throwAngVel={throwParams[i]?.angVel ?? [5, 5, 5]}
            isThrown={isThrown}
            onSettle={onSettle}
            highlight={(isWin && allDone) || sel}
            muted={allDone && !active && !isWin}
            resultSide={settledSides[i]}
            pieceTemplate={pieceTemplate}
            onPositionUpdate={onPiecePosition}
            kinematicTargetRef={kinematicRef}
            knockBurstRef={knockBurstRef}
            presentOnTable={active}
            maxOnkhRetries={0}
          />
        );
      })}
    </>
  );
}

export default function ShagaiSevenGame({ onComplete }: ShagaiSevenGameProps) {
  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [phase, setPhase] = useState<SevenPhase>("idle");
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState<
    ReturnType<typeof getThrowParams>[]
  >(() => Array.from({ length: SEVEN_COUNT }, () => getThrowParams()));
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>(() =>
    Array.from({ length: SEVEN_COUNT }, () => null),
  );
  const [activeIds, setActiveIds] = useState<number[]>(() =>
    Array.from({ length: SEVEN_COUNT }, (_, i) => i),
  );
  const [pairedPairs, setPairedPairs] = useState<[number, number][]>([]);
  const [selection, setSelection] = useState<[number | null, number | null]>([
    null,
    null,
  ]);
  const [loseReason, setLoseReason] = useState<"wrong" | "stuck" | null>(null);
  const [drawnPath, setDrawnPath] = useState<[number, number][]>([]);
  const [pathDrawingActive, setPathDrawingActive] = useState(false);
  const [pairFeedbackKey, setPairFeedbackKey] = useState<
    "bad_path" | "positions" | null
  >(null);

  const bonePositionsRef = useRef<
    Record<number, [number, number, number] | undefined>
  >({});

  const settledRef = useRef<(ShagaiSide | null)[]>(
    Array.from({ length: SEVEN_COUNT }, () => null),
  );
  const settledCount = useRef(0);
  const resultSentRef = useRef(false);
  const completeRef = useRef(false);

  const kinematicRef = useRef<Record<number, [number, number, number] | null>>(
    {},
  );
  const knockBurstRef = useRef<Record<number, KnockBurst | undefined>>({});
  const knockWaitRef = useRef<Set<number> | null>(null);
  const pendingTakePairRef = useRef<{ a: number; b: number } | null>(null);
  const takePickRef = useRef<{ a: number; b: number } | null>(null);
  const collectTakeIdRef = useRef<number | null>(null);

  const activeIdsRef = useRef(activeIds);
  useEffect(() => {
    activeIdsRef.current = activeIds;
  }, [activeIds]);

  const pendingCommitRef = useRef<{
    a: number;
    b: number;
    fromPos: [number, number, number];
    toPos: [number, number, number];
  } | null>(null);
  const [takePick, setTakePick] = useState<{ a: number; b: number } | null>(
    null,
  );
  useEffect(() => {
    takePickRef.current = takePick;
  }, [takePick]);

  const [pairAnim, setPairAnim] = useState<{
    fromId: number;
    toId: number;
    fromPos: [number, number, number];
    toPos: [number, number, number];
    pathWorld: [number, number, number][];
  } | null>(null);
  const [collectAnim, setCollectAnim] = useState<{
    takeId: number;
    start: [number, number, number];
  } | null>(null);
  const [collectedSides, setCollectedSides] = useState<ShagaiSide[]>([]);

  const resetRound = useCallback(() => {
    setPhase("idle");
    setIsThrown(false);
    setThrowParams(Array.from({ length: SEVEN_COUNT }, () => getThrowParams()));
    settledRef.current = Array.from({ length: SEVEN_COUNT }, () => null);
    settledCount.current = 0;
    resultSentRef.current = false;
    setSettledSides(Array.from({ length: SEVEN_COUNT }, () => null));
    setActiveIds(Array.from({ length: SEVEN_COUNT }, (_, i) => i));
    setPairedPairs([]);
    setSelection([null, null]);
    setLoseReason(null);
    setDrawnPath([]);
    setPairFeedbackKey(null);
    setPathDrawingActive(false);
    bonePositionsRef.current = {};
    kinematicRef.current = {};
    knockBurstRef.current = {};
    knockWaitRef.current = null;
    pendingTakePairRef.current = null;
    collectTakeIdRef.current = null;
    pendingCommitRef.current = null;
    setPairAnim(null);
    setCollectAnim(null);
    setCollectedSides([]);
    setTakePick(null);
    completeRef.current = false;
    resetGrants();
  }, [resetGrants]);

  const startThrow = useCallback(() => {
    resetGrants();
    setThrowParams(Array.from({ length: SEVEN_COUNT }, () => getThrowParams()));
    settledRef.current = Array.from({ length: SEVEN_COUNT }, () => null);
    settledCount.current = 0;
    resultSentRef.current = false;
    setSettledSides(Array.from({ length: SEVEN_COUNT }, () => null));
    setActiveIds(Array.from({ length: SEVEN_COUNT }, (_, i) => i));
    setPairedPairs([]);
    setSelection([null, null]);
    setLoseReason(null);
    setDrawnPath([]);
    setPairFeedbackKey(null);
    setPathDrawingActive(false);
    bonePositionsRef.current = {};
    kinematicRef.current = {};
    knockBurstRef.current = {};
    knockWaitRef.current = null;
    pendingTakePairRef.current = null;
    collectTakeIdRef.current = null;
    pendingCommitRef.current = null;
    setPairAnim(null);
    setCollectAnim(null);
    setCollectedSides([]);
    setTakePick(null);
    completeRef.current = false;
    setPhase("throwing");
    setIsThrown(false);
    setTimeout(() => setIsThrown(true), 50);
  }, [resetGrants]);

  const handleThrow = useCallback(() => {
    if (phase !== "idle" && phase !== "won" && phase !== "lost") return;
    startThrow();
  }, [phase, startThrow]);

  const handleReset = useCallback(() => {
    resetRound();
  }, [resetRound]);

  const onPiecePosition = useCallback(
    (id: number, pos: [number, number, number]) => {
      bonePositionsRef.current[id] = pos;
    },
    [],
  );

  const handlePathStart = useCallback((xz: [number, number]) => {
    setDrawnPath([xz]);
    setPairFeedbackKey(null);
  }, []);

  const handlePathAppend = useCallback((xz: [number, number]) => {
    setDrawnPath((prev) => [...prev, xz]);
  }, []);

  const handleClearPath = useCallback(() => {
    setDrawnPath([]);
    setPairFeedbackKey(null);
  }, []);

  useEffect(() => {
    if (!pairFeedbackKey) return;
    const t = setTimeout(() => setPairFeedbackKey(null), 3800);
    return () => clearTimeout(t);
  }, [pairFeedbackKey]);

  const handleSettle = useCallback((id: number, side: ShagaiSide) => {
    const kwait = knockWaitRef.current;
    if (kwait?.has(id)) {
      settledRef.current[id] = side;
      setSettledSides([...settledRef.current]);
      kwait.delete(id);
      if (kwait.size === 0) {
        knockWaitRef.current = null;
        const pair = pendingTakePairRef.current;
        pendingTakePairRef.current = null;
        if (pair) {
          setTakePick(pair);
          setPhase("take_pick");
        }
      }
      return;
    }

    if (settledRef.current[id] !== null) return;
    settledRef.current[id] = side;
    settledCount.current += 1;
    setSettledSides([...settledRef.current]);
    setPhase("settling");

    if (settledCount.current >= SEVEN_COUNT && !resultSentRef.current) {
      resultSentRef.current = true;
      setTimeout(() => {
        setPhase("picking");
      }, 400);
    }
  }, []);

  const handleAnimComplete = useCallback(() => {
    setPairAnim(null);
    const p = pendingCommitRef.current;
    pendingCommitRef.current = null;
    if (!p) return;
    const { a, b } = p;
    grant({ coins: STONE_ROUND_COINS });
    knockWaitRef.current = new Set([a, b]);
    pendingTakePairRef.current = { a, b };
    setPhase("knock_settling");
    setSelection([null, null]);
    setDrawnPath([]);
    setPairFeedbackKey(null);
  }, [grant]);

  const handleNysrekh = useCallback(() => {
    if (phase !== "picking" || pairAnim !== null || collectAnim !== null) return;
    const [a, b] = selection;
    if (a === null || b === null) return;

    const posMap = bonePositionsRef.current;
    const cur = activeIdsRef.current;
    for (const id of cur) {
      if (!posMap[id]) {
        setPairFeedbackKey("positions");
        return;
      }
    }
    if (!validateSevenPairPath(a, b, drawnPath, posMap, cur)) {
      setPairFeedbackKey("bad_path");
      return;
    }

    const from = posMap[a]!;
    const to = posMap[b]!;
    const pathWorld = buildPairAnimPathWorld(from, drawnPath, to);
    pendingCommitRef.current = {
      a,
      b,
      fromPos: [from[0], from[1], from[2]],
      toPos: [to[0], to[1], to[2]],
    };
    setPairAnim({
      fromId: a,
      toId: b,
      fromPos: [from[0], from[1], from[2]],
      toPos: [to[0], to[1], to[2]],
      pathWorld,
    });
  }, [phase, pairAnim, collectAnim, selection, drawnPath]);

  const commitTakeFromPair = useCallback((takeId: number) => {
    const tp = takePickRef.current;
    if (!tp) return;
    const { a, b } = tp;
    if (takeId !== a && takeId !== b) return;

    kinematicRef.current[takeId] = null;
    delete knockBurstRef.current[takeId];

    const cur = activeIdsRef.current;
    const nextActive = cur.filter((x) => x !== takeId);
    const pair: [number, number] = a < b ? [a, b] : [b, a];
    setPairedPairs((pp) => [...pp, pair]);
    setActiveIds(nextActive);
    setTakePick(null);

    const sideTaken = settledRef.current[takeId];
    if (sideTaken) {
      setCollectedSides((prev) => [...prev, sideTaken]);
    }

    const outcome = checkOutcomeAfterPair(nextActive, settledRef.current);
    if (outcome === "win") {
      setPhase("won");
    } else if (outcome === "lose") {
      setLoseReason("stuck");
      setPhase("lost");
    } else {
      setPhase("picking");
    }
  }, []);

  const handleTakeFromPair = useCallback(
    (takeId: number) => {
      if (phase !== "take_pick" || !takePick || collectAnim) return;
      const { a, b } = takePick;
      if (takeId !== a && takeId !== b) return;

      const pos = bonePositionsRef.current[takeId];
      if (!pos) {
        commitTakeFromPair(takeId);
        return;
      }
      collectTakeIdRef.current = takeId;
      setCollectAnim({
        takeId,
        start: [pos[0], pos[1], pos[2]],
      });
    },
    [phase, takePick, collectAnim, commitTakeFromPair],
  );

  const handleCollectComplete = useCallback(() => {
    const tid = collectTakeIdRef.current;
    collectTakeIdRef.current = null;
    setCollectAnim(null);
    if (tid != null) commitTakeFromPair(tid);
  }, [commitTakeFromPair]);

  const handlePickIndex = useCallback(
    (i: number) => {
      if (phase !== "picking" || pairAnim !== null || collectAnim !== null)
        return;
      if (!activeIds.includes(i)) return;

      const [a, b] = selection;

      if (a === null) {
        setSelection([i, null]);
        setDrawnPath([]);
        setPairFeedbackKey(null);
        return;
      }

      if (b !== null) {
        if (b === i) {
          setSelection([a, null]);
          return;
        }
        if (a === i) {
          setSelection([null, null]);
          setDrawnPath([]);
          setPairFeedbackKey(null);
          return;
        }
        setSelection([i, null]);
        setDrawnPath([]);
        setPairFeedbackKey(null);
        return;
      }

      if (a === i) {
        setSelection([null, null]);
        setDrawnPath([]);
        setPairFeedbackKey(null);
        return;
      }

      const sides = settledRef.current;
      const sa = sides[a];
      const sb = sides[i];
      if (!sa || !sb) return;

      if (sa !== sb) {
        setLoseReason("wrong");
        setPhase("lost");
        return;
      }

      setSelection([a, i]);
      setPairFeedbackKey(null);
    },
    [activeIds, phase, selection, pairAnim, collectAnim],
  );

  useEffect(() => {
    if (phase !== "won" && phase !== "lost") return;
    if (completeRef.current) return;
    completeRef.current = true;
    const won = phase === "won";
    if (won) grant({ gems: STONE_MATCH_GEMS });
    onComplete?.(won ? "win" : "lose", won ? 100 : 0);
  }, [phase, onComplete, grant]);

  const isWin = phase === "won";
  const pathPickActive =
    phase === "picking" &&
    selection[0] !== null &&
    selection[1] === null;
  const orbitLocked =
    pathPickActive ||
    pathDrawingActive ||
    phase === "knock_settling" ||
    collectAnim !== null;

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
        camera={{ position: [0, 9, 13], fov: 50 }}
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
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-4, 5, -4]} intensity={0.35} color="#ffd080" />
        <pointLight position={[4, 4, 4]} intensity={0.2} color="#c0d4ff" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <Physics
            gravity={[0, -14, 0]}
            defaultContactMaterial={{ friction: 0.88, restitution: 0.12 }}
          >
            <PhysicsFloor />
            <GameScene
              throwParams={throwParams}
              isThrown={isThrown}
              settledSides={settledSides}
              onSettle={handleSettle}
              isWin={isWin}
              activeIds={activeIds}
              selection={selection}
              takePick={takePick}
              onPiecePosition={onPiecePosition}
              kinematicRef={kinematicRef}
              knockBurstRef={knockBurstRef}
            />
            <SevenPairPathAnimator
              active={pairAnim !== null}
              fromId={pairAnim?.fromId ?? 0}
              toId={pairAnim?.toId ?? 0}
              fromPos={pairAnim?.fromPos ?? [0, 0.2, 0]}
              toPos={pairAnim?.toPos ?? [0, 0.2, 0]}
              pathWorld={pairAnim?.pathWorld ?? []}
              kinematicRef={kinematicRef}
              knockBurstRef={knockBurstRef}
              onComplete={handleAnimComplete}
            />
            <SevenCollectAnimator
              active={collectAnim !== null}
              pieceId={collectAnim?.takeId ?? 0}
              start={collectAnim?.start ?? [0, 0.2, 0]}
              kinematicRef={kinematicRef}
              onComplete={handleCollectComplete}
            />
            <SevenPathDrawLayer
              enabled={
                phase === "picking" &&
                selection[0] !== null &&
                selection[1] === null
              }
              points={drawnPath}
              onPathStart={handlePathStart}
              onPathAppend={handlePathAppend}
              onDraggingChange={setPathDrawingActive}
            />
          </Physics>
        </Suspense>

        <OrbitControls
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={6}
          maxDistance={18}
          enablePan={false}
          enableRotate={!orbitLocked}
          enableZoom={!pathPickActive}
          target={[0, 0, 0]}
        />
      </Canvas>

      <InventoryRewardOverlay
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
      />

      <ShagaiSevenUI
        phase={phase}
        settledSides={settledSides}
        activeIds={activeIds}
        pairedPairs={pairedPairs}
        selection={selection}
        onThrow={handleThrow}
        onReset={handleReset}
        onPickIndex={handlePickIndex}
        loseReason={loseReason}
        pathPointCount={drawnPath.length}
        onClearPath={handleClearPath}
        pairFeedbackKey={pairFeedbackKey}
        onNysrekh={handleNysrekh}
        pairAnimating={pairAnim !== null}
        takePick={takePick}
        onTakeFromPair={handleTakeFromPair}
        collectedSides={collectedSides}
        collectAnimating={collectAnim !== null}
      />
    </div>
  );
}
