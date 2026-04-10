"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import ShagaiModel from "./shagaiModel";
import ShagaiUI from "./shagaiUI";
import GameHistory, { ThrowRecord } from "./gameHistory";
import { ShagaiSide, SHAgAI_SIDES } from "./shagai";

export type ShagaiGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.8,
    restitution: 0.2,
  }));
  return <mesh ref={ref as any} />;
}

function GameTable() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d0a06" roughness={1} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.002, 0]}
      >
        <circleGeometry args={[6, 72]} />
        <meshStandardMaterial color="#183018" roughness={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[5.95, 6.15, 72]} />
        <meshStandardMaterial
          color="#c8a030"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[5.5, 5.6, 72]} />
        <meshStandardMaterial color="#a07820" metalness={0.5} roughness={0.4} />
      </mesh>

      {[
        {
          pos: [6.5, 1.0, 0] as [number, number, number],
          args: [0.3, 2.0, 13] as [number, number, number],
        },
        {
          pos: [-6.5, 1.0, 0] as [number, number, number],
          args: [0.3, 2.0, 13] as [number, number, number],
        },
        {
          pos: [0, 1.0, 6.5] as [number, number, number],
          args: [13, 2.0, 0.3] as [number, number, number],
        },
        {
          pos: [0, 1.0, -6.5] as [number, number, number],
          args: [13, 2.0, 0.3] as [number, number, number],
        },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.args} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

export default function ShagaiGame(props: ShagaiGameProps) {
  const sentRef = useRef(false);
  const [result, setResult] = useState<ShagaiSide | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [throwCount, setThrowCount] = useState(0);
  const [history, setHistory] = useState<ThrowRecord[]>([]);
  const [score, setScore] = useState<Record<ShagaiSide, number>>({
    horse: 0,
    sheep: 0,
    goat: 0,
    camel: 0,
  });

  const handleThrow = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);
    setThrowCount((c) => c + 1);
  }, [isRolling]);

  const handleResult = useCallback((side: ShagaiSide) => {
    setResult(side);
    setIsRolling(false);
    setScore((prev) => ({ ...prev, [side]: prev[side] + 1 }));
    setHistory((prev) => [
      ...prev,
      { side, timestamp: new Date(), throwNumber: prev.length + 1 },
    ]);
  }, []);

  const handleLand = useCallback(() => {
    setIsRolling(false);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setHistory([]);
    setScore({ horse: 0, sheep: 0, goat: 0, camel: 0 });
    setThrowCount(0);
    sentRef.current = false;
  }, []);

  // MVP: after 5 completed throws, treat as a win.
  useEffect(() => {
    if (sentRef.current) return;
    const pct = Math.min(100, Math.round((history.length / 5) * 100));
    if (history.length >= 5) {
      sentRef.current = true;
      props.onComplete?.("win", pct);
    }
  }, [history.length, props]);

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
        camera={{ position: [0, 10, 14], fov: 50 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[6, 12, 6]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <pointLight position={[-5, 6, -5]} intensity={0.3} color="#ffd080" />
        <pointLight position={[5, 4, 5]} intensity={0.2} color="#c8d0ff" />

        <Suspense fallback={null}>
          <Environment preset="night" />

          <Physics
            gravity={[0, -14, 0]}
            defaultContactMaterial={{ friction: 0.7, restitution: 0.2 }}
          >
            {/* ✅ usePlane — зөв физикийн шал */}
            <PhysicsFloor />

            <GameTable />

            <ShagaiModel
              isThrown={isRolling}
              onResult={handleResult}
              onLand={handleLand}
            />
          </Physics>
        </Suspense>

        <OrbitControls
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={20}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      <ShagaiUI
        result={result ? SHAgAI_SIDES[result] : null}
        isRolling={isRolling}
        throwCount={throwCount}
        score={score}
        onThrow={handleThrow}
        onReset={handleReset}
      />

      <GameHistory history={history} />
    </div>
  );
}
