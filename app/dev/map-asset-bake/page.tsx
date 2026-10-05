"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SceneBuilder } from "@/components/dashboard/SceneBuilder";

type BakeResult = {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  meshesBefore?: number;
  meshesAfter?: number;
  vertsBefore?: number;
  vertsAfter?: number;
  bytes?: number;
  error?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySceneBuilder = Record<string, (...args: any[]) => unknown>;

type BakeTarget = {
  key: string;
  label: string;
  /** Calls the builder method(s) that add object(s) to the scene for this asset. */
  run: (scene: THREE.Scene, builder: AnySceneBuilder) => void;
};

/** Captures every scene child added during `run`, and groups them under one Object3D. */
function captureNewChildren(
  scene: THREE.Scene,
  run: () => void,
): THREE.Object3D {
  const before = new Set(scene.children);
  run();
  const added = scene.children.filter((c) => !before.has(c));
  for (const c of added) scene.remove(c);
  if (added.length === 1) return added[0]!;
  const wrapper = new THREE.Group();
  for (const c of added) wrapper.add(c);
  return wrapper;
}

const TARGETS: BakeTarget[] = [
  {
    key: "ger_standard",
    label: "Standard ger",
    run: (scene, b) => b.makeGer(0, 0, 0, 1, false, ""),
  },
  {
    key: "tree_01",
    label: "Tree",
    run: (scene, b) => b.makeTree(0, 0, 1),
  },
  {
    key: "horse",
    label: "Horse",
    run: (scene, b) => b.makeHorse(0, 0, 0, 0x6b3a1f, false),
  },
  {
    key: "camel",
    label: "Camel",
    run: (scene, b) => b.makeCamel(0, 0, 0),
  },
  {
    key: "ovoo",
    label: "Ovoo (cairn)",
    run: (scene, b) => b.makeOvoo(0, 0),
  },
  {
    key: "palace",
    label: "Palace (unique landmark)",
    run: (scene, b) => b.makePalace(0, 0, "bake_palace", false, false),
  },
  {
    key: "monastery",
    label: "Monastery (unique landmark)",
    run: (scene, b) => b.makeMonastery(0, 0, "bake_monastery", false, false),
  },
  {
    key: "mountain_shrine",
    label: "Mountain shrine (unique landmark)",
    run: (scene, b) =>
      b.makeMountainShrine(0, 0, "bake_mountain_shrine", false, false),
  },
  {
    key: "lake_station",
    label: "Lake station (unique landmark)",
    run: (scene, b) => b.makeLakeStation(0, 0, "bake_lake", false, false),
  },
  {
    key: "sand_dunes",
    label: "Sand dunes (unique landmark)",
    run: (scene, b) => b.makeSandDunes(0, 0, "bake_dunes", false, false),
  },
  {
    key: "rock_site",
    label: "Rock site (unique landmark)",
    run: (scene, b) => b.makeRockSite(0, 0, "bake_rocksite", false, false),
  },
  {
    key: "nat_park",
    label: "National park (unique landmark)",
    run: (scene, b) => b.makeNatPark(0, 0, "bake_natpark", false, false),
  },
  {
    key: "mini_sum_temple",
    label: "Mini sum temple",
    run: (scene, b) => b.makeMiniSumTemple(0, 0, 0, 1),
  },
  {
    key: "rock_variant",
    label: "Rock cluster (from buildRocks, first sample)",
    run: (scene, b) => {
      // buildRocks() scatters 115 groups across the whole terrain; we only want
      // one representative cluster as a reusable instanced template, so we run
      // it once and keep just the first non-empty group, discarding the rest.
      const before = new Set(scene.children);
      b.buildRocks();
      const added = scene.children.filter((c) => !before.has(c));
      const keep = added.find((c) => c.children.length > 0) ?? added[0];
      for (const c of added) {
        if (c !== keep) scene.remove(c);
      }
      if (keep) scene.remove(keep);
      if (keep) scene.add(keep);
    },
  },
];

function materialKey(mat: THREE.Material): string {
  const m = mat as THREE.MeshStandardMaterial;
  const tex = m.map?.uuid ?? (m.color ? m.color.getHexString() : "none");
  return `${tex}_${(m.roughness ?? 0).toFixed(2)}_${(m.metalness ?? 0).toFixed(2)}`;
}

function countMeshesAndVerts(root: THREE.Object3D): { meshes: number; verts: number } {
  let meshes = 0;
  let verts = 0;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
    meshes++;
    verts += mesh.geometry.attributes.position?.count ?? 0;
  });
  return { meshes, verts };
}

function mergeByMaterial(root: THREE.Object3D): THREE.Group {
  root.updateMatrixWorld(true);
  const byKey = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[] }>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const key = materialKey(mat);
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    for (const attrName of Object.keys(geo.attributes)) {
      if (!["position", "normal", "uv"].includes(attrName)) {
        geo.deleteAttribute(attrName);
      }
    }
    if (!geo.attributes.uv) {
      const count = geo.attributes.position.count;
      geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    if (!geo.attributes.normal) {
      geo.computeVertexNormals();
    }
    if (!byKey.has(key)) byKey.set(key, { mat, geos: [] });
    byKey.get(key)!.geos.push(geo);
  });

  const group = new THREE.Group();
  for (const { mat, geos } of byKey.values()) {
    try {
      const merged = mergeGeometries(geos, false);
      if (merged) group.add(new THREE.Mesh(merged, mat));
    } catch {
      for (const g of geos) group.add(new THREE.Mesh(g, mat));
    }
  }

  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  for (const c of group.children) {
    c.position.x -= center.x;
    c.position.z -= center.z;
    c.position.y -= box.min.y;
  }
  return group;
}

function exportGlb(group: THREE.Group): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("Exporter did not return binary output"));
      },
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
      { binary: true, embedImages: true },
    );
  });
}

export default function MapAssetBakePage() {
  if (process.env.NODE_ENV === "production") {
    return <div style={{ padding: 24 }}>Dev-only tool.</div>;
  }
  return <MapAssetBakeHarness />;
}

function MapAssetBakeHarness() {
  const [results, setResults] = useState<BakeResult[]>(
    TARGETS.map((t) => ({ key: t.key, label: t.label, status: "pending" })),
  );
  const [done, setDone] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      const scene = new THREE.Scene();
      const builder = new SceneBuilder(
        scene,
        "home",
        [],
        null,
      ) as unknown as AnySceneBuilder;

      for (const target of TARGETS) {
        setResults((prev) =>
          prev.map((r) => (r.key === target.key ? { ...r, status: "running" } : r)),
        );
        try {
          const raw = captureNewChildren(scene, () => target.run(scene, builder));
          const before = countMeshesAndVerts(raw);
          const merged = mergeByMaterial(raw);
          const after = countMeshesAndVerts(merged);
          const buf = await exportGlb(merged);
          const res = await fetch(`/api/dev-save-asset?name=${target.key}.glb`, {
            method: "POST",
            body: buf,
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "save failed");
          setResults((prev) =>
            prev.map((r) =>
              r.key === target.key
                ? {
                    ...r,
                    status: "done",
                    meshesBefore: before.meshes,
                    meshesAfter: after.meshes,
                    vertsBefore: before.verts,
                    vertsAfter: after.verts,
                    bytes: json.bytes,
                  }
                : r,
            ),
          );
        } catch (e) {
          setResults((prev) =>
            prev.map((r) =>
              r.key === target.key
                ? { ...r, status: "error", error: e instanceof Error ? e.message : String(e) }
                : r,
            ),
          );
        }
      }
      setDone(true);
    }

    void run();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "monospace", background: "#111", color: "#eee", minHeight: "100vh" }}>
      <h1>Map asset bake harness (dev only)</h1>
      <p>Extracts procedural objects from SceneBuilder, merges by material, exports as .glb into public/models/map/.</p>
      <table style={{ borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 4 }}>Target</th>
            <th style={{ textAlign: "left", padding: 4 }}>Status</th>
            <th style={{ textAlign: "left", padding: 4 }}>Meshes before→after</th>
            <th style={{ textAlign: "left", padding: 4 }}>Verts before→after</th>
            <th style={{ textAlign: "left", padding: 4 }}>Bytes</th>
            <th style={{ textAlign: "left", padding: 4 }}>Error</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.key}>
              <td style={{ padding: 4 }}>{r.label}</td>
              <td style={{ padding: 4 }}>{r.status}</td>
              <td style={{ padding: 4 }}>
                {r.meshesBefore ?? "-"} → {r.meshesAfter ?? "-"}
              </td>
              <td style={{ padding: 4 }}>
                {r.vertsBefore ?? "-"} → {r.vertsAfter ?? "-"}
              </td>
              <td style={{ padding: 4 }}>{r.bytes ?? "-"}</td>
              <td style={{ padding: 4, color: "#f66" }}>{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p id="bake-status" style={{ marginTop: 16 }}>
        {done ? "ALL_DONE" : "RUNNING"}
      </p>
    </div>
  );
}
