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

/**
 * Terrain Builder
 * Improved terrain generation with proper UV mapping and biome-based texturing
 */
export class TerrainBuilder {
  private scene: THREE.Scene;
  private materialLib: typeof materialLibrary;

  constructor(scene: THREE.Scene, matLib: typeof materialLibrary) {
    this.scene = scene;
    this.materialLib = matLib;
  }

  /**
   * Build terrain with proper UV mapping and vertex coloring for biome variation
   */
  buildTerrainWithUV(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_W,
      TERRAIN_D,
      TERRAIN_SEG,
      TERRAIN_SEG,
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const uv = geo.attributes.uv as THREE.BufferAttribute;

    // Apply height and coloring
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      // Calculate biome colors
      const { r, g, b } = this.getBiomeColor(x, z, h);
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;

      // Set UV coordinates for texture tiling
      // Scale UV based on terrain size
      const scaledX = (x / TERRAIN_W + 0.5) * 4; // Repeat 4 times across width
      const scaledZ = (z / TERRAIN_D + 0.5) * 4; // Repeat 4 times across depth
      uv.setXY(i, scaledX, scaledZ);
    }

    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

    const material = this.materialLib.getTerrainMaterial();
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    this.scene.add(mesh);
    return mesh;
  }

  /**
   * Build biome-specific terrain regions with proper UV mapping
   * This splits terrain into regions for more detailed texturing
   */
  buildBiomeSpecificTerrains(): THREE.Group {
    const group = new THREE.Group();

    // Define biome regions and their materials
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

    // Create mesh for each biome
    biomeRegions.forEach((region) => {
      const geo = new THREE.PlaneGeometry(
        TERRAIN_W,
        TERRAIN_D,
        Math.max(40, Math.floor(TERRAIN_SEG / 3)),
        Math.max(40, Math.floor(TERRAIN_SEG / 3)),
      );
      geo.rotateX(-Math.PI / 2);

      const pos = geo.attributes.position as THREE.BufferAttribute;
      const uv = geo.attributes.uv as THREE.BufferAttribute;

      let vertexCount = 0;
      const positionArray: number[] = [];
      const uvArray: number[] = [];

      // Build geometry only for this biome's vertices
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = terrainHeight(x, z);

        if (region.test(x, z, h)) {
          pos.setY(i, h);
          vertexCount++;

          // Proper UV mapping
          const scaledX = (x / TERRAIN_W + 0.5) * 8;
          const scaledZ = (z / TERRAIN_D + 0.5) * 8;
          uv.setXY(i, scaledX, scaledZ);
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

  /**
   * Get biome-appropriate color for a terrain point
   */
  private getBiomeColor(
    x: number,
    z: number,
    h: number,
  ): { r: number; g: number; b: number } {
    const biome = terrainBiome(x, z, h);
    const orkhonX = -32 + Math.sin(z * 0.08) * 6;
    const nearRiver =
      Math.abs(x - orkhonX) < 10 || (Math.abs(x - 2) < 7 && z > -10 && z < 14);
    const n = pseudoNoise2D(x * 0.5, z * 0.5);
    const warm = smoothstep(-0.1, 0.9, n);

    let r: number, g: number, b: number;

    if (biome === "gobi") {
      const t = Math.min((z - 22) / 24, 1);
      r = 0.82 + t * 0.08 + warm * 0.025 + rand(-0.015, 0.015);
      g = 0.7 + t * 0.05 + warm * 0.018 + rand(-0.015, 0.015);
      b = 0.44 - t * 0.06 + rand(-0.015, 0.015);
    } else if (biome === "river_plain" || (nearRiver && h < 3.5)) {
      r = 0.32 + warm * 0.06 + rand(-0.02, 0.02);
      g = 0.48 + warm * 0.07 + rand(-0.025, 0.025);
      b = 0.26 + warm * 0.05 + rand(-0.02, 0.02);
    } else if (biome === "forest") {
      r = 0.32 + warm * 0.05 + rand(-0.02, 0.02);
      g = 0.44 + warm * 0.07 + rand(-0.025, 0.025);
      b = 0.22 + warm * 0.04 + rand(-0.015, 0.015);
    } else if (biome === "high_alpine") {
      const t = Math.min((h - 18) / 12, 1);
      r = 0.76 + t * 0.19 + rand(-0.015, 0.015);
      g = 0.74 + t * 0.2 + rand(-0.015, 0.015);
      b = 0.72 + t * 0.22 + rand(-0.015, 0.015);
    } else if (biome === "mountain") {
      r = 0.4 + warm * 0.05 + rand(-0.025, 0.025);
      g = 0.46 + warm * 0.06 + rand(-0.025, 0.025);
      b = 0.28 + warm * 0.04 + rand(-0.02, 0.02);
    } else if (h > 3) {
      r = 0.44 + warm * 0.05 + rand(-0.025, 0.025);
      g = 0.5 + warm * 0.07 + rand(-0.025, 0.025);
      b = 0.28 + warm * 0.04 + rand(-0.02, 0.02);
    } else if (nearRiver && h < 3) {
      r = 0.3 + rand(-0.025, 0.025);
      g = 0.5 + rand(-0.03, 0.03);
      b = 0.26 + rand(-0.02, 0.02);
    } else {
      const gr = Math.max(0, 1 - h * 0.065);
      r = 0.46 + gr * 0.06 + warm * 0.04 + rand(-0.02, 0.02);
      g = 0.52 + gr * 0.08 + warm * 0.04 + rand(-0.02, 0.02);
      b = 0.3 + gr * 0.05 + rand(-0.018, 0.018);
    }

    return { r, g, b };
  }

  /**
   * Build grass patches using instanced geometry for performance
   */
  buildGrassPatches(
    count = 1000,
    radius = TERRAIN_W * 0.4,
  ): THREE.InstancedMesh {
    const geo = new THREE.BoxGeometry(0.3, 0.4, 0.15, 3, 3, 2);
    const material = this.materialLib.getGrassMaterial();

    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = terrainHeight(x, z) + 0.2;

      matrix.makeTranslation(x, y, z);
      matrix.multiply(
        new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2),
      );
      matrix.multiply(
        new THREE.Matrix4().makeScale(
          0.8 + Math.random() * 0.4,
          0.8 + Math.random() * 0.5,
          0.8 + Math.random() * 0.4,
        ),
      );

      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
    return mesh;
  }

  /**
   * Get terrain builder stats
   */
  getStats(): {
    terrainSize: string;
    segmentCount: number;
    vertexCount: number;
  } {
    return {
      terrainSize: `${TERRAIN_W} x ${TERRAIN_D}`,
      segmentCount: TERRAIN_SEG,
      vertexCount: (TERRAIN_SEG + 1) * (TERRAIN_SEG + 1),
    };
  }
}
