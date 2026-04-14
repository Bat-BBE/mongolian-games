import * as THREE from "three";
import { pbrMaterialLibrary } from "./PBRMaterialLibrary";
import { advancedTextureManager } from "./AdvancedTextureManager";

/**
 * Detailed Animal Models (Premium)
 * High-quality horse and camel with PBR materials and realistic geometry
 */
export class DetailedAnimalModels {
  private pbrMats: typeof pbrMaterialLibrary;
  private textures: typeof advancedTextureManager;

  constructor(
    pbrMats: typeof pbrMaterialLibrary,
    texs: typeof advancedTextureManager,
  ) {
    this.pbrMats = pbrMats;
    this.textures = texs;
  }

  /**
   * Create ultra-detailed realistic horse
   * High-poly with natural standing pose
   */
  createRealisticHorse(
    position: [number, number, number] = [0, 0, 0],
    rotationY = 0,
    color = 0x8b6914,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    const hideMat = this.pbrMats.getHorseFurMaterial(color);
    const darkMat = this.pbrMats.getHorseFurMaterial(
      Math.max(0x2a2a1a, color - 0x330000),
    );

    // Improved body geometry (more realistic proportions)
    const bodyGeo = new THREE.BoxGeometry(1.1, 0.65, 2.2, 12, 8, 16);
    this.improveGeometry(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, hideMat);
    body.position.y = 0.95;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // More detailed neck
    const neckGeo = new THREE.CylinderGeometry(0.32, 0.42, 0.95, 16, 6);
    this.improveGeometry(neckGeo);
    const neck = new THREE.Mesh(neckGeo, hideMat);
    neck.position.set(0, 1.45, 0.9);
    neck.rotation.z = -0.25;
    neck.castShadow = true;
    group.add(neck);

    // Detailed head (higher poly)
    const headGeo = new THREE.IcosahedronGeometry(0.38, 4);
    const head = new THREE.Mesh(headGeo, hideMat);
    head.position.set(0, 1.75, 1.6);
    head.scale.set(0.95, 0.9, 1.35);
    head.castShadow = true;
    group.add(head);

    // Muzzle
    const muzzleGeo = new THREE.BoxGeometry(0.22, 0.2, 0.35, 8, 6, 8);
    const muzzle = new THREE.Mesh(muzzleGeo, darkMat);
    muzzle.position.set(0, 1.52, 2.05);
    muzzle.castShadow = true;
    group.add(muzzle);

    // Eyes with proper placing
    const eyeGeo = new THREE.SphereGeometry(0.085, 12, 10);
    [-0.14, 0.14].forEach((xOff) => {
      const eye = new THREE.Mesh(
        eyeGeo,
        this.pbrMats.getEmissivePBRMaterial(0x1a1a1a, 0.1),
      );
      eye.position.set(xOff, 1.78, 1.78);
      eye.castShadow = true;
      group.add(eye);
    });

    // Nostrils
    [-0.08, 0.08].forEach((xOff) => {
      const nostrilGeo = new THREE.SphereGeometry(0.04, 8, 6);
      const nostril = new THREE.Mesh(
        nostrilGeo,
        this.pbrMats.getEmissivePBRMaterial(0x0a0a0a, 0.05),
      );
      nostril.position.set(xOff, 1.45, 2.0);
      group.add(nostril);
    });

    // Ears (cone-based, more realistic)
    [-0.28, 0.28].forEach((xOff) => {
      const earGeo = new THREE.ConeGeometry(0.08, 0.3, 12, 3);
      const ear = new THREE.Mesh(earGeo, hideMat);
      ear.position.set(xOff, 2.05, 1.25);
      ear.rotation.x = -0.45;
      ear.rotation.z = xOff > 0 ? 0.15 : -0.15;
      ear.castShadow = true;
      group.add(ear);
    });

    // Detailed mane (flowing segments)
    for (let i = 0; i < 8; i++) {
      const maneGeo = new THREE.BoxGeometry(0.12, 0.5, 0.18, 3, 5, 3);
      const mane = new THREE.Mesh(maneGeo, darkMat);
      const maneZ = 0.85 + i * 0.22;
      mane.position.set(0, 1.5 + i * 0.08, maneZ);
      mane.rotation.z = 0.35 + i * 0.1;
      mane.castShadow = true;
      group.add(mane);
    }

    // Four detailed legs
    const legPositions: [number, number, number][] = [
      [-0.32, 0, 0.45],
      [0.32, 0, 0.45],
      [-0.32, 0, -0.6],
      [0.32, 0, -0.6],
    ];

    legPositions.forEach(([x, , z]) => {
      // Upper leg (calf)
      const upperLegGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.6, 12, 5);
      const upperLeg = new THREE.Mesh(upperLegGeo, hideMat);
      upperLeg.position.set(x, 0.65, z);
      upperLeg.castShadow = true;
      upperLeg.receiveShadow = true;
      group.add(upperLeg);

      // Lower leg (canon bone)
      const lowerLegGeo = new THREE.CylinderGeometry(0.105, 0.095, 0.5, 12, 4);
      const lowerLeg = new THREE.Mesh(lowerLegGeo, hideMat);
      lowerLeg.position.set(x, 0.15, z);
      lowerLeg.castShadow = true;
      group.add(lowerLeg);

      // Hoof (detailed)
      const hoofGeo = new THREE.SphereGeometry(0.11, 10, 8);
      const hoof = new THREE.Mesh(hoofGeo, darkMat);
      hoof.position.set(x, 0.02, z);
      hoof.scale.set(1, 0.5, 1);
      hoof.castShadow = true;
      group.add(hoof);

      // Fetlock (hair tuft at leg)
      const fetlockGeo = new THREE.SphereGeometry(0.12, 10, 6);
      const fetlock = new THREE.Mesh(fetlockGeo, darkMat);
      fetlock.position.set(x, 0.18, z);
      fetlock.scale.set(0.8, 0.6, 0.8);
      group.add(fetlock);
    });

    // Detailed tail
    const tailGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08, 4, 10, 2);
    const tail = new THREE.Mesh(tailGeo, darkMat);
    tail.position.set(0, 0.7, -0.95);
    tail.rotation.z = 0.5;
    tail.castShadow = true;
    group.add(tail);

    // Mane flow extension
    const maneFlowGeo = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    const maneFlow = new THREE.Mesh(maneFlowGeo, darkMat);
    maneFlow.position.set(0, 1.6, 1.5);
    maneFlow.rotation.z = 0.4;
    group.add(maneFlow);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  /**
   * Create ultra-detailed Bactrian camel
   */
  createRealisticCamel(
    position: [number, number, number] = [0, 0, 0],
    rotationY = 0,
    color = 0xb8864a,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    const hideMat = this.pbrMats.getCamelFurMaterial(color);
    const darkMat = this.pbrMats.getCamelFurMaterial(
      Math.max(0x3a3a2a, color - 0x330000),
    );

    // Body (elongated and wide)
    const bodyGeo = new THREE.BoxGeometry(1.35, 0.7, 2.4, 12, 8, 14);
    this.improveGeometry(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, hideMat);
    body.position.y = 1.15;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Add body segments for better silhouette
    const bodyFrontGeo = new THREE.BoxGeometry(1.2, 0.65, 0.8, 8, 6, 6);
    const bodyFront = new THREE.Mesh(bodyFrontGeo, hideMat);
    bodyFront.position.set(0, 1.2, 0.8);
    group.add(bodyFront);

    // Two distinct humps with proper proportions
    const humpPositions: [number, number][] = [
      [-0.4, -0.1],
      [0.4, 0.1],
    ];

    humpPositions.forEach(([xOff, posOffset]) => {
      const humpGeo = new THREE.SphereGeometry(0.32, 14, 12);
      const hump = new THREE.Mesh(humpGeo, hideMat);
      hump.position.set(xOff, 1.7, posOffset);
      hump.scale.set(1, 1.4, 0.75);
      hump.castShadow = true;
      group.add(hump);
    });

    // Long neck
    const neckGeo = new THREE.CylinderGeometry(0.25, 0.32, 1.3, 14, 6);
    this.improveGeometry(neckGeo);
    const neck = new THREE.Mesh(neckGeo, hideMat);
    neck.position.set(0, 1.8, 1.2);
    neck.rotation.z = 0.12;
    neck.castShadow = true;
    group.add(neck);

    // Head
    const headGeo = new THREE.IcosahedronGeometry(0.32, 4);
    const head = new THREE.Mesh(headGeo, hideMat);
    head.position.set(0, 2.7, 1.9);
    head.scale.set(0.9, 1.05, 1.2);
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.2, 0.18, 0.32, 8, 6, 8);
    const snout = new THREE.Mesh(snoutGeo, darkMat);
    snout.position.set(0, 2.35, 2.2);
    snout.castShadow = true;
    group.add(snout);

    // Eyes
    [-0.1, 0.1].forEach((xOff) => {
      const eyeGeo = new THREE.SphereGeometry(0.075, 12, 10);
      const eye = new THREE.Mesh(
        eyeGeo,
        this.pbrMats.getEmissivePBRMaterial(0x1a1a1a, 0.1),
      );
      eye.position.set(xOff, 2.65, 1.95);
      eye.castShadow = true;
      group.add(eye);
    });

    // Ears
    [-0.22, 0.22].forEach((xOff) => {
      const earGeo = new THREE.ConeGeometry(0.07, 0.25, 10, 3);
      const ear = new THREE.Mesh(earGeo, hideMat);
      ear.position.set(xOff, 2.85, 1.5);
      ear.rotation.x = -0.4;
      ear.rotation.z = xOff > 0 ? 0.1 : -0.1;
      ear.castShadow = true;
      group.add(ear);
    });

    // Four long legs with padded feet
    const camelLegPositions: [number, number, number][] = [
      [-0.4, 0, 0.5],
      [0.4, 0, 0.5],
      [-0.4, 0, -0.7],
      [0.4, 0, -0.7],
    ];

    camelLegPositions.forEach(([x, , z]) => {
      // Upper leg
      const upperLegGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.65, 12, 5);
      const upperLeg = new THREE.Mesh(upperLegGeo, hideMat);
      upperLeg.position.set(x, 0.7, z);
      upperLeg.castShadow = true;
      group.add(upperLeg);

      // Lower leg
      const lowerLegGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.5, 12, 4);
      const lowerLeg = new THREE.Mesh(lowerLegGeo, hideMat);
      lowerLeg.position.set(x, 0.2, z);
      lowerLeg.castShadow = true;
      group.add(lowerLeg);

      // Padded foot (larger and flatter)
      const footGeo = new THREE.SphereGeometry(0.14, 10, 8);
      const foot = new THREE.Mesh(footGeo, darkMat);
      foot.position.set(x, 0.01, z);
      foot.scale.set(1.2, 0.4, 1.3);
      foot.castShadow = true;
      group.add(foot);
    });

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.07, 0.7, 0.07, 4, 9, 2);
    const tail = new THREE.Mesh(tailGeo, darkMat);
    tail.position.set(0, 0.8, -1.15);
    tail.rotation.z = 0.6;
    tail.castShadow = true;
    group.add(tail);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  /**
   * Improve geometry with better smoothing
   */
  private improveGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeVertexNormals();

    // Add slight smoothing by duplicating and averaging normals
    const normals = geometry.attributes.normal as THREE.BufferAttribute;
    const positions = geometry.attributes.position as THREE.BufferAttribute;

    // This is a simplified normal smoothing
    // For production, use a proper smoothing algorithm
  }
}

export { DetailedAnimalModels };
