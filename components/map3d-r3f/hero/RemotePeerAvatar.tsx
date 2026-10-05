"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { loadHeroModel } from "@/components/map3d/heroFbx";
import { terrainHeight } from "@/components/dashboard/sceneHelpers";
import type { MapPresencePeer } from "@/hooks/useMapPresence";

/**
 * One per connected peer, keyed by id (mounted/unmounted by RemotePeersLayer's
 * low-frequency membership list). Reads this peer's CURRENT pose straight out
 * of the shared remotePeersRef array every frame inside its own useFrame —
 * never from React state — so 10+Hz network updates never trigger a re-render.
 */
export function RemotePeerAvatar({
  peerId,
  remotePeersRef,
  throttled,
}: {
  peerId: string;
  remotePeersRef: React.RefObject<MapPresencePeer[]>;
  /** true for peers beyond the "near" distance band: no shadow, mixer ticks less often. */
  throttled: boolean;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const peer = remotePeersRef.current.find((p) => p.id === peerId);
    const modelPath = peer?.heroModelPath ?? "/models/hero1.glb";

    void loadHeroModel(modelPath).then(({ root, clips }) => {
      if (cancelled) return;
      const group = groupRef.current;
      if (!group) return;
      group.add(root);
      if (clips.length > 0) {
        const mixer = new THREE.AnimationMixer(root);
        mixer.clipAction(clips[0]!).play();
        mixerRef.current = mixer;
      }
    });

    return () => {
      cancelled = true;
      const group = groupRef.current;
      if (group) {
        while (group.children.length > 0) group.remove(group.children[0]!);
      }
      mixerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const peer = remotePeersRef.current.find((p) => p.id === peerId);
    if (!peer) return;
    group.position.set(peer.x, terrainHeight(peer.x, peer.z), peer.z);
    group.rotation.y = peer.ry;

    frameCountRef.current++;
    const shouldTick = !throttled || frameCountRef.current % 3 === 0;
    if (shouldTick) {
      mixerRef.current?.update(throttled ? delta * 3 : delta);
    }
  });

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
        mesh.castShadow = !throttled;
      }
    });
  }, [throttled]);

  return <group ref={groupRef} />;
}
