"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function WDie({
  spinning,
  basePhase,
  offset,
}: {
  spinning: boolean;
  basePhase: number;
  offset: number;
}) {
  const g = useRef<THREE.Group | null>(null);
  useFrame((_, dt) => {
    const o = g.current;
    if (!o) return;
    if (spinning) {
      o.rotation.x += dt * (7 + offset * 0.3);
      o.rotation.y += dt * (5.5 - offset * 0.1);
      o.rotation.z += dt * 3.2;
    } else {
      o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, 0, 1 - 0.12 ** 40);
      o.rotation.y = THREE.MathUtils.lerp(
        o.rotation.y,
        basePhase + offset,
        1 - 0.12 ** 40,
      );
      o.rotation.z = THREE.MathUtils.lerp(o.rotation.z, 0, 1 - 0.12 ** 40);
    }
  });
  return (
    <group ref={g}>
      <RoundedBox
        args={[0.48, 0.48, 0.48]}
        radius={0.06}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#4a2f18"
          roughness={0.78}
          metalness={0.08}
        />
      </RoundedBox>
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.5]} />
        <meshStandardMaterial color="#2d1a0c" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FeltField() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#0d1410" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[3.2, 1.4]} />
        <meshStandardMaterial
          color="#1e2a1a"
          roughness={0.95}
          emissive="#0a1008"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
}

function CupTriples({ leftSpin, rightSpin }: { leftSpin: boolean; rightSpin: boolean }) {
  const p: [number, number, number][] = [
    [-0.9, 0, 0.15],
    [-0.9, 0, -0.15],
    [-0.55, 0, 0],
  ];
  const q: [number, number, number][] = [
    [0.55, 0, 0],
    [0.9, 0, 0.15],
    [0.9, 0, -0.15],
  ];
  return (
    <group>
      {p.map((pos, i) => (
        <group key={i} position={pos}>
          <WDie spinning={leftSpin} basePhase={0.2 * i} offset={i * 0.2} />
        </group>
      ))}
      {q.map((pos, i) => (
        <group key={`r${i}`} position={pos}>
          <WDie
            spinning={rightSpin}
            basePhase={0.15 * i + 0.4}
            offset={i * 0.15 + 1}
          />
        </group>
      ))}
    </group>
  );
}

export function WoodenDiceSceneCanvas({ spin }: { spin: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 3.1], fov: 50 }}
      shadows
      className="h-full w-full"
    >
      <color attach="background" args={["#060805"]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[2.5, 6, 3]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-2, 1.2, 1]} intensity={0.4} color="#c8a030" />
      <FeltField />
      <Suspense fallback={null}>
        <Environment preset="night" />
        <CupTriples leftSpin={spin} rightSpin={spin} />
      </Suspense>
    </Canvas>
  );
}
