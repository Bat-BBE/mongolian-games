import * as THREE from "three";
import { materialLibrary } from "./MaterialLibrary";
import { rand, randInt } from "./sceneHelpers";

export class AnimalModelBuilder {
  private materialLib: typeof materialLibrary;

  constructor(matLib: typeof materialLibrary) {
    this.materialLib = matLib;
  }

  createHorse(
    position: [number, number, number] = [0, 0, 0],
    rotationY = 0,
    color = 0x8b6914,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    const hideMat = this.materialLib.getHideMaterial(color);
    const darkHideMat = this.materialLib.getHideMaterial(
      Math.max(0x000000, color - 0x220000),
    );

    const bodyGeo = new THREE.BoxGeometry(1.2, 0.7, 2.0, 8, 6, 12);
    this.computeBoxUV(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, hideMat);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const neckGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12, 4);
    this.computeCylinderUV(neckGeo);
    const neck = new THREE.Mesh(neckGeo, hideMat);
    neck.position.set(0, 1.4, 0.85);
    neck.rotation.z = -0.3;
    neck.castShadow = true;
    group.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 12);
    this.computeSphereUV(headGeo);
    const head = new THREE.Mesh(headGeo, hideMat);
    head.position.set(0, 1.7, 1.5);
    head.scale.set(1, 0.85, 1.3);
    head.castShadow = true;
    group.add(head);

    // Muzzle
    const muzzleGeo = new THREE.BoxGeometry(0.25, 0.22, 0.4, 6, 4, 6);
    this.computeBoxUV(muzzleGeo);
    const muzzle = new THREE.Mesh(muzzleGeo, darkHideMat);
    muzzle.position.set(0, 1.5, 2.0);
    muzzle.castShadow = true;
    group.add(muzzle);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 12, 8);
    for (const xOff of [-0.15, 0.15]) {
      const eye = new THREE.Mesh(
        eyeGeo,
        this.materialLib.getColorMaterial(0x111111),
      );
      eye.position.set(xOff, 1.75, 1.8);
      eye.castShadow = true;
      group.add(eye);
    }

    // Ears
    for (const xOff of [-0.25, 0.25]) {
      const earGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
      this.computeConeUV(earGeo);
      const ear = new THREE.Mesh(earGeo, hideMat);
      ear.position.set(xOff, 2.0, 1.3);
      ear.rotation.x = -0.4;
      ear.castShadow = true;
      group.add(ear);
    }

    // Mane — using planes
    for (let i = 0; i < 5; i++) {
      const maneGeo = new THREE.BoxGeometry(0.1, 0.4, 0.15, 2, 4, 2);
      this.computeBoxUV(maneGeo);
      const mane = new THREE.Mesh(maneGeo, darkHideMat);
      mane.position.set(0, 1.45 + i * 0.15, 0.9 + i * 0.15);
      mane.rotation.z = 0.3 + i * 0.1;
      mane.castShadow = true;
      group.add(mane);
    }

    // Four legs — using cylinders with proper UV
    const legPositions: [number, number, number][] = [
      [-0.35, 0, 0.3],
      [0.35, 0, 0.3],
      [-0.35, 0, -0.5],
      [0.35, 0, -0.5],
    ];

    legPositions.forEach(([x, , z]) => {
      const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 1.0, 10, 6);
      this.computeCylinderUV(legGeo);
      const leg = new THREE.Mesh(legGeo, hideMat);
      leg.position.set(x, 0.5, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);

      // Hoof
      const hoofGeo = new THREE.SphereGeometry(0.1, 8, 6);
      this.computeSphereUV(hoofGeo);
      const hoof = new THREE.Mesh(hoofGeo, darkHideMat);
      hoof.position.set(x, 0.05, z);
      hoof.scale.set(1, 0.6, 1);
      hoof.castShadow = true;
      group.add(hoof);
    });

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08, 3, 8, 2);
    this.computeBoxUV(tailGeo);
    const tail = new THREE.Mesh(tailGeo, darkHideMat);
    tail.position.set(0, 0.8, -0.85);
    tail.rotation.z = 0.4;
    tail.castShadow = true;
    group.add(tail);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  createCamel(
    position: [number, number, number] = [0, 0, 0],
    rotationY = 0,
    color = 0xb8864a,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = rotationY;

    const hideMat = this.materialLib.getHideMaterial(color);
    const darkMat = this.materialLib.getHideMaterial(color - 0x220000);

    // Body — long and stretched
    const bodyGeo = new THREE.BoxGeometry(1.3, 0.58, 2.2, 8, 6, 12);
    this.computeBoxUV(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, hideMat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // Two humps (Bactrian)
    [-0.35, 0.35].forEach((offset) => {
      const humpGeo = new THREE.SphereGeometry(0.28, 12, 10);
      this.computeSphereUV(humpGeo);
      const hump = new THREE.Mesh(humpGeo, hideMat);
      hump.position.set(offset, 1.5, 0);
      hump.scale.set(1, 1.3, 0.8);
      hump.castShadow = true;
      group.add(hump);
    });

    // Long neck
    const neckGeo = new THREE.CylinderGeometry(0.22, 0.28, 1.2, 10, 6);
    this.computeCylinderUV(neckGeo);
    const neck = new THREE.Mesh(neckGeo, hideMat);
    neck.position.set(0, 1.65, 1.0);
    neck.rotation.z = 0.15;
    neck.castShadow = true;
    group.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 14, 10);
    this.computeSphereUV(headGeo);
    const head = new THREE.Mesh(headGeo, hideMat);
    head.position.set(0, 2.5, 1.8);
    head.scale.set(0.95, 1.0, 1.15);
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.22, 0.2, 0.35, 6, 4, 6);
    this.computeBoxUV(snoutGeo);
    const snout = new THREE.Mesh(snoutGeo, darkMat);
    snout.position.set(0, 2.3, 2.15);
    snout.castShadow = true;
    group.add(snout);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.07, 10, 8);
    for (const xOff of [-0.12, 0.12]) {
      const eye = new THREE.Mesh(
        eyeGeo,
        this.materialLib.getColorMaterial(0x222222),
      );
      eye.position.set(xOff, 2.55, 1.95);
      eye.castShadow = true;
      group.add(eye);
    }

    // Ears
    for (const xOff of [-0.2, 0.2]) {
      const earGeo = new THREE.ConeGeometry(0.07, 0.2, 8);
      this.computeConeUV(earGeo);
      const ear = new THREE.Mesh(earGeo, hideMat);
      ear.position.set(xOff, 2.75, 1.5);
      ear.rotation.x = -0.3;
      ear.castShadow = true;
      group.add(ear);
    }

    // Long legs
    const legPositions: [number, number, number][] = [
      [-0.4, 0, 0.35],
      [0.4, 0, 0.35],
      [-0.4, 0, -0.6],
      [0.4, 0, -0.6],
    ];

    legPositions.forEach(([x, , z]) => {
      const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 1.1, 10, 6);
      this.computeCylinderUV(legGeo);
      const leg = new THREE.Mesh(legGeo, hideMat);
      leg.position.set(x, 0.55, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);

      // Padded foot
      const footGeo = new THREE.SphereGeometry(0.12, 8, 6);
      this.computeSphereUV(footGeo);
      const foot = new THREE.Mesh(footGeo, darkMat);
      foot.position.set(x, 0.05, z);
      foot.scale.set(1, 0.5, 1.2);
      foot.castShadow = true;
      group.add(foot);
    });

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06, 2, 6, 2);
    this.computeBoxUV(tailGeo);
    const tail = new THREE.Mesh(tailGeo, darkMat);
    tail.position.set(0, 0.9, -1.05);
    tail.rotation.z = 0.5;
    tail.castShadow = true;
    group.add(tail);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  private computeBoxUV(geometry: THREE.BoxGeometry): void {
    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    if (!uvAttr) {
      // If no UVs exist, create them
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const uvs = new Float32Array(positions.count * 2);

      for (let i = 0; i < positions.count; i++) {
        uvs[i * 2] = (i % 4) / 4;
        uvs[i * 2 + 1] = Math.floor(i / 4) / 6;
      }

      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
  }

  private computeCylinderUV(geometry: THREE.CylinderGeometry): void {
    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    if (!uvAttr) {
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const uvs = new Float32Array(positions.count * 2);

      for (let i = 0; i < positions.count; i++) {
        uvs[i * 2] =
          (i % geometry.parameters.radialSegments!) /
          (geometry.parameters.radialSegments! || 1);
        uvs[i * 2 + 1] =
          Math.floor(i / (geometry.parameters.radialSegments! || 1)) /
          (geometry.parameters.heightSegments! || 1);
      }

      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
  }

  private computeSphereUV(geometry: THREE.SphereGeometry): void {
    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    if (!uvAttr) {
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const uvs = new Float32Array(positions.count * 2);

      const widthSegments = geometry.parameters.widthSegments || 16;
      const heightSegments = geometry.parameters.heightSegments || 12;

      for (let i = 0; i < positions.count; i++) {
        uvs[i * 2] = (i % widthSegments) / widthSegments;
        uvs[i * 2 + 1] = Math.floor(i / widthSegments) / heightSegments;
      }

      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
  }

  private computeConeUV(geometry: THREE.ConeGeometry): void {
    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    if (!uvAttr) {
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const uvs = new Float32Array(positions.count * 2);

      for (let i = 0; i < positions.count; i++) {
        uvs[i * 2] =
          (i % geometry.parameters.radialSegments!) /
          (geometry.parameters.radialSegments! || 1);
        uvs[i * 2 + 1] =
          Math.floor(i / (geometry.parameters.radialSegments! || 1)) /
          (geometry.parameters.heightSegments! || 1);
      }

      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
  }
}

export const animalModelBuilder = new AnimalModelBuilder(materialLibrary);
