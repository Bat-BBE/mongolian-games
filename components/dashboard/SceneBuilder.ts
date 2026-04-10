import * as THREE from "three";
import {
  rand,
  randInt,
  mkMat,
  terrainHeight,
  terrainBiome,
  pseudoNoise2D,
  smoothstep,
} from "./sceneHelpers";
import {
  STATION_CONFIGS,
  HORSE_COLORS,
  TERRAIN_W,
  TERRAIN_D,
  TERRAIN_SEG,
  WORLD_SCALE,
} from "./mapConstants";
import type { UrtuuStation } from "./UrtuuNode";

type StationPeripheryPreset = {
  trees?: number;
  treeRadius?: number;
  treeScaleMin?: number;
  treeScaleMax?: number;
  decorGers?: number;
  gerRadius?: number;
  camels?: number;
  camelRadius?: number;
  horses?: number;
  horseRadius?: number;
  rocks?: number;
  rockRadius?: number;
  ovoos?: number;
  ovooRadius?: number;
  grassClumps?: number;
  grassRadius?: number;
  reedPatches?: number;
  reedRadius?: number;
};

const STATION_PERIPHERY: Record<string, StationPeripheryPreset> = {
  ulaanbaatar: {
    trees: 16,
    treeRadius: 42,
    grassClumps: 22,
    grassRadius: 38,
    rocks: 6,
    rockRadius: 28,
  },
  zuunmod: {
    trees: 22,
    treeRadius: 36,
    decorGers: 4,
    gerRadius: 28,
    ovoos: 2,
    ovooRadius: 22,
    grassClumps: 18,
    grassRadius: 30,
  },
  terelj: {
    trees: 32,
    treeRadius: 40,
    rocks: 14,
    rockRadius: 32,
    horses: 3,
    horseRadius: 26,
    grassClumps: 24,
    grassRadius: 34,
  },
  nalaikh: {
    rocks: 28,
    rockRadius: 30,
    trees: 10,
    treeRadius: 24,
    ovoos: 1,
    ovooRadius: 14,
  },
  kharakhorum: {
    decorGers: 7,
    gerRadius: 32,
    trees: 14,
    treeRadius: 38,
    horses: 5,
    horseRadius: 30,
    ovoos: 2,
    ovooRadius: 26,
    grassClumps: 20,
    grassRadius: 36,
  },
  arvaikheer: {
    decorGers: 6,
    gerRadius: 34,
    horses: 8,
    horseRadius: 36,
    grassClumps: 45,
    grassRadius: 40,
    ovoos: 2,
    ovooRadius: 28,
  },
  orkhon_river: {
    trees: 18,
    treeRadius: 34,
    reedPatches: 36,
    reedRadius: 38,
    horses: 4,
    horseRadius: 28,
    grassClumps: 22,
    grassRadius: 32,
  },
  mandalgovi: {
    camels: 8,
    camelRadius: 36,
    decorGers: 3,
    gerRadius: 26,
    rocks: 14,
    rockRadius: 32,
    grassClumps: 14,
    grassRadius: 30,
  },
  darkhan: {
    trees: 34,
    treeRadius: 38,
    horses: 5,
    horseRadius: 30,
    grassClumps: 28,
    grassRadius: 36,
  },
  erdenet: {
    trees: 20,
    treeRadius: 34,
    decorGers: 3,
    gerRadius: 24,
    ovoos: 1,
    ovooRadius: 18,
    grassClumps: 18,
    grassRadius: 28,
  },
  sukhbaatar: {
    trees: 26,
    treeRadius: 40,
    rocks: 8,
    rockRadius: 30,
    grassClumps: 24,
    grassRadius: 34,
  },
  moron: {
    trees: 22,
    treeRadius: 36,
    horses: 5,
    horseRadius: 32,
    reedPatches: 14,
    reedRadius: 28,
    grassClumps: 20,
    grassRadius: 32,
  },
  khatgal: {
    trees: 30,
    treeRadius: 38,
    rocks: 10,
    rockRadius: 28,
    reedPatches: 18,
    reedRadius: 32,
    grassClumps: 22,
    grassRadius: 34,
  },
  uliastai: {
    rocks: 16,
    rockRadius: 34,
    trees: 12,
    treeRadius: 30,
    ovoos: 2,
    ovooRadius: 24,
    grassClumps: 14,
    grassRadius: 28,
  },
  bayankhongor: {
    trees: 18,
    treeRadius: 34,
    rocks: 10,
    rockRadius: 28,
    horses: 4,
    horseRadius: 30,
    grassClumps: 20,
    grassRadius: 32,
  },
  altai: {
    rocks: 22,
    rockRadius: 36,
    trees: 10,
    treeRadius: 32,
    camels: 3,
    camelRadius: 28,
    ovoos: 1,
    ovooRadius: 20,
  },
  khovd: {
    trees: 16,
    treeRadius: 34,
    decorGers: 4,
    gerRadius: 28,
    camels: 4,
    camelRadius: 30,
    grassClumps: 18,
    grassRadius: 32,
  },
  ulaangom: {
    trees: 24,
    treeRadius: 38,
    rocks: 12,
    rockRadius: 32,
    reedPatches: 16,
    reedRadius: 34,
    grassClumps: 20,
    grassRadius: 34,
  },
  ondorhaan: {
    trees: 26,
    treeRadius: 36,
    rocks: 16,
    rockRadius: 34,
    ovoos: 2,
    ovooRadius: 26,
    grassClumps: 18,
    grassRadius: 32,
  },
  kherlenbayan: {
    decorGers: 7,
    gerRadius: 36,
    horses: 10,
    horseRadius: 38,
    grassClumps: 40,
    grassRadius: 42,
    ovoos: 2,
    ovooRadius: 30,
  },
  choibalsan: {
    horses: 12,
    horseRadius: 40,
    decorGers: 6,
    gerRadius: 36,
    grassClumps: 38,
    grassRadius: 40,
    ovoos: 2,
    ovooRadius: 32,
  },
  baruun_urt: {
    decorGers: 6,
    gerRadius: 34,
    camels: 4,
    camelRadius: 32,
    horses: 6,
    horseRadius: 34,
    grassClumps: 28,
    grassRadius: 36,
  },
  dalanzadgad: {
    camels: 14,
    camelRadius: 42,
    rocks: 12,
    rockRadius: 38,
    grassClumps: 12,
    grassRadius: 36,
  },
  sainshand: {
    camels: 8,
    camelRadius: 36,
    decorGers: 3,
    gerRadius: 28,
    rocks: 10,
    rockRadius: 32,
    grassClumps: 16,
    grassRadius: 34,
  },
  zamiin_uud: {
    rocks: 26,
    rockRadius: 38,
    camels: 4,
    camelRadius: 32,
    trees: 8,
    treeRadius: 28,
    ovoos: 2,
    ovooRadius: 26,
  },
};

export interface HorseEntry {
  group: THREE.Group;
  baseRot: number;
  speed: number;
  orbitR: number;
  orbitCx: number;
  orbitCz: number;
  phase: number;
}
export interface CloudEntry {
  g: THREE.Group;
  speed: number;
  alt: number;
}
export interface BirdEntry {
  pivot: THREE.Group;
  arm: THREE.Group;
  speed: number;
  radius: number;
  yOff: number;
  phase: number;
  wingMesh: THREE.Mesh;
  alt: number;
}

export class SceneBuilder {
  private scene: THREE.Scene;
  private currentStationId: string;
  private doneStationIds: string[];

  public horses: HorseEntry[] = [];
  public clouds: CloudEntry[] = [];
  public birds: BirdEntry[] = [];
  public markerMeshes = new Map<string, THREE.Mesh>();
  public labelAnchors = new Map<string, THREE.Vector3>();
  public doorAnchors = new Map<string, THREE.Vector3>();
  /** Centerline points for station-to-station roads (world x/z, y=0). */
  public roadPaths = new Map<string, THREE.Vector3[]>();

  constructor(
    scene: THREE.Scene,
    currentStationId: string,
    doneStationIds: string[],
  ) {
    this.scene = scene;
    this.currentStationId = currentStationId;
    this.doneStationIds = doneStationIds;
  }

  buildSky(): void {
    const geo = new THREE.SphereGeometry(700, 48, 24);
    geo.scale(-1, 1, -1);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = Math.max(0, Math.min(1, (y + 700) / 1400));
      const h = 1 - t;
      let r = 0.78 * h + 0.42 * t;
      let g = 0.76 * h + 0.5 * t;
      let b = 0.74 * h + 0.56 * t;
      const n1 = Math.sin(x * 0.0055 + z * 0.0042);
      const n2 = Math.sin(x * 0.011 + z * 0.009 + y * 0.0012);
      const n3 = Math.sin(z * 0.013 + x * 0.007);
      const cloudRaw = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;
      const cloud = smoothstep(0.15, 0.92, cloudRaw * 0.5 + 0.5);
      const cloudLift = cloud * (0.1 + 0.12 * h);
      r += cloudLift;
      g += cloudLift;
      b += cloudLift * 1.02;
      const haze = (1 - t) * 0.06;
      r += haze;
      g += haze;
      b += haze;
      const maxC = 0.98;
      colors[i * 3] = Math.min(maxC, r);
      colors[i * 3 + 1] = Math.min(maxC, g);
      colors[i * 3 + 2] = Math.min(maxC, b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.scene.add(
      new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })),
    );
  }

  buildTerrain(): void {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_W,
      TERRAIN_D,
      TERRAIN_SEG,
      TERRAIN_SEG,
    );
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      let r: number, g: number, b: number;

      const biome = terrainBiome(x, z, h);
      const orkhonX = -32 + Math.sin(z * 0.08) * 6;
      const nearRiver =
        Math.abs(x - orkhonX) < 10 ||
        (Math.abs(x - 2) < 7 && z > -10 && z < 14);
      const n = pseudoNoise2D(x * 0.5, z * 0.5);
      const warm = smoothstep(-0.1, 0.9, n);

      if (biome === "gobi") {
        const t = Math.min((z - 22) / 24, 1);
        r = 0.79 + t * 0.1 + warm * 0.03 + rand(-0.015, 0.015);
        g = 0.68 + t * 0.06 + warm * 0.02 + rand(-0.015, 0.015);
        b = 0.4 - t * 0.07 + rand(-0.015, 0.015);
      } else if (biome === "river_plain" || (nearRiver && h < 3.5)) {
        r = 0.22 + warm * 0.05 + rand(-0.02, 0.02);
        g = 0.58 + warm * 0.1 + rand(-0.03, 0.03);
        b = 0.2 + warm * 0.05 + rand(-0.02, 0.02);
      } else if (biome === "forest") {
        r = 0.2 + warm * 0.04 + rand(-0.02, 0.02);
        g = 0.52 + warm * 0.1 + rand(-0.03, 0.03);
        b = 0.14 + warm * 0.04 + rand(-0.015, 0.015);
      } else if (biome === "high_alpine") {
        const t = Math.min((h - 18) / 12, 1);
        r = 0.76 + t * 0.19 + rand(-0.015, 0.015);
        g = 0.74 + t * 0.2 + rand(-0.015, 0.015);
        b = 0.72 + t * 0.22 + rand(-0.015, 0.015);
      } else if (biome === "mountain") {
        r = 0.32 + warm * 0.05 + rand(-0.03, 0.03);
        g = 0.48 + warm * 0.08 + rand(-0.03, 0.03);
        b = 0.22 + warm * 0.05 + rand(-0.025, 0.025);
      } else if (h > 3) {
        r = 0.38 + warm * 0.06 + rand(-0.03, 0.03);
        g = 0.56 + warm * 0.1 + rand(-0.03, 0.03);
        b = 0.2 + warm * 0.05 + rand(-0.02, 0.02);
      } else if (nearRiver && h < 3) {
        r = 0.22 + rand(-0.03, 0.03);
        g = 0.58 + rand(-0.04, 0.04);
        b = 0.2 + rand(-0.02, 0.02);
      } else {
        const gr = Math.max(0, 1 - h * 0.08);
        r = 0.32 + gr * -0.06 + warm * 0.04 + rand(-0.03, 0.03);
        g = 0.62 + gr * 0.14 + warm * 0.05 + rand(-0.03, 0.03);
        b = 0.22 + gr * 0.08 + rand(-0.02, 0.02);
      }
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.94,
        metalness: 0,
      }),
    );
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  buildRivers(): void {
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x3a7aaf,
      roughness: 0.04,
      metalness: 0.38,
      transparent: true,
      opacity: 0.88,
    });
    const tribMat = new THREE.MeshStandardMaterial({
      color: 0x4a8abc,
      roughness: 0.08,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100,
        rz = -28 + t * 55;
      const rx = -32 + Math.sin(rz * 0.08) * 6 + Math.sin(rz * 0.05 + 1) * 3;
      pts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.15, rz));
    }
    this.scene.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts),
          160,
          2.0,
          10,
          false,
        ),
        riverMat,
      ),
    );

    const tuulPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60,
        rz = -12 + t * 26;
      const rx = 2 + Math.sin(rz * 0.1) * 4 + Math.sin(rz * 0.07 + 0.5) * 2;
      tuulPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.12, rz));
    }
    this.scene.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(tuulPts),
          100,
          1.4,
          8,
          false,
        ),
        riverMat,
      ),
    );

    const selPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 50; i++) {
      const t = i / 50,
        rz = -28 - t * 22;
      const rx = -22 + Math.sin(rz * 0.06) * 8;
      selPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.12, rz));
    }
    this.scene.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(selPts),
          80,
          1.6,
          8,
          false,
        ),
        tribMat,
      ),
    );

    const kherPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60,
        rx = 12 + t * 60;
      const rz = -2 + Math.sin(rx * 0.045) * 5;
      kherPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.1, rz));
    }
    this.scene.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(kherPts),
          100,
          1.1,
          8,
          false,
        ),
        tribMat,
      ),
    );

    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1a5a8a,
      roughness: 0.02,
      metalness: 0.55,
      transparent: true,
      opacity: 0.93,
    });
    const lakeShape = new THREE.Shape();
    lakeShape.ellipse(0, 0, 5, 13, 0, Math.PI * 2, false, 0.15);
    const lake = new THREE.Mesh(
      new THREE.ShapeGeometry(lakeShape, 32),
      lakeMat,
    );
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-63, terrainHeight(-63, -44) + 0.25, -44);
    this.scene.add(lake);

    const uvsShape = new THREE.Shape();
    uvsShape.ellipse(0, 0, 7, 5, 0, Math.PI * 2, false, 0);
    const uvsLake = new THREE.Mesh(
      new THREE.ShapeGeometry(uvsShape, 24),
      lakeMat,
    );
    uvsLake.rotation.x = -Math.PI / 2;
    uvsLake.position.set(-98, terrainHeight(-98, -38) + 0.22, -38);
    this.scene.add(uvsLake);
  }

  buildBridge(): void {
    [
      [-32, -5],
      [2, 4],
    ].forEach(([bx, bz]) => {
      const by = terrainHeight(bx, bz);
      const bm = mkMat(0x7a5810, 0.8);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(7, 0.45, 3.5), bm);
      bridge.position.set(bx, by + 0.55, bz);
      bridge.castShadow = true;
      this.scene.add(bridge);
      [-3.5, 3.5].forEach((side) => {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(7, 0.28, 0.14),
          mkMat(0x6a4a0e, 0.85),
        );
        rail.position.set(bx, by + 1.0, bz + side * 0.44);
        this.scene.add(rail);
        for (let p = -3; p <= 3; p += 1.4) {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.13, 0.85, 0.13),
            mkMat(0x6a4a0e, 0.85),
          );
          post.position.set(bx + p, by + 0.82, bz + side * 0.44);
          this.scene.add(post);
        }
      });
    });
  }

  /** Гол нуурын эргийн зэгсний багц */
  private makeReedPatchAt(x: number, z: number, count: number): void {
    const reedColors = [0x6f8f42, 0x7d9a4b, 0x5f7f36, 0x94ab5f];
    const y = terrainHeight(x, z);
    if (y > 6) return;
    const g = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const blade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.03, rand(0.34, 0.9), 4),
        mkMat(reedColors[randInt(0, reedColors.length - 1)], 0.9),
      );
      blade.position.set(rand(-0.4, 0.4), rand(0.1, 0.38), rand(-0.4, 0.4));
      blade.rotation.z = rand(-0.25, 0.25);
      blade.rotation.x = rand(-0.2, 0.2);
      g.add(blade);
    }
    g.position.set(x, y, z);
    this.scene.add(g);
  }

  buildRiverReeds(): void {
    for (let i = 0; i < 180; i++) {
      const z = rand(-30, 24);
      const orkhonX = -32 + Math.sin(z * 0.08) * 6 + Math.sin(z * 0.05 + 1) * 3;
      const x = orkhonX + rand(-4.8, 4.8);
      if (terrainHeight(x, z) < 4.5) this.makeReedPatchAt(x, z, randInt(5, 11));
    }

    for (let i = 0; i < 120; i++) {
      const z = rand(-12, 14);
      const tuulX = 2 + Math.sin(z * 0.1) * 4 + Math.sin(z * 0.07 + 0.5) * 2;
      const x = tuulX + rand(-3.8, 3.8);
      if (terrainHeight(x, z) < 4.2) this.makeReedPatchAt(x, z, randInt(4, 9));
    }

    for (let i = 0; i < 70; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(8.5, 13.8);
      const x = -63 + Math.cos(a) * r;
      const z = -44 + Math.sin(a) * r * 1.8;
      this.makeReedPatchAt(x, z, randInt(5, 10));
    }
  }

  private makeTree(x: number, z: number, s = 1): void {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * s, 0.17 * s, 1.4 * s, 7),
      mkMat(0x4a3018, 0.95),
    );
    trunk.position.y = 0.7 * s;
    trunk.castShadow = true;
    g.add(trunk);
    [
      { color: 0x1a4e12, r: 1.3, h: 2.0, y: 1.4 },
      { color: 0x235e18, r: 1.0, h: 1.7, y: 2.8 },
      { color: 0x2a6a1e, r: 0.72, h: 1.4, y: 3.9 },
      { color: 0x1e5414, r: 0.42, h: 1.0, y: 5.0 },
    ].forEach((l) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(l.r * s, l.h * s, 7),
        mkMat(l.color, 0.88),
      );
      cone.position.y = l.y * s;
      cone.rotation.y = rand(0, Math.PI);
      cone.castShadow = true;
      g.add(cone);
    });
    g.position.set(x, terrainHeight(x, z), z);
    this.scene.add(g);
  }

  buildTrees(): void {
    // Хангайн нурууны ой
    for (let i = 0; i < 140; i++) {
      const x = rand(-70, -20),
        z = rand(-30, -5);
      const h = terrainHeight(x, z);
      if (h > 1.5 && h < 18)
        this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.6, 1.3));
    }
    // Хэнтийн ой
    for (let i = 0; i < 90; i++) {
      const x = rand(14, 52),
        z = rand(-26, -5);
      const h = terrainHeight(x, z);
      if (h > 1.0 && h < 14)
        this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.5, 1.1));
    }
    // Орхон голын хөвөөний ой
    for (let i = 0; i < 70; i++) {
      const z = rand(-28, 14);
      const rx = -32 + Math.sin(z * 0.08) * 6;
      const x = rx + rand(-10, 10);
      const h = terrainHeight(x, z);
      if (h > -0.5 && h < 5) this.makeTree(x, z, rand(0.4, 0.95));
    }
    // Хөвсгөлийн эргийн ой
    for (let i = 0; i < 60; i++) {
      const angle = rand(0, Math.PI * 2);
      const r = rand(12, 20);
      const x = -63 + Math.cos(angle) * r;
      const z = -44 + Math.sin(angle) * r * 2.5;
      this.makeTree(x, z, rand(0.6, 1.2));
    }
    // Тэрэлжийн ой
    for (let i = 0; i < 50; i++) {
      const x = rand(10, 24),
        z = rand(-14, -2);
      this.makeTree(x + rand(-1, 1), z + rand(-1, 1), rand(0.5, 1.0));
    }
    // Бэлчээрийн сийрэг бут
    for (let i = 0; i < 80; i++) {
      const x = rand(-130, 70),
        z = rand(-45, 20);
      const h = terrainHeight(x, z);
      if (h > 0.5 && h < 6) this.makeTree(x, z, rand(0.22, 0.5));
    }
  }

  // Гэр
  private makeGer(
    x: number,
    z: number,
    rotY = 0,
    s = 1,
    isStation = false,
    stationId = "",
  ): void {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8 * s, 2.9 * s, 0.3 * s, 24),
      mkMat(0x9a8860, 0.95),
    );
    base.position.y = 0.15;
    g.add(base);

    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 128;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#ede0c8";
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "#c4a878";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 36; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7.5, 0);
      ctx.lineTo(i * 7.5, 128);
      ctx.stroke();
    }
    ctx.strokeStyle = "#d4b888";
    ctx.lineWidth = 1;
    for (let j = 0; j < 6; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * 22);
      ctx.lineTo(256, j * 22);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7 * s, 2.7 * s, 2.2 * s, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: isStation ? 0xfff6ea : 0xede0c8,
        roughness: 0.65,
        map: tex,
      }),
    );
    wall.position.y = 1.1 * s + 0.3;
    g.add(wall);

    const roofColor = isStation
      ? stationId === this.currentStationId
        ? 0x22cc66
        : this.doneStationIds.includes(stationId)
          ? 0xffaa00
          : 0xcc4422
      : [0xc8724a, 0xb86838, 0xd47a50][randInt(0, 2)];
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8 * s, 1.6 * s, 24),
      mkMat(roofColor, 0.78),
    );
    roof.position.y = (2.2 + 0.8) * s + 0.3;
    g.add(roof);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4 * s, 0.12 * s, 10, 28),
      mkMat(0xd89030, 0.45, 0.4),
    );
    ring.position.y = (2.2 + 1.6) * s + 0.3;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const rp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.8, 4),
        mkMat(0xc8a058, 0.9),
      );
      rp.position.set(
        Math.sin(angle) * 1.5 * s,
        (2.2 + 0.8) * s + 0.3,
        Math.cos(angle) * 1.5 * s,
      );
      rp.rotation.z = Math.sin(angle) * 0.55;
      rp.rotation.x = -Math.cos(angle) * 0.55;
      g.add(rp);
    }

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.9 * s, 1.7 * s, 0.1 * s),
      mkMat(0x6a3a10, 0.8),
    );
    door.position.set(0, 0.85 * s + 0.3, 2.72 * s);
    g.add(door);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.05 * s, 1.85 * s, 0.06 * s),
      mkMat(0xd09030, 0.65, 0.15),
    );
    frame.position.set(0, 0.92 * s + 0.3, 2.75 * s);
    g.add(frame);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.8;
      const pat = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 * s, 0.12 * s, 0.06 * s),
        mkMat(isStation ? 0xf0c020 : 0xe05030, 0.8),
      );
      pat.position.set(
        Math.sin(angle) * 2.72 * s,
        1.8 * s + 0.3,
        Math.cos(angle) * 2.72 * s,
      );
      pat.rotation.y = -angle;
      g.add(pat);
    }

    if (isStation) {
      const mc =
        stationId === "home"
          ? 0x6dd6ff
          : stationId === this.currentStationId
            ? 0x44ff88
            : this.doneStationIds.includes(stationId)
              ? 0xffcc00
              : 0xff6644;
      const markerMat = new THREE.MeshStandardMaterial({
        color: mc,
        emissive: mc,
        emissiveIntensity: stationId === this.currentStationId ? 0.45 : 0.3,
        roughness: 0.25,
      });
      const marker = new THREE.Mesh(
        new THREE.TorusGeometry(1.5 * s, 0.13 * s, 10, 40),
        markerMat,
      );
      marker.userData.stationId = stationId;
      marker.position.y = (2.2 + 1.6 + 0.9) * s + 0.3;
      marker.rotation.x = Math.PI / 2;
      g.add(marker);
      this.markerMeshes.set(stationId, marker);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 * s, 10, 10),
        new THREE.MeshBasicMaterial({
          color: mc,
          transparent: true,
          opacity: stationId === this.currentStationId ? 0.1 : 0.07,
        }),
      );
      glow.position.y = (2.2 + 1.6 + 0.9) * s + 0.3;
      g.add(glow);

      if (stationId === this.currentStationId) {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 9, 10),
          new THREE.MeshBasicMaterial({
            color: 0x44ff88,
            transparent: true,
            opacity: 0.18,
          }),
        );
        beam.position.y = (2.2 + 1.6 + 5.5) * s + 0.3;
        g.add(beam);
      }

      this.labelAnchors.set(
        stationId,
        new THREE.Vector3(
          x,
          terrainHeight(x, z) + (2.2 + 1.6 + 0.9 + 2.8) * s + 0.3,
          z,
        ),
      );
    }

    g.position.set(x, terrainHeight(x, z), z);
    // Station gers: keep door consistently facing "forward" (+Z)
    // so doors/labels/picking feel predictable.
    g.rotation.y = isStation ? 0 : rotY;
    g.castShadow = true;
    g.receiveShadow = true;
    if (isStation && stationId) {
      door.userData.stationId = stationId;
      g.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      door.getWorldPosition(wp);
      // Slightly lift so label doesn't intersect the door mesh.
      wp.y += 0.25 * s;
      this.doorAnchors.set(stationId, wp);
    }
    this.scene.add(g);
  }

  private makeFence(
    cx: number,
    cz: number,
    w: number,
    d: number,
    rotY = 0,
  ): void {
    const g = new THREE.Group(),
      fm = mkMat(0x9a7840, 0.95);
    const pts: [number, number][] = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
      [-w / 2, -d / 2],
    ];
    for (let s = 0; s < 4; s++) {
      const [ax, az] = pts[s],
        [bx, bz] = pts[s + 1];
      const len = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2),
        mx = (ax + bx) / 2,
        mz = (az + bz) / 2,
        ry = Math.atan2(bx - ax, bz - az);
      [0.7, 0.4].forEach((py) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.07), fm);
        rail.position.set(mx, py, mz);
        rail.rotation.y = ry;
        g.add(rail);
      });
      const n = Math.max(2, Math.floor(len / 2.8));
      for (let i = 0; i <= n; i++) {
        const tt = i / n;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.075, 1.1, 6),
          fm,
        );
        post.position.set(ax + (bx - ax) * tt, 0.55, az + (bz - az) * tt);
        post.castShadow = true;
        g.add(post);
      }
    }
    g.position.set(cx, terrainHeight(cx, cz), cz);
    g.rotation.y = rotY;
    this.scene.add(g);
  }

  /** Player home base — single ger near the center (visual only). */
  buildPlayerHomeGer(gerLevel = 1): void {
    const s = 1 + Math.max(0, Math.min(gerLevel - 1, 20)) * 0.08;
    // Player home base — away from major stations.
    const x = 90;
    const z = 10;
    // Use station-style marker so it can be clicked (special-cased as "home").
    this.makeGer(x, z, 0, s, true, "home");
    // Small fence to hint “home yard”.
    this.makeFence(x + 1.2, z + 1.0, 9, 7, Math.PI * 0.2);
  }

  /** Spawn player's livestock near the home ger (visual only). */
  buildPlayerLivestockNearHome(
    livestock?: { sheep: number; horse: number; camel: number },
  ): void {
    if (!livestock) return;
    const x = 90;
    const z = 10;
    const sheepN = Math.max(0, Math.min(12, Math.floor(livestock.sheep)));
    const horseN = Math.max(0, Math.min(4, Math.floor(livestock.horse)));
    const camelN = Math.max(0, Math.min(3, Math.floor(livestock.camel)));

    // Simple sheep blobs.
    const sheepMat = mkMat(0xf1e7d5, 0.92);
    const hoofMat = mkMat(0x2a1508, 0.9);
    for (let i = 0; i < sheepN; i++) {
      const ox = rand(-5.2, 5.2);
      const oz = rand(3.2, 9.2);
      const y = terrainHeight(x + ox, z + oz);
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), sheepMat);
      body.scale.set(1.25, 1.0, 1.0);
      body.position.y = 0.45;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mkMat(0x6a3a10, 0.9));
      head.position.set(0.35, 0.55, 0);
      g.add(head);
      [-0.22, 0.22].forEach((lx) => {
        [-0.16, 0.16].forEach((lz) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.28, 6), hoofMat);
          leg.position.set(lx, 0.16, lz);
          g.add(leg);
        });
      });
      g.position.set(x + ox, y, z + oz);
      g.rotation.y = rand(0, Math.PI * 2);
      this.scene.add(g);
    }

    for (let i = 0; i < horseN; i++) {
      this.makeHorse(
        x + rand(-7, 7),
        z + rand(-6, 6),
        rand(0, Math.PI * 2),
        [0x6b3a1f, 0x8a6030, 0xc8a060][randInt(0, 2)],
        false,
      );
    }

    for (let i = 0; i < camelN; i++) {
      this.makeCamel(x + rand(-8, 8), z + rand(-8, 8), rand(0, Math.PI * 2));
    }
  }

  buildGerCamps(): void {
    [
      // УБ хавийн том хороолол
      { gx: 3, gz: 2, n: 7, sp: 14 },
      { gx: -5, gz: -2, n: 5, sp: 10 },
      { gx: 8, gz: 4, n: 4, sp: 9 },
      // Орхон хөндий
      { gx: -34, gz: -10, n: 5, sp: 12 },
      { gx: -30, gz: -2, n: 5, sp: 11 },
      { gx: -36, gz: 5, n: 4, sp: 9 },
      // Хархорум орчим
      { gx: -38, gz: 4, n: 5, sp: 10 },
      { gx: -34, gz: 9, n: 4, sp: 8 },
      // Арвайхээр орчим
      { gx: -38, gz: 18, n: 4, sp: 9 },
      // Баянхонгор
      { gx: -56, gz: 20, n: 4, sp: 10 },
      // Эрдэнэт
      { gx: -27, gz: -22, n: 4, sp: 9 },
      { gx: -23, gz: -18, n: 3, sp: 7 },
      // Мөрөн
      { gx: -63, gz: -32, n: 4, sp: 9 },
      { gx: -58, gz: -28, n: 3, sp: 8 },
      // Говь — сийрэг
      { gx: -5, gz: 28, n: 3, sp: 14 },
      { gx: 14, gz: 30, n: 2, sp: 10 },
      { gx: -20, gz: 40, n: 2, sp: 10 },
      { gx: 30, gz: 32, n: 2, sp: 9 },
      { gx: 42, gz: 44, n: 2, sp: 9 },
      // Зүүн тал
      { gx: 55, gz: 2, n: 3, sp: 10 },
      { gx: 65, gz: -20, n: 3, sp: 9 },
      { gx: 58, gz: 12, n: 2, sp: 8 },
      // Хэнтий
      { gx: 35, gz: 2, n: 4, sp: 9 },
      { gx: 48, gz: -12, n: 3, sp: 8 },
      // Баруун
      { gx: -80, gz: 0, n: 3, sp: 8 },
      { gx: -80, gz: 16, n: 3, sp: 9 },
      { gx: -100, gz: -6, n: 3, sp: 8 },
      { gx: -98, gz: -36, n: 2, sp: 7 },
    ].forEach(({ gx, gz, n, sp }) => {
      for (let i = 0; i < n; i++) {
        const x = gx + rand(-sp / 2, sp / 2),
          z = gz + rand(-sp / 2, sp / 2);
        this.makeGer(x, z, rand(0, Math.PI * 2), rand(0.8, 1.15));
        if (Math.random() > 0.4)
          this.makeFence(
            x,
            z,
            rand(7, 12),
            rand(6, 10),
            rand(0, Math.PI * 0.5),
          );
      }
    });
  }

  buildNomadDetails(): void {
    const cartMat = mkMat(0x7a5a2a, 0.9);
    const wheelMat = mkMat(0x553515, 0.88);
    const feltMat = mkMat(0xdac8a4, 0.85);

    const makeCart = (x: number, z: number): void => {
      const g = new THREE.Group();
      const by = terrainHeight(x, z);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.28, 1.2),
        cartMat,
      );
      base.position.y = 0.86;
      g.add(base);
      const cover = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 1.45, 10, 1, true),
        feltMat,
      );
      cover.rotation.z = Math.PI / 2;
      cover.position.y = 1.28;
      g.add(cover);
      [
        [-0.65, -0.56],
        [0.65, -0.56],
        [-0.65, 0.56],
        [0.65, 0.56],
      ].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.29, 0.29, 0.08, 12),
          wheelMat,
        );
        wheel.position.set(wx, 0.34, wz);
        wheel.rotation.x = Math.PI / 2;
        g.add(wheel);
      });
      g.position.set(x, by, z);
      g.rotation.y = rand(0, Math.PI * 2);
      this.scene.add(g);
    };

    const makeFire = (x: number, z: number): void => {
      const y = terrainHeight(x, z);
      const stones = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const r = 0.55 + rand(-0.08, 0.08);
        const st = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rand(0.08, 0.17), 0),
          mkMat(0x8b8372, 0.97),
        );
        st.position.set(x + Math.cos(a) * r, y + 0.08, z + Math.sin(a) * r);
        this.scene.add(st);
        stones.add(st);
      }
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff9933,
          emissive: 0xff5511,
          emissiveIntensity: 0.8,
          roughness: 0.6,
        }),
      );
      ember.position.set(x, y + 0.18, z);
      this.scene.add(ember);
    };

    const detailSeeds: Array<[number, number, "cart" | "fire" | "ovoo"]> = [
      [2, 2, "cart"],
      [-4, -2, "fire"],
      [-31, -8, "cart"],
      [-36, 4, "fire"],
      [35, 1, "ovoo"],
      [58, -18, "cart"],
      [-62, -30, "fire"],
      [-84, 13, "ovoo"],
      [0, 31, "cart"],
      [30, 32, "fire"],
    ];

    detailSeeds.forEach(([x, z, t]) => {
      if (t === "cart") makeCart(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5));
      else if (t === "fire") makeFire(x + rand(-1.0, 1.0), z + rand(-1.0, 1.0));
      else this.makeOvoo(x + rand(-2.0, 2.0), z + rand(-2.0, 2.0));
    });
  }

  /** Станцын эргэн тойронд нэг багц өвс (бэлчээр / ой / говь) */
  private makeGrassClumpAt(x: number, z: number): void {
    const h = terrainHeight(x, z);
    if (h > 11 || h < -0.6) return;
    const biome = terrainBiome(x, z, h);
    if (biome === "high_alpine") return;
    const isGobi = biome === "gobi";
    const isForest = biome === "forest" || biome === "river_plain";
    const g = new THREE.Group();
    const bladeCount = isForest
      ? randInt(5, 9)
      : isGobi
        ? randInt(2, 5)
        : randInt(3, 7);
    for (let b = 0; b < bladeCount; b++) {
      const bx = rand(-0.35, 0.35);
      const bz = rand(-0.35, 0.35);
      const grassCols = isGobi
        ? [0x9aaa60, 0x8a9a50, 0xaaaa68]
        : isForest
          ? [0x3f6f25, 0x4a7d2c, 0x588838, 0x6e9a4a]
          : [0x5a8830, 0x4a7820, 0x6a9840, 0x7aaa50];
      const blade = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.02,
          0.04,
          rand(0.18, isGobi ? 0.38 : isForest ? 0.72 : 0.62),
          4,
        ),
        mkMat(grassCols[randInt(0, grassCols.length - 1)], 0.9),
      );
      blade.position.set(bx, rand(0.09, 0.3), bz);
      blade.rotation.z = rand(-0.35, 0.35);
      blade.rotation.x = rand(-0.22, 0.22);
      g.add(blade);
    }
    g.position.set(x, h, z);
    this.scene.add(g);
  }

  private scatterGrassClumps(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.15, radius);
      this.makeGrassClumpAt(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
    }
  }

  private scatterPeripheryTrees(
    cx: number,
    cz: number,
    count: number,
    radius: number,
    scaleMin: number,
    scaleMax: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.2, radius);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      const h = terrainHeight(x, z);
      if (h > 19 || h < -0.8) continue;
      if (terrainBiome(x, z, h) === "gobi" && Math.random() > 0.35) continue;
      this.makeTree(x, z, rand(scaleMin, scaleMax));
    }
  }

  private scatterPeripheryRocks(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.22, radius);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      const h = terrainHeight(x, z);
      if (terrainBiome(x, z, h) === "river_plain" && h < 2.4) continue;
      const rg = new THREE.Group();
      const n = randInt(1, 4);
      const nearMtn = h > 5;
      for (let j = 0; j < n; j++) {
        const size = nearMtn ? rand(0.28, 1.15) : rand(0.16, 0.72);
        const rm = new THREE.Mesh(
          new THREE.DodecahedronGeometry(size * rand(0.55, 1.45), 0),
          mkMat(nearMtn ? 0x787060 : 0x888070, 0.96),
        );
        rm.position.set(rand(-0.75, 0.75), rand(0, 0.42), rand(-0.75, 0.75));
        rm.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        rm.castShadow = true;
        rg.add(rm);
      }
      rg.position.set(x, h, z);
      this.scene.add(rg);
    }
  }

  private scatterPeripheryOvoos(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = (i / Math.max(1, count)) * Math.PI * 2 + rand(-0.4, 0.4);
      const r = rand(radius * 0.35, radius);
      this.makeOvoo(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
    }
  }

  private scatterPeripheryDecorGers(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.3, radius);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (Math.hypot(x - cx, z - cz) < 7) continue;
      this.makeGer(x, z, rand(0, Math.PI * 2), rand(0.82, 1.12));
    }
  }

  private scatterPeripheryCamels(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.25, radius);
      this.makeCamel(
        cx + Math.cos(a) * r,
        cz + Math.sin(a) * r,
        rand(0, Math.PI * 2),
      );
    }
  }

  private scatterPeripheryHorses(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.25, radius);
      this.makeHorse(
        cx + Math.cos(a) * r,
        cz + Math.sin(a) * r,
        rand(0, Math.PI * 2),
        HORSE_COLORS[randInt(0, HORSE_COLORS.length - 1)],
        false,
      );
    }
  }

  private scatterPeripheryReeds(
    cx: number,
    cz: number,
    count: number,
    radius: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(radius * 0.2, radius);
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (terrainHeight(x, z) > 5.5) continue;
      this.makeReedPatchAt(x, z, randInt(5, 11));
    }
  }

  /** Станц бүрийн газарзүйд тохирсон нэмэлт орчин */
  private decorateStationPeriphery(
    stationId: string,
    cx: number,
    cz: number,
  ): void {
    const p = STATION_PERIPHERY[stationId];
    if (!p) return;

    const tr = p.treeRadius ?? 30;
    const smin = p.treeScaleMin ?? 0.45;
    const smax = p.treeScaleMax ?? 1.05;
    if (p.trees && p.trees > 0)
      this.scatterPeripheryTrees(cx, cz, p.trees, tr, smin, smax);

    if (p.decorGers && p.decorGers > 0)
      this.scatterPeripheryDecorGers(cx, cz, p.decorGers, p.gerRadius ?? 32);

    if (p.camels && p.camels > 0)
      this.scatterPeripheryCamels(cx, cz, p.camels, p.camelRadius ?? 34);

    if (p.horses && p.horses > 0)
      this.scatterPeripheryHorses(cx, cz, p.horses, p.horseRadius ?? 32);

    if (p.rocks && p.rocks > 0)
      this.scatterPeripheryRocks(cx, cz, p.rocks, p.rockRadius ?? 30);

    if (p.ovoos && p.ovoos > 0)
      this.scatterPeripheryOvoos(cx, cz, p.ovoos, p.ovooRadius ?? 24);

    if (p.grassClumps && p.grassClumps > 0)
      this.scatterGrassClumps(cx, cz, p.grassClumps, p.grassRadius ?? 34);

    if (p.reedPatches && p.reedPatches > 0)
      this.scatterPeripheryReeds(cx, cz, p.reedPatches, p.reedRadius ?? 36);
  }

  buildStationGers(stations: UrtuuStation[]): void {
    const MONASTERY_IDS = [
      "zuunmod",
      "kharakhorum",
      "erdenet",
      "mandalgovi",
      "sainshand",
    ];
    const MOUNTAIN_IDS = ["uliastai", "altai", "ondorhaan", "moron"];
    const LAKE_IDS = ["khatgal", "ulaangom", "bayankhongor"];
    const SAND_IDS = ["dalanzadgad"];
    const PALACE_IDS = ["ulaanbaatar"];
    const ROCK_IDS = ["nalaikh", "zamiin_uud"];
    const NATPARK_IDS = ["darkhan", "terelj"];

    stations.forEach((s) => {
      const cfg = STATION_CONFIGS[s.id];
      if (!cfg) return;
      const x = cfg.wx * WORLD_SCALE,
        z = cfg.wz * WORLD_SCALE;
      const cur = s.id === this.currentStationId;
      const done = this.doneStationIds.includes(s.id);

      if (PALACE_IDS.includes(s.id)) this.makePalace(x, z, s.id, cur, done);
      else if (MONASTERY_IDS.includes(s.id))
        this.makeMonastery(x, z, s.id, cur, done);
      else if (MOUNTAIN_IDS.includes(s.id))
        this.makeMountainShrine(x, z, s.id, cur, done);
      else if (LAKE_IDS.includes(s.id))
        this.makeLakeStation(x, z, s.id, cur, done);
      else if (SAND_IDS.includes(s.id))
        this.makeSandDunes(x, z, s.id, cur, done);
      else if (ROCK_IDS.includes(s.id))
        this.makeRockSite(x, z, s.id, cur, done);
      else if (NATPARK_IDS.includes(s.id))
        this.makeNatPark(x, z, s.id, cur, done);
      else {
        // Slightly smaller stations so gers don't visually "stick together".
        this.makeGer(x, z, rand(0, Math.PI * 2), 1.25, true, s.id);
        for (let i = 0; i < 3; i++) {
          const ox = rand(-9, 9),
            oz = rand(-9, 9);
          if (Math.abs(ox) < 4 && Math.abs(oz) < 4) continue;
          this.makeGer(x + ox, z + oz, rand(0, Math.PI * 2), rand(0.9, 1.1));
        }
        this.makeFence(x, z, 18, 15, rand(0, Math.PI * 0.3));
        this.makeOvoo(x + 5, z + 4);
      }
      this.decorateStationPeriphery(s.id, x, z);
    });
  }

  private makePalace(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const g = new THREE.Group();
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;
    const sc = 1.4;
    const wallMat = mkMat(0xc8a060, 0.85);
    const roofMat = mkMat(0x8b2020, 0.75);

    (
      [
        [28 * sc, 0.8 * sc, 3.0 * sc, 0, -12 * sc],
        [28 * sc, 0.8 * sc, 3.0 * sc, 0, +12 * sc],
        [0.8 * sc, 24 * sc, 3.0 * sc, -14 * sc, 0],
        [0.8 * sc, 24 * sc, 3.0 * sc, +14 * sc, 0],
      ] as [number, number, number, number, number][]
    ).forEach(([w, d, h, px, pz]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(px, h / 2, pz);
      wall.castShadow = true;
      g.add(wall);
      const wr = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.4, 0.4, d + 1.2),
        roofMat,
      );
      wr.position.set(px, h + 0.2, pz);
      g.add(wr);
    });

    (
      [
        [5.2 * sc, 2.5 * sc, 4.8 * sc],
        [3.8 * sc, 2.0 * sc, 3.4 * sc],
        [2.6 * sc, 1.5 * sc, 2.2 * sc],
      ] as [number, number, number][]
    ).forEach(([bw, bh, bd], i) => {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        mkMat(0xeee0c0, 0.7),
      );
      base.position.set(0, bh / 2 + i * 2.4 * sc, 0);
      base.castShadow = true;
      g.add(base);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(bw * 0.68 * sc, bh * 0.8 * sc, 4),
        roofMat,
      );
      roof.position.set(0, bh + i * 2.4 * sc + bh * 0.4 * sc, 0);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      g.add(roof);
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(bw + 0.3, 0.25, bd + 0.3),
        mkMat(0xd4a020, 0.5, 0.3),
      );
      trim.position.set(0, bh + i * 2.4 * sc, 0);
      g.add(trim);
    });

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.25, 4 * sc, 6),
      mkMat(0xd4a020, 0.3, 0.6),
    );
    spire.position.set(0, 3 * 2.4 * sc + 2 * sc, 0);
    g.add(spire);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.45 * sc, 12, 10),
      mkMat(0xffd700, 0.2, 0.8),
    );
    ball.position.set(0, 3 * 2.4 * sc + 6 * sc, 0);
    g.add(ball);

    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(3.5 * sc, 4.0 * sc, 0.5 * sc),
      mkMat(0x5a3010, 0.8),
    );
    gate.position.set(0, 2.0 * sc, -12 * sc - 0.4);
    g.add(gate);
    const gateTop = new THREE.Mesh(
      new THREE.ConeGeometry(2.2 * sc, 1.8 * sc, 4),
      roofMat,
    );
    gateTop.rotation.y = Math.PI / 4;
    gateTop.position.set(0, 4.5 * sc, -12 * sc - 0.4);
    g.add(gateTop);

    this._stationMarker(g, id, 0, 3 * 2.4 * sc + 9 * sc, 0, sc, mc, cur);
    this.labelAnchors.set(
      id,
      new THREE.Vector3(x, hy + 3 * 2.4 * sc + 13 * sc, z),
    );
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeMonastery(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const g = new THREE.Group();
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;
    const sc = 1.2;
    const wallMat = mkMat(0xf5e8d0, 0.72);
    const roofMat = mkMat(0xc8781a, 0.65);
    const goldMat = mkMat(0xd4a020, 0.35, 0.5);

    (
      [
        [20 * sc, 0.6, 2.5, 0, -9 * sc],
        [20 * sc, 0.6, 2.5, 0, +9 * sc],
        [0.6, 18 * sc, 2.5, -10 * sc, 0],
        [0.6, 18 * sc, 2.5, +10 * sc, 0],
      ] as [number, number, number, number, number][]
    ).forEach(([w, d, h, px, pz]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(px, h / 2, pz);
      wall.castShadow = true;
      g.add(wall);
    });

    (
      [
        [6 * sc, 1.8 * sc, 5 * sc],
        [4.5 * sc, 1.6 * sc, 3.8 * sc],
        [3.0 * sc, 1.4 * sc, 2.6 * sc],
      ] as [number, number, number][]
    ).forEach(([w, h, d], i) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      body.position.set(0, h / 2 + i * 1.8 * sc, 0);
      body.castShadow = true;
      g.add(body);
      const rx = w + 1.2,
        rz = d + 1.2;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(rx, 0.5, rz), roofMat);
      roof.position.set(0, h + i * 1.8 * sc, 0);
      g.add(roof);
      const rCone = new THREE.Mesh(
        new THREE.ConeGeometry(rx * 0.62, h * 1.1, 4),
        roofMat,
      );
      rCone.position.set(0, h * 0.5 + i * 1.8 * sc + h * 0.6, 0);
      rCone.rotation.y = Math.PI / 4;
      g.add(rCone);
    });

    const stupa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.35, 2.5 * sc, 8),
      goldMat,
    );
    stupa.position.set(0, 3 * 1.8 * sc + 2.0 * sc, 0);
    g.add(stupa);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 * sc, 10, 8),
      goldMat,
    );
    orb.position.set(0, 3 * 1.8 * sc + 3.8 * sc, 0);
    g.add(orb);

    [-4 * sc, 4 * sc].forEach((px) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 7 * sc, 6),
        mkMat(0x4a300c, 0.9),
      );
      pole.position.set(px, 3.5 * sc, -9 * sc + 1);
      g.add(pole);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.9),
        new THREE.MeshStandardMaterial({
          color: px < 0 ? 0xcc2222 : 0x2222cc,
          side: THREE.DoubleSide,
          roughness: 0.9,
        }),
      );
      flag.position.set(px + 1.0, 6.6 * sc, -9 * sc + 1);
      flag.rotation.y = 0.15;
      g.add(flag);
    });

    [-6 * sc, 6 * sc].forEach((ox) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.1, 1.2, 12),
        wallMat,
      );
      base.position.set(ox, 0.6, 6 * sc);
      g.add(base);
      const bell = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
        wallMat,
      );
      bell.position.set(ox, 1.8, 6 * sc);
      g.add(bell);
      const spi = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.8, 8), goldMat);
      spi.position.set(ox, 3.2, 6 * sc);
      g.add(spi);
    });

    this._stationMarker(g, id, 0, 3 * 1.8 * sc + 6 * sc, 0, sc, mc, cur);
    this.labelAnchors.set(
      id,
      new THREE.Vector3(x, hy + 3 * 1.8 * sc + 9 * sc, z),
    );
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeMountainShrine(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const g = new THREE.Group();
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;

    (
      [
        [8, 10, 7, 0x9a9080],
        [6, 8, 5, 0xa8a090],
        [4, 6, 4, 0xb8b0a0],
        [2.5, 5, 3, 0xccc8c0],
        [1.5, 4, 2, 0xddd8d0],
      ] as [number, number, number, number][]
    ).forEach(([r, h, , color], i) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, randInt(5, 7)),
        mkMat(color, 0.95),
      );
      m.position.y = i * 4.0 + h / 2;
      m.rotation.y = rand(0, Math.PI);
      m.castShadow = true;
      g.add(m);
    });
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(2.0, 3.5, 8),
      mkMat(0xeef4ff, 0.55),
    );
    snow.position.y = 4 * 4.0 + 4 + 3.5 / 2;
    g.add(snow);

    // Жижиг сүм
    const shrine = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.2, 2.0),
      mkMat(0xf0e4cc, 0.72),
    );
    shrine.position.set(5, 1.1, 3);
    g.add(shrine);
    const sRoof = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 1.5, 4),
      mkMat(0x8b2020, 0.7),
    );
    sRoof.rotation.y = Math.PI / 4;
    sRoof.position.set(5, 3.1, 3);
    g.add(sRoof);

    this.makeOvoo(x + 2, z + 2);
    this._stationMarker(g, id, 0, 4 * 4.0 + 12, 0, 1.2, mc, cur);
    this.labelAnchors.set(id, new THREE.Vector3(x, hy + 4 * 4.0 + 16, z));
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeLakeStation(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;
    const g = new THREE.Group();

    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1a5fa8,
      roughness: 0.03,
      metalness: 0.65,
      transparent: true,
      opacity: 0.88,
    });
    const lakeShape = new THREE.Shape();
    lakeShape.ellipse(0, 0, 10, 6, 0, Math.PI * 2, false, 0.3);
    const lakeMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(lakeShape, 24),
      lakeMat,
    );
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.position.y = 0.2;
    g.add(lakeMesh);

    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.3, 0.9), 0),
        mkMat(0x8a8878, 0.95),
      );
      rock.position.set(
        9.5 * Math.cos(ang) + rand(-1.5, 1.5),
        rand(0, 0.4),
        5.8 * Math.sin(ang) + rand(-1.5, 1.5),
      );
      rock.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      g.add(rock);
    }
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      this.makeTree(
        x + 12 * Math.cos(ang) + rand(-2, 2),
        z + 7.5 * Math.sin(ang) + rand(-2, 2),
        rand(0.6, 1.0),
      );
    }

    this.makeGer(x + 3, z + 8, rand(0, Math.PI * 2), 1.4, true, id);
    this.makeFence(x + 3, z + 8, 12, 10, 0.2);
    this._stationMarker(g, id, 3, 12, 8, 1.0, mc, cur);
    this.labelAnchors.set(id, new THREE.Vector3(x + 3, hy + 15, z + 8));
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeSandDunes(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;
    const g = new THREE.Group();
    const sandMat = mkMat(0xd4b060, 0.96);

    (
      [
        [0, 0, 9, 6, 6],
        [-7, -2, 7, 5, 4.5],
        [7, 3, 8, 6, 5],
        [-3, 5, 6, 4, 3.5],
        [4, -4, 5, 4, 3],
      ] as [number, number, number, number, number][]
    ).forEach(([dx, dz, rx, rz, h]) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 8),
        sandMat,
      );
      sphere.scale.set(rx, h * 0.35, rz);
      sphere.position.set(dx, h * 0.35, dz);
      sphere.castShadow = true;
      g.add(sphere);
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(rx * 0.5, h * 0.7, 10),
        sandMat,
      );
      top.position.set(dx, h * 0.7, dz);
      top.rotation.y = rand(0, Math.PI);
      g.add(top);
    });

    const boneMat = mkMat(0xf0e0b8, 0.7);
    (
      [
        [0, 2, 2.5],
        [1.5, 2, 1],
        [3, 2, 1.5],
      ] as [number, number, number][]
    ).forEach(([bx, by, bz]) => {
      const bone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6),
        boneMat,
      );
      bone.position.set(bx, by, bz);
      bone.rotation.z = rand(0.3, 0.8);
      g.add(bone);
    });

    this.makeCamel(x + 4, z - 3, rand(0, Math.PI * 2));
    this.makeGer(x - 5, z + 5, rand(0, Math.PI * 2), 1.2, true, id);
    this._stationMarker(g, id, -5, 12, 5, 1.0, mc, cur);
    this.labelAnchors.set(id, new THREE.Vector3(x - 5, hy + 14, z + 5));
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeRockSite(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;
    const g = new THREE.Group();

    (
      [
        [0, 3.5],
        [3, 2.5],
        [-2, 3],
        [-3, 2],
        [2, 2.5],
        [0.5, 1.8],
      ] as [number, number][]
    ).forEach(([rx, rs], i) => {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rs, 0),
        mkMat(i % 2 === 0 ? 0x787060 : 0x8a8070, 0.95),
      );
      rock.position.set(rx, rs * 0.4, i % 2 === 0 ? 0 : 2);
      rock.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      rock.castShadow = true;
      g.add(rock);
    });
    for (let i = 0; i < 20; i++) {
      const sm = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.2, 0.8), 0),
        mkMat(0x908878, 0.96),
      );
      sm.position.set(rand(-8, 8), rand(0, 0.3), rand(-8, 8));
      sm.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      g.add(sm);
    }

    this.makeGer(x + 5, z - 4, rand(0, Math.PI * 2), 1.3, true, id);
    this.makeFence(x + 5, z - 4, 12, 10, 0.1);
    this.makeOvoo(x - 5, z + 3);
    this._stationMarker(g, id, 5, 11, -4, 1.0, mc, cur);
    this.labelAnchors.set(id, new THREE.Vector3(x + 5, hy + 14, z - 4));
    g.position.set(x, hy, z);
    this.scene.add(g);
  }

  private makeNatPark(
    x: number,
    z: number,
    id: string,
    cur: boolean,
    done: boolean,
  ): void {
    const hy = terrainHeight(x, z);
    const mc = cur ? 0x44ff88 : done ? 0xffcc00 : 0xff6644;

    for (let i = 0; i < 20; i++) {
      this.makeTree(x + rand(-12, 12), z + rand(-10, 10), rand(0.7, 1.2));
    }

    const springMat = new THREE.MeshStandardMaterial({
      color: 0x4a9ad4,
      roughness: 0.05,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const spring = new THREE.Mesh(new THREE.CircleGeometry(2.5, 20), springMat);
    spring.rotation.x = -Math.PI / 2;
    spring.position.set(x - 3, hy + 0.2, z + 2);
    this.scene.add(spring);

    this.makeHorse(x + 5, z + 3, rand(0, Math.PI * 2), 0xb8622a, false);

    this.makeGer(x + 2, z - 6, rand(0, Math.PI * 2), 1.4, true, id);
    this.makeFence(x + 2, z - 6, 14, 12, 0.2);
    this.makeOvoo(x + 7, z - 2);

    const sg = new THREE.Group();
    this._stationMarker(sg, id, 2, 11, -6, 1.0, mc, cur);
    sg.position.set(x, hy, z);
    this.scene.add(sg);
    this.labelAnchors.set(id, new THREE.Vector3(x + 2, hy + 14, z - 6));
  }

  private _stationMarker(
    g: THREE.Group,
    id: string,
    lx: number,
    ly: number,
    lz: number,
    sc: number,
    mc: number,
    cur: boolean,
  ): void {
    const mat = new THREE.MeshStandardMaterial({
      color: mc,
      emissive: mc,
      emissiveIntensity: cur ? 0.45 : 0.3,
      roughness: 0.25,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6 * sc, 0.14 * sc, 10, 40),
      mat,
    );
    ring.position.set(lx, ly, lz);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    this.markerMeshes.set(id, ring);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.55 * sc, 10, 10),
      new THREE.MeshBasicMaterial({
        color: mc,
        transparent: true,
        opacity: cur ? 0.1 : 0.07,
      }),
    );
    glow.position.set(lx, ly, lz);
    g.add(glow);
    if (cur) {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0x44ff88,
          transparent: true,
          opacity: 0.18,
        }),
      );
      beam.position.set(lx, ly + 5, lz);
      g.add(beam);
    }
  }

  makeOvoo(x: number, z: number): void {
    const g = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const r = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.28, 0.72), 0),
        mkMat(0x908878, 0.96),
      );
      r.position.set(rand(-0.7, 0.7), rand(0, 1.1), rand(-0.7, 0.7));
      r.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
      r.castShadow = true;
      g.add(r);
    }
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 4, 8),
      mkMat(0x4a3010, 0.9),
    );
    pole.position.y = 2.5;
    g.add(pole);
    [
      [0xcc1818, 0],
      [0x1818cc, 0.6],
      [0xf0c010, 1.1],
      [0x18aa18, 1.55],
      [0xcc18cc, 2.0],
    ].forEach(([col, off]) => {
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.55),
        new THREE.MeshStandardMaterial({
          color: col as number,
          side: THREE.DoubleSide,
          roughness: 0.88,
        }),
      );
      flag.position.set(0.52, 4.6 - (off as number) * 0.5, 0);
      flag.rotation.y = 0.2;
      g.add(flag);
    });
    g.position.set(x, terrainHeight(x, z), z);
    this.scene.add(g);
  }

  buildMountains(): void {
    [
      [-45, -20, 22, 16],
      [-32, -16, 18, 13],
      [-55, -26, 26, 18],
      [-60, -22, 24, 16],
      [-40, -28, 20, 14],
      [-25, -12, 16, 11],
      [-68, -16, 28, 20],
      [-50, -10, 20, 13],
      [-38, -22, 18, 12],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, randInt(5, 8)),
        mkMat(h > 20 ? 0xbcc0d8 : 0x9a9080, 0.94),
      );
      m.position.set(x, terrainHeight(x, z) + h / 2 - 3, z);
      m.rotation.y = rand(0, Math.PI);
      m.castShadow = true;
      this.scene.add(m);
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.28, h * 0.34, 8),
        mkMat(0xeef2ff, 0.62),
      );
      snow.position.set(x, terrainHeight(x, z) + h - h * 0.18, z);
      this.scene.add(snow);
    });

    [
      [-90, 2, 30, 22],
      [-84, 8, 26, 18],
      [-96, -2, 28, 20],
      [-88, -10, 24, 16],
      [-80, 14, 24, 17],
      [-102, 6, 26, 18],
      [-92, 18, 22, 15],
      [-84, -6, 20, 14],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, randInt(5, 8)),
        mkMat(h > 24 ? 0xaab0cc : 0x8a8472, 0.94),
      );
      m.position.set(x, terrainHeight(x, z) + h / 2 - 3, z);
      m.rotation.y = rand(0, Math.PI);
      m.castShadow = true;
      this.scene.add(m);
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.3, h * 0.36, 8),
        mkMat(0xe8ecff, 0.6),
      );
      snow.position.set(x, terrainHeight(x, z) + h - h * 0.2, z);
      this.scene.add(snow);
    });

    // Хэнтийн нуруу
    [
      [28, -18, 16, 11],
      [20, -14, 14, 10],
      [38, -22, 18, 13],
      [45, -16, 14, 10],
      [34, -10, 12, 9],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 7),
        mkMat(0xa09888, 0.94),
      );
      m.position.set(x, terrainHeight(x, z) + h / 2 - 2, z);
      m.rotation.y = rand(0, Math.PI);
      m.castShadow = true;
      this.scene.add(m);
    });

    // Говийн Алтай
    [
      [-70, 20, 18, 13],
      [-60, 26, 14, 11],
      [-78, 24, 20, 14],
      [-65, 32, 13, 10],
      [-75, 14, 16, 11],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 6),
        mkMat(0x9a9070, 0.96),
      );
      m.position.set(x, terrainHeight(x, z) + h / 2 - 2, z);
      m.rotation.y = rand(0, Math.PI);
      m.castShadow = true;
      this.scene.add(m);
    });

    // Бэлчээрийн бага толгодууд
    [
      [-12, 8, 5, 5],
      [18, 6, 5, 4],
      [-22, 14, 6, 5],
      [28, 4, 4, 4],
      [-38, 18, 6, 5],
      [12, -4, 5, 4],
      [52, 6, 4, 4],
      [-48, 4, 5, 4],
      [62, 12, 4, 4],
      [-8, -8, 5, 4],
      [22, -10, 5, 4],
      [42, 20, 4, 4],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 7),
        mkMat(0xa09878, 0.94),
      );
      m.position.set(x, terrainHeight(x, z) + h / 2 - 1.5, z);
      m.rotation.y = rand(0, Math.PI);
      this.scene.add(m);
    });
  }

  //Морь
  makeHorse(
    x: number,
    z: number,
    rotY = 0,
    color = 0x6b3a1f,
    animate = false,
    orbitCx = 0,
    orbitCz = 0,
    orbitR = 5,
    phase = 0,
  ): THREE.Group {
    const g = new THREE.Group();
    const hm = mkMat(color, 0.82),
      dk = mkMat(0x2a1508, 0.88);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.42), hm);
    body.position.y = 0.9;
    body.rotation.z = 0.04;
    g.add(body);
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.58, 9),
      hm,
    );
    neck.position.set(0.42, 1.15, 0);
    neck.rotation.z = -0.52;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.25), hm);
    head.position.set(0.68, 1.38, 0);
    g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), hm);
    snout.position.set(0.9, 1.31, 0);
    g.add(snout);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      mkMat(0x0a0a0a, 0.2),
    );
    eye.position.set(0.79, 1.41, 0.11);
    g.add(eye);
    const legGroups: THREE.Group[] = [];
    [
      [0.3, 0, -0.15],
      [0.3, 0, 0.15],
      [-0.3, 0, -0.15],
      [-0.3, 0, 0.15],
    ].forEach(([lx, , lz]) => {
      const lg = new THREE.Group();
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8),
        hm,
      );
      upper.position.y = -0.21;
      lg.add(upper);
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.048, 0.38, 8),
        hm,
      );
      lower.position.y = -0.6;
      lg.add(lower);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.16), dk);
      hoof.position.y = -0.82;
      lg.add(hoof);
      lg.position.set(lx, 0.75, lz);
      g.add(lg);
      legGroups.push(lg);
    });
    (g as any)._legGroups = legGroups;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.75, 8), dk);
    tail.position.set(-0.56, 0.95, 0);
    tail.rotation.z = 1.35;
    g.add(tail);
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.2), dk);
    mane.position.set(0.44, 1.25, 0);
    mane.rotation.z = -0.32;
    g.add(mane);
    g.position.set(x, terrainHeight(x, z), z);
    g.rotation.y = rotY;
    g.scale.setScalar(rand(0.85, 1.1));
    g.castShadow = true;
    this.scene.add(g);
    if (animate)
      this.horses.push({
        group: g,
        baseRot: rotY,
        speed: rand(0.35, 0.85),
        orbitR,
        orbitCx,
        orbitCz,
        phase,
      });
    return g;
  }

  makeRider(parent: THREE.Group): void {
    const coatColors = [0x8b2020, 0x1a4a8a, 0x2a6a2a, 0x6a4a1a, 0x6a1a6a];
    const coat = mkMat(coatColors[randInt(0, 4)], 0.85),
      skin = mkMat(0xc89060, 0.9);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.24), coat);
    torso.position.set(0, 1.58, 0);
    parent.add(torso);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 9, 9), skin);
    hd.position.set(0, 1.92, 0);
    parent.add(hd);
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.14, 12),
      mkMat(0x1a1a1a, 0.9),
    );
    hat.position.set(0, 2.05, 0);
    parent.add(hat);
    [
      [-0.22, 0.08],
      [0.22, 0.08],
    ].forEach(([sx, sz]) => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.32, 6),
        coat,
      );
      arm.position.set(sx * 1.5, 1.62, sz);
      arm.rotation.z = sx > 0 ? 0.85 : -0.85;
      arm.rotation.x = 0.35;
      parent.add(arm);
    });
  }

  buildHorses(): void {
    // Аймаг тус бүрийн орчимд сүрэг
    [
      { x: 4, z: 2 },
      { x: -6, z: 5 },
      { x: 10, z: -2 },
      { x: -10, z: 2 },
      { x: -32, z: -10 },
      { x: -28, z: -4 },
      { x: -36, z: 4 },
      { x: -34, z: -18 },
      { x: 35, z: 0 },
      { x: 28, z: -8 },
      { x: 42, z: -10 },
      { x: 52, z: -20 },
      { x: 60, z: -22 },
      { x: 55, z: 8 },
      { x: 62, z: 4 },
      { x: -62, z: -30 },
      { x: -56, z: -24 },
      { x: -65, z: -18 },
      { x: -80, z: 0 },
      { x: -85, z: 14 },
      { x: -98, z: -4 },
      { x: 0, z: 28 },
      { x: 15, z: 32 },
      { x: -18, z: 36 },
    ].forEach(({ x, z }) => {
      const orbitR = rand(5, 12),
        phase = rand(0, Math.PI * 2);
      const hg = this.makeHorse(
        x + Math.cos(phase) * orbitR,
        z + Math.sin(phase) * orbitR,
        rand(0, Math.PI),
        HORSE_COLORS[randInt(0, HORSE_COLORS.length - 1)],
        true,
        x,
        z,
        orbitR,
        phase,
      );
      if (Math.random() > 0.4) this.makeRider(hg);
    });
    for (let i = 0; i < 55; i++) {
      const x = rand(-120, 72),
        z = rand(-40, 50);
      const h = terrainHeight(x, z);
      if (h > 9 || h < -1) continue;
      this.makeHorse(
        x,
        z,
        rand(0, Math.PI * 2),
        HORSE_COLORS[randInt(0, HORSE_COLORS.length - 1)],
        false,
      );
    }
  }

  makeCamel(x: number, z: number, rotY = 0): void {
    const g = new THREE.Group(),
      cm = mkMat(0xc8a060, 0.9),
      dk = mkMat(0x8a6030, 0.9);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 0.58), cm);
    body.position.y = 1.2;
    g.add(body);
    [
      [-0.28, 1.54],
      [0.28, 1.54],
    ].forEach(([ox, oy]) => {
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 9), cm);
      hump.position.set(ox, oy, 0);
      hump.scale.set(0.78, 1.05, 0.68);
      g.add(hump);
    });
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.75, 9),
      cm,
    );
    neck.position.set(0.7, 1.5, 0);
    neck.rotation.z = -0.42;
    g.add(neck);
    const chead = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.28), cm);
    chead.position.set(1.12, 1.72, 0);
    g.add(chead);
    [
      [0.45, 0, -0.22],
      [0.45, 0, 0.22],
      [-0.45, 0, -0.22],
      [-0.45, 0, 0.22],
    ].forEach(([lx, , lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.07, 1.1, 9),
        cm,
      );
      leg.position.set(lx, 0.58, lz);
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 9, 7), dk);
      foot.position.set(lx, 0.07, lz);
      foot.scale.set(1.25, 0.48, 1.45);
      g.add(foot);
    });
    g.position.set(x, terrainHeight(x, z), z);
    g.rotation.y = rotY;
    g.scale.setScalar(rand(0.88, 1.05));
    g.castShadow = true;
    this.scene.add(g);
  }

  buildCamels(): void {
    // Говийн бүсэд тэмээ
    [
      { x: -22, z: 30 },
      { x: -18, z: 34 },
      { x: -25, z: 38 },
      { x: -15, z: 32 },
      { x: 0, z: 32 },
      { x: 5, z: 36 },
      { x: -5, z: 40 },
      { x: 10, z: 34 },
      { x: 30, z: 28 },
      { x: 35, z: 32 },
      { x: 28, z: 36 },
      { x: 40, z: 30 },
      { x: 42, z: 38 },
      { x: 45, z: 34 },
      { x: 38, z: 42 },
      { x: 50, z: 32 },
    ].forEach(({ x, z }) =>
      this.makeCamel(x + rand(-3, 3), z + rand(-3, 3), rand(0, Math.PI * 2)),
    );
  }

  buildClouds(): void {
    for (let i = 0; i < 32; i++) {
      const cg = new THREE.Group();
      for (let p = 0; p < randInt(4, 9); p++) {
        const cs = rand(3, 7);
        const cm = new THREE.Mesh(
          new THREE.SphereGeometry(rand(0.9, 1.5) * cs, 9, 7),
          new THREE.MeshStandardMaterial({
            color: 0xf4f8ff,
            roughness: 1,
            transparent: true,
            opacity: rand(0.78, 0.93),
          }),
        );
        cm.position.set(
          rand(-5, 5) * cs * 0.4,
          rand(-0.7, 1.2) * cs * 0.25,
          rand(-2, 2) * cs * 0.2,
        );
        cg.add(cm);
      }
      cg.position.set(rand(-220, 220), rand(50, 90), rand(-110, 90));
      this.scene.add(cg);
      this.clouds.push({
        g: cg,
        speed: rand(0.008, 0.024) * (Math.random() > 0.5 ? 1 : -0.5),
        alt: cg.position.y,
      });
    }
  }

  buildBirds(): void {
    for (let i = 0; i < 22; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(rand(-100, 80), rand(28, 65), rand(-80, 70));
      const arm = new THREE.Group();
      arm.position.x = rand(10, 28);
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 6, 5),
        mkMat(0x222222, 0.8),
      );
      arm.add(body);
      const wingMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 0.42),
        new THREE.MeshBasicMaterial({
          color: 0x1a1a1a,
          side: THREE.DoubleSide,
        }),
      );
      arm.add(wingMesh);
      pivot.add(arm);
      this.scene.add(pivot);
      this.birds.push({
        pivot,
        arm,
        speed: rand(0.25, 0.62),
        radius: rand(10, 28),
        yOff: rand(-4, 4),
        phase: rand(0, Math.PI * 2),
        wingMesh,
        alt: pivot.position.y,
      });
    }
  }

  buildGrassTufts(): void {
    for (let i = 0; i < 520; i++) {
      const x = rand(-150, 80),
        z = rand(-50, 55);
      const h = terrainHeight(x, z);
      if (h > 10 || h < -0.8) continue;
      const g = new THREE.Group();
      const biome = terrainBiome(x, z, h);
      if (biome === "high_alpine") continue;
      const isGobi = biome === "gobi";
      const isForest = biome === "forest" || biome === "river_plain";
      const bladeCount = isForest
        ? randInt(5, 9)
        : isGobi
          ? randInt(2, 5)
          : randInt(3, 7);
      for (let b = 0; b < bladeCount; b++) {
        const bx = rand(-0.35, 0.35),
          bz = rand(-0.35, 0.35);
        const grassCols = isGobi
          ? [0x9aaa60, 0x8a9a50, 0xaaaa68]
          : isForest
            ? [0x3f6f25, 0x4a7d2c, 0x588838, 0x6e9a4a]
            : [0x5a8830, 0x4a7820, 0x6a9840, 0x7aaa50];
        const blade = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.02,
            0.04,
            rand(0.18, isGobi ? 0.38 : isForest ? 0.72 : 0.62),
            4,
          ),
          mkMat(grassCols[randInt(0, grassCols.length - 1)], 0.9),
        );
        blade.position.set(bx, rand(0.09, 0.3), bz);
        blade.rotation.z = rand(-0.35, 0.35);
        blade.rotation.x = rand(-0.22, 0.22);
        g.add(blade);
      }
      g.position.set(x, h, z);
      this.scene.add(g);
    }
  }

  buildRocks(): void {
    for (let i = 0; i < 130; i++) {
      const x = rand(-160, 90),
        z = rand(-55, 60);
      const h = terrainHeight(x, z);
      const biome = terrainBiome(x, z, h);
      if (biome === "river_plain") continue;
      const rg = new THREE.Group();
      const nearMtn = h > 5;
      for (let j = 0; j < randInt(1, nearMtn ? 6 : 3); j++) {
        const size = nearMtn ? rand(0.3, 1.3) : rand(0.15, 0.65);
        const rm = new THREE.Mesh(
          new THREE.DodecahedronGeometry(size * rand(0.5, 1.8), 0),
          mkMat(nearMtn ? 0x787060 : 0x888070, 0.96),
        );
        rm.position.set(rand(-0.6, 0.6), rand(0.1, 0.4), rand(-0.6, 0.6));
        rm.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        rm.castShadow = true;
        rg.add(rm);
      }
      rg.position.set(x, h, z);
      this.scene.add(rg);
    }
  }

  //Өртөөний зам
  buildRoads(stations: UrtuuStation[]): void {
    const pos = new Map<string, { wx: number; wz: number }>();
    stations.forEach((s) => {
      const cfg = STATION_CONFIGS[s.id];
      if (cfg) pos.set(s.id, { wx: cfg.wx * WORLD_SCALE, wz: cfg.wz * WORLD_SCALE });
    });

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xb09870,
      roughness: 0.98,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x8a7050,
      roughness: 0.99,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });

    const ROUTES: string[][] = [
      [
        "khovd",
        "ulaangom",
        "uliastai",
        "altai",
        "bayankhongor",
        "orkhon_river",
        "kharakhorum",
        "arvaikheer",
        "zuunmod",
        "ulaanbaatar",
      ],
      ["ulaanbaatar", "darkhan", "erdenet", "sukhbaatar", "moron", "khatgal"],
      [
        "ulaanbaatar",
        "nalaikh",
        "terelj",
        "ondorhaan",
        "kherlenbayan",
        "choibalsan",
        "baruun_urt",
      ],
      ["ulaanbaatar", "mandalgovi", "dalanzadgad", "sainshand", "zamiin_uud"],
    ];

    const makeRibbon = (
      center: THREE.Vector3[],
      halfW: number,
      mat: THREE.Material,
    ): void => {
      if (center.length < 2) return;

      const positions: number[] = [];
      const indices: number[] = [];
      const uvs: number[] = [];

      for (let i = 0; i < center.length; i++) {
        let tx: number, tz: number;
        if (i === 0) {
          tx = center[1].x - center[0].x;
          tz = center[1].z - center[0].z;
        } else if (i === center.length - 1) {
          tx = center[i].x - center[i - 1].x;
          tz = center[i].z - center[i - 1].z;
        } else {
          tx = center[i + 1].x - center[i - 1].x;
          tz = center[i + 1].z - center[i - 1].z;
        }
        const tlen = Math.sqrt(tx * tx + tz * tz) || 1;
        const px = -tz / tlen,
          pz = tx / tlen;

        const lx = center[i].x + px * halfW;
        const lz = center[i].z + pz * halfW;
        const rx = center[i].x - px * halfW;
        const rz = center[i].z - pz * halfW;

        const ly = terrainHeight(lx, lz) + 0.12;
        const ry = terrainHeight(rx, rz) + 0.12;

        positions.push(lx, ly, lz);
        positions.push(rx, ry, rz);
        const u = i / (center.length - 1);
        uvs.push(0, u, 1, u);
      }

      for (let i = 0; i < center.length - 1; i++) {
        const a = i * 2,
          b = i * 2 + 1,
          c = i * 2 + 2,
          d = i * 2 + 3;
        indices.push(a, b, c, b, d, c);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    ROUTES.forEach((route) => {
      for (let i = 0; i < route.length - 1; i++) {
        const a = pos.get(route[i]);
        const b = pos.get(route[i + 1]);
        if (!a || !b) continue;
        const fromId = route[i];
        const toId = route[i + 1];

        const STEPS = 30;
        const center: THREE.Vector3[] = [];
        const dx = b.wx - a.wx,
          dz = b.wz - a.wz;
        const perpLen = Math.sqrt(dx * dx + dz * dz) || 1;

        for (let t = 0; t <= STEPS; t++) {
          const f = t / STEPS;
          const cx = a.wx + dx * f;
          const cz = a.wz + dz * f;
          const jitter = Math.sin(f * Math.PI * 2.5) * 5;
          const jx = cx + (-dz / perpLen) * jitter;
          const jz = cz + (dx / perpLen) * jitter;
          center.push(new THREE.Vector3(jx, 0, jz));
        }

        this.roadPaths.set(`${fromId}->${toId}`, center);
        this.roadPaths.set(`${toId}->${fromId}`, [...center].reverse());

        makeRibbon(center, 2.5, roadMat);

        [-1.4, 1.4].forEach((off) => {
          const trackCenter = center.map((p) => {
            const cp =
              center[Math.min(center.indexOf(p) + 1, center.length - 1)];
            const tdx = cp.x - p.x,
              tdz = cp.z - p.z;
            const tlen = Math.sqrt(tdx * tdx + tdz * tdz) || 1;
            return new THREE.Vector3(
              p.x + (-tdz / tlen) * off,
              0,
              p.z + (tdx / tlen) * off,
            );
          });
          makeRibbon(trackCenter, 0.45, trackMat);
        });

        if (Math.random() > 0.6) {
          const mid = center[Math.floor(STEPS / 2)];
          this.makeOvoo(mid.x + rand(-6, 6), mid.z + rand(-6, 6));
        }
      }
    });
  }
}
