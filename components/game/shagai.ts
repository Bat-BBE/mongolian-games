import * as THREE from "three";

export type ShagaiSide = "horse" | "sheep" | "goat" | "camel";
type FaceName = "-y" | "+y" | "+x" | "-x" | "+z" | "-z";

export interface ShagaiResult {
  side: ShagaiSide;
  name: string;
  symbol: string;
  mongolian: string;
  value: number;
  color: string;
  glow: string;
  description: string;
  luck: string;
  proverb: string;
}

export const SHAgAI_SIDES: Record<ShagaiSide, ShagaiResult> = {
  horse: {
    side: "horse",
    name: "Морь",
    symbol: "🐴",
    mongolian: "ᠮᠣᠷᠢ",
    value: 4,
    color: "#f0c040",
    glow: "rgba(240,192,64,0.5)",
    description:
      "Морь — эрч хүч, хурд, сүлд хийморийн бэлгэдэл. Хамгийн өндөр оноо.",
    luck: "Зорилгодоо хурдан хүрнэ. Аз таарч байна!",
    proverb: "Морин дээр гарсан хүн газар харахгүй.",
  },
  sheep: {
    side: "sheep",
    name: "Хонь",
    symbol: "🐑",
    mongolian: "ᠬᠣᠨᠢ",
    value: 3,
    color: "#90d890",
    glow: "rgba(144,216,144,0.5)",
    description:
      "Хонь — элбэг дэлбэг байдал, нөхөрсөг зан, гэр бүлийн бэлгэдэл.",
    luck: "Гэр бүлд аз жаргал орж ирнэ.",
    proverb: "Хонь олонтой хүн баян.",
  },
  goat: {
    side: "goat",
    name: "Ямаа",
    symbol: "🐐",
    mongolian: "ᠢᠮᠠᠭ᠎ᠠ",
    value: 2,
    color: "#c8956a",
    glow: "rgba(200,149,106,0.5)",
    description:
      "Ямаа — тэсвэр тэвчээр, авхаалж самбаа, бие даасан байдлын бэлгэдэл.",
    luck: "Саад бэрхшээлийг даван туулна.",
    proverb: "Ямаа өндөр хад авирдаг.",
  },
  camel: {
    side: "camel",
    name: "Тэмээ",
    symbol: "🐫",
    mongolian: "ᠲᠡᠮᠡᠭᠡ",
    value: 1,
    color: "#e0a050",
    glow: "rgba(224,160,80,0.5)",
    description:
      "Тэмээ — тэвчээр, дасан зохицох чадвар, говийн их тэвчээрийн бэлгэдэл.",
    luck: "Тэвчээртэй байгаарай — амжилт ирнэ.",
    proverb: "Тэмээ цөлийг давдаг, хүн бэрхийг давдаг.",
  },
};

export interface ShagaiDetectOptions {
  remapOnkh?: boolean;
  /**
   * Оньс дээр санамсаргүй хонь/ямаа — хуучин.
   * false (анхдагч) = +z / -z талын аль нь дээшилснийг геометрээр ялгана.
   */
  randomOnkh?: boolean;
}

export type ShagaiDetection = ShagaiSide;

export function weightedTraditionalSide(): ShagaiSide {
  const r = Math.random();
  if (r < 0.38) return "sheep"; // 38%
  if (r < 0.76) return "goat"; // 38%
  if (r < 0.91) return "horse"; // 15%
  return "camel"; // 9%
}

export function biasSideForThrow(): ShagaiSide {
  const r = Math.random();
  if (r < 0.3) return "sheep";
  if (r < 0.6) return "goat";
  if (r < 0.8) return "horse";
  return "camel";
}

/** Нисэх үеийн torque — biasSideForThrow-той ижил (морь/тэмээ гарна). */
export function biasSideForAirTorque(): ShagaiSide {
  return biasSideForThrow();
}

export const SHAGAI_SIDE_UP_AXIS: Record<ShagaiSide, THREE.Vector3> = {
  sheep: new THREE.Vector3(0, 0, 1),
  goat: new THREE.Vector3(0, 0, -1),
  horse: new THREE.Vector3(0, -1, 0),
  camel: new THREE.Vector3(0, 1, 0),
};

export const SHAGAI_PHYS_BOX: [number, number, number] = [0.74, 0.58, 0.72];

const FACE_VECTORS: Record<FaceName, THREE.Vector3> = {
  "+x": new THREE.Vector3(1, 0, 0),
  "-x": new THREE.Vector3(-1, 0, 0),
  "+y": new THREE.Vector3(0, 1, 0),
  "-y": new THREE.Vector3(0, -1, 0),
  "+z": new THREE.Vector3(0, 0, 1),
  "-z": new THREE.Vector3(0, 0, -1),
};

const FACE_TO_SIDE: Record<"+y" | "-y", ShagaiSide> = {
  "-y": "horse",
  "+y": "camel",
};

export function buildTargetQuaternion(side: ShagaiSide): THREE.Quaternion {
  const localUp = SHAGAI_SIDE_UP_AXIS[side].clone();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const align = new THREE.Quaternion().setFromUnitVectors(localUp, worldUp);
  const yaw = new THREE.Quaternion().setFromAxisAngle(
    worldUp,
    Math.random() * Math.PI * 2,
  );
  return yaw.multiply(align);
}

function detectBestFace(quat: THREE.Quaternion): {
  face: FaceName;
  dot: number;
} {
  const worldUp = new THREE.Vector3(0, 1, 0);

  let bestFace: FaceName = "+z";
  let bestDot = -Infinity;

  (Object.entries(FACE_VECTORS) as [FaceName, THREE.Vector3][]).forEach(
    ([face, localVec]) => {
      const worldVec = localVec.clone().applyQuaternion(quat);
      const dot = worldVec.dot(worldUp);
      if (dot > bestDot) {
        bestDot = dot;
        bestFace = face;
      }
    },
  );

  return { face: bestFace, dot: bestDot };
}

export function isShagaiOnkh(
  quat: THREE.Quaternion,
  minTipUpDot = 0.76,
): boolean {
  const { face, dot } = detectBestFace(quat);
  return (face === "+x" || face === "-x") && dot >= minTipUpDot;
}

/**
 * Оньс (хажуу тал дээш) — аль урт тал (+z эсвэл -z) илүү дээшилснийг шалгаж хонь/ямаа заана.
 */
export function resolveSheepGoatFromOnkh(quat: THREE.Quaternion): ShagaiSide {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const sheepTilt = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(quat)
    .dot(worldUp);
  const goatTilt = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(quat)
    .dot(worldUp);
  return sheepTilt >= goatTilt ? "sheep" : "goat";
}

export function detectShagaiFromQuaternion(
  quat: THREE.Quaternion,
  options: ShagaiDetectOptions = {},
): ShagaiSide {
  const { remapOnkh = true, randomOnkh = false } = options;
  const { face } = detectBestFace(quat);

  if (face === "+z") return "sheep";
  if (face === "-z") return "goat";

  if (face === "+x" || face === "-x") {
    if (remapOnkh) {
      if (randomOnkh) {
        return Math.random() < 0.5 ? "sheep" : "goat";
      }
      return resolveSheepGoatFromOnkh(quat);
    }
    return weightedTraditionalSide();
  }

  return FACE_TO_SIDE[face];
}

export function detectShagaiSideFromQuaternion(
  quat: THREE.Quaternion,
  options: ShagaiDetectOptions = {},
): ShagaiSide {
  return detectShagaiFromQuaternion(quat, options);
}

export function detectShagaiSide(rotX: number, rotZ: number): ShagaiSide {
  const euler = new THREE.Euler(rotX, 0, rotZ, "XYZ");
  const quat = new THREE.Quaternion().setFromEuler(euler);
  return detectShagaiSideFromQuaternion(quat);
}

export interface ThrowRecord {
  side: ShagaiSide;
  timestamp: Date;
  throwNumber: number;
}
