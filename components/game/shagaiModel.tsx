"use client";

import { useRef, useEffect, useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  ShagaiSide,
  biasSideForAirTorque,
  detectShagaiSideFromQuaternion,
  isShagaiOnkh,
  SHAGAI_PHYS_BOX,
  SHAGAI_SIDE_UP_AXIS,
} from "./shagai";
import { useGLTF } from "@react-three/drei";

const PHYS_BOX = SHAGAI_PHYS_BOX;
const MAX_ONKH_RETRIES = 14;

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

function pickLastShagai(
  root: THREE.Object3D | undefined | null,
  targetSize: [number, number, number],
): THREE.Object3D | null {
  if (!root) return null;
  if (process.env.NODE_ENV === "development") {
    debugDumpScene(root);
  }

  const wrap = new THREE.Group();

  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });

  if (meshes.length === 0) {
    wrap.add(root.clone(true));
    fitToBox(wrap, targetSize);
    return wrap;
  }

  if (meshes.length >= 2) {
    const last = meshes[meshes.length - 1]!;
    last.updateWorldMatrix(true, false);
    const cloned = last.clone();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    last.matrixWorld.decompose(pos, quat, scl);
    cloned.position.copy(pos);
    cloned.quaternion.copy(quat);
    cloned.scale.copy(scl);
    wrap.add(cloned);
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[shagai] mode=multi-mesh, total=",
        meshes.length,
        "picked last:",
        last.name || last.uuid,
      );
    }
  } else {
    const mesh = meshes[0]!;
    const split = splitMeshIslands(mesh);
    if (split && split.length >= 2) {
      const last = split[split.length - 1]!;
      wrap.add(last);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[shagai] mode=split-islands, islands=",
          split.length,
          "picked last",
        );
      }
    } else {
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
      if (process.env.NODE_ENV === "development") {
        console.log("[shagai] mode=single-mesh (no split)");
      }
    }
  }

  fitToBox(wrap, targetSize);
  return wrap;
}

function fitToBox(
  wrap: THREE.Group,
  targetSize: [number, number, number],
): void {
  const box = new THREE.Box3().setFromObject(wrap);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  wrap.children.forEach((c) => c.position.sub(center));

  const dims: [string, number][] = [
    ["x", size.x],
    ["y", size.y],
    ["z", size.z],
  ];
  dims.sort((a, b) => a[1] - b[1]);
  const shortAxis = dims[0]![0];
  const longAxis = dims[2]![0];

  const key = `${shortAxis}/${longAxis}`;
  switch (key) {
    case "y/z":
      break;
    case "y/x":
      wrap.rotation.set(0, Math.PI / 2, 0);
      break;
    case "x/y":
      wrap.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      break;
    case "x/z":
      wrap.rotation.set(0, 0, Math.PI / 2);
      break;
    case "z/y":
      wrap.rotation.set(Math.PI / 2, 0, 0);
      break;
    case "z/x":
      wrap.rotation.set(Math.PI / 2, Math.PI / 2, 0);
      break;
  }
  wrap.updateMatrixWorld(true);

  const box2 = new THREE.Box3().setFromObject(wrap);
  const size2 = new THREE.Vector3();
  box2.getSize(size2);
  const sx = size2.x > 0.0001 ? targetSize[0] / size2.x : 1;
  const sy = size2.y > 0.0001 ? targetSize[1] / size2.y : 1;
  const sz = size2.z > 0.0001 ? targetSize[2] / size2.z : 1;
  const s = Math.min(sx, sy, sz) * 0.95;
  wrap.scale.setScalar(s);

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
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

function splitMeshIslands(mesh: THREE.Mesh): THREE.Mesh[] | null {
  const geom = mesh.geometry as THREE.BufferGeometry;
  if (!geom) return null;
  const posAttr = geom.attributes.position as THREE.BufferAttribute | undefined;
  if (!posAttr) return null;
  const idxAttr = geom.index;

  const triCount = idxAttr ? idxAttr.count / 3 : posAttr.count / 3;
  if (!Number.isFinite(triCount) || triCount < 2) return null;

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
  const angVelRef = useRef<[number, number, number]>([0, 0, 0]);
  const posRef = useRef<[number, number, number]>([0, 5, 0]);
  const airtimeRef = useRef(0);
  const reportedRef = useRef(false);
  const biasTargetRef = useRef<ShagaiSide>("sheep");
  const onkhRetryRef = useRef(0);
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
    restitution: 0.14,
    friction: 0.72,
    linearDamping: 0.28,
    angularDamping: 0.34,
  }));

  useEffect(() => {
    const u1 = api.velocity.subscribe((v) => {
      velRef.current = v;
    });
    const u2 = api.position.subscribe((p) => {
      posRef.current = p;
    });
    const u3 = api.angularVelocity.subscribe((w) => {
      angVelRef.current = w;
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, [api]);

  useEffect(() => {
    if (!model) return;
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
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
    if (!isThrown) {
      onkhRetryRef.current = 0;
      return;
    }

    reportedRef.current = false;
    airtimeRef.current = 0;
    onkhRetryRef.current = 0;
    biasTargetRef.current = biasSideForAirTorque();

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
    const [wx, wy, wz] = angVelRef.current;
    const angSpeed = Math.sqrt(wx * wx + wy * wy + wz * wz);
    const grounded = posRef.current[1] < 1.2;

    if (airtimeRef.current > 0.22 && speed > 0.12) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      const targetLocal = SHAGAI_SIDE_UP_AXIS[biasTargetRef.current]
        .clone()
        .applyQuaternion(currentQuat);
      const worldUp = new THREE.Vector3(0, 1, 0);
      const alignDot = targetLocal.dot(worldUp);
      if (alignDot < 0.9) {
        const torqueAxis = new THREE.Vector3()
          .crossVectors(targetLocal, worldUp)
          .normalize()
          .multiplyScalar(3.8);
        api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
      }
    }

    const nearRest =
      airtimeRef.current > 1.1 && speed < 0.28 && angSpeed < 0.22 && grounded;
    const stall = airtimeRef.current > 9;
    if (nearRest || stall) {
      const q = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(q);

      if (isShagaiOnkh(q) && onkhRetryRef.current < MAX_ONKH_RETRIES) {
        onkhRetryRef.current += 1;
        airtimeRef.current = 0;
        biasTargetRef.current = biasSideForAirTorque();
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
        return;
      }

      const side = detectShagaiSideFromQuaternion(q);
      const y = restHeightsRef.current[side];
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.position.set(posRef.current[0], y, posRef.current[2]);
      api.sleep();
      reportedRef.current = true;
      onLand();
      onResult(side);
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
      <mesh visible={false}>
        <boxGeometry args={PHYS_BOX} />
        <meshStandardMaterial />
      </mesh>

      {model ? <primitive object={model} position={[0, 0, 0]} /> : null}
    </group>
  );
}

useGLTF.preload("/models/shagai_model.glb");
