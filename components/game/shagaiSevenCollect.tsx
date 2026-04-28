"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { smoothStep } from "./shagaiSevenPathAnim";

const DURATION_SEC = 0.58;

type Props = {
  active: boolean;
  pieceId: number;
  start: [number, number, number];
  kinematicRef: MutableRefObject<
    Record<number, [number, number, number] | null>
  >;
  onComplete: () => void;
};

export function SevenCollectAnimator({
  active,
  pieceId,
  start,
  kinematicRef,
  onComplete,
}: Props) {
  const t0 = useRef<number | null>(null);
  const done = useRef(false);

  useFrame((state) => {
    if (!active) {
      t0.current = null;
      done.current = false;
      return;
    }

    if (t0.current === null) {
      t0.current = state.clock.elapsedTime;
      done.current = false;
    }

    const elapsed = state.clock.elapsedTime - t0.current;
    let u = Math.min(1, elapsed / DURATION_SEC);
    u = smoothStep(u);
    const rise = 3.6;
    const towardCam = 1.35;
    const side = 0.45;
    kinematicRef.current[pieceId] = [
      start[0] + towardCam * u,
      start[1] + rise * u,
      start[2] - side * u,
    ];

    if (u >= 1 && !done.current) {
      done.current = true;
      kinematicRef.current[pieceId] = null;
      t0.current = null;
      onComplete();
    }
  });

  return null;
}
