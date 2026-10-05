"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { TerrainBuilder } from "@/components/dashboard/TerrainBuilder";
import { materialLibrary } from "@/components/dashboard/MaterialLibrary";

/** Ports TerrainBuilder.buildTerrainWithUV() unchanged — same height/biome/color math. */
export function Terrain() {
  const mesh = useMemo(() => {
    const scratch = new THREE.Scene();
    const tb = new TerrainBuilder(scratch, materialLibrary);
    const m = tb.buildTerrainWithUV();
    scratch.remove(m);
    return m;
  }, []);

  return <primitive object={mesh} />;
}
