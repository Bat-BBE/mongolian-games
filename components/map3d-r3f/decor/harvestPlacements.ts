import * as THREE from "three";
import { SceneBuilder } from "@/components/dashboard/SceneBuilder";
import { terrainHeight } from "@/components/dashboard/sceneHelpers";
import type { UrtuuStation } from "@/components/dashboard/UrtuuNode";

export type Placement = { x: number; y: number; z: number; rotY: number; scale: number };

export type HarvestedPlacements = {
  gers: Placement[];
  trees: Placement[];
  horses: Placement[];
  camels: Placement[];
  ovoos: Placement[];
  rocks: Placement[];
};

/**
 * Runs the real SceneBuilder layout/scatter logic (seeded RNG, terrain-aware
 * placement, station-camp math) but intercepts the leaf mesh-building methods
 * so we collect (x, z, rotation, scale) instead of constructing ~25,000 real
 * meshes. The positions are then used to drive InstancedMesh placement of the
 * Phase 2 baked templates — same distribution, a fraction of the draw calls.
 *
 * Known simplification: a handful of trees/horses/camels embedded inside the
 * unique landmark buildings (nat_park, lake_station, sand_dunes) are already
 * baked into those landmark .glb files AND get captured here too, so those
 * specific stations render a few duplicate props. Minor, cosmetic, cheap to
 * fix later by excluding those station ids from the ambient harvest.
 */
export function harvestPlacements(
  stations: UrtuuStation[],
  currentStationId: string,
  doneStationIds: string[],
): HarvestedPlacements {
  const scratch = new THREE.Scene();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder = new SceneBuilder(scratch, currentStationId, doneStationIds, null) as any;

  const gers: Placement[] = [];
  const trees: Placement[] = [];
  const horses: Placement[] = [];
  const camels: Placement[] = [];
  const ovoos: Placement[] = [];

  builder.makeGer = (x: number, z: number, rotY = 0, s = 1) => {
    gers.push({ x, y: terrainHeight(x, z), z, rotY, scale: s });
  };
  builder.makeTree = (x: number, z: number, s = 1) => {
    trees.push({
      x,
      y: terrainHeight(x, z),
      z,
      rotY: (x * 12.9898 + z * 78.233) % (Math.PI * 2),
      scale: s,
    });
  };
  builder.makeOvoo = (x: number, z: number) => {
    ovoos.push({ x, y: terrainHeight(x, z), z, rotY: 0, scale: 1 });
  };
  builder.makeHorse = (x: number, z: number, rotY = 0) => {
    horses.push({ x, y: terrainHeight(x, z), z, rotY, scale: 1 });
    return new THREE.Group();
  };
  builder.makeCamel = (x: number, z: number, rotY = 0) => {
    camels.push({ x, y: terrainHeight(x, z), z, rotY, scale: 1 });
  };

  builder.buildRoads(stations);
  builder.buildStationGers(stations);
  builder.buildTrees();
  builder.buildHorses();
  builder.buildCamels();

  // Rocks have no separately-callable per-cluster method, so we let buildRocks()
  // build real (throwaway) geometry once and harvest each cluster's world
  // position + an approximate uniform scale from its bounding box.
  const rocks: Placement[] = [];
  const before = new Set(scratch.children);
  builder.buildRocks();
  const added = scratch.children.filter((c: THREE.Object3D) => !before.has(c));
  const refBox = new THREE.Box3();
  for (const group of added) {
    refBox.setFromObject(group);
    const size = refBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    // The baked template is one single small rock; large multi-rock clusters
    // scaled up to match naively can look like they float on sloped terrain
    // (one grounded pivot point, oversized silhouette). Clamped pending a
    // proper multi-size rock bake in a follow-up pass.
    rocks.push({
      x: group.position.x,
      y: terrainHeight(group.position.x, group.position.z),
      z: group.position.z,
      rotY: group.rotation.y,
      scale: Math.min(Math.max(maxDim / 1.4, 0.5), 1.6),
    });
    scratch.remove(group);
  }

  return { gers, trees, horses, camels, ovoos, rocks };
}
