

import * as THREE from "three";

export const rand = (a: number, b: number): number =>
  a + Math.random() * (b - a);

export const randInt = (a: number, b: number): number =>
  Math.floor(rand(a, b + 1));

export const mkMat = (
  color: number,
  rough = 0.85,
  metal = 0
): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export function terrainHeight(x: number, z: number): number {
  // ── Үндсэн суурь: намуун, маш бага долгион ───────────────
  // Монголын тал нутгийн олон зуун км-ийн аажим хэлбэлзэл
  let h = 0;
  h += Math.sin(x * 0.012 + 0.3) * Math.cos(z * 0.015 + 0.8) * 2.5;
  h += Math.sin(x * 0.028 + 1.1) * Math.cos(z * 0.024 + 0.4) * 1.2;
  h += Math.sin(x * 0.055 + 2.0) * Math.cos(z * 0.048 + 1.5) * 0.5;

  // ── Хангайн нуруу ─────────────────────────────────────────
  // Байршил: wx -65..-25, wz -28..-8
  // Хамгийн өндөр цэг: wx≈-45, wz≈-18
  const hangaiDist = Math.sqrt(((x + 45) / 28) ** 2 + ((z + 18) / 12) ** 2);
  if (hangaiDist < 1) {
    h += (1 - hangaiDist) * 18;
  } else if (hangaiDist < 2.2) {
    h += Math.max(0, (2.2 - hangaiDist) / 1.2) * 8;
  }

  // ── Монгол Алтайн нуруу ───────────────────────────────────
  // Байршил: wx -105..-75, wz -10..+20
  // Хамгийн өндөр: wx≈-90, wz≈+5
  const altaiDist = Math.sqrt(((x + 90) / 20) ** 2 + ((z - 5) / 18) ** 2);
  if (altaiDist < 1) {
    h += (1 - altaiDist) * 22;
  } else if (altaiDist < 2.0) {
    h += Math.max(0, (2.0 - altaiDist) / 1.0) * 10;
  }

  // ── Хэнтийн нуруу ────────────────────────────────────────
  // Байршил: wx +15..+55, wz -25..-8
  const khentiiDist = Math.sqrt(((x - 35) / 22) ** 2 + ((z + 16) / 10) ** 2);
  if (khentiiDist < 1) {
    h += (1 - khentiiDist) * 12;
  } else if (khentiiDist < 2.0) {
    h += Math.max(0, (2.0 - khentiiDist) / 1.0) * 5;
  }

  // ── Говийн Алтай ─────────────────────────────────────────
  // Байршил: wx -85..-60, wz +12..+30
  const gobiAltaiDist = Math.sqrt(((x + 72) / 18) ** 2 + ((z - 20) / 10) ** 2);
  if (gobiAltaiDist < 1) {
    h += (1 - gobiAltaiDist) * 14;
  } else if (gobiAltaiDist < 1.8) {
    h += Math.max(0, (1.8 - gobiAltaiDist) / 0.8) * 6;
  }

  // ── Говийн тал — өмнөд хэсэг ХАВТГАЙ ────────────────────
  // wz > +20 бүсэд өндрийг хурдан дарна
  if (z > 20) {
    const flatFactor = Math.min((z - 20) / 15, 1.0);
    h = h * (1 - flatFactor * 0.88) + flatFactor * 0.5;
  }

  // ── Зүүн монголын тал — МАШ хавтгай ─────────────────────
  // wx > +30 бүсэд
  if (x > 30) {
    const eastFlat = Math.min((x - 30) / 30, 1.0);
    h = h * (1 - eastFlat * 0.90);
  }

  // ── Увсын хотгор ─────────────────────────────────────────
  // wx≈-98, wz≈-38 орчим бага хонхор
  const uvsDist = Math.sqrt(((x + 98) / 12) ** 2 + ((z + 38) / 8) ** 2);
  if (uvsDist < 1) h -= (1 - uvsDist) * 2.5;

  // ── Хөвсгөлийн хонхор ────────────────────────────────────
  // wx≈-63, wz≈-44
  const hovsgolDist = Math.sqrt(((x + 63) / 8) ** 2 + ((z + 44) / 14) ** 2);
  if (hovsgolDist < 1) h -= (1 - hovsgolDist) * 3.0;

  // ── Орхон голын хөндий ────────────────────────────────────
  const orkhonX = -32 + Math.sin(z * 0.08) * 6;
  const orkhonDist = Math.abs(x - orkhonX);
  if (orkhonDist < 8) h -= (1 - orkhonDist / 8) * 1.5;

  // ── Туул голын хөндий ─────────────────────────────────────
  const tuulX = 2 + Math.sin(z * 0.10) * 4;
  if (Math.abs(x - tuulX) < 6 && z > -10 && z < 14) {
    h -= (1 - Math.abs(x - tuulX) / 6) * 1.2;
  }

  return h;
}

export function projectToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  _tmp: THREE.Vector3
): { x: number; y: number; visible: boolean } {
  _tmp.copy(worldPos).project(camera);
  return {
    x: (_tmp.x * 0.5 + 0.5) * width,
    y: (1 - (_tmp.y * 0.5 + 0.5)) * height,
    visible: _tmp.z < 1,
  };
}