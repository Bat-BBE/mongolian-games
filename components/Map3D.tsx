"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense } from "react";

export default function Map3D() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Suspense fallback={null}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#9D7D3D" />
        </mesh>
      </Suspense>
      <OrbitControls enableZoom={true} />
      <Stars />
    </Canvas>
  );
}
