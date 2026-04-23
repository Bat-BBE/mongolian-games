"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import {
  Suspense,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import ShagaiTargetUI from "./shagaiTargetUI";
import {
  GameState,
  INITIAL_STATE,
  ShagaiSide,
  RoundResult,
  scoreTarget,
  TARGET_SCORE,
  type ScoreLabelKey,
} from "./shagaiTargetType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import {
  getShagaiThrowParams,
  SHAGAI_THROW_START_POSITIONS,
} from "./shagaiThrowShared";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useApp } from "@/components/AppContext";

const RELAY_CH = "homboroi_v1";

type HomboroiRelay = {
  v: number;
  throwerId: string;
  sides: ShagaiSide[];
  scores: Record<string, number>;
  nextTurnPlayerId: string;
  totalThrows: number;
  lastPoints: number;
  lastLabel: ScoreLabelKey;
  lastHistory: RoundResult;
  matchOver: boolean;
  winnerId: string | null;
  streak: number;
  bestStreak: number;
};

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as React.LegacyRef<THREE.Mesh> | undefined} />;
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
      {(
        [
          [[6, 1, 0], [0.2, 2, 12]],
          [[-6, 1, 0], [0.2, 2, 12]],
          [[0, 1, 5], [12, 2, 0.2]],
          [[0, 1, -5], [12, 2, 0.2]],
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

function WinLightEffect({ active }: { active: boolean }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!active) return;
    const t = state.clock.elapsedTime;
    if (light1.current) {
      light1.current.intensity = (Math.sin(t * 4) * 0.5 + 0.5) * 2;
      light1.current.position.x = Math.sin(t * 2) * 3;
    }
    if (light2.current) {
      light2.current.intensity = (Math.cos(t * 4) * 0.5 + 0.5) * 2;
      light2.current.position.x = Math.cos(t * 2) * 3;
    }
  });
  if (!active) return null;
  return (
    <>
      <pointLight
        ref={light1}
        color="#f0c040"
        intensity={2}
        distance={6}
        position={[0, 3, 0]}
      />
      <pointLight
        ref={light2}
        color="#60c0ff"
        intensity={1.5}
        distance={6}
        position={[0, 2, 0]}
      />
    </>
  );
}

function GoldParticles({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef(
    Array.from({ length: 30 }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2,
        (Math.random() - 0.5) * 4,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 3,
      ),
      life: Math.random(),
      speed: 0.5 + Math.random(),
    })),
  );
  const activeRef = useRef(false);
  useEffect(() => {
    if (active && !activeRef.current) {
      activeRef.current = true;
      particles.current.forEach((p) => {
        p.pos.set((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2);
        p.vel.set(
          (Math.random() - 0.5) * 4,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 4,
        );
        p.life = 0;
      });
    }
    if (!active) activeRef.current = false;
  }, [active]);
  useFrame((_, delta) => {
    if (!groupRef.current || !active) return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles.current[i]!;
      p.life += delta * p.speed;
      if (p.life > 1) p.life = 0;
      p.vel.y -= 6 * delta;
      p.pos.addScaledVector(p.vel, delta * 0.3);
      child.position.copy(p.pos);
      child.position.y = Math.max(0.1, child.position.y);
      const s = (1 - p.life) * 0.08;
      (child as THREE.Mesh).scale.setScalar(Math.max(0, s));
    });
  });
  if (!active) return null;
  return (
    <group ref={groupRef}>
      {particles.current.map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial
            color={["#f0c040", "#c8a030", "#fff0a0", "#ffd060"][i % 4]}
            emissive={["#f0c040", "#c8a030", "#fff0a0", "#ffd060"][i % 4]}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

type SceneProps = {
  throwParams: {
    vel: [number, number, number];
    angVel: [number, number, number];
  }[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  isWin: boolean;
};

function GameScene({
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  isWin,
}: SceneProps) {
  const allDone = settledSides.every((s) => s !== null);
  const pieceTemplate = useShagaiThrowPieceTemplate();
  return (
    <>
      <GameTable />
      <WinLightEffect active={isWin} />
      <GoldParticles active={isWin} />
      {[0, 1, 2, 3].map((i) => (
        <SingleShagai
          key={i}
          id={i}
          startPos={SHAGAI_THROW_START_POSITIONS[i]!}
          throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
          throwAngVel={throwParams[i]?.angVel ?? [5, 5, 5]}
          isThrown={isThrown}
          onSettle={onSettle}
          highlight={isWin && allDone}
          resultSide={settledSides[i] ?? null}
          pieceTemplate={pieceTemplate}
          maxOnkhRetries={0}
        />
      ))}
    </>
  );
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseRelay(raw: unknown): HomboroiRelay | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.v !== "number") return null;
  if (typeof raw.throwerId !== "string") return null;
  if (!Array.isArray(raw.sides) || raw.sides.length !== 4) return null;
  if (!isRecord(raw.scores)) return null;
  if (typeof raw.nextTurnPlayerId !== "string") return null;
  if (typeof raw.totalThrows !== "number") return null;
  if (typeof raw.lastLabel !== "string") return null;
  if (raw.winnerId !== null && typeof raw.winnerId !== "string")
    return null;
  if (typeof raw.streak !== "number" || typeof raw.bestStreak !== "number")
    return null;
  if (!isRecord(raw.lastHistory)) return null;
  return raw as unknown as HomboroiRelay;
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export default function ShagaiHomboroiMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const myId = mp.playerId ?? "";
  const order = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean),
    [mp.players],
  );
  const nameById = useMemo(
    () =>
      Object.fromEntries(mp.players.map((p) => [p.id, p.displayName] as const)),
    [mp.players],
  );

  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState<
    ReturnType<typeof getShagaiThrowParams>[]
  >([0, 1, 2, 3].map(() => getShagaiThrowParams()));
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [turnPlayerId, setTurnPlayerId] = useState(() => order[0] ?? "");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [mpToast, setMpToast] = useState<string | null>(null);

  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const stateRef = useRef(state);
  stateRef.current = state;
  const currentTurnRef = useRef(turnPlayerId);
  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultSentRef = useRef(false);
  const matchSentRef = useRef(false);
  const appliedV = useRef(0);
  const lastRelayId = useRef(-1);
  const syncGen = useRef(0);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    currentTurnRef.current = turnPlayerId;
  }, [turnPlayerId]);

  useEffect(() => {
    setTurnPlayerId(order[0] ?? "");
    const z = Object.fromEntries(order.map((id) => [id, 0]));
    setScores(z);
    scoresRef.current = z;
    appliedV.current = 0;
    syncGen.current += 1;
  }, [order, mp.matchStartedAt, mp.roomStatus]);

  useEffect(() => {
    if (state.phase !== "matchOver" || matchSentRef.current) return;
    const w = state.mpWinnerId;
    if (!w) return;
    matchSentRef.current = true;
    onComplete(w === myId ? "win" : "lose", w === myId ? 100 : 0);
  }, [state.phase, state.mpWinnerId, onComplete, myId]);

  const lastThrowRef = useRef(0);

  const startThrow = useCallback(
    (forPlayerId: string) => {
      if (forPlayerId !== myId) return;
      const params = [0, 1, 2, 3].map(() => getShagaiThrowParams());
      setThrowParams(params);
      settledRef.current = [null, null, null, null];
      settledCount.current = 0;
      resultSentRef.current = false;
      setSettledSides([null, null, null, null]);
      currentTurnRef.current = forPlayerId;
      setState((prev) => {
        const nt = prev.totalThrows + 1;
        lastThrowRef.current = nt;
        return {
          ...prev,
          totalThrows: nt,
          phase: "throwing",
          robotSides: null,
          robotPoints: 0,
          robotLabel: "",
        };
      });
      setIsThrown(false);
      setTimeout(() => setIsThrown(true), 50);
    },
    [myId],
  );

  const handleThrow = useCallback(() => {
    if (
      state.phase !== "idle" &&
      state.phase !== "playerResult" &&
      state.phase !== "robotResult"
    )
      return;
    if (turnPlayerId !== myId) return;
    startThrow(myId);
  }, [state.phase, startThrow, turnPlayerId, myId]);

  const pushToast = useCallback(
    (text: string) => {
      if (toastT.current) clearTimeout(toastT.current);
      setMpToast(text);
      toastT.current = setTimeout(() => {
        setMpToast(null);
        toastT.current = null;
      }, 3000);
    },
    [],
  );

  const applyRemoteRelay = useCallback(
    (h: HomboroiRelay) => {
      if (h.v <= appliedV.current) return;
      appliedV.current = h.v;
      setScores(h.scores);
      scoresRef.current = h.scores;
      setState((prev) => ({
        ...prev,
        history: [...prev.history, h.lastHistory],
        totalThrows: h.totalThrows,
        playerScore: h.scores[myId] ?? 0,
        robotScore: 0,
        lastPlayerPoints: h.lastPoints,
        lastPlayerLabel: h.lastLabel,
        phase: h.matchOver ? "matchOver" : "playerResult",
        winner:
          h.matchOver && h.winnerId
            ? h.winnerId === myId
              ? "player"
              : "robot"
            : null,
        mpWinnerId: h.matchOver ? h.winnerId : null,
        streak: prev.streak,
        bestStreak: prev.bestStreak,
        robotSides: null,
        robotLabel: "",
        robotPoints: 0,
      }));
      setSettledSides(h.sides);
      setTurnPlayerId(
        h.matchOver ? h.throwerId : h.nextTurnPlayerId,
      );
      if (!h.matchOver) {
        setTimeout(() => {
          setSettledSides([null, null, null, null]);
          setState((p) => ({
            ...p,
            phase: "idle",
            lastPlayerLabel: "",
            lastPlayerPoints: 0,
          }));
        }, 1200);
      } else {
        setIsThrown(false);
      }
      const who = nameById[h.throwerId] ?? "?";
      if (h.lastHistory.bust) {
        pushToast(
          language === "en"
            ? `${who} busted (back to 0)`
            : `${who} 32-аас хэтэрсэн (0)`,
        );
      } else if (h.lastHistory.instantMatchWin) {
        pushToast(
          language === "en"
            ? `${who} — four horses, win!`
            : `${who} — дөрвөн морь!`,
        );
      } else {
        pushToast(
          language === "en"
            ? `${who}: +${h.lastPoints} pts`
            : `${who}: +${h.lastPoints} оноо`,
        );
      }
    },
    [myId, nameById, pushToast, language],
  );

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      if (turnPlayerId !== myId) return;
      if (settledRef.current[id] !== null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;
      setSettledSides([...settledRef.current]);
      setState((prev) => ({ ...prev, phase: "settling" }));

      if (settledCount.current < 4 || resultSentRef.current) return;
      resultSentRef.current = true;
      const gen = syncGen.current;
      setTimeout(() => {
        if (gen !== syncGen.current) return;
        const sides = settledRef.current.filter(Boolean) as ShagaiSide[];
        const { points, labelKey, instantMatchWin } = scoreTarget(sides);
        const thrower = myId;
        if (points > 0 || instantMatchWin) grant({ coins: STONE_ROUND_COINS });

        const prev = stateRef.current;
        const o = orderRef.current;
        const beforeScores = { ...scoresRef.current };
        const newScores = { ...beforeScores };
        const tr = lastThrowRef.current || prev.totalThrows;
        let hist: RoundResult;
        let matchOver = false;
        let winnerId: string | null = null;
        let nextTurn = o[0] ?? thrower;
        const newSt: number = instantMatchWin
          ? prev.streak + 1
          : (() => {
              const before = beforeScores[thrower] ?? 0;
              const tentative = before + points;
              const bust = tentative > TARGET_SCORE;
              if (!bust && points > 0) return prev.streak + 1;
              return 0;
            })();
        const newBest = Math.max(prev.bestStreak, newSt);

        if (instantMatchWin) {
          winnerId = thrower;
          matchOver = true;
          hist = {
            turn: "player",
            mpThrowerId: thrower,
            sides,
            points: 0,
            label: labelKey,
            throwNumber: tr,
            bust: false,
            exactWin: false,
            instantMatchWin: true,
          };
        } else {
          const before = beforeScores[thrower] ?? 0;
          const tentative = before + points;
          const exactWin = tentative === TARGET_SCORE;
          const bust = tentative > TARGET_SCORE;
          const finalScore = bust ? 0 : tentative;
          newScores[thrower] = finalScore;
          const idx = o.indexOf(thrower);
          nextTurn = o[(idx + 1) % o.length] ?? thrower;
          hist = {
            turn: "player",
            mpThrowerId: thrower,
            sides,
            points: bust ? 0 : points,
            label: labelKey,
            throwNumber: tr,
            bust,
            exactWin: exactWin && !bust,
          };
          if (exactWin) {
            matchOver = true;
            winnerId = thrower;
          }
        }

        setScores(newScores);
        scoresRef.current = newScores;
        setTurnPlayerId(matchOver ? thrower : nextTurn);
        appliedV.current += 1;
        sendRelay(RELAY_CH, {
          v: appliedV.current,
          throwerId: thrower,
          sides,
          scores: newScores,
          nextTurnPlayerId: nextTurn,
          totalThrows: tr,
          lastPoints: instantMatchWin
            ? 0
            : hist.bust
              ? 0
              : hist.points,
          lastLabel: labelKey,
          lastHistory: hist,
          matchOver,
          winnerId,
          streak: newSt,
          bestStreak: newBest,
        } as HomboroiRelay);

        if (hist.bust) {
          pushToast(
            language === "en"
              ? "You went over 32 — back to 0"
              : "Та 32-аас хэтэрсэн (0)",
          );
        } else if (hist.instantMatchWin) {
          pushToast(
            language === "en"
              ? "Four horses — you win!"
              : "Дөрвөн морь — та яллаа!",
          );
        } else {
          pushToast(
            language === "en" ? `+${hist.points} pts` : `+${hist.points} оноо`,
          );
        }

        if (!matchOver) {
          setTimeout(() => {
            if (gen !== syncGen.current) return;
            setSettledSides([null, null, null, null]);
            setState((p) => ({
              ...p,
              phase: "idle",
              lastPlayerLabel: "",
              lastPlayerPoints: 0,
            }));
            setIsThrown(false);
          }, 1200);
        } else {
          setIsThrown(false);
        }

        setState((p) => ({
          ...p,
          history: [...p.history, hist],
          phase: matchOver ? "matchOver" : "playerResult",
          playerScore: newScores[myId] ?? 0,
          robotScore: 0,
          lastPlayerPoints: instantMatchWin
            ? 0
            : hist.bust
              ? 0
              : hist.points,
          lastPlayerLabel: labelKey,
          winner:
            matchOver && winnerId
              ? winnerId === myId
                ? "player"
                : "robot"
              : null,
          mpWinnerId: matchOver ? winnerId : null,
          streak: newSt,
          bestStreak: newBest,
          robotSides: null,
        }));
      }, 500);
    },
    [turnPlayerId, myId, grant, sendRelay, pushToast, language],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.id === lastRelayId.current) return;
    if (lastPeerRelay.channel !== RELAY_CH) return;
    lastRelayId.current = lastPeerRelay.id;
    if (lastPeerRelay.from === myId) return;
    const p = parseRelay(lastPeerRelay.payload);
    if (p) applyRemoteRelay(p);
  }, [lastPeerRelay, myId, applyRemoteRelay]);

  const handleReset = useCallback(() => {
    setState(INITIAL_STATE);
    setSettledSides([null, null, null, null]);
    setTurnPlayerId(order[0] ?? "");
    const z = Object.fromEntries(order.map((id) => [id, 0]));
    setScores(z);
    scoresRef.current = z;
    settledCount.current = 0;
    setIsThrown(false);
    resultSentRef.current = false;
    matchSentRef.current = false;
    appliedV.current = 0;
    lastRelayId.current = -1;
    syncGen.current += 1;
    resetGrants();
  }, [order, resetGrants]);

  const uiState = useMemo((): GameState => {
    return {
      ...state,
      playerScore: scores[myId] ?? 0,
    };
  }, [state, scores, myId]);

  const isWin =
    state.phase === "matchOver" && state.mpWinnerId === myId;

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
            />
          </Physics>
        </Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={6}
          maxDistance={18}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>
      <ShagaiTargetUI
        state={uiState}
        onThrow={handleThrow}
        onReset={handleReset}
        settledSides={settledSides}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
        currentTurn="player"
        uiMode="mp"
        mp={{
          myId,
          nameById,
          order,
          scores,
          turnPlayerId,
        }}
        mpToastText={mpToast}
        compactRules
      />
    </div>
  );
}
