import * as THREE from "three";

export const rand = (a: number, b: number): number =>
  a + Math.random() * (b - a);

export const randInt = (a: number, b: number): number =>
  Math.floor(rand(a, b + 1));

/**
 * Стандарт PBR — гэр, чулуу, ургамалд ижил гэрэл тусгалтай харагдуулна.
 */
export const mkMat = (
  color: number,
  rough = 0.85,
  metal = 0,
): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
    envMapIntensity: 0.55,
  });

/** Мал, ноос — бага металл, зөөлөн тусгал */
export function mkFurMat(
  color: number,
  rough = 0.78,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.04,
    envMapIntensity: 0.42,
  });
}

export type TerrainBiome =
  | "high_alpine"
  | "mountain"
  | "forest"
  | "river_plain"
  | "steppe"
  | "gobi";

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function pseudoNoise2D(x: number, z: number): number {
  return (
    Math.sin(x * 0.19 + z * 0.13) * 0.5 +
    Math.sin(x * 0.037 + z * 0.061 + 1.7) * 0.35 +
    Math.sin(x * 0.011 - z * 0.023 + 4.2) * 0.15
  );
}

export function terrainHeight(x: number, z: number): number {
  let h = 0;
  h += Math.sin(x * 0.012 + 0.3) * Math.cos(z * 0.015 + 0.8) * 2.5;
  h += Math.sin(x * 0.028 + 1.1) * Math.cos(z * 0.024 + 0.4) * 1.2;
  h += Math.sin(x * 0.055 + 2.0) * Math.cos(z * 0.048 + 1.5) * 0.5;

  const hangaiDist = Math.sqrt(((x + 45) / 28) ** 2 + ((z + 18) / 12) ** 2);
  if (hangaiDist < 1) {
    h += (1 - hangaiDist) * 24;
  } else if (hangaiDist < 2.2) {
    h += Math.max(0, (2.2 - hangaiDist) / 1.2) * 11;
  }

  const altaiDist = Math.sqrt(((x + 90) / 20) ** 2 + ((z - 5) / 18) ** 2);
  if (altaiDist < 1) {
    h += (1 - altaiDist) * 30;
  } else if (altaiDist < 2.0) {
    h += Math.max(0, (2.0 - altaiDist) / 1.0) * 13;
  }

  const khentiiDist = Math.sqrt(((x - 35) / 22) ** 2 + ((z + 16) / 10) ** 2);
  if (khentiiDist < 1) {
    h += (1 - khentiiDist) * 16;
  } else if (khentiiDist < 2.0) {
    h += Math.max(0, (2.0 - khentiiDist) / 1.0) * 7;
  }

  const gobiAltaiDist = Math.sqrt(((x + 72) / 18) ** 2 + ((z - 20) / 10) ** 2);
  if (gobiAltaiDist < 1) {
    h += (1 - gobiAltaiDist) * 19;
  } else if (gobiAltaiDist < 1.8) {
    h += Math.max(0, (1.8 - gobiAltaiDist) / 0.8) * 8;
  }

  if (z > 20) {
    const flatFactor = Math.min((z - 20) / 15, 1.0);
    h = h * (1 - flatFactor * 0.88) + flatFactor * 0.5;
  }

  if (x > 30) {
    const eastFlat = Math.min((x - 30) / 30, 1.0);
    h = h * (1 - eastFlat * 0.9);
  }

  const uvsDist = Math.sqrt(((x + 98) / 12) ** 2 + ((z + 38) / 8) ** 2);
  if (uvsDist < 1) h -= (1 - uvsDist) * 2.5;

  const hovsgolDist = Math.sqrt(((x + 63) / 8) ** 2 + ((z + 44) / 14) ** 2);
  if (hovsgolDist < 1) h -= (1 - hovsgolDist) * 3.0;

  const orkhonX = -32 + Math.sin(z * 0.08) * 6;
  const orkhonDist = Math.abs(x - orkhonX);
  if (orkhonDist < 8) h -= (1 - orkhonDist / 8) * 1.5;

  const tuulX = 2 + Math.sin(z * 0.1) * 4;
  if (Math.abs(x - tuulX) < 6 && z > -10 && z < 14) {
    h -= (1 - Math.abs(x - tuulX) / 6) * 1.2;
  }

  /** Гол талын хөндий — төв хэсэг илүү тэгш, алсын уул/оволго хадгалагдана */
  const coreEll = Math.hypot(x / 400, z / 310);
  if (coreEll < 1.2) {
    const edgeBlend = smoothstep(0.28, 1.05, coreEll);
    h *= 0.36 + 0.64 * edgeBlend;
  }

  return h;
}

export function terrainBiome(
  x: number,
  z: number,
  h = terrainHeight(x, z),
): TerrainBiome {
  const gobiFactor = smoothstep(20, 34, z);
  const orkhonX = -32 + Math.sin(z * 0.08) * 6;
  const tuulX = 2 + Math.sin(z * 0.1) * 4;
  const nearRiver =
    (Math.abs(x - orkhonX) < 8 && z > -32 && z < 24) ||
    (Math.abs(x - tuulX) < 6 && z > -12 && z < 16);

  const forestBand =
    ((x > -74 && x < -18 && z > -34 && z < -4) ||
      (x > 12 && x < 54 && z > -30 && z < -4) ||
      (x + 63) ** 2 / 450 + (z + 44) ** 2 / 850 < 1.0) &&
    h > 0.5 &&
    h < 15;

  if (h > 22) return "high_alpine";
  if (h > 12) return "mountain";
  if (nearRiver && h < 4) return "river_plain";
  if (forestBand) return "forest";
  if (gobiFactor > 0.62) return "gobi";
  return "steppe";
}

export function projectToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  _tmp: THREE.Vector3,
): { x: number; y: number; visible: boolean } {
  _tmp.copy(worldPos).project(camera);
  return {
    x: (_tmp.x * 0.5 + 0.5) * width,
    y: (1 - (_tmp.y * 0.5 + 0.5)) * height,
    visible: _tmp.z < 1,
  };
}
