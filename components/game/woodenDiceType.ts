import { mulberry32 } from "./fourPowersType";

export const ROUNDS_TO_WIN = 5;

export function rollD6(rng: () => number): number {
  return Math.min(6, Math.floor(rng() * 6) + 1);
}

export function rollTriple(
  rng: () => number,
): [number, number, number] {
  let t: [number, number, number] = [rollD6(rng), rollD6(rng), rollD6(rng)];
  // Keep triples possible, but noticeably rarer for better variety.
  if (t[0] === t[1] && t[1] === t[2] && rng() < 0.8) {
    const idx = Math.floor(rng() * 3) as 0 | 1 | 2;
    let next = rollD6(rng);
    if (next === t[idx]) {
      next = ((next % 6) + 1) as number;
    }
    t = [...t] as [number, number, number];
    t[idx] = next;
  }
  return t;
}

export function sum3(t: [number, number, number]): number {
  return t[0] + t[1] + t[2];
}

export function makeRng(seed: number, round: number, salt: number) {
  return mulberry32(seed + round * 19_999 + salt * 127);
}
