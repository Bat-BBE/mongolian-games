import * as THREE from "three";
import {
  rand,
  randInt,
  mkMat,
  mkFurMat,
  terrainHeight,
  terrainHeightFeet,
  terrainBiome,
  pseudoNoise2D,
  smoothstep,
  getPlayerHomeYardHalfAxes,
  type HomeLivestockForFence,
} from "./sceneHelpers";
import {
  STATION_CONFIGS,
  HORSE_COLORS,
  TERRAIN_W,
  TERRAIN_D,
  TERRAIN_SEG,
  WORLD_SCALE,
  STATION_SPREAD,
  PLAYER_HOME_X,
  PLAYER_HOME_Z,
  playerHomeWorldAnchor,
} from "./mapConstants";
import type { UrtuuStation } from "./UrtuuNode";
import { materialLibrary } from "./MaterialLibrary";
import { TerrainBuilder } from "./TerrainBuilder";

function disposeRemoteCampSubtree(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose();
      const mat = o.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}

/** Цэгээс хэсэг хоёр цэгийн хоорондох хамгийн бага зай (x/z). */
function distPointSegment2D(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const ab2 = abx * abx + abz * abz;
  if (ab2 < 1e-8) return Math.hypot(apx, apz);
  let t = (apx * abx + apz * abz) / ab2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * abx;
  const qz = az + t * abz;
  return Math.hypot(px - qx, pz - qz);
}

/** urtuunuudiin ger busad urtuunuudees tom baina shuu */
const STATION_MAIN_GER_SCALE = 3.2;
const STATION_SATELLITE_GER_SCALE_MIN = 1.68;
const STATION_SATELLITE_GER_SCALE_MAX = 1.98;
/** Төвийн гол гэр/хаалганаас сүрийн мөхлөг, мод — илүү агаартай (далд хэмжээс өөрчлөгдөхгүй). */
const STATION_CENTER_CLEAR = 66;
/** ub-bogdiin urtuu hol bairluulah */
const STATION_CENTER_CLEAR_ULAANBAATAR = 78;

/**
 * Процедурын морь, тэмээг **гэрийн ойролцоо** болон world map-ийн **ижил** нэг
 * хэмжээтэй (Өмнө `rand(1.12,1.42)*1.48` нь 1.66-2.1 — хэт хол зөрүүтэй).
 */
const PROCEDURAL_HORSE_UNIFIED_SCALE = 1.27 * 1.48; // old median
const PROCEDURAL_HORSE_SCALE_JITTER = 0.02;
const PROCEDURAL_CAMEL_UNIFIED_SCALE = 1.18 * 1.42; // old median
const PROCEDURAL_CAMEL_SCALE_JITTER = 0.02;
const MAP_CLOUD_COUNT = 16;
const MAP_BIRD_COUNT = 14;

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
    trees: 5,
    treeRadius: 60,
    decorGers: 2,
    gerRadius: 44,
    grassClumps: 8,
    grassRadius: 56,
    rocks: 2,
    rockRadius: 52,
    ovoos: 1,
    ovooRadius: 46,
  },
  zuunmod: {
    trees: 20,
    treeRadius: 38,
    decorGers: 5,
    gerRadius: 32,
    ovoos: 2,
    ovooRadius: 26,
    grassClumps: 24,
    grassRadius: 36,
  },
  terelj: {
    trees: 30,
    treeRadius: 44,
    rocks: 16,
    rockRadius: 36,
    horses: 3,
    horseRadius: 30,
    grassClumps: 22,
    grassRadius: 38,
  },
  nalaikh: {
    rocks: 30,
    rockRadius: 34,
    trees: 12,
    treeRadius: 30,
    ovoos: 2,
    ovooRadius: 22,
    grassClumps: 8,
    grassRadius: 28,
  },
  kharakhorum: {
    decorGers: 8,
    gerRadius: 36,
    trees: 18,
    treeRadius: 40,
    horses: 6,
    horseRadius: 34,
    ovoos: 3,
    ovooRadius: 30,
    grassClumps: 24,
    grassRadius: 38,
  },
  arvaikheer: {
    decorGers: 7,
    gerRadius: 34,
    horses: 9,
    horseRadius: 38,
    grassClumps: 34,
    grassRadius: 42,
    ovoos: 2,
    ovooRadius: 28,
  },
  orkhon_river: {
    trees: 20,
    treeRadius: 38,
    reedPatches: 30,
    reedRadius: 40,
    horses: 4,
    horseRadius: 32,
    grassClumps: 20,
    grassRadius: 34,
  },
  mandalgovi: {
    camels: 10,
    camelRadius: 40,
    decorGers: 4,
    gerRadius: 30,
    rocks: 12,
    rockRadius: 34,
    grassClumps: 10,
    grassRadius: 30,
    ovoos: 1,
    ovooRadius: 24,
  },
  darkhan: {
    trees: 32,
    treeRadius: 40,
    horses: 6,
    horseRadius: 32,
    grassClumps: 26,
    grassRadius: 38,
    decorGers: 3,
    gerRadius: 28,
  },
  erdenet: {
    trees: 22,
    treeRadius: 36,
    decorGers: 4,
    gerRadius: 28,
    ovoos: 2,
    ovooRadius: 22,
    grassClumps: 20,
    grassRadius: 32,
  },
  sukhbaatar: {
    trees: 24,
    treeRadius: 42,
    rocks: 10,
    rockRadius: 34,
    grassClumps: 22,
    grassRadius: 36,
    reedPatches: 8,
    reedRadius: 30,
  },
  moron: {
    trees: 24,
    treeRadius: 40,
    horses: 6,
    horseRadius: 34,
    reedPatches: 16,
    reedRadius: 34,
    grassClumps: 22,
    grassRadius: 36,
  },
  khatgal: {
    trees: 28,
    treeRadius: 42,
    rocks: 12,
    rockRadius: 34,
    reedPatches: 20,
    reedRadius: 36,
    grassClumps: 24,
    grassRadius: 38,
  },
  uliastai: {
    rocks: 18,
    rockRadius: 38,
    trees: 14,
    treeRadius: 34,
    ovoos: 3,
    ovooRadius: 28,
    grassClumps: 16,
    grassRadius: 32,
  },
  bayankhongor: {
    trees: 20,
    treeRadius: 36,
    rocks: 12,
    rockRadius: 32,
    horses: 4,
    horseRadius: 34,
    grassClumps: 22,
    grassRadius: 34,
    reedPatches: 8,
    reedRadius: 30,
  },
  altai: {
    rocks: 24,
    rockRadius: 40,
    trees: 12,
    treeRadius: 36,
    camels: 4,
    camelRadius: 32,
    ovoos: 2,
    ovooRadius: 24,
    grassClumps: 10,
    grassRadius: 30,
  },
  khovd: {
    trees: 18,
    treeRadius: 36,
    decorGers: 5,
    gerRadius: 32,
    camels: 4,
    camelRadius: 34,
    grassClumps: 20,
    grassRadius: 34,
  },
  ulaangom: {
    trees: 22,
    treeRadius: 42,
    rocks: 14,
    rockRadius: 36,
    reedPatches: 18,
    reedRadius: 38,
    grassClumps: 22,
    grassRadius: 38,
  },
  ondorhaan: {
    trees: 24,
    treeRadius: 40,
    rocks: 18,
    rockRadius: 38,
    ovoos: 3,
    ovooRadius: 30,
    grassClumps: 20,
    grassRadius: 36,
  },
  kherlenbayan: {
    decorGers: 8,
    gerRadius: 38,
    horses: 12,
    horseRadius: 42,
    grassClumps: 34,
    grassRadius: 44,
    ovoos: 3,
    ovooRadius: 34,
  },
  choibalsan: {
    horses: 14,
    horseRadius: 44,
    decorGers: 7,
    gerRadius: 38,
    grassClumps: 32,
    grassRadius: 42,
    ovoos: 3,
    ovooRadius: 34,
  },
  baruun_urt: {
    decorGers: 7,
    gerRadius: 36,
    camels: 5,
    camelRadius: 36,
    horses: 7,
    horseRadius: 38,
    grassClumps: 24,
    grassRadius: 38,
  },
  dalanzadgad: {
    camels: 16,
    camelRadius: 46,
    rocks: 14,
    rockRadius: 42,
    grassClumps: 8,
    grassRadius: 34,
    ovoos: 2,
    ovooRadius: 30,
  },
  sainshand: {
    camels: 10,
    camelRadius: 40,
    decorGers: 4,
    gerRadius: 30,
    rocks: 12,
    rockRadius: 36,
    grassClumps: 12,
    grassRadius: 34,
    ovoos: 1,
    ovooRadius: 24,
  },
  zamiin_uud: {
    rocks: 28,
    rockRadius: 42,
    camels: 6,
    camelRadius: 36,
    trees: 6,
    treeRadius: 30,
    ovoos: 3,
    ovooRadius: 30,
    grassClumps: 6,
    grassRadius: 28,
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
  /** Тоглогчийн сууцны төв (realtime world дээр тоглогч бүрт өөр) */
  public readonly playerHomeX: number;
  public readonly playerHomeZ: number;

  public horses: HorseEntry[] = [];
  public clouds: CloudEntry[] = [];
  public birds: BirdEntry[] = [];
  public markerMeshes = new Map<string, THREE.Mesh>();
  public labelAnchors = new Map<string, THREE.Vector3>();
  public doorAnchors = new Map<string, THREE.Vector3>();
  public roadPaths = new Map<string, THREE.Vector3[]>();

  constructor(
    scene: THREE.Scene,
    currentStationId: string,
    doneStationIds: string[],
    playerHomeOverride?: { x: number; z: number } | null,
  ) {
    this.scene = scene;
    this.currentStationId = currentStationId;
    this.doneStationIds = doneStationIds;
    this.playerHomeX = playerHomeOverride?.x ?? PLAYER_HOME_X;
    this.playerHomeZ = playerHomeOverride?.z ?? PLAYER_HOME_Z;
  }

  buildSky(): void {
    const skyR = 4200;
    const geo = new THREE.SphereGeometry(skyR, 64, 32);
    geo.scale(-1, 1, -1);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const zenith = { r: 0.22, g: 0.48, b: 0.9 };
    const horizon = { r: 0.78, g: 0.82, b: 0.93 };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = Math.max(0, Math.min(1, (y + skyR) / (skyR * 2)));
      const h = 1 - t;
      let r = horizon.r * h + zenith.r * (1 - h);
      let g = horizon.g * h + zenith.g * (1 - h);
      let b = horizon.b * h + zenith.b * (1 - h);
      const n1 = Math.sin(x * 0.0055 + z * 0.0042);
      const n2 = Math.sin(x * 0.011 + z * 0.009 + y * 0.0012);
      const n3 = Math.sin(z * 0.013 + x * 0.007);
      const cloudRaw = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;
      const cloud = smoothstep(0.12, 0.9, cloudRaw * 0.5 + 0.5);
      const cloudBright = cloud * (0.22 + 0.2 * (1 - h));
      r += cloudBright * (0.98 - r);
      g += cloudBright * (0.99 - g);
      b += cloudBright * (1.0 - b);
      const haze = h * h * 0.045;
      r += haze;
      g += haze * 1.02;
      b += haze * 1.04;
      const maxC = 0.995;
      colors[i * 3] = Math.min(maxC, r);
      colors[i * 3 + 1] = Math.min(maxC, g);
      colors[i * 3 + 2] = Math.min(maxC, b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.scene.add(
      new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })),
    );
  }

  /** Gazar zurag hursnii ungu*/
  buildTerrain(): void {
    const tb = new TerrainBuilder(this.scene, materialLibrary);
    const mesh = tb.buildTerrainWithUV();
    mesh.name = "terrain";
    mesh.userData.role = "ground";
  }
  buildRivers(): void {}
  buildBridge(): void {}

  private makeReedPatchAt(x: number, z: number, count: number): void {
    const reedColors = [0x5f7f36, 0x6d9440, 0x4a7028, 0x7cb342];
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

  buildRiverReeds(): void {}

  private makeTree(x: number, z: number, s = 1): void {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * s, 0.17 * s, 1.4 * s, 12),
      mkMat(0x4a3018, 0.93),
    );
    trunk.position.y = 0.7 * s;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);
    [
      { color: 0x1a4e12, r: 1.3, h: 2.0, y: 1.4 },
      { color: 0x235e18, r: 1.0, h: 1.7, y: 2.8 },
      { color: 0x2a6a1e, r: 0.72, h: 1.4, y: 3.9 },
      { color: 0x1e5414, r: 0.42, h: 1.0, y: 5.0 },
    ].forEach((l) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(l.r * s, l.h * s, 12),
        mkMat(l.color, 0.82),
      );
      cone.position.y = l.y * s;
      cone.rotation.y = rand(0, Math.PI);
      cone.rotation.z = rand(-0.08, 0.08);
      cone.castShadow = true;
      cone.receiveShadow = true;
      g.add(cone);
    });
    for (let b = 0; b < 5; b++) {
      const br = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02 * s, 0.03 * s, 0.55 * s, 6),
        mkMat(0x3a2810, 0.9),
      );
      const ang = (b / 5) * Math.PI * 2 + rand(0, 0.5);
      br.position.set(
        Math.cos(ang) * 0.55 * s,
        1.15 * s,
        Math.sin(ang) * 0.55 * s,
      );
      br.rotation.z = Math.cos(ang) * 0.85;
      br.rotation.x = Math.sin(ang) * 0.35;
      br.castShadow = true;
      g.add(br);
    }
    g.position.set(x, terrainHeight(x, z), z);
    this.scene.add(g);
  }

  buildTrees(): void {
    for (let i = 0; i < 105; i++) {
      const x = rand(-70, -20),
        z = rand(-30, -5);
      const h = terrainHeight(x, z);
      if (h > 1.5 && h < 18)
        this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.6, 1.3));
    }
    for (let i = 0; i < 105; i++) {
      const x = rand(14, 52),
        z = rand(-26, -5);
      const h = terrainHeight(x, z);
      if (h > 1.0 && h < 14)
        this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.5, 1.1));
    }
    for (let i = 0; i < 105; i++) {
      const z = rand(-28, 14);
      const rx = -32 + Math.sin(z * 0.08) * 6;
      const x = rx + rand(-10, 10);
      const h = terrainHeight(x, z);
      if (h > -0.5 && h < 5) this.makeTree(x, z, rand(0.4, 0.95));
    }
    for (let i = 0; i < 105; i++) {
      const angle = rand(0, Math.PI * 2);
      const r = rand(12, 20);
      const x = -63 + Math.cos(angle) * r;
      const z = -44 + Math.sin(angle) * r * 2.5;
      this.makeTree(x, z, rand(0.6, 1.2));
    }
    for (let i = 0; i < 105; i++) {
      const x = rand(10, 24),
        z = rand(-14, -2);
      this.makeTree(x + rand(-1, 1), z + rand(-1, 1), rand(0.5, 1.0));
    }
    for (let i = 0; i < 80; i++) {
      const x = rand(-130, 70),
        z = rand(-45, 20);
      const h = terrainHeight(x, z);
      if (h > 0.5 && h < 6) this.makeTree(x, z, rand(0.22, 0.5));
    }
  }

  //ger
  private makeGer(
    x: number,
    z: number,
    rotY = 0,
    s = 1,
    isStation = false,
    stationId = "",
    attachParent?: THREE.Object3D,
    objectName?: string,
  ): void {
    const hy = terrainHeight(x, z);
    const gerLift = 0.14 * Math.min(s, 2.2) + 0.04;
    const g = new THREE.Group();
    if (objectName) g.name = objectName;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8 * s, 2.9 * s, 0.3 * s, 24),
      mkMat(0x9a8860, 0.95),
    );
    base.position.y = 0.15;
    g.add(base);

    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 256;
    const ctx = cv.getContext("2d")!;
    const fg = ctx.createLinearGradient(0, 0, 0, 256);
    fg.addColorStop(0, "#f6eed8");
    fg.addColorStop(0.5, "#ebe0c8");
    fg.addColorStop(1, "#d4c4a0");
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, 512, 256);
    const feltNoise = ctx.getImageData(0, 0, 512, 256);
    for (let i = 0; i < feltNoise.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      feltNoise.data[i] += n;
      feltNoise.data[i + 1] += n * 0.92;
      feltNoise.data[i + 2] += n * 0.78;
    }
    ctx.putImageData(feltNoise, 0, 0);
    ctx.strokeStyle = "rgba(150, 118, 72, 0.38)";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 52; i++) {
      const ox = (i % 7) * 0.15;
      ctx.beginPath();
      ctx.moveTo(i * 9.85 + ox, 0);
      ctx.lineTo(i * 9.85 + ox * 0.5, 256);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(110, 88, 52, 0.2)";
    ctx.lineWidth = 0.9;
    for (let j = 0; j < 14; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * 18.5 + 3);
      ctx.lineTo(512, j * 18.5 + 1.5);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    const bumpCv = document.createElement("canvas");
    bumpCv.width = 256;
    bumpCv.height = 128;
    const bctx = bumpCv.getContext("2d")!;
    const bd = bctx.createImageData(256, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4;
        const v =
          112 + (Math.random() - 0.5) * 42 + Math.sin(x * 0.12 + y * 0.08) * 18;
        bd.data[i] = v;
        bd.data[i + 1] = v;
        bd.data[i + 2] = v;
        bd.data[i + 3] = 255;
      }
    }
    bctx.putImageData(bd, 0, 0);
    const bumpTex = new THREE.CanvasTexture(bumpCv);
    bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(5, 1);

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7 * s, 2.7 * s, 2.2 * s, 32, 1, true),
      new THREE.MeshStandardMaterial({
        color:
          stationId === "home" ? 0xfffaf2 : isStation ? 0xfff6ea : 0xede0c8,
        roughness: stationId === "home" ? 0.4 : 0.54,
        metalness: 0.03,
        map: tex,
        bumpMap: bumpTex,
        bumpScale: 0.042,
        envMapIntensity: 0.5,
      }),
    );
    wall.position.y = 1.1 * s + 0.3;
    g.add(wall);

    const roofColor = isStation
      ? stationId === "home"
        ? 0xf2c12e
        : stationId === this.currentStationId
          ? 0x22cc66
          : this.doneStationIds.includes(stationId)
            ? 0xffaa00
            : 0xcc4422
      : [0xc8724a, 0xb86838, 0xd47a50][randInt(0, 2)];
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8 * s, 1.6 * s, 28),
      new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.66,
        metalness: 0.06,
        envMapIntensity: 0.45,
      }),
    );
    roof.position.y = (2.2 + 0.8) * s + 0.3;
    g.add(roof);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4 * s, 0.12 * s, 14, 40),
      mkMat(0xd89030, 0.45, 0.42),
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
        mkMat(
          isStation ? (stationId === "home" ? 0xffe8a0 : 0xf0c020) : 0xe05030,
          0.8,
        ),
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
        emissiveIntensity:
          stationId === "home"
            ? 0.88
            : stationId === this.currentStationId
              ? 0.68
              : 0.52,
        roughness: 0.14,
        metalness: 0.22,
      });
      const markerMajor = stationId === "home" ? 2.38 * s : 2.12 * s;
      const markerTube = stationId === "home" ? 0.29 * s : 0.24 * s;
      const marker = new THREE.Mesh(
        new THREE.TorusGeometry(markerMajor, markerTube, 12, 52),
        markerMat,
      );
      marker.userData.stationId = stationId;
      marker.position.y = (2.2 + 1.6 + 0.9) * s + 0.3;
      marker.rotation.x = Math.PI / 2;
      g.add(marker);
      this.markerMeshes.set(stationId, marker);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(
          stationId === "home" ? 0.95 * s : 0.78 * s,
          12,
          12,
        ),
        new THREE.MeshBasicMaterial({
          color: mc,
          transparent: true,
          opacity:
            stationId === "home"
              ? 0.22
              : stationId === this.currentStationId
                ? 0.16
                : 0.11,
        }),
      );
      glow.position.y = (2.2 + 1.6 + 0.9) * s + 0.3;
      g.add(glow);

      if (stationId === "home") {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(2.72 * s, 0.1 * s, 10, 48),
          new THREE.MeshStandardMaterial({
            color: 0xffeeaa,
            emissive: 0xffeeaa,
            emissiveIntensity: 0.42,
            roughness: 0.35,
            metalness: 0.12,
            transparent: true,
            opacity: 0.9,
          }),
        );
        halo.position.y = (2.2 + 1.6 + 0.9) * s + 0.3;
        halo.rotation.x = Math.PI / 2;
        g.add(halo);
        const beamHome = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 14 * s, 10),
          new THREE.MeshBasicMaterial({
            color: 0xb8f0ff,
            transparent: true,
            opacity: 0.34,
          }),
        );
        beamHome.position.y = (2.2 + 1.6 + 7) * s + 0.3;
        g.add(beamHome);
      } else if (stationId === this.currentStationId) {
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
          hy + gerLift + (2.2 + 1.6 + 0.9 + 0.42) * s + 0.3,
          z,
        ),
      );
    }

    g.position.set(x, hy + gerLift, z);
    g.rotation.y = isStation ? 0 : rotY;
    g.castShadow = true;
    g.receiveShadow = true;
    if (isStation && stationId) {
      door.userData.stationId = stationId;
      g.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      door.getWorldPosition(wp);
      wp.y += 0.25 * s;
      this.doorAnchors.set(stationId, wp);
    }
    (attachParent ?? this.scene).add(g);
  }

  /**
   * Бусад тоглогчийн гэр: world anchor дээр тогтмол (баатрын хөдөлгөөнд дагалдахгүй).
   * `playerHomeWorldAnchor` — `homeKey` эсвүл `homeKey` хоосон бол `peerId`.
   */
  syncRemoteVisitorCamp(
    container: THREE.Group,
    peerId: string,
    _heroX: number,
    _heroZ: number,
    _heroRy: number,
    campByPeer: Map<string, THREE.Object3D>,
    meta?: {
      homeKey?: string;
      gerLevel: number;
      livestock: {
        sheep: number;
        goat: number;
        cow: number;
        horse: number;
        camel: number;
      };
    },
  ): void {
    const safeName = `remote_visit_camp_${peerId.replace(/[^a-zA-Z0-9_-]+/g, "_")}`;
    const lv = Math.max(1, Math.min(30, Math.floor(meta?.gerLevel ?? 1)));

    const step = Math.min(lv, 5);
    const earlyScale = 0.5 + (step - 1) * 0.095;
    const midBoost = lv > 5 ? 1 + (Math.min(lv, 14) - 5) * 0.05 : 1;
    const highBoost = lv > 14 ? 1 + (lv - 14) * 0.03 : 1;
    const s = earlyScale * midBoost * highBoost * 1.86;

    const { halfW, halfD } = getPlayerHomeYardHalfAxes(lv, meta?.livestock);
    const yardW = halfW * 2;
    const yardD = halfD * 2;

    const fromHello = (meta?.homeKey ?? "").trim();
    const anchorKey = fromHello || peerId;
    const { x: gx, z: gz } = playerHomeWorldAnchor(anchorKey);
    const campYaw = 0;
    const layoutKey = `${lv}|${yardW.toFixed(1)}|${yardD.toFixed(1)}|${s.toFixed(2)}`;
    const metaKey = `B|${anchorKey.slice(0, 64)}|${layoutKey}`;

    const existing = campByPeer.get(peerId);
    const needsRebuild =
      !existing ||
      existing.parent !== container ||
      (existing.userData.campMeta as string | undefined) !== metaKey;

    if (needsRebuild) {
      if (existing) {
        existing.removeFromParent();
        disposeRemoteCampSubtree(existing);
        campByPeer.delete(peerId);
      }
      const campRoot = new THREE.Group();
      campRoot.name = safeName;
      campRoot.userData.campMeta = metaKey;
      container.add(campRoot);
      this.makeGer(gx, gz, campYaw, s, false, "", campRoot, `${safeName}_ger`);
      this.makeFence(gx, gz, yardW, yardD, 0, false, campRoot);
      campByPeer.set(peerId, campRoot);
    }
  }

  private makeFence(
    cx: number,
    cz: number,
    w: number,
    d: number,
    rotY = 0,
    withGate = true,
    attachParent?: THREE.Object3D,
  ): void {
    const g = new THREE.Group(),
      fm = mkMat(0x9a7840, 0.95);
    const baseY = terrainHeight(cx, cz);
    const sinR = Math.sin(rotY);
    const cosR = Math.cos(rotY);
    const localTerrainOffsetY = (lx: number, lz: number): number => {
      const wx = cx + lx * cosR - lz * sinR;
      const wz = cz + lx * sinR + lz * cosR;
      return terrainHeight(wx, wz) - baseY;
    };
    const gateW = 2.85;
    const pts: [number, number][] = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
      [-w / 2, -d / 2],
    ];
    const addEdge = (
      ax: number,
      az: number,
      bx: number,
      bz: number,
      isGateEdge: boolean,
    ): void => {
      let sx = ax,
        sz = az,
        ex = bx,
        ez = bz;
      if (isGateEdge && withGate) {
        const elen = Math.hypot(bx - ax, bz - az);
        if (elen > gateW + 1.2) {
          const ux = (bx - ax) / elen,
            uz = (bz - az) / elen;
          const midx = (ax + bx) / 2,
            midz = (az + bz) / 2;
          const half = gateW / 2;
          addEdge(ax, az, midx - ux * half, midz - uz * half, false);
          addEdge(midx + ux * half, midz + uz * half, bx, bz, false);
          const gpx = midx - ux * half,
            gpz = midz - uz * half;
          const gqx = midx + ux * half,
            gqz = midz + uz * half;
          for (const [px, pz] of [
            [gpx, gpz],
            [gqx, gqz],
          ] as [number, number][]) {
            const post = new THREE.Mesh(
              new THREE.CylinderGeometry(0.09, 0.1, 1.35, 6),
              fm,
            );
            post.position.set(px, 0.68 + localTerrainOffsetY(px, pz), pz);
            post.castShadow = true;
            g.add(post);
          }
          const lintel = new THREE.Mesh(
            new THREE.BoxGeometry(gateW * 1.02, 0.12, 0.12),
            fm,
          );
          const lintelY =
            (localTerrainOffsetY(gpx, gpz) + localTerrainOffsetY(gqx, gqz)) * 0.5;
          lintel.position.set(midx, 1.28 + lintelY, midz);
          lintel.rotation.y = Math.atan2(bx - ax, bz - az);
          g.add(lintel);
          return;
        }
      }
      const len = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2),
        mx = (sx + ex) / 2,
        mz = (sz + ez) / 2,
        ry = Math.atan2(ex - sx, ez - sz);
      [0.7, 0.4].forEach((py) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.07), fm);
        rail.position.set(mx, py, mz);
        rail.rotation.y = ry;
        // g.add(rail);
      });
      const n = Math.max(2, Math.floor(len / 2.8));
      for (let i = 0; i <= n; i++) {
        const tt = i / n;
        const px = sx + (ex - sx) * tt;
        const pz = sz + (ez - sz) * tt;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.075, 1.1, 6),
          fm,
        );
        post.position.set(px, 0.55 + localTerrainOffsetY(px, pz), pz);
        post.castShadow = true;
        g.add(post);
      }
    };
    for (let s = 0; s < 4; s++) {
      const [ax, az] = pts[s],
        [bx, bz] = pts[s + 1];
      addEdge(ax, az, bx, bz, s === 0);
    }
    g.position.set(cx, baseY, cz);
    g.rotation.y = rotY;
    (attachParent ?? this.scene).add(g);
  }

  private makeMiniSumTemple(
    x: number,
    z: number,
    rotY: number,
    s: number,
  ): void {
    const hy = terrainHeight(x, z);
    const g = new THREE.Group();
    const wallM = mkMat(0xede4d4, 0.74);
    const roofM = mkMat(0xb06818, 0.68);
    const goldM = mkMat(0xd4a020, 0.32, 0.48);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.4 * s, 1.35 * s, 1.75 * s),
      wallM,
    );
    base.position.y = 0.68 * s;
    base.castShadow = true;
    g.add(base);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.45 * s, 1.15 * s, 4),
      roofM,
    );
    roof.position.y = 1.35 * s + 0.58 * s;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 8, 6), goldM);
    fin.position.y = 1.35 * s + 1.15 * s + 0.25 * s;
    g.add(fin);
    g.position.set(x, hy, z);
    g.rotation.y = rotY;
    this.scene.add(g);
  }

  private layoutSacredSiteCamp(
    x: number,
    z: number,
    stationId: string,
    kind: "palace" | "monastery",
  ): void {
    const seed = stationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

    if (kind === "palace") {
      const isUlaanbaatar = stationId === "ulaanbaatar";
      const nGers = isUlaanbaatar ? 9 : 12 + (seed % 9);
      const ringR = isUlaanbaatar
        ? 28 + (seed % 3) * 0.45
        : 32 + (seed % 4) * 0.55;
      for (let i = 0; i < nGers; i++) {
        const ang = (i / nGers) * Math.PI * 2 + rand(-0.03, 0.03);
        this.makeGer(
          x + Math.cos(ang) * ringR,
          z + Math.sin(ang) * ringR,
          rand(0, Math.PI * 2),
          rand(
            STATION_SATELLITE_GER_SCALE_MIN * 0.82,
            STATION_SATELLITE_GER_SCALE_MAX * 0.86,
          ),
          false,
        );
      }
      const fw = isUlaanbaatar ? 80 : 92;
      const fd = isUlaanbaatar ? 68 : 78;
      this.makeFence(x, z, fw, fd, rand(0, Math.PI * 0.1), true);
      const fh = Math.max(fw, fd) * 0.5;
      const nMini = isUlaanbaatar ? 7 : 11 + (seed % 6);
      for (let i = 0; i < nMini; i++) {
        const ang = (i / nMini) * Math.PI * 2 + rand(-0.14, 0.14);
        const rad = fh + rand(isUlaanbaatar ? 12 : 10, isUlaanbaatar ? 20 : 28);
        this.makeMiniSumTemple(
          x + Math.cos(ang) * rad,
          z + Math.sin(ang) * rad,
          ang + Math.PI / 2 + rand(-0.35, 0.35),
          rand(0.82, 1.08),
        );
      }
      return;
    }

    const nGers = 10;
    const ringR = 19.5 + (seed % 4) * 0.5;
    for (let i = 0; i < nGers; i++) {
      const ang = (i / nGers) * Math.PI * 2 + rand(-0.04, 0.04);
      this.makeGer(
        x + Math.cos(ang) * ringR,
        z + Math.sin(ang) * ringR,
        rand(0, Math.PI * 2),
        rand(
          STATION_SATELLITE_GER_SCALE_MIN * 0.82,
          STATION_SATELLITE_GER_SCALE_MAX * 0.86,
        ),
        false,
      );
    }
    const isZuun = stationId === "zuunmod";
    const fw = isZuun ? 72 : 68;
    const fd = isZuun ? 64 : 60;
    this.makeFence(x, z, fw, fd, isZuun ? 0 : rand(0, Math.PI * 0.16), true);
    const fh = Math.max(fw, fd) * 0.5;
    const nMini = 11 + (seed % 6);
    for (let i = 0; i < nMini; i++) {
      const ang = (i / nMini) * Math.PI * 2 + rand(-0.12, 0.12);
      const rad = fh + rand(8, 24);
      this.makeMiniSumTemple(
        x + Math.cos(ang) * rad,
        z + Math.sin(ang) * rad,
        ang + Math.PI / 2 + rand(-0.28, 0.28),
        rand(0.78, 1.02),
      );
    }
  }

  buildPlayerHomeGer(
    gerLevel = 1,
    livestock: HomeLivestockForFence = null,
  ): void {
    const prev = this.scene.getObjectByName("playerHomeGer");
    if (prev) this.scene.remove(prev);

    const x = this.playerHomeX;
    const z = this.playerHomeZ;
    const lv = Math.max(1, Math.min(gerLevel, 30));
    const step = Math.min(lv, 5);
    // Түвшин бүрт томролт (1→5 хооронд ялгаа мэдрэгдэнэ).
    const earlyScale = 0.5 + (step - 1) * 0.095;
    const midBoost = lv > 5 ? 1 + (Math.min(lv, 14) - 5) * 0.05 : 1;
    const highBoost = lv > 14 ? 1 + (lv - 14) * 0.03 : 1;
    const s = earlyScale * midBoost * highBoost * 1.86;
    const root = new THREE.Group();
    root.name = "playerHomeGer";
    this.scene.add(root);

    this.makeGer(x, z, 0, s, true, "home", root);

    const extraGers = Math.min(6, Math.max(0, Math.floor((lv - 3) / 2)));
    let ringSpan = 12.5;
    // Нэмэлт гэр: гол гэрийн хэмжээтэй илүү ойролцоо (өмнө ~38% → одоо ~64–82%).
    const satelliteFrac =
      0.64 + Math.min(lv, 22) * 0.0075 + (extraGers >= 4 ? 0.03 : 0);
    if (extraGers > 0) {
      const ringR = 13.2 + Math.min(lv * 0.45, 10);
      ringSpan = ringR + 7;
      for (let i = 0; i < extraGers; i++) {
        const ang = (i / extraGers) * Math.PI * 2 + rand(-0.06, 0.06);
        const extraS = s * satelliteFrac + rand(0, 0.07);
        this.makeGer(
          x + Math.cos(ang) * ringR,
          z + Math.sin(ang) * ringR,
          rand(0, Math.PI * 2),
          extraS,
          false,
          "",
          root,
        );
      }
    }
    const { halfW, halfD } = getPlayerHomeYardHalfAxes(lv, livestock);
    const yardW = halfW * 2;
    const yardD = halfD * 2;
    this.makeFence(x, z, yardW, yardD, 0, false, root);
  }

  buildPlayerLivestockNearHome(livestock?: {
    sheep: number;
    goat: number;
    cow: number;
    horse: number;
    camel: number;
  }): void {
    const prev = this.scene.getObjectByName("playerHomeLivestock");
    if (prev) this.scene.remove(prev);

    if (!livestock) return;
    const x = this.playerHomeX;
    const z = this.playerHomeZ;
    const sheepN = Math.max(0, Math.min(14, Math.floor(livestock.sheep)));
    const goatN = Math.max(0, Math.min(12, Math.floor(livestock.goat)));
    const cowN = Math.max(0, Math.min(8, Math.floor(livestock.cow)));
    const horseN = Math.max(0, Math.min(5, Math.floor(livestock.horse)));
    const camelN = Math.max(0, Math.min(4, Math.floor(livestock.camel)));
    if (sheepN + goatN + cowN + horseN + camelN === 0) return;

    const root = new THREE.Group();
    root.name = "playerHomeLivestock";
    this.scene.add(root);

    const sheepMat = mkMat(0xf1e7d5, 0.92);
    const goatMat = mkMat(0xe8dcc8, 0.9);
    const cowMat = mkMat(0x5c4030, 0.9);
    const hoofMat = mkMat(0x2a1508, 0.9);

    const yardOx = () => rand(-9, 9);
    const yardOz = () => rand(4, 11);

    const addRuminant = (
      ox: number,
      oz: number,
      sc: number,
      bodyMat: THREE.MeshStandardMaterial,
      withHorns: boolean,
      withFluffyEars: boolean,
    ) => {
      const y = terrainHeight(x + ox, z + oz);
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 * sc, 12, 10),
        bodyMat,
      );
      body.scale.set(1.22, 1.05, 1.15);
      body.position.y = 0.48 * sc;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.19 * sc, 10, 10),
        mkMat(0x6a3a10, 0.9),
      );
      head.position.set(0.42 * sc, 0.58 * sc, 0);
      g.add(head);
      if (withFluffyEars) {
        const earL = new THREE.Mesh(
          new THREE.ConeGeometry(0.06 * sc, 0.14 * sc, 6),
          bodyMat,
        );
        earL.position.set(0.38 * sc, 0.68 * sc, 0.12 * sc);
        earL.rotation.z = 0.5;
        g.add(earL);
        const earR = earL.clone();
        earR.position.z = -0.12 * sc;
        earR.rotation.z = -0.5;
        g.add(earR);
      }
      if (withHorns) {
        [-1, 1].forEach((sg) => {
          const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.035 * sc, 0.22 * sc, 6),
            mkMat(0x3a2a18, 0.9),
          );
          horn.position.set(0.36 * sc, 0.78 * sc, sg * 0.1 * sc);
          horn.rotation.z = sg * 0.65;
          horn.rotation.x = 0.35;
          g.add(horn);
        });
      }
      const legW = 0.22;
      [-legW, legW].forEach((lx) => {
        [-0.14, 0.14].forEach((lz) => {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.042 * sc, 0.048 * sc, 0.32 * sc, 6),
            hoofMat,
          );
          leg.position.set(lx * sc, 0.17 * sc, lz);
          g.add(leg);
        });
      });
      g.position.set(x + ox, y + 0.04, z + oz);
      g.rotation.y = rand(0, Math.PI * 2);
      root.add(g);
    };

    for (let i = 0; i < sheepN; i++) {
      addRuminant(yardOx(), yardOz(), 1.12, sheepMat, false, true);
    }
    for (let i = 0; i < goatN; i++) {
      addRuminant(yardOx(), yardOz(), 0.94, goatMat, true, false);
    }
    for (let i = 0; i < cowN; i++) {
      const ox = yardOx();
      const oz = yardOz();
      const sc = 1.38;
      const y = terrainHeight(x + ox, z + oz);
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.95 * sc, 0.62 * sc, 1.15 * sc),
        cowMat,
      );
      body.position.y = 0.55 * sc;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.42 * sc, 0.38 * sc, 0.52 * sc),
        mkMat(0x4a3228, 0.88),
      );
      head.position.set(0.62 * sc, 0.62 * sc, 0);
      g.add(head);
      [-0.32, 0.32].forEach((lx) => {
        [-0.22, 0.22].forEach((lz) => {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055 * sc, 0.06 * sc, 0.38 * sc, 6),
            hoofMat,
          );
          leg.position.set(lx * sc, 0.2 * sc, lz);
          g.add(leg);
        });
      });
      g.position.set(x + ox, y + 0.04, z + oz);
      g.rotation.y = rand(0, Math.PI * 2);
      root.add(g);
    }

    for (let i = 0; i < horseN; i++) {
      this.makeHorse(
        x + rand(-8, 8),
        z + rand(3.5, 10),
        rand(0, Math.PI * 2),
        [0x6b3a1f, 0x8a6030, 0xc8a060][randInt(0, 2)],
        false,
        0,
        0,
        5,
        0,
        root,
      );
    }

    for (let i = 0; i < camelN; i++) {
      this.makeCamel(
        x + rand(-9, 9),
        z + rand(4, 11),
        rand(0, Math.PI * 2),
        root,
      );
    }
  }

  /**
   * Газрын сонин цэг — өртөөний тэмдэг биш, жижиг овоо/чулуун тэмдэг.
   * `x, z` нь `stationWorldXZ`-аас (азотын өндөр: terrain).
   */
  buildWorldPoiMarkers(
    pois: { id: string; x: number; z: number }[],
  ): void {
    const prev = this.scene.getObjectByName("worldPoiMarkers");
    if (prev) {
      prev.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry?.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      this.scene.remove(prev);
    }
    if (pois.length === 0) return;
    const root = new THREE.Group();
    root.name = "worldPoiMarkers";
    for (const p of pois) {
      const y = terrainHeight(p.x, p.z);
      if (y > 85) continue;
      const g = new THREE.Group();
      g.name = `world_poi_${p.id}`;
      const base = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 0.95, 5),
        mkMat(0x6a5340, 0.9),
      );
      base.position.y = 0.48;
      const mid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.48, 0.7, 6),
        mkMat(0x8a7048, 0.88),
      );
      mid.position.y = 1.05;
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 7, 5),
        mkMat(0xc9a86c, 0.85),
      );
      cap.position.y = 1.52;
      g.add(base, mid, cap);
      g.position.set(p.x, y - 0.02, p.z);
      g.rotation.y = rand(0, Math.PI * 2);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.06, 5, 16),
        new THREE.MeshBasicMaterial({
          color: 0x9acd32,
          transparent: true,
          opacity: 0.32,
        }),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.04;
      g.add(rim);
      root.add(g);
    }
    this.scene.add(root);
  }

  buildGerCamps(): void {
    const S = STATION_SPREAD;
    [
      { gx: 3, gz: 2, n: 12, sp: 16 },
      { gx: -5, gz: -2, n: 10, sp: 12 },
      { gx: 8, gz: 4, n: 9, sp: 11 },
      { gx: -34, gz: -10, n: 10, sp: 14 },
      { gx: -30, gz: -2, n: 10, sp: 13 },
      { gx: -36, gz: 5, n: 9, sp: 11 },
      { gx: -38, gz: 4, n: 10, sp: 12 },
      { gx: -34, gz: 9, n: 8, sp: 10 },
      { gx: -38, gz: 18, n: 9, sp: 11 },
      { gx: -56, gz: 20, n: 8, sp: 12 },
      { gx: -27, gz: -22, n: 8, sp: 11 },
      { gx: -23, gz: -18, n: 7, sp: 9 },
      { gx: -63, gz: -32, n: 8, sp: 11 },
      { gx: -58, gz: -28, n: 7, sp: 10 },
      { gx: -5, gz: 28, n: 8, sp: 16 },
      { gx: 14, gz: 30, n: 6, sp: 12 },
      { gx: -20, gz: 40, n: 6, sp: 12 },
      { gx: 30, gz: 32, n: 6, sp: 11 },
      { gx: 42, gz: 44, n: 6, sp: 11 },
      { gx: 55, gz: 2, n: 8, sp: 12 },
      { gx: 65, gz: -20, n: 7, sp: 11 },
      { gx: 58, gz: 12, n: 6, sp: 10 },
      { gx: 35, gz: 2, n: 9, sp: 11 },
      { gx: 48, gz: -12, n: 7, sp: 10 },
      { gx: -80, gz: 0, n: 7, sp: 10 },
      { gx: -80, gz: 16, n: 7, sp: 11 },
      { gx: -100, gz: -6, n: 7, sp: 10 },
      { gx: -98, gz: -36, n: 6, sp: 9 },
      { gx: 20, gz: -55, n: 8, sp: 14 },
      { gx: -50, gz: 55, n: 7, sp: 13 },
      { gx: 75, gz: 35, n: 6, sp: 12 },
      { gx: -120, gz: 25, n: 7, sp: 11 },
      { gx: 90, gz: -45, n: 7, sp: 13 },
    ].forEach(({ gx, gz, n, sp }) => {
      const cx = gx * S,
        cz = gz * S,
        spread = sp * S;
      const count = Math.max(1, Math.round(n * 0.16));
      const spreadWide = spread * 1.62;
      for (let i = 0; i < count; i++) {
        const x = cx + rand(-spreadWide / 2, spreadWide / 2),
          z = cz + rand(-spreadWide / 2, spreadWide / 2);
        if (this.distanceToNearestRoad(x, z) < 24) continue;
        this.makeGer(x, z, rand(0, Math.PI * 2), rand(0.8, 1.15));
        if (Math.random() > 0.45)
          this.makeFence(
            x,
            z,
            rand(7, 12),
            rand(6, 10),
            rand(0, Math.PI * 0.5),
          );
      }
    });
    // Нэмэлт сийрэг гэр — талын дүүргэлт (бага тоо, замаас хол)
    for (let k = 0; k < 12; k++) {
      const x = rand(-220 * S, 200 * S),
        z = rand(-130 * S, 120 * S);
      if (terrainBiome(x, z, terrainHeight(x, z)) === "river_plain") continue;
      if (this.distanceToNearestRoad(x, z) < 24) continue;
      this.makeGer(x, z, rand(0, Math.PI * 2), rand(0.75, 1.12));
    }
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

  /** Станц тойрог: жижиг багц — газрын өнгийг биш зөвхөн зүлэг мэт навч (хуучин өнгө) */
  private makeGrassClumpAt(x: number, z: number): void {
    const h = terrainHeight(x, z);
    if (h > 16 || h < -0.6) return;
    const biome = terrainBiome(x, z, h);
    const isGobi = biome === "gobi";
    const isForest = biome === "forest" || biome === "river_plain";
    const isAlpine = biome === "high_alpine";
    const g = new THREE.Group();
    const bladeCount = isAlpine
      ? randInt(1, 2)
      : isForest
        ? randInt(4, 8)
        : isGobi
          ? randInt(2, 4)
          : randInt(3, 7);
    const springSteppe = [0x8a9a72, 0x7a8a64, 0x9aaa82, 0x6f7f5c];
    const springForest = [0x5a6b48, 0x4d5c3c, 0x677a52];
    const springGobi = [0xb0aa78, 0xa29868, 0x9a9468];
    const springAlpine = [0x7a8a70, 0x8a9a80];
    const grassCols = isGobi
      ? springGobi
      : isForest
        ? springForest
        : isAlpine
          ? springAlpine
          : springSteppe;
    for (let b = 0; b < bladeCount; b++) {
      const bx = rand(-0.3, 0.3);
      const bz = rand(-0.3, 0.3);
      const blade = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.02,
          0.04,
          rand(0.16, isGobi ? 0.34 : isForest ? 0.55 : isAlpine ? 0.22 : 0.48),
          4,
        ),
        mkMat(grassCols[randInt(0, grassCols.length - 1)], 0.88),
      );
      blade.position.set(bx, rand(0.08, 0.28), bz);
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
    innerClearRadius = 0,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const rMin =
        innerClearRadius > 0
          ? Math.max(innerClearRadius, radius * 0.28)
          : radius * 0.2;
      const r = rand(rMin, radius);
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
    innerClearRadius = 0,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const rMin =
        innerClearRadius > 0
          ? Math.max(innerClearRadius, radius * 0.28)
          : radius * 0.22;
      const r = rand(rMin, radius);
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
    innerClear = 15,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(
        Math.max(radius * 0.36, innerClear * 0.9),
        radius * 0.95,
      );
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      if (Math.hypot(x - cx, z - cz) < innerClear) continue;
      if (this.distanceToNearestRoad(x, z) < 24) continue;
      this.makeGer(x, z, rand(0, Math.PI * 2), rand(0.82, 1.12));
    }
  }

  /** Өртөө хоорондын замаас ойрхон байрлуулахгүй (сийрэг гэр). */
  private distanceToNearestRoad(x: number, z: number): number {
    let minD = Infinity;
    this.roadPaths.forEach((center) => {
      if (center.length < 2) return;
      for (let i = 0; i < center.length - 1; i++) {
        const d = distPointSegment2D(
          x,
          z,
          center[i].x,
          center[i].z,
          center[i + 1].x,
          center[i + 1].z,
        );
        if (d < minD) minD = d;
      }
    });
    return minD;
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

    const centerClear =
      stationId === "ulaanbaatar"
        ? STATION_CENTER_CLEAR_ULAANBAATAR
        : STATION_CENTER_CLEAR;

    const tr = p.treeRadius ?? 30;
    const smin = p.treeScaleMin ?? 0.45;
    const smax = p.treeScaleMax ?? 1.05;
    if (p.trees && p.trees > 0) {
      const nt = Math.max(0, Math.floor(p.trees * 0.52));
      if (nt > 0)
        this.scatterPeripheryTrees(cx, cz, nt, tr, smin, smax, centerClear);
    }

    if (p.decorGers && p.decorGers > 0) {
      const nd = Math.max(0, Math.round(p.decorGers * 0.6));
      if (nd > 0)
        this.scatterPeripheryDecorGers(
          cx,
          cz,
          nd,
          p.gerRadius ?? 32,
          stationId === "ulaanbaatar" ? 48 : 19,
        );
    }

    if (p.camels && p.camels > 0) {
      const nc = Math.max(0, Math.floor(p.camels * 0.45));
      if (nc > 0) this.scatterPeripheryCamels(cx, cz, nc, p.camelRadius ?? 48);
    }

    if (p.horses && p.horses > 0) {
      const nh = Math.max(0, Math.floor(p.horses * 0.42));
      if (nh > 0) this.scatterPeripheryHorses(cx, cz, nh, p.horseRadius ?? 44);
    }

    if (p.rocks && p.rocks > 0)
      this.scatterPeripheryRocks(
        cx,
        cz,
        Math.max(0, Math.floor(p.rocks * 0.6)),
        p.rockRadius ?? 30,
        centerClear,
      );

    if (p.ovoos && p.ovoos > 0)
      this.scatterPeripheryOvoos(cx, cz, p.ovoos, p.ovooRadius ?? 24);

    if (p.grassClumps && p.grassClumps > 0)
      this.scatterGrassClumps(
        cx,
        cz,
        Math.max(0, Math.floor(p.grassClumps * 0.48)),
        p.grassRadius ?? 34,
      );

    if (p.reedPatches && p.reedPatches > 0)
      this.scatterPeripheryReeds(
        cx,
        cz,
        Math.max(0, Math.floor(p.reedPatches * 0.55)),
        p.reedRadius ?? 36,
      );
  }

  /** Бүх төрлийн өртөөнд ижил: тойрог гэр, хашаа, овоо, төвийн гол гэр */
  private layoutStandardGerCamp(x: number, z: number, stationId: string): void {
    const ringSeed = stationId
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    /** Тойргийн илүү сийрэг зай: жижиг гэрүүд нэгнээсээ болон төв гэрээр арай хол. */
    const ringR = 31.0 + (ringSeed % 6) * 0.48;
    const nSat = 12;
    for (let i = 0; i < nSat; i++) {
      const ang = (i / nSat) * Math.PI * 2 + rand(-0.05, 0.05);
      const gx = x + Math.cos(ang) * ringR;
      const gz = z + Math.sin(ang) * ringR;
      this.makeGer(
        gx,
        gz,
        rand(0, Math.PI * 2),
        rand(
          STATION_SATELLITE_GER_SCALE_MIN * 0.82,
          STATION_SATELLITE_GER_SCALE_MAX * 0.86,
        ),
        false,
      );
    }
    this.makeGer(
      x,
      z,
      rand(0, Math.PI * 2),
      STATION_MAIN_GER_SCALE,
      true,
      stationId,
    );
    const fenceHalf = ringR + 14.8;
    this.makeFence(
      x,
      z,
      fenceHalf * 2,
      fenceHalf * 1.72,
      rand(0, Math.PI * 0.25),
      true,
    );
    this.makeOvoo(x + 5, z + 4);
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
      const x = cfg.wx * WORLD_SCALE * STATION_SPREAD,
        z = cfg.wz * WORLD_SCALE * STATION_SPREAD;
      const cur = s.id === this.currentStationId;
      const done = this.doneStationIds.includes(s.id);

      if (PALACE_IDS.includes(s.id)) {
        this.makePalace(x, z, s.id, cur, done);
        this.layoutSacredSiteCamp(x, z, s.id, "palace");
      } else if (MONASTERY_IDS.includes(s.id)) {
        this.makeMonastery(x, z, s.id, cur, done);
        this.layoutSacredSiteCamp(x, z, s.id, "monastery");
      } else if (MOUNTAIN_IDS.includes(s.id)) {
        this.makeMountainShrine(x, z, s.id, cur, done);
        this.layoutStandardGerCamp(x, z, s.id);
      } else if (LAKE_IDS.includes(s.id)) {
        this.makeLakeStation(x, z, s.id, cur, done);
        this.layoutStandardGerCamp(x, z, s.id);
      } else if (SAND_IDS.includes(s.id)) {
        this.makeSandDunes(x, z, s.id, cur, done);
        this.layoutStandardGerCamp(x, z, s.id);
      } else if (ROCK_IDS.includes(s.id)) {
        this.makeRockSite(x, z, s.id, cur, done);
        this.layoutStandardGerCamp(x, z, s.id);
      } else if (NATPARK_IDS.includes(s.id)) {
        this.makeNatPark(x, z, s.id, cur, done);
        this.layoutStandardGerCamp(x, z, s.id);
      } else {
        this.layoutStandardGerCamp(x, z, s.id);
      }
      this.decorateStationPeriphery(s.id, x, z);
      this.makeStationSignboard(x, z, s.name, s.id, s.region ?? cfg.region);
    });
  }

  /** Гадна тавигдсан самбар — өртөөний нэр, бүс */
  private makeStationSignboard(
    cx: number,
    cz: number,
    stationName: string,
    stationId: string,
    regionLabel?: string,
  ): void {
    if (typeof document === "undefined") return;
    const seed = stationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const ox = 12 + (seed % 8) * 0.55;
    const oz = -10 - (seed % 6) * 0.45;
    const sx = cx + ox;
    const sz = cz + oz;
    const hy = terrainHeight(sx, sz);

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, 640, 200);
    bg.addColorStop(0, "rgba(28, 24, 18, 0.98)");
    bg.addColorStop(0.5, "rgba(38, 32, 26, 0.96)");
    bg.addColorStop(1, "rgba(22, 18, 14, 0.98)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 200);
    ctx.strokeStyle = "rgba(55, 44, 32, 0.55)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 3) {
      const g = Math.sin(x * 0.04 + seed * 0.01) * 8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + g * 0.02, 200);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(190, 160, 110, 0.95)";
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 620, 180);
    ctx.strokeStyle = "rgba(120, 95, 60, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 608, 168);
    ctx.fillStyle = "#f0e6d4";
    ctx.font = "bold 38px 'Georgia','Times New Roman',serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const title =
      stationName.length > 22 ? `${stationName.slice(0, 21)}…` : stationName;
    ctx.fillText(title, 320, 78);
    if (regionLabel?.trim()) {
      const sub =
        regionLabel.length > 36 ? `${regionLabel.slice(0, 35)}…` : regionLabel;
      ctx.font = "26px 'Georgia','Times New Roman',serif";
      ctx.fillStyle = "rgba(210, 195, 170, 0.95)";
      ctx.fillText(sub, 320, 138);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.82,
      metalness: 0.06,
      envMapIntensity: 0.42,
      transparent: false,
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), mat);
    const wood = mkMat(0x3d2e22, 0.92);
    const postGeo = new THREE.CylinderGeometry(0.16, 0.19, 3.6, 12);
    const postL = new THREE.Mesh(postGeo, wood);
    const postR = new THREE.Mesh(postGeo, wood);
    postL.position.set(-7.2, 1.8, 0);
    postR.position.set(7.2, 1.8, 0);
    postL.castShadow = true;
    postR.castShadow = true;
    board.position.set(0, 3.45, 0.06);
    board.castShadow = true;
    const yaw = ((seed % 80) / 80 - 0.5) * 0.5;
    const grp = new THREE.Group();
    grp.add(postL, postR, board);
    grp.rotation.y = yaw;
    grp.position.set(sx, hy, sz);
    this.scene.add(grp);
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
    {
      const gateZ = z + (-12 * sc - 0.4);
      const gateX = x;
      this.doorAnchors.set(
        id,
        new THREE.Vector3(gateX, terrainHeight(gateX, gateZ) + 0.42, gateZ),
      );
    }
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
    {
      const ez = z - 9 * sc;
      const ex = x;
      this.doorAnchors.set(
        id,
        new THREE.Vector3(ex, terrainHeight(ex, ez) + 0.42, ez),
      );
    }
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
    const g = new THREE.Group();

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
    for (let i = 0; i < 18; i++) {
      let tx = x;
      let tz = z;
      for (let k = 0; k < 14; k++) {
        tx = x + rand(-12, 12);
        tz = z + rand(-10, 10);
        if (Math.hypot(tx - x, tz - z) >= 22) break;
      }
      this.makeTree(tx, tz, rand(0.7, 1.2));
    }

    this.makeHorse(x + 5, z + 3, rand(0, Math.PI * 2), 0xb8622a, false);
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
      emissiveIntensity: cur ? 0.68 : 0.52,
      roughness: 0.14,
      metalness: 0.2,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.25 * sc, 0.24 * sc, 12, 52),
      mat,
    );
    ring.position.set(lx, ly, lz);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    this.markerMeshes.set(id, ring);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82 * sc, 12, 12),
      new THREE.MeshBasicMaterial({
        color: mc,
        transparent: true,
        opacity: cur ? 0.16 : 0.11,
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

  /**
   * Ерөнхий дүүргэсэн уулын конусыг хассан — гол харагдах уул нь өртөө бүрийн
   * `buildStationGers` доторх `makeMountainShrine` болон газрын `terrainHeight`.
   */
  buildMountains(): void {}

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
    attachParent?: THREE.Object3D,
  ): THREE.Group {
    const g = new THREE.Group();
    const hm = materialLibrary.getHideMaterial(color);
    const dk = mkFurMat(0x2a1508, 0.86);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 0.44), hm);
    body.position.y = 0.9;
    body.rotation.z = 0.04;
    body.castShadow = true;
    g.add(body);
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.17, 0.62, 12),
      hm,
    );
    neck.position.set(0.42, 1.15, 0);
    neck.rotation.z = -0.52;
    neck.castShadow = true;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.27), hm);
    head.position.set(0.68, 1.38, 0);
    head.castShadow = true;
    g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), hm);
    snout.position.set(0.9, 1.31, 0);
    snout.castShadow = true;
    g.add(snout);
    const eyeMat = mkMat(0x1a1208, 0.25);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), eyeMat);
    eye.position.set(0.79, 1.41, 0.12);
    g.add(eye);
    const eye2 = eye.clone();
    eye2.position.z = -0.12;
    g.add(eye2);
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), hm);
    earL.position.set(0.62, 1.52, 0.1);
    earL.rotation.set(0.35, 0, -0.45);
    g.add(earL);
    const earR = earL.clone();
    earR.position.z = -0.1;
    earR.rotation.z = 0.45;
    g.add(earR);
    const legGroups: THREE.Group[] = [];
    [
      [0.3, 0, -0.15],
      [0.3, 0, 0.15],
      [-0.3, 0, -0.15],
      [-0.3, 0, 0.15],
    ].forEach(([lx, , lz]) => {
      const lg = new THREE.Group();
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.06, 0.42, 10),
        hm,
      );
      upper.position.y = -0.21;
      upper.castShadow = true;
      lg.add(upper);
      const lower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.048, 0.38, 10),
        hm,
      );
      lower.position.y = -0.6;
      lower.castShadow = true;
      lg.add(lower);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.16), dk);
      hoof.position.y = -0.82;
      hoof.castShadow = true;
      lg.add(hoof);
      lg.position.set(lx, 0.75, lz);
      g.add(lg);
      legGroups.push(lg);
    });
    (g as THREE.Group & { _legGroups?: THREE.Group[] })._legGroups = legGroups;
    // Tail: segmented + tuft for clearer horse silhouette.
    const tailRoot = new THREE.Group();
    tailRoot.position.set(-0.56, 1.0, 0);
    tailRoot.rotation.z = 1.25;
    const tailBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.034, 0.36, 8),
      hm,
    );
    tailBase.position.y = -0.17;
    tailBase.castShadow = true;
    tailRoot.add(tailBase);
    const tailMid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.026, 0.34, 8),
      dk,
    );
    tailMid.position.y = -0.43;
    tailMid.castShadow = true;
    tailRoot.add(tailMid);
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 9), dk);
    tailTip.position.y = -0.73;
    tailTip.rotation.z = 0.04;
    tailTip.castShadow = true;
    tailRoot.add(tailTip);
    g.add(tailRoot);
    for (let m = 0; m < 7; m++) {
      const maneStrand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.038, 0.2 + m * 0.04, 6),
        dk,
      );
      maneStrand.position.set(
        0.26 + m * 0.045,
        1.16 + m * 0.045,
        (m % 2 === 0 ? 1 : -1) * 0.07,
      );
      maneStrand.rotation.z = -0.5 - m * 0.045;
      maneStrand.castShadow = true;
      g.add(maneStrand);
    }
    const groundY = terrainHeightFeet(x, z, rotY) + 0.1;
    g.position.set(x, groundY, z);
    g.rotation.y = rotY;
    g.scale.setScalar(
      PROCEDURAL_HORSE_UNIFIED_SCALE *
        rand(
          1 - PROCEDURAL_HORSE_SCALE_JITTER,
          1 + PROCEDURAL_HORSE_SCALE_JITTER,
        ),
    );
    g.castShadow = true;
    (attachParent ?? this.scene).add(g);
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
      { x: -32, z: -10 },
      { x: 35, z: 0 },
      { x: 52, z: -20 },
      { x: -62, z: -30 },
      { x: -80, z: 0 },
      { x: 0, z: 28 },
      { x: -18, z: 36 },
      { x: 10, z: -2 },
      { x: 28, z: -8 },
    ].forEach(({ x, z }) => {
      const orbitR = rand(5, 12),
        phase = rand(0, Math.PI * 2);
      this.makeHorse(
        x + Math.cos(phase) * orbitR,
        z + Math.sin(phase) * orbitR,
        rand(0, Math.PI),
        HORSE_COLORS[randInt(0, HORSE_COLORS.length - 1)],
        false,
      );
    });
    for (let i = 0; i < 9; i++) {
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

  makeCamel(
    x: number,
    z: number,
    rotY = 0,
    attachParent?: THREE.Object3D,
  ): void {
    const g = new THREE.Group();
    const furC = [0xc8a060, 0xb89050, 0xd0a070, 0xbea068][randInt(0, 3)];
    const cm = materialLibrary.getHideMaterial(furC);
    const dk = mkFurMat(0x6a4028, 0.88);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.64, 0.6), cm);
    body.position.y = 1.2;
    body.castShadow = true;
    g.add(body);
    [
      [-0.28, 1.54],
      [0.28, 1.54],
    ].forEach(([ox, oy]) => {
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), cm);
      hump.position.set(ox, oy, 0);
      hump.scale.set(0.8, 1.08, 0.7);
      hump.castShadow = true;
      g.add(hump);
    });
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.19, 0.78, 12),
      cm,
    );
    neck.position.set(0.7, 1.5, 0);
    neck.rotation.z = -0.42;
    neck.castShadow = true;
    g.add(neck);
    const chead = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.3, 0.3), cm);
    chead.position.set(1.12, 1.72, 0);
    chead.castShadow = true;
    g.add(chead);
    const earC = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), cm);
    earC.position.set(1.08, 1.86, 0.12);
    earC.rotation.set(0.2, 0, -0.6);
    g.add(earC);
    const earC2 = earC.clone();
    earC2.position.z = -0.12;
    earC2.rotation.z = 0.6;
    g.add(earC2);
    const tailC = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.03, 0.55, 8),
      dk,
    );
    tailC.position.set(-0.72, 1.15, 0);
    tailC.rotation.z = 0.85;
    tailC.castShadow = true;
    g.add(tailC);
    [
      [0.45, 0, -0.22],
      [0.45, 0, 0.22],
      [-0.45, 0, -0.22],
      [-0.45, 0, 0.22],
    ].forEach(([lx, , lz]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.07, 1.1, 10),
        cm,
      );
      leg.position.set(lx, 0.58, lz);
      leg.castShadow = true;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), dk);
      foot.position.set(lx, 0.07, lz);
      foot.scale.set(1.25, 0.48, 1.45);
      foot.castShadow = true;
      g.add(foot);
    });
    const cground = terrainHeightFeet(x, z, rotY) + 0.12;
    g.position.set(x, cground, z);
    g.rotation.y = rotY;
    g.scale.setScalar(
      PROCEDURAL_CAMEL_UNIFIED_SCALE *
        rand(
          1 - PROCEDURAL_CAMEL_SCALE_JITTER,
          1 + PROCEDURAL_CAMEL_SCALE_JITTER,
        ),
    );
    g.castShadow = true;
    (attachParent ?? this.scene).add(g);
  }

  buildCamels(): void {
    // Говийн бүсэд тэмээ
    [
      { x: -22, z: 30 },
      { x: -18, z: 34 },
      { x: 0, z: 32 },
      { x: 10, z: 34 },
      { x: 30, z: 28 },
      { x: 40, z: 30 },
      { x: 45, z: 34 },
    ].forEach(({ x, z }) =>
      this.makeCamel(x + rand(-3, 3), z + rand(-3, 3), rand(0, Math.PI * 2)),
    );
  }

  buildClouds(): void {
    // Clouds are heavy (many meshes). Keep count modest for performance.
    for (let i = 0; i < MAP_CLOUD_COUNT; i++) {
      const cg = new THREE.Group();
      const puffN = randInt(3, 8);
      for (let p = 0; p < puffN; p++) {
        const cs = rand(2.5, 8);
        const cm = new THREE.Mesh(
          new THREE.SphereGeometry(rand(0.85, 1.55) * cs, 9, 7),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.95,
            metalness: 0,
            emissive: 0xe8f0ff,
            emissiveIntensity: 0.1 + Math.random() * 0.08,
            transparent: true,
            opacity: rand(0.78, 0.96),
          }),
        );
        cm.position.set(
          rand(-6, 6) * cs * 0.42,
          rand(-0.9, 1.4) * cs * 0.28,
          rand(-3, 3) * cs * 0.22,
        );
        cg.add(cm);
      }
      const ang = rand(0, Math.PI * 2);
      const rad = rand(80, 420);
      cg.position.set(
        Math.cos(ang) * rad + rand(-40, 40),
        rand(78, 168),
        Math.sin(ang) * rad + rand(-40, 40),
      );
      this.scene.add(cg);
      this.clouds.push({
        g: cg,
        speed: rand(0.004, 0.034) * (Math.random() > 0.48 ? 1 : -1),
        alt: cg.position.y,
      });
    }
  }

  buildBirds(): void {
    for (let i = 0; i < MAP_BIRD_COUNT; i++) {
      const pivot = new THREE.Group();
      const bx = rand(-1, 1) > 0 ? rand(-290, 290) : rand(-220, 220);
      const bz = rand(-1, 1) > 0 ? rand(-240, 240) : rand(-180, 180);
      pivot.position.set(bx + rand(-35, 35), rand(52, 118), bz + rand(-35, 35));
      const arm = new THREE.Group();
      arm.position.x = rand(8, 34);
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
        speed: rand(0.18, 0.72),
        radius: rand(9, 36),
        yOff: rand(-9, 9),
        phase: rand(0, Math.PI * 2),
        wingMesh,
        alt: pivot.position.y,
      });
    }
  }

  buildGrassTufts(): void {
    /** Газрын дүрслэлийг хуучин үлдээн, зөвхөн сарнисан багц багц зүлэг (олон нягт нэгдэл биш) */
    const springSteppe = [0x8a9a72, 0x7a8a64, 0x9aaa82, 0x6f7f5c, 0xa3b08a];
    const springForest = [0x5a6b48, 0x4d5c3c, 0x677a52, 0x5f6d44];
    const springGobi = [0xb0aa78, 0xa29868, 0x9a9468, 0xc0b888];
    const springAlpine = [0x7a8a70, 0x8a9a80, 0x6a7a62];

    const matPool = (cols: number[]) =>
      cols.map((c) => {
        const m = mkMat(c, 0.7);
        m.envMapIntensity = 0.3;
        return m;
      });
    const matsSteppe = matPool(springSteppe);
    const matsForest = matPool(springForest);
    const matsGobi = matPool(springGobi);
    const matsAlpine = matPool(springAlpine);
    const planePoolSteppe = springSteppe.map((c) => {
      const m = mkMat(c, 0.68);
      m.side = THREE.DoubleSide;
      m.envMapIntensity = 0.28;
      return m;
    });
    const planePoolForest = springForest.map((c) => {
      const m = mkMat(c, 0.68);
      m.side = THREE.DoubleSide;
      m.envMapIntensity = 0.28;
      return m;
    });
    const planePoolGobi = springGobi.map((c) => {
      const m = mkMat(c, 0.68);
      m.side = THREE.DoubleSide;
      m.envMapIntensity = 0.28;
      return m;
    });
    const planePoolAlpine = springAlpine.map((c) => {
      const m = mkMat(c, 0.68);
      m.side = THREE.DoubleSide;
      m.envMapIntensity = 0.28;
      return m;
    });

    const spreadX = TERRAIN_W * 0.5 - 10;
    const spreadZ = TERRAIN_D * 0.5 - 10;
    for (let i = 0; i < 1480; i++) {
      const radial = Math.sqrt(Math.random());
      const ang = rand(0, Math.PI * 2);
      const x = Math.cos(ang) * spreadX * radial + rand(-16, 16);
      const z = Math.sin(ang) * spreadZ * radial + rand(-10, 10);
      const h = terrainHeight(x, z);
      if (h > 18 || h < -0.85) continue;
      const g = new THREE.Group();
      const biome = terrainBiome(x, z, h);
      const isGobi = biome === "gobi";
      const isForest = biome === "forest" || biome === "river_plain";
      const isAlpine = biome === "high_alpine";
      const bladeCount = isAlpine
        ? randInt(1, 4)
        : isForest
          ? randInt(4, 10)
          : isGobi
            ? randInt(2, 5)
            : randInt(4, 9);
      const cylMats = isGobi
        ? matsGobi
        : isForest
          ? matsForest
          : isAlpine
            ? matsAlpine
            : matsSteppe;
      const plMats = isGobi
        ? planePoolGobi
        : isForest
          ? planePoolForest
          : isAlpine
            ? planePoolAlpine
            : planePoolSteppe;
      const bladeH = isAlpine
        ? rand(0.12, 0.28)
        : isGobi
          ? rand(0.16, 0.36)
          : isForest
            ? rand(0.22, 0.62)
            : rand(0.2, 0.55);
      for (let b = 0; b < bladeCount; b++) {
        const bx = rand(-0.34, 0.34),
          bz = rand(-0.34, 0.34);
        const ci = randInt(0, cylMats.length - 1);
        if (b % 3 === 0) {
          const blade = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.036, bladeH, 5),
            cylMats[ci],
          );
          blade.position.set(bx, rand(0.08, 0.26), bz);
          blade.rotation.z = rand(-0.42, 0.42);
          blade.rotation.x = rand(-0.22, 0.22);
          // Grass casting shadows is very expensive; let terrain/trees carry shadows.
          blade.castShadow = false;
          g.add(blade);
        } else {
          const ph = bladeH * 1.08;
          const blade = new THREE.Mesh(
            new THREE.PlaneGeometry(0.06, ph),
            plMats[ci],
          );
          blade.position.set(bx, ph * 0.5 + rand(0, 0.12), bz);
          blade.rotation.y = rand(0, Math.PI);
          blade.rotation.x = rand(-0.25, 0.25);
          blade.castShadow = false;
          g.add(blade);
        }
      }
      g.position.set(x, h, z);
      this.scene.add(g);
    }

    // Sparse filler pass to keep grass visible in otherwise empty areas.
    for (let i = 0; i < 640; i++) {
      const x = rand(-spreadX, spreadX);
      const z = rand(-spreadZ, spreadZ);
      const h = terrainHeight(x, z);
      if (h > 20 || h < -0.9) continue;
      if (terrainBiome(x, z, h) === "high_alpine" && Math.random() > 0.5) continue;
      this.makeGrassClumpAt(x, z);
    }
  }

  buildRocks(): void {
    for (let i = 0; i < 115; i++) {
      const x = rand(-160, 90),
        z = rand(-55, 60);
      const h = terrainHeight(x, z);
      const biome = terrainBiome(x, z, h);
      if (biome === "river_plain") continue;
      const rg = new THREE.Group();
      const nearMtn = h > 5;
      for (let j = 0; j < randInt(1, nearMtn ? 6 : 3); j++) {
        const size = nearMtn ? rand(0.3, 1.3) : rand(0.15, 0.65);
        const stoneMat = materialLibrary
          .getStoneMaterial(randInt(0, 2))
          .clone();
        stoneMat.color = new THREE.Color(nearMtn ? 0x787060 : 0x888070);
        const rm = new THREE.Mesh(
          new THREE.DodecahedronGeometry(size * rand(0.5, 1.8), 1),
          stoneMat,
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
      if (cfg)
        pos.set(s.id, {
          wx: cfg.wx * WORLD_SCALE * STATION_SPREAD,
          wz: cfg.wz * WORLD_SCALE * STATION_SPREAD,
        });
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

    // Гол замууд л үлдээж, салаа/урт сегментийг цөөлнө (mesh + roadPaths хөнгөн).
    const ROUTES: string[][] = [
      [
        "khovd",
        "altai",
        "khatgal",
        "moron",
        "kharakhorum",
        "erdenet",
        "darkhan",
        "ulaanbaatar",
      ],
      [
        "ulaanbaatar",
        "nalaikh",
        "terelj",
        "ondorhaan",
        "kherlenbayan",
        "choibalsan",
      ],
      ["ulaanbaatar", "zuunmod", "mandalgovi"],
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

        const STEPS = 16;
        const center: THREE.Vector3[] = [];
        const dx = b.wx - a.wx,
          dz = b.wz - a.wz;
        const perpLen = Math.sqrt(dx * dx + dz * dz) || 1;

        for (let t = 0; t <= STEPS; t++) {
          const f = t / STEPS;
          const cx = a.wx + dx * f;
          const cz = a.wz + dz * f;
          const jitter = Math.sin(f * Math.PI * 2.5) * 10;
          const bow = Math.sin(f * Math.PI) * 32;
          const jx = cx + (-dz / perpLen) * (jitter + bow);
          const jz = cz + (dx / perpLen) * (jitter + bow);
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

        if (Math.random() > 0.82) {
          const mid = center[Math.floor(STEPS / 2)];
          this.makeOvoo(mid.x + rand(-6, 6), mid.z + rand(-6, 6));
        }
      }
    });
  }
}
