/** Ньсрэх анимац — зурсан зам + эх/төгсгөлийн байрлал. */

export function buildPairAnimPathWorld(
  from: [number, number, number],
  pathXz: [number, number][],
  to: [number, number, number],
): [number, number, number][] {
  const y = from[1];
  const out: [number, number, number][] = [[from[0], y, from[2]]];
  for (const [x, z] of pathXz) {
    const last = out[out.length - 1]!;
    if (Math.hypot(x - last[0], z - last[2]) < 0.025) continue;
    out.push([x, y, z]);
  }
  const last = out[out.length - 1]!;
  if (Math.hypot(to[0] - last[0], to[2] - last[2]) > 0.04) {
    out.push([to[0], y, to[2]]);
  } else {
    out[out.length - 1] = [to[0], y, to[2]];
  }
  return out;
}

function cumulativeLengths3D(
  points: [number, number, number][],
): number[] {
  const lens: number[] = [0];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    acc += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    lens.push(acc);
  }
  return lens;
}

/** t ∈ [0,1] — нийт уртын дагуу интерполяци. */
export function samplePath3DAt(
  points: [number, number, number][],
  t: number,
): [number, number, number] {
  if (points.length === 0) return [0, 0, 0];
  if (points.length === 1) return points[0]!;
  const tClamped = Math.max(0, Math.min(1, t));
  const lens = cumulativeLengths3D(points);
  const total = lens[lens.length - 1]!;
  if (total < 1e-6) return points[points.length - 1]!;
  const target = tClamped * total;
  for (let i = 1; i < lens.length; i++) {
    if (target <= lens[i]!) {
      const seg = lens[i]! - lens[i - 1]!;
      const u = seg > 1e-6 ? (target - lens[i - 1]!) / seg : 1;
      const p0 = points[i - 1]!;
      const p1 = points[i]!;
      return [
        p0[0] + u * (p1[0] - p0[0]),
        p0[1] + u * (p1[1] - p0[1]),
        p0[2] + u * (p1[2] - p0[2]),
      ];
    }
  }
  return points[points.length - 1]!;
}

export function smoothStep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
