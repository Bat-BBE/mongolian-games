"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { TerrainBuilder } from "@/components/dashboard/TerrainBuilder";
import { materialLibrary } from "@/components/dashboard/MaterialLibrary";
import { TERRAIN_W } from "@/components/dashboard/mapConstants";

/** Ports TerrainBuilder.buildGrassPatches() unchanged — already a correct InstancedMesh. */
export function GrassInstances({ count = 1000 }: { count?: number }) {
  const mesh = useMemo(() => {
    const scratch = new THREE.Scene();
    const tb = new TerrainBuilder(scratch, materialLibrary);
    const m = tb.buildGrassPatches(count, TERRAIN_W * 0.4);
    scratch.remove(m);
    return m;
  }, [count]);

  return <primitive object={mesh} />;
}
