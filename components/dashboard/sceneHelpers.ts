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

  // Алс баруун хойд зэрэгт синусын нийлбэр сөрөг гарч болно; тоглогчийн гэр
  // болон 3D объект бүгд ижил `terrainHeight`-ийг ашигладаг тул доод тал нэмэх нь
  // зөвхөн "далайн түвшнээс доош" хавтгай тогтворгүй байдлыг арилгана.
  return Math.max(h, 0.12);
}

/**
 * Бариул/огнооны эргэн тойронд `terrainHeight`-ийг max — налуу/овлог дээр хөл газар
 * шигдэхоос. `ry` = эргэлт (Y), `atan2`‑тай ижил конвенц (x,z) тэнхлэг.
 */
export function terrainHeightFeet(
  x: number,
  z: number,
  ry: number,
  r = 0.38
): number {
  const f = (dx: number, dz: number) => terrainHeight(x + dx, z + dz);
  let m = f(0, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    m = Math.max(m, f(Math.cos(a) * r, Math.sin(a) * r));
  }
  const fwx = Math.sin(ry);
  const fwz = Math.cos(ry);
  const rtx = -fwz;
  const rtz = fwx;
  m = Math.max(
    m,
    f(fwx * r, fwz * r),
    f(-fwx * r, -fwz * r),
    f(rtx * r, rtz * r),
    f(-rtx * r, -rtz * r)
  );
  m = Math.max(
    m,
    f(fwx * r * 0.6 + rtx * r * 0.45, fwz * r * 0.6 + rtz * r * 0.45),
    f(fwx * r * 0.6 - rtx * r * 0.45, fwz * r * 0.6 - rtz * r * 0.45)
  );
  return m;
}

/**
 * `SceneBuilder.buildPlayerHomeGer` — `makeFence` овлын `yardW` / `yardD`‑тай **ижил** нэгдэл.
 * Гэр+хашлаас дугуй биш, тэгш өнцгийн ов: эллипсээр **ойролцоолно**.
 */
export function getPlayerHomeYardHalfAxes(gerLevel: number): {
  halfW: number;
  halfD: number;
} {
  const lv = Math.max(1, Math.min(30, Math.floor(gerLevel)));
  const extraGers = Math.min(6, Math.max(0, Math.floor((lv - 3) / 2)));
  let ringSpan = 12.5;
  if (extraGers > 0) {
    const ringR = 13.2 + Math.min(lv * 0.45, 10);
    ringSpan = ringR + 7;
  }
  const yardW = Math.max(30, ringSpan * 2.15 + Math.min(lv, 8) * 0.85);
  const yardD = yardW * 0.86;
  return { halfW: yardW * 0.5, halfD: yardD * 0.5 };
}

/**
 * 3D collisionгүйгээр нэвтэрнэ — гэрийн **овол** дээр (эллипс) хаалтын гадуур түлхэнэ.
 * Буцах: шинэ x,z + `pushed` (дохио) — илүндээ хөдлөгчийн v бууруулж болно.
 */
export function pushOutOfPlayerHomeOval(
  x: number,
  z: number,
  homeX: number,
  homeZ: number,
  gerLevel: number,
): { x: number; z: number; pushed: boolean } {
  const { halfW, halfD } = getPlayerHomeYardHalfAxes(gerLevel);
  const pad = 0.95;
  const a = halfW + pad;
  const b = halfD + pad;
  const dx = x - homeX;
  const dz = z - homeZ;
  const t = (dx * dx) / (a * a) + (dz * dz) / (b * b);
  if (t <= 1) {
    if (t < 1e-10) {
      return { x: homeX + a * 1.01, z: homeZ, pushed: true };
    }
    const s = 1.01 / Math.sqrt(t);
    return { x: homeX + dx * s, z: homeZ + dz * s, pushed: true };
  }
  return { x, z, pushed: false };
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
