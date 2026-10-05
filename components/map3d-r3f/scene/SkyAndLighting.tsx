"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { SceneBuilder } from "@/components/dashboard/SceneBuilder";
import { MAP_SCENE, MAP_PERF_SHADOW_MAP } from "@/components/dashboard/mapConstants";

const SUN_RADIUS = 280;
const SUN_HEIGHT_FACTOR = 0.7;
/**
 * Shadow frustum tightened from the old flat ±3200 box (coarse texel density
 * for the cost paid) to a volume sized for what's actually near the camera.
 */
const SHADOW_HALF_EXTENT = 160;

export function SkyAndLighting({
  sunAngle = Math.PI * 0.5,
  shadows = true,
  shadowMapSize = MAP_PERF_SHADOW_MAP,
}: {
  sunAngle?: number;
  shadows?: boolean;
  shadowMapSize?: number;
}) {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(MAP_SCENE.background);
    scene.fog = new THREE.FogExp2(MAP_SCENE.fog, MAP_SCENE.fogDensity);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const sky = useMemo(() => {
    const scratch = new THREE.Scene();
    const builder = new SceneBuilder(scratch, "home", [], null) as unknown as {
      buildSky: () => void;
    };
    builder.buildSky();
    const mesh = scratch.children[0] ?? null;
    if (mesh) scratch.remove(mesh);
    return mesh;
  }, []);

  const sunPos: [number, number, number] = useMemo(
    () => [
      Math.cos(sunAngle) * SUN_RADIUS,
      Math.abs(Math.sin(sunAngle)) * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20,
      -60,
    ],
    [sunAngle],
  );

  return (
    <>
      {sky && <primitive object={sky} />}
      <directionalLight
        color={MAP_SCENE.sun}
        intensity={MAP_SCENE.sunInt}
        position={sunPos}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-radius={2.8}
        shadow-bias={-0.00028}
        shadow-normalBias={0.025}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-SHADOW_HALF_EXTENT}
        shadow-camera-right={SHADOW_HALF_EXTENT}
        shadow-camera-top={SHADOW_HALF_EXTENT}
        shadow-camera-bottom={-SHADOW_HALF_EXTENT}
      />
      <ambientLight color={MAP_SCENE.ambient} intensity={MAP_SCENE.ambientInt} />
      <directionalLight
        color={MAP_SCENE.fill}
        intensity={MAP_SCENE.fillInt}
        position={[-60, 40, -30]}
      />
      <directionalLight
        color={MAP_SCENE.back}
        intensity={MAP_SCENE.backInt}
        position={[15, 10, 100]}
      />
      <hemisphereLight
        color={MAP_SCENE.hemiSky}
        groundColor={MAP_SCENE.hemiGround}
        intensity={MAP_SCENE.hemiInt}
      />
    </>
  );
}
