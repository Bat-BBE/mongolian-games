"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { terrainHeight } from "@/components/dashboard/sceneHelpers";
import type { HeroKinematic } from "./heroKinematic";

/**
 * Ports useThreeScene.tsx's REAL camera rig verbatim (not AnimationController.ts,
 * which turns out to be dead code — its onDown/onMove/etc. handlers only attach
 * `if (!onBeforeRender)`, and useThreeScene always supplies onBeforeRender).
 *
 * This is a velocity-damped spherical orbit (theta/phi/distance) around a
 * look-at point that itself smoothly follows the hero while moving. All the
 * constants below (rotSpeed 0.0043/0.0046, velocity decay 0.86/0.84/0.82,
 * smoothing rates 9/18/24/45, CAMERA_LIMITS) are copied as-is — do not "clean
 * up" this math, see Phase 5 plan notes.
 */

const CAMERA_LIMITS = {
  minPhi: 0.16,
  maxPhi: 1.2,
  minDist: 14,
  maxDist: 460,
};

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

const shortestAngleDelta = (from: number, to: number): number =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

export type CameraTarget = {
  lookAt: THREE.Vector3;
  distance: number;
  phi: number;
  theta: number;
};

export type FlyToStation = (target: CameraTarget, snap?: boolean) => void;

export function MapCameraRig({
  initialTarget,
  heroKinematicRef,
  onReady,
}: {
  initialTarget: CameraTarget;
  heroKinematicRef?: React.RefObject<HeroKinematic>;
  onReady?: (flyTo: FlyToStation) => void;
}) {
  const { camera, gl } = useThree();

  const stateRef = useRef({
    currentLook: initialTarget.lookAt.clone(),
    currentDist: initialTarget.distance,
    currentPhi: initialTarget.phi,
    currentTheta: initialTarget.theta,
    targetLook: initialTarget.lookAt.clone(),
    targetDist: initialTarget.distance,
    targetPhi: initialTarget.phi,
    targetTheta: initialTarget.theta,
    thetaVel: 0,
    phiVel: 0,
    distVel: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });
  const heroCamPivotSmoothedRef = useRef<THREE.Vector3 | null>(null);
  const cameraFloorSmoothedRef = useRef<number | null>(null);

  useEffect(() => {
    const flyTo: FlyToStation = (target, snap = false) => {
      const s = stateRef.current;
      s.targetLook.copy(target.lookAt);
      s.targetDist = target.distance;
      s.targetPhi = target.phi;
      s.targetTheta = target.theta;
      if (snap) {
        s.currentLook.copy(target.lookAt);
        s.currentDist = target.distance;
        s.currentPhi = target.phi;
        s.currentTheta = target.theta;
        s.thetaVel = 0;
        s.phiVel = 0;
        s.distVel = 0;
        cameraFloorSmoothedRef.current = null;
        heroCamPivotSmoothedRef.current = null;
      }
    };
    onReady?.(flyTo);
  }, [onReady]);

  useEffect(() => {
    const el = gl.domElement;
    const s = stateRef.current;

    const onMouseDown = (e: MouseEvent) => {
      s.isDragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const onMouseUp = () => {
      s.isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!s.isDragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      const rotSpeed = 0.0043;
      s.targetTheta -= dx * rotSpeed;
      s.targetPhi = clamp(s.targetPhi - dy * rotSpeed, CAMERA_LIMITS.minPhi, CAMERA_LIMITS.maxPhi);
      s.thetaVel = -dx * rotSpeed * 0.25;
      s.phiVel = -dy * rotSpeed * 0.2;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      s.targetDist = clamp(s.targetDist + e.deltaY * 0.12, CAMERA_LIMITS.minDist, CAMERA_LIMITS.maxDist);
      s.distVel += e.deltaY * 0.0009;
      e.preventDefault();
    };

    let lastTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        s.isDragging = true;
        s.lastX = e.touches[0]!.clientX;
        s.lastY = e.touches[0]!.clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && s.isDragging) {
        const dx = e.touches[0]!.clientX - s.lastX;
        const dy = e.touches[0]!.clientY - s.lastY;
        const rotSpeed = 0.0046;
        s.targetTheta -= dx * rotSpeed;
        s.targetPhi = clamp(s.targetPhi - dy * rotSpeed, CAMERA_LIMITS.minPhi, CAMERA_LIMITS.maxPhi);
        s.thetaVel = -dx * rotSpeed * 0.22;
        s.phiVel = -dy * rotSpeed * 0.2;
        s.lastX = e.touches[0]!.clientX;
        s.lastY = e.touches[0]!.clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const d = Math.sqrt(dx * dx + dy * dy);
        s.targetDist = clamp(s.targetDist - (d - lastTouchDist) * 0.27, CAMERA_LIMITS.minDist, CAMERA_LIMITS.maxDist);
        s.distVel += -(d - lastTouchDist) * 0.001;
        lastTouchDist = d;
      }
    };
    const onTouchEnd = () => {
      s.isDragging = false;
    };

    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [gl]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.06);
    const s = stateRef.current;

    const kin = heroKinematicRef?.current;
    const klenInput = kin?.moving ? 1 : 0;
    let followSmooth = s.isDragging ? 18 : 9;

    if (kin?.has) {
      const followingWindow = kin.followUntil > performance.now();
      if (kin.moving || followingWindow) {
        const tx = kin.pos.x;
        const tz = kin.pos.z;
        const eyeY = terrainHeight(tx, tz) + 2.35;
        let p = heroCamPivotSmoothedRef.current;
        if (!p) {
          p = new THREE.Vector3(tx, eyeY, tz);
          heroCamPivotSmoothedRef.current = p;
        } else {
          const pivotRate = kin.moving ? 55 : 40;
          const a = 1 - Math.exp(-pivotRate * dt);
          p.x += (tx - p.x) * a;
          p.y += (eyeY - p.y) * a;
          p.z += (tz - p.z) * a;
        }
        s.targetLook.copy(p);
        if (kin.moving) s.currentLook.copy(p);
        followSmooth = s.isDragging ? 24 : 50;
      }
    }

    const smoothPos = 1 - Math.exp(-followSmooth * dt);
    const smoothRot = 1 - Math.exp(-(s.isDragging ? 22 : 11) * dt);

    s.targetTheta += s.thetaVel;
    while (s.targetTheta > Math.PI) s.targetTheta -= Math.PI * 2;
    while (s.targetTheta < -Math.PI) s.targetTheta += Math.PI * 2;
    s.targetPhi = clamp(s.targetPhi + s.phiVel, CAMERA_LIMITS.minPhi, CAMERA_LIMITS.maxPhi);
    s.targetDist = clamp(s.targetDist + s.distVel, CAMERA_LIMITS.minDist, CAMERA_LIMITS.maxDist);

    s.thetaVel *= 0.86;
    s.phiVel *= 0.84;
    s.distVel *= 0.82;

    s.currentLook.lerp(s.targetLook, smoothPos);
    s.currentDist += (s.targetDist - s.currentDist) * smoothPos;
    s.currentPhi += (s.targetPhi - s.currentPhi) * smoothRot;
    s.currentTheta += shortestAngleDelta(s.currentTheta, s.targetTheta) * smoothRot;
    s.currentPhi = clamp(s.currentPhi, CAMERA_LIMITS.minPhi, CAMERA_LIMITS.maxPhi);

    const finalPos = new THREE.Vector3(
      s.currentLook.x + Math.sin(s.currentTheta) * Math.cos(s.currentPhi) * s.currentDist,
      s.currentLook.y + Math.sin(s.currentPhi) * s.currentDist,
      s.currentLook.z + Math.cos(s.currentTheta) * Math.cos(s.currentPhi) * s.currentDist,
    );
    const floorRaw = terrainHeight(finalPos.x, finalPos.z) + 2.55;
    const prevF = cameraFloorSmoothedRef.current;
    const floorBlend = klenInput > 0 ? 6.5 : 9;
    const floorY = prevF == null ? floorRaw : prevF + (floorRaw - prevF) * (1 - Math.exp(-floorBlend * dt));
    cameraFloorSmoothedRef.current = floorY;
    if (finalPos.y < floorY) finalPos.y = floorY;

    camera.position.copy(finalPos);
    camera.lookAt(s.currentLook);
  });

  return null;
}
