"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MapPresencePeer } from "@/hooks/useMapPresence";

/** Dev-only stand-in for useMapPresence — generates N fake peers scattered at
 * various distances (to stress the RemotePeersLayer cap/cull) and nudges their
 * position every frame, to prove avatars read live data from the ref and not
 * from a stale snapshot. */
export function MockPeers({
  count,
  centerX,
  centerZ,
  remotePeersRef,
}: {
  count: number;
  centerX: number;
  centerZ: number;
  remotePeersRef: React.RefObject<MapPresencePeer[]>;
}) {
  const tRef = useRef(0);
  const seedRef = useRef<{ angle: number; radius: number }[] | null>(null);

  useEffect(() => {
    seedRef.current = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 20 + (i % 8) * 25,
    }));
  }, [count]);

  useFrame((_state, delta) => {
    tRef.current += delta;
    const seeds = seedRef.current;
    if (!seeds) return;
    remotePeersRef.current = seeds.map((s, i) => {
      const angle = s.angle + tRef.current * 0.1;
      const x = centerX + Math.cos(angle) * s.radius;
      const z = centerZ + Math.sin(angle) * s.radius;
      return {
        id: `mock-${i}`,
        displayName: `Mock ${i}`,
        heroModelPath: i % 2 === 0 ? "/models/hero1.glb" : "/models/hero3.glb",
        homeKey: "",
        x,
        z,
        ry: angle,
        gerLevel: 1,
        livestock: { sheep: 0, goat: 0, cow: 0, horse: 0, camel: 0 },
        emote: "",
        emoteGen: 0,
      } satisfies MapPresencePeer;
    });
  });

  return null;
}
