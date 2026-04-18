"use client";

import { useRef, useEffect, useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ShagaiSide,
  weightedTraditionalSide,
  buildTargetQuaternion,
  SHAGAI_SIDE_UP_AXIS,
} from "./shagai";
import { useGLTF } from "@react-three/drei";

const PHYS_BOX: [number, number, number] = [1.3, 0.5, 2.0];

export { pickLastShagai };

function debugDumpScene(root: THREE.Object3D): void {
  try {
    const rows: string[] = [];
    root.traverse((o) => {
      const depth = (() => {
        let d = 0;
        let p: THREE.Object3D | null = o.parent;
        while (p && p !== root) {
          d++;
          p = p.parent;
        }
        return d;
      })();
      const indent = "  ".repeat(depth);
      const mesh = o as THREE.Mesh;
      let extra = "";
      if (mesh.isMesh && mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        const bb = mesh.geometry.boundingBox;
        if (bb) {
          const s = new THREE.Vector3();
          bb.getSize(s);
          const idxCount = mesh.geometry.index
            ? mesh.geometry.index.count
            : (mesh.geometry.attributes.position?.count ?? 0);
          extra = ` [mesh size=(${s.x.toFixed(2)},${s.y.toFixed(2)},${s.z.toFixed(2)}) idx=${idxCount}]`;
        }
      }
      rows.push(
        `${indent}- ${o.type} "${o.name}"${extra} children=${o.children.length}`,
      );
    });
    console.groupCollapsed("[shagai] GLB hierarchy");
    console.log(rows.join("\n"));
    console.groupEnd();
  } catch {}
}

// Returns a wrap containing just the LAST visible shagai.
// Handles three cases automatically:
//   1) Multiple Object3D siblings (one per shagai)
//   2) Multiple meshes somewhere in the tree (pick last mesh)
//   3) A single merged mesh containing 3 disconnected islands (split geometry)
function pickLastShagai(
  root: THREE.Object3D | undefined | null,
  targetSize: [number, number, number],
): THREE.Object3D | null {
  if (!root) return null;
  debugDumpScene(root);

  const wrap = new THREE.Group();

  // Gather every mesh in the scene.
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  if (meshes.length === 0) {
    // No meshes at all — clone the whole root as fallback.
    wrap.add(root.clone(true));
    fitToBox(wrap, targetSize);
    return wrap;
  }

  if (meshes.length >= 2) {
    // Case 1/2: multiple meshes → pick the LAST one, baked with world transform.
    const last = meshes[meshes.length - 1]!;
    last.updateWorldMatrix(true, false);
    const cloned = last.clone();
    // Bake world transform so the cloned mesh sits at origin-relative place
    // regardless of parent chain we dropped.
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    last.matrixWorld.decompose(pos, quat, scl);
    cloned.position.copy(pos);
    cloned.quaternion.copy(quat);
    cloned.scale.copy(scl);
    wrap.add(cloned);
    console.log(
      "[shagai] mode=multi-mesh, total=",
      meshes.length,
      "picked last:",
      last.name || last.uuid,
    );
  } else {
    // Case 3: single mesh, possibly 3 islands merged in one geometry.
    const mesh = meshes[0]!;
    const split = splitMeshIslands(mesh);
    if (split && split.length >= 2) {
      const last = split[split.length - 1]!;
      wrap.add(last);
      console.log(
        "[shagai] mode=split-islands, islands=",
        split.length,
        "picked last",
      );
    } else {
      // Truly a single shagai — just clone the mesh as is.
      mesh.updateWorldMatrix(true, false);
      const cloned = mesh.clone();
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      mesh.matrixWorld.decompose(pos, quat, scl);
      cloned.position.copy(pos);
      cloned.quaternion.copy(quat);
      cloned.scale.copy(scl);
      wrap.add(cloned);
      console.log("[shagai] mode=single-mesh (no split)");
    }
  }

  fitToBox(wrap, targetSize);
  return wrap;
}

function fitToBox(
  wrap: THREE.Group,
  targetSize: [number, number, number],
): void {
  // Step 1: centre the model at origin.
  const box = new THREE.Box3().setFromObject(wrap);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  wrap.children.forEach((c) => c.position.sub(center));

  // Step 2: align the model's anatomical axes with the physics box axes
  //   - SHORTEST model dim  → physics Y (height / flat-face normal)
  //   - LONGEST  model dim  → physics Z (length)
  //   - MIDDLE   model dim  → physics X (width)
  // We do this by rotating the wrap 90° around the axes needed.
  const dims: [string, number][] = [
    ["x", size.x],
    ["y", size.y],
    ["z", size.z],
  ];
  dims.sort((a, b) => a[1] - b[1]);
  const shortAxis = dims[0]![0];
  const longAxis = dims[2]![0];

  // Simple case-table: rotate so shortest → y and longest → z.
  // Rotations act on the wrap group (its children already centered).
  const key = `${shortAxis}/${longAxis}`;
  // The 6 possible orderings (shortestAxis/longestAxis):
  switch (key) {
    case "y/z":
      // Already aligned. No rotation.
      break;
    case "y/x":
      // Long is X, short Y. Swap X<->Z. Rotate 90° around Y.
      wrap.rotation.set(0, Math.PI / 2, 0);
      break;
    case "x/y":
      // Short is X, long is Y. Rotate 90° around Z so X→Y & Y→-X,
      // then 90° around X to bring long (now Y) to Z.
      wrap.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      break;
    case "x/z":
      // Short is X, long is Z. Rotate 90° around Z so X→Y.
      wrap.rotation.set(0, 0, Math.PI / 2);
      break;
    case "z/y":
      // Short is Z, long is Y. Rotate 90° around X.
      wrap.rotation.set(Math.PI / 2, 0, 0);
      break;
    case "z/x":
      // Short Z, long X. Rotate 90° around X then 90° around Y.
      wrap.rotation.set(Math.PI / 2, Math.PI / 2, 0);
      break;
  }
  wrap.updateMatrixWorld(true);

  // Step 3: uniform scale so the now-aligned bbox fits inside the target.
  const box2 = new THREE.Box3().setFromObject(wrap);
  const size2 = new THREE.Vector3();
  box2.getSize(size2);
  const sx = size2.x > 0.0001 ? targetSize[0] / size2.x : 1;
  const sy = size2.y > 0.0001 ? targetSize[1] / size2.y : 1;
  const sz = size2.z > 0.0001 ? targetSize[2] / size2.z : 1;
  const s = Math.min(sx, sy, sz) * 0.95;
  wrap.scale.setScalar(s);

  if (typeof window !== "undefined") {
    try {
      console.log(
        "[shagai] aligned model. original size=",
        size
          .toArray()
          .map((n) => n.toFixed(3))
          .join(","),
        "rotation-key=",
        key,
        "final scale=",
        s.toFixed(3),
      );
    } catch {}
  }
}

// Try to split a single merged mesh into connected-component islands
// (Union-Find over triangle adjacency via shared vertex indices).
function splitMeshIslands(mesh: THREE.Mesh): THREE.Mesh[] | null {
  const geom = mesh.geometry as THREE.BufferGeometry;
  if (!geom) return null;
  const posAttr = geom.attributes.position as THREE.BufferAttribute | undefined;
  if (!posAttr) return null;
  const idxAttr = geom.index;

  // Build triangles list as triples of vertex indices.
  const triCount = idxAttr ? idxAttr.count / 3 : posAttr.count / 3;
  if (!Number.isFinite(triCount) || triCount < 2) return null;

  // Dedupe vertices by position so islands connect via shared verts.
  const vertCount = posAttr.count;
  const key = new Array<number>(vertCount);
  const map = new Map<string, number>();
  const quant = 1e4;
  for (let i = 0; i < vertCount; i++) {
    const x = Math.round(posAttr.getX(i) * quant);
    const y = Math.round(posAttr.getY(i) * quant);
    const z = Math.round(posAttr.getZ(i) * quant);
    const k = `${x},${y},${z}`;
    let id = map.get(k);
    if (id === undefined) {
      id = map.size;
      map.set(k, id);
    }
    key[i] = id;
  }

  // Union-Find over dedup'd vertex ids.
  const N = map.size;
  const parent = new Int32Array(N);
  for (let i = 0; i < N; i++) parent[i] = i;
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const triVerts: Uint32Array = new Uint32Array(triCount * 3);
  for (let t = 0; t < triCount; t++) {
    const a = idxAttr ? idxAttr.getX(t * 3) : t * 3;
    const b = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
    const c = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
    triVerts[t * 3] = a;
    triVerts[t * 3 + 1] = b;
    triVerts[t * 3 + 2] = c;
    union(key[a]!, key[b]!);
    union(key[b]!, key[c]!);
  }

  // Group triangles by root.
  const groups = new Map<number, number[]>();
  for (let t = 0; t < triCount; t++) {
    const r = find(key[triVerts[t * 3]!]!);
    let arr = groups.get(r);
    if (!arr) {
      arr = [];
      groups.set(r, arr);
    }
    arr.push(t);
  }
  if (groups.size < 2) return null;

  // Order groups by bounding box center x (or whichever axis has most spread).
  const tmp: { tris: number[]; cx: number; cy: number; cz: number }[] = [];
  for (const tris of groups.values()) {
    const bb = new THREE.Box3();
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const v = triVerts[t * 3 + k]!;
        bb.expandByPoint(
          new THREE.Vector3(posAttr.getX(v), posAttr.getY(v), posAttr.getZ(v)),
        );
      }
    }
    const center = new THREE.Vector3();
    bb.getCenter(center);
    tmp.push({ tris, cx: center.x, cy: center.y, cz: center.z });
  }
  // Sort by X ascending; the "last" one is the rightmost by X.
  tmp.sort((a, b) => a.cx - b.cx);

  mesh.updateWorldMatrix(true, false);
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScl = new THREE.Vector3();
  mesh.matrixWorld.decompose(worldPos, worldQuat, worldScl);

  const meshes: THREE.Mesh[] = [];
  for (const g of tmp) {
    const sub = new THREE.BufferGeometry();
    const newPositions = new Float32Array(g.tris.length * 9);
    let n = 0;
    for (const t of g.tris) {
      for (let k = 0; k < 3; k++) {
        const v = triVerts[t * 3 + k]!;
        newPositions[n++] = posAttr.getX(v);
        newPositions[n++] = posAttr.getY(v);
        newPositions[n++] = posAttr.getZ(v);
      }
    }
    sub.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
    sub.computeVertexNormals();
    const m = new THREE.Mesh(sub, mesh.material);
    m.position.copy(worldPos);
    m.quaternion.copy(worldQuat);
    m.scale.copy(worldScl);
    meshes.push(m);
  }
  return meshes;
}

interface ShagaiModelProps {
  onResult: (side: ShagaiSide) => void;
  isThrown: boolean;
  onLand: () => void;
}

export default function ShagaiModel({
  onResult,
  isThrown,
  onLand,
}: ShagaiModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const posRef = useRef<[number, number, number]>([0, 5, 0]);
  const airtimeRef = useRef(0);
  const reportedRef = useRef(false);
  // Pre-decided side for the current throw and the snap machinery.
  const decidedSideRef = useRef<ShagaiSide>("sheep");
  const snapStartQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const snapTargetQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const snapStartPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const snapActiveRef = useRef(false);
  const snapElapsedRef = useRef(0);
  const SNAP_DURATION = 0.22; // seconds — quick enough to not be jarring
  // Rest heights measured from the actual visual mesh (not the collider)
  // so the bone sits flush on the floor no matter which face lands up.
  const restHeightsRef = useRef<Record<ShagaiSide, number>>({
    sheep: PHYS_BOX[2] / 2,
    goat: PHYS_BOX[2] / 2,
    horse: PHYS_BOX[1] / 2,
    camel: PHYS_BOX[1] / 2,
  });

  const gltf = useGLTF("/models/shagai_model.glb");
  const model = useMemo(
    () => pickLastShagai((gltf as any)?.scene, PHYS_BOX),
    [gltf],
  );

  const [ref, api] = useBox(() => ({
    mass: 0.55,
    position: [0, 5, 0],
    args: PHYS_BOX,
    // Moderate damping + friction: enough to settle quickly, but not so much
    // that the shagai locks into a narrow-side rest. It must be allowed to
    // tumble a bit after landing so it can roll onto its wide face.
    restitution: 0.2,
    friction: 0.55,
    linearDamping: 0.22,
    angularDamping: 0.22,
  }));

  useEffect(() => {
    const u1 = api.velocity.subscribe((v) => {
      velRef.current = v;
    });
    const u2 = api.position.subscribe((p) => {
      posRef.current = p;
    });
    return () => {
      u1();
      u2();
    };
  }, [api]);

  useEffect(() => {
    if (!model) return;
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        // Slight polish for PBR under strong lighting.
        const mat = m.material as
          | THREE.MeshStandardMaterial
          | THREE.MeshStandardMaterial[];
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const mm of mats) {
          if (mm && "roughness" in mm) {
            mm.roughness = Math.min(0.9, Math.max(0.35, mm.roughness ?? 0.6));
            mm.metalness = Math.min(0.25, Math.max(0.0, mm.metalness ?? 0.05));
            (mm as THREE.MeshStandardMaterial).envMapIntensity =
              (mm as THREE.MeshStandardMaterial).envMapIntensity ?? 0.45;
            mm.needsUpdate = true;
          }
        }
      }
    });
    // Measure the exact rest height for each side by iterating real
    // vertices. The collider center must sit at `-minY` above the floor
    // so the visual mesh rests flush against it regardless of mesh
    // asymmetries (the model is not perfectly symmetric around its bbox
    // center — one end is broader than the other).
    // We compute in wrap-parent space (= rigid body local space) by
    // manually composing wrap.matrix × mesh.matrix, not matrixWorld,
    // because the wrap may already be parented to the rigid body group
    // whose transform must NOT be included here.
    model.updateMatrix();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const sides: ShagaiSide[] = ["sheep", "goat", "horse", "camel"];
    const next: Record<ShagaiSide, number> = { ...restHeightsRef.current };
    const v = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
    for (const side of sides) {
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(
        SHAGAI_SIDE_UP_AXIS[side].clone(),
        worldUp,
      );
      let minY = Infinity;
      for (const child of model.children) {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry?.attributes?.position) continue;
        mesh.updateMatrix();
        matrix.multiplyMatrices(model.matrix, mesh.matrix);
        const posAttr = mesh.geometry.attributes
          .position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          v.fromBufferAttribute(posAttr, i);
          v.applyMatrix4(matrix);
          v.applyQuaternion(alignQuat);
          if (v.y < minY) minY = v.y;
        }
      }
      if (Number.isFinite(minY)) {
        next[side] = -minY + 0.004;
      }
    }
    restHeightsRef.current = next;
  }, [model]);

  useEffect(() => {
    if (!isThrown) return;

    reportedRef.current = false;
    airtimeRef.current = 0;
    snapActiveRef.current = false;
    snapElapsedRef.current = 0;

    // Pre-decide the outcome using the traditional distribution.
    decidedSideRef.current = weightedTraditionalSide();

    // Wake up the body in case a previous throw ended with api.sleep().
    api.wakeUp();
    api.position.set(0, 5, 0);
    api.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    );
    api.velocity.set(
      (Math.random() - 0.5) * 5.5,
      7.0,
      (Math.random() - 0.5) * 5.5,
    );
    api.angularVelocity.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
    );
  }, [isThrown, api]);

  useFrame((_, delta) => {
    if (!groupRef.current || reportedRef.current) return;
    airtimeRef.current += delta;

    const speed = Math.sqrt(
      velRef.current[0] ** 2 + velRef.current[1] ** 2 + velRef.current[2] ** 2,
    );
    // Allow any resting orientation: widest half-dim of the box + buffer.
    // (Y-up ≈ 0.25, X-up ≈ 0.65, Z-up / onkh ≈ 1.0 — all count as grounded.)
    const grounded = posRef.current[1] < 1.2;

    // --- Smooth orientation snap to the pre-decided side ---------------
    if (snapActiveRef.current) {
      snapElapsedRef.current += delta;
      const t = Math.min(1, snapElapsedRef.current / SNAP_DURATION);
      // Ease-in-out for a gentle settle motion.
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const q = new THREE.Quaternion()
        .copy(snapStartQuatRef.current)
        .slerp(snapTargetQuatRef.current, e);
      api.quaternion.set(q.x, q.y, q.z, q.w);
      const targetY = restHeightsRef.current[decidedSideRef.current];
      const startY = snapStartPosRef.current[1];
      const py = startY + (targetY - startY) * e;
      api.position.set(snapStartPosRef.current[0], py, snapStartPosRef.current[2]);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      if (t >= 1) {
        snapActiveRef.current = false;
        reportedRef.current = true;
        // Put the body to sleep so it doesn't topple / drift after the snap.
        api.sleep();
        onLand();
        onResult(decidedSideRef.current);
      }
      return;
    }

    // --- Gentle in-flight bias toward the pre-decided orientation ----------
    // While the shagai is still moving we nudge the side we want to be "up"
    // toward the world up vector. By the time physics comes to rest the
    // bone is already close to the target pose, so the final snap is tiny
    // and not visible as a jarring flip from one side to another.
    if (airtimeRef.current > 0.25 && speed > 0.2) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      const targetLocal = SHAGAI_SIDE_UP_AXIS[decidedSideRef.current]
        .clone()
        .applyQuaternion(currentQuat);
      const worldUp = new THREE.Vector3(0, 1, 0);
      const alignDot = targetLocal.dot(worldUp);
      if (alignDot < 0.98) {
        const torqueAxis = new THREE.Vector3()
          .crossVectors(targetLocal, worldUp)
          .normalize()
          .multiplyScalar(1.4);
        api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
      }
    }

    // --- Wait until the shagai is near rest, then start the snap --------
    const nearRest =
      airtimeRef.current > 1.4 && speed < 0.8 && grounded;
    // Safety: even if physics keeps the bone rolling forever, force a snap
    // after enough airtime so the game never stalls.
    const forceSnap = airtimeRef.current > 4.5;
    if (nearRest || forceSnap) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      snapStartQuatRef.current.copy(currentQuat);
      snapTargetQuatRef.current.copy(
        buildTargetQuaternion(decidedSideRef.current),
      );
      snapStartPosRef.current = [
        posRef.current[0],
        posRef.current[1],
        posRef.current[2],
      ];
      snapElapsedRef.current = 0;
      snapActiveRef.current = true;
      if (typeof window !== "undefined") {
        try {
          console.log(
            "[shagai] snapping to pre-decided side =",
            decidedSideRef.current,
          );
        } catch {}
      }
    }
  });

  return (
    <group
      ref={(node) => {
        if (node) {
          (ref as any).current = node;
          groupRef.current = node;
        }
      }}
    >
      {/* Physics collider (invisible). Keep stable even if model changes. */}
      <mesh visible={false}>
        <boxGeometry args={PHYS_BOX} />
        <meshStandardMaterial />
      </mesh>

      {/* Visual model: pick the LAST shagai (3rd child) from the GLB,
          auto-centered, auto-aligned (shortest axis → Y, longest → Z),
          and auto-scaled to fit the physics collider. */}
      {model ? <primitive object={model} position={[0, 0, 0]} /> : null}
    </group>
  );
}

useGLTF.preload("/models/shagai_model.glb");
