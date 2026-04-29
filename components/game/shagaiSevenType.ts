import type { ShagaiSide } from "./shagaiTargetType";

export type SevenPhase =
  | "idle"
  | "winding_up"
  | "throwing"
  | "settling"
  | "picking"
  | "knock_settling"
  | "take_pick"
  | "won"
  | "lost";

export const SEVEN_COUNT = 7;

export const SEVEN_PATH_ANCHOR_EPS = 1.05;
export const SEVEN_PATH_OBSTACLE_R = 0.5;
export const SEVEN_PATH_MIN_POINTS = 3;

function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}

function segmentToPointDist2D(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  px: number,
  pz: number,
): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const ab2 = abx * abx + abz * abz;
  if (ab2 < 1e-10) return dist2(ax, az, px, pz);
  let t = (apx * abx + apz * abz) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cz = az + t * abz;
  return dist2(cx, cz, px, pz);
}

export function validateSevenPairPath(
  fromId: number,
  toId: number,
  pathXz: [number, number][],
  bonePositions: Record<number, [number, number, number] | undefined>,
  activeIds: number[],
): boolean {
  if (pathXz.length < SEVEN_PATH_MIN_POINTS) return false;
  const a = bonePositions[fromId];
  const b = bonePositions[toId];
  if (!a || !b) return false;
  const ax = a[0];
  const az = a[2];
  const bx = b[0];
  const bz = b[2];
  const first = pathXz[0]!;
  const last = pathXz[pathXz.length - 1]!;
  if (dist2(first[0], first[1], ax, az) > SEVEN_PATH_ANCHOR_EPS) return false;
  if (dist2(last[0], last[1], bx, bz) > SEVEN_PATH_ANCHOR_EPS) return false;

  const obstacles = activeIds.filter((id) => id !== fromId && id !== toId);
  const obsCenters: [number, number][] = [];
  for (const id of obstacles) {
    const p = bonePositions[id];
    if (!p) return false;
    obsCenters.push([p[0], p[2]]);
  }

  for (let k = 0; k < pathXz.length; k++) {
    const px = pathXz[k]![0];
    const pz = pathXz[k]![1];
    const nearA = dist2(px, pz, ax, az) < SEVEN_PATH_ANCHOR_EPS;
    const nearB = dist2(px, pz, bx, bz) < SEVEN_PATH_ANCHOR_EPS;
    if (nearA || nearB) continue;
    for (const [ox, oz] of obsCenters) {
      if (dist2(px, pz, ox, oz) < SEVEN_PATH_OBSTACLE_R) return false;
    }
  }

  for (let i = 0; i < pathXz.length - 1; i++) {
    const p0 = pathXz[i]!;
    const p1 = pathXz[i + 1]!;
    for (const [ox, oz] of obsCenters) {
      if (
        segmentToPointDist2D(p0[0], p0[1], p1[0], p1[1], ox, oz) <
        SEVEN_PATH_OBSTACLE_R
      ) {
        return false;
      }
    }
  }

  return true;
}

export function canFormAnyPair(
  activeIds: number[],
  sides: (ShagaiSide | null)[],
): boolean {
  const counts: Record<ShagaiSide, number> = {
    horse: 0,
    sheep: 0,
    goat: 0,
    camel: 0,
  };
  for (const id of activeIds) {
    const s = sides[id];
    if (s) counts[s]++;
  }
  return Object.values(counts).some((c) => c >= 2);
}

export function checkOutcomeAfterPair(
  activeIds: number[],
  sides: (ShagaiSide | null)[],
): "continue" | "win" | "lose" {
  if (activeIds.length === 0) return "win";
  if (activeIds.length <= 1) return "win";
  if (!canFormAnyPair(activeIds, sides)) return "lose";
  return "continue";
}
