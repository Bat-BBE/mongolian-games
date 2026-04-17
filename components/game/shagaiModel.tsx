"use client";

import { useRef, useEffect } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShagaiSide } from "./shagai";
import { useGLTF } from "@react-three/drei";

interface ShagaiModelProps {
  onResult: (side: ShagaiSide) => void;
  isThrown: boolean;
  onLand: () => void;
}

function detectShagaiSide(rotX: number, rotZ: number): ShagaiSide {
  const rx = Math.abs(rotX % Math.PI);
  const rz = Math.abs(rotZ % Math.PI);
  
  if (rx < 0.5 && rz < 0.5) return "horse";
  if (rx > 2.6 && rz < 0.5) return "camel";
  if (rz > 2.6 && rx < 0.5) return "sheep";
  return "goat";
}

export default function ShagaiModel({ onResult, isThrown, onLand }: ShagaiModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const settleRef = useRef(0);
  const reportedRef = useRef(false);

  const gltf = useGLTF("/models/shagai_approx.glb");

  const [ref, api] = useBox(() => ({
    mass: 0.6,
    position: [0, 5, 0],
    args: [1.2, 0.8, 1.8],
    restitution: 0.22,
    friction: 0.8,
    linearDamping: 0.28,
    angularDamping: 0.22,
  }));

  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => { velRef.current = v; });
    return unsub;
  }, [api]);

  useEffect(() => {
    const scene = (gltf as unknown as { scene?: THREE.Object3D }).scene;
    if (!scene) return;
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        // Slight polish for PBR under strong lighting.
        const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const mm of mats) {
          if (mm && "roughness" in mm) {
            mm.roughness = Math.min(0.9, Math.max(0.35, mm.roughness ?? 0.6));
            mm.metalness = Math.min(0.25, Math.max(0.0, mm.metalness ?? 0.05));
            (mm as THREE.MeshStandardMaterial).envMapIntensity =
              (mm as THREE.MeshStandardMaterial).envMapIntensity ?? 0.45;
            mm.needsUpdate = true;
          }
        }
      }
    });
  }, [gltf]);

  useEffect(() => {
    if (!isThrown) return;
    
    reportedRef.current = false;
    settleRef.current = 0;

    api.velocity.set((Math.random() - 0.5) * 6, 6, (Math.random() - 0.5) * 6);
    api.angularVelocity.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
  }, [isThrown, api]);

  useFrame((_, delta) => {
    if (!groupRef.current || reportedRef.current) return;

    const speed = Math.sqrt(
      velRef.current[0] ** 2 +
      velRef.current[1] ** 2 +
      velRef.current[2] ** 2
    );

    if (speed < 0.1) {
      settleRef.current += delta;
      if (settleRef.current > 0.5) {
        reportedRef.current = true;
        const side = detectShagaiSide(
          groupRef.current.rotation.x,
          groupRef.current.rotation.z,
        );
        onLand();
        onResult(side);
      }
    } else {
      settleRef.current = 0;
    }
  });

  return (
    <group
      ref={(node) => {
        if (node) {
          (ref as any).current = node;
          groupRef.current = node;
        }
      }}
    >
      {/* Physics collider (invisible). Keep stable even if model changes. */}
      <mesh visible={false}>
        <boxGeometry args={[1.2, 0.8, 1.8]} />
        <meshStandardMaterial />
      </mesh>

      {/* Visual model */}
      <primitive
        object={(gltf as any).scene}
        // Heuristic fit for the current physics box.
        scale={0.95}
        rotation={[0, Math.PI / 2, 0]}
        position={[0, -0.08, 0]}
      />
    </group>
  );
}

useGLTF.preload("/models/shagai_approx.glb");