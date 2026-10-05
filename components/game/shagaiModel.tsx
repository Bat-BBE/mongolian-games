"use client";

import * as THREE from "three";

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

