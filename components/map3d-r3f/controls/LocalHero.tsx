"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { terrainHeightFeet } from "@/components/dashboard/sceneHelpers";
import { loadHeroModel } from "@/components/map3d/heroFbx";
import type { HeroKinematic } from "./heroKinematic";

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/**
 * Ports useThreeScene.tsx's WASD/keyboard local-hero movement verbatim:
 * camera-relative velocity-smoothed walk, terrain-following height, yaw-lerp
 * facing. Deferred for a later pass (not core to camera/movement feel):
 * footstep audio, run/walk/idle animation-clip blending (plays whatever clip
 * loads first for now), virtual-joystick input, player-home collision push-out.
 */
export function LocalHero({
  modelPath,
  startPosition,
  kinematicRef,
}: {
  modelPath: string;
  startPosition: THREE.Vector3;
  kinematicRef: React.RefObject<HeroKinematic>;
}) {
  const { camera, scene } = useThree();
  const rootRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const velRef = useRef(new THREE.Vector3());
  const groundYRef = useRef<number | null>(null);
  const keysRef = useRef({ up: false, down: false, left: false, right: false, run: false });

  useEffect(() => {
    let cancelled = false;
    void loadHeroModel(modelPath).then(({ root, clips }) => {
      if (cancelled) return;
      root.position.copy(startPosition);
      scene.add(root);
      rootRef.current = root;
      if (clips.length > 0) {
        const mixer = new THREE.AnimationMixer(root);
        mixer.clipAction(clips[0]!).play();
        mixerRef.current = mixer;
      }
      kinematicRef.current.pos.copy(startPosition);
      kinematicRef.current.has = true;
    });
    return () => {
      cancelled = true;
      const root = rootRef.current;
      if (root) scene.remove(root);
      rootRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const st = keysRef.current;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") st.run = true;
      if (e.code === "KeyW" || e.key === "ArrowUp") st.up = true;
      if (e.code === "KeyS" || e.key === "ArrowDown") st.down = true;
      if (e.code === "KeyA" || e.key === "ArrowLeft") st.left = true;
      if (e.code === "KeyD" || e.key === "ArrowRight") st.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const st = keysRef.current;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") st.run = false;
      if (e.code === "KeyW" || e.key === "ArrowUp") st.up = false;
      if (e.code === "KeyS" || e.key === "ArrowDown") st.down = false;
      if (e.code === "KeyA" || e.key === "ArrowLeft") st.left = false;
      if (e.code === "KeyD" || e.key === "ArrowRight") st.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_state, delta) => {
    const root = rootRef.current;
    mixerRef.current?.update(delta);
    if (!root) return;

    const st = keysRef.current;
    const mvxKeys = (st.right ? 1 : 0) - (st.left ? 1 : 0);
    const mvzKeys = (st.up ? 1 : 0) - (st.down ? 1 : 0);
    let mvx = mvxKeys;
    let mvz = mvzKeys;
    let klenInput = Math.hypot(mvx, mvz);
    if (klenInput > 1) {
      mvx /= klenInput;
      mvz /= klenInput;
      klenInput = 1;
    }

    const kin = kinematicRef.current;
    const hv = velRef.current;

    if (klenInput <= 0.01) {
      hv.multiplyScalar(Math.exp(-20 * delta));
      if (hv.lengthSq() < 0.2) hv.set(0, 0, 0);
      kin.moving = false;
    } else {
      const runS = st.run ? 1 : 0;
      const baseSpeed = 8.5 + runS * 7.5;
      const localDir = new THREE.Vector3(mvx, 0, mvz);
      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      if (camForward.lengthSq() < 1e-8) camForward.set(0, 0, 1);
      camForward.normalize();
      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();
      const worldDir = new THREE.Vector3()
        .addScaledVector(camRight, localDir.x)
        .addScaledVector(camForward, localDir.z)
        .normalize();

      const desiredVel = worldDir.clone().multiplyScalar(baseSpeed);
      const velRate = 12 + runS * 5;
      const velBlend = 1 - Math.exp(-velRate * delta);
      hv.lerp(desiredVel, velBlend);
      root.position.addScaledVector(hv, delta);
      root.position.x = clamp(root.position.x, -5600, 5600);
      root.position.z = clamp(root.position.z, -4700, 4700);

      const rawG = terrainHeightFeet(root.position.x, root.position.z, root.rotation.y);
      const targetY = rawG + 0.02;
      const prev = groundYRef.current;
      const gy = prev == null ? targetY : prev + (targetY - prev) * (1 - Math.exp(-14 * delta));
      groundYRef.current = gy;
      root.position.y = gy;

      const targetYaw = Math.atan2(worldDir.x, worldDir.z);
      let dy = targetYaw - root.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      root.rotation.y += dy * (1 - Math.exp(-14 * delta));

      kin.moving = true;
      kin.followUntil = performance.now() + 120;
    }

    kin.pos.copy(root.position);
    kin.ry = root.rotation.y;
    kin.has = true;
  });

  return null;
}
