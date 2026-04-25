"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Sparkles } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

const R = 1.45;
const Y = -0.05;

const ANGLE = (i: number) => {
  const t = (i / 4 - 0.5) * 1.1;
  return t;
};

function CairnStone({
  i,
  active,
  dim,
}: {
  i: number;
  active: boolean;
  dim: boolean;
}) {
  const t = ANGLE(i);
  const x = Math.sin(t) * R;
  const z = Math.cos(t) * R * 0.75 - 0.35;
  const mesh = useRef<THREE.Mesh | null>(null);
  useFrame((_, dt) => {
    const o = mesh.current;
    if (!o) return;
    if (active) {
      o.scale.lerp(new THREE.Vector3(1.12, 1.18, 1.12), 1 - 0.18 ** 50);
    } else {
      o.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - 0.12 ** 30);
    }
  });
  return (
    <group position={[x, Y, z]}>
      <mesh
        ref={mesh}
        castShadow
        receiveShadow
        rotation={[0, i * 0.5, 0.1]}
        scale={1.05}
      >
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={dim ? "#1a1a1a" : active ? "#6a7a5a" : "#4a4e52"}
          roughness={0.88}
          metalness={0.15}
          emissive={active ? "#4a6a3a" : "#000000"}
          emissiveIntensity={active ? 0.55 : 0}
        />
      </mesh>
    </group>
  );
}

export function StoneCairnSceneCanvas({
  activeIndex,
  playing,
  dim,
}: {
  activeIndex: number | null;
  playing: boolean;
  dim: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.45, 2.4], fov: 48 }}
      shadows
      className="h-full w-full"
    >
      <color attach="background" args={["#06080a"]} />
      <fog attach="fog" args={["#06080a", 4, 18]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[1.2, 5, 2.5]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-1.2, 0.8, 0.2]} intensity={0.4} color="#5a6a8a" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#0e1210"
          roughness={0.95}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, -0.2]} receiveShadow>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial
          color="#0f1a12"
          roughness={0.92}
          emissive="#0a0f0a"
          emissiveIntensity={0.1}
        />
      </mesh>
      <Suspense fallback={null}>
        <Environment preset="dawn" />
        {playing ? (
          <Sparkles
            count={20}
            scale={[3, 1.2, 2.4]}
            position={[0, 0.5, 0.2]}
            size={0.4}
            speed={0.4}
            color="#c8a040"
            opacity={0.35}
          />
        ) : null}
        {Array.from({ length: 5 }).map((_, i) => (
          <CairnStone
            key={i}
            i={i}
            active={activeIndex === i}
            dim={dim}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
