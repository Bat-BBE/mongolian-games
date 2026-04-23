"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const MIN_STEP = 0.035;

const PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
const RAY_TARGET = new THREE.Vector3();
const NDC = new THREE.Vector2();

export function SevenPathLine({ points }: { points: [number, number][] }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    if (points.length < 2) return g;
    g.setFromPoints(
      points.map(([x, z]) => new THREE.Vector3(x, 0.08, z)),
    );
    return g;
  }, [points]);
  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: "#f0d060" });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    return line;
  }, [geo]);
  if (points.length < 2) return null;
  return <primitive object={lineObj} />;
}

export type SevenPathDrawLayerProps = {
  enabled: boolean;
  points: [number, number][];
  onPathStart: (xz: [number, number]) => void;
  onPathAppend: (xz: [number, number]) => void;
  onDraggingChange: (dragging: boolean) => void;
};

/**
 * Canvas дээр зааж чирэхэд камерын туяагаар ширэн (Y≈0.06) дээр огцолж зам зурна.
 * 3D шагайн mesh raycast-ийг орхино.
 */
export function SevenPathDrawLayer({
  enabled,
  points,
  onPathStart,
  onPathAppend,
  onDraggingChange,
}: SevenPathDrawLayerProps) {
  const { camera, gl } = useThree();
  const draggingRef = useRef(false);
  const lastEmitRef = useRef<[number, number] | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());

  const intersectMat = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const rect = gl.domElement.getBoundingClientRect();
      NDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      NDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = raycasterRef.current;
      raycaster.setFromCamera(NDC, camera);
      const hit = raycaster.ray.intersectPlane(PLANE, RAY_TARGET);
      if (!hit) return null;
      return [RAY_TARGET.x, RAY_TARGET.z];
    },
    [camera, gl],
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    lastEmitRef.current = null;
    onDraggingChange(false);
  }, [onDraggingChange]);

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const opts: AddEventListenerOptions = { capture: true };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const xz = intersectMat(e.clientX, e.clientY);
      if (!xz) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      onDraggingChange(true);
      lastEmitRef.current = xz;
      onPathStart(xz);
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const xz = intersectMat(e.clientX, e.clientY);
      if (!xz) return;
      e.preventDefault();
      e.stopPropagation();
      const last = lastEmitRef.current;
      if (last && Math.hypot(xz[0] - last[0], xz[1] - last[1]) < MIN_STEP) {
        return;
      }
      lastEmitRef.current = xz;
      onPathAppend(xz);
    };

    const onUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      endDrag();
    };

    el.addEventListener("pointerdown", onDown, opts);
    el.addEventListener("pointermove", onMove, opts);
    el.addEventListener("pointerup", onUp, opts);
    el.addEventListener("pointercancel", onUp, opts);
    window.addEventListener("pointerup", onUp, opts);
    window.addEventListener("pointercancel", onUp, opts);

    return () => {
      el.removeEventListener("pointerdown", onDown, opts);
      el.removeEventListener("pointermove", onMove, opts);
      el.removeEventListener("pointerup", onUp, opts);
      el.removeEventListener("pointercancel", onUp, opts);
      window.removeEventListener("pointerup", onUp, opts);
      window.removeEventListener("pointercancel", onUp, opts);
      draggingRef.current = false;
      lastEmitRef.current = null;
      onDraggingChange(false);
    };
  }, [
    enabled,
    endDrag,
    gl,
    intersectMat,
    onDraggingChange,
    onPathAppend,
    onPathStart,
  ]);

  return <SevenPathLine points={points} />;
}
