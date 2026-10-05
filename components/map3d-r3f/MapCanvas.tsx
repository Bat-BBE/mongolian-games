"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, type ReactNode } from "react";
import { detectDeviceTier } from "./perf/deviceTier";
import { PERF_CONFIG } from "./perf/perfConfig";

export function MapCanvas({
  children,
  cameraPosition = [40, 35, 40],
  cameraFar = 2000,
}: {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  cameraFar?: number;
}) {
  const perf = useMemo(() => PERF_CONFIG[detectDeviceTier()], []);

  return (
    <Canvas
      shadows={perf.shadows}
      dpr={perf.dpr}
      gl={{ antialias: perf.antialias, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 1.2, far: cameraFar, position: cameraPosition }}
    >
      {children}
    </Canvas>
  );
}
