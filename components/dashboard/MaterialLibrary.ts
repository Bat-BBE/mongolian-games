import * as THREE from "three";
import { textureManager } from "./TextureManager";

/**
 * Material Library
 * Centralized management of materials for terrain, animals, and structures
 * Provides consistent styling and reuses materials for performance
 */
export class MaterialLibrary {
  private materials = new Map<string, THREE.Material>();
  private textureManager: typeof textureManager;

  constructor(textureMgr: typeof textureManager) {
    this.textureManager = textureMgr;
  }

  /**
   * Create terrain material with biome-based coloring and texturing
   */
  getTerrainMaterial(): THREE.MeshStandardMaterial {
    const key = "terrain_standard";
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const detailMap = this.textureManager.getSoilTexture().clone();
    detailMap.wrapS = detailMap.wrapT = THREE.RepeatWrapping;
    detailMap.repeat.set(14, 14);
    detailMap.anisotropy = 4;

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: detailMap,
      roughness: 0.93,
      metalness: 0,
      side: THREE.FrontSide,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create grass material with texture
   */
  getGrassMaterial(): THREE.MeshStandardMaterial {
    const key = "grass_material";
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      map: this.textureManager.getGrassTexture(),
      roughness: 0.85,
      metalness: 0,
      color: 0x6a8c4a,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create stone/rock material
   */
  getStoneMaterial(variant = 0): THREE.MeshStandardMaterial {
    const key = `stone_material_${variant}`;
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      map: this.textureManager.getStoneTexture(512, 512, variant),
      roughness: 0.95,
      metalness: 0,
      color: 0xa09080,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create soil/dirt material
   */
  getSoilMaterial(): THREE.MeshStandardMaterial {
    const key = "soil_material";
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      map: this.textureManager.getSoilTexture(),
      roughness: 0.9,
      metalness: 0,
      color: 0x7a6840,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create horse/camel hide material
   */
  getHideMaterial(color = 0xc8a060): THREE.MeshStandardMaterial {
    const key = `hide_material_${color}`;
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      map: this.textureManager.getHideTexture(256, 256, color),
      roughness: 0.8,
      metalness: 0,
      color,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create wood material for trees and structures
   */
  getWoodMaterial(): THREE.MeshStandardMaterial {
    const key = "wood_material";
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      map: this.textureManager.getWoodTexture(),
      roughness: 0.7,
      metalness: 0,
      color: 0x8b5a1a,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create simple color material
   */
  getColorMaterial(
    color: number,
    roughness = 0.85,
    metalness = 0,
  ): THREE.MeshStandardMaterial {
    const key = `color_${color}_${roughness}_${metalness}`;
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create water material
   */
  getWaterMaterial(): THREE.MeshStandardMaterial {
    const key = "water_material";
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x2a6a94,
      roughness: 0.12,
      metalness: 0.22,
      transparent: true,
      opacity: 0.9,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create emissive material (for UI elements, markers)
   */
  getEmissiveMaterial(
    color: number,
    emissiveIntensity = 0.5,
  ): THREE.MeshStandardMaterial {
    const key = `emissive_${color}_${emissiveIntensity}`;
    if (this.materials.has(key)) {
      return this.materials.get(key) as THREE.MeshStandardMaterial;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Clear all materials
   */
  clear(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }

  /**
   * Get library stats
   */
  getStats(): { materialCount: number } {
    return {
      materialCount: this.materials.size,
    };
  }
}

// Export singleton instance
export const materialLibrary = new MaterialLibrary(textureManager);
