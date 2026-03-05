"use client";

import { useEffect, useRef, useState } from "react";
import type { DashStrings } from "./dashboard-strings";
import { UrtuuNode, type UrtuuStation } from "./UrtuuNode";
import { StationPopup } from "./StationPopup";
import * as THREE from "three";

const STATION_CONFIGS: Record<string, {
  left: string; top: string; icon: string; wx: number; wz: number
}> = {
  kharakhorum: { left: "38%", top: "58%", icon: "🏛️", wx: 2,   wz: -5  },
  orkhon:      { left: "30%", top: "45%", icon: "🌊", wx: -10, wz: -15 },
  erdenet:     { left: "55%", top: "35%", icon: "⛏️", wx: 22,  wz: -8  },
  altai:       { left: "20%", top: "42%", icon: "⛰️", wx: -20, wz: 10  },
  gobi:        { left: "62%", top: "68%", icon: "🏜️", wx: 15,  wz: 22  },
};

interface LabelPos { x: number; y: number; visible: boolean }

interface MapAreaProps {
  t: DashStrings;
  currentStationId: string;
  doneStationIds: string[];
}

export function MapArea({ t, currentStationId, doneStationIds }: MapAreaProps) {
  const canvasRef    = useRef<HTMLDivElement>(null);
  const markerMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const labelAnchors = useRef<Map<string, THREE.Vector3>>(new Map());

  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [labelPositions, setLabelPositions] = useState<Record<string, LabelPos>>({});

  const stations: UrtuuStation[] = (t?.stations ?? []).map((s) => ({
    ...s,
    pos:       { left: STATION_CONFIGS[s.id]?.left ?? "50%", top: STATION_CONFIGS[s.id]?.top ?? "50%" },
    icon:      STATION_CONFIGS[s.id]?.icon ?? "📍",
    isCurrent: s.id === currentStationId,
    isDone:    doneStationIds?.includes(s.id) ?? false,
  }));

  const selectedStation = stations.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    markerMeshes.current.clear();
    labelAnchors.current.clear();

    const rand    = (a: number, b: number) => a + Math.random() * (b - a);
    const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
    const mkMat   = (color: number, rough = 0.85, metal = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

    const scene = new THREE.Scene();

    // Sky gradient using a large sphere with vertex colors for horizon glow
    const skyGeo = new THREE.SphereGeometry(480, 32, 16);
    skyGeo.scale(-1, 1, -1);
    const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
    for (let i = 0; i < skyGeo.attributes.position.count; i++) {
      const y = skyGeo.attributes.position.getY(i);
      const t = Math.max(0, Math.min(1, (y + 480) / 960));
      // Deep azure at top → warm peach at horizon
      const r = 0.35 + (1 - t) * 0.55;
      const g = 0.55 + (1 - t) * 0.3;
      const b = 0.85 - (1 - t) * 0.35;
      skyColors[i * 3]     = r;
      skyColors[i * 3 + 1] = g;
      skyColors[i * 3 + 2] = b;
    }
    skyGeo.setAttribute("color", new THREE.BufferAttribute(skyColors, 3));
    const skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
    scene.add(skyMesh);

    scene.fog = new THREE.FogExp2(0xc8dce8, 0.009);

    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 500);
    camera.position.set(0, 38, 80);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // === LIGHTING — warm steppe noon ===
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.8);
    sun.position.set(60, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top  = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x7aa8cc, 0.75));
    const fill = new THREE.DirectionalLight(0xadd4f8, 0.5);
    fill.position.set(-50, 30, -20);
    scene.add(fill);
    const backlight = new THREE.DirectionalLight(0xf0d890, 0.25);
    backlight.position.set(10, 8, 80);
    scene.add(backlight);

    // Hemisphere for sky/ground bounce
    scene.add(new THREE.HemisphereLight(0x7ec8e3, 0xd4c27a, 0.5));

    // === TERRAIN — vast steppe with very gradual undulation ===
    function tH(x: number, z: number): number {
      let h = 0;
      // Gentle rolling steppe — very low frequency waves
      h += Math.sin(x * 0.018) * Math.cos(z * 0.022) * 5;
      h += Math.sin(x * 0.045 + 0.8) * Math.cos(z * 0.038 + 1.2) * 2.5;
      h += Math.sin(x * 0.09 + 2) * Math.cos(z * 0.085 + 0.5) * 1;
      // Very distant mountain range (far south/north edges)
      h += Math.max(0, 22 - Math.sqrt((x * 0.5) ** 2 + (z + 90) ** 2) * 0.38);
      h += Math.max(0, 18 - Math.sqrt((x - 70) ** 2 + (z + 20) ** 2) * 0.42);
      h += Math.max(0, 16 - Math.sqrt((x + 65) ** 2 + (z + 30) ** 2) * 0.44);
      h += Math.max(0, 14 - Math.sqrt((x - 20) ** 2 + (z - 85) ** 2) * 0.5);
      // River valley slight depression
      const riverX = -30 + Math.sin(z * 0.1) * 9 + Math.sin(z * 0.06 + 1) * 5;
      if (Math.abs(x - riverX) < 8) h -= (1 - Math.abs(x - riverX) / 8) * 1.5;
      return h;
    }

    const TERRAIN_W = 260, TERRAIN_D = 210, SEG = 220;
    const tGeo = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_D, SEG, SEG);
    tGeo.rotateX(-Math.PI / 2);
    const posAttr = tGeo.attributes.position;
    const colArr = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), z = posAttr.getZ(i), h = tH(x, z);
      posAttr.setY(i, h);
      const riverX = -30 + Math.sin(z * 0.1) * 9;
      const nearRiver = Math.abs(x - riverX) < 10;
      let r: number, g: number, b: number;
      if (nearRiver && h < 3) {
        // Lush riverbank
        r = 0.38 + rand(-0.03, 0.03);
        g = 0.58 + rand(-0.03, 0.03);
        b = 0.32 + rand(-0.02, 0.02);
      } else if (h > 14) {
        // High alpine rock with snow tint
        const t = Math.min((h - 14) / 10, 1);
        r = 0.65 + t * 0.28 + rand(-0.03, 0.03);
        g = 0.62 + t * 0.25 + rand(-0.03, 0.03);
        b = 0.55 + t * 0.30 + rand(-0.03, 0.03);
      } else if (h > 7) {
        // Upland steppe — golden grass
        r = 0.72 + rand(-0.04, 0.04);
        g = 0.65 + rand(-0.04, 0.04);
        b = 0.38 + rand(-0.03, 0.03);
      } else {
        // Main steppe — warm green-gold mix
        const grassiness = Math.max(0, 1 - h * 0.06);
        r = 0.66 + grassiness * (-0.08) + rand(-0.04, 0.04);
        g = 0.68 + grassiness * 0.10 + rand(-0.04, 0.04);
        b = 0.34 + grassiness * 0.04 + rand(-0.03, 0.03);
      }
      colArr[i * 3] = r; colArr[i * 3 + 1] = g; colArr[i * 3 + 2] = b;
    }
    tGeo.computeVertexNormals();
    tGeo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
    const terrain = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.93, metalness: 0,
    }));
    terrain.receiveShadow = true;
    scene.add(terrain);

    // === RIVER — Orkhon, wide and winding ===
    const rPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 90; i++) {
      const tt = i / 90, rz = -95 + tt * 115;
      const rx = -30 + Math.sin(rz * 0.1) * 9 + Math.sin(rz * 0.06 + 1) * 5;
      rPts.push(new THREE.Vector3(rx, tH(rx, rz) + 0.1, rz));
    }
    const riverCurve = new THREE.CatmullRomCurve3(rPts);
    const riverMesh = new THREE.Mesh(
      new THREE.TubeGeometry(riverCurve, 150, 2.8, 12, false),
      new THREE.MeshStandardMaterial({
        color: 0x3a7aaf, roughness: 0.05, metalness: 0.35,
        transparent: true, opacity: 0.88,
      })
    );
    scene.add(riverMesh);

    // Narrow tributary
    const tribPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const tt = i / 40, rz = -40 + tt * 60;
      const rx = 25 + Math.sin(rz * 0.14) * 6;
      tribPts.push(new THREE.Vector3(rx, tH(rx, rz) + 0.08, rz));
    }
    scene.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tribPts), 80, 1.2, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x4a88bc, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.8 })
    ));

    // Wooden bridge
    const bx = -30 + Math.sin(-5 * 0.1) * 9;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 3.5), mkMat(0x7a5810, 0.8));
    bridge.position.set(bx, tH(bx, -5) + 0.55, -5);
    bridge.castShadow = true;
    scene.add(bridge);
    // Bridge railings
    [-3.5, 3.5].forEach(side => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 0.15), mkMat(0x6a4a0e, 0.85));
      rail.position.set(bx, tH(bx, -5) + 1.0, -5 + side * 0.45);
      scene.add(rail);
      for (let p = -3.5; p <= 3.5; p += 1.4) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), mkMat(0x6a4a0e, 0.85));
        post.position.set(bx + p, tH(bx, -5) + 0.85, -5 + side * 0.45);
        scene.add(post);
      }
    });

    // === TREES — larch and pine forests along river/hills ===
    const allTrees: THREE.Group[] = [];
    function makeTree(x: number, z: number, s = 1) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * s, 0.2 * s, 1.5 * s, 7),
        mkMat(0x4a3018, 0.95));
      trunk.position.y = 0.75 * s; trunk.castShadow = true; g.add(trunk);
      const layers = [
        { color: 0x2a5e1e, r: 1.3, h: 1.8, y: 1.5 },
        { color: 0x1e4e14, r: 1.05, h: 1.6, y: 2.8 },
        { color: 0x346828, r: 0.78, h: 1.4, y: 3.9 },
        { color: 0x285218, r: 0.45, h: 1.0, y: 4.8 },
      ];
      layers.forEach(l => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r * s, l.h * s, 8),
          mkMat(l.color, 0.88));
        cone.position.y = l.y * s; cone.rotation.y = rand(0, Math.PI); cone.castShadow = true; g.add(cone);
      });
      g.position.set(x, tH(x, z), z);
      allTrees.push(g);
      scene.add(g);
    }

    // Dense river-valley forests
    [
      [-38, -50], [-32, -42], [-40, -30], [-26, -22], [-34, -10], [-38, 5], [-30, 18],
      [-22, -45], [-18, -35], [-24, -25], [-20, -12], [-28, 30], [-16, 10],
      [5, -48], [10, -38], [14, -30], [7, -18], [-6, -52], [-9, -44], [3, -60],
      [18, -42], [22, -32], [25, -22], [20, -12], [16, -50],
      [-42, -55], [-36, -8], [-26, 25], [-44, 15], [-48, -20],
    ].forEach(([x, z]) => {
      for (let i = 0; i < randInt(4, 9); i++)
        makeTree(x + rand(-4, 4), z + rand(-4, 4), rand(0.55, 1.2));
    });

    // Sparse steppe scrub
    for (let i = 0; i < 60; i++) {
      const x = rand(-100, 100), z = rand(-90, 70);
      const h = tH(x, z);
      if (h < 8 && h > -1) makeTree(x, z, rand(0.3, 0.6));
    }

    // === GER camps ===
    const allGers: { mesh: THREE.Group; baseX: number; baseZ: number }[] = [];

    function makeGer(x: number, z: number, rotY = 0, s = 1, isStation = false, stationId = "") {
      const g = new THREE.Group();

      // Platform
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.8 * s, 2.9 * s, 0.3 * s, 24), mkMat(0x9a8860, 0.95));
      base.position.y = 0.15; g.add(base);

      // Felt wall — canvas-textured
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
      const ctx = cv.getContext("2d")!;
      ctx.fillStyle = "#ede0c8"; ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = "#c4a878"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 36; i++) { ctx.beginPath(); ctx.moveTo(i * 7.5, 0); ctx.lineTo(i * 7.5, 128); ctx.stroke(); }
      ctx.strokeStyle = "#d4b888"; ctx.lineWidth = 1;
      for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.moveTo(0, j * 22); ctx.lineTo(256, j * 22); ctx.stroke(); }
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 1);

      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(2.7 * s, 2.7 * s, 2.2 * s, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: isStation ? 0xfff6ea : 0xede0c8, roughness: 0.65, map: tex })
      );
      wall.position.y = 1.1 * s + 0.3; g.add(wall);

      // Roof
      const roofColor = isStation
        ? (stationId === currentStationId ? 0x22cc66 : doneStationIds.includes(stationId) ? 0xffaa00 : 0xcc4422)
        : [0xc8724a, 0xb86838, 0xd47a50][randInt(0, 2)];
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8 * s, 1.6 * s, 24), mkMat(roofColor, 0.78));
      roof.position.y = (2.2 + 0.8) * s + 0.3; g.add(roof);

      // Toono (crown ring)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4 * s, 0.12 * s, 10, 28), mkMat(0xd89030, 0.45, 0.4));
      ring.position.y = (2.2 + 1.6) * s + 0.3; ring.rotation.x = Math.PI / 2; g.add(ring);

      // Rafters
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.8, 4), mkMat(0xc8a058, 0.9));
        rp.position.set(Math.sin(angle) * 1.5 * s, (2.2 + 0.8) * s + 0.3, Math.cos(angle) * 1.5 * s);
        rp.rotation.z = Math.sin(angle) * 0.55; rp.rotation.x = -Math.cos(angle) * 0.55; g.add(rp);
      }

      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.7 * s, 0.1 * s), mkMat(0x6a3a10, 0.8));
      door.position.set(0, 0.85 * s + 0.3, 2.72 * s); g.add(door);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05 * s, 1.85 * s, 0.06 * s), mkMat(0xd09030, 0.65, 0.15));
      frame.position.set(0, 0.92 * s + 0.3, 2.75 * s); g.add(frame);

      // Decorative bands
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.8;
        const pat = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.12 * s, 0.06 * s), mkMat(isStation ? 0xf0c020 : 0xe05030, 0.8));
        pat.position.set(Math.sin(angle) * 2.72 * s, 1.8 * s + 0.3, Math.cos(angle) * 2.72 * s);
        pat.rotation.y = -angle; g.add(pat);
      }

      if (isStation) {
        const mc = stationId === currentStationId ? 0x44ff88 : doneStationIds.includes(stationId) ? 0xffcc00 : 0xff6644;
        const markerMat = new THREE.MeshStandardMaterial({ color: mc, emissive: mc, emissiveIntensity: 0.7, roughness: 0.25 });
        const marker = new THREE.Mesh(new THREE.TorusGeometry(1.5 * s, 0.13 * s, 10, 40), markerMat);
        marker.position.y = (2.2 + 1.6 + 0.9) * s + 0.3; marker.rotation.x = Math.PI / 2; g.add(marker);
        markerMeshes.current.set(stationId, marker);

        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 10, 10),
          new THREE.MeshBasicMaterial({ color: mc, transparent: true, opacity: 0.14 }));
        glow.position.y = (2.2 + 1.6 + 0.9) * s + 0.3; g.add(glow);

        if (stationId === currentStationId) {
          const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7, 10),
            new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.3 }));
          beam.position.y = (2.2 + 1.6 + 4.5) * s + 0.3; g.add(beam);
        }
        labelAnchors.current.set(stationId, new THREE.Vector3(x, tH(x, z) + (2.2 + 1.6 + 0.9 + 2.2) * s + 0.3, z));
      }
      g.position.set(x, tH(x, z), z);
      g.rotation.y = rotY;
      g.castShadow = true; g.receiveShadow = true;
      allGers.push({ mesh: g, baseX: x, baseZ: z });
      scene.add(g);
    }

    function makeFence(cx: number, cz: number, w: number, d: number, rotY = 0) {
      const g = new THREE.Group(), fm = mkMat(0x9a7840, 0.95);
      const pts: [number, number][] = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]];
      for (let s = 0; s < 4; s++) {
        const [ax, az] = pts[s], [bx, bz] = pts[s + 1];
        const len = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2), mx = (ax + bx) / 2, mz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az);
        [0.7, 0.4].forEach(py => {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.07), fm);
          rail.position.set(mx, py, mz); rail.rotation.y = ry; g.add(rail);
        });
        const n = Math.max(2, Math.floor(len / 2.8));
        for (let i = 0; i <= n; i++) {
          const tt = i / n;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.1, 6), fm);
          post.position.set(ax + (bx - ax) * tt, 0.55, az + (bz - az) * tt);
          post.castShadow = true; g.add(post);
        }
      }
      g.position.set(cx, tH(cx, cz), cz); g.rotation.y = rotY; scene.add(g);
    }

    // === HORSES & RIDERS ===
    const allHorses: { group: THREE.Group; baseRot: number; speed: number; orbitR: number; orbitCx: number; orbitCz: number; phase: number }[] = [];

    function makeHorse(x: number, z: number, rotY = 0, color = 0x6b3a1f, animate = false,
      orbitCx = 0, orbitCz = 0, orbitR = 5, phase = 0) {
      const g = new THREE.Group(), hm = mkMat(color, 0.82), dk = mkMat(0x2a1508, 0.88);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.42), hm);
      body.position.y = 0.9; body.rotation.z = 0.04; g.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.58, 9), hm);
      neck.position.set(0.42, 1.15, 0); neck.rotation.z = -0.52; g.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.25), hm);
      head.position.set(0.68, 1.38, 0); g.add(head);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.2), hm);
      snout.position.set(0.9, 1.31, 0); g.add(snout);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mkMat(0x0a0a0a, 0.2));
      eye.position.set(0.79, 1.41, 0.11); g.add(eye);

      // Legs as groups so we can animate them
      const legGroups: THREE.Group[] = [];
      [[0.3, 0, -0.15], [0.3, 0, 0.15], [-0.3, 0, -0.15], [-0.3, 0, 0.15]].forEach(([lx, , lz]) => {
        const lg = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), hm);
        upper.position.y = -0.21; lg.add(upper);
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.38, 8), hm);
        lower.position.y = -0.6; lg.add(lower);
        const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.16), dk);
        hoof.position.y = -0.82; lg.add(hoof);
        lg.position.set(lx, 0.75, lz);
        g.add(lg); legGroups.push(lg);
      });
      (g as any)._legGroups = legGroups;

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.75, 8), dk);
      tail.position.set(-0.56, 0.95, 0); tail.rotation.z = 1.35; g.add(tail);
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.2), dk);
      mane.position.set(0.44, 1.25, 0); mane.rotation.z = -0.32; g.add(mane);

      g.position.set(x, tH(x, z), z);
      g.rotation.y = rotY;
      g.scale.setScalar(rand(0.85, 1.1));
      g.castShadow = true;
      scene.add(g);

      if (animate) {
        allHorses.push({ group: g, baseRot: rotY, speed: rand(0.4, 0.9), orbitR, orbitCx, orbitCz, phase });
      }
      return g;
    }

    function makeRider(parent: THREE.Group) {
      const coatColors = [0x8b2020, 0x1a4a8a, 0x2a6a2a, 0x6a4a1a, 0x6a1a6a];
      const coat = mkMat(coatColors[randInt(0, 4)], 0.85);
      const skin = mkMat(0xc89060, 0.9);
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.24), coat);
      torso.position.set(0, 1.58, 0); parent.add(torso);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 9, 9), skin);
      hd.position.set(0, 1.92, 0); parent.add(hd);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.14, 12), mkMat(0x1a1a1a, 0.9));
      hat.position.set(0, 2.05, 0); parent.add(hat);
      [[-0.22, 0.08], [0.22, 0.08]].forEach(([sx, sz]) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 6), coat);
        arm.position.set(sx * 1.5, 1.62, sz); arm.rotation.z = sx > 0 ? 0.85 : -0.85; arm.rotation.x = 0.35; parent.add(arm);
      });
    }

    function makeCamel(x: number, z: number, rotY = 0) {
      const g = new THREE.Group(), cm = mkMat(0xc8a060, 0.9), dk = mkMat(0x8a6030, 0.9);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 0.58), cm);
      body.position.y = 1.2; g.add(body);
      [[-0.28, 1.54], [0.28, 1.54]].forEach(([ox, oy]) => {
        const hump = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 9), cm);
        hump.position.set(ox, oy, 0); hump.scale.set(0.78, 1.05, 0.68); g.add(hump);
      });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.75, 9), cm);
      neck.position.set(0.7, 1.5, 0); neck.rotation.z = -0.42; g.add(neck);
      const chead = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.28), cm);
      chead.position.set(1.12, 1.72, 0); g.add(chead);
      [[0.45, 0, -0.22], [0.45, 0, 0.22], [-0.45, 0, -0.22], [-0.45, 0, 0.22]].forEach(([lx, , lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.1, 9), cm);
        leg.position.set(lx, 0.58, lz); g.add(leg);
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 9, 7), dk);
        foot.position.set(lx, 0.07, lz); foot.scale.set(1.25, 0.48, 1.45); g.add(foot);
      });
      g.position.set(x, tH(x, z), z); g.rotation.y = rotY;
      g.scale.setScalar(rand(0.88, 1.05)); g.castShadow = true; scene.add(g);
    }

    function makeOvoo(x: number, z: number) {
      const g = new THREE.Group();
      for (let i = 0; i < 12; i++) {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.28, 0.7), 0), mkMat(0x908878, 0.96));
        r.position.set(rand(-0.6, 0.6), rand(0, 1.0), rand(-0.6, 0.6));
        r.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        r.castShadow = true; g.add(r);
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.5, 8), mkMat(0x4a3010, 0.9));
      pole.position.y = 2.25; g.add(pole);
      [[0xcc1818, 0], [0x1818cc, 0.6], [0xf0c010, 1.1], [0x18aa18, 1.55]].forEach(([col, off]) => {
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.5), new THREE.MeshStandardMaterial({ color: col as number, side: THREE.DoubleSide, roughness: 0.88 }));
        flag.position.set(0.48, 4.2 - (off as number) * 0.48, 0); flag.rotation.y = 0.2; g.add(flag);
      });
      g.position.set(x, tH(x, z), z); scene.add(g);
    }

    // Mountain range far south
    [
      [0, -92, 24, 16], [-18, -88, 20, 14], [18, -90, 22, 15],
      [-36, -85, 18, 12], [36, -88, 20, 13], [-54, -80, 16, 11],
      [54, -82, 19, 13], [-70, -75, 14, 10], [70, -78, 16, 11],
      [-10, -98, 28, 18], [10, -96, 25, 17],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, randInt(5, 9)), mkMat(h > 16 ? 0xdde0ec : 0x9a9080, 0.94));
      m.position.set(x, tH(x, z) + h / 2 - 2.5, z); m.rotation.y = rand(0, Math.PI); m.castShadow = true; scene.add(m);
      // Snow cap
      const snow = new THREE.Mesh(new THREE.ConeGeometry(r * 0.28, h * 0.32, 8), mkMat(0xf8faff, 0.65));
      snow.position.set(x, tH(x, z) + h - h * 0.16, z); scene.add(snow);
    });

    // Smaller hills mid-field
    [
      [-55, -40, 9, 7], [-60, -20, 11, 8], [65, -30, 10, 7],
      [70, 10, 9, 6], [-65, 20, 8, 6], [75, 40, 10, 7],
    ].forEach(([x, z, h, r]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mkMat(0xa09878, 0.94));
      m.position.set(x, tH(x, z) + h / 2 - 1.5, z); m.rotation.y = rand(0, Math.PI); m.castShadow = true; scene.add(m);
    });

    // === CLOUDS — animated ===
    interface Cloud { g: THREE.Group; speed: number; alt: number }
    const clouds: Cloud[] = [];
    for (let i = 0; i < 20; i++) {
      const cg = new THREE.Group();
      const puffs = randInt(4, 8);
      for (let p = 0; p < puffs; p++) {
        const cs = rand(2.5, 5.5);
        const cm = new THREE.Mesh(new THREE.SphereGeometry(rand(0.9, 1.4) * cs, 9, 7),
          new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 1, transparent: true, opacity: rand(0.82, 0.94) }));
        cm.position.set(rand(-4, 4) * cs * 0.4, rand(-0.5, 1) * cs * 0.25, rand(-1.5, 1.5) * cs * 0.2);
        cg.add(cm);
      }
      cg.position.set(rand(-120, 120), rand(38, 65), rand(-90, 60));
      scene.add(cg);
      clouds.push({ g: cg, speed: rand(0.012, 0.032) * (Math.random() > 0.5 ? 1 : -0.6), alt: cg.position.y });
    }

    // === BIRDS — animated specks ===
    interface Bird { pivot: THREE.Group; arm: THREE.Group; speed: number; radius: number; yOff: number; phase: number; wingMesh: THREE.Mesh; alt: number }
    const birds: Bird[] = [];
    for (let i = 0; i < 18; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(rand(-60, 60), rand(22, 55), rand(-60, 50));
      const arm = new THREE.Group();
      arm.position.x = rand(8, 22);
      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), mkMat(0x222222, 0.8));
      arm.add(body);
      // Wings
      const wGeo = new THREE.BufferGeometry();
      const wVerts = new Float32Array([-0.8, 0, 0, 0, 0.2, 0, 0.8, 0, 0]);
      wGeo.setAttribute("position", new THREE.BufferAttribute(wVerts, 3));
      const wingMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide }));
      arm.add(wingMesh);
      pivot.add(arm);
      scene.add(pivot);
      birds.push({ pivot, arm, speed: rand(0.3, 0.7), radius: rand(8, 22), yOff: rand(-3, 3), phase: rand(0, Math.PI * 2), wingMesh, alt: pivot.position.y });
    }

    // === GRASS TUFTS — scattered patches ===
    for (let i = 0; i < 200; i++) {
      const x = rand(-90, 90), z = rand(-80, 65);
      const h = tH(x, z);
      if (h > 9 || h < -0.5) continue;
      const g = new THREE.Group();
      for (let b = 0; b < randInt(3, 7); b++) {
        const bx = rand(-0.3, 0.3), bz = rand(-0.3, 0.3);
        const blade = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.04, rand(0.25, 0.6), 4),
          mkMat([0x6a8838, 0x5a7828, 0x789848, 0x8aaa50][randInt(0, 3)], 0.9)
        );
        blade.position.set(bx, rand(0.12, 0.35), bz);
        blade.rotation.z = rand(-0.3, 0.3); blade.rotation.x = rand(-0.2, 0.2);
        g.add(blade);
      }
      g.position.set(x, h, z); scene.add(g);
    }

    // === ROCKS ===
    for (let i = 0; i < 80; i++) {
      const x = rand(-100, 100), z = rand(-90, 70);
      const rg = new THREE.Group();
      for (let j = 0; j < randInt(1, 5); j++) {
        const rm = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.2, 0.85) * rand(0.5, 1.8), 0),
          mkMat(0x888070, 0.96));
        rm.position.set(rand(-0.5, 0.5), rand(0.1, 0.4), rand(-0.5, 0.5));
        rm.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI));
        rm.castShadow = true; rg.add(rm);
      }
      rg.position.set(x, tH(x, z), z); scene.add(rg);
    }

    // === POPULATE SCENE ===
    // Ger camps
    [
      { gx: -5, gz: 5, n: 5, sp: 9 }, { gx: -18, gz: -18, n: 6, sp: 11 },
      { gx: -12, gz: 8, n: 4, sp: 8 }, { gx: 25, gz: -10, n: 5, sp: 10 },
      { gx: 35, gz: 8, n: 4, sp: 9 }, { gx: 20, gz: 18, n: 3, sp: 7 },
      { gx: -22, gz: 22, n: 4, sp: 9 }, { gx: 8, gz: 25, n: 5, sp: 10 },
      { gx: -8, gz: -32, n: 3, sp: 7 }, { gx: 18, gz: -28, n: 4, sp: 9 },
      { gx: 42, gz: -15, n: 3, sp: 8 }, { gx: -42, gz: 5, n: 3, sp: 7 },
      { gx: 50, gz: 25, n: 4, sp: 9 }, { gx: -50, gz: -15, n: 3, sp: 8 },
    ].forEach(({ gx, gz, n, sp }) => {
      for (let i = 0; i < n; i++) {
        const x = gx + rand(-sp / 2, sp / 2), z = gz + rand(-sp / 2, sp / 2);
        const riverX = -30 + Math.sin(z * 0.1) * 9;
        if (Math.abs(x - riverX) < 5) continue;
        makeGer(x, z, rand(0, Math.PI * 2), rand(0.8, 1.15));
        if (Math.random() > 0.35) makeFence(x, z, rand(7, 11), rand(6, 9), rand(0, Math.PI * 0.5));
      }
    });

    // Station gers
    stations.forEach(s => {
      const cfg = STATION_CONFIGS[s.id]; if (!cfg) return;
      makeGer(cfg.wx, cfg.wz, rand(0, Math.PI * 2), 1.5, true, s.id);
      makeFence(cfg.wx, cfg.wz, 12, 10, rand(0, Math.PI * 0.3));
      makeOvoo(cfg.wx + 3.5, cfg.wz + 2.5);
    });

    // Horses grazing / circling
    const horseColors = [0x6b3a1f, 0x3a2010, 0xc8a060, 0x8a6030, 0x1a1008, 0xd4b890, 0xa06040];
    [
      { x: 8, z: -3, r: 1.5 }, { x: -6, z: 9, r: 2.2 }, { x: 20, z: 4, r: 0.8 },
      { x: -14, z: 1, r: 3.8 }, { x: 6, z: 17, r: 0.5 }, { x: 28, z: -6, r: 2.1 },
      { x: -22, z: 11, r: 1.2 }, { x: 14, z: -20, r: 0.4 }, { x: -10, z: -22, r: 2.8 },
      { x: 32, z: 18, r: 1.9 }, { x: 4, z: 30, r: 3.3 }, { x: -24, z: -6, r: 0.7 },
      { x: 22, z: 28, r: 2.6 }, { x: -4, z: -14, r: 1.1 }, { x: 17, z: 10, r: 3.9 },
      { x: 40, z: -5, r: 1.6 }, { x: -38, z: 12, r: 2.0 }, { x: 45, z: 15, r: 0.9 },
    ].forEach(({ x, z, r }) => {
      const color = horseColors[randInt(0, horseColors.length - 1)];
      // Orbiting horses
      const orbitR = rand(4, 10), phase = rand(0, Math.PI * 2);
      const hg = makeHorse(x + Math.cos(phase) * orbitR, z + Math.sin(phase) * orbitR, r, color, true, x, z, orbitR, phase);
      if (Math.random() > 0.35) makeRider(hg);
    });

    // Stationary grazing horses
    for (let i = 0; i < 30; i++) {
      const x = rand(-90, 90), z = rand(-70, 60);
      const h = tH(x, z);
      if (h > 8 || h < 0) continue;
      makeHorse(x, z, rand(0, Math.PI * 2), horseColors[randInt(0, horseColors.length - 1)], false);
    }

    // Camel herds (Gobi area)
    [
      { x: 30, z: 10 }, { x: 34, z: 7 }, { x: 32, z: 14 }, { x: 38, z: 12 },
      { x: 35, z: -1 }, { x: 40, z: 20 }, { x: 27, z: 22 }, { x: 42, z: 5 },
      { x: 37, z: 17 }, { x: 24, z: 27 }, { x: 44, z: -6 }, { x: 47, z: 4 },
    ].forEach(({ x, z }) => makeCamel(x + rand(-2, 2), z + rand(-2, 2), rand(0, Math.PI * 2)));

    // === CAMERA CONTROLS ===
    let isDrag = false, isRight = false, prev = { x: 0, y: 0 };
    let theta = 0.18, phi = 0.35, radius = 90, tTheta = 0.18, tPhi = 0.35, tRadius = 90;
    let panX = 0, panZ = 0, tPanX = 0, tPanZ = 0;

    const onDown = (e: MouseEvent) => { isDrag = true; isRight = e.button === 2; prev = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDrag) return;
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (isRight) { tPanX -= dx * 0.06; tPanZ -= dy * 0.06; }
      else { tTheta -= dx * 0.004; tPhi = Math.max(0.1, Math.min(1.25, tPhi - dy * 0.004)); }
      prev = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDrag = false; };
    const onWheel = (e: WheelEvent) => { tRadius = Math.max(12, Math.min(160, tRadius + e.deltaY * 0.09)); };
    const onCtx = (e: MouseEvent) => e.preventDefault();
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("contextmenu", onCtx);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onResize);

    // Touch support
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { isDrag = true; isRight = false; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
      if (e.touches.length === 2) { lastPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDrag) {
        const dx = e.touches[0].clientX - prev.x, dy = e.touches[0].clientY - prev.y;
        tTheta -= dx * 0.004; tPhi = Math.max(0.1, Math.min(1.25, tPhi - dy * 0.004));
        prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        tRadius = Math.max(12, Math.min(160, tRadius - (dist - lastPinchDist) * 0.2));
        lastPinchDist = dist;
      }
    };
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", () => { isDrag = false; });

    // === ANIMATION LOOP ===
    let animId: number;
    const clock = new THREE.Clock();
    const _v3 = new THREE.Vector3();

    function project(wp: THREE.Vector3, cam: THREE.PerspectiveCamera, w: number, h: number) {
      _v3.copy(wp).project(cam);
      return { x: (_v3.x * 0.5 + 0.5) * w, y: (1 - (_v3.y * 0.5 + 0.5)) * h, visible: _v3.z < 1 };
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth camera
      theta  += (tTheta  - theta)  * 0.055;
      phi    += (tPhi    - phi)    * 0.055;
      radius += (tRadius - radius) * 0.055;
      panX   += (tPanX   - panX)   * 0.055;
      panZ   += (tPanZ   - panZ)   * 0.055;
      camera.position.set(
        Math.sin(theta) * Math.cos(phi) * radius + panX,
        Math.sin(phi) * radius,
        Math.cos(theta) * Math.cos(phi) * radius + panZ
      );
      camera.lookAt(panX, 2, panZ);

      // Marker pulse
      markerMeshes.current.forEach((marker, id) => {
        if (id === currentStationId) {
          marker.scale.setScalar(1 + Math.sin(t * 3.5) * 0.14);
          (marker.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.65 + Math.sin(t * 3.5) * 0.3;
        }
      });

      // Animate orbiting horses
      allHorses.forEach(h => {
        const angle = h.phase + t * h.speed;
        const nx = h.orbitCx + Math.cos(angle) * h.orbitR;
        const nz = h.orbitCz + Math.sin(angle) * h.orbitR;
        h.group.position.set(nx, tH(nx, nz), nz);
        h.group.rotation.y = angle + Math.PI / 2;

        // Leg animation — gallop cycle
        const legs = (h.group as any)._legGroups as THREE.Group[];
        if (legs) {
          const gait = t * h.speed * 8;
          legs[0].rotation.x =  Math.sin(gait) * 0.45;
          legs[1].rotation.x = -Math.sin(gait) * 0.45;
          legs[2].rotation.x = -Math.sin(gait) * 0.45;
          legs[3].rotation.x =  Math.sin(gait) * 0.45;
          // Slight body bob
          h.group.position.y = tH(nx, nz) + Math.abs(Math.sin(gait)) * 0.08;
        }
      });

      // Animate birds
      birds.forEach((bird, i) => {
        const angle = t * bird.speed + (i / birds.length) * Math.PI * 2;
        bird.arm.position.x = bird.radius;
        bird.pivot.rotation.y = angle;
        bird.pivot.position.y = bird.alt + Math.sin(t * 0.4 + bird.phase) * 2;
        // Wing flap
        bird.wingMesh.rotation.z = Math.sin(t * 6 + bird.phase) * 0.55;
      });

      // Animate clouds — drift east
      clouds.forEach(cloud => {
        cloud.g.position.x += cloud.speed;
        cloud.g.position.y = cloud.alt + Math.sin(t * 0.15 + cloud.g.position.x * 0.02) * 1.2;
        if (cloud.g.position.x > 130) cloud.g.position.x = -130;
        if (cloud.g.position.x < -130) cloud.g.position.x = 130;
      });

      // Gentle sun arc
      sun.position.x = 60 * Math.cos(t * 0.025);
      sun.position.z = 30 * Math.sin(t * 0.025);
      const sunAngle = (Math.sin(t * 0.025) + 1) * 0.5;
      sun.color.setHSL(0.09 - sunAngle * 0.04, 0.95, 0.85 - sunAngle * 0.08);

      // Animate ovoo flags (gentle wave)
      scene.traverse(obj => {
        if (obj.userData.isFlag) {
          obj.rotation.y = Math.sin(t * 2.5 + (obj.userData.flagPhase ?? 0)) * 0.25;
        }
      });

      // Update label positions
      const cw = container.clientWidth, ch = container.clientHeight;
      const np: Record<string, LabelPos> = {};
      labelAnchors.current.forEach((wp, id) => { np[id] = project(wp, camera, cw, ch); });
      setLabelPositions(np);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      renderer.domElement.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [currentStationId, doneStationIds.join(",")]);

  return (
    <main className="flex-1 relative overflow-hidden bg-background">
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Station labels */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {stations.map(station => {
          const lp = labelPositions[station.id];
          if (!lp?.visible) return null;
          const stationName = t.stations.find(s => s.id === station.id)?.name ?? station.id;
          const isCurrent = station.id === currentStationId;
          const isDone    = doneStationIds.includes(station.id);
          return (
            <div
              key={station.id}
              className="absolute pointer-events-auto cursor-pointer select-none"
              style={{ left: lp.x, top: lp.y, transform: "translate(-50%, -100%)" }}
              onClick={() => setSelectedId(station.id === selectedId ? null : station.id)}
            >
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "relative px-3 py-1.5 rounded-full text-xs font-bold tracking-wide",
                    "border shadow-lg backdrop-blur-sm transition-all duration-200",
                    isCurrent
                      ? "bg-emerald-900/88 border-emerald-400 text-emerald-200 shadow-emerald-500/50 shadow-xl scale-110"
                      : isDone
                      ? "bg-amber-900/82 border-amber-400 text-amber-200 shadow-amber-500/35"
                      : "bg-gray-900/78 border-gray-500/60 text-gray-300",
                  ].join(" ")}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full">
                      <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    </span>
                  )}
                  <span className="mr-1">{STATION_CONFIGS[station.id]?.icon}</span>
                  {stationName}
                  {isDone && !isCurrent && <span className="ml-1 text-amber-400">✓</span>}
                </div>
                <div className={[
                  "w-0 h-0",
                  "border-l-[5px] border-r-[5px] border-t-[7px]",
                  "border-l-transparent border-r-transparent",
                  isCurrent ? "border-t-emerald-400" : isDone ? "border-t-amber-400" : "border-t-gray-500",
                ].join(" ")} />
              </div>
            </div>
          );
        })}
      </div>

      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedId(null)}
          onPlay={id => console.log("Play:", id)}
          loreLabel={t.lore}
          minigameLabel={t.minigame}
        />
      )}

      {/* HUD */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
        <div className="backdrop-blur-md bg-black/42 p-3 rounded-lg border border-white/12 shadow-lg">
          <div className="text-xs text-white/72 uppercase tracking-wider flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Х: 47.9°N
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />У: 106.9°E
            </span>
          </div>
          <div className="text-sm font-medium mt-1 text-white/92">
            {t.currentLocation}: {t.stations.find(s => s.id === currentStationId)?.name}
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
        <div className="backdrop-blur-md bg-black/35 px-3 py-2 rounded-lg border border-white/10 shadow text-xs text-white/55 space-y-0.5">
          <div>🖱 Drag — эргүүлэх</div>
          <div>⚙ Right drag — шилжүүлэх</div>
          <div>🔍 Scroll — томруулах</div>
        </div>
      </div>
    </main>
  );
}