import * as THREE from "three";

export const SNAP_DISTANCE = 0.42;
export const SNAP_ANGLE_RAD = THREE.MathUtils.degToRad(10);

export type MeshPart = {
  size: [number, number, number];
  offset: [number, number, number];
};

export type PieceDef = {
  id: string;
  labelMn: string;
  labelEn: string;
  requires: string[];
  target: [number, number, number];
  targetRotY: number;
  size: [number, number, number];
  color: string;
  meshParts?: MeshPart[];
  snapXZOnly?: boolean;
};

export type PuzzleLevel = {
  id: string;
  titleMn: string;
  titleEn: string;
  snapDistance?: number;
  snapAngleRad?: number;
  pieces: PieceDef[];
};

export const LEVEL_ONE: PuzzleLevel = {
  id: "lvl1",
  titleMn: "Модон оньс",
  titleEn: "Wooden interlock",
  snapDistance: 0.34,
  snapAngleRad: THREE.MathUtils.degToRad(10),
  pieces: [
    {
      id: "A",
      labelMn: "Суурь (L)",
      labelEn: "Base (L)",
      requires: [],
      meshParts: [
        { size: [0.46, 0.26, 0.32], offset: [-0.08, 0, 0.06] },
        { size: [0.2, 0.26, 0.24], offset: [0.22, 0, -0.11] },
      ],
      target: [-0.38, 0.18, 0.06],
      targetRotY: 0,
      size: [0.56, 0.26, 0.34],
      color: "#9a7038",
    },
    {
      id: "B",
      labelMn: "Хажуу",
      labelEn: "Side",
      requires: ["A"],
      meshParts: [
        { size: [0.34, 0.24, 0.2], offset: [-0.04, 0, 0] },
        { size: [0.16, 0.2, 0.16], offset: [0.18, 0, 0.1] },
      ],
      target: [0.08, 0.18, -0.16],
      targetRotY: Math.PI / 10,
      size: [0.42, 0.24, 0.22],
      color: "#7a5830",
    },
    {
      id: "C",
      labelMn: "Давхар",
      labelEn: "Cap",
      requires: ["B"],
      meshParts: [
        { size: [0.26, 0.16, 0.2], offset: [0, 0, 0] },
        { size: [0.12, 0.12, 0.1], offset: [0.08, 0.1, 0.04] },
      ],
      target: [0.02, 0.41, 0.01],
      targetRotY: 0,
      size: [0.3, 0.22, 0.22],
      color: "#5c4328",
      snapXZOnly: true,
    },
    {
      id: "D",
      labelMn: "Дунд",
      labelEn: "Mid",
      requires: ["C"],
      target: [0.42, 0.18, 0.14],
      targetRotY: -Math.PI / 8,
      size: [0.4, 0.3, 0.26],
      color: "#6d5030",
    },
    {
      id: "E",
      labelMn: "Ард",
      labelEn: "Back",
      requires: ["D"],
      target: [0.2, 0.18, 0.3],
      targetRotY: Math.PI / 11,
      size: [0.38, 0.28, 0.26],
      color: "#5c4328",
    },
    {
      id: "F",
      labelMn: "Баруун",
      labelEn: "Right",
      requires: ["E"],
      target: [0.58, 0.18, -0.14],
      targetRotY: Math.PI / 7,
      size: [0.36, 0.26, 0.24],
      color: "#4d3820",
    },
    {
      id: "G",
      labelMn: "Түгжээ",
      labelEn: "Lock",
      requires: ["F"],
      target: [0.74, 0.18, 0.06],
      targetRotY: 0,
      size: [0.34, 0.24, 0.22],
      color: "#3d2e18",
    },
  ],
};

export const ALL_LEVELS: PuzzleLevel[] = [LEVEL_ONE];

export function randomScatterPosition(seed: number): [number, number, number] {
  const r = (s: number) => {
    const x = Math.sin(s * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const a = r(seed) * 2.6 - 1.3;
  const b = r(seed + 1) * 2.6 - 1.3;
  return [a, 0.18, b];
}

export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

export function getMeshParts(def: PieceDef): MeshPart[] {
  return def.meshParts ?? [{ size: def.size, offset: [0, 0, 0] }];
}

export function getDefFootprintRadius(def: PieceDef): number {
  const parts = getMeshParts(def);
  let maxR = 0.2;
  for (const p of parts) {
    const [sx, , sz] = p.size;
    const [ox, , oz] = p.offset;
    const r = Math.hypot(Math.abs(ox) + sx / 2, Math.abs(oz) + sz / 2);
    if (r > maxR) maxR = r;
  }
  return maxR;
}

export function getBoundsXZ(def: PieceDef): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  const parts = getMeshParts(def);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of parts) {
    const [sx, , sz] = p.size;
    const [ox, , oz] = p.offset;
    minX = Math.min(minX, ox - sx / 2);
    maxX = Math.max(maxX, ox + sx / 2);
    minZ = Math.min(minZ, oz - sz / 2);
    maxZ = Math.max(maxZ, oz + sz / 2);
  }
  return { minX, maxX, minZ, maxZ };
}
