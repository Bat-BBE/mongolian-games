"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { Placement } from "./harvestPlacements";

/** One InstancedMesh per merged-material submesh in the baked template, all
 * driven by the same placement list — this is how a multi-material baked
 * object (e.g. the 15-submesh ger) becomes N instanced draw calls instead of
 * N × placements.length individual meshes. */
function SubmeshInstances({
  geometry,
  material,
  placements,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  placements: Placement[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    placements.forEach((p, i) => {
      pos.set(p.x, p.y, p.z);
      quat.setFromEuler(new THREE.Euler(0, p.rotY, 0));
      scl.setScalar(p.scale);
      m.compose(pos, quat, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, Math.max(placements.length, 1)]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

/** Loads a baked .glb and renders `placements.length` copies of it, via one
 * InstancedMesh per submesh — replacing what used to be `placements.length`
 * full rebuilds of the procedural object. */
export function BakedInstances({
  glbPath,
  placements,
}: {
  glbPath: string;
  placements: Placement[];
}) {
  const gltf = useGLTF(glbPath);

  const meshes = useMemo(() => {
    const list: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
        list.push({
          geometry: mesh.geometry,
          material: Array.isArray(mesh.material) ? mesh.material[0] : mesh.material,
        });
      }
    });
    return list;
  }, [gltf]);

  if (placements.length === 0) return null;

  return (
    <>
      {meshes.map((m, i) => (
        <SubmeshInstances key={i} geometry={m.geometry} material={m.material} placements={placements} />
      ))}
    </>
  );
}
