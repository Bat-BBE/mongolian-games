"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SingleShagai from "./singleShagai";
import FourBonesUI from "./fourBonusUI";
import {
  GameState,
  INITIAL_STATE,
  ShagaiSide,
  isDorvenBerkh,
} from "./fourBonusType";

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as any} />;
}

//game table
function GameTable() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#090705" roughness={1} />
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
        [-3, 0, -2],
        [3, 0, -2],
        [-3, 0, 2],
        [3, 0, 2],
      ].map(([x, , z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.009, z]}>
          <circleGeometry args={[0.12, 8]} />
          <meshStandardMaterial
            color="#c8a030"
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      ))}

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
    Array.from({ length: 30 }, (_, i) => ({
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
      const p = particles.current[i];
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

const START_POSITIONS: [number, number, number][] = [
  [-1.5, 4.5, -0.8],
  [-0.5, 5.0, 0.2],
  [0.5, 5.5, -0.3],
  [1.5, 4.8, 0.7],
];

function getThrowParams(i: number): {
  vel: [number, number, number];
  angVel: [number, number, number];
} {
  const spread = 2.5;
  return {
    vel: [
      (Math.random() - 0.5) * spread * 2,
      6 + Math.random() * 4,
      (Math.random() - 0.5) * spread * 2,
    ] as [number, number, number],
    angVel: [
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 22,
    ] as [number, number, number],
  };
}

interface SceneProps {
  state: GameState;
  throwParams: {
    vel: [number, number, number];
    angVel: [number, number, number];
  }[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  isWin: boolean;
}

function GameScene({
  state,
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  isWin,
}: SceneProps) {
  const allDone = settledSides.every((s) => s !== null);

  return (
    <>
      <GameTable />
      <WinLightEffect active={isWin} />
      <GoldParticles active={isWin} />

      {[0, 1, 2, 3].map((i) => (
        <SingleShagai
          key={i}
          id={i}
          startPos={START_POSITIONS[i]}
          throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
          throwAngVel={throwParams[i]?.angVel ?? [5, 5, 5]}
          isThrown={isThrown}
          onSettle={onSettle}
          highlight={isWin && allDone}
          resultSide={settledSides[i]}
        />
      ))}
    </>
  );
}

export default function FourBonesGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState<
    ReturnType<typeof getThrowParams>[]
  >([0, 1, 2, 3].map((i) => getThrowParams(i)));
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultSentRef = useRef(false);
  const isWin =
    state.phase === "result" &&
    state.history.length > 0 &&
    state.history[state.history.length - 1].isDorvenBerkh;

  const handleThrow = useCallback(() => {
    if (state.phase === "throwing" || state.phase === "settling") return;

    const params = [0, 1, 2, 3].map((i) => getThrowParams(i));
    setThrowParams(params);
    settledRef.current = [null, null, null, null];
    settledCount.current = 0;
    resultSentRef.current = false;
    setSettledSides([null, null, null, null]);

    setState((prev) => ({
      ...prev,
      phase: "throwing",
      throws: [],
      totalThrows: prev.totalThrows + 1,
    }));

    setIsThrown(false);
    setTimeout(() => setIsThrown(true), 50);
  }, [state.phase]);

  const handleSettle = useCallback((id: number, side: ShagaiSide) => {
    if (settledRef.current[id] !== null) return;

    settledRef.current[id] = side;
    settledCount.current += 1;

    setSettledSides([...settledRef.current]);
    setState((prev) => ({ ...prev, phase: "settling" }));

    if (settledCount.current >= 4 && !resultSentRef.current) {
      resultSentRef.current = true;

      setTimeout(() => {
        const sides = settledRef.current.filter(Boolean) as ShagaiSide[];
        const win = isDorvenBerkh(sides);

        setState((prev) => ({
          ...prev,
          phase: "result",
          history: [
            ...prev.history,
            { sides, isDorvenBerkh: win, throwNumber: prev.totalThrows },
          ],
          wins: prev.wins + (win ? 1 : 0),
          streak: win ? prev.streak + 1 : 0,
          bestStreak: win
            ? Math.max(prev.bestStreak, prev.streak + 1)
            : prev.bestStreak,
        }));
      }, 500);
    }
  }, []);

  const handleReset = useCallback(() => {
    setState(INITIAL_STATE);
    setSettledSides([null, null, null, null]);
    settledCount.current = 0;
    setIsThrown(false);
  }, []);

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
            defaultContactMaterial={{ friction: 0.75, restitution: 0.18 }}
          >
            <PhysicsFloor />
            <GameScene
              state={state}
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

      <FourBonesUI
        state={state}
        onThrow={handleThrow}
        onReset={handleReset}
        settledSides={settledSides}
      />
    </div>
  );
}
