export type KnockBurst = {
  lin: [number, number, number];
  ang: [number, number, number];
};

export function buildPairKnockBursts(
  fromId: number,
  toId: number,
  fromPos: [number, number, number],
  toPos: [number, number, number],
): Record<number, KnockBurst> {
  const dx = toPos[0] - fromPos[0];
  const dz = toPos[2] - fromPos[2];
  const len = Math.hypot(dx, dz) || 1;
  const nx = dx / len;
  const nz = dz / len;
  const push = 6.2;
  const lift = 3.4;
  const spin = 14;

  const out: Record<number, KnockBurst> = {};
  out[fromId] = {
    lin: [-nx * push, lift, -nz * push],
    ang: [-nz * spin, nx * 4 - nz * 3, nx * spin],
  };
  out[toId] = {
    lin: [nx * push * 0.95, lift * 0.75, nz * push * 0.95],
    ang: [nz * spin * 0.9, (nx - nz) * 5, -nx * spin * 0.9],
  };
  return out;
}
