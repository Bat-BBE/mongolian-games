import * as THREE from "three";

/**
 * Cinematic Scene Setup
 * Professional lighting, atmosphere, and post-processing for photorealistic rendering
 */
export class CinematicSceneBuilder {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
  }

  /**
   * Setup cinematographic lighting with golden hour warmth
   */
  setupCinematicLighting(): {
    sunLight: THREE.Light;
    keyLight: THREE.Light;
    fillLight: THREE.Light;
    rimLight: THREE.Light;
  } {
    // Clear default lights
    const lights = this.scene.children.filter(
      (obj) => obj instanceof THREE.Light,
    );
    lights.forEach((light) => this.scene.remove(light));

    // Main sun light (golden hour - warm and directional)
    const sunLight = new THREE.DirectionalLight(0xffd89b, 2.2);
    sunLight.position.set(150, 180, 100);
    sunLight.target.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1500;
    sunLight.shadow.camera.left = -600;
    sunLight.shadow.camera.right = 600;
    sunLight.shadow.camera.top = 600;
    sunLight.shadow.camera.bottom = -600;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.blurSamples = 8;
    this.scene.add(sunLight);
    this.scene.add(sunLight.target);

    // Key light - secondary directional for shape
    const keyLight = new THREE.DirectionalLight(0xffb366, 0.8);
    keyLight.position.set(-100, 120, -80);
    keyLight.target.position.set(0, 0, 0);
    this.scene.add(keyLight);
    this.scene.add(keyLight.target);

    // Fill light - soft ambient-like light
    const fillLight = new THREE.DirectionalLight(0xa8d5ff, 0.6);
    fillLight.position.set(0, 200, -300);
    this.scene.add(fillLight);

    // Rim light - edge highlight for depth
    const rimLight = new THREE.DirectionalLight(0xffccaa, 1.0);
    rimLight.position.set(0, 100, 400);
    this.scene.add(rimLight);

    // Soft ambient light for global illumination
    const ambientLight = new THREE.AmbientLight(0xf0e6d2, 1.0);
    this.scene.add(ambientLight);

    // Subtle warm environment
    const hemisphereLight = new THREE.HemisphereLight(0xffd89b, 0x8b6f47, 0.5);
    this.scene.add(hemisphereLight);

    return { sunLight, keyLight, fillLight, rimLight };
  }

  /**
   * Setup volumetric atmospheric fog
   */
  setupAtmosphericFog(): void {
    // Distant fog for depth perception
    this.scene.fog = new THREE.Fog(0xc4b5a0, 400, 1200);

    // Optional: Add volumetric fog effect using volume texture
    // This would require custom shaders for best effect
  }

  /**
   * Setup sky atmosphere
   */
  setupSkyAtmosphere(): THREE.Mesh {
    // Large sky dome with gradient
    const skyGeo = new THREE.SphereGeometry(2000, 32, 32);
    skyGeo.scale(-1, 1, -1);

    const skyMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      vertexColors: true,
    }) as any;

    const colors = skyGeo.attributes.position as THREE.BufferAttribute;
    const colorArray = new Float32Array(colors.count * 3);

    for (let i = 0; i < colors.count; i++) {
      const y = colors.getY(i);
      // Gradient from warm horizon to blue sky
      const t = Math.max(0, Math.min(1, (y + 2000) / 4000));

      let r: number, g: number, b: number;

      if (t < 0.4) {
        // Warm horizon
        r = 1.0;
        g = 0.9;
        b = 0.7;
      } else if (t < 0.7) {
        // Transition
        const mix = (t - 0.4) / 0.3;
        r = 1.0 - mix * 0.3;
        g = 0.9 - mix * 0.2;
        b = 0.7 + mix * 0.3;
      } else {
        // Sky blue
        r = 0.5;
        g = 0.7;
        b = 1.0;
      }

      colorArray[i * 3] = r;
      colorArray[i * 3 + 1] = g;
      colorArray[i * 3 + 2] = b;
    }

    skyGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
    const sky = new THREE.Mesh(skyGeo, skyMaterial);
    this.scene.add(sky);

    return sky;
  }

  /**
   * Setup cinematic camera with wide angle
   */
  setupCinematicCamera(): void {
    // 24mm lens equivalent for vast landscape feeling
    this.camera.fov = 65;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.near = 0.1;
    this.camera.far = 2000;
    this.camera.position.set(200, 250, 250);
    this.camera.lookAt(0, 50, 0);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Setup shadows for cinematic effect
   */
  setupShadows(): void {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
  }

  /**
   * Setup renderer for photorealistic output
   */
  setupRendererSettings(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /**
   * Setup tone mapping for cinematic look
   */
  setupToneMapping(exposure = 1.2): void {
    this.renderer.toneMappingExposure = exposure;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }

  /**
   * Get scene for post-processing
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get renderer for post-processing setup
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get camera for post-processing setup
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}

// (Already exported above as `export class CinematicSceneBuilder`)
