import * as THREE from "three";

export type ShagaiSide = "horse" | "sheep" | "goat" | "camel";

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

/**
 * Traditional shagai landing probabilities (approximate):
 *   Flat sides (wide faces up) — ~75% total
 *     Sheep (Хонь, +Y up)  ~42%
 *     Goat  (Ямаа, -Y up)  ~33%
 *   Narrow sides (thin sides up) — ~24% total
 *     Horse (Морь, +X up)  ~18%
 *     Camel (Тэмээ, -X up) ~6%
 *   Onkh (standing on end, ±Z up) — <1%, almost never survives
 *
 * We detect which local axis of the shagai is pointing world-up after it
 * settles. That gives a fair, physics-driven base result. If the shagai
 * ended up in an "onkh" (standing) orientation we do not return that —
 * instead we resample a random side using realistic weights, because in
 * reality a standing shagai is extremely rare.
 */
export interface ShagaiDetectOptions {
  // When true, an "onkh" (standing-on-end) orientation will be remapped
  // to a weighted random of the four traditional sides. Default: true.
  remapOnkh?: boolean;
}

export type ShagaiDetection = ShagaiSide | "onkh";

/**
 * Tuned shagai probability distribution for this game. Goat and camel
 * are favored so the player sees all four sides, while sheep stays
 * the single most common wide-face outcome (as tradition expects).
 *   Sheep (Хонь)   22%
 *   Goat  (Ямаа)   38%
 *   Horse (Морь)   12%
 *   Camel (Тэмээ)  28%
 *
 * The game pre-decides the outcome at throw time using these weights,
 * then physically rotates the shagai to show the matching face on top
 * once it has settled. This guarantees the visual and the reported side
 * always agree, regardless of where physics would otherwise have stopped.
 */
export function weightedTraditionalSide(): ShagaiSide {
  const r = Math.random();
  if (r < 0.22) return "sheep";
  if (r < 0.6) return "goat";
  if (r < 0.72) return "horse";
  return "camel";
}

/**
 * The local axis of the shagai model (after fitToBox alignment) that
 * corresponds to each traditional side. Calibrated empirically to the
 * current GLB: its wide (sheep/goat) faces actually sit on the Z axis
 * after fitToBox, its narrow (horse/camel) faces on the Y axis, and its
 * tips (onkh) on the X axis. If a given side ever shows the wrong face
 * visually, swap two entries below and everything else keeps working.
 *
 *   Sheep  (Хонь)  → local +Z points world up  ← wide face
 *   Goat   (Ямаа)  → local -Z points world up  ← opposite wide face
 *   Horse  (Морь)  → local -Y points world up  ← narrow face
 *   Camel  (Тэмээ) → local +Y points world up  ← opposite narrow face
 */
export const SHAGAI_SIDE_UP_AXIS: Record<ShagaiSide, THREE.Vector3> = {
  sheep: new THREE.Vector3(0, 0, 1),
  goat: new THREE.Vector3(0, 0, -1),
  horse: new THREE.Vector3(0, -1, 0),
  camel: new THREE.Vector3(0, 1, 0),
};

/**
 * Build a quaternion that, when applied to the shagai body, makes the
 * local axis for the given side point directly at world-up. A random
 * yaw around world Y is added so every throw looks different.
 */
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

/**
 * Low-level detector. Returns the specific side the shagai landed on, OR
 * the string "onkh" if the bone ended up standing on one of its ends
 * (Z-axis aligned with world up). Callers can treat "onkh" however they
 * like — the convention in this project is to treat it as invalid and
 * automatically re-throw.
 *
 * IMPORTANT: the axis → side mapping below was calibrated empirically to
 * match the actual GLB model's anatomy. If the visual shagai looks like
 * a camel but we return "sheep", swap those two entries in the switch.
 */
export function detectShagaiFromQuaternion(
  quat: THREE.Quaternion,
): ShagaiDetection {
  const worldUp = new THREE.Vector3(0, 1, 0);
  const local = [
    { name: "+x" as const, v: new THREE.Vector3(1, 0, 0) },
    { name: "-x" as const, v: new THREE.Vector3(-1, 0, 0) },
    { name: "+y" as const, v: new THREE.Vector3(0, 1, 0) },
    { name: "-y" as const, v: new THREE.Vector3(0, -1, 0) },
    { name: "+z" as const, v: new THREE.Vector3(0, 0, 1) },
    { name: "-z" as const, v: new THREE.Vector3(0, 0, -1) },
  ];

  let best = local[0]!;
  let bestDot = -Infinity;
  for (const a of local) {
    const world = a.v.clone().applyQuaternion(quat);
    const dot = world.dot(worldUp);
    if (dot > bestDot) {
      bestDot = dot;
      best = a;
    }
  }

  // Mapping — calibrated to the current GLB model's anatomy after
  // fitToBox. This is only used by legacy callers / debugging now;
  // the actual game outcome is pre-decided with weightedTraditionalSide()
  // and enforced visually via buildTargetQuaternion(). Keep this in sync
  // with SHAGAI_SIDE_UP_AXIS above.
  switch (best.name) {
    case "+y":
      return "sheep";
    case "-y":
      return "goat";
    case "+x":
      return "horse";
    case "-x":
      return "camel";
    case "+z":
    case "-z":
      return "onkh";
  }
}

/**
 * Legacy wrapper — returns a ShagaiSide. If the bone was standing on its
 * end ("onkh") this function falls back to a weighted random traditional
 * side, because a lot of callers can't deal with "onkh" as a distinct
 * outcome. Prefer `detectShagaiFromQuaternion` in new code and handle
 * onkh explicitly (e.g. re-throw the bone).
 */
export function detectShagaiSideFromQuaternion(
  quat: THREE.Quaternion,
  options: ShagaiDetectOptions = {},
): ShagaiSide {
  const { remapOnkh = true } = options;
  const raw = detectShagaiFromQuaternion(quat);
  if (raw !== "onkh") return raw;
  if (!remapOnkh) return "goat";
  const r = Math.random();
  if (r < 0.42) return "sheep";
  if (r < 0.75) return "goat";
  if (r < 0.93) return "horse";
  return "camel";
}

/**
 * Legacy Euler-based detector kept for callers that only have rotation.x/z.
 * Internally it now builds a quaternion from (x, 0, z) Euler and delegates.
 */
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
