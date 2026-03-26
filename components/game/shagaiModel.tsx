"use client";

import { useRef, useEffect } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShagaiSide } from "./shagai";

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
  const meshRef = useRef<THREE.Mesh>(null);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const settleRef = useRef(0);
  const reportedRef = useRef(false);

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
    if (!isThrown) return;
    
    reportedRef.current = false;
    settleRef.current = 0;

    api.velocity.set((Math.random() - 0.5) * 6, 6, (Math.random() - 0.5) * 6);
    api.angularVelocity.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
  }, [isThrown, api]);

  useFrame((_, delta) => {
    if (!meshRef.current || reportedRef.current) return;

    const speed = Math.sqrt(
      velRef.current[0] ** 2 +
      velRef.current[1] ** 2 +
      velRef.current[2] ** 2
    );

    if (speed < 0.1) {
      settleRef.current += delta;
      if (settleRef.current > 0.5) {
        reportedRef.current = true;
        const side = detectShagaiSide(meshRef.current.rotation.x, meshRef.current.rotation.z);
        onLand();
        onResult(side);
      }
    } else {
      settleRef.current = 0;
    }
  });

  return (
    <mesh
      ref={(node) => {
        if (node) {
          (ref as any).current = node;
          meshRef.current = node;
        }
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.2, 0.8, 1.8]} />
      <meshStandardMaterial color="#f0e6d2" roughness={0.6} />
    </mesh>
  );
}