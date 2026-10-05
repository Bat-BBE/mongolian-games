"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SceneBuilder } from "@/components/dashboard/SceneBuilder";
import type { UrtuuStation } from "@/components/dashboard/UrtuuNode";

/** Ports SceneBuilder.buildRoads() unchanged — depends on live station data, so it
 * can't be pre-baked like the repeated decor; it's cheap (one call per map load). */
export function Roads({ stations }: { stations: UrtuuStation[] }) {
  const group = useMemo(() => {
    const scratch = new THREE.Scene();
    const builder = new SceneBuilder(scratch, "home", [], null);
    const before = new Set(scratch.children);
    builder.buildRoads(stations);
    const added = scratch.children.filter((c) => !before.has(c));
    for (const c of added) scratch.remove(c);
    const g = new THREE.Group();
    for (const c of added) g.add(c);
    return g;
  }, [stations]);

  return <primitive object={group} />;
}
