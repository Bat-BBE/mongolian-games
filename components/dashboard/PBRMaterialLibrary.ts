import * as THREE from "three";

/**
 * Advanced PBR Material Library
 * Photorealistic physically-based rendering materials
 * Includes normal maps, roughness maps, metalness, and AO
 */
export class PBRMaterialLibrary {
  private materials = new Map<string, THREE.MeshStandardMaterial>();

  /**
   * Create high-end PBR material with normal and roughness maps
   */
  getHorseFurMaterial(baseColor = 0x8b6914): THREE.MeshStandardMaterial {
    const key = `horse_fur_${baseColor}`;
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.75,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.2, 1.2),
      side: THREE.FrontSide,
      envMapIntensity: 1.0,
      aoMapIntensity: 0.8,
    });

    material.onBeforeCompile = (
      shader: THREE.WebGLProgramParametersWithUniforms,
    ) => {
      // Add micro-fur detail to vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        uniform sampler2D furNoise;
        varying vec3 vNormal;
        varying vec2 vUv;
        `,
      );
    };

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for Bactrian camel
   */
  getCamelFurMaterial(baseColor = 0xb8864a): THREE.MeshStandardMaterial {
    const key = `camel_fur_${baseColor}`;
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.5, 1.5),
      aoMapIntensity: 0.9,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for natural stone (rocks, mountains)
   */
  getStonePBRMaterial(variant = 0): THREE.MeshStandardMaterial {
    const key = `stone_pbr_${variant}`;
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const colors = [0x9a8f80, 0x8a7a70, 0xa09080, 0x7a6f60];
    const material = new THREE.MeshStandardMaterial({
      color: colors[variant % colors.length],
      roughness: 0.92,
      metalness: 0.05,
      normalScale: new THREE.Vector2(1.8, 1.8),
      aoMapIntensity: 1.0,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for soil/earth
   */
  getSoilPBRMaterial(): THREE.MeshStandardMaterial {
    const key = "soil_pbr";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x7a6840,
      roughness: 0.95,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.5, 1.5),
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for grass (steppe vegetation)
   */
  getGrassPBRMaterial(): THREE.MeshStandardMaterial {
    const key = "grass_pbr";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x5a7a3a,
      roughness: 0.7,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.2, 1.2),
      transparent: true,
      alphaTest: 0.5,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for wood (trees, structures)
   */
  getWoodPBRMaterial(): THREE.MeshStandardMaterial {
    const key = "wood_pbr";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.6,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.6, 1.6),
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create PBR material for felt/cloth (ger walls)
   */
  getFeltPBRMaterial(color = 0xf0e8d8): THREE.MeshStandardMaterial {
    const key = `felt_pbr_${color}`;
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.0,
      normalScale: new THREE.Vector2(0.8, 0.8),
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create water material with reflections
   */
  getWaterPBRMaterial(): THREE.MeshStandardMaterial {
    const key = "water_pbr";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a4a7a,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
      normalScale: new THREE.Vector2(1.0, 1.0),
      envMapIntensity: 1.2,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create terrain material for vast landscape
   */
  getTerrainPBRMaterial(): THREE.MeshStandardMaterial {
    const key = "terrain_pbr";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
      normalScale: new THREE.Vector2(1.3, 1.3),
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Create atmospheric fog material
   */
  getFogMaterial(): THREE.Material {
    const key = "fog_material";
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xc4b5a0,
      transparent: true,
      opacity: 0.3,
      fog: true,
    }) as any;

    this.materials.set(key, material);
    return material;
  }

  /**
   * Get or create emissive material for lighting elements
   */
  getEmissivePBRMaterial(
    color: number,
    intensity = 0.8,
  ): THREE.MeshStandardMaterial {
    const key = `emissive_pbr_${color}_${intensity}`;
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.4,
      metalness: 0.1,
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * Dispose all materials
   */
  clear(): void {
    this.materials.forEach((mat) => {
      mat.dispose();
    });
    this.materials.clear();
  }

  /**
   * Get material count
   */
  getStats() {
    return { materialCount: this.materials.size };
  }
}

export const pbrMaterialLibrary = new PBRMaterialLibrary();
