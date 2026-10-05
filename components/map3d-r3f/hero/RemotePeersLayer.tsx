"use client";

import { useEffect, useRef, useState } from "react";
import { RemotePeerAvatar } from "./RemotePeerAvatar";
import { detectDeviceTier } from "../perf/deviceTier";
import { PERF_CONFIG } from "../perf/perfConfig";
import type { MapPresencePeer } from "@/hooks/useMapPresence";
import type { HeroKinematic } from "../controls/heroKinematic";

const MEMBERSHIP_CHECK_MS = 600;
const NEAR_DISTANCE = 120;

/**
 * Owns peer membership (mount/unmount) at low frequency — NOT driven by the
 * network-cadence remotePeersRef itself, which stays a ref read directly by
 * each RemotePeerAvatar's own useFrame. Re-rendering this layer on every pose
 * packet would reintroduce the exact perf problem the whole rewrite exists to
 * fix, so membership is diffed on a timer instead of every frame/every packet.
 */
export function RemotePeersLayer({
  remotePeersRef,
  heroKinematicRef,
}: {
  remotePeersRef: React.RefObject<MapPresencePeer[]>;
  heroKinematicRef?: React.RefObject<HeroKinematic>;
}) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [nearIds, setNearIds] = useState<Set<string>>(new Set());
  const maxPeersRef = useRef(PERF_CONFIG[detectDeviceTier()].maxRemotePeers);

  useEffect(() => {
    const tick = () => {
      const peers = remotePeersRef.current;
      const myPos = heroKinematicRef?.current;
      const withDist = peers.map((p) => {
        const dx = myPos ? p.x - myPos.pos.x : 0;
        const dz = myPos ? p.z - myPos.pos.z : 0;
        return { peer: p, dist: Math.hypot(dx, dz) };
      });
      withDist.sort((a, b) => a.dist - b.dist);
      const kept = withDist.slice(0, maxPeersRef.current);

      setVisibleIds((prev) => {
        const next = kept.map((k) => k.peer.id);
        if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
          return prev;
        }
        return next;
      });
      setNearIds(new Set(kept.filter((k) => k.dist <= NEAR_DISTANCE).map((k) => k.peer.id)));
    };

    tick();
    const interval = setInterval(tick, MEMBERSHIP_CHECK_MS);
    return () => clearInterval(interval);
  }, [remotePeersRef, heroKinematicRef]);

  return (
    <>
      {visibleIds.map((id) => (
        <RemotePeerAvatar
          key={id}
          peerId={id}
          remotePeersRef={remotePeersRef}
          throttled={!nearIds.has(id)}
        />
      ))}
    </>
  );
}
