"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import StoneHand from "./stoneHand";
import StoneGameUI from "./stoneGameUI";
import {
  GameState,
  INITIAL_STATE,
  computerPickStones,
  computerGuessTotal,
  buildMessage,
  WIN_SCORE,
} from "./stoneType";
import { useAuth } from "@/components/AuthContext";
import { getGameProfileByEmail, syncAppUserSimple } from "@/lib/api";

export type StoneGameProps = {
  onComplete?: (result: "win" | "lose") => void;
};

function CinematicCamera({ phase }: { phase: GameState["phase"] }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 4, 7));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (phase === "result") {
      targetPos.current.set(0.2, 3.35, 6.2);
      targetLook.current.set(0, 0.25, 0.2);
      return;
    }
    if (phase === "guess") {
      targetPos.current.set(0, 3.9, 7.4);
      targetLook.current.set(0, 0.15, 0);
      return;
    }
    // pick
    targetPos.current.set(0, 4.15, 7.8);
    targetLook.current.set(0, 0.05, 0);
  }, [phase]);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-6.5 * dt);
    camera.position.lerp(targetPos.current, k);
    const look = new THREE.Vector3();
    look.copy(targetLook.current);
    camera.lookAt(look);
  });
  return null;
}

function GameTable() {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.5, 0]}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0806" roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.48, 0]}
      >
        <boxGeometry args={[7, 4, 0.08]} />
        <meshStandardMaterial
          color="#2a1a0e"
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>

      {[
        {
          pos: [3.55, -0.44, 0] as [number, number, number],
          args: [0.1, 0.08, 4.05] as [number, number, number],
        },
        {
          pos: [-3.55, -0.44, 0] as [number, number, number],
          args: [0.1, 0.08, 4.05] as [number, number, number],
        },
        {
          pos: [0, -0.44, 2.05] as [number, number, number],
          args: [7.1, 0.08, 0.1] as [number, number, number],
        },
        {
          pos: [0, -0.44, -2.05] as [number, number, number],
          args: [7.1, 0.08, 0.1] as [number, number, number],
        },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <boxGeometry args={b.args} />
          <meshStandardMaterial
            color="#c8a030"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* Дунд шугам */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <planeGeometry args={[0.04, 4]} />
        <meshStandardMaterial
          color="#c8a030"
          metalness={0.5}
          opacity={0.4}
          transparent
        />
      </mesh>
    </>
  );
}

// ── Нисэж буй чулуунуудын частицын эффект ─────
function StoneBurst({
  active,
  position,
}: {
  active: boolean;
  position: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4,
      ),
      pos: new THREE.Vector3(),
      scale: 0.06 + Math.random() * 0.08,
    })),
  );

  useFrame((_, delta) => {
    if (!groupRef.current || !active) return;
    timeRef.current += delta;
    if (timeRef.current > 1.5) return;

    groupRef.current.children.forEach((child, i) => {
      const p = particles.current[i];
      p.pos.addScaledVector(p.vel, delta);
      p.vel.y -= 8 * delta; // gravity
      child.position.copy(p.pos);
      const s = Math.max(0, 1 - timeRef.current / 1.2) * p.scale;
      (child as THREE.Mesh).scale.setScalar(s);
    });
  });

  // reset
  useEffect(() => {
    if (active) {
      timeRef.current = 0;
      particles.current.forEach((p) => {
        p.pos.set(0, 0, 0);
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      {particles.current.map((p, i) => (
        <mesh key={i} castShadow>
          <dodecahedronGeometry args={[p.scale, 0]} />
          <meshStandardMaterial
            color={["#6a7a6a", "#5a6a5a", "#7a8a7a"][i % 3]}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── 3D Scene агуулга ───────────────────────────
function GameScene({
  state,
  burstActive,
}: {
  state: GameState;
  burstActive: boolean;
}) {
  const showPlayerStones =
    state.playerStones !== null &&
    (state.phase === "guess" || state.phase === "result");
  // Requirement: robot stones should NOT be shown until after result.
  const showComputerStones =
    state.phase === "result" && state.computerStones !== null;

  return (
    <>
      <GameTable />
      <StoneHand
        stoneCount={showPlayerStones ? (state.playerStones ?? 0) : 0}
        isOpen={showPlayerStones}
        isPlayer={true}
        position={[-2.0, 0.1, 0.5]}
        revealAnim={state.phase === "result"}
        phase={state.phase}
      />
      <StoneHand
        stoneCount={showComputerStones ? (state.computerStones ?? 0) : 0}
        isOpen={showComputerStones}
        isPlayer={false}
        position={[2.0, 0.1, 0.5]}
        revealAnim={state.phase === "result"}
        phase={state.phase}
      />
      <StoneBurst active={burstActive} position={[0, 0.5, 0]} />
    </>
  );
}

export default function StoneGame({ onComplete }: StoneGameProps) {
  const { user } = useAuth();
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [burstActive, setBurstActive] = useState(false);
  const sentRef = useRef(false);
  const rewardQueuedRef = useRef({ coins: 0, gems: 0 });
  const [rewardEvents, setRewardEvents] = useState<
    { id: string; text: string; kind: "coins" | "gems" }[]
  >([]);
  const [sessionGain, setSessionGain] = useState({ coins: 0, gems: 0 });

  const applyReward = useCallback(
    async (delta: { coins?: number; gems?: number }) => {
      const email = user?.email?.trim();
      if (!email) return;
      const dCoins = delta.coins ?? 0;
      const dGems = delta.gems ?? 0;
      if (!dCoins && !dGems) return;
      rewardQueuedRef.current.coins += dCoins;
      rewardQueuedRef.current.gems += dGems;
      setSessionGain((p) => ({
        coins: p.coins + dCoins,
        gems: p.gems + dGems,
      }));

      const now = Date.now();
      const addEvt = (kind: "coins" | "gems", text: string) => {
        const id = `${kind}_${now}_${Math.random().toString(16).slice(2)}`;
        setRewardEvents((prev) => [...prev, { id, kind, text }]);
        setTimeout(() => {
          setRewardEvents((prev) => prev.filter((e) => e.id !== id));
        }, 1350);
      };
      if (dCoins) addEvt("coins", `+${dCoins} 🪙`);
      if (dGems) addEvt("gems", `+${dGems} 💎`);

      try {
        const profileRes = await getGameProfileByEmail(email);
        const current =
          profileRes?.user?.profile &&
          typeof profileRes.user.profile === "object"
            ? (profileRes.user.profile as Record<string, unknown>)
            : {};
        const invRaw = (current as any).inventory;
        const inv =
          invRaw && typeof invRaw === "object"
            ? (invRaw as Record<string, unknown>)
            : {};
        const coins =
          typeof inv.coins === "number" ? inv.coins : Number(inv.coins ?? 0);
        const gems =
          typeof inv.gems === "number" ? inv.gems : Number(inv.gems ?? 0);

        const nextProfile = {
          ...current,
          inventory: {
            ...inv,
            coins: (Number.isFinite(coins) ? coins : 0) + dCoins,
            gems: (Number.isFinite(gems) ? gems : 0) + dGems,
          },
        } as Record<string, unknown>;

        await syncAppUserSimple({ email, profile: nextProfile });
      } catch {}
    },
    [user?.email],
  );

  const handlePick = useCallback(
    (n: number) => {
      if (state.phase !== "pick") return;
      const compStones = computerPickStones(state.history);

      setState((prev) => ({
        ...prev,
        playerStones: n,
        computerStones: compStones,
        phase: "guess",
      }));
    },
    [state.phase, state.history],
  );

  const handleGuess = useCallback(
    (guess: number) => {
      if (state.phase !== "guess") return;
      if (state.playerStones === null || state.computerStones === null) return;

      const total = state.playerStones + state.computerStones;
      const compGuess = computerGuessTotal({
        playerStones: state.playerStones,
        computerStones: state.computerStones,
        playerGuess: guess,
      });

      const playerCorrect = guess === total;
      const compCorrect = compGuess === total;
      const outcome: "player" | "computer" | "none" = playerCorrect
        ? "player"
        : compCorrect
          ? "computer"
          : "none";

      const roundResult = {
        playerStones: state.playerStones,
        computerStones: state.computerStones,
        total,
        playerGuess: guess,
        computerGuess: compGuess,
        outcome,
      };

      const newScore = {
        player: state.score.player + (outcome === "player" ? 1 : 0),
        computer: state.score.computer + (outcome === "computer" ? 1 : 0),
      };

      setState((prev) => ({
        ...prev,
        playerGuess: guess,
        computerGuess: compGuess,
        phase: "result",
        score: newScore,
        history: [...prev.history, roundResult],
        message: buildMessage(roundResult),
      }));
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 1500);
      if (outcome === "player") {
        void applyReward({ coins: 3 });
        if (newScore.player >= WIN_SCORE) {
          void applyReward({ gems: 1 });
        }
      }
    },
    [applyReward, state],
  );
  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "pick",
      playerStones: null,
      computerStones: null,
      playerGuess: null,
      computerGuess: null,
      round: prev.round + 1,
      message: "",
    }));
  }, []);

  // ── Дахин эхлэх ──
  const handleRestart = useCallback(() => {
    setState(INITIAL_STATE);
    sentRef.current = false;
    setRewardEvents([]);
    setSessionGain({ coins: 0, gems: 0 });
  }, []);

  useEffect(() => {
    if (sentRef.current) return;
    const playerWins = state.score.player >= WIN_SCORE;
    const computerWins = state.score.computer >= WIN_SCORE;
    if (!playerWins && !computerWins) return;
    sentRef.current = true;
    onComplete?.(playerWins ? "win" : "lose");
  }, [onComplete, state.score.computer, state.score.player]);

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
        {/* Тоглоомын талбайн доор нэмэлт гэрэл */}
        <pointLight position={[0, -0.2, 0]} intensity={0.34} color="#c8a030" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <GameScene state={state} burstActive={burstActive} />
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
        onPick={handlePick}
        onGuess={handleGuess}
        onNext={handleNext}
        onRestart={handleRestart}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
      />
    </div>
  );
}
