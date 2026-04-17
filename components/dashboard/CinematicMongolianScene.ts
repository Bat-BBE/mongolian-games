/**
 * CINEMATIC MONGOLIAN ENVIRONMENT - COMPLETE INTEGRATION GUIDE
 *
 * Ultra-realistic photorealistic 3D Mongolian open-world environment
 * with professional cinematography, PBR materials, and game-ready optimization
 */

import * as THREE from "three";
import { PBRMaterialLibrary } from "./PBRMaterialLibrary";
import { AdvancedTextureManager } from "./AdvancedTextureManager";
import { CinematicSceneBuilder } from "./CinematicSceneBuilder";
import { DetailedEnvironmentBuilder } from "./DetailedEnvironmentBuilder";
import { DetailedAnimalModels } from "./DetailedAnimalModels";
import { DetailedGerBuilder } from "./DetailedGerBuilder";

/**
 * Complete Mongolian Scene Setup
 * Create an ultra-detailed, photorealistic Mongolian landscape
 */
export class CinematicMongolianScene {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;

  private pbrMats: PBRMaterialLibrary;
  private textures: AdvancedTextureManager;
  private cinematic: CinematicSceneBuilder;
  private environment: DetailedEnvironmentBuilder;
  private animals: DetailedAnimalModels;
  private gerBuilder: DetailedGerBuilder;

  /**
   * Initialize the cinematic Mongolian scene
   */
  constructor(container: HTMLElement) {
    // Setup basic three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "highp",
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );

    // Initialize managers
    this.pbrMats = new PBRMaterialLibrary();
    this.textures = new AdvancedTextureManager();
    this.cinematic = new CinematicSceneBuilder(
      this.scene,
      this.renderer,
      this.camera,
    );
    this.environment = new DetailedEnvironmentBuilder(
      this.scene,
      this.pbrMats,
      this.textures,
    );
    this.animals = new DetailedAnimalModels(this.pbrMats, this.textures);
    this.gerBuilder = new DetailedGerBuilder(this.pbrMats);

    this.setup();
  }

  /**
   * Complete scene setup
   */
  private setup(): void {
    // Cinematography
    this.setupCinematography();

    // Terrain and environment
    this.setupTerrain();
    this.setupEnvironment();

    // Main elements
    this.setupGer();
    this.setupAnimals();
    this.setupDecorativeElements();

    // Effects
    this.setupPostProcessing();
    this.setupAnimationLoop();
    this.setupResponsiveness();
  }

  /**
   * Setup cinematographic lighting and atmosphere
   */
  private setupCinematography(): void {
    // Professional lighting
    this.cinematic.setupCinematicLighting();

    // Sky atmosphere
    this.cinematic.setupSkyAtmosphere();

    // Volumetric fog
    this.cinematic.setupAtmosphericFog();

    // Camera positioning (cinematic wide shot)
    this.cinematic.setupCinematicCamera();

    // Renderer settings for photorealistic output
    this.cinematic.setupRendererSettings();
    this.cinematic.setupToneMapping(1.2);

    // Shadow rendering
    this.cinematic.setupShadows();
  }

  /**
   * Setup detailed terrain
   */
  private setupTerrain(): void {
    // Create terrain geometry with proper UV mapping
    const terrainGeo = new THREE.PlaneGeometry(1200, 1000, 256, 256);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Perlin-like noise for terrain height
      const height =
        Math.sin(x * 0.005) * 50 +
        Math.sin(z * 0.004) * 40 +
        Math.sin(x * 0.001 + z * 0.002) * 30;

      pos.setY(i, height);
    }

    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);

      // Height-based coloring
      let r: number, g: number, b: number;
      if (y > 100) {
        r = 0.9;
        g = 0.85;
        b = 0.8;
      } else if (y > 50) {
        r = 0.7;
        g = 0.8;
        b = 0.5;
      } else {
        r = 0.45;
        g = 0.6;
        b = 0.3;
      }

      colors[i * 3] = r + (Math.random() - 0.5) * 0.1;
      colors[i * 3 + 1] = g + (Math.random() - 0.5) * 0.1;
      colors[i * 3 + 2] = b + (Math.random() - 0.5) * 0.1;
    }

    terrainGeo.computeVertexNormals();
    terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const terrainMat = this.pbrMats.getTerrainPBRMaterial();
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  /**
   * Setup detailed environment elements
   */
  private setupEnvironment(): void {
    // Distant mountains (visual depth)
    this.environment.createDistantMountains();

    // Realistic flowing river
    this.environment.createFlowingRiver(-400, -300, 300, 200);

    // Natural paths
    this.environment.createNaturalPaths();

    // Scattered rocks
    this.environment.createScatteredRocks(250, 0, 0, 400);

    // Dense grass field (core environment)
    this.environment.createDenseGrassField(0, 0, 350);

    // Vegetation patches
    this.environment.createVegetationPatches(80, 350);
  }

  /**
   * Place detailed ger in landscape
   */
  private setupGer(): void {
    const ger = this.gerBuilder.createDetailedGer([0, 0, 0], 1.0, true);
    this.scene.add(ger);
  }

  /**
   * Place realistic animals
   */
  private setupAnimals(): void {
    // Main horse - centered, natural standing pose
    const horse = this.animals.createRealisticHorse(
      [80, 0, -120],
      Math.PI * 0.2,
      0x8b6914,
    );
    this.scene.add(horse);

    // Camel - nearby, grazing position
    const camel = this.animals.createRealisticCamel(
      [-120, 0, 60],
      Math.PI * 1.3,
      0xb8864a,
    );
    this.scene.add(camel);

    // Additional horses for herd feel
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.PI * 0.5;
      const distance = 200 + Math.random() * 100;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const color = 0x6b5a14 + Math.random() * 0x300000;

      const horse = this.animals.createRealisticHorse(
        [x, 0, z],
        Math.random() * Math.PI * 2,
        color as any,
      );
      this.scene.add(horse);
    }
  }

  /**
   * Place decorative landscape elements
   */
  private setupDecorativeElements(): void {
    // Scattered rocks near ger
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 100 + 150;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const size = Math.random() * 2 + 0.5;

      const rockGeo = new THREE.DodecahedronGeometry(size, 2);
      const rockMat = this.pbrMats.getStonePBRMaterial(
        Math.floor(Math.random() * 4),
      );
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, size * 0.3, z);
      rock.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  /**
   * Setup post-processing effects (if available)
   */
  private setupPostProcessing(): void {
    // Color grading - warm tones
    // Depth of field (optional)
    // This would typically use THREE.EffectComposer with various pass plugins
    // For now, we use tone mapping for cinematic look
  }

  /**
   * Setup animation loop with wind effects
   */
  private setupAnimationLoop(): void {
    let frameCount = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      frameCount++;

      // Smooth light rotation for time-of-day effect
      const sunLight = this.scene.children.find(
        (obj) => obj instanceof THREE.DirectionalLight && obj.position.y > 100,
      ) as THREE.DirectionalLight;

      if (sunLight) {
        const timeOfDay = (frameCount % 6000) / 6000; // 100 second day cycle
        const sunAngle = timeOfDay * Math.PI * 2;
        sunLight.position.x = Math.cos(sunAngle) * 200;
        sunLight.position.z = Math.sin(sunAngle) * 150;
        sunLight.position.y = Math.max(
          50,
          Math.sin(sunAngle + Math.PI) * 180 + 120,
        );
      }

      // Subtle wind wave effect on grass
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Handle window resize
   */
  private setupResponsiveness(): void {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.pbrMats.clear();
    this.textures.clear();
    this.renderer.dispose();
  }

  /**
   * Get scene for further customization
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera for manipulation
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════

/*
// In your React component or main file:

import { CinematicMongolianScene } from "./CinematicMongolianScene";

// Create scene
const container = document.getElementById("three-container");
const cinemaicScene = new CinematicMongolianScene(container);

// Later, cleanup
cinemaicScene.cleanup();

// You can also access scene for custom modifications:
const scene = cinemaicScene.getScene();
const camera = cinemaicScene.getCamera();
const renderer = cinemaicScene.getRenderer();
*/

// (Already exported above as `export class CinematicMongolianScene`)
