import * as THREE from "three";
import { pbrMaterialLibrary } from "./PBRMaterialLibrary";
import { advancedTextureManager } from "./AdvancedTextureManager";
import { rand } from "./sceneHelpers";

/**
 * Detailed Environment Builder
 * Creates realistic environmental elements: rocks, vegetation, paths, etc.
 */
export class DetailedEnvironmentBuilder {
  private scene: THREE.Scene;
  private pbrMaterials: typeof pbrMaterialLibrary;
  private textures: typeof advancedTextureManager;

  constructor(
    scene: THREE.Scene,
    pbrMats: typeof pbrMaterialLibrary,
    texs: typeof advancedTextureManager,
  ) {
    this.scene = scene;
    this.pbrMaterials = pbrMats;
    this.textures = texs;
  }

  /**
   * Create realistic scattered rocks with natural placement
   */
  createScatteredRocks(
    count = 300,
    centerX = 0,
    centerZ = 0,
    radius = 400,
  ): THREE.Group {
    const group = new THREE.Group();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = centerX + Math.cos(angle) * r;
      const z = centerZ + Math.sin(angle) * r;

      // Vary rock size with natural distribution
      const size =
        Math.random() < 0.7
          ? Math.random() * 1.5 + 0.3
          : Math.random() * 3 + 1.5;

      // Create rock geometry
      const geometry = this.createRandomRockGeometry(size);
      const material = this.pbrMaterials.getStonePBRMaterial(
        Math.floor(Math.random() * 4),
      );

      const rock = new THREE.Mesh(geometry, material);

      // Placement with elevation
      rock.position.set(x, size * 0.4, z);
      rock.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.scale.set(
        0.8 + Math.random() * 0.4,
        0.7 + Math.random() * 0.6,
        0.9 + Math.random() * 0.3,
      );

      group.add(rock);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Create realistic dense grass field
   */
  createDenseGrassField(
    centerX = 0,
    centerZ = 0,
    radius = 350,
    density = 80000,
  ): THREE.Mesh {
    // Create instanced grass for performance
    const grassCount = Math.floor(density);

    // Simple blade geometry
    const bladeGeo = new THREE.PlaneGeometry(0.3, 1.0, 2, 4);
    bladeGeo.translate(0, 0.5, 0);

    const grassMaterial = this.pbrMaterials.getGrassPBRMaterial();

    const grassMesh = new THREE.InstancedMesh(
      bladeGeo,
      grassMaterial,
      grassCount,
    );
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < grassCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = centerX + Math.cos(angle) * r;
      const z = centerZ + Math.sin(angle) * r;

      // Random height variation
      const y = 0.2 + Math.random() * 0.8;

      matrix.makeTranslation(x, y, z);
      matrix.multiply(
        new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2),
      );
      matrix.multiply(
        new THREE.Matrix4().makeScale(
          0.6 + Math.random() * 0.4,
          0.8 + Math.random() * 0.6,
          1,
        ),
      );

      grassMesh.setMatrixAt(i, matrix);

      // Subtle color variation
      const colorVariation = 0.95 + Math.random() * 0.1;
      color.setRGB(
        0.35 * colorVariation,
        0.5 * colorVariation,
        0.2 * colorVariation,
      );
      grassMesh.setColorAt(i, color);
    }

    grassMesh.instanceMatrix.needsUpdate = true;
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;

    this.scene.add(grassMesh);
    return grassMesh;
  }

  /**
   * Create wind effect for grass animation
   */
  createGrassWindShader(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: 1.5 },
        uWindFrequency: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWindStrength;
        uniform float uWindFrequency;
        
        varying vec2 vUv;
        varying float vWind;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          
          // Calculate wind effect based on world position and time
          float windWave = sin(position.x * uWindFrequency + uTime * 0.5) * 
                          cos(position.z * uWindFrequency + uTime * 0.3);
          
          pos.x += windWave * uWindStrength * position.y;
          pos.z += windWave * uWindStrength * position.y * 0.5;
          
          vWind = windWave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vWind;
        
        void main() {
          gl_FragColor = vec4(0.35, 0.5, 0.2, 1.0);
        }
      `,
      transparent: true,
    });

    return material;
  }

  /**
   * Create realistic vegetation patches
   */
  createVegetationPatches(count = 100, radius = 350): THREE.Group {
    const group = new THREE.Group();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const clumpSize = Math.random() * 8 + 3;
      const clumpDensity = Math.floor(clumpSize * 15);

      for (let j = 0; j < clumpDensity; j++) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetR = Math.random() * clumpSize;
        const ox = x + Math.cos(offsetAngle) * offsetR;
        const oz = z + Math.sin(offsetAngle) * offsetR;

        // Small shrub geometry
        const shrubGeo = new THREE.SphereGeometry(
          Math.random() * 0.5 + 0.2,
          8,
          6,
        );
        const material = this.pbrMaterials.getGrassPBRMaterial();
        const shrub = new THREE.Mesh(shrubGeo, material);

        shrub.position.set(ox, Math.random() * 0.5 + 0.2, oz);
        shrub.castShadow = true;
        shrub.receiveShadow = true;
        shrub.scale.set(
          0.8 + Math.random() * 0.4,
          0.9 + Math.random() * 0.3,
          0.8 + Math.random() * 0.4,
        );

        group.add(shrub);
      }
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Create dirt/trampled paths
   */
  createNaturalPaths(): THREE.Group {
    const group = new THREE.Group();

    const pathCount = 8;
    for (let i = 0; i < pathCount; i++) {
      const startAngle = (i / pathCount) * Math.PI * 2;
      const startX = Math.cos(startAngle) * 200;
      const startZ = Math.sin(startAngle) * 200;

      // Create curved path
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, 0, startZ),
        new THREE.Vector3(startX * 0.5, 0, startZ * 0.7),
        new THREE.Vector3(startX * 0.2, 0, startZ * 0.2),
        new THREE.Vector3(0, 0, 0),
      ]);

      const pathGeo = new THREE.TubeGeometry(curve, 20, 3, 4, false);
      const pathMaterial = this.pbrMaterials.getSoilPBRMaterial();
      const path = new THREE.Mesh(pathGeo, pathMaterial);
      path.receiveShadow = true;
      path.position.y = 0.01; // Slightly above ground

      group.add(path);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Create distant mountains (LOD background)
   */
  createDistantMountains(): THREE.Group {
    const group = new THREE.Group();

    const mountainCount = 12;
    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const r = 800 + Math.random() * 400;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const height = Math.random() * 300 + 200;
      const baseRadius = Math.random() * 150 + 100;

      const mountainGeo = new THREE.ConeGeometry(baseRadius, height, 16, 2);
      const slope = Math.random() * 0.5 + 0.5;
      const materialVariant = Math.floor(Math.random() * 4);
      const material = this.pbrMaterials.getStonePBRMaterial(materialVariant);

      const mountain = new THREE.Mesh(mountainGeo, material);
      mountain.position.set(x, height / 2, z);
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      mountain.scale.set(slope, 1, slope);

      // Add some snow cap effect on tall mountains
      if (height > 350) {
        const snowCapGeo = new THREE.ConeGeometry(
          baseRadius * 0.6,
          height * 0.3,
          16,
        );
        const snowMaterial = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          roughness: 0.7,
          metalness: 0,
        });
        const snowCap = new THREE.Mesh(snowCapGeo, snowMaterial);
        snowCap.position.set(0, height * 0.65, 0);
        mountain.add(snowCap);
      }

      group.add(mountain);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Create realistic flowing river
   */
  createFlowingRiver(
    startX = -400,
    startZ = -300,
    endX = 300,
    endZ = 200,
  ): THREE.Mesh {
    const points = [];
    const segmentCount = 100;

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const x = startX + (endX - startX) * t;
      const z = startZ + (endZ - startZ) * t;
      const wobble = Math.sin(i * 0.05) * 15;
      points.push(new THREE.Vector3(x + wobble, 0.5, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 50, 6, 4, false);
    const waterMaterial = this.pbrMaterials.getWaterPBRMaterial();

    const river = new THREE.Mesh(tubeGeo, waterMaterial);
    river.castShadow = false;
    river.receiveShadow = true;

    this.scene.add(river);
    return river;
  }

  /**
   * Create random rock geometry
   */
  private createRandomRockGeometry(size: number): THREE.BufferGeometry {
    // Use a high-poly procedural rock
    const dodecahedronGeo = new THREE.DodecahedronGeometry(size, 2);

    // Add random displacement for natural shape
    const positions = dodecahedronGeo.attributes
      .position as THREE.BufferAttribute;
    const positionsArray = positions.array as Float32Array;

    for (let i = 0; i < positionsArray.length; i += 3) {
      const x = positionsArray[i];
      const y = positionsArray[i + 1];
      const z = positionsArray[i + 2];

      const displacement = (Math.random() - 0.5) * size * 0.4;
      const length = Math.sqrt(x * x + y * y + z * z);

      positionsArray[i] = (x / length) * (size + displacement);
      positionsArray[i + 1] = (y / length) * (size + displacement);
      positionsArray[i + 2] = (z / length) * (size + displacement);
    }

    positions.needsUpdate = true;
    dodecahedronGeo.computeVertexNormals();

    return dodecahedronGeo;
  }
}

// (Already exported above as `export class DetailedEnvironmentBuilder`)
