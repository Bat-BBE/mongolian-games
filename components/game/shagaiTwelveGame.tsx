"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import ShagaiTwelveUI from "./shagaiTwelveUI";
import {
  countHorses,
  getAllowedTwelvePicks,
  isTwelveGameOver,
  isTwelvePickAllowed,
  pickCpuTwelveDefault,
  type ShagaiSide,
  type TwelvePhase,
  type TwelvePick,
} from "./shagaiTwelveType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import {
  getShagaiThrowParams,
  getTwelveThrowStartPositions,
} from "./shagaiThrowShared";

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
        <circleGeometry args={[2.9, 48]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.009, 2.0]}
        scale={[1, 0.7, 1]}
      >
        <ringGeometry args={[2.8, 2.92, 48]} />
        <meshStandardMaterial
          color="#c8a030"
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>
      {(
        [
          [[3, 1, 2.0] as [number, number, number], [0.2, 2, 5.2] as [number, number, number]],
          [[-3, 1, 2.0] as [number, number, number], [0.2, 2, 5.2] as [number, number, number]],
          [[0, 1, 4.2] as [number, number, number], [6, 2, 0.2] as [number, number, number]],
          [[0, 1, -0.5] as [number, number, number], [12, 2, 0.2] as [number, number, number]],
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

const pos4 = getTwelveThrowStartPositions(4);

export type ShagaiTwelveSceneProps = {
  n: TwelvePick;
  throwParams: ReturnType<typeof getShagaiThrowParams>[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
};

/** 12 жил — ганц болон online-д хамт ашиглана. */
export function ShagaiTwelveGameScene({
  n,
  throwParams,
  isThrown,
  settledSides,
  onSettle,
}: ShagaiTwelveSceneProps) {
  const pieceTemplate = useShagaiThrowPieceTemplate();
  const startPos = getTwelveThrowStartPositions(n);
  return (
    <>
      <ThrowMat />
      {([0, 1, 2, 3] as const).map((i) => {
        if (i >= n) {
          return (
            <group key={i} position={[0, -5, 0]}>
              <SingleShagai
                id={i}
                startPos={pos4[i]!}
                throwVel={[0, 0, 0]}
                throwAngVel={[0, 0, 0]}
                isThrown={false}
                onSettle={() => {}}
                highlight={false}
                resultSide={null}
                pieceTemplate={pieceTemplate}
                maxOnkhRetries={0}
              />
            </group>
          );
        }
        return (
          <SingleShagai
            key={i}
            id={i}
            startPos={startPos[i]!}
            throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
            throwAngVel={throwParams[i]?.angVel ?? [4, 4, 4]}
            isThrown={isThrown}
            onSettle={onSettle}
            highlight={settledSides[i] === "horse"}
            resultSide={settledSides[i] ?? null}
            pieceTemplate={pieceTemplate}
            maxOnkhRetries={0}
          />
        );
      })}
    </>
  );
}

export { PhysicsFloor };

export type ShagaiTwelveGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
  /**
   * `Online` нээлээ гэхдээ өрөөнд 2+ хүнгүй: автомаар «роботтой», сонголтыг нуух (хөдөлмөрөөр шиг).
   */
  autoPlayVsBotWhenSoloInRoom?: boolean;
};

export default function ShagaiTwelveGame({
  onComplete,
  autoPlayVsBotWhenSoloInRoom = false,
}: ShagaiTwelveGameProps) {
  const { grant, resetGrants } = useInventoryGrant();
  const [throwsAt4, setThrowsAt4] = useState(0);
  const [throwsAt3, setThrowsAt3] = useState(0);
  const [phase, setPhase] = useState<TwelvePhase>("idle");
  const [turn, setTurn] = useState<0 | 1>(0);
  const [pick, setPick] = useState<TwelvePick>(4);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [nThrow, setNThrow] = useState<TwelvePick>(4);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState(
    [0, 1, 2, 3].map(() => getShagaiThrowParams()),
  );
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>([
    null, null, null, null,
  ]);
  const [lastSides, setLastSides] = useState<(ShagaiSide | null)[]>([
    null, null, null, null,
  ]);
  const [lastHorses, setLastHorses] = useState(0);
  const [winner, setWinner] = useState<0 | 1 | null>(null);

  const turnRef = useRef<0 | 1>(0);
  const nRef = useRef<TwelvePick>(4);
  const throwsAt4Ref = useRef(0);
  const throwsAt3Ref = useRef(0);
  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultDone = useRef(false);
  const completeOnce = useRef(false);
  const syncGen = useRef(0);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);
  useEffect(() => {
    nRef.current = nThrow;
  }, [nThrow]);
  useEffect(() => {
    throwsAt4Ref.current = throwsAt4;
  }, [throwsAt4]);
  useEffect(() => {
    throwsAt3Ref.current = throwsAt3;
  }, [throwsAt3]);

  useEffect(() => {
    if (phase === "matchOver" || phase === "throwing" || phase === "settling")
      return;
    const allowed = getAllowedTwelvePicks(throwsAt4, throwsAt3);
    setPick((p) =>
      allowed.includes(p) ? p : pickCpuTwelveDefault(throwsAt4, throwsAt3),
    );
  }, [throwsAt4, throwsAt3, phase]);

  useEffect(() => {
    if (phase !== "matchOver" || winner == null || completeOnce.current) return;
    completeOnce.current = true;
    onComplete?.(winner === 0 ? "win" : "lose", winner === 0 ? 100 : 0);
  }, [phase, winner, onComplete]);

  const startThrow = useCallback((forTurn: 0 | 1, num: TwelvePick) => {
    const g = ++syncGen.current;
    setTurn(forTurn);
    turnRef.current = forTurn;
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
  }, []);

  const finishAndAdvance = useCallback(
    (horses: number, sides: ShagaiSide[]) => {
      if (horses > 0) grant({ coins: STONE_ROUND_COINS });
      const boneN = nRef.current;
      if (boneN === 4) {
        setThrowsAt4((u) => u + 1);
      } else if (boneN === 3) {
        setThrowsAt3((u) => u + 1);
      }
      const last4: (ShagaiSide | null)[] = [null, null, null, null];
      for (let i = 0; i < sides.length; i++) {
        last4[i] = sides[i] ?? null;
      }
      setLastSides(last4);
      setLastHorses(horses);

      const t0 = turnRef.current;
      setScores((prev) => {
        const s0 = t0 === 0 ? prev[0] + horses : prev[0];
        const s1 = t0 === 1 ? prev[1] + horses : prev[1];
        const o = isTwelveGameOver(s0, s1);
        if (o.over) {
          setPhase("matchOver");
          setWinner(o.winner!);
        } else {
          setPhase("result");
          const next: 0 | 1 = t0 === 0 ? 1 : 0;
          setTurn(next);
          if (next === 1) {
            setPhase("cpuWait");
          }
        }
        return [s0, s1] as [number, number];
      });
    },
    [grant],
  );

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      const num = nRef.current;
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
        const raw = settledRef.current.slice(0, num);
        const sides = raw.filter((s): s is ShagaiSide => s != null);
        const horses = countHorses(sides);
        finishAndAdvance(horses, sides);
      }, 500);
    },
    [finishAndAdvance],
  );

  // CPU: ээлж — лимитоор сонгосон n
  useEffect(() => {
    if (phase !== "cpuWait") return;
    const t = window.setTimeout(() => {
      const n = pickCpuTwelveDefault(
        throwsAt4Ref.current,
        throwsAt3Ref.current,
      );
      setPick(n);
      startThrow(1, n);
    }, 900);
    return () => clearTimeout(t);
  }, [phase, startThrow]);

  const canHumanThrow =
    phase !== "matchOver" &&
    (phase === "idle" || phase === "result") &&
    turn === 0;

  const onThrow = useCallback(() => {
    if (!canHumanThrow) return;
    if (!isTwelvePickAllowed(pick, throwsAt4, throwsAt3)) return;
    startThrow(0, pick);
  }, [canHumanThrow, throwsAt4, throwsAt3, pick, startThrow, turn]);

  const onReset = useCallback(() => {
    syncGen.current += 1;
    setPhase("idle");
    setTurn(0);
    setScores([0, 0]);
    setNThrow(4);
    nRef.current = 4;
    setPick(4);
    setIsThrown(false);
    settledRef.current = [null, null, null, null];
    setSettledSides([null, null, null, null]);
    setLastSides([null, null, null, null]);
    setLastHorses(0);
    setWinner(null);
    resultDone.current = false;
    completeOnce.current = false;
    setThrowsAt4(0);
    setThrowsAt3(0);
    throwsAt4Ref.current = 0;
    throwsAt3Ref.current = 0;
    resetGrants();
  }, [resetGrants]);

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
        mode="vsCpu"
        turn={turn}
        pick={pick}
        onPick={setPick}
        throwsAt4={throwsAt4}
        throwsAt3={throwsAt3}
        scores={scores}
        canThrow={canHumanThrow}
        onThrow={onThrow}
        onReset={onReset}
        lastSides={lastSides}
        lastHorses={lastHorses}
        winner={winner}
        showSoloOnlineNote={autoPlayVsBotWhenSoloInRoom}
      />
    </div>
  );
}
