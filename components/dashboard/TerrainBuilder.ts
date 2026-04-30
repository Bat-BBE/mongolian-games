import * as THREE from "three";
import { materialLibrary } from "./MaterialLibrary";
import {
  terrainHeight,
  terrainBiome,
  pseudoNoise2D,
  smoothstep,
  rand,
} from "./sceneHelpers";
import { TERRAIN_W, TERRAIN_D, TERRAIN_SEG } from "./mapConstants";

export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay =
  | "dawn"
  | "morning"
  | "noon"
  | "afternoon"
  | "dusk"
  | "night";

interface DayLightTint {
  r: number;
  g: number;
  b: number;
  intensity: number; // 0..1 – хэр их нөлөөлөх вэ
}

const DAY_LIGHT_TINTS: Record<TimeOfDay, DayLightTint> = {
  dawn: { r: 1.1, g: 0.8, b: 0.7, intensity: 0.18 }, // ягаан-улаан
  morning: { r: 1.08, g: 0.95, b: 0.82, intensity: 0.1 }, // зөөлөн алт
  noon: { r: 1.0, g: 1.0, b: 1.0, intensity: 0.0 }, // цэвэр цагаан
  afternoon: { r: 1.05, g: 0.98, b: 0.88, intensity: 0.08 }, // бага зэрэг алт
  dusk: { r: 1.15, g: 0.72, b: 0.45, intensity: 0.24 }, // улбар шар-улаан
  night: { r: 0.45, g: 0.52, b: 0.75, intensity: 0.35 }, // цэнхэр тэнгэрийн гэрэл
};

const SEASON_GRASS_FACTOR: Record<Season, number> = {
  spring: 1.1, // шинэлэг, цайвар ногоон
  summer: 1.0, // ердийн
  autumn: 0.7, // шаргал-хүрэн болсон
  winter: 0.3, // хуурай, цагаавтар
};

const SEASON_SOIL_FACTOR: Record<Season, number> = {
  spring: 0.9,
  summer: 1.0,
  autumn: 1.1, // хуурай, хүрэн
  winter: 0.85, // хөлдсөн
};

/** 0..1 утгыг [min, max] мужид шилжүүлнэ */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Гэрлийн тинтийг өнгөнд хэрэглэнэ */
function applyLightTint(
  r: number,
  g: number,
  b: number,
  tint: DayLightTint,
): { r: number; g: number; b: number } {
  const t = tint.intensity;
  return {
    r: lerp(r, r * tint.r, t),
    g: lerp(g, g * tint.g, t),
    b: lerp(b, b * tint.b, t),
  };
}

function nightSpecular(x: number, z: number, h: number): number {
  if (h > 2.0) return 0;
  const n = pseudoNoise2D(x * 3.1, z * 3.1);
  return Math.max(0, n * 0.12);
}

export class TerrainBuilder {
  private scene: THREE.Scene;
  private materialLib: typeof materialLibrary;
  private timeOfDay: TimeOfDay = "noon";
  private season: Season = "summer";

  constructor(scene: THREE.Scene, matLib: typeof materialLibrary) {
    this.scene = scene;
    this.materialLib = matLib;
  }

  setTimeOfDay(t: TimeOfDay): this {
    this.timeOfDay = t;
    return this;
  }

  setSeason(s: Season): this {
    this.season = s;
    return this;
  }

  buildTerrainWithUV(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_W,
      TERRAIN_D,
      TERRAIN_SEG,
      TERRAIN_SEG,
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      const { r, g, b } = this.getBiomeColor(x, z, h);
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;

      const biome = terrainBiome(x, z, h);
      const uvScale = this.getUVScale(biome);
      uv.setXY(
        i,
        (x / TERRAIN_W + 0.5) * uvScale,
        (z / TERRAIN_D + 0.5) * uvScale,
      );
    }

    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const material = this.materialLib.getTerrainMaterial();
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.name = "terrain_main";

    this.scene.add(mesh);
    return mesh;
  }

  buildBiomeSpecificTerrains(): THREE.Group {
    const group = new THREE.Group();
    group.name = "terrain_biomes";

    const biomeRegions = [
      {
        name: "forest",
        material: this.materialLib.getGrassMaterial(),
        test: (x: number, z: number, h: number) =>
          terrainBiome(x, z, h) === "forest",
      },
      {
        name: "steppe",
        material: this.materialLib.getGrassMaterial(),
        test: (x: number, z: number, h: number) =>
          terrainBiome(x, z, h) === "steppe",
      },
      {
        name: "gobi",
        material: this.materialLib.getSoilMaterial(),
        test: (x: number, z: number, h: number) =>
          terrainBiome(x, z, h) === "gobi",
      },
      {
        name: "mountain",
        material: this.materialLib.getStoneMaterial(),
        test: (x: number, z: number, h: number) =>
          terrainBiome(x, z, h) === "mountain",
      },
      {
        name: "high_alpine",
        material: this.materialLib.getStoneMaterial(1),
        test: (x: number, z: number, h: number) =>
          terrainBiome(x, z, h) === "high_alpine",
      },
    ];

    const segDiv = Math.max(40, Math.floor(TERRAIN_SEG / 3));

    biomeRegions.forEach((region) => {
      const geo = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_D, segDiv, segDiv);
      geo.rotateX(-Math.PI / 2);

      const pos = geo.attributes.position as THREE.BufferAttribute;
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      let vertexCount = 0;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = terrainHeight(x, z);

        if (region.test(x, z, h)) {
          pos.setY(i, h);
          vertexCount++;

          const uvScale = this.getUVScale(region.name as any);
          uv.setXY(
            i,
            (x / TERRAIN_W + 0.5) * uvScale,
            (z / TERRAIN_D + 0.5) * uvScale,
          );
        }
      }

      if (vertexCount > 0) {
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, region.material);
        mesh.receiveShadow = true;
        mesh.name = `terrain_${region.name}`;
        group.add(mesh);
      }
    });

    this.scene.add(group);
    return group;
  }

  private getBiomeColor(
    x: number,
    z: number,
    h: number,
  ): { r: number; g: number; b: number } {
    const biome = terrainBiome(x, z, h);
    const tint = DAY_LIGHT_TINTS[this.timeOfDay];
    const gFactor = SEASON_GRASS_FACTOR[this.season];
    const sFactor = SEASON_SOIL_FACTOR[this.season];

    const orkhonX = -32 + Math.sin(z * 0.08) * 6;
    const nearRiver =
      Math.abs(x - orkhonX) < 10 || (Math.abs(x - 2) < 7 && z > -10 && z < 14);

    const n = pseudoNoise2D(x * 0.5, z * 0.5);
    const nFine = pseudoNoise2D(x * 1.8, z * 1.8); // нарийн дэлгэрэнгүй
    const warm = smoothstep(-0.1, 0.9, n);
    const detail = nFine * 0.04;

    let r: number, g: number, b: number;

    if (biome === "gobi") {
      const t = Math.min((z - 22) / 24, 1);
      const coldShift = this.season === "winter" ? 0.06 : 0;
      r = (0.84 + t * 0.09 + warm * 0.025 + detail) * sFactor;
      g = (0.7 + t * 0.05 + warm * 0.018 + detail * 0.5) * sFactor;
      b = (0.44 - t * 0.07 + coldShift + detail * 0.3) * sFactor;

      if (this.season === "autumn") {
        r += 0.05;
        g -= 0.03;
      }
    } else if (biome === "river_plain" || (nearRiver && h < 3.5)) {
      r = (0.24 + warm * 0.06 + detail) * gFactor + rand(-0.018, 0.018);
      g = (0.52 + warm * 0.09 + detail) * gFactor + rand(-0.022, 0.022);
      b = (0.2 + warm * 0.05 + detail * 0.5) * gFactor + rand(-0.015, 0.015);

      if (this.timeOfDay === "night" || this.timeOfDay === "dusk") {
        const spec = nightSpecular(x, z, h);
        r += spec * 0.4;
        g += spec * 0.5;
        b += spec * 0.9;
      }
    } else if (biome === "forest") {
      let base_r = 0.22,
        base_g = 0.44,
        base_b = 0.18;
      if (this.season === "spring") {
        base_r = 0.28;
        base_g = 0.54;
        base_b = 0.2;
      } else if (this.season === "autumn") {
        base_r = 0.52;
        base_g = 0.4;
        base_b = 0.14;
      } else if (this.season === "winter") {
        base_r = 0.3;
        base_g = 0.34;
        base_b = 0.22;
      }
      r = (base_r + warm * 0.05 + detail) * gFactor + rand(-0.02, 0.02);
      g = (base_g + warm * 0.08 + detail) * gFactor + rand(-0.025, 0.025);
      b = (base_b + warm * 0.04 + detail * 0.5) * gFactor + rand(-0.015, 0.015);
    } else if (biome === "high_alpine") {
      const t = Math.min((h - 18) / 12, 1);
      const snowGlint =
        this.season === "winter" ? pseudoNoise2D(x * 4.0, z * 4.0) * 0.08 : 0;
      r = 0.78 + t * 0.18 + detail + snowGlint + rand(-0.012, 0.012);
      g = 0.76 + t * 0.2 + detail + snowGlint + rand(-0.012, 0.012);
      b = 0.74 + t * 0.23 + detail * 0.8 + snowGlint + rand(-0.012, 0.012);

      if (this.timeOfDay === "night") {
        r *= 0.82;
        g *= 0.88;
        b *= 1.08;
      }
    } else if (biome === "mountain") {
      const rockVar = pseudoNoise2D(x * 2.5, z * 2.5) * 0.06;
      r =
        (0.38 + warm * 0.05 + rockVar + detail) * sFactor + rand(-0.022, 0.022);
      g =
        (0.42 + warm * 0.06 + rockVar * 0.6 + detail * 0.7) * sFactor +
        rand(-0.022, 0.022);
      b =
        (0.3 + warm * 0.04 + rockVar * 0.4 + detail * 0.5) * sFactor +
        rand(-0.018, 0.018);
    } else if (h > 3) {
      r = (0.42 + warm * 0.05 + detail) * gFactor + rand(-0.022, 0.022);
      g = (0.52 + warm * 0.07 + detail) * gFactor + rand(-0.022, 0.022);
      b = (0.26 + warm * 0.04 + detail * 0.5) * gFactor + rand(-0.018, 0.018);
    } else if (nearRiver && h < 3) {
      r = (0.28 + detail) * gFactor + rand(-0.022, 0.022);
      g = (0.5 + detail) * gFactor + rand(-0.028, 0.028);
      b = (0.24 + detail * 0.5) * gFactor + rand(-0.018, 0.018);
    } else {
      const gr = Math.max(0, 1 - h * 0.065);
      r =
        (0.38 + gr * 0.08 + warm * 0.04 + detail) * gFactor +
        rand(-0.018, 0.018);
      g =
        (0.54 + gr * 0.1 + warm * 0.05 + detail) * gFactor +
        rand(-0.018, 0.018);
      b = (0.24 + gr * 0.06 + detail * 0.5) * gFactor + rand(-0.015, 0.015);
    }

    const final = applyLightTint(r, g, b, tint);

    return {
      r: Math.max(0, Math.min(1, final.r)),
      g: Math.max(0, Math.min(1, final.g)),
      b: Math.max(0, Math.min(1, final.b)),
    };
  }

  private getUVScale(biome: string): number {
    switch (biome) {
      case "gobi":
        return 3;
      case "steppe":
        return 5;
      case "river_plain":
        return 6;
      case "forest":
        return 8;
      case "mountain":
        return 7;
      case "high_alpine":
        return 6;
      default:
        return 4;
    }
  }

  buildGrassPatches(
    count = 1000,
    radius = TERRAIN_W * 0.4,
  ): THREE.InstancedMesh {
    const effectiveCount =
      this.season === "winter"
        ? Math.floor(count * 0.15)
        : this.season === "autumn"
          ? Math.floor(count * 0.55)
          : this.season === "spring"
            ? Math.floor(count * 0.9)
            : count;

    const geo = new THREE.BoxGeometry(0.3, 0.4, 0.15, 3, 3, 2);
    const material = this.materialLib.getGrassMaterial();
    const mesh = new THREE.InstancedMesh(geo, material, effectiveCount);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "grass_patches";

    const gFactor = SEASON_GRASS_FACTOR[this.season];
    const color = new THREE.Color(
      0.35 * gFactor,
      0.55 * gFactor,
      0.22 * gFactor,
    );

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < effectiveCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = terrainHeight(x, z) + 0.2;

      const biome = terrainBiome(x, z, terrainHeight(x, z));
      if (biome === "gobi" || biome === "high_alpine") {
        if (Math.random() > 0.15) continue;
      }

      const heightScale =
        this.season === "spring"
          ? 0.7 + Math.random() * 0.4
          : this.season === "summer"
            ? 0.9 + Math.random() * 0.6
            : this.season === "autumn"
              ? 0.5 + Math.random() * 0.4
              : /* winter */ 0.3 + Math.random() * 0.2;

      matrix.makeTranslation(x, y, z);
      matrix.multiply(
        new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2),
      );
      matrix.multiply(
        new THREE.Matrix4().makeScale(
          0.8 + Math.random() * 0.4,
          heightScale,
          0.8 + Math.random() * 0.4,
        ),
      );

      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.scene.add(mesh);
    return mesh;
  }

  refreshTerrainColors(mesh: THREE.Mesh): void {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute | undefined;
    if (!col) return;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = pos.getY(i);
      const { r, g, b } = this.getBiomeColor(x, z, h);
      col.setXYZ(i, r, g, b);
    }

    col.needsUpdate = true;
    geo.computeVertexNormals();
  }

  getStats(): {
    terrainSize: string;
    segmentCount: number;
    vertexCount: number;
    timeOfDay: TimeOfDay;
    season: Season;
  } {
    return {
      terrainSize: `${TERRAIN_W} x ${TERRAIN_D}`,
      segmentCount: TERRAIN_SEG,
      vertexCount: (TERRAIN_SEG + 1) * (TERRAIN_SEG + 1),
      timeOfDay: this.timeOfDay,
      season: this.season,
    };
  }
}
