"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { samplePath3DAt, smoothStep } from "./shagaiSevenPathAnim";
import { buildPairKnockBursts, type KnockBurst } from "./shagaiSevenKnock";

const DURATION_SEC = 1.15;

type Props = {
  active: boolean;
  fromId: number;
  toId: number;
  fromPos: [number, number, number];
  toPos: [number, number, number];
  pathWorld: [number, number, number][];
  kinematicRef: MutableRefObject<
    Record<number, [number, number, number] | null>
  >;
  knockBurstRef: MutableRefObject<Record<number, KnockBurst | undefined>>;
  onComplete: () => void;
};

export function SevenPairPathAnimator({
  active,
  fromId,
  toId,
  fromPos,
  toPos,
  pathWorld,
  kinematicRef,
  knockBurstRef,
  onComplete,
}: Props) {
  const t0 = useRef<number | null>(null);
  const completed = useRef(false);

  useFrame((state) => {
    if (!active) {
      if (t0.current !== null) {
        kinematicRef.current[fromId] = null;
      }
      t0.current = null;
      completed.current = false;
      return;
    }

    if (pathWorld.length < 2) return;

    if (t0.current === null) {
      t0.current = state.clock.elapsedTime;
      completed.current = false;
    }

    const elapsed = state.clock.elapsedTime - t0.current;
    let u = Math.min(1, elapsed / DURATION_SEC);
    u = smoothStep(u);
    const pos = samplePath3DAt(pathWorld, u);
    kinematicRef.current[fromId] = pos;

    if (u >= 1 && !completed.current) {
      completed.current = true;
      kinematicRef.current[fromId] = null;
      const bursts = buildPairKnockBursts(fromId, toId, fromPos, toPos);
      for (const [idStr, b] of Object.entries(bursts)) {
        knockBurstRef.current[Number(idStr)] = b;
      }
      t0.current = null;
      onComplete();
    }
  });

  return null;
}
