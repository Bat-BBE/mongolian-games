// ============================================================
// SceneBuilder.ts
// ============================================================

import * as THREE from "three";
import { rand, randInt, mkMat, terrainHeight } from "./sceneHelpers";
import { STATION_CONFIGS, HORSE_COLORS, TERRAIN_W, TERRAIN_D, TERRAIN_SEG } from "./mapConstants";
import type { UrtuuStation } from "./UrtuuNode";

export interface HorseEntry {
  group: THREE.Group; baseRot: number; speed: number;
  orbitR: number; orbitCx: number; orbitCz: number; phase: number;
}
export interface CloudEntry { g: THREE.Group; speed: number; alt: number; }
export interface BirdEntry {
  pivot: THREE.Group; arm: THREE.Group; speed: number; radius: number;
  yOff: number; phase: number; wingMesh: THREE.Mesh; alt: number;
}

export class SceneBuilder {
  private scene: THREE.Scene;
  private currentStationId: string;
  private doneStationIds: string[];

  public horses: HorseEntry[] = [];
  public clouds: CloudEntry[] = [];
  public birds:  BirdEntry[]  = [];
  public markerMeshes = new Map<string, THREE.Mesh>();
  public labelAnchors = new Map<string, THREE.Vector3>();

  constructor(scene: THREE.Scene, currentStationId: string, doneStationIds: string[]) {
    this.scene = scene;
    this.currentStationId = currentStationId;
    this.doneStationIds = doneStationIds;
  }

  // ── Тэнгэр ───────────────────────────────────────────────

  buildSky(): void {
    const geo = new THREE.SphereGeometry(700, 32, 16);
    geo.scale(-1, 1, -1);
    const colors = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = geo.attributes.position.getY(i);
      const t = Math.max(0, Math.min(1, (y + 700) / 1400));
      colors[i * 3]     = 0.28 + (1 - t) * 0.62;
      colors[i * 3 + 1] = 0.50 + (1 - t) * 0.34;
      colors[i * 3 + 2] = 0.90 - (1 - t) * 0.40;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })));
  }

  // ── Газрын гадарга ────────────────────────────────────────

  buildTerrain(): void {
    const geo = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_D, TERRAIN_SEG, TERRAIN_SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      let r: number, g: number, b: number;

      const isGobi = z > 22;
      const orkhonX = -32 + Math.sin(z * 0.08) * 6;
      const nearRiver = Math.abs(x - orkhonX) < 10 ||
                        (Math.abs(x - 2) < 7 && z > -10 && z < 14);

      if (isGobi) {
        // Говь — хуурай элсэн шар
        const t = Math.min((z - 22) / 20, 1);
        r = 0.80 + t * 0.08 + rand(-0.02, 0.02);
        g = 0.72 + t * 0.04 + rand(-0.02, 0.02);
        b = 0.44 - t * 0.06 + rand(-0.02, 0.02);
      } else if (nearRiver && h < 3) {
        // Голын хөвөө — ногоон
        r = 0.30 + rand(-0.03, 0.03);
        g = 0.56 + rand(-0.04, 0.04);
        b = 0.26 + rand(-0.02, 0.02);
      } else if (h > 18) {
        // Цасан оргил
        const t = Math.min((h - 18) / 8, 1);
        r = 0.72 + t * 0.24 + rand(-0.02, 0.02);
        g = 0.70 + t * 0.22 + rand(-0.02, 0.02);
        b = 0.64 + t * 0.30 + rand(-0.02, 0.02);
      } else if (h > 8) {
        // Уулын налуу — харанхуй ногоон
        r = 0.52 + rand(-0.04, 0.04);
        g = 0.54 + rand(-0.04, 0.04);
        b = 0.34 + rand(-0.03, 0.03);
      } else if (h > 3) {
        // Толгод — алтан өвс
        r = 0.68 + rand(-0.04, 0.04);
        g = 0.62 + rand(-0.04, 0.04);
        b = 0.36 + rand(-0.03, 0.03);
      } else {
        // Тал бэлчээр — ногоон-алтан
        const gr = Math.max(0, 1 - h * 0.08);
        r = 0.58 + gr * (-0.05) + rand(-0.04, 0.04);
        g = 0.65 + gr * 0.10   + rand(-0.04, 0.04);
        b = 0.30 + gr * 0.05   + rand(-0.03, 0.03);
      }
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 })
    );
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  // ── Голууд ────────────────────────────────────────────────

  buildRivers(): void {
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x3a7aaf, roughness: 0.04, metalness: 0.38, transparent: true, opacity: 0.88,
    });
    const tribMat = new THREE.MeshStandardMaterial({
      color: 0x4a8abc, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.80,
    });

    // Орхон гол
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100, rz = -28 + t * 55;
      const rx = -32 + Math.sin(rz * 0.08) * 6 + Math.sin(rz * 0.05 + 1) * 3;
      pts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.15, rz));
    }
    this.scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 2.0, 10, false), riverMat
    ));

    // Туул гол
    const tuulPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, rz = -12 + t * 26;
      const rx = 2 + Math.sin(rz * 0.10) * 4 + Math.sin(rz * 0.07 + 0.5) * 2;
      tuulPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.12, rz));
    }
    this.scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tuulPts), 100, 1.4, 8, false), riverMat
    ));

    // Сэлэнгэ гол (Орхоноос хойш)
    const selPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 50; i++) {
      const t = i / 50, rz = -28 - t * 22;
      const rx = -22 + Math.sin(rz * 0.06) * 8;
      selPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.12, rz));
    }
    this.scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(selPts), 80, 1.6, 8, false), tribMat
    ));

    // Хэрлэн гол (зүүн)
    const kherPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, rx = 12 + t * 60;
      const rz = -2 + Math.sin(rx * 0.045) * 5;
      kherPts.push(new THREE.Vector3(rx, terrainHeight(rx, rz) + 0.10, rz));
    }
    this.scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kherPts), 100, 1.1, 8, false), tribMat
    ));

    // Хөвсгөл нуур
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1a5a8a, roughness: 0.02, metalness: 0.55, transparent: true, opacity: 0.93,
    });
    const lakeShape = new THREE.Shape();
    lakeShape.ellipse(0, 0, 5, 13, 0, Math.PI * 2, false, 0.15);
    const lake = new THREE.Mesh(new THREE.ShapeGeometry(lakeShape, 32), lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-63, terrainHeight(-63, -44) + 0.25, -44);
    this.scene.add(lake);

    // Увсын нуур
    const uvsShape = new THREE.Shape();
    uvsShape.ellipse(0, 0, 7, 5, 0, Math.PI * 2, false, 0);
    const uvsLake = new THREE.Mesh(new THREE.ShapeGeometry(uvsShape, 24), lakeMat);
    uvsLake.rotation.x = -Math.PI / 2;
    uvsLake.position.set(-98, terrainHeight(-98, -38) + 0.22, -38);
    this.scene.add(uvsLake);
  }

  // ── Гүүр ─────────────────────────────────────────────────

  buildBridge(): void {
    [[- 32, -5], [2, 4]].forEach(([bx, bz]) => {
      const by = terrainHeight(bx, bz);
      const bm = mkMat(0x7a5810, 0.8);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(7, 0.45, 3.5), bm);
      bridge.position.set(bx, by + 0.55, bz); bridge.castShadow = true; this.scene.add(bridge);
      [-3.5, 3.5].forEach(side => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(7, 0.28, 0.14), mkMat(0x6a4a0e, 0.85));
        rail.position.set(bx, by + 1.0, bz + side * 0.44); this.scene.add(rail);
        for (let p = -3; p <= 3; p += 1.4) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.85, 0.13), mkMat(0x6a4a0e, 0.85));
          post.position.set(bx + p, by + 0.82, bz + side * 0.44); this.scene.add(post);
        }
      });
    });
  }

  // ── Мод ──────────────────────────────────────────────────

  private makeTree(x: number, z: number, s = 1): void {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * s, 0.17 * s, 1.4 * s, 7),
      mkMat(0x4a3018, 0.95)
    );
    trunk.position.y = 0.7 * s; trunk.castShadow = true; g.add(trunk);
    [
      { color: 0x1a4e12, r: 1.3, h: 2.0, y: 1.4 },
      { color: 0x235e18, r: 1.0, h: 1.7, y: 2.8 },
      { color: 0x2a6a1e, r: 0.72, h: 1.4, y: 3.9 },
      { color: 0x1e5414, r: 0.42, h: 1.0, y: 5.0 },
    ].forEach(l => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r * s, l.h * s, 7), mkMat(l.color, 0.88));
      cone.position.y = l.y * s; cone.rotation.y = rand(0, Math.PI); cone.castShadow = true; g.add(cone);
    });
    g.position.set(x, terrainHeight(x, z), z); this.scene.add(g);
  }

  buildTrees(): void {
    // Хангайн нурууны ой
    for (let i = 0; i < 140; i++) {
      const x = rand(-70, -20), z = rand(-30, -5);
      const h = terrainHeight(x, z);
      if (h > 1.5 && h < 18) this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.6, 1.3));
    }
    // Хэнтийн ой
    for (let i = 0; i < 90; i++) {
      const x = rand(14, 52), z = rand(-26, -5);
      const h = terrainHeight(x, z);
      if (h > 1.0 && h < 14) this.makeTree(x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(0.5, 1.1));
    }
    // Орхон голын хөвөөний ой
    for (let i = 0; i < 70; i++) {
      const z = rand(-28, 14);
      const rx = -32 + Math.sin(z * 0.08) * 6;
      const x = rx + rand(-10, 10);
      const h = terrainHeight(x, z);
      if (h > -0.5 && h < 5) this.makeTree(x, z, rand(0.4, 0.95));
    }
    // Хөвсгөлийн эргийн ой
    for (let i = 0; i < 60; i++) {
      const angle = rand(0, Math.PI * 2);
      const r = rand(12, 20);
      const x = -63 + Math.cos(angle) * r;
      const z = -44 + Math.sin(angle) * r * 2.5;
      this.makeTree(x, z, rand(0.6, 1.2));
    }
    // Тэрэлжийн ой
    for (let i = 0; i < 50; i++) {
      const x = rand(10, 24), z = rand(-14, -2);
      this.makeTree(x + rand(-1, 1), z + rand(-1, 1), rand(0.5, 1.0));
    }
    // Бэлчээрийн сийрэг бут
    for (let i = 0; i < 80; i++) {
      const x = rand(-130, 70), z = rand(-45, 20);
      const h = terrainHeight(x, z);
      if (h > 0.5 && h < 6) this.makeTree(x, z, rand(0.22, 0.50));
    }
  }

  // ── Гэр ──────────────────────────────────────────────────

  private makeGer(
    x: number, z: number, rotY = 0, s = 1,
    isStation = false, stationId = ""
  ): void {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8 * s, 2.9 * s, 0.3 * s, 24), mkMat(0x9a8860, 0.95)
    );
    base.position.y = 0.15; g.add(base);

    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#ede0c8"; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "#c4a878"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 36; i++) { ctx.beginPath(); ctx.moveTo(i * 7.5, 0); ctx.lineTo(i * 7.5, 128); ctx.stroke(); }
    ctx.strokeStyle = "#d4b888"; ctx.lineWidth = 1;
    for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.moveTo(0, j * 22); ctx.lineTo(256, j * 22); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 1);

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7 * s, 2.7 * s, 2.2 * s, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: isStation ? 0xfff6ea : 0xede0c8, roughness: 0.65, map: tex })
    );
    wall.position.y = 1.1 * s + 0.3; g.add(wall);

    const roofColor = isStation
      ? (stationId === this.currentStationId ? 0x22cc66
          : this.doneStationIds.includes(stationId) ? 0xffaa00 : 0xcc4422)
      : [0xc8724a, 0xb86838, 0xd47a50][randInt(0, 2)];
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8 * s, 1.6 * s, 24), mkMat(roofColor, 0.78));
    roof.position.y = (2.2 + 0.8) * s + 0.3; g.add(roof);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4 * s, 0.12 * s, 10, 28), mkMat(0xd89030, 0.45, 0.4)
    );
    ring.position.y = (2.2 + 1.6) * s + 0.3; ring.rotation.x = Math.PI / 2; g.add(ring);

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.8, 4), mkMat(0xc8a058, 0.9));
      rp.position.set(Math.sin(angle) * 1.5 * s, (2.2 + 0.8) * s + 0.3, Math.cos(angle) * 1.5 * s);
      rp.rotation.z = Math.sin(angle) * 0.55; rp.rotation.x = -Math.cos(angle) * 0.55; g.add(rp);
    }

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.7 * s, 0.1 * s), mkMat(0x6a3a10, 0.8));
    door.position.set(0, 0.85 * s + 0.3, 2.72 * s); g.add(door);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05 * s, 1.85 * s, 0.06 * s), mkMat(0xd09030, 0.65, 0.15));
    frame.position.set(0, 0.92 * s + 0.3, 2.75 * s); g.add(frame);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.8;
      const pat = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 * s, 0.12 * s, 0.06 * s),
        mkMat(isStation ? 0xf0c020 : 0xe05030, 0.8)
      );
      pat.position.set(Math.sin(angle) * 2.72 * s, 1.8 * s + 0.3, Math.cos(angle) * 2.72 * s);
      pat.rotation.y = -angle; g.add(pat);
    }

    if (isStation) {
      const mc = stationId === this.currentStationId ? 0x44ff88
        : this.doneStationIds.includes(stationId) ? 0xffcc00 : 0xff6644;
      const markerMat = new THREE.MeshStandardMaterial({
        color: mc, emissive: mc, emissiveIntensity: 0.7, roughness: 0.25,
      });
      const marker = new THREE.Mesh(new THREE.TorusGeometry(1.5 * s, 0.13 * s, 10, 40), markerMat);
      marker.position.y = (2.2 + 1.6 + 0.9) * s + 0.3; marker.rotation.x = Math.PI / 2; g.add(marker);
      this.markerMeshes.set(stationId, marker);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 * s, 10, 10),
        new THREE.MeshBasicMaterial({ color: mc, transparent: true, opacity: 0.14 })
      );
      glow.position.y = (2.2 + 1.6 + 0.9) * s + 0.3; g.add(glow);

      if (stationId === this.currentStationId) {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 9, 10),
          new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.28 })
        );
        beam.position.y = (2.2 + 1.6 + 5.5) * s + 0.3; g.add(beam);
      }

      this.labelAnchors.set(
        stationId,
        new THREE.Vector3(x, terrainHeight(x, z) + (2.2 + 1.6 + 0.9 + 2.8) * s + 0.3, z)
      );
    }

    g.position.set(x, terrainHeight(x, z), z);
    g.rotation.y = rotY; g.castShadow = true; g.receiveShadow = true;
    this.scene.add(g);
  }

  private makeFence(cx: number, cz: number, w: number, d: number, rotY = 0): void {
    const g = new THREE.Group(), fm = mkMat(0x9a7840, 0.95);
    const pts: [number, number][] = [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2],[-w/2,-d/2]];
    for (let s = 0; s < 4; s++) {
      const [ax, az] = pts[s], [bx, bz] = pts[s + 1];
      const len = Math.sqrt((bx-ax)**2+(bz-az)**2), mx=(ax+bx)/2, mz=(az+bz)/2, ry=Math.atan2(bx-ax,bz-az);
      [0.7, 0.4].forEach(py => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.07), fm);
        rail.position.set(mx, py, mz); rail.rotation.y = ry; g.add(rail);
      });
      const n = Math.max(2, Math.floor(len / 2.8));
      for (let i = 0; i <= n; i++) {
        const tt = i / n;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.1, 6), fm);
        post.position.set(ax+(bx-ax)*tt, 0.55, az+(bz-az)*tt);
        post.castShadow = true; g.add(post);
      }
    }
    g.position.set(cx, terrainHeight(cx, cz), cz); g.rotation.y = rotY; this.scene.add(g);
  }

  // Тархсан гэрийн хороолол — аймаг тус бүрийн орчимд
  buildGerCamps(): void {
    [
      // УБ хавийн том хороолол
      {gx:3,gz:2,n:7,sp:14},{gx:-5,gz:-2,n:5,sp:10},{gx:8,gz:4,n:4,sp:9},
      // Орхон хөндий
      {gx:-34,gz:-10,n:5,sp:12},{gx:-30,gz:-2,n:5,sp:11},{gx:-36,gz:5,n:4,sp:9},
      // Хархорум орчим
      {gx:-38,gz:4,n:5,sp:10},{gx:-34,gz:9,n:4,sp:8},
      // Арвайхээр орчим
      {gx:-38,gz:18,n:4,sp:9},
      // Баянхонгор
      {gx:-56,gz:20,n:4,sp:10},
      // Эрдэнэт
      {gx:-27,gz:-22,n:4,sp:9},{gx:-23,gz:-18,n:3,sp:7},
      // Мөрөн
      {gx:-63,gz:-32,n:4,sp:9},{gx:-58,gz:-28,n:3,sp:8},
      // Говь — сийрэг
      {gx:-5,gz:28,n:3,sp:14},{gx:14,gz:30,n:2,sp:10},{gx:-20,gz:40,n:2,sp:10},
      {gx:30,gz:32,n:2,sp:9},{gx:42,gz:44,n:2,sp:9},
      // Зүүн тал
      {gx:55,gz:2,n:3,sp:10},{gx:65,gz:-20,n:3,sp:9},{gx:58,gz:12,n:2,sp:8},
      // Хэнтий
      {gx:35,gz:2,n:4,sp:9},{gx:48,gz:-12,n:3,sp:8},
      // Баруун
      {gx:-80,gz:0,n:3,sp:8},{gx:-80,gz:16,n:3,sp:9},
      {gx:-100,gz:-6,n:3,sp:8},{gx:-98,gz:-36,n:2,sp:7},
    ].forEach(({gx,gz,n,sp}) => {
      for (let i = 0; i < n; i++) {
        const x = gx + rand(-sp/2, sp/2), z = gz + rand(-sp/2, sp/2);
        this.makeGer(x, z, rand(0, Math.PI*2), rand(0.8,1.15));
        if (Math.random() > 0.4) this.makeFence(x, z, rand(7,12), rand(6,10), rand(0, Math.PI*0.5));
      }
    });
  }

  // Станцын гэрийн хороолол
  buildStationGers(stations: UrtuuStation[]): void {
    stations.forEach(s => {
      const cfg = STATION_CONFIGS[s.id]; if (!cfg) return;
      this.makeGer(cfg.wx, cfg.wz, rand(0, Math.PI*2), 1.6, true, s.id);
      for (let i = 0; i < 3; i++) {
        const ox = rand(-9, 9), oz = rand(-9, 9);
        if (Math.abs(ox) < 4 && Math.abs(oz) < 4) continue;
        this.makeGer(cfg.wx+ox, cfg.wz+oz, rand(0, Math.PI*2), rand(0.9,1.1));
      }
      this.makeFence(cfg.wx, cfg.wz, 16, 14, rand(0, Math.PI*0.3));
      this.makeOvoo(cfg.wx+4, cfg.wz+3.5);
    });
  }

  // ── Овоо ─────────────────────────────────────────────────

  makeOvoo(x: number, z: number): void {
    const g = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.28,0.72),0), mkMat(0x908878,0.96));
      r.position.set(rand(-0.7,0.7),rand(0,1.1),rand(-0.7,0.7));
      r.rotation.set(rand(0,Math.PI),rand(0,Math.PI),rand(0,Math.PI));
      r.castShadow = true; g.add(r);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,4,8), mkMat(0x4a3010,0.9));
    pole.position.y = 2.5; g.add(pole);
    [[0xcc1818,0],[0x1818cc,0.6],[0xf0c010,1.1],[0x18aa18,1.55],[0xcc18cc,2.0]].forEach(([col,off]) => {
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0,0.55),
        new THREE.MeshStandardMaterial({color:col as number,side:THREE.DoubleSide,roughness:0.88})
      );
      flag.position.set(0.52, 4.6-(off as number)*0.5, 0); flag.rotation.y = 0.2; g.add(flag);
    });
    g.position.set(x, terrainHeight(x,z), z); this.scene.add(g);
  }

  // ── Уул ──────────────────────────────────────────────────

  buildMountains(): void {
    // Хангайн нуруу
    [
      [-45,-20,22,16],[-32,-16,18,13],[-55,-26,26,18],
      [-60,-22,24,16],[-40,-28,20,14],[-25,-12,16,11],
      [-68,-16,28,20],[-50,-10,20,13],[-38,-22,18,12],
    ].forEach(([x,z,h,r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r,h,randInt(5,8)), mkMat(h>20?0xbcc0d8:0x9a9080,0.94));
      m.position.set(x, terrainHeight(x,z)+h/2-3, z); m.rotation.y=rand(0,Math.PI); m.castShadow=true; this.scene.add(m);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(r*0.28,h*0.34,8), mkMat(0xeef2ff,0.62));
      snow.position.set(x, terrainHeight(x,z)+h-h*0.18, z); this.scene.add(snow);
    });

    // Монгол Алтайн нуруу
    [
      [-90,2,30,22],[-84,8,26,18],[-96,-2,28,20],
      [-88,-10,24,16],[-80,14,24,17],[-102,6,26,18],
      [-92,18,22,15],[-84,-6,20,14],
    ].forEach(([x,z,h,r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r,h,randInt(5,8)), mkMat(h>24?0xaab0cc:0x8a8472,0.94));
      m.position.set(x, terrainHeight(x,z)+h/2-3, z); m.rotation.y=rand(0,Math.PI); m.castShadow=true; this.scene.add(m);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(r*0.30,h*0.36,8), mkMat(0xe8ecff,0.60));
      snow.position.set(x, terrainHeight(x,z)+h-h*0.20, z); this.scene.add(snow);
    });

    // Хэнтийн нуруу
    [
      [28,-18,16,11],[20,-14,14,10],[38,-22,18,13],
      [45,-16,14,10],[34,-10,12,9],
    ].forEach(([x,z,h,r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r,h,7), mkMat(0xa09888,0.94));
      m.position.set(x, terrainHeight(x,z)+h/2-2, z); m.rotation.y=rand(0,Math.PI); m.castShadow=true; this.scene.add(m);
    });

    // Говийн Алтай
    [
      [-70,20,18,13],[-60,26,14,11],[-78,24,20,14],
      [-65,32,13,10],[-75,14,16,11],
    ].forEach(([x,z,h,r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r,h,6), mkMat(0x9a9070,0.96));
      m.position.set(x, terrainHeight(x,z)+h/2-2, z); m.rotation.y=rand(0,Math.PI); m.castShadow=true; this.scene.add(m);
    });

    // Бэлчээрийн бага толгодууд
    [
      [-12,8,5,5],[18,6,5,4],[-22,14,6,5],
      [28,4,4,4],[-38,18,6,5],[12,-4,5,4],
      [52,6,4,4],[-48,4,5,4],[62,12,4,4],
      [-8,-8,5,4],[22,-10,5,4],[42,20,4,4],
    ].forEach(([x,z,h,r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r,h,7), mkMat(0xa09878,0.94));
      m.position.set(x, terrainHeight(x,z)+h/2-1.5, z); m.rotation.y=rand(0,Math.PI); this.scene.add(m);
    });
  }

  // ── Морь ─────────────────────────────────────────────────

  makeHorse(
    x: number, z: number, rotY = 0, color = 0x6b3a1f,
    animate = false, orbitCx = 0, orbitCz = 0, orbitR = 5, phase = 0
  ): THREE.Group {
    const g = new THREE.Group();
    const hm = mkMat(color,0.82), dk = mkMat(0x2a1508,0.88);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.5,0.42),hm);
    body.position.y=0.9; body.rotation.z=0.04; g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.16,0.58,9),hm);
    neck.position.set(0.42,1.15,0); neck.rotation.z=-0.52; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.25,0.25),hm);
    head.position.set(0.68,1.38,0); g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.18,0.2),hm);
    snout.position.set(0.9,1.31,0); g.add(snout);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6),mkMat(0x0a0a0a,0.2));
    eye.position.set(0.79,1.41,0.11); g.add(eye);
    const legGroups: THREE.Group[] = [];
    [[0.3,0,-0.15],[0.3,0,0.15],[-0.3,0,-0.15],[-0.3,0,0.15]].forEach(([lx,,lz]) => {
      const lg = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.42,8),hm);
      upper.position.y=-0.21; lg.add(upper);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.048,0.38,8),hm);
      lower.position.y=-0.6; lg.add(lower);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.09,0.16),dk);
      hoof.position.y=-0.82; lg.add(hoof);
      lg.position.set(lx,0.75,lz); g.add(lg); legGroups.push(lg);
    });
    (g as any)._legGroups = legGroups;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07,0.75,8),dk);
    tail.position.set(-0.56,0.95,0); tail.rotation.z=1.35; g.add(tail);
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.28,0.2),dk);
    mane.position.set(0.44,1.25,0); mane.rotation.z=-0.32; g.add(mane);
    g.position.set(x,terrainHeight(x,z),z);
    g.rotation.y=rotY; g.scale.setScalar(rand(0.85,1.1)); g.castShadow=true;
    this.scene.add(g);
    if (animate) this.horses.push({group:g,baseRot:rotY,speed:rand(0.35,0.85),orbitR,orbitCx,orbitCz,phase});
    return g;
  }

  makeRider(parent: THREE.Group): void {
    const coatColors=[0x8b2020,0x1a4a8a,0x2a6a2a,0x6a4a1a,0x6a1a6a];
    const coat=mkMat(coatColors[randInt(0,4)],0.85), skin=mkMat(0xc89060,0.9);
    const torso=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.4,0.24),coat);
    torso.position.set(0,1.58,0); parent.add(torso);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.15,9,9),skin);
    hd.position.set(0,1.92,0); parent.add(hd);
    const hat=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.19,0.14,12),mkMat(0x1a1a1a,0.9));
    hat.position.set(0,2.05,0); parent.add(hat);
    [[-0.22,0.08],[0.22,0.08]].forEach(([sx,sz]) => {
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.32,6),coat);
      arm.position.set(sx*1.5,1.62,sz); arm.rotation.z=sx>0?0.85:-0.85; arm.rotation.x=0.35; parent.add(arm);
    });
  }

  buildHorses(): void {
    // Аймаг тус бүрийн орчимд сүрэг
    [
      {x:4,z:2},{x:-6,z:5},{x:10,z:-2},{x:-10,z:2},
      {x:-32,z:-10},{x:-28,z:-4},{x:-36,z:4},{x:-34,z:-18},
      {x:35,z:0},{x:28,z:-8},{x:42,z:-10},{x:52,z:-20},
      {x:60,z:-22},{x:55,z:8},{x:62,z:4},
      {x:-62,z:-30},{x:-56,z:-24},{x:-65,z:-18},
      {x:-80,z:0},{x:-85,z:14},{x:-98,z:-4},
      {x:0,z:28},{x:15,z:32},{x:-18,z:36},
    ].forEach(({x,z}) => {
      const orbitR=rand(5,12), phase=rand(0,Math.PI*2);
      const hg=this.makeHorse(
        x+Math.cos(phase)*orbitR, z+Math.sin(phase)*orbitR,
        rand(0,Math.PI), HORSE_COLORS[randInt(0,HORSE_COLORS.length-1)],
        true, x, z, orbitR, phase
      );
      if (Math.random()>0.4) this.makeRider(hg);
    });
    // Тогтсон бэлчээрийн морь
    for (let i=0; i<55; i++) {
      const x=rand(-120,72), z=rand(-40,50);
      const h=terrainHeight(x,z);
      if (h>9||h<-1) continue;
      this.makeHorse(x,z,rand(0,Math.PI*2),HORSE_COLORS[randInt(0,HORSE_COLORS.length-1)],false);
    }
  }

  // ── Тэмээ ─────────────────────────────────────────────────

  makeCamel(x: number, z: number, rotY = 0): void {
    const g=new THREE.Group(), cm=mkMat(0xc8a060,0.9), dk=mkMat(0x8a6030,0.9);
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.62,0.58),cm);
    body.position.y=1.2; g.add(body);
    [[-0.28,1.54],[0.28,1.54]].forEach(([ox,oy]) => {
      const hump=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,9),cm);
      hump.position.set(ox,oy,0); hump.scale.set(0.78,1.05,0.68); g.add(hump);
    });
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.18,0.75,9),cm);
    neck.position.set(0.7,1.5,0); neck.rotation.z=-0.42; g.add(neck);
    const chead=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.28,0.28),cm);
    chead.position.set(1.12,1.72,0); g.add(chead);
    [[0.45,0,-0.22],[0.45,0,0.22],[-0.45,0,-0.22],[-0.45,0,0.22]].forEach(([lx,,lz]) => {
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.07,1.1,9),cm);
      leg.position.set(lx,0.58,lz); g.add(leg);
      const foot=new THREE.Mesh(new THREE.SphereGeometry(0.14,9,7),dk);
      foot.position.set(lx,0.07,lz); foot.scale.set(1.25,0.48,1.45); g.add(foot);
    });
    g.position.set(x,terrainHeight(x,z),z); g.rotation.y=rotY;
    g.scale.setScalar(rand(0.88,1.05)); g.castShadow=true; this.scene.add(g);
  }

  buildCamels(): void {
    // Говийн бүсэд тэмээ
    [
      {x:-22,z:30},{x:-18,z:34},{x:-25,z:38},{x:-15,z:32},
      {x:0,z:32},{x:5,z:36},{x:-5,z:40},{x:10,z:34},
      {x:30,z:28},{x:35,z:32},{x:28,z:36},{x:40,z:30},
      {x:42,z:38},{x:45,z:34},{x:38,z:42},{x:50,z:32},
    ].forEach(({x,z})=>this.makeCamel(x+rand(-3,3),z+rand(-3,3),rand(0,Math.PI*2)));
  }

  // ── Үүл ──────────────────────────────────────────────────

  buildClouds(): void {
    for (let i=0; i<32; i++) {
      const cg=new THREE.Group();
      for (let p=0; p<randInt(4,9); p++) {
        const cs=rand(3,7);
        const cm=new THREE.Mesh(
          new THREE.SphereGeometry(rand(0.9,1.5)*cs,9,7),
          new THREE.MeshStandardMaterial({color:0xf4f8ff,roughness:1,transparent:true,opacity:rand(0.78,0.93)})
        );
        cm.position.set(rand(-5,5)*cs*0.4, rand(-0.7,1.2)*cs*0.25, rand(-2,2)*cs*0.2);
        cg.add(cm);
      }
      cg.position.set(rand(-220,220),rand(50,90),rand(-110,90));
      this.scene.add(cg);
      this.clouds.push({g:cg,speed:rand(0.008,0.024)*(Math.random()>0.5?1:-0.5),alt:cg.position.y});
    }
  }

  // ── Шувуу ─────────────────────────────────────────────────

  buildBirds(): void {
    for (let i=0; i<22; i++) {
      const pivot=new THREE.Group();
      pivot.position.set(rand(-100,80),rand(28,65),rand(-80,70));
      const arm=new THREE.Group(); arm.position.x=rand(10,28);
      const body=new THREE.Mesh(new THREE.SphereGeometry(0.28,6,5),mkMat(0x222222,0.8));
      arm.add(body);
      const wingMesh=new THREE.Mesh(
        new THREE.PlaneGeometry(1.7,0.42),
        new THREE.MeshBasicMaterial({color:0x1a1a1a,side:THREE.DoubleSide})
      );
      arm.add(wingMesh); pivot.add(arm); this.scene.add(pivot);
      this.birds.push({pivot,arm,speed:rand(0.25,0.62),radius:rand(10,28),yOff:rand(-4,4),phase:rand(0,Math.PI*2),wingMesh,alt:pivot.position.y});
    }
  }

  // ── Өвс, Чулуу ────────────────────────────────────────────

  buildGrassTufts(): void {
    for (let i=0; i<400; i++) {
      const x=rand(-150,80), z=rand(-50,55);
      const h=terrainHeight(x,z);
      if (h>10||h<-0.8) continue;
      const g=new THREE.Group();
      const isGobi=z>22;
      for (let b=0; b<randInt(3,7); b++) {
        const bx=rand(-0.35,0.35), bz=rand(-0.35,0.35);
        const grassCols=isGobi?[0x9aaa60,0x8a9a50,0xaaaa68]:[0x5a8830,0x4a7820,0x6a9840,0x7aaa50];
        const blade=new THREE.Mesh(
          new THREE.CylinderGeometry(0.02,0.04,rand(0.18,isGobi?0.38:0.62),4),
          mkMat(grassCols[randInt(0,grassCols.length-1)],0.9)
        );
        blade.position.set(bx,rand(0.09,0.30),bz);
        blade.rotation.z=rand(-0.35,0.35); blade.rotation.x=rand(-0.22,0.22); g.add(blade);
      }
      g.position.set(x,h,z); this.scene.add(g);
    }
  }

  buildRocks(): void {
    for (let i=0; i<130; i++) {
      const x=rand(-160,90), z=rand(-55,60);
      const h=terrainHeight(x,z);
      const rg=new THREE.Group();
      const nearMtn=h>5;
      for (let j=0; j<randInt(1,nearMtn?6:3); j++) {
        const size=nearMtn?rand(0.3,1.3):rand(0.15,0.65);
        const rm=new THREE.Mesh(
          new THREE.DodecahedronGeometry(size*rand(0.5,1.8),0),
          mkMat(nearMtn?0x787060:0x888070,0.96)
        );
        rm.position.set(rand(-0.6,0.6),rand(0.1,0.4),rand(-0.6,0.6));
        rm.rotation.set(rand(0,Math.PI),rand(0,Math.PI),rand(0,Math.PI));
        rm.castShadow=true; rg.add(rm);
      }
      rg.position.set(x,h,z); this.scene.add(rg);
    }
  }
}