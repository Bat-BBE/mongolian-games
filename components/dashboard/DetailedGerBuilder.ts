import * as THREE from "three";
import { pbrMaterialLibrary } from "./PBRMaterialLibrary";

/**
 * Detailed Mongolian Ger (Yurt) Builder
 * High-quality traditional ger with cloth, lattice, and rope bindings
 */
export class DetailedGerBuilder {
  private pbrMats: typeof pbrMaterialLibrary;

  constructor(pbrMats: typeof pbrMaterialLibrary) {
    this.pbrMats = pbrMats;
  }

  /**
   * Create ultra-detailed Mongolian ger
   */
  createDetailedGer(
    position: [number, number, number] = [0, 0, 0],
    scale = 1.0,
    baseOnTerrain = true,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(
      ...position[0],
      baseOnTerrain ? position[1] + 0.1 : position[1],
      position[2],
    );

    // Foundation ring (stone base)
    const foundationGeo = new THREE.CylinderGeometry(
      2.6 * scale,
      2.8 * scale,
      0.3 * scale,
      32,
      2,
    );
    const stoneMat = this.pbrMats.getStonePBRMaterial(0);
    const foundation = new THREE.Mesh(foundationGeo, stoneMat);
    foundation.receiveShadow = true;
    group.add(foundation);

    // Wooden lattice walls (khana)
    const latticeGroup = this.createLatticeWalls(scale);
    latticeGroup.position.y = 0.15 * scale;
    group.add(latticeGroup);

    // Felt walls (multiple layers for cloth appearance)
    const feltGroup = this.createFeltWalls(scale);
    feltGroup.position.y = 0.3 * scale;
    group.add(feltGroup);

    // Roof crown (toono)
    const roofCrown = this.createRoofCrown(scale);
    roofCrown.position.y = 1.85 * scale;
    group.add(roofCrown);

    // Roof poles (radial)
    const roofPolesGroup = this.createRoofPoles(scale);
    roofPolesGroup.position.y = 0.4 * scale;
    group.add(roofPolesGroup);

    // Roof covering (felt and canvas)
    const roofGroup = this.createRoof(scale);
    roofGroup.position.y = 1.2 * scale;
    group.add(roofGroup);

    // Rope bindings
    const ropesGroup = this.createRopeBindings(scale);
    group.add(ropesGroup);

    // Door frame and door
    const doorGroup = this.createDoor(scale);
    doorGroup.position.set(0, 0.4 * scale, 2.5 * scale);
    doorGroup.rotation.y = 0;
    group.add(doorGroup);

    // Decorative elements
    const decorGroup = this.createDecorations(scale);
    group.add(decorGroup);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  /**
   * Create wooden lattice walls (khana)
   */
  private createLatticeWalls(scale: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = this.pbrMats.getWoodPBRMaterial();

    const segments = 12; // Number of wall sections
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      // Main radial supports
      const supportGeo = new THREE.CylinderGeometry(
        0.04 * scale,
        0.05 * scale,
        1.8 * scale,
        8,
        3,
      );
      const support = new THREE.Mesh(supportGeo, woodMat);
      support.position.set(
        Math.cos(angle) * 2.3 * scale,
        0.9 * scale,
        Math.sin(angle) * 2.3 * scale,
      );
      support.rotation.z = angle - Math.PI / 2;
      support.castShadow = true;
      group.add(support);

      // Horizontal rings
      if (i === 0) {
        // Ring at mid-height
        const ringGeo = new THREE.TorusGeometry(
          2.2 * scale,
          0.03 * scale,
          8,
          48,
        );
        const ring = new THREE.Mesh(ringGeo, woodMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.9 * scale;
        ring.castShadow = true;
        group.add(ring);

        // Ring at top
        const topRingGeo = new THREE.TorusGeometry(
          1.8 * scale,
          0.03 * scale,
          8,
          40,
        );
        const topRing = new THREE.Mesh(topRingGeo, woodMat);
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = 1.75 * scale;
        topRing.castShadow = true;
        group.add(topRing);
      }
    }

    return group;
  }

  /**
   * Create felt wall covering
   */
  private createFeltWalls(scale: number): THREE.Group {
    const group = new THREE.Group();
    const feltMat = this.pbrMats.getFeltPBRMaterial(0xf0e8d8);

    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;

      // Create felt panel as a curved surface
      const wallGeo = new THREE.BoxGeometry(
        1.6 * scale,
        1.8 * scale,
        0.08 * scale,
        8,
        12,
        1,
      );

      const wall = new THREE.Mesh(wallGeo, feltMat);
      const x = Math.cos(angle + Math.PI / segments) * 2.35 * scale;
      const z = Math.sin(angle + Math.PI / segments) * 2.35 * scale;
      wall.position.set(x, 0.9 * scale, z);
      wall.rotation.y = angle + Math.PI / segments;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }

    return group;
  }

  /**
   * Create roof crown (toono) - the top opening
   */
  private createRoofCrown(scale: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = this.pbrMats.getWoodPBRMaterial();

    // Circular crown ring
    const crownGeo = new THREE.TorusGeometry(0.8 * scale, 0.04 * scale, 12, 32);
    const crown = new THREE.Mesh(crownGeo, woodMat);
    crown.rotation.x = Math.PI / 2;
    crown.castShadow = true;
    group.add(crown);

    // Crown frame posts
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const postGeo = new THREE.CylinderGeometry(
        0.03 * scale,
        0.03 * scale,
        0.5 * scale,
        8,
        2,
      );
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(
        Math.cos(angle) * 0.7 * scale,
        0.25 * scale,
        Math.sin(angle) * 0.7 * scale,
      );
      post.castShadow = true;
      group.add(post);
    }

    return group;
  }

  /**
   * Create roof poles radiating from center
   */
  private createRoofPoles(scale: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = this.pbrMats.getWoodPBRMaterial();

    const poleCount = 20;
    for (let i = 0; i < poleCount; i++) {
      const angle = (i / poleCount) * Math.PI * 2;
      const poleLength = Math.sqrt((2.2 * scale) ** 2 + (1.5 * scale) ** 2);

      const poleGeo = new THREE.CylinderGeometry(
        0.02 * scale,
        0.025 * scale,
        poleLength,
        8,
        2,
      );
      const pole = new THREE.Mesh(poleGeo, woodMat);

      const midX = (Math.cos(angle) * 2.2 * scale) / 2;
      const midZ = (Math.sin(angle) * 2.2 * scale) / 2;
      pole.position.set(midX, 1.5 * scale, midZ);

      const poleAngle = Math.atan2(2.2 * scale, 1.5 * scale);
      pole.rotation.z = -angle - Math.PI / 2;
      pole.rotation.x = Math.PI / 2 - poleAngle;

      pole.castShadow = true;
      group.add(pole);
    }

    return group;
  }

  /**
   * Create roof covering
   */
  private createRoof(scale: number): THREE.Group {
    const group = new THREE.Group();
    const feltMat = this.pbrMats.getFeltPBRMaterial(0xe8d8c8);

    // Cone-shaped roof
    const roofGeo = new THREE.ConeGeometry(2.5 * scale, 1.3 * scale, 24, 4);
    const roof = new THREE.Mesh(roofGeo, feltMat);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    return group;
  }

  /**
   * Create rope bindings
   */
  private createRopeBindings(scale: number): THREE.Group {
    const group = new THREE.Group();
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.8,
      metalness: 0,
    });

    // Circular binding ropes
    const bindingHeights = [0.5, 1.0, 1.5];
    bindingHeights.forEach((height) => {
      const ropeGeo = new THREE.TorusGeometry(
        2.3 * scale,
        0.015 * scale,
        8,
        48,
      );
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.rotation.x = Math.PI / 2;
      rope.position.y = height * scale;
      group.add(rope);
    });

    // Radial ropes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ropeCurve = new THREE.LineCurve3(
        new THREE.Vector3(0, 1.8 * scale, 0),
        new THREE.Vector3(
          Math.cos(angle) * 2.3 * scale,
          0.3 * scale,
          Math.sin(angle) * 2.3 * scale,
        ),
      );

      const ropeGeo = new THREE.TubeGeometry(ropeCurve, 8, 0.015 * scale, 4);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      group.add(rope);
    }

    return group;
  }

  /**
   * Create door
   */
  private createDoor(scale: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = this.pbrMats.getWoodPBRMaterial();
    const feltMat = this.pbrMats.getFeltPBRMaterial(0xd8c8b8);

    // Door frame
    const frameGeo = new THREE.BoxGeometry(
      1.4 * scale,
      1.8 * scale,
      0.08 * scale,
      8,
      12,
      1,
    );
    const frame = new THREE.Mesh(frameGeo, woodMat);
    frame.castShadow = true;
    group.add(frame);

    // Door panels
    const panelGeo = new THREE.BoxGeometry(
      0.65 * scale,
      1.6 * scale,
      0.05 * scale,
      6,
      10,
      1,
    );
    for (let side of [-0.35 * scale, 0.35 * scale]) {
      const panel = new THREE.Mesh(panelGeo, feltMat);
      panel.position.x = side;
      panel.position.y = 0.1 * scale;
      panel.castShadow = true;
      group.add(panel);
    }

    return group;
  }

  /**
   * Create decorative elements
   */
  private createDecorations(scale: number): THREE.Group {
    const group = new THREE.Group();

    // Roof finial decoration
    const finialGeo = new THREE.SphereGeometry(0.15 * scale, 12, 12);
    const finialMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.4,
      metalness: 0.6,
    });
    const finial = new THREE.Mesh(finialGeo, finialMat);
    finial.position.y = 2.3 * scale;
    finial.castShadow = true;
    group.add(finial);

    return group;
  }
}

export { DetailedGerBuilder };
